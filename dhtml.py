def parse_dhtml_header(filename):
    import os
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
    return lookup
