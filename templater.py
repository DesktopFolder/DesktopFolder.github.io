#!/usr/bin/env python3

"""
Extremely basic Python script for templating HTML.
"""

import os, re
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
    t = lambda b: b in bools and bools[b]
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

def get_meta_and_data(filename):
    # Read in the file.
    data = open(filename, 'r').read()
    page_content = None
    meta = {}
    if data.lstrip().startswith('---'):
        _, header, data = data.split('---', 2)
        kvs = [x.strip() for x in header.split('\n')]
        for kv in kvs:
            if kv.strip() == '':
                continue
            key_value = [x.strip() for x in kv.split('=', 1)]
            if len(key_value) < 2:
                print(f'Warning: Invalid key/value pair found in {filename}: {kv}')
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
    return meta, data

def gen_file(w: dhtml.Website, p: dhtml.Page):
    print(f'Info: Generating {p.dest_path} from {p.filename} with template {p.template}')
    bools = ["show-card"]
    defaults = {
        "page-title": os.path.basename(p.filename).rsplit('.', 1)[0].replace('-', ' ').title(),
        "website-title": 'DesktopFolder',
        "page-description": 'Another incredible webpage!',
        "path-css-common": ('../' * (len(p.filename.split('/')) - 1)) + 'styles.css',
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
        page_content = re.sub(r'\|((\d\d?):(\d\d?))\|', lambda x: f'<a href="{defaults["timestamp_url"]}&t={x.group(2)}m{x.group(3)}s">{x.group(1)}</a>', page_content)
    defaults['content'] = page_content
    template = open(p.template, 'r').read()
    with open(p.dest_path, 'w') as file:
        # print(template)
        # print(defaults)
        file.write(run_booleans(template.format(**defaults), defaults))


# page linking goal
# something like {page-link[videos/etc]}
# which then gets backfilled later
# maybe pages can have names as well?
# dual-pass: gather metadata for filling in on second pass?

def main(log):
    here = os.path.relpath(os.path.dirname(__file__)) + '/'
    log(f'Started templater. Location of website file: {here}')
    w = dhtml.Website(here)
    for f in w.files:
        gen_file(w, f)

if __name__ == "__main__":
    import sys
    args = [a.strip('-') for a in sys.argv[1:]]
    main(print if 'verbose' in args else noop)
