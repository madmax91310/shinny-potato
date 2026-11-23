"""Extract the labelled account sections in the accessible BoursoBank brochure."""
import re


ACCOUNTS = (
    'CTO (hors boursomarkets)', 'CTO (boursomarkets)',
    'PEA ; PEA 18-25 ans et PEA-PME (hors boursomarkets)', 'PEA (boursomarkets)',
)
MINIMUM_LABEL = (r"Montant d'ordre minimum à l'achat - ETF - ETN - ETC "
                 r"\(Paris, Amsterdam\) et Horaires\s+Etendus")


def discovery(block):
    """Return None for the historical table, which has its own column parser."""
    block = block.replace('\f', '\n')
    marker = r'^\s*d[ée]couverte[ \t]*$'
    sections = re.split(marker, block, flags=re.I | re.M)
    if len(sections) == 1:
        return None
    headings = r'^[ \t]*(classic \(uniquement CTO\)|trader|ultimate trader)[ \t]*$'
    observed = [name.casefold() for name in re.findall(headings, sections[1], re.I | re.M)]
    if len(sections) != 2 or observed != ['classic (uniquement cto)', 'trader', 'ultimate trader']:
        raise ValueError('Rubriques du barème Découverte absentes ou ambiguës')
    terms = re.split(headings, sections[1], maxsplit=1, flags=re.I | re.M)[0]
    match = re.fullmatch(
        r"Frais de courtage par ordre\s+([\d,]+)\s*€ jusqu['’]à ([\d ]+) € puis "
        r"([\d,]+)\s*% au-delà\.\s+Les frais de courtage facturés aux clients sur les "
        r"PEA, PEA 18-25 ans et PEA-PME seront\s+plafonnés à 0,50 % du montant total de l['’]ordre",
        terms.strip(),
    )
    if not match:
        raise ValueError('Conditions Découverte ou plafond PEA modifiés')
    return dict(zip(('minimum', 'threshold', 'rate'), (float(v.replace(' ', '').replace(',', '.')) for v in match.groups())))


def order_minimum(content):
    """Return an exact common minimum or refuse a distinct per-account value."""
    start_pattern = r'^Conditions\s+CTO \(hors boursomarkets\)[ \t]*$'
    starts = list(re.finditer(start_pattern, content, re.I | re.M))
    if not starts:
        return None
    if len(starts) != 1:
        raise ValueError('Conditions de négociation BoursoBank ambiguës')
    start = starts[0].start()
    block = re.split(r'^Services[ \t]*$', content[start:], maxsplit=1, flags=re.M)[0]
    headings = '|'.join(map(re.escape, ACCOUNTS))
    sections = re.split(r'^[ \t]*(' + headings + r')[ \t]*$', block.replace('\f', '\n'), flags=re.I | re.M)
    if [name.casefold() for name in sections[1::2]] != [name.casefold() for name in ACCOUNTS]:
        raise ValueError('Comptes du minimum ETF absents, dupliqués ou désordonnés')
    values, statements = [], []
    for name, section in zip(sections[1::2], sections[2::2]):
        matches = list(re.finditer(r'^[ \t]*' + MINIMUM_LABEL + r'\s+([\d ]+)\s*€[ \t]*$', section, re.I | re.M))
        if len(matches) != 1:
            raise ValueError('Minimum ETF absent ou ambigu pour ' + name)
        values.append(int(matches[0][1].replace(' ', '')))
        statements.append(f'{name} : ' + ' '.join(matches[0][0].split()))
    if len(set(values)) != 1:
        raise ValueError('Minimum ETF différent selon le compte ou l’offre')
    return values[0], content.count('\f', 0, start) + 1, ' | '.join(statements)
