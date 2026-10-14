"""Dated allocation tables of the exact physical ETF; no top-ten reconstruction."""
import re
from issuer_documents import document_date, validated_rows, proof, pdf_text
from data_automation import reject


def parse_allocations(text, share, now):
    if share['isin'] != 'IE000L2SA8K5' or share['isin'] not in text:
        reject('Wrong Invesco allocation share')
    if not re.search(r'Replication method\s+Physical\b', text):
        reject('Invesco allocation requires the qualified physical ETF')
    result = {}
    for field, heading, following in [('countries', 'Geographic allocation (%)', 'Sector allocation (%)'),
                                      ('sectors', 'Sector allocation (%)', 'Top exposures (%)')]:
        if text.count(heading) != 1 or text.count(following) != 1:
            reject('Missing or ambiguous Invesco allocation heading')
        block = text.split(heading, 1)[1].split(following, 1)[0]
        stamps = re.findall(r'Source: Invesco, as at (\d+ [A-Za-z]+ \d{4})', block)
        if len(stamps) != 1: reject('Invesco allocation date missing or ambiguous')
        stamp = document_date(stamps[0], now)
        rows = []; pending = None
        # PDF text is cropped to the left column, excluding legal prose.
        for line in block.split('Source: Invesco, as at', 1)[0].splitlines():
            line = line.strip()
            if line.startswith('\uf06e'):
                m = re.fullmatch(r'\uf06e\s+(.+?)\s{2,}(-?\d+\.\d+)', line)
                if not m: reject('Malformed Invesco allocation row')
                pending = {'name': m[1], 'weightPct': float(m[2])}
                rows.append(pending)
            elif line:
                if pending is None: reject('Unrecognized Invesco allocation text')
                if not re.fullmatch(r'[A-Za-z &/-]+', line): reject('Malformed Invesco allocation continuation')
                pending['name'] += ' ' + line
        validated_rows(rows)
        result[field] = {'rows': rows, 'asOf': stamp, 'basis': 'fund', 'sourceUrl': share['sourceUrl'],
                         'method': 'Published allocation of the exact physical ETF factsheet'}
    return result


def collect_allocations(body, share, now):
    text = pdf_text(body, (0, 195))
    identity = pdf_text(body)
    # Identity and replication sit on page one; retain only these checked facts.
    if share['isin'] not in identity or not re.search(r'Replication method\s+Physical\b', identity):
        reject('Wrong Invesco allocation identity/replication')
    result = parse_allocations(share['isin'] + '\nReplication method Physical\n' + text, share, now)
    for observation in result.values(): observation['sha256'] = proof(body)
    return result
