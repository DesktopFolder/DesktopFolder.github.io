#!/usr/bin/env python3

"""
Extremely basic Python script for templating HTML.
"""

import os, re
from generators.generators import Generators

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

def gen_file(filename):
    if not os.path.isfile(filename):
        raise FileNotFoundError(f'Could not find {filename} - ensure this is a valid source file.')
    with open(filename, 'r') as file:
        data = file.read() # This is pretty inefficient. But, we do it anyways.
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
        print(f'Info: Generating {dest_filename} from {filename} with template {template}')
        bools = ["show-card"]
        defaults = {
            "page-title": filename.rsplit('.', 1)[0].replace('-', ' ').title(),
            "website-title": 'DesktopFolder',
            "page-description": 'Another incredible webpage!',
            "path-css-common": ('../' * (len(filename.split('/')) - 1)) + 'styles.css',
            "generators": gens,
            "page-image": "https://publicdomainvectors.org/photos/rodentia-icons_folder-black.png",
            "show-card": "false",
            "css-extras": "",
        }
        after = {
            "css-extras": css,
        }
        omerge(defaults, lookup)
        for b in bools:
            if b in defaults:
                defaults[b] = defaults[b].lower() == "true"
        for d in defaults:
            if d in after:
                defaults[d] = after[d](defaults[d])

        if page_content is None:
            page_content = data
        page_content = oh_yes(oh_no(page_content).format(**defaults))
        if 'timestamp_url' in defaults:
            page_content = re.sub(r'\|((\d\d?):(\d\d?))\|', lambda x: f'<a href="{defaults["timestamp_url"]}&t={x.group(2)}m{x.group(3)}s">{x.group(1)}</a>', page_content)
        defaults['content'] = page_content
        with open(template, 'r') as file:
            template = file.read()
        with open(dest_filename, 'w') as file:
            # print(template)
            # print(defaults)
            file.write(run_booleans(template.format(**defaults), defaults))


def files():
    return ['feinberg-on-a-run.dhtml',
            'bob-leaderboard.dhtml',
            'videos/piston-bedrock-breaking/explanation.dhtml',
            'videos/3way-users-guide/index.dhtml',
            'videos/3way-users-guide/guide.dhtml',
            'resources/bedrock-breaking.dhtml',
            'tools/piston.dhtml',
            'tools/dc.dhtml',
            'discord/index.dhtml',
            'discord/light.dhtml']


def main():
    [gen_file(f) for f in files() + ['index.dhtml']]

if __name__ == "__main__":
    main()
