def fixup_markdown(text: str):
    lz = text.splitlines(keepends=True)
    out = []
    for line in lz:
        if '<code>' in line and '</code>' not in line:
            line = line.replace('<code>', '<code style="display: block; white-space: pre-wrap;">')
        out.append(line)
    return ''.join(out)

class Generator():
    def __init__(self, website):
        self.website = website

    def __getitem__(self, key):
        print(f'Markdown Generator loading markdown from: {key}')
        try:
            import markdown
            d = open(key, 'r').read()
        except Exception as e:
            print(e)
            return ''

        return fixup_markdown(markdown.markdown(d))
