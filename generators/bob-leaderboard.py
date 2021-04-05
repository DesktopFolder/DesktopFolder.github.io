from .generator import Generator as MainGenerator

runs_str = """<div class="run">{num} <a href="{url}">{time} by {name}</a> {verified}</div>"""

def to_secs(lst):
    t = lst[0]
    m, s = t.split(':')
    return (int(m) * 60) + int(s)

def is_verified(i):
    # i is the run id, but we're not verifying runs yet.
    # so... lol
    return "Unverified"

class Generator(MainGenerator):
    def existing_runs(self):
        # Get all the existing runs. Chop chop!
        return '\n'.join([runs_str.format(num=itr + 1, url=u, time=t, name=n, verified=is_verified(i)) for (itr, (t, u, n, i)) in enumerate(sorted([ln.strip().split(' ') for ln in open('data/bob-runs.txt', 'r').readlines() if len(ln) > 4], key=to_secs))])