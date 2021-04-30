class Generator():
    def __getitem__(self, key):
        print(f'Markdown Generator loading markdown from: {key}')
        try:
            import markdown
            d = open(key, 'r').read()
        except Exception as e:
            print(e)
            return ''

        return markdown.markdown(d)
