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
    def __getitem__(self, key):
        print('HI???')
        if not key.endswith('.py'):
            key = key + '.py'
        # Yes, we're doing this :)
        try:
            mod = il.import_module('generators.' + key)
        except Exception as e:
            print(f'Error, could not import generators.{key}:', e)
            return GeneratorErrorWrapper(e)
        try:
            c = mod.Generator()
        except Exception as e:
            print(f'Error, could not create generators.{key}:', e)
            return GeneratorErrorWrapper(e)
        return c