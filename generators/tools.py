from .generator import Generator as MainGenerator
import dhtml


class HtmlStringGenerator():
    def __init__(self, to_insert, key_prefix='$'):
        self.toi = to_insert
        self.prefix = key_prefix

    def __getitem__(self, html_entry):
        l = []
        for i in self.toi:
            s = html_entry
            for k, v in i.items():
                s = s.replace(self.prefix + k, v)
            l.append(s)
        return '\n'.join(l)


def url_from_html_path(p):
    if p.strip('/') == '.':
        return "https://desktopfolder.github.io"
    return "https://desktopfolder.github.io" + '/' + p


def get_html_urls():
    import os
    from pathlib import Path
    l = []
    here = os.path.relpath(os.path.dirname(__file__)) + '/../'
    w = dhtml.Website(here)
    for dhtml_page in w.files:
        dhtml_p = dhtml_page.filename
        fn = dhtml_page.dest_path

        pl = Path(fn)

        t = fn.replace('-', ' ').title()
        # if not os.path.isfile(dhtml_p):
        #    print('get_html_urls warning: Could not find', dhtml_p, 'so default title being used.')
        # else:
#                import importlib as il
#                import sys
#                sys.path.append(os.path.join(sys.path[0], '..'))
#                import dhtml
#                #sys.path.append('..')
#                #headers = il.import_module('.dhtml.py').parse_dhtml_headers(p)
        t = dhtml_page.meta.get('page-title', t)

        print(fn)
        l.append({"url": url_from_html_path(fn if pl.name !=
                 "index.html" else str(pl.parent)), "name": t})

    return l


class Generator(MainGenerator):
    def html_pages(self):
        return HtmlStringGenerator(get_html_urls())
