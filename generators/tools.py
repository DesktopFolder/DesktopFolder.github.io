from .generator import Generator as MainGenerator


class HtmlStringGenerator():
    def __init__(self, to_insert, key_prefix = '$'):
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
    return "https://desktopfolder.github.io/" + p

def get_html_urls():
    import os
    l = []
    for root, dirnames, filenames in os.walk('.', topdown=True):
        ex = ['.git', '.env', '__pycache__', 'templates']
        dirnames[:] = [d for d in dirnames if d not in ex]
        print(root)
        for fn in filenames:
            if fn.endswith('.html'):
                p = os.path.join(root, fn)
                t = fn.replace('-', ' ').title()
                try:
                    import importlib as il
                    import sys
                    sys.path.append(os.path.join(sys.path[0], '..'))
                    import dhtml
                    #sys.path.append('..')
                    #headers = il.import_module('.dhtml.py').parse_dhtml_headers(p)
                    headers = dhtml.parse_dhtml_header(p[:-4] + 'dhtml')
                    if 'page-title' in headers:
                        t = headers['page-title']
                except Exception as e:
                    print('get_html_urls error:', e)

                l.append({"url": p, "name": t})

    return l

class Generator(MainGenerator):
    def html_pages(self):
        return HtmlStringGenerator(get_html_urls())
