"""Exact dated index exposures and Nasdaq's explicit total-return calendar table."""
import datetime as dt
import re
from issuer_documents import download, pdf_text, proof, document_date, bounded_return
from data_automation import reject


def nasdaq_returns(text, config, now):
    # The PDF links NDX as the family page. Only the plotted series identifies
    # the return variant: never accept NDX prices in place of XNDX total return.
    if config['symbol'] != 'XNDX' or config['returnCurrency'] != 'USD' or config['returnVariant'] != 'TOTAL':
        reject('Unsupported Nasdaq exact return convention')
    if not re.search(r'Nasdaq-100 Total Return Index\s*\(XNDX\)', text, re.I) or 'PERFORMANCE(TR Version)' not in text or not re.search(r'Currency:\s+USD', text):
        reject('Wrong Nasdaq total-return factsheet')
    dates = re.findall(r'All Information as of (\d{2}/\d{2}/20\d{2})\.', text)
    if not dates or len(set(dates)) != 1: reject('Missing or inconsistent Nasdaq factsheet date')
    # Nasdaq dates are explicitly MM/DD/YYYY, unlike the European documents.
    stamp = document_date(dt.datetime.strptime(dates[0], '%m/%d/%Y').date().isoformat(), now)
    blocks = re.findall(r'PERFORMANCE\(TR Version\)\s+CALENDER YEAR\s+(.*?)All Information as of', text, re.S)
    if len(blocks) != 1: reject('Missing or ambiguous Nasdaq calendar table')
    pairs = re.findall(r'^\s*(20\d{2})\s+(-?\d+\.\d+)%\s*$', blocks[0], re.M)
    if not pairs or len({y for y, _ in pairs}) != len(pairs): reject('Duplicate or missing Nasdaq calendar years')
    if any(int(y) > now.year for y, _ in pairs): reject('Future Nasdaq calendar year')
    # The current year is explicitly excluded even though it shares the table.
    values = [[int(y), bounded_return(float(v))] for y, v in pairs if 2020 <= int(y) < now.year]
    if not all(y in dict(values) for y in range(max(2020, now.year-6), now.year)):
        reject('Incomplete Nasdaq completed calendar history')
    return stamp, sorted(values, reverse=True)


def amundi_composition(body, config, now, url):
    from collect_amundi_index_exposure import parse_document
    text = pdf_text(body)
    if not re.search(config['compositionIdentityPattern'], text):
        reject('Wrong Amundi exact tracked index')
    if text.count("Données de l'indice (Source : Amundi)") != 1:
        reject('Ambiguous Amundi index exposure section')
    section = text.split("Données de l'indice (Source : Amundi)", 1)[1]
    counts = re.findall(r'Nombre de valeurs\s*:\s*([\d ]+)\s*\n', section)
    if len(counts) != 1: reject('Missing index constituent count')
    count = int(counts[0].replace(' ', ''))
    if not 1 <= count <= 10000: reject('Invalid index constituent count')
    share = {'isin': config['compositionIsin'], 'sourceUrl': url,
             'expectedReplication': config.get('compositionReplication', 'Synthétique')}
    allocation = parse_document(body, share, now)
    if len(allocation['holdings']['rows']) != 10: reject('Incomplete top-ten index holdings')
    stamp = allocation['countries']['asOf']
    return {'index': config['name'], 'asOf': stamp, 'constituents': count,
            **{key: [[r['name'], r['weightPct']] for r in allocation[key]['rows']]
               for key in ['countries', 'sectors', 'holdings']},
            'source': {'url': url, 'checkedAt': now.date().isoformat(), 'sha256': proof(body),
                       'label': 'Composition de l’indice publiée par Amundi'},
            'provenance': 'Tables explicitement intitulées données de l’indice ; le portefeuille et le panier de substitution du fonds sont exclus.'}


def collect_amundi_composition(config, now, fetch=download):
    # Always request the newest monthly edition, then the preceding edition;
    # a dated publication must match the requested month and remain fresh.
    end = now.date().replace(day=1) - dt.timedelta(days=1)
    errors = []
    for _ in range(2):
        url = f"https://www.amundietf.fr/pdfDocuments/monthly-factsheet/{config['compositionIsin']}/FRA/FRA/INSTITUTIONNEL/ETF/{end:%Y%m%d}"
        try:
            body = fetch(url)
        except Exception as e:
            errors.append(f'{url}: {e}')
        else:
            facts = amundi_composition(body, config, now, url)
            if facts['asOf'] != end.isoformat():
                reject('Amundi requested/published index month mismatch')
            return facts
        end = end.replace(day=1) - dt.timedelta(days=1)
    reject('Amundi current index document unavailable: ' + ' ; '.join(errors))
