"""VanEck's automatically replaced official UCITS factsheets, with fund/share scope retained."""
import re
import pathlib
import subprocess
import urllib.error
import http.client
from urllib.parse import urlparse
from data_automation import reject
from issuer_documents import download,pdf_text,document_date,proof,validated_rows,bounded_return



FRENCH_MONTHS = dict(zip(
    ('janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'),
    ('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'),
    strict=True,
))
FRENCH_LABELS = {
    'Devise de base': 'Base Currency',
    'Date de lancement': 'Inception Date',
    'Actif net': 'Net Assets',
    'Frais courants réels': 'Total Expense Ratio',
    'Structure du produit': 'Product Structure',
    'Physique (réplication': 'Physical (Full',
    'complète)': 'Replication)',
    'Traitement des revenus': 'Income Treatment',
    'Réinvestissement': 'Reinvestment',
    'Distributeur': 'Distributing',
    'Répartition par pays': 'Country Breakdown',
    'Les 10 principales participations': 'Top 10 Holdings',
    'SOUS-TOTAL - TOP 10': 'SUBTOTAL',
    'Performances passées au': 'Past Performance as of',
    'Les performances passées ne préfigurent pas': 'Past performance does not',
    'Indice de référence': 'Benchmark',
    'Données du fonds': 'Fund Data',
}

FRENCH_COUNTRIES = {
    'Afrique du Sud': 'South Africa', 'Allemagne': 'Germany', 'Australie': 'Australia',
    'Autre/Espèces': 'Other/Cash', 'Brésil': 'Brazil', 'Chine': 'China',
    'Corée du Sud': 'South Korea', 'Espagne': 'Spain', 'États-Unis': 'United States',
    'Finlande': 'Finland', 'Israël': 'Israel', 'Italie': 'Italy', 'Japon': 'Japan',
    'Mexique': 'Mexico', 'Norvège': 'Norway', 'Pays-Bas': 'Netherlands',
    'Région de Taïwan': 'Taiwan Region', 'Royaume-Uni': 'United Kingdom',
    'Singapour': 'Singapore', 'Suède': 'Sweden', 'Suisse': 'Switzerland',
}


def french_text(text):
    # Translate only labels and exact decimal separators from the official
    # French template before applying the existing financial checks.
    for label, target in FRENCH_LABELS.items():
        text = text.replace(label, target)
    text = re.sub(r'(Domicile[ \t]+)(Irlande|Pays-Bas)\b',
                  lambda match: match[1] + {'Irlande': 'Ireland', 'Pays-Bas': 'Netherlands'}[match[2]], text)
    text = re.sub(r'(?<=\d),(?=\d)', '.', text)
    return re.sub(r'(\d{1,2} )(' + '|'.join(FRENCH_MONTHS) + r')(?= 20\d{2}\b)',
                  lambda match: match[1] + FRENCH_MONTHS[match[2]], text)


def french_document(text):
    return 'Communication publicitaire' in text and 'Devise de base' in text

def parse_calendar_performance(text,share,now):
    """Official fund row only; shared by factsheet and NAV consumers."""
    if french_document(text):
        text = french_text(text)
    if 'Past Performance as of'not in text:return None,{}
    block=text.split('Past Performance as of',1)[1].split('Past performance does not',1)[0]
    years=[];values=[]
    for line in block.splitlines():
        cells=re.split(r' {2,}',line.strip())
        # An asterisk marks a documented benchmark change, not a partial year.
        header=re.search(r'(?:^| {2,})(20\d{2}\*?(?:\s+20\d{2}\*?)*)\s*$',line.strip())
        if header: years=re.findall(r'20\d{2}',header[1])
        if 'VanEck ' in line and 'Benchmark' not in line:
            # Numeric columns are separated from the ETF label by two or
            # more spaces. Integer returns (9, 16...) are valid observations.
            cells=re.split(r' {2,}',line.split('VanEck ',1)[1].strip(),maxsplit=1)
            numeric=cells[1].split() if len(cells)==2 else []
            if numeric and any(not re.fullmatch(r'-?\d+(?:\.\d+)?',c) for c in numeric):
                reject('Invalid VanEck numerical calendar row')
            if numeric: values=numeric
    header=re.search(r'Fund Data\s+(20\d{2}(?:\s+20\d{2})*)',block)
    if header: years=re.findall(r'20\d{2}',header[1])
    if years and values and len(values)<=len(years):
        import datetime as dt
        launch=re.search(r'Inception Date\s+(\d{1,2} [A-Za-z]+ 20\d{2})',text)
        if not launch: reject('Missing VanEck fund inception date')
        inception=dt.date.fromisoformat(document_date(launch[1],now,max_age=36500))
        first_full=inception.year + (0 if (inception.month,inception.day)==(1,1) else 1)
        numeric_years=list(map(int,years))
        if numeric_years != list(range(min(numeric_years),now.year)):
            reject('Missing, duplicate or unfinished VanEck calendar column')
        years=[y for y in years if int(y)>=first_full]
        if len(values)!=len(years): reject('Missing complete VanEck calendar observation')
        performance={'currency':share['currency'],'basis':'fund',
            'method':('calendar-year NAV total return, income distributions gross of Dutch withholding tax, net of fund fees'
                      if share['isin'].startswith('NL') else 'calendar-year NAV total return, net income reinvested, net of fees'),
            'years':{y:bounded_return(float(v))for y,v in zip(years,values)}}
        precision={y:len(v.split('.')[1])if'.'in v else 0 for y,v in zip(years,values)}
        return performance,precision
    return None,{}


def parse_document(body,share,now):
    text=pdf_text(body)
    french = french_document(text)
    if french:
        text = french_text(text)
    if share['isin']not in text:reject('Wrong VanEck UCITS share identity')
    stamp=document_date(re.search(r'\b\d{1,2} [A-Za-z]+ 20\d{2}\b',text)[0],now)
    if re.search(r'Base Currency\s+(USD|EUR|GBP)',text)[1]!=share['currency']:reject('VanEck base currency mismatch')
    assets=re.search(r'Net Assets\s+(USD |EUR |€|\$)([\d,.]+)([MB])',text)
    if not assets or assets[1].strip().replace('€','EUR').replace('$','USD')!=share['currency']:reject('VanEck asset currency mismatch')
    ter=float(re.search(r'Total Expense Ratio\s+(\d+\.\d+)%',text)[1])
    if not 0<=ter<=5:reject('Invalid VanEck TER')
    # Reuse the exact-share metadata parser. Configured identity references are
    # not freshly observed characteristics and must not renew their evidence.
    from collect_instrument_metadata import parse_text
    metadata = parse_text(text, share['isin'])
    left = pdf_text(body, (0,185))
    if french:
        left = french_text(left)
        if re.search(r'^Product Structure[ \t]+Physical \(Full\s+Replication\)', left, re.M):
            metadata['replicationMethod'] = 'Physical (Full replication)'
    observed = {'terPct':ter, **{key:metadata[key] for key in ('distribution','domicile','replicationMethod') if key in metadata},
                'asOf':stamp, 'sourceUrl':share['sourceUrl'], 'sha256':proof(body)}
    result={**share,'productId':share['isin'],'terPct':ter,'index':share['benchmark'],'distribution':metadata.get('distribution'),
        'characteristics':observed,
        'aum':{'amount':float(assets[2].replace(',',''))*(1e6 if assets[3]=='M' else 1e9),'currency':share['currency'],'scope':'fund','asOf':stamp},
        'documentSha256':proof(body),'unavailable':[]}
    for key in ('distribution','domicile','replicationMethod'):
        if key not in metadata:result['unavailable'].append(key+': explicit exact-share metadata missing from official document')
    country=[]
    if 'Country Breakdown'in left:
        pages = left.split('Country Breakdown', 1)[1].split('\f', 2)
        block = pages[0]
        if french and len(pages) > 1:
            # The French page can carry its final published cash row over.
            # Never infer the cash weight from a subtotal or another panel.
            cash = re.match(r'[ \t]*Autre/Espèces[ \t]+\d+\.\d+%[ \t]*(?:\n|$)', pages[1])
            if cash:
                block += '\n' + cash[0]
        for line in block.splitlines():
            m=re.match(r'\s*([^\d%]+?)\s{2,}(\d+\.\d+)%\s*$',line)
            if m:
                label = m[1].strip()
                country.append({'name':FRENCH_COUNTRIES.get(label,label) if french else label,'weightPct':float(m[2])})
        validated_rows(country)
        result['countries']={'asOf':stamp,'basis':'fund','sourceUrl':share['sourceUrl'],'rows':country}
    holdings=[];right=pdf_text(body,(190,410))
    if french:
        right = french_text(right)
    block=(right if 'Top 10 Holdings' in right else text).split('Top 10 Holdings',1)[1].split('SUBTOTAL',1)[0]
    for line in block.splitlines():
        m=re.match(r'\s*([^\d%]+?)\s{2,}(\d+\.\d+)%\s*$',line)
        if m:
            name = m[1].strip()
            # The two language editions of TRET name this exact holding
            # differently on the same date. Retain its canonical issuer label.
            if french and share['isin'] == 'NL0009690239' and name == 'STOCKAGE PUBLIC':
                name = 'PUBLIC STORAGE'
            holdings.append({'name':name,'weightPct':float(m[2])})
    if len(holdings)!=10:reject('Incomplete VanEck holdings table')
    validated_rows(holdings,complete=False)
    result['holdings']={'asOf':stamp,'basis':'fund','sourceUrl':share['sourceUrl'],'rows':holdings}
    result['unavailable'].append('sectors: factsheet does not publish a complete sector table')
    if 'Past Performance as of'in text:
        performance,_=parse_calendar_performance(text,share,now)
        if performance:result['performance']=performance
        else:result['unavailable'].append('performance: numerical calendar-year row not qualified')
    return result


def official_transport_url(value):
    parsed = urlparse(value)
    return (parsed.scheme == 'https' and parsed.netloc == 'www.vaneck.com'
            and not parsed.username and not parsed.password)


def download_document(share, fetch=download):
    urls=[share['sourceUrl'], *share.get('fallbackUrls',[])]
    document=pathlib.PurePosixPath(urlparse(share['sourceUrl']).path).name
    for url in urls:
        parsed=urlparse(url)
        if (parsed.scheme!='https' or parsed.netloc!='www.vaneck.com' or parsed.query or parsed.fragment
                or not re.fullmatch(r'/(?:ucits|[a-z]{2}/en|fr/fr)/library/fact-sheets/[a-z0-9]+-fact-sheet\.pdf',parsed.path)
                or pathlib.PurePosixPath(parsed.path).name!=document):
            reject('Unexpected VanEck regional document URL')
    last_error=None
    for url in urls:
        try:
            body=download(url, url_validator=official_transport_url) if fetch is download else fetch(url)
        except (urllib.error.URLError, TimeoutError, ConnectionError, http.client.IncompleteRead) as error:
            last_error=error;continue
        except ValueError as error:
            if 'Expected official PDF' not in str(error):raise
            last_error=error;continue
        # An incompatible document must fail, never trigger another source.
        return body, url
    if fetch is not download:raise last_error
    script=pathlib.Path(__file__).with_name('download-vaneck-document.mjs')
    for url in urls:
        try:
            result=subprocess.run(['node',str(script),url],capture_output=True,timeout=120)
        except subprocess.TimeoutExpired as error:
            last_error=error;continue
        if result.returncode:
            last_error=ValueError(str(last_error)+'; browser initialisation failed: '+result.stderr.decode('utf-8',errors='replace')[-5000:])
            continue
        # Identity/date/content validation remains fatal; never seek another PDF
        # after a successful transport returned an incompatible document.
        return result.stdout, url
    reject(str(last_error))



def collect_one(share, now, fetch=download):
    body, url = download_document(share, fetch)
    return complement(parse_document(body, {**share, 'sourceUrl': url}, now), share, now, fetch)


def complement(result, share, now, fetch):
    if not share.get('pageUrl'): return result
    from collect_vaneck_allocations import collect
    try:
        result['sectors'] = collect(share, now, fetch)
        result['unavailable'] = [s for s in result['unavailable'] if not s.startswith('sectors:')]
    except Exception as error:
        result.setdefault('collectionErrors', []).append({'field': 'sectors', 'reason': str(error)})
    return result
