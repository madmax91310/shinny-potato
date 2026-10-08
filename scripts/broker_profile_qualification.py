"""Conservative promotion rules for the twelve unresolved official scopes.

These rules inspect documents assigned to the broker/field, including bounded
official discovery. Scoped paragraphs and unambiguous table cells qualify;
generic mentions, future launches and another account's fees never do.
"""
import re
import datetime as dt
import unicodedata
from bs4 import BeautifulSoup

TARGETS = {
    ('tr', 'pme'), ('tr', 'garde'), ('tr', 'change'),
    ('ibkr', 'pme'), ('ibkr', 'jeune'), ('ibkr', 'dca'),
    ('fortuneo', 'dca'), ('fortuneo', 'cash'), ('bourso', 'cash'),
    ('caidf', 'cash'), ('caidf', 'change'), ('bd', 'cash'),
}
NAMES = {'tr': 'Trade Republic', 'ibkr': '(?:IBKR|Interactive Brokers)',
         'fortuneo': 'Fortuneo'}
NUMBER = r'\d+(?:[,.]\d+)?'
MONTHS = {name:i for i,name in enumerate(('janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'),1)}


def rules(broker, field):
    """Return bounded (pattern, availability) pairs, without guessing a rate."""
    if field in ('pme', 'jeune'):
        label = r'PEA[- ]PME' if field == 'pme' else r'PEA Jeune'
        name = NAMES[broker]
        return [
            (rf'{name} propose (?:un|le) {label}', True),
            (rf'{name} ne propose pas (?:de|le) {label}', False),
            (rf'Nous proposons (?:un|le) {label}', True),
            (rf'Nous ne proposons pas (?:de|le) {label}', False),
            (rf'{name} offers {label} accounts', True),
            (rf'{name} does not offer {label} accounts', False),
        ]
    if field == 'dca':
        service = r'(?:achats automatiques|investissements programmés) sur PEA'
        suffix = rf'(?: chez {NAMES[broker]})?'
        return [(rf'Les {service} sont disponibles{suffix}', True),
                (rf'Les {service} ne sont pas disponibles{suffix}', False)]
    if field == 'cash':
        scope = r'Les (?:espèces|liquidités) du compte[- ]titres ordinaire(?: \(CTO\))?'
        return [(rf'{scope} sont rémunérées(?: à (?:un taux variable|{NUMBER} %))?', True),
                (rf'{scope} ne sont pas rémunérées', False)]
    if field == 'garde':
        return [(rf'Les frais de garde du PEA sont (?:nuls|gratuits|de {NUMBER} (?:€|%)(?: par an)?)', True),
                (r'Custody fees for the PEA are zero', True)]
    if field == 'change':
        scope = 'du PEA' if broker == 'tr' else 'sur les opérations boursières'
        return [(rf'La commission de change {scope} est de {NUMBER} %(?: du montant converti)?', True)]
    return []


def fold(text):
    text = text.replace('’', "'").replace('–', '-').replace('‑', '-').replace('−', '-')
    return ''.join(c for c in unicodedata.normalize('NFD', text.lower())
                   if not unicodedata.combining(c))


def plain(text):
    return re.sub(r'\s+', ' ', text.replace('\u200b', ' ').replace('\x07', '')).strip()


def future_date(text, today):
    t = fold(text)
    # Dated headings/clauses must not announce a later tariff or launch.
    for date in re.findall(r'\b(20\d{2}-\d{2}-\d{2})\b', t):
        if date > today:
            return True
    for day, month, year in re.findall(r'\b(\d{1,2})/(\d{1,2})/(20\d{2})\b', t):
        try:
            if dt.date(int(year), int(month), int(day)).isoformat() > today:
                return True
        except ValueError:
            return True
    for day, month, year in re.findall(r'\b(\d{1,2})(?:er)?\s+('+ '|'.join(MONTHS) +r')\s+(20\d{2})\b', t):
        try:
            if dt.date(int(year),MONTHS[month],int(day)).isoformat() > today:
                return True
        except ValueError:
            return True
    return any(int(y) > int(today[:4]) for y in re.findall(r'\b(20\d{2})\b', t))


def future_or_conditional(text, today):
    return bool(re.search(r'\b(?:si|if|would|will|prevu|prevoit|bientot|exemple|example|illustration)\b|a venir|a partir|a compter|autre courtier|other broker', fold(text))) or future_date(text, today)


def blocks(raw):
    """Preserve HTML paragraphs and PDF page breaks instead of flattening scope."""
    if '<html' in raw.lower() or '<body' in raw.lower():
        soup = BeautifulSoup(raw, 'html.parser')
        for node in soup(['script', 'style', 'nav', 'header', 'footer', 'aside']):
            node.decompose()
        root = soup.find('main') or soup
        headings = {}
        nodes = list(root.find_all(['h1', 'h2', 'h3', 'p', 'li', 'dd', 'table']))
        for node in nodes:
            if node.find_parent('table'):
                continue
            if node.name.startswith('h'):
                level = int(node.name[1])
                headings = {k:v for k,v in headings.items() if k < level}
                headings[level] = plain(node.get_text(' ', strip=True))
            elif node.name == 'table':
                yield node, ' '.join(headings.values())
            elif not node.find(['p', 'li', 'dd', 'table']):
                yield plain(node.get_text(' ', strip=True)), ' '.join(headings.values())
        # Some help pages use only divs, or append text outside the HTML body.
        yield plain(root.get_text(' ', strip=True)), ' '.join(plain(n.get_text(' ', strip=True)) for n in root.find_all(['h1','h2','h3']))
    else:
        for page in raw.split('\f'):
            for paragraph in re.split(r'\n\s*\n', page):
                yield plain(paragraph), ''


def flexible(broker, field, clause):
    """Match a scoped subject/predicate; preserve qualifiers in the whole quote."""
    t = fold(clause)
    name = fold(NAMES.get(broker, broker))
    if field in ('pme', 'jeune'):
        product = r'pea[- ]pme' if field == 'pme' else r'pea jeune'
        negative = rf'(?:{name}|nous)\s+(?:ne\s+)?(?:propose|proposons|commercialise|commercialisons)\s+pas\s+(?:de|le|un)\s+{product}|(?:le )?{product}\s+n.est pas\s+(?:propose|commercialise)\s+(?:par|chez)\s+{name}'
        positive = rf'(?:{name}|nous)\s+(?:propose|proposons|commercialise|commercialisons)\s+(?:desormais\s+)?(?:un|le)\s+{product}|(?:le )?{product}\s+est\s+(?:propose|commercialise)\s+(?:par|chez)\s+{name}'
        if re.fullmatch(negative, t): return False
        if re.fullmatch(positive, t): return True
    elif field == 'dca':
        # A scheduled deposit or generic fractional-order capability is insufficient.
        service = r'(?:les achats automatiques|les investissements programmes|le service d.investissement programme)'
        for negative, predicate in [(True, r'(?:ne sont pas|n.est pas) (?:disponibles?|proposes?|possibles?)'),
                                    (False, r'(?:sont|est) (?:disponibles?|proposes?|possibles?)')]:
            if re.fullmatch(rf'{service} {predicate} (?:sur|dans) (?:le |un |votre )?pea(?: chez {name})?', t):
                return not negative
    elif field == 'cash':
        subject = r'(?:les (?:sommes|especes|liquidites)(?: deposees)? (?:sur|du|de votre) (?:le |votre )?compte especes (?:associe|rattache) (?:au|a votre) (?:cto|compte[- ]titres ordinaire)|le compte especes (?:associe|rattache) au (?:cto|compte[- ]titres ordinaire))'
        if re.fullmatch(rf'{subject} (?:ne (?:sont|est) pas remunere(?:es)?|ne (?:donne|donnent) pas lieu a remuneration)', t): return False
        if re.fullmatch(rf'{subject} (?:sont|est) remunere(?:es)?(?: a (?:un taux variable|{NUMBER}\s*%))?', t): return True
    elif field == 'garde':
        if re.fullmatch(r'(?:les droits|les frais) de garde (?:du|sur le) pea (?:ne sont pas factures|sont gratuits|sont nuls)', t): return True
    elif field == 'change':
        scope = r'(?:du|sur le) pea' if broker == 'tr' else r'(?:sur|pour) les operations boursieres'
        if re.fullmatch(rf'(?:commission|frais) de change {scope}\s*:\s*{NUMBER}\s*%', t): return True
    return None


def table_evidence(broker, field, table):
    # Spanned/multi-level headers and footnoted tariffs require review.
    if table.find(attrs={'colspan': True}) or table.find(attrs={'rowspan': True}):
        return []
    rows = [[plain(c.get_text(' ', strip=True)) for c in row.find_all(['td', 'th'], recursive=False)]
            for row in table.find_all('tr')]
    if not rows or any(len(row) != len(rows[0]) for row in rows): return []
    result = []
    for row in rows[1:]:
        header = [fold(c) for c in rows[0]]
        if len(row) == 2:
            expected = {'pme': r'disponibilite|offre|propose|commercialisation',
                        'jeune': r'disponibilite|offre|propose|commercialisation',
                        'dca': r'disponibilite|offre|propose',
                        'cash': r'remuneration|interets|taux|reponse',
                        'garde': r'tarif|frais|montant|taux',
                        'change': r'tarif|frais|montant|taux'}[field]
            if not re.fullmatch(expected, header[1]): continue
            label, value = row
        elif len(row) == 3 and set(header[1:]) == {'pea', 'cto'}:
            account = 'cto' if field == 'cash' else 'pea'
            label, value = row[0] + ' ' + account, row[header.index(account)]
        else:
            continue
        label, v = fold(label), fold(value)
        labels = {
            'pme': r'pea[- ]pme', 'jeune': r'pea jeune',
            'dca': r'(?:achats automatiques|investissements programmes) pea',
            'cash': r'remuneration (?:des )?(?:especes|liquidites)(?: du)? cto',
            'garde': r'(?:frais|droits) de garde(?: du)? pea',
            'change': r'(?:commission|frais) de change (?:pea|operations boursieres)',
        }
        if not re.fullmatch(labels[field], label): continue
        if field == 'change' and not re.search('pea' if broker == 'tr' else 'operations boursieres', label): continue
        if field in ('garde', 'change'):
            if not re.fullmatch(rf'(?:gratuit|0|{NUMBER}\s*(?:€|%)(?: par an)?)', v): continue
            available = True
        elif re.fullmatch(r'non|non disponible|non remunerees', v): available = False
        elif re.fullmatch(r'oui|disponible|remunerees(?: a un taux variable)?', v): available = True
        else: continue
        quote = plain(table.get_text(' ', strip=True))
        summary = row[0] + (f' ({account.upper()})' if len(row) == 3 else '') + ' : ' + value + '.'
        result.append((available, quote, summary))
    return result


def qualify(broker, field, texts, today=None):
    if (broker, field) not in TARGETS:
        return None
    today = today or dt.date.today().isoformat()
    evidence = []
    for document, raw in texts.items():
        if '\f' in raw:
            front = fold(raw.split('\f')[0])
            dated = re.findall(r'(?:tarifs?|edition|en vigueur|applicable|effective|version)[^.!?\n]{0,100}',front)
            if any(future_date(line,today) for line in dated): continue
        for block, context in blocks(raw):
            if future_or_conditional(context, today): continue
            if not isinstance(block, str):
                quote = plain(block.get_text(' ', strip=True))
                if future_or_conditional(quote, today): continue
                evidence.extend((available, document, quote, summary) for available, quote, summary in table_evidence(broker, field, block))
                continue
            if future_date(block, today): continue
            for sentence in re.split(r'(?<=[.!?;])\s+', block):
                if sentence.strip().endswith('?'): continue
                clause = sentence.strip().rstrip('.!?;').strip()
                if not clause or len(clause) > 600 or future_or_conditional(clause, today): continue
                available = flexible(broker, field, clause)
                if available is None:
                    available = next((value for pattern, value in rules(broker, field)
                                      if re.fullmatch(pattern, clause, re.I)), None)
                if available is not None:
                    evidence.append((available, document, clause, clause + '.'))
    if not evidence:
        return None
    # Different tariffs also need review, even when both assert availability.
    def signature(available, summary):
        # Equivalent wording agrees, but differing amounts/periods do not.
        text = fold(summary)
        numbers = tuple((float(n.replace(',', '.')), unit) for n,unit in re.findall(r'(\d+(?:[,.]\d+)?)\s*(%|€)', text))
        if field == 'garde' and (re.search(r'gratuit|nul|non.*factur|zero', text) or numbers and all(n == 0 for n,_ in numbers)):
            numbers = ((0, 'free'),)
        period = 'annual' if re.search(r'par an|annuel', text) else ''
        return (available, numbers, period) if field in ('garde','change','cash') else (available,)
    if len({signature(available, summary) for available, _, _, summary in evidence}) > 1:
        raise ValueError('Clauses officielles concurrentes : qualification automatique suspendue')
    for _, _, quote, _ in evidence:
        for value in re.findall(r'(\d+(?:[,.]\d+)?)\s*%', quote):
            if float(value.replace(',', '.')) > 100:
                raise ValueError('Pourcentage officiel hors limites : qualification suspendue')
    available, document, clause, summary = evidence[0]
    return available, 'confirmé', summary, document, clause
