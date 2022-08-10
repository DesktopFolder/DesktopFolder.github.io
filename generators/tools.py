from .generator import Generator as MainGenerator
import dhtml


class HtmlStringGenerator():
    def __init__(self, to_insert, key_prefix='$'):
        self.toi = to_insert
        self.prefix = key_prefix

    def __getitem__(self, html_template):
        lines = []
        # html_template = ""
        # we want to replace keys/values in html_template
        # to generate 1 instance
        # html_template might have associativeness though
        # { "key" : "value" } is normally the case
        # but we can also have { "sublist" : [ "key" : "value ] }
        # what do we name the sublist?
        # we should maybe also have ordering? not sure though
        # oh yeah, we need to have the pinned one first.
        # that's all done by what passes us toi, though
        # maybe we just call it associated
        templates = html_template.split('|', 2)
        main_template = templates[0]
        assoc_template = templates[1] if len(templates) == 3 else None
        end_template = templates[2] if len(templates) == 3 else None
        # this ^ should probably use variable insertion instead
        # but whatever
        for i in self.toi:
            # i = dict()
            s = main_template
            # s is template string
            for k, v in i.items():
                if k != "associated":
                    s = s.replace(self.prefix + k, v)
                else:
                    if assoc_template is None:
                        raise RuntimeError(
                            f'{html_template} has no associated template.')
                    for assoc_page_info in v:
                        assoc_t = assoc_template
                        for ak, av in assoc_page_info.items():
                            assoc_t = assoc_t.replace(self.prefix + ak, av)
                        s += assoc_t + '\n'
            if "associated" in i:
                s += end_template
            lines.append(s)

        return '\n'.join(lines)


def url_from_html_path(p):
    p = p.removeprefix('docs/')
    if p.strip('/') in ['.', 'docs']:
        return "https://desktopfolder.github.io"
    return "https://desktopfolder.github.io" + '/' + p


def rel_url_from_html_path(p):
    p = p.removeprefix('/')
    p = p.removeprefix('docs/')
    if p.strip('/') in ['.', 'docs', '']:
        return '/'
    return '/' + p


def get_html_urls():
    import os
    from pathlib import Path
    l = []
    here = os.path.relpath(os.path.dirname(__file__)) + '/../'
    w = dhtml.Website(here)
    for dhtml_page in w.files:
        dhtml_p = dhtml_page.filename
        fn = dhtml_page.dest_path

        pl = Path(fn)

        t = fn.replace('-', ' ').title()
        # if not os.path.isfile(dhtml_p):
        #    print('get_html_urls warning: Could not find', dhtml_p, 'so default title being used.')
        # else:
#                import importlib as il
#                import sys
#                sys.path.append(os.path.join(sys.path[0], '..'))
#                import dhtml
#                #sys.path.append('..')
#                #headers = il.import_module('.dhtml.py').parse_dhtml_headers(p)
        t = dhtml_page.meta.get('page-title', t)

        l.append({"page:url": url_from_html_path(fn if pl.name !=
                                                 "index.html" else str(pl.parent)), "page:name": t})

    return l


def get_video_urls(w: dhtml.Website):
    import os
    from pathlib import Path
    video_urls = {}
    for page in w.files:
        cls = page.class_name()
        if cls is not None and cls != "video":
            continue
        if 'video' not in page.meta:
            continue
        video_id = page.meta['video']
        video_name = page.meta.get("video-name", None)
        pinned = page.meta.get('pinned', '') == 'true'
        # Get the page info. This is associated data.
        page_name = page.page_name()
        page_path = '/' + page.dest_path.removesuffix('/index.html')
        page_priority = int(page.meta.get('page-priority', 100))
        video_priority = int(page.meta.get('video-priority', 100))
        if pinned:
            video_priority = -1

        if video_id not in video_urls:
            video_urls[video_id] = {
                "priority": video_priority,
                "id": video_id,
                "name": video_name,
                "pages": list()
            }
        old_priority = video_urls[video_id]["priority"]
        video_urls[video_id]["priority"] = min(old_priority, video_priority)
        old_name = video_urls[video_id]["name"]
        video_urls[video_id]["name"] = old_name or video_name
        video_urls[video_id]["pages"].append(
            {"url": page_path, "name": page_name})

    videos = sorted(video_urls.values(), key=lambda vi: vi['priority'])
    l = []
    for v in videos:
        if v["name"] is None:
            raise RuntimeError(f'No name for {v}')
        v_id = v["id"]
        l.append(
            {"video:embed_url": f'https://www.youtube.com/embed/{v_id}',
             "video:name": v["name"],
             "associated": [{
                 "page:url": rel_url_from_html_path(p["url"]), "page:name": p["name"]
             } for p in v["pages"]]})
    return l


def get_urls(w: dhtml.Website, req_cls: str):
    import os
    from pathlib import Path

    pages = []

    for page in w.files:
        cls = page.class_name()
        if cls is None or cls != req_cls:
            continue
        pinned = page.meta.get('pinned', '') == 'true'
        # Get the page info. This is associated data.
        page_name = page.page_name()
        page_path = rel_url_from_html_path(page.dest_path.removesuffix('/index.html'))
        page_priority = int(page.meta.get('page-priority', 100))
        if pinned:
            page_priority = -1

        pages.append((page_name, page_path, page_priority))

    pages = [{"page:name": p[0], "page:url": p[1]}
             for p in sorted(pages, key=lambda pi: pi[2])]
    return pages


class Generator(MainGenerator):
    def __init__(self, website: dhtml.Website):
        self.website = website

    def html_pages(self):
        return HtmlStringGenerator(get_html_urls())

    def video_pages(self):
        return HtmlStringGenerator(get_video_urls(self.website))

    def class_pages(self, cls=None):
        if cls is None:
            print(f'Failure: Missing argument cls for class_pages')
            return "<!-- Failed to collect class pages -->"
        return HtmlStringGenerator(get_urls(self.website, cls))
