#!/usr/bin/env python3
"""Dependency-free crawl of sitemap, metadata, schemas and internal links.

Usage: python3 scripts/audit-seo.py --site https://www.iconik.pro --output reports/seo/crawl.json
Use --canonical-origin https://www.iconik.pro when auditing a local production build.
This checks indexability; it does not claim Google has indexed any URL.
"""
import argparse
import concurrent.futures
import json
import pathlib
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
import xml.etree.ElementTree as ET
from collections import defaultdict
from datetime import datetime, timezone
from html.parser import HTMLParser


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = []
        self.h1 = []
        self.meta = {}
        self.canonicals = []
        self.links = set()
        self.images_missing_alt = []
        self.schemas = []
        self.schema_errors = []
        self.capture = None
        self.buffer = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ('title', 'h1') or (tag == 'script' and a.get('type') == 'application/ld+json'):
            self.capture, self.buffer = tag, []
        if tag == 'meta':
            key = a.get('name', a.get('property', '')).lower()
            self.meta.setdefault(key, []).append(a.get('content', ''))
        if tag == 'link' and 'canonical' in a.get('rel', '').lower().split():
            self.canonicals.append(a.get('href', ''))
        if tag == 'a' and a.get('href'):
            self.links.add(a['href'])
        if tag == 'img' and 'alt' not in a:
            self.images_missing_alt.append(a.get('src', ''))

    def handle_data(self, data):
        if self.capture:
            self.buffer.append(data)

    def handle_endtag(self, tag):
        if tag != self.capture:
            return
        value = ''.join(self.buffer).strip()
        if tag == 'title':
            self.title.append(value)
        elif tag == 'h1':
            self.h1.append(value)
        else:
            try:
                self.schemas.append(json.loads(value))
            except ValueError as error:
                self.schema_errors.append(str(error))
        self.capture = None


def fetch(url):
    try:
        request = urllib.request.Request(url, headers={'User-Agent': 'Iconik-SEO-Audit/1.0'})
        with urllib.request.urlopen(request, timeout=35) as response:
            return response.status, response.url, dict(response.headers), response.read().decode('utf-8', errors='replace')
    except urllib.error.HTTPError as error:
        return error.code, error.url, dict(error.headers), error.read().decode('utf-8', errors='replace')
    except Exception as error:
        return 0, url, {}, str(error)


def normalized(url):
    u = urllib.parse.urlsplit(url)
    return (u.scheme, u.netloc, u.path.rstrip('/') or '/')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--site', default='https://www.iconik.pro')
    parser.add_argument('--canonical-origin', default='https://www.iconik.pro')
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    site = args.site.rstrip('/')
    canonical_origin = args.canonical_origin.rstrip('/')
    status, _, _, robots_text = fetch(site + '/robots.txt')
    robots = urllib.robotparser.RobotFileParser()
    robots.parse(robots_text.splitlines() if status == 200 else [])
    sitemap_status, _, _, sitemap_xml = fetch(site + '/sitemap.xml')
    if sitemap_status != 200:
        raise SystemExit(f'Sitemap returned HTTP {sitemap_status}')
    root = ET.fromstring(sitemap_xml)
    if root.tag.endswith('sitemapindex'):
        raise SystemExit('Sitemap indexes require crawling child sitemaps; this site audit expects a URL set.')
    urls = [e.text for e in root.iter() if e.tag.endswith('}loc') or e.tag == 'loc']
    if not urls:
        raise SystemExit('Sitemap contains no URLs')

    def inspect(url):
        path = urllib.parse.urlsplit(url).path or '/'
        target = site + path
        code, final, headers, html = fetch(target)
        page = Page()
        page.feed(html)
        problems = []
        if code != 200:
            problems.append(f'http-{code}')
        if normalized(final) != normalized(target):
            problems.append('redirect-in-sitemap')
        if not robots.can_fetch('Googlebot', target):
            problems.append('robots-blocked')
        directives = ','.join(page.meta.get('robots', []) + page.meta.get('googlebot', []) + [v for k, v in headers.items() if k.lower() == 'x-robots-tag'])
        if 'noindex' in directives.lower():
            problems.append('noindex-in-sitemap')
        if len(page.title) != 1 or not page.title[0]:
            problems.append('missing-or-multiple-title')
        if not any(page.meta.get('description', [])):
            problems.append('missing-description')
        if len(page.canonicals) != 1 or normalized(page.canonicals[0]) != normalized(canonical_origin + path):
            problems.append('missing-or-mismatched-canonical')
        if len(page.h1) != 1:
            problems.append('missing-or-multiple-h1')
        if page.images_missing_alt:
            problems.append('images-missing-alt')
        if page.schema_errors:
            problems.append('invalid-json-ld')
        links = []
        for href in page.links:
            resolved = urllib.parse.urlsplit(urllib.parse.urljoin(canonical_origin + path, href))
            if resolved.netloc == urllib.parse.urlsplit(canonical_origin).netloc and resolved.scheme in ('http', 'https'):
                links.append(resolved.path.rstrip('/') or '/')
        return dict(path=path, status=code, final_url=final, title=page.title, description=page.meta.get('description', []),
                    canonical=page.canonicals, h1=page.h1, robots=directives, problems=problems,
                    links=sorted(set(links)), images_missing_alt=page.images_missing_alt,
                    schema_count=len(page.schemas), schema_errors=page.schema_errors)

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        pages = list(pool.map(inspect, urls))
    incoming = defaultdict(set)
    duplicates = defaultdict(list)
    descriptions = defaultdict(list)
    for page in pages:
        for path in page['links']:
            if path != page['path']:
                incoming[path].add(page['path'])
        for title in page['title']:
            duplicates[title].append(page['path'])
        for description in page['description']:
            descriptions[description].append(page['path'])
    sitemap_paths = {p['path'].rstrip('/') or '/' for p in pages}
    linked_paths = sorted(set(incoming) - sitemap_paths)

    def inspect_link(path):
        code, final, _, _ = fetch(site + path)
        return dict(path=path, status=code, final_url=final)

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        linked = list(pool.map(inspect_link, linked_paths))
    report = dict(timestamp=datetime.now(timezone.utc).isoformat(), site=site, robots_status=status,
                  robots=robots_text, sitemap_count=len(urls), pages=pages,
                  duplicate_titles={k: v for k, v in duplicates.items() if len(v) > 1},
                  duplicate_descriptions={k: v for k, v in descriptions.items() if len(v) > 1},
                  no_incoming_sitemap_links=[p['path'] for p in pages if not incoming[p['path']]],
                  linked_pages=linked, broken_links=[p for p in linked if p['status'] == 0 or p['status'] >= 400])
    output = pathlib.Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2))
    failures = [p for p in pages if p['problems']]
    print(json.dumps(dict(sitemap_count=len(urls), pages_with_problems=[dict(path=p['path'], problems=p['problems']) for p in failures],
                          no_incoming_sitemap_links=report['no_incoming_sitemap_links'], broken_links=report['broken_links']), indent=2))
    # Missing inbound links and multiple H1s are review signals, not indexing blockers.
    blockers = {'redirect-in-sitemap', 'robots-blocked', 'noindex-in-sitemap', 'missing-or-multiple-title',
                'missing-description', 'missing-or-mismatched-canonical', 'invalid-json-ld'}
    if any(any(p.startswith('http-') or p in blockers for p in row['problems']) for row in pages) or report['broken_links']:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
