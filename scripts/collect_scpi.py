"""Read official SCPI publications. A failed adapter never replaces validated data."""
import argparse
import concurrent.futures
import datetime as dt
import json
import math
import pathlib
import re
import subprocess
import tempfile
import urllib.parse
import urllib.request
from bs4 import BeautifulSoup

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'src/data/automated-scpi.json'
IROKO = 'https://www.iroko.eu/scpi/zen'
REMAKE = 'https://www.remake.fr/remake-live'
IROKO_NOTE = 'https://iroko-documents.s3.eu-west-3.amazonaws.com/Iroko_Zen_note_information.pdf'


def fetch(url, headers=None):
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (official-publication-reader)', **(headers or {})})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def pdf_text(data, layout=True):
    if not data.startswith(b'%PDF'):
        raise ValueError('Expected an official PDF')
    with tempfile.TemporaryDirectory() as directory:
        path = pathlib.Path(directory) / 'source.pdf'
        path.write_bytes(data)
        return subprocess.check_output(['pdftotext', *(['-layout'] if layout else []), str(path), '-'], text=True, timeout=60)


def number(value):
    return float(str(value).replace(',', '.').replace(' ', '').replace('\u00a0', ''))


def required(pattern, text):
    match = re.search(pattern, text, re.I | re.S)
    if not match:
        raise ValueError('Official publication structure changed: ' + pattern[:70])
    return match


def split_chart(html):
    labels = json.loads(required(r'const chartLabels = (\[.*?\]);', html).group(1))
    values = json.loads(required(r'const chartValues = (\[.*?\]);', html).group(1))
    if len(labels) != len(values):
        raise ValueError('Chart label/value mismatch')
    return [{'label': label, 'value': value} for label, value in zip(labels, values)]


def annual_iroko(rows, today):
    result = {}
    for row in sorted(rows, key=lambda r: r['update_date']):
        if row['name'] == 'distribution_yield' and re.fullmatch(r'y-\d{4}', row['period'] or ''):
            year = int(row['period'][2:])
            if year < today.year and row['value'] is not None:
                result[year] = {'year': year, 'distribution': row['value']}
    return sorted(result.values(), key=lambda r: r['year'])[-3:]


def parse_iroko_conditions(text, page):
    compact = re.sub(r'\s+', ' ', text)
    required(r'commission de souscription est de 0% HT', compact)
    gestion = number(required(r'Au titre de la gestion de ses actifs.*?maximum de [\d,]+% HT \(soit ([\d,]+)% TTC.*?produits locatifs hors taxes', compact).group(1))
    # Retain the distinction between new and pre-September-2026 subscriptions.
    required(r'moins de six \(6\) ans.*?6% TTC.*?avant le 1er septembre 2026.*?avant trois \(3\) ans', compact)
    required(r'1er jour du 4ème mois', compact)
    required(r'Versement des revenus potentiels.{0,120}Mensuel', page)
    minimum = number(required(r'Ticket d’entrée.*?Dès ([\d .]+)\s*€', page).group(1))
    return {'minimum': minimum, 'enjoyment': 'Premier jour du 4e mois suivant l’enregistrement de la souscription.',
            'frequency': 'mensuels', 'subscriptionFee': 0, 'managementFee': gestion,
            'managementBasis': 'loyers HT et autres produits HT encaissés',
            'exit': 'Jusqu’à 6 % TTC du montant remboursé avant 6 ans ; avant 3 ans pour les parts souscrites avant le 01/09/2026.',
            'otherFees': 'Commissions possibles sur les acquisitions, travaux et arbitrages ; détail dans la note d’information.'}


def iroko_portfolio(rows,today):
    result={}
    for key,name,label in [('buildings','asset_count','Actifs immobiliers'),('tenants','tenant_count','Locataires'),('occupancy','financial_occupancy_rate','Taux d’occupation financier')]:
        valid=sorted([r for r in rows if r['name']==name and r['value'] is not None and r['update_date']<=today.isoformat()],key=lambda r:r['update_date'])
        if not valid:raise ValueError('Missing Iroko portfolio metric: '+name)
        r=valid[-1];result[key]={'value':r['value'],'asOf':r['update_date'],'label':label,'sourceUrl':IROKO}
    return result


def remake_portfolio(text,date,url,pages):
    compact=re.sub(r'\s+',' ',text)
    buildings=int(required(r'pour la diversification : (\d+) immeubles',compact)[1])
    values=[]
    for page in pages:
        for label in page['words']:
            if label['text']!='financier':continue
            headings=[w for w in page['words'] if w['text']=='Taux' and abs(w['x']-label['x'])<20 and 0<label['y']-w['y']<20]
            for heading in headings:
                candidates=[w for w in page['words'] if re.fullmatch(r'[\d,.]+',w['text']) and abs(w['x']-heading['x'])<25 and 0<heading['y']-w['y']<35]
                if candidates:values.append(number(min(candidates,key=lambda w:heading['y']-w['y'])['text']))
    if not values or len(set(values))!=1:raise ValueError('Missing/ambiguous Remake financial occupancy')
    occupancy=values[0]
    required(r'Locaux occupés sous franchise',text)
    return {'buildings':{'value':buildings,'asOf':date,'sourceUrl':url,'label':'Immeubles'},
            'occupancy':{'value':occupancy,'asOf':date,'sourceUrl':url,'label':'Taux d’occupation financier','basis':'Inclut les locaux sous franchise de loyer ; distinct du taux physique. Le nombre de baux n’est pas un nombre de locataires.'}}


def collect_iroko(today):
    script = fetch('https://opendata.iroko.com/api/figure-embed.js').decode()
    host = required(r"SUPABASE_URL\s*=\s*'([^']+)'", script).group(1)
    key = required(r"SUPABASE_ANON_KEY\s*=\s*'([^']+)'", script).group(1)
    # The public read-only credential is discovered from the issuer's embed, never configured by the user.
    names = ['distribution_yield', 'share_unit_price', 'financial_occupancy_rate', 'asset_count', 'tenant_count']
    query = urllib.parse.urlencode({'fund': 'eq.zen', 'select': 'name,period,unit,value,update_date',
                                  'name': 'in.(' + ','.join(names) + ')', 'order': 'update_date.desc', 'limit': '1000'})
    api = host + '/rest/v1/key_figures?' + query
    with concurrent.futures.ThreadPoolExecutor() as pool:
        urls = [IROKO, IROKO_NOTE, 'https://opendata.iroko.com/embed/charts/geo-rep-value-zen', 'https://opendata.iroko.com/embed/charts/type-rep-value-zen']
        futures = [pool.submit(fetch, url) for url in urls]
        rows = json.loads(fetch(api, {'apikey': key, 'Authorization': 'Bearer ' + key}))
        page, note, geo, sectors = [f.result() for f in futures]
    prices = sorted([r for r in rows if r['name'] == 'share_unit_price' and r['value'] is not None and r['update_date'] <= today.isoformat()], key=lambda r: r['update_date'])
    if not prices:
        raise ValueError('Missing share price')
    occupancy = next((r for r in rows if r['name'] == 'financial_occupancy_rate' and r['value'] is not None and r['update_date'] <= today.isoformat()), None)
    record = {'id': 'iroko-zen', 'name': 'Iroko Zen', 'sourceUrl': IROKO, 'checkedAt': today.isoformat(),
              'snapshot': {'asOf': None, 'dateNote': 'La date des graphiques n’est pas publiée ; date du relevé conservée séparément.',
                           'countries': split_chart(geo.decode()), 'sectors': split_chart(sectors.decode()), 'sourceUrls': urls[2:]},
              'annual': {'years': annual_iroko(rows, today), 'sourceUrl': 'https://opendata.iroko.com/api/figure-embed.js'},
              'price': {'value': prices[-1]['value'], 'asOf': prices[-1]['update_date'], 'previousValue': prices[0]['value'], 'previousAsOf': prices[0]['update_date'], 'sourceUrl': IROKO},
              'conditions': {**parse_iroko_conditions(pdf_text(note), BeautifulSoup(page, 'html.parser').get_text(' ', strip=True)), 'sourceUrl': IROKO_NOTE}}
    if occupancy:
        record['occupancy'] = {'value': occupancy['value'], 'asOf': occupancy['update_date'], 'sourceUrl': IROKO}
    record['portfolio'] = iroko_portfolio(rows,today)
    record['priceHistory'] = {'years':[{'asOf':r['update_date'],'value':r['value']} for r in prices], 'sourceUrl':IROKO, 'dateNote':'Prix publiés dans les observations datées de l’émetteur.'}
    return record


def parse_remake(html, text, bulletin_url, today):
    soup = BeautifulSoup(html, 'html.parser')
    charts = soup.select('script[data-repartition-data]')
    if len(charts) != 2:
        raise ValueError('Expected distinct country and sector charts')
    perf = json.loads(soup.select_one('script[data-scpi-perf-data]').string)
    years = [{'year': int(r['year']), 'distribution': r['taux']} for r in perf['elements'] if int(r['year']) < today.year]
    compact = re.sub(r'\s+', ' ', text)
    date = required(r'Au (\d{2})/(\d{2})/(\d{4})', compact)
    as_of = '-'.join([date.group(3), date.group(2), date.group(1)])
    minimum = required(r'minimum de souscription est fixé à.{0,150}?(\d+) part[s]?, soit ([\d ,]+)€', compact)
    fee = number(required(r'Commission de gestion annuelle.*?(\d+(?:[,.]\d+)?)%.*?TTC', compact).group(1))
    required(r'Commission de souscription\s+0%', compact)
    exit_fee = number(required(r'commission est prélevée pour les parts détenues depuis moins de (\d+) ans.*?(\d+)%\s+TTC', compact).group(2))
    exit_years = int(required(r'parts détenues depuis moins de (\d+) ans', compact).group(1))
    required(r'Premier jour du quatrième mois', compact)
    required(r'Distribution mensuelle', compact)
    return {'id': 'remake-live', 'name': 'Remake Live', 'sourceUrl': REMAKE, 'checkedAt': today.isoformat(),
            'snapshot': {'asOf': as_of, 'countries': json.loads(charts[0].string), 'sectors': json.loads(charts[1].string), 'sourceUrls': [REMAKE, bulletin_url]},
            'annual': {'years': sorted(years, key=lambda r: r['year'])[-3:], 'sourceUrl': REMAKE},
            'price': {'value': number(minimum.group(2)) / int(minimum.group(1)), 'asOf': as_of, 'sourceUrl': bulletin_url},
            'conditions': {'minimum': number(minimum.group(2)), 'enjoyment': 'Premier jour du 4e mois suivant celui de la souscription.', 'frequency': 'mensuels',
                           'subscriptionFee': 0, 'managementFee': fee, 'managementBasis': 'produits locatifs HT et autres produits encaissés',
                           'exit': f'{exit_fee:g} % TTC du montant remboursé avant {exit_years} ans, sauf exceptions prévues dans la note.',
                           'otherFees': '5 % TTC du prix net vendeur pour les acquisitions et 5 % TTC du montant TTC des travaux.', 'sourceUrl': bulletin_url}}


def collect_remake(today):
    html = fetch(REMAKE).decode()
    soup = BeautifulSoup(html, 'html.parser')
    links = [urllib.parse.urljoin(REMAKE, a['href']) for a in soup.select('a[href]') if re.search(r'remake-live-bulletin-information-\d{2}-\d{2}-\d{4}\.pdf', a['href'])]
    def publication_date(url):
        day, month, year = required(r'(\d{2})-(\d{2})-(\d{4})\.pdf', url).groups()
        return dt.date(int(year), int(month), int(day))
    links = [url for url in links if publication_date(url) <= today]
    if not links:
        raise ValueError('Missing current official bulletin')
    url = max(links, key=publication_date)
    from collect_corum import bbox_pages
    data = fetch(url)
    text = pdf_text(data)
    record = parse_remake(html,text,url,today)
    record['portfolio'] = remake_portfolio(text,record['snapshot']['asOf'],url,bbox_pages(data))
    documents=BeautifulSoup(fetch('https://www.remake.fr/documentation/').decode(),'html.parser')
    section=next((s for s in documents.select('section') if s.find('h2') and s.find('h2').get_text(' ',strip=True)=='Live'),None)
    annual_links=[] if section is None else [urllib.parse.urljoin(REMAKE,a['href']) for a in section.select('a[href]') if a.get_text(' ',strip=True)=='Rapport annuel']
    if len(set(annual_links))!=1:raise ValueError('Missing/ambiguous Remake Live annual report')
    annual_url=annual_links[0]
    record['priceHistory']=remake_price_history(pdf_text(fetch(annual_url)),annual_url,record['price'],today)
    return record


def remake_price_history(annual,url,current_price,today):
    required(r'Remake Live',annual)
    year=int(required(r'^\s*31\.12\.(20\d{2})',annual)[1])
    if year>=today.year:raise ValueError('Incomplete Remake annual report')
    block=required(r'Évolution du capital\s+(.*?)Évolution des conditions de cession ou de retrait',annual)[1]
    observations=[]
    for label,row in re.findall(r'^[ \t]*(N(?:-[1-4])?)[ \t]+([^\n]+)$',block,re.M):
        if not re.search(r'\d',row):continue
        period=year-(int(label[2:]) if '-' in label else 0)
        value=number(required(r'([\d,.]+)\s*$',row)[1])
        observations.append({'asOf':f'{period}-12-31','value':value})
    observations=sorted(observations,key=lambda r:r['asOf'])[-3:]
    if len(observations)!=3 or len({r['asOf'] for r in observations})!=3 or observations[-1]['asOf']!=f'{year}-12-31':raise ValueError('Missing Remake year-end prices')
    if current_price['asOf']>observations[-1]['asOf']:observations.append({'asOf':current_price['asOf'],'value':current_price['value']})
    return {'years':observations,'sourceUrls':[url,current_price['sourceUrl']],
            'dateNote':f'Prix au 31 décembre du rapport actuellement lié sur la page officielle (exercice {year}), puis prix du bulletin courant. Aucune année intermédiaire non publiée n’est ajoutée.'}


def validate(record, today):
    for key in ['countries', 'sectors'] + (['regions'] if 'regions' in record['snapshot'] else []):
        rows = record['snapshot'][key]
        if not rows or len({r['label'] for r in rows}) != len(rows):
            raise ValueError('Missing/duplicate allocation labels')
        if any(not r['label'] or not isinstance(r['value'], (float, int)) or not math.isfinite(r['value']) or not 0 <= r['value'] <= 100 for r in rows):
            raise ValueError('Invalid allocation')
        if abs(sum(r['value'] for r in rows) - 100) > 0.15:
            raise ValueError('Allocation does not sum to 100%')
    years = record['annual']['years']
    if len(years) != 3 or len({r['year'] for r in years}) != 3 or max(r['year'] for r in years) != today.year - 1:
        raise ValueError('Three completed annual distributions required')
    if any(not isinstance(r['distribution'], (int, float)) or not 0 <= r['distribution'] <= 30 for r in years):
        raise ValueError('Invalid distribution rate')
    if not 0 < record['price']['value'] < 10000 or not 0 < record['conditions']['minimum'] < 100000:
        raise ValueError('Invalid subscription amount')
    if not 0 <= record['conditions']['managementFee'] <= 30:
        raise ValueError('Invalid management commission')
    for date in [record['price']['asOf'], record['snapshot']['asOf']]:
        if date is not None and dt.date.fromisoformat(date) > today:
            raise ValueError('Future source date')
    for key,observation in record.get('portfolio',{}).items():
        value=observation['value']
        if not isinstance(value,(int,float)) or not math.isfinite(value) or value<0 or (key=='occupancy' and value>100) or (key!='occupancy' and (value!=int(value) or value<=0)):
            raise ValueError('Invalid portfolio metric: '+key)
        if not observation.get('sourceUrl') or dt.date.fromisoformat(observation['asOf'])>today:raise ValueError('Invalid portfolio evidence')
    if 'priceHistory' in record:
        history=record['priceHistory']['years']
        if not history or len({r['asOf'] for r in history})!=len(history) or history!=sorted(history,key=lambda r:r['asOf']):raise ValueError('Invalid dated price history')
        if any(not isinstance(r['value'],(int,float)) or not math.isfinite(r['value']) or not 0<r['value']<10000 or dt.date.fromisoformat(r['asOf'])>today for r in history):raise ValueError('Invalid historical price')
        for action in record['priceHistory'].get('corporateActions',[]):
            if not action.get('description') or not action.get('sourceUrl') or dt.date.fromisoformat(action['asOf'])>today or not all(isinstance(action[k],(int,float)) and math.isfinite(action[k]) and action[k]>0 for k in ['ratio','oldPrice','newPrice']) or abs(action['oldPrice']/action['ratio']-action['newPrice'])>.001:
                raise ValueError('Invalid share split evidence')
    return record


def refresh(previous, adapters, today):
    records = {r['id']: r for r in previous.get('records', [])}
    observations = []
    for id, adapter in adapters.items():
        try:
            record = validate(adapter(today), today)
            old = records.get(id)
            # Never overwrite a newer photograph with an older publication.
            for field in ['snapshot', 'price']:
                if old and old[field]['asOf'] and record[field]['asOf'] and record[field]['asOf'] < old[field]['asOf']:
                    raise ValueError('Source publication regressed')
            if old:
                for key,observation in old.get('portfolio',{}).items():
                    new=record.get('portfolio',{}).get(key)
                    if not new or new['asOf']<observation['asOf']:raise ValueError('Portfolio evidence disappeared or regressed: '+key)
                if old.get('priceHistory') and (not record.get('priceHistory') or record['priceHistory']['years'][-1]['asOf']<old['priceHistory']['years'][-1]['asOf']):raise ValueError('Price history disappeared or regressed')
                for action in old.get('priceHistory',{}).get('corporateActions',[]):
                    if not any(all(new[k]==action[k] for k in ['asOf','ratio','oldPrice','newPrice']) for new in record.get('priceHistory',{}).get('corporateActions',[])):raise ValueError('Share split evidence disappeared or changed')
            records[id] = record
            observations.append({'id': id, 'status': 'success'})
        except Exception as error:
            observations.append({'id': id, 'status': 'failure', 'reason': str(error)[:250]})
    return {'records': list(records.values())}, observations


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--output', type=pathlib.Path)
    args = parser.parse_args()
    previous = json.loads(OUTPUT.read_text()) if OUTPUT.exists() else {'records': []}
    from collect_corum import PRODUCTS, collect
    from collect_extended_scpi import PRODUCTS as EXTRA_PRODUCTS, collect as collect_extra
    from collect_atland_scpi import PRODUCTS as ATLAND_PRODUCTS, collect as collect_atland
    adapters = {'iroko-zen': collect_iroko, 'remake-live': collect_remake}
    adapters.update({id_: lambda day, key=id_: collect(key, day) for id_ in PRODUCTS})
    adapters.update({id_:lambda day,key=id_:collect_extra(key,day) for id_ in EXTRA_PRODUCTS})
    adapters.update({id_:lambda day,key=id_:collect_atland(key,day) for id_ in ATLAND_PRODUCTS})
    result, observations = refresh(previous, adapters, dt.date.today())
    if args.apply:
        OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    report = {'observations': observations}
    if args.output:
        args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False))
    return 1 if any(r['status'] == 'failure' for r in observations) else 0


if __name__ == '__main__':
    raise SystemExit(main())
