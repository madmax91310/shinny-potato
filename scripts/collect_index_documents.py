"""Parse dated MSCI and FTSE index factsheets without using ETF portfolios as indices."""
import datetime as dt
import re
from data_automation import UTC, reject
from issuer_documents import document_date, bounded_return, validated_rows, proof, pdf_text

SECTOR_LABELS = {
 'Information Technology':'💻 Technologie','Financials':'🏦 Finance','Industrials':'🏭 Industrie',
 'Health Care':'🏥 Santé','Consumer Discretionary':'🛍️ Consommation cyclique',
 'Consumer Staples':'🛒 Consommation de base','Communication Services':'📡 Communication',
 'Energy':'⚡ Énergie','Materials':'🪨 Matériaux','Utilities':'💡 Services publics',
 'Real Estate':'🏠 Immobilier','Technology':'💻 Technologie','Telecommunications':'📡 Communication',
 'Basic Materials':'🪨 Matériaux', 'Other':'🌍 Autres',
}
COUNTRY_LABELS = {'USA':'🇺🇸 États-Unis','UK':'🇬🇧 Royaume-Uni','United States':'🇺🇸 États-Unis','Japan':'🇯🇵 Japon','United Kingdom':'🇬🇧 Royaume-Uni',
 'China':'🇨🇳 Chine','Taiwan':'🇹🇼 Taïwan','Korea':'🇰🇷 Corée du Sud','South Korea':'🇰🇷 Corée du Sud',
 'France':'🇫🇷 France','Germany':'🇩🇪 Allemagne','Canada':'🇨🇦 Canada','Switzerland':'🇨🇭 Suisse',
 'India':'🇮🇳 Inde','Brazil':'🇧🇷 Brésil','Australia':'🇦🇺 Australie','Other':'🌍 Autres','Mexico':'🇲🇽 Mexique','Chile':'🇨🇱 Chili','Peru':'🇵🇪 Pérou','Colombia':'🇨🇴 Colombie'}


def normalized(value):
    return re.sub(r'[^a-z0-9]', '', value.lower().replace('index', ''))


def identity(text, name):
    # Only the principal title on the first page identifies the factsheet;
    # a benchmark appearing in a performance comparison is insufficient.
    titles = [line.strip().split('    ')[0] for line in text.splitlines()[:14] if line.strip()]
    titles = [re.sub(r'\s+(?:Index )?\((?:USD|EUR|JPY|HKD)\)$', '', t) for t in titles]
    titles += [' '.join(titles[i:i+2]) for i in range(len(titles)-1)]
    target = normalized(name)
    if not any(normalized(title) == target for title in titles):
        reject('Official index factsheet identity mismatch: ' + name)


def msci_composition(text, config, now):
    identity(text, config.get('documentName', config['name']))
    dates = re.findall(r'(?:^|\f)([A-Z]{3} \d{1,2}, \d{4})[ \t]+Index Factsheet', text, re.M)
    if not dates or len(set(dates)) != 1:
        reject('Missing or inconsistent MSCI snapshot date')
    stamp = document_date(dates[0], now)
    if 'SECTOR WEIGHTS' not in text or 'TOP 10 CONSTITUENTS' not in text:
        reject('Missing MSCI composition table headings')
    section = text.split('SECTOR WEIGHTS', 1)[1].split('\f', 1)[0]
    # Legend labels are explicit text; never read values from the plotted pie labels.
    legend = '\n'.join(line for line in section.splitlines() if 'msci.com' not in line and re.search(r'[A-Za-z].*\d+(?:\.\d+)?%', line))
    legend = re.sub(r' {2,}', ' | ', legend)
    pairs = re.findall(r'([A-Za-z][A-Za-z /&\-]{0,80}?) +(\d+(?:\.\d+)?)%', legend)
    sectors, countries = [], []
    for name, value in pairs:
        name = name.strip()
        row = {'name': name, 'weightPct': float(value)}
        (sectors if name in SECTOR_LABELS and name != 'Other' else countries).append(row)
    validated_rows(sectors)
    if not countries and config.get('countryScope') and config['countryScope']['proof'] in text:
        countries = [{'name': config['countryScope']['name'], 'weightPct': 100.0}]
    validated_rows(countries)
    count = re.search(r'With ([\d,]+) constituents', text)
    if not count:
        count = re.search(r'Number of\s+([\d,]+)', text)
    if not count:
        reject('MSCI constituent count missing')
    block = text.split('TOP 10 CONSTITUENTS', 1)[1].split('FACTORS -', 1)[0]
    has_cap = 'Float Adj Mkt' in block[:600]
    holdings = []
    for line in block.splitlines():
        cells = re.split(r' {2,}', line.strip())
        if len(cells) >= 4 and re.fullmatch(r'[\d,]+\.\d+', cells[-3]) and re.fullmatch(r'\d+\.\d+', cells[-2]):
            name = cells[-5] if re.fullmatch(r'[A-Z]{2}', cells[-4]) else cells[-4]
            if name != 'Total':
                holdings.append({'name': name, 'weightPct': float(cells[-2] if has_cap else cells[-3].replace(',', ''))})
    if len(holdings) != 10:
        reject('MSCI top-ten table incomplete')
    validated_rows(holdings, complete=False)
    return {'index': config['name'], 'asOf': stamp, 'constituents': int(count[1].replace(',', '')),
        'countries': [[COUNTRY_LABELS.get(r['name'], r['name']), r['weightPct']] for r in countries],
        'sectors': [[SECTOR_LABELS[r['name']], r['weightPct']] for r in sectors],
        'holdings': [[r['name'], r['weightPct']] for r in holdings]}


def msci_returns(text, config, now):
    identity(text, config.get('documentName', config['name']))
    currency = config['returnCurrency']; variant = config['returnVariant']
    if not re.search(r'CUMULATIVE INDEX PERFORMANCE\s*[—–-]\s*'+variant+r' RETURNS \('+currency+r'\)', text):
        reject('MSCI index return currency or variant mismatch')
    block = text.split('ANNUAL PERFORMANCE (%)',1)[1].split('INDEX PERFORMANCE',1)[0]
    years = []
    for line in block.splitlines():
        m = re.search(r'(?:^|\s{2,})(20\d{2})\s+(-?\d+\.\d+)\s',line)
        if m:
            year = int(m[1])
            if year >= now.year or year in [p[0] for p in years]:
                reject('Duplicate or unfinished MSCI calendar year')
            if year >= 2020:
                years.append([year, bounded_return(float(m[2]))])
    if not any(all(year in [p[0] for p in years] for year in range(end-4,end+1)) for end in range(now.year-1,2024,-1)):
        reject('Missing MSCI completed calendar years')
    return sorted(years, reverse=True)


ICB_INDUSTRIES = {'10':'Technology','15':'Telecommunications','20':'Health Care','30':'Financials',
    '35':'Real Estate','40':'Consumer Discretionary','45':'Consumer Staples','50':'Industrials',
    '55':'Basic Materials','60':'Energy','65':'Utilities'}


def ftse_composition(text, config, now):
    identity(text, config.get('documentName',config['name']))
    dates = re.findall(r'Data as at:\s*(\d+ [A-Za-z]+ \d{4})', text)
    if not dates or len(set(dates)) != 1:reject('Missing or inconsistent FTSE snapshot date')
    stamp = document_date(dates[0], now)
    heading=next((h for h in ['ICB Industry Breakdown','ICB Supersector Breakdown','ICB Subsector Breakdown','Property Sector Breakdown'] if h in text),None)
    if not heading:reject('No qualified numerical FTSE sector table')
    block=text.split(heading,1)[1].split('\f',1)[0]
    sectors={};count=None
    for line in block.splitlines():
        if heading=='Property Sector Breakdown':
            m=re.match(r'\s*([A-Za-z /]+?)\s{2,}([\d,]+)\s+([\d,]+)\s+(\d+\.\d+)',line)
            if m and m[1].strip():sectors[m[1].strip()]=float(m[4])
            continue
        m=re.match(r'\s*(\d{2,8})\s+(.+)',line)
        if not m:continue
        fields=re.findall(r'(?:^|\s{2,})([\d,]+(?:\.\d+)?)\b',m[2])
        if len(fields)<2:continue
        weight=next((float(n)for n in fields if '.' in n),None)
        label=ICB_INDUSTRIES.get(m[1][:2])
        if weight is None or not label:reject('Unqualified ICB sector code or weight')
        sectors[label]=round(sectors.get(label,0)+weight,2)
    rows=[{'name':k,'weightPct':v}for k,v in sectors.items()];validated_rows(rows)
    countries=[]
    if 'Country/Market Breakdown'in text:
        block=text.split('Country/Market Breakdown',1)[1].split('\f',1)[0]
        for line in block.splitlines():
            m=re.match(r'\s*([A-Za-z ()/\-.]+?)\s{2,}([\d,]+)\s+(.+)',line)
            if not m or not m[1].strip():continue
            name=m[1].strip();numbers=re.findall(r'-?\d[\d,]*(?:\.\d+)?',m[3])
            weight=next((float(n)for n in numbers if '.'in n),None)
            if weight is None:continue
            if name in ('Total','Totals'):
                count=int(m[2].replace(',',''));break
            else:countries.append({'name':name,'weightPct':weight})
    if not countries and config.get('countryScope') and config['countryScope']['proof']in text:
        countries=[{'name':config['countryScope']['name'],'weightPct':100.0}]
        m=re.search(r'Totals\s+([\d,]+)\s+[\d,]+\s+100\.00',block)
        if m:count=int(m[1].replace(',',''))
    validated_rows(countries)
    if not count:reject('FTSE constituent count missing')
    holding_heading=config.get('holdingHeading','Top 10 Constituents')
    holdings=[];block=text.split(holding_heading,1)[1].split(heading,1)[0]
    block=re.split(r'^\s*Totals?\s', block, maxsplit=1, flags=re.M)[0];lines=block.splitlines()
    for i,line in enumerate(lines):
        cells=re.split(r' {2,}',line.strip())
        if len(cells)<3 or cells[0]in ('Totals','Total'):continue
        weight=next((float(c)for c in cells[1:]if re.fullmatch(r'\d+\.\d+',c)),None)
        if weight is None:continue
        name=cells[0]
        if name in COUNTRY_LABELS:
            # A long issuer name wraps around its country/sector row.
            before=re.split(r' {2,}',lines[i-1].strip())[0] if i else ''
            after=re.split(r' {2,}',lines[i+1].strip())[0] if i+1<len(lines)else ''
            if not before or not after:reject('Wrapped FTSE issuer name missing')
            name=before+' '+after
        holdings.append({'name':name,'weightPct':weight})
    if len(holdings)!=config.get('holdingCount',10):reject('FTSE principal holdings table incomplete')
    validated_rows(holdings,complete=False)
    return {'index':config['name'],'asOf':stamp,'constituents':count,'sectorMethod':heading,
      'countries':[[COUNTRY_LABELS.get(r['name'],r['name']),r['weightPct']]for r in countries],
      'sectors':[[SECTOR_LABELS.get(r['name'],r['name']),r['weightPct']]for r in rows],
      'holdings':[[r['name'],r['weightPct']]for r in holdings]}


def ftse_returns(text,config,now):
    identity(text,config.get('documentName',config['name']))
    if config['returnVariant'] not in ('TOTAL','NET') or 'Year-on-Year Performance - Total Return' not in text:
        reject('FTSE return variant not qualified')
    block=text.split('Year-on-Year Performance - Total Return',1)[1].split('\f',1)[0]
    if not re.search(r'Index\s*%?\s*\('+config['returnCurrency']+r'\)',block):reject('FTSE return currency mismatch')
    lines=block.splitlines()
    header=next((i for i,l in enumerate(lines) if len(re.findall(r'20\d{2}',l))>=5),None)
    if header is None:reject('FTSE calendar-year header missing')
    years=re.findall(r'20\d{2}',lines[header])
    name=config.get('returnRowName',config.get('documentName',config['name']))
    if config['returnVariant']=='NET':name += ' Net of Tax'
    values=None
    for i in range(header+1,len(lines)):
        label=re.split(r' {2,}',lines[i].strip())[0]
        if not label or not (label == name or name.startswith(label+' ')):continue
        if label != name and re.search(r'-?\d+\.\d+', lines[i]):continue
        for j in range(i,min(i+3,len(lines))):
            parts=re.findall(r'-?\d+\.\d+',lines[j])
            if len(parts)==len(years):
                # Wrapped titles must be present alongside their exact numerical row.
                labels=' '.join(re.split(r' {2,}',l.strip())[0] for l in lines[i:min(i+4,len(lines))] if l.strip() and not re.match(r'-?\d',l.strip()))
                if label==name or normalized(name) in normalized(labels):values=parts;break
        if values is not None:break
    if values is None or len(set(years))!=len(years) or any(int(y)>=now.year for y in years):reject('Invalid FTSE calendar-year row')
    return sorted([[int(y),bounded_return(float(v))]for y,v in zip(years,values)if int(y)>=2020],reverse=True)
