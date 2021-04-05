class Generator:
    def __getitem__(self, key):
        getattr(self, key.replace('-', '_'))()