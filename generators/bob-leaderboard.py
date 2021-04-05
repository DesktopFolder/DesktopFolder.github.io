from .generator import Generator as MainGenerator

runs_str = """<div class="run"><a href="{url}">{time} by {name}</a></div>"""

class Generator(MainGenerator):
    def existing_runs(self):
        # Get all the existing runs. Chop chop!
        return '\n'.join([runs_str.format(url=u, time=t, name=n) for (t, u, n) in [ln.strip().split(' ') for ln in open('data/bob-runs.txt', 'r').readlines()]])