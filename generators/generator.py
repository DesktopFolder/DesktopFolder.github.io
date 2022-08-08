class Generator:
    def __init__(self, website):
        self.website = website

    def __getitem__(self, key):
        return getattr(self, key.replace('-', '_'))()
