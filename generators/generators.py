import importlib as il


class GeneratorErrorWrapper:
    def __init__(self, e):
        self.err = e

    def __str__(self):
        return ''

    def __getitem__(self, key):
        print(f'Ignoring [{key}] as it is an index into preexisting error.')
        return self


class Generators:
    def __init__(self):
        self.website = None

    def use_website(self, w):
        self.website = w

    def __getitem__(self, key):
        # Yes, we're doing this :)
        try:
            mod = il.import_module('generators.' + key)
        except Exception as e:
            print(f'Error, could not import generators.{key}:', e)
            return GeneratorErrorWrapper(e)
        try:
            c = mod.Generator(self.website)
        except Exception as e:
            print(f'Error, could not create generators.{key}:', e)
            return GeneratorErrorWrapper(e)
        return c
