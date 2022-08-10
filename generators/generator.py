class Generator:
    def __init__(self, website):
        self.website = website

    def __getitem__(self, key):
        l = key.split('@')
        fn, args = l[0], l[1:]
        return getattr(self, fn.replace('-', '_'))(*args)
