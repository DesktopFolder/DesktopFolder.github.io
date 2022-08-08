def MakeError(param: str):
    return f'<!--Error (Args: {param}) (string generator)-->'


def MakeLogos(logo_strings: str):
    def logo_gen(href: str, img: str):
        return f'<a class="logo-link" href="{href}" target="_blank" rel="noopener noreferrer"><img src="{img}" style="max-height:1em;" /></a>'
    logos = {"github": logo_gen('https://github.com/DesktopFolder/desktopfolder.github.io',
                                'assets/GitHub-Mark-120px-plus.png'),
             "youtube": logo_gen('https://www.youtube.com/c/desktopfolder', 'assets/yt_icon_rgb.png')}
    return '\n'.join([logos.get(s, f'<!--No logo for: {s}-->') for s in logo_strings.split(',')])


class Generator():
    string_gens = {
        'logos': MakeLogos
    }

    def __init__(self, website):
        self.website = website

    def __getitem__(self, key):
        lookup, args = key.split(':', maxsplit=1)
        return Generator.string_gens.get(lookup, MakeError)(args)

    def __str__(self):
        return "<!--Unqueried Generator Object-->"
