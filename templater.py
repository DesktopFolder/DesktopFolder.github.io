#!/usr/bin/env python3

"""
Extremely basic Python script for templating HTML.
"""

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
        if data.lstrip().startswith('---'):
            _, header, data = data.split('---', 2)
            kvs = [x.strip() for x in header.split('\n')]
            for kv in kvs:
                key_value = [x.strip().lower() for x in kv.split('=', 1)]
                if len(key_value) < 2:
                    print(f'Warning: Invalid key/value pair found in {filename}: {kv}')
                    continue
                key, value = key_value
                if key == 'out':
                    dest_filename = value
                elif key == 'src':
                    template = value
                else:
                    lookup[key] = value
        print(f'Info: Generating {dest_filename} from {filename} with template {template}')
        defaults = {
            "page.title": filename.rsplit('.', 1)[0].replace('-', ' ').title(),
            "website.title": 'DesktopFolder',
            "page.description": 'Another incredible webpage!',
            "path.css.common": 'styles.css'
            "content": data
        }
        omerge(defaults, lookup)
        with open(template, 'r') as file:
            template = file.read()
        with open(dest_filename, 'w') as file:
            file.write(template.format(**defaults))


def main():
    get_file('feinberg-run.dhtml')

if __name__ == "__main__":
    main()