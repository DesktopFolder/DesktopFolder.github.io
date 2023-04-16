#!/usr/bin/env python3

"""
Extremely basic Python script for templating HTML.
"""

import os
import re
from generators.generators import Generators
import dhtml


def noop(*args, **kwargs):
    pass


gens = Generators()

show_cards = """
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:image" content="{}"
</head>
"""


def css(l):
    if len(l) == 0:
        return ''
    return f'<link rel="stylesheet" href="{l}">'


def run_booleans(txt, bools):
    def t(b): return b in bools and bools[b]
    if t("show-cards"):
        txt = txt.replace("</head>", show_cards.format(bools["page-image"]), 1)
    return txt


def oh_no(s):
    return s.replace(r'{{', r'%%AXL').replace(r'}}', r'%%AXR').replace(r'{', r'%%NORML').replace(r'}', r'%%NORMR').replace(r'%%AXL', r'{').replace(r'%%AXR', r'}')


def oh_yes(s):
    return s.replace(r'%%NORML', r'{').replace(r'%%NORMR', r'}')


def omerge(into, outof):
    for k, v in outof.items():
        into[k] = v


def gen_file(w: dhtml.Website, p: dhtml.Page, verbose=noop):
    print(
        f'Info: Generating {p.dest_path} from {p.filename} with template {p.template}')
    bools = ["show-card"]
    root_offset_n = 1
    if w.destination_dir.strip('/') == 'docs':
        root_offset_n = 2
    root_offset = '../' * (len(p.dest_path.split('/')) - root_offset_n)
    defaults = {
        "page-title": os.path.basename(p.filename).rsplit('.', 1)[0].replace('-', ' ').title(),
        "website-title": 'Desktop\'s Website',
        "page-description": 'Another incredible webpage!',
        "path-css-common": (root_offset) + 'styles.css',
        "generators": gens,
        "page-image": "https://publicdomainvectors.org/photos/rodentia-icons_folder-black.png",
        "show-card": "false",
        "css-extras": "",
    }
    after = {
        "css-extras": css,
    }
    omerge(defaults, p.meta)
    for b in bools:
        if b in defaults:
            defaults[b] = defaults[b].lower() == "true"
    for d in defaults:
        if d in after:
            defaults[d] = after[d](defaults[d])

    page_content = oh_yes(oh_no(p.data).format(**defaults))
    if 'timestamp_url' in defaults:
        page_content = re.sub(
            r'\|((\d\d?):(\d\d?))\|', lambda x: f'<a href="{defaults["timestamp_url"]}&t={x.group(2)}m{x.group(3)}s">{x.group(1)}</a>', page_content)
    defaults['content'] = page_content
    template = open(p.template, 'r').read()
    from pathlib import Path
    output_file = Path(p.dest_path)
    output_file.parent.mkdir(exist_ok=True, parents=True)
    output_data = run_booleans(template.format(**defaults), defaults)
    with open(output_file, 'w') as file:
        # print(template)
        # print(defaults)
        file.write(output_data)

    if p.fdest is not None:
        fdo = Path(dhtml.normpath(Path('docs/' + p.fdest + '/' + 'index.html')))
        fdo.parent.mkdir(exist_ok=True, parents=True)
        open(fdo, 'w').write(output_data)

    # This has written our actual file. But we might have to generate redirects
    # to this page. Recursively generate those redirects while we have info.
    for redirect_source in p.redirect_sources:
        noop(f'Generating {redirect_source} redirect page for {p.rel_url}')


# page linking goal
# something like {page-link[videos/etc]}
# which then gets backfilled later
# maybe pages can have names as well?
# dual-pass: gather metadata for filling in on second pass?

def main(log):
    here = os.path.relpath(os.path.dirname(__file__)) + '/'
    log(f'Started templater. Location of website file: {here}')
    w = dhtml.Website(here)
    gens.use_website(w)
    for f in w.files:
        gen_file(w, f)

    if w.destination_dir.strip('/') != '.':
        log(f'Cloning styles...')
        from pathlib import Path
        import shutil
        dest_path = Path(w.destination_dir)
        paths = [Path(s) for s in w.assets]

        for p in paths:
            if p.is_dir():
                shutil.copytree(p, os.path.join(dest_path, p.name), dirs_exist_ok=True,
                                ignore=shutil.ignore_patterns('.gitignore'))
            else:
                shutil.copy(p, dest_path)

        # Just straight up copy our entire JS environment into js/
        shutil.copytree('./js', os.path.join(dest_path, 'js/'), dirs_exist_ok=True,
                        ignore=shutil.ignore_patterns('.gitignore'))


if __name__ == "__main__":
    import sys
    args = [a.strip('-') for a in sys.argv[1:]]
    main(print if 'verbose' in args else noop)
