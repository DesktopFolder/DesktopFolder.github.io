from os.path import join, isfile, normpath, basename


def parse_dhtml(filename):
    # Read in the file.
    data = open(filename, 'r').read()
    meta = {}
    if data.lstrip().startswith('---'):
        _, header, data = data.split('---', 2)
        kvs = [x.strip() for x in header.split('\n')]
        for kv in kvs:
            if kv.strip() == '':
                continue
            key_value = [x.strip() for x in kv.split('=', 1)]
            if len(key_value) < 2:
                print(
                    f'Warning: Invalid key/value pair found in {filename}: {kv}')
                continue
            key, value = key_value
            key = key.lower()
            if key == 'out':
                meta['page-outfile'] = value
            elif key == 'src':
                # Should we rename these to `meta.`? eh
                meta['page-template'] = value
            elif key == 'content':
                # Also legacy / deprecated
                meta['page-content'] = value
            else:
                meta[key.replace('.', '-')] = value
    return meta, data


def to_html(filename: str):
    return filename.rsplit('.', 1)[0] + '.html'


def ensure_html(filename: str):
    if filename.endswith('.html'):
        return filename
    if filename.endswith('.dhtml'):
        return to_html(filename)
    return filename + '.html'


def omerge(into, outof):
    for k, v in outof.items():
        into[k] = v


def normalize_filename(fn):
    # while fn.startswith('./'):
    #    fn = fn.removeprefix('./')
    # import re # yes, I know
    #fn = re.suball(r'[^/]+/\.\.', '', fn)
    return normpath(fn)


class Page:
    def __init__(self, filename, dest):
        if not isfile(filename):
            raise FileNotFoundError(f'{filename} does not exist.')
        # e.g. SomeVideo.html
        self.meta, self.data = parse_dhtml(filename)
        dest_prenorm = join(self.meta.get('page.outfile', './'), dest)
        self.dest_path = normalize_filename(dest_prenorm)
        if self.dest_path.startswith('/'):
            of = self.meta.get('page.outfile', 'undefined')
            raise RuntimeError(
                f'Got root path for Page destination. (outfile: {of}, dest: {self.dest_path}, pre normalization: {dest_prenorm}, pre join: {dest})')
        self.filename = filename
        self.template = self.meta.get('page.template', 'templates/generic.html')
        self.data = self.meta.get('page.content', self.data)
        self.redirect_sources = [ensure_html(
            x) for x in self.meta.get('redirects', '').split(',')]
        self.rel_url = self.dest_path

    def page_name(self):
        # Get a pretty name for the page
        alt = basename(self.dest_path).replace('-', ' ').title()
        return self.meta.get('page.title', alt)

    def class_name(self):
        return self.meta.get('class', None)

    def __repr__(self):
        import json
        # Does not print metadata as that gets really annoying
        return f'<Page: Destination Path={self.dest_path}; Filename={self.filename}; Template={self.template}>'


class Website:
    default_website = """
{
    "source-directories": [ "./" ],
    "source-files": [ ],
    "destination-directory": ".",
    "assets": []
}
"""

    def __init__(self, directory="./"):
        import json
        # Try to load website definition file
        self.website_file = join(directory, '.website')
        self.website = json.loads(Website.default_website)
        if isfile(self.website_file):
            self.from_file = True
            omerge(self.website, json.loads(
                open(self.website_file, 'r').read()))

        # Load our relative directories.
        self.source_dirs = [normalize_filename(join(directory, d))
                            for d in self.website['source-directories']]
        self.source_files = [normalize_filename(join(directory, f))
                             for f in self.website['source-files']]
        self.destination_dir = normalize_filename(join(
            directory, self.website['destination-directory']))
        self.assets = [normalize_filename(
            join(directory, d)) for d in self.website['assets']]
        self.files = list()
        self.src_filenames = list()

        # Now we need to figure out our files.
        self.populate_files()

    def source_dir_for(self, filename: str):
        filename = normalize_filename(filename)
        for d in self.source_dirs:
            if not d.endswith('/'):
                d = d + '/'
            if filename.startswith(d):
                return d
        return None

    def source_dir_split(self, filename: str):
        filename = normalize_filename(filename)
        sd = self.source_dir_for(filename)
        if sd is not None:
            return (sd, filename.removeprefix(sd).lstrip('/'))
        return (None, filename)

    def map_file(self, filename: str):
        filename = normalize_filename(filename)
        _, fn = self.source_dir_split(filename)
        return join(self.destination_dir, to_html(fn))

    def populate_files(self):
        # Files are mapped from src/dir/some/dir/file -> dest/dir/some/dir/file
        import pathlib
        for src in self.source_dirs:
            self.src_filenames.extend(
                [str(x) for x in pathlib.Path(src).glob('**/*.dhtml')])

        for src in self.src_filenames:
            self.files.append(Page(src, self.map_file(src)))

    def __repr__(self):
        import json
        lf = " (Loaded from file)" if self.from_file else ""
        dmp = json.dumps(self.website)
        return f'<Website{lf}: {dmp}>'


# Deprecated.
def parse_dhtml_header(filename):
    if not isfile(filename):
        raise FileNotFoundError(
            f'Could not find {filename} - ensure this is a valid source file.')
    with open(filename, 'r') as file:
        data = file.read()  # This is pretty inefficient. But, we do it anyways.
        dest_filename = filename.rsplit('.', 1)[0] + '.html'
        template = 'templates/generic.html'
        lookup = {}
        page_content = None
        if data.lstrip().startswith('---'):
            _, header, data = data.split('---', 2)
            kvs = [x.strip() for x in header.split('\n')]
            for kv in kvs:
                if kv.strip() == '':
                    continue
                key_value = [x.strip() for x in kv.split('=', 1)]
                if len(key_value) < 2:
                    print(
                        f'Warning: Invalid key/value pair found in {filename}: {kv}')
                    continue
                key, value = key_value
                key = key.lower()
                if key == 'out':
                    dest_filename = value
                elif key == 'src':
                    template = value
                elif key == 'content':
                    page_content = value
                else:
                    lookup[key.replace('.', '-')] = value
    return lookup
