"""Collect named life-insurance contracts from public distributor publications."""
import argparse
import datetime as dt
import json
import math
import pathlib
import re
from bs4 import BeautifulSoup
from publication_periods import completed_year, annual_status
from collect_scpi import fetch, pdf_text, number, required

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'src/data/automated-insurance.json'
BASE = 'https://www.linxea.com/assurance-vie/'
PRODUCTS = {
    'linxea-zen': {'name': 'Linxea Zen', 'insurer': 'Apicil', 'funds': [('Apicil Euroflex', 'Euroflex', 'fonds-euro/'), ('Apicil Euro Garanti', 'Apicil Euro Garanti', 'fonds-euro/')]},
    'linxea-vie': {'name': 'Linxea Vie', 'insurer': 'Generali', 'funds': [('Netissima', 'Netissima', 'fonds-euro/'), ('Eurossima', 'Eurossima', 'fonds-euro/')]},
    'linxea-spirit-2': {'name': 'Linxea Spirit 2', 'insurer': 'Spirica', 'funds': [
        ('Euro Nouvelle Génération', 'Nouvelle Génération', 'fonds-euro/'),
        ('Euro Objectif Climat', 'Objectif Climat', 'fonds-euro-linxea-spirit-2-euro-objectif-climat/')]},
    'linxea-avenir-2': {'name': 'Linxea Avenir 2', 'insurer': 'Suravenir', 'funds': [
        ('Suravenir Opportunités 2', 'Suravenir Opportunités 2', 'fonds-euro/'),
        ('Suravenir Rendement 2', 'Suravenir Rendement 2', 'fonds-euro/')]},
}


def plain(html):
    return re.sub(r'\s+', ' ', BeautifulSoup(html, 'html.parser').get_text(' ', strip=True))


def parse_contract(html, id_, today):
    config = PRODUCTS[id_]
    soup = BeautifulSoup(html, 'html.parser')
    if soup.select_one('h1').get_text(' ', strip=True) != config['name']:
        raise ValueError('Wrong contract identity')
    text = plain(html)
    if not any(config['insurer'].lower() in str(tag).lower() for tag in soup.select('img')):
        raise ValueError('Missing insurer identity')
    # Use only the contract column of the first tariff table, never market averages or simulations.
    table = soup.select_one('table')
    rows = {}
    for tr in table.select('tr'):
        cells = tr.select('td,th')
        if len(cells) >= 2:
            rows[plain(str(cells[0]))] = plain(str(cells[1]))
    def tariff(label):
        values = [v for k, v in rows.items() if re.fullmatch(label, k, re.I)]
        if len(values) != 1:
            raise ValueError('Missing/ambiguous contract tariff: ' + label)
        return number(required(r'^([\d,.]+)\s*%', values[0]).group(1))
    fees = {'subscription': tariff('Versement'), 'arbitrage': tariff('Arbitrage en ligne'),
            'units': tariff('Gestion des unités de compte / an'), 'etfTrade': tariff('Transactions ETF(?: / ETC)?')}
    # Parse the explicit eligibility block, not the 20-year illustrative simulation.
    initial = number(required(r'Accessible dès ([\d ]+)€ de versement initial', text).group(1))
    free = number(required(r'Versement libre dès ([\d ]+)€', text).group(1))
    monthly = number(required(r'Versement programmé dès ([\d ]+)€/mois', text).group(1))
    heading = next((h for h in soup.select('h2') if 'supports disponibles' in h.get_text()), None)
    if not heading:
        raise ValueError('Missing support count')
    count = int(required(r'Plus de ([\d ]+) supports disponibles', plain(str(heading))).group(1).replace(' ', ''))
    hero = soup.select_one('h1').find_parent('section').get_text(' ', strip=True)
    required(r'ETF', hero); required(r'Private Equity', hero); required(r'SCPI', hero)
    supports = ['ETF', 'SCPI', 'private equity']
    if re.search(r'\bActions\b', hero):
        supports.append('actions en direct')
    return {'id': id_, 'name': config['name'], 'insurer': config['insurer'], 'distributor': 'Linxea',
            'checkedAt': today.isoformat(), 'sourceUrl': BASE + id_ + '/',
            'fees': {**fees, 'sourceUrl': BASE + id_ + '/', 'scope': 'Gestion libre, opérations en ligne ; hors frais des supports et garanties optionnelles.'},
            'access': {'initial': initial, 'free': free, 'monthly': monthly, 'sourceUrl': BASE + id_ + '/'},
            'supports': {'minimumCount': count, 'categories': supports, 'sourceUrl': BASE + id_ + '/'}, 'euroFunds': []}


def parse_fund(html, id_, name, label, url, today, contract_html=None):
    text = plain(html)
    # Restrict return parsing to the named fund card before its risk/method notes.
    card = required(r'LE FONDS EUROS ' + re.escape(label) + r' (.*?)(?:Les rendements passés|Les performances passées|\(1\) Net de frais|\* Taux de)', text).group(1)
    values = {}
    pattern = r'([\d,.]+)\s*%\s*(?:à\s*([\d,.]+)\s*%\s*)?(?:Net\s*(?:\*|\(\d+\))?\s*)?en\s*(\d{4})(?:\s*(selon la part UC détenue))?'
    for match in re.finditer(pattern, card, re.I):
        year = int(match[3])
        if year < today.year:
            row = {'year': year, 'return': number(match[1])}
            if match[2]:
                if not match[4]: raise ValueError('Unqualified return range')
                row = {'year': year, 'returnMin': number(match[1]), 'returnMax': number(match[2]), 'condition': match[4]}
            if year in values and values[year] != row: raise ValueError('Conflicting historical rates')
            values[year] = row
    completed_year(sorted(values)[-3:],today)
    years = [values[year] for year in sorted(values)[-3:]]
    max_allocation = number(required(r'Accessible à ([\d,.]+)\s*%', card).group(1)) if 'Accessible à' in card else None
    valid_until = None
    notes = None
    if id_ in ('linxea-zen', 'linxea-vie'):
        body = required(r'Fonctionnement des Fonds euros de ' + re.escape(PRODUCTS[id_]['name']) + r'(.*)', text).group(1)
        body_label = name if id_ == 'linxea-zen' else label
        body = required(re.escape(body_label) + r' Stratégie d’investissement (.*?)(?:Documents applicables|Besoin de conseils)', body).group(1)
        required(r'Arbitrages', body)
        ceiling = None
        if id_ == 'linxea-zen':
            max_allocation = number(required(r'^([\d,.]+)\s*% en fonds', card).group(1))
            required(r'sans limite de montant et sans conditions d’unités de compte', body)
            if label == 'Euroflex':
                management = number(required(r'([\d,.]+)\s*% de frais de gestion annuel', body).group(1))
                guarantee = number(required(r'Garantie en capital à hauteur de ([\d,.]+)\s*%', body).group(1))
                penalty = number(required(r'([\d,.]+)\s*% de pénalité en cas d’arbitrage', body).group(1))
                required(r'rachat total en cours d’année entraîne la perte de tout droit', body)
                operations = f'Versements et arbitrages sans quota d’unités de compte ; {penalty:g} % de pénalité pour un arbitrage vers Apicil Euro Garanti.'
                notes = 'Un rachat total en cours d’année fait perdre la participation aux bénéfices de fin d’année. Le rendement 2025 inclut le complément versé à tous les clients, distinct des offres sous conditions de versement.'
            else:
                management = number(required(r'([\d,.]+)\s*% par an de frais de gestion', body).group(1))
                required(r'Garantie en capital brute de frais de gestion', body)
                guarantee = 100 - management
                required(r'après le 26/10/2020.*?rachat partiel ou total.*?perte de tout droit', body)
                operations = 'Versements et arbitrages sans quota d’unités de compte.'
                notes = 'Pour les contrats souscrits après le 26/10/2020, un rachat en cours d’année fait perdre la participation aux bénéfices sur la quote-part rachetée.'
        else:
            management = number(required(r'([\d,.]+)\s*% par an de frais de gestion pour les contrats ouverts après 2017', body).group(1))
            max_allocation = number(required(r'Accessible à ([\d,.]+)\s*%', card).group(1)) if label == 'Netissima' else number(required(r'représenter ([\d,.]+)\s*% de vos investissements', body).group(1))
            guarantee = None
            if label == 'Netissima':
                guarantee = number(required(r'capital est garanti à hauteur de ([\d,.]+)\s*%', plain(contract_html or '')).group(1))
                stamp = required(r'sans conditions d’unités de compte jusqu’au (\d{2})/(\d{2})/(\d{4})', body)
                valid_until = '-'.join([stamp[3],stamp[2],stamp[1]])
                if dt.date.fromisoformat(valid_until) < today: raise ValueError('Expired fund access conditions')
                operations = f'Versements sans quota d’unités de compte jusqu’au {stamp[0].split("jusqu’au ")[1]} ; arbitrages éligibles.'
            else:
                opening = number(required(r'entre 0 et ([\d ]+) euros l’année civile de votre souscription', card).group(1))
                following = number(required(r'entre 0 et ([\d ]+) euros par année civile les années suivantes', card).group(1))
                required(r'Assureur communiquera.*?montant maximum', card)
                operations = f'Plafond annuel fixé par l’assureur, au plus {opening:g} € l’année de souscription et {following:g} € les années suivantes ; versements et arbitrages éligibles.'
            required(r'rachat total.*?Taux Minimum Garanti', body)
            notes = 'Nouveaux contrats : frais applicables aux ouvertures après 2017. En cas de rachat total en cours d’année, le taux appliqué est le Taux Minimum Garanti.'
    elif id_ == 'linxea-spirit-2':
        guarantee = number(required(r'garantie (?:nette de frais de gestion |en capital annuelle )de ([\d,.]+)\s*%', text).group(1))
        management = number(required(r'frais de gestion de ([\d,.]+)\s*%', text).group(1))
        if name == 'Euro Objectif Climat':
            required(r'Gestion libre UNIQUEMENT', text)
            ceiling = number(required(r'Plafond d.investissement par contrat\s*:\s*([\d,.]+)M€', text).group(1)) * 1_000_000
            max_allocation = 100
            operations = 'Gestion libre ; versement initial, versements complémentaires et programmés.'
        else:
            required(r'sans conditions d’unités de compte', text)
            ceiling = number(required(r'jusqu’à ([\d,.]+) millions d’euros', text).group(1)) * 1_000_000
            operations = 'Versements et arbitrages ; sans quota d’unités de compte.'
    else:
        body = required(r'Fonctionnement des Fonds euros de Linxea Avenir 2(.*)', text).group(1)
        body = body.split(label, 1)[1]
        if label == 'Suravenir Opportunités 2':
            body = body.split('Suravenir Rendement 2', 1)[0]
        guarantee = number(required(r'Garantie en capital à hauteur de ([\d,.]+)\s*%', body).group(1)) if label == 'Suravenir Opportunités 2' else 100 - number(required(r'([\d,.]+)\s*% par an de frais de gestion', body).group(1))
        management = number(required(r'([\d,.]+)\s*% maximum par an de frais de gestion', body).group(1)) if label == 'Suravenir Opportunités 2' else number(required(r'([\d,.]+)\s*% par an de frais de gestion', body).group(1))
        if label == 'Suravenir Opportunités 2':
            required(r'arbitrage sortant', body)
            operations = 'Versements uniquement à l’entrée ; arbitrages sortants possibles.'
        else:
            quota = number(required(r'minimum de ([\d,.]+)\s*% en unités de compte', body).group(1))
            if quota != 100 - max_allocation: raise ValueError('Conflicting allocation conditions')
            operations = f'Au moins {100-max_allocation:g} % en unités de compte non garanties ; arbitrages possibles.'
        ceiling = None
    return {'name': name, 'years': years, 'asOf': f'{max(values)}-12-31', 'guarantee': guarantee,
            'managementFeeMax': management, 'maxAllocation': max_allocation, 'ceiling': ceiling,
            'operations': operations, 'notes': notes, 'accessValidUntil': valid_until, 'sourceUrls': [url] + ([BASE+id_+'/'] if id_ == 'linxea-vie' and label == 'Netissima' else []), 'sourceUrl': url}


def validate(record, today):
    def finite(value, low, high):
        return isinstance(value, (int,float)) and math.isfinite(value) and low <= value <= high
    if not all(finite(v, 0, 5) for k,v in record['fees'].items() if k in ('subscription','arbitrage','units','etfTrade')):
        raise ValueError('Invalid insurance fee')
    if not all(finite(v, 1, 1_000_000) for k,v in record['access'].items() if k != 'sourceUrl'):
        raise ValueError('Invalid access amount')
    if not finite(record['supports']['minimumCount'], 1, 10000) or not 1 <= len(record['euroFunds']) <= 5 or len({f['name'] for f in record['euroFunds']}) != len(record['euroFunds']):
        raise ValueError('Incomplete contract')
    for fund in record['euroFunds']:
        years = fund['years']
        year = completed_year([y['year'] for y in years],today)
        if years != sorted(years,key=lambda y:y['year']) or fund['asOf'] != f'{year}-12-31':
            raise ValueError('Annual fund date/columns disagree')
        fund['publication'] = annual_status(year,today)
        if any(not finite(y.get('return', y.get('returnMin')), -10, 15) or ('returnMax' in y and (not finite(y['returnMax'], y['returnMin'], 15) or not y.get('condition'))) for y in years) or (fund['guarantee'] is not None and not finite(fund['guarantee'], 90, 100)) or (fund['maxAllocation'] is not None and not finite(fund['maxAllocation'], 0, 100)) or not finite(fund['managementFeeMax'], 0, 5):
            raise ValueError('Invalid fund data')
        for year in years:
            if year.get('tiers'):
                tiers=year['tiers']
                if any(not finite(r['return'],-10,15) or not r.get('condition') or not r.get('encours') for r in tiers) or min(r['return'] for r in tiers)!=year['returnMin'] or max(r['return'] for r in tiers)!=year['returnMax']:
                    raise ValueError('Unqualified or inconsistent return tiers')
        if dt.date.fromisoformat(fund['asOf']) > today:
            raise ValueError('Future fund year')
    return record


def collect(id_, today):
    contract_html = fetch(BASE+id_+'/').decode()
    record = parse_contract(contract_html, id_, today)
    cache = {}
    for name,label,suffix in PRODUCTS[id_]['funds']:
        url = BASE+id_+'/supports-disponibles-sur-'+id_+'/'+suffix
        if url not in cache:
            cache[url] = fetch(url).decode()
        record['euroFunds'].append(parse_fund(cache[url],id_,name,label,url,today,contract_html))
    if id_ == 'linxea-vie':
        url = vie_notice_url(contract_html)
        qualify_vie_guarantees(record, pdf_text(fetch(url), layout=False), url)
    return validate(record,today)


def vie_notice_url(html):
    links = {a['href'] for a in BeautifulSoup(html, 'html.parser').select('a[href]')
             if re.fullmatch(r'conditions générales du contrat', a.get_text(' ', strip=True), re.I)}
    if len(links) != 1:
        raise ValueError('Missing/ambiguous Linxea Vie contract notice')
    import urllib.parse
    url = urllib.parse.urljoin(BASE, links.pop())
    if urllib.parse.urlparse(url).scheme != 'https' or urllib.parse.urlparse(url).hostname != 'www.linxea.com':
        raise ValueError('Unexpected Linxea Vie notice host')
    return url


def qualify_vie_guarantees(record, notice, url):
    # Scope the evidence to the essential contract provisions, not the UC or
    # growth-fund guarantees, nor the illustrative redemption tables.
    text = re.sub(r'\s+', ' ', notice.replace('\x07', ''))
    block = required(r'Dispositions essentielles du contrat(.*?)Sommaire', text)[1]
    required(r'Linxea Vie est un contrat.*?Generali Vie', text)
    required(r'Pour la partie des droits exprimés en euros\s*:\s*le contrat comporte une garantie en capital qui est au moins égale aux sommes versées, nettes de frais', block)
    fees = required(r'Frais de gestion sur le\(s\) fonds en euros\s*:(.*?)Frais de gestion sur le fonds croissance', block)[1]
    for fund in record['euroFunds']:
        match = required(r'([\d ,]+)\s*% maximum par an de la provision mathématique du contrat libellée en euros sur le fonds en euros ' + re.escape(fund['name']), fees)
        management = number(match[1])
        if abs(management - fund['managementFeeMax']) > .001:
            raise ValueError('Notice and distributor fund fees disagree')
        guarantee = round(100 - management, 4)
        if fund['guarantee'] is not None and abs(fund['guarantee'] - guarantee) > .001:
            raise ValueError('Notice and distributor fund guarantees disagree')
        fund['guarantee'] = guarantee
        fee_label = f'{management:g}'.replace('.', ',')
        fund['guaranteeBasis'] = f'Minimum annuel calculé à partir de la garantie contractuelle brute et de {fee_label} % de frais maximaux ; hors garantie optionnelle décès. Le capital garanti se réduit chaque année des frais.'
        fund['sourceUrls'] = list(dict.fromkeys([*fund['sourceUrls'], url]))


def refresh(previous, adapters, today):
    records = {r['id']:r for r in previous.get('records',[])}
    observations=[]
    for id_, adapter in adapters.items():
        try:
            record=validate(adapter(today),today)
            old=records.get(id_)
            if old and {f['name'] for f in old['euroFunds']} != {f['name'] for f in record['euroFunds']}:
                raise ValueError('Published fund catalogue changed; qualification required')
            if old and any(f['asOf'] < next((o['asOf'] for o in old['euroFunds'] if o['name']==f['name']),f['asOf']) for f in record['euroFunds']):
                raise ValueError('Source year regressed')
            if old:
                for fund in record['euroFunds']:
                    before = next(o for o in old['euroFunds'] if o['name'] == fund['name'])
                    for field in ('guarantee', 'maxAllocation', 'ceiling', 'accessValidUntil'):
                        if before.get(field) is not None and fund.get(field) is None:
                            raise ValueError('Qualified fund condition disappeared: ' + fund['name'] + ' / ' + field)
            records[id_]=record;observations.append({'id':id_,'name':record['name'],'status':'success'})
        except Exception as error:
            observations.append({'id':id_,'name':records.get(id_,{}).get('name',id_),'status':'failure','reason':str(error)[:250]})
    return {'records':list(records.values())},observations


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--apply',action='store_true');parser.add_argument('--output',type=pathlib.Path)
    args=parser.parse_args();today=dt.date.today()
    previous=json.loads(OUTPUT.read_text()) if OUTPUT.exists() else {'records':[]}
    from collect_other_insurance import PRODUCTS as OTHER_PRODUCTS, collect as collect_other
    adapters={id_:lambda day,key=id_:collect(key,day) for id_ in PRODUCTS}
    adapters.update({id_:lambda day,key=id_:collect_other(key,day) for id_ in OTHER_PRODUCTS})
    result,observations=refresh(previous,adapters,today)
    if args.apply:OUTPUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    report={'observations':observations}
    if args.output:args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False));return int(any(o['status']=='failure' for o in observations))

if __name__=='__main__':raise SystemExit(main())
