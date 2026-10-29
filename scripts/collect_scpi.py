"""Read official SCPI publications. A failed adapter never replaces validated data."""
import argparse
import http.client
import concurrent.futures
import datetime as dt
import json
import math
import pathlib
import re
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from bs4 import BeautifulSoup
from publication_periods import completed_year, annual_status

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'src/data/automated-scpi.json'
IROKO = 'https://www.iroko.eu/scpi/zen'
REMAKE = 'https://www.remake.fr/remake-live'
MAX_PUBLICATION_BYTES = 32_000_000  # Annual SCPI reports can exceed 17 MB.
IROKO_NOTE = 'https://iroko-documents.s3.eu-west-3.amazonaws.com/Iroko_Zen_note_information.pdf'


def fetch(url, headers=None):
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (official-publication-reader)', **(headers or {})})
    # Retry transport failures only. A changed page or a persistent missing PDF
    # must still reach refresh(), which preserves the last validated record.
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                data = response.read(MAX_PUBLICATION_BYTES + 1)
            if len(data) > MAX_PUBLICATION_BYTES:
                raise ValueError('Official publication exceeds size limit: ' + url)
            if not data:
                raise ValueError('Empty official publication: ' + url)
            return data
        except urllib.error.HTTPError as error:
            if error.code not in (408, 429, 500, 502, 503, 504) or attempt == 2:
                raise
        except (urllib.error.URLError, TimeoutError, ConnectionError, http.client.IncompleteRead):
            if attempt == 2:
                raise
        time.sleep(attempt + 1)


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
    old=re.search(r'pour la diversification : (\d+) immeubles',compact)
    if old:buildings=int(old[1])
    else:
        table=required(r'Patrimoine Au (\d{2}/\d{2}/\d{4}) (\d+) [\d ]+m2 [\d .,]+ M€ Immeubles Surface totale des immeubles Valeur des immeubles',compact)
        if dt.datetime.strptime(table[1],'%d/%m/%Y').date().isoformat()!=date:raise ValueError('Remake property count and portfolio date disagree')
        buildings=int(table[2])
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
    if not re.search(r'Locaux\s+occupés\s+sous\s+franchise',text):
        # T3 2026 has an adjacent column interleaved by pdftotext. Bind the
        # wrapped phrase spatially on the page instead of reading across it.
        clusters=[]
        for page in pages:
            for anchor in page['words']:
                if anchor['text']!='Locaux':continue
                row=[w for w in page['words']if abs(w['y']-anchor['y'])<2 and anchor['x']<=w['x']<=anchor['x']+130]
                following=[w for w in page['words']if w['text']=='franchise'and abs(w['x']-anchor['x'])<5 and 0<w['y']-anchor['y']<20]
                if [w['text']for w in sorted(row,key=lambda w:w['x'])][:3]==['Locaux','occupés','sous']and len(following)==1:clusters.append(anchor)
        if len(clusters)!=1:raise ValueError('Remake occupied-under-rent-free basis missing or ambiguous')
    return {'buildings':{'value':buildings,'asOf':date,'sourceUrl':url,'label':'Immeubles'},
            'occupancy':{'value':occupancy,'asOf':date,'sourceUrl':url,'label':'Taux d’occupation financier','basis':'Inclut les locaux sous franchise de loyer ; distinct du taux physique. Le nombre de baux n’est pas un nombre de locataires.'}}


def iroko_public_config(script):
    # Both quote styles occur in the issuer's public loader. Never execute JavaScript.
    values=[]
    for name in ['SUPABASE_URL','SUPABASE_ANON_KEY']:
        pattern=r"\bconst\s+"+name+r"\s*=\s*(['\"])([^'\"\s]+)\1\s*;"
        matches=re.findall(pattern,script)
        if len(matches)!=1:raise ValueError('Missing or ambiguous public Iroko configuration: '+name)
        values.append(matches[0][1])
    if not re.fullmatch(r'https://[a-z0-9]+\.supabase\.co',values[0]):raise ValueError('Unexpected public Iroko API host')
    return values


def collect_iroko(today):
    script = fetch('https://opendata.iroko.com/api/figure-embed.js').decode()
    host, key = iroko_public_config(script)
    # The public read-only credential is discovered from the issuer's embed, never configured by the user.
    names = ['distribution_yield', 'share_unit_price', 'financial_occupancy_rate', 'asset_count', 'tenant_count']
    query = urllib.parse.urlencode({'fund': 'eq.zen', 'select': 'name,period,unit,value,update_date',
                                  'name': 'in.(' + ','.join(names) + ')', 'order': 'update_date.desc', 'limit': '1000'})
    api = host + '/rest/v1/key_figures?' + query
    with concurrent.futures.ThreadPoolExecutor() as pool:
        urls = [IROKO, IROKO_NOTE]
        futures = [pool.submit(fetch, url) for url in urls]
        rows = json.loads(fetch(api, {'apikey': key, 'Authorization': 'Bearer ' + key}))
        page, note = [f.result() for f in futures]
    prices = sorted([r for r in rows if r['name'] == 'share_unit_price' and r['value'] is not None and r['update_date'] <= today.isoformat()], key=lambda r: r['update_date'])
    if not prices:
        raise ValueError('Missing share price')
    occupancy = next((r for r in rows if r['name'] == 'financial_occupancy_rate' and r['value'] is not None and r['update_date'] <= today.isoformat()), None)
    record = {'id': 'iroko-zen', 'name': 'Iroko Zen', 'sourceUrl': IROKO, 'checkedAt': today.isoformat(),
              'snapshot': None,
              'annual': {'years': annual_iroko(rows, today), 'sourceUrl': 'https://opendata.iroko.com/api/figure-embed.js'},
              'price': {'value': prices[-1]['value'], 'asOf': prices[-1]['update_date'], 'previousValue': prices[0]['value'], 'previousAsOf': prices[0]['update_date'], 'sourceUrl': IROKO},
              'conditions': {**parse_iroko_conditions(pdf_text(note), BeautifulSoup(page, 'html.parser').get_text(' ', strip=True)), 'sourceUrl': IROKO_NOTE}}
    if occupancy:
        record['occupancy'] = {'value': occupancy['value'], 'asOf': occupancy['update_date'], 'sourceUrl': IROKO}
    try:
        from collect_iroko_snapshot import collect_snapshot
        record['snapshot']=collect_snapshot(today)
    except Exception as error:
        record['snapshotError']=str(error)[:250]
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
    exit_fee = number(required(r'commission est prélevée pour les parts détenues depuis moins de (\d+) ans.*?(\d+(?:[,.]\d+)?)\s*%\s+TTC', compact).group(2))
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


def remake_bulletin(html, today):
    soup = BeautifulSoup(html, 'html.parser')
    # A consent/error page or a structural change is an access/schema failure,
    # never proof that the issuer has not published a bulletin.
    title=soup.title.get_text(' ',strip=True) if soup.title else ''
    if ('Remake Live' not in title or len(soup.select('script[data-repartition-data]'))!=2
            or not soup.select_one('script[data-scpi-perf-data]')):
        raise ValueError('Remake product page identity/components changed')
    links=[];unrecognized=False
    for a in soup.select('a[href]'):
        url=urllib.parse.urljoin(REMAKE,a['href']);parsed=urllib.parse.urlsplit(url)
        if parsed.scheme!='https' or parsed.netloc!='www.remake.fr' or parsed.query or parsed.fragment:continue
        old=re.search(r'remake-live-bulletin-information-(\d{2})-(\d{2})-(\d{4})\.pdf$',parsed.path,re.I)
        new=re.search(r'/REMAKELIVE_BT([1-4])_(20\d{2})\.pdf$',parsed.path,re.I)or re.search(r'/REMAKE_LIVE_BT_T([1-4])-(20\d{2})\.pdf$',parsed.path,re.I)
        if old:
            day,month,year=map(int,old.groups());stamp=dt.date(year,month,day);expected=None
        elif new:
            quarter,year=map(int,new.groups());month=quarter*3
            stamp=(dt.date(year,month+1,1)-dt.timedelta(days=1)) if month<12 else dt.date(year,12,31)
            expected=stamp.isoformat()
        else:
            if 'bulletin' in a.get_text(' ',strip=True).lower():unrecognized=True
            continue
        if stamp<=today:links.append((stamp,url,expected))
    if not links:
        if unrecognized:raise ValueError('Current official Remake bulletin link structure changed')
        raise AwaitingPublication('No bulletin linked by the identified current Remake product page')
    _,url,expected=max(set(links))
    return url,expected


def collect_remake(today):
    html = fetch(REMAKE).decode()
    url,expected_period=remake_bulletin(html,today)
    from collect_corum import bbox_pages
    data = fetch(url)
    text = pdf_text(data)
    required(r'\bRemake\s+Live\b',text)
    record = parse_remake(html,text,url,today)
    if expected_period and record['snapshot']['asOf']!=expected_period:
        raise ValueError('Remake bulletin filename period and financial date disagree')
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
    # Les anciens rapports utilisent N/N-1 ; celui de 2025 affiche les années.
    for label,row in re.findall(r'^[ \t]*(N(?:-[1-4])?|20\d{2})[ \t]+([^\n]+)$',block,re.M):
        if not re.search(r'\d',row):continue
        period=int(label) if label.isdigit() else year-(int(label[2:]) if '-' in label else 0)
        if period>year:raise ValueError('Remake price year exceeds annual report')
        value=number(required(r'([\d,.]+)\s*$',row)[1])
        observations.append({'asOf':f'{period}-12-31','value':value})
    observations=sorted(observations,key=lambda r:r['asOf'])[-3:]
    if [r['asOf'] for r in observations]!=[f'{y}-12-31' for y in range(year-2,year+1)]:raise ValueError('Missing Remake year-end prices')
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
    year = completed_year([r['year'] for r in years], today, count=3)
    record['annual']['publication'] = annual_status(year, today)
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


class AwaitingPublication(ValueError):
    """The source currently lists no bulletin: normal between two quarterly editions."""


# Internal monitoring interval, not a legal or issuer-promised publication deadline.
# A missing bulletin after this interval requests investigation, not a proven issuer delay.
BULLETIN_GRACE_DAYS = json.loads((pathlib.Path(__file__).resolve().parents[1] / 'src/data/freshness-policy.json').read_text())['calendars']['scpi.quarterlyBulletin']['graceDaysAfterNextQuarterEnd']


def next_bulletin_due(snapshot_as_of, period_months=3):
    if period_months not in (3,6):raise ValueError('Unqualified bulletin cadence')
    quarter_end = dt.date.fromisoformat(snapshot_as_of)
    import calendar
    if (quarter_end.month%period_months or quarter_end.day!=calendar.monthrange(quarter_end.year,quarter_end.month)[1]):
        raise ValueError('Bulletin snapshot is not the end of its qualified period')
    month = quarter_end.month + period_months
    year = quarter_end.year + (month - 1) // 12
    month = (month - 1) % 12 + 1
    next_end = dt.date(year, month + 1, 1) - dt.timedelta(days=1) if month < 12 else dt.date(year, 12, 31)
    return next_end + dt.timedelta(days=BULLETIN_GRACE_DAYS)


def refresh(previous, adapters, today):
    records = {r['id']: r for r in previous.get('records', [])}
    observations = []
    for id, adapter in adapters.items():
        try:
            record = adapter(today)
            old = records.get(id)
            snapshot_error=record.pop('snapshotError',None)
            if id=='iroko-zen':
                new_stamp=(record.get('snapshot') or {}).get('asOf')
                old_stamp=(old or {}).get('snapshot',{}).get('asOf')
                if old_stamp and (not new_stamp or new_stamp<old_stamp):
                    snapshot_error=snapshot_error or 'Quarterly portfolio publication disappeared or regressed'
                if snapshot_error:
                    if not old:raise ValueError(snapshot_error)
                    import copy
                    record['snapshot']=copy.deepcopy(old['snapshot'])
                    record['snapshot'].setdefault('checkedAt',old['checkedAt'])
            record = validate(record, today)
            # Never overwrite a newer photograph with an older publication.
            for field in ['snapshot', 'price']:
                if old and old[field]['asOf'] and record[field]['asOf'] and record[field]['asOf'] < old[field]['asOf']:
                    raise ValueError('Source publication regressed')
            if old:
                if max(r['year'] for r in record['annual']['years']) < max(r['year'] for r in old['annual']['years']):
                    raise ValueError('Annual distribution publication regressed')
                for key,observation in old.get('portfolio',{}).items():
                    new=record.get('portfolio',{}).get(key)
                    if not new or new['asOf']<observation['asOf']:raise ValueError('Portfolio evidence disappeared or regressed: '+key)
                if old.get('priceHistory') and (not record.get('priceHistory') or record['priceHistory']['years'][-1]['asOf']<old['priceHistory']['years'][-1]['asOf']):raise ValueError('Price history disappeared or regressed')
                for action in old.get('priceHistory',{}).get('corporateActions',[]):
                    if not any(all(new[k]==action[k] for k in ['asOf','ratio','oldPrice','newPrice']) for new in record.get('priceHistory',{}).get('corporateActions',[])):raise ValueError('Share split evidence disappeared or changed')
            record['collectionStatus'] = {'status':'success','lastAttemptAt':today.isoformat(),'lastAccessSuccessAt':today.isoformat()}
            publication=record.get('snapshotPublication')
            if publication:
                if (publication.get('basis')!='issuer-linked-bulletin-period'
                        or publication.get('asOf')!=record['snapshot']['asOf']
                        or publication.get('sourceUrl')not in record['snapshot']['sourceUrls']
                        or publication.get('issuerPublicationDeadline')is not None):
                    raise ValueError('Unqualified snapshot publication evidence')
                due=next_bulletin_due(publication['asOf'],publication['periodMonths'])
                record['collectionStatus'].update(internalReviewDue=due.isoformat(),issuerPublicationDeadline=None,
                    deadlineBasis='internal-monitoring-policy',publicationPeriodMonths=publication['periodMonths'])
                if today<=due:
                    record['collectionStatus'].update(status='waiting-publication',accessStatus='success',
                        reason='Current issuer-linked bulletin checked; next reporting period or its normal publication interval pending. Internal review date, no issuer deadline established.')
            if id=='remake-live':
                due=next_bulletin_due(record['snapshot']['asOf'])
                record['collectionStatus'].update(internalReviewDue=due.isoformat(),issuerPublicationDeadline=None,deadlineBasis='internal-monitoring-policy')
                if due-dt.timedelta(days=BULLETIN_GRACE_DAYS)<=today<=due:
                    record['collectionStatus'].update(status='waiting-publication',accessStatus='success',reason='Published current bulletin verified; awaiting the next edition linked by the issuer')
            records[id] = record
            observations.append({'id': id, 'name':record['name'], 'status': 'success',
                                 'checkedAt':dt.datetime.now(dt.timezone.utc).isoformat(),
                                 'sourceUrl':record['sourceUrl']})
            if id=='iroko-zen':
                observations.append({'id':'iroko-zen:snapshot','name':'Iroko Zen · Répartition trimestrielle','status':'failure' if snapshot_error else 'success',**({'reason':snapshot_error} if snapshot_error else {'checkedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'asOf':record['snapshot']['asOf']})})
        except AwaitingPublication as error:
            old = records.get(id)
            due = old and old.get('snapshot', {}).get('asOf') and next_bulletin_due(old['snapshot']['asOf'])
            if due and today <= due:
                import copy
                records[id] = {**copy.deepcopy(old), 'collectionStatus': {'status':'waiting-publication','lastAttemptAt':today.isoformat(),'lastAccessSuccessAt':today.isoformat(),'internalReviewDue':due.isoformat(),'issuerPublicationDeadline':None,'deadlineBasis':'internal-monitoring-policy'}}
                observations.append({'id': id, 'name': old['name'], 'status': 'waiting',
                                     'reason': f'{error}; internal monitoring review on {due.isoformat()}, issuer publication deadline unknown; last validated data kept.'})
            else:
                observations.append({'id': id, 'name': records.get(id, {}).get('name', id), 'status': 'failure',
                                     'reason': f'{error}; internal monitoring interval exceeded on {due.isoformat()}; no issuer deadline established.' if due else str(error)[:250]})
        except Exception as error:
            observations.append({'id': id, 'name':records.get(id,{}).get('name',id), 'status': 'failure', 'reason': str(error)[:250]})
    # Failed attempts remain visible without refreshing the last successful access
    # or the proof dates of retained financial values.
    for attempt in observations:
        if attempt['status']=='failure' and attempt['id'] in records:
            import copy
            saved=copy.deepcopy(records[attempt['id']])
            saved['collectionStatus']={**saved.get('collectionStatus',{}),'status':'failed','lastAttemptAt':today.isoformat()}
            records[attempt['id']]=saved
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
    raise SystemExit(__import__('producer_report_contract').run('collect_scpi', main))
