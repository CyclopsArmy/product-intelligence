"""Bounded, non-executing local HTML inspection. Input is never fetched."""
import json
import sys
from html.parser import HTMLParser


class CaptureParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.scripts = []
        self.selected = []
        self.current = None
        self.issues = []
        self.script_count = 0

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == 'script' and (values.get('type') or '').lower().strip() == 'application/ld+json':
            self.script_count += 1
            if self.script_count > 50:
                self.issues.append('TOO_MANY_SCRIPTS')
            else:
                self.current = []
        if 'data-pi-selected-offer' in values:
            # This is an adapter interchange format, NOT a retailer selector.
            if len(self.selected) >= 100:
                self.issues.append('TOO_MANY_CANDIDATES')
            else:
                self.selected.append({k[8:]: v for k, v in values.items() if k.startswith('data-pi-') and k != 'data-pi-selected-offer'})

    def handle_data(self, data):
        if self.current is not None:
            self.current.append(data)

    def handle_endtag(self, tag):
        if tag == 'script' and self.current is not None:
            self.scripts.append(''.join(self.current))
            self.current = None


def main():
    data = sys.stdin.buffer.read(2 * 1024 * 1024 + 1)
    if len(data) > 2 * 1024 * 1024:
        raise ValueError('HTML_TOO_LARGE')
    parser = CaptureParser()
    parser.feed(data.decode('utf-8', errors='strict'))
    parser.close()
    if parser.current is not None:
        parser.issues.append('INCOMPLETE_SCRIPT')
    print(json.dumps({'scripts': parser.scripts, 'selected': parser.selected, 'issues': sorted(set(parser.issues))}))


if __name__ == '__main__':
    try:
        main()
    except Exception:
        # Do not echo raw input or local paths in errors.
        print('HTML_PARSE_FAILED', file=sys.stderr)
        sys.exit(1)
