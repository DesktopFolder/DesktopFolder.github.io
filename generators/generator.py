class Generator:
    def __getitem__(self, key):
        return getattr(self, key.replace('-', '_'))()
