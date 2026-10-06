"""Read explicitly labelled fund allocations in current WisdomTree PDF columns."""
import re
from issuer_documents import pdf_text, validated_rows
from data_automation import reject

# Only known chart labels and unambiguous publisher truncations are accepted.
SECTOR_NAMES = ['Information Technology', 'Industrials', 'Health Care', 'Consumer Discretionary',
                'Financials', 'Communication Services', 'Consumer Staples', 'Materials',
                'Utilities', 'Real Estate', 'Energy']


def section(body, x, heading):
    text = pdf_text(body, (x, 180))
    if text.count(heading) != 1:
        reject('Missing or ambiguous WisdomTree allocation heading: ' + heading)
    # End at the footnote/listing section; never read subsequent document pages.
    block = text.split(heading, 1)[1].split('\f', 1)[0]
    return re.split(r'NB:|(?:Sources for all|WisdomTree UK, Bloomberg)|Listing Information|\bISIN\b', block, maxsplit=1)[0]


def table_rows(block):
    rows = []; pending = []
    for line in block.splitlines():
        line = line.strip()
        if not line or line == '(% Weight)': continue
        m = re.fullmatch(r'(.+?)\s{2,}(\d+\.\d+)%', line)
        if m:
            name = ' '.join(pending + [m[1]]); pending = []
            rows.append({'name': name, 'weightPct': float(m[2])})
        elif '%' not in line and re.search('[A-Za-z]', line):
            pending.append(line)
        else:
            reject('Unqualified WisdomTree table row')
    if pending: reject('Truncated WisdomTree holding name')
    return rows


def sector_rows(block):
    values = re.findall(r'(\d+\.\d+)%', block)
    labels = re.sub(r'\d+\.\d+%', '', block).replace('(% Weight)', '')
    labels = ' '.join(labels.split())
    # Publisher chart truncations: only uniquely identifiable prefixes are expanded.
    aliases = {'Information…': 'Information Technology', 'Communication…': 'Communication Services'}
    for short, full in aliases.items(): labels = labels.replace(short, full)
    if 'Consumer…' in labels:
        # Consumer Staples is separately explicit in these charts; ambiguous charts fail.
        if 'Consumer Staples' not in labels: reject('Ambiguous WisdomTree Consumer sector')
        labels = labels.replace('Consumer…', 'Consumer Discretionary')
    pattern = '|'.join(re.escape(n) for n in sorted(SECTOR_NAMES, key=len, reverse=True))
    names = re.findall(pattern, labels)
    if re.sub(pattern, '', labels).strip() or len(names) != len(values):
        reject('Unqualified WisdomTree sector labels/weights')
    return validated_rows([{'name': n, 'weightPct': float(v)} for n, v in zip(names, values)])


def allocations(body, stamp, source, digest):
    holdings = table_rows(section(body, 0, 'Top 10 Holdings'))
    if len(holdings) != 10: reject('WisdomTree top-ten holdings incomplete')
    result = {'holdings': validated_rows(holdings, complete=False),
              'sectors': sector_rows(section(body, 180, 'Fund Sector Exposure'))}
    countries = table_rows(section(body, 360, 'Top 10 Countries'))
    validated_rows(countries, complete=False)
    # Top-ten countries may omit significant countries. Preserve the complete previous
    # allocation rather than invent an unqualified residual (which could include cash).
    if 99 <= sum(r['weightPct'] for r in countries) <= 101:
        result['countries'] = validated_rows(countries)
    return {field: {'rows': rows, 'asOf': stamp, 'basis': 'fund',
                   'sourceUrl': source, 'sha256': digest} for field, rows in result.items()}
