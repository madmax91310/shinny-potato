"""Refresh the exact INSEE indicators and non-security benchmarks used by the app.

Public official sources only. A family is applied atomically; failures preserve its
previous observations and remain visible. Publication periods are not check dates.
"""
import argparse
import copy
import datetime as dt
import hashlib
import json
import pathlib
import re
import unicodedata
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from bs4 import BeautifulSoup
from issuer_documents import download, pdf_text

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEST = ROOT / 'src/data/automated-economic.json'
INSEE = 'https://www.insee.fr'
SOURCES = {
    'wealth': ('8672665', 'montants patrimoine ménages', r'^les montants de patrimoine detenus par les menages en \d{4}$'),
    'holdings': ('8569009', 'détention patrimoine ménages', r'^la detention de patrimoine des menages en \d{4}$'),
    'living': ('8967255', 'privation matérielle sociale', r'^(la )?privation materielle et sociale en \d{4}$'),
    'salaries': ('8657156', 'salaires secteur privé', r'^les salaires dans le secteur prive en \d{4}$'),
    'ageWealth': ('8894780', 'montants patrimoine brut âge', r'^montants de patrimoine brut selon differentes caracteristiques$'),
    'ageHoldings': ('2412784', 'taux détention actifs patrimoine', r'^taux de detention des actifs de patrimoine par les menages selon differentes caracteristiques$'),
    'transmissions': ('8960217', 'transmissions intergénérationnelles', r'^transmissions intergenerationnelles$'),
}
SAVINGS_URL = 'https://www.banque-france.fr/fr/a-votre-service/particuliers/connaitre-pratiques-bancaires-assurance/epargne/livret-a'
SAVINGS_ALTERNATIVE = 'https://www.economie.gouv.fr/particuliers/gerer-mon-argent/gerer-mon-budget-et-mon-epargne/tout-savoir-sur-les-produits-depargne'
SAVINGS_PUBLIC = 'https://www.service-public.gouv.fr/particuliers/actualites/A18000'
ASPIM_HOME = 'https://www.aspim.fr/actualites/'
ASPIM_2025 = 'https://www.aspim.fr/actualites/collecte-et-performance-des-fonds-immobiliers-grand-public-au-premier-trimestre-2026-et-principaux-indicateurs-des-scpi-en-2025/'
ACPR = 'https://acpr.banque-france.fr'


def norm(text):
    text = unicodedata.normalize('NFKD', text).replace('’', "'").replace('−', '-').replace('–', '-')
    return ' '.join(''.join(c for c in text if not unicodedata.combining(c)).lower().split())


def number(text):
    value = norm(str(text)).replace(' ', '').replace(',', '.').replace('%', '')
    if not re.fullmatch(r'[+-]?\d+(\.\d+)?', value):
        raise ValueError(f'Observation non numérique : {text!r}')
    return float(value)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def unique(items, message):
    require(len(items) == 1, f'{message} ({len(items)} correspondances)')
    return items[0]


def json_post(url, payload):
    request = urllib.request.Request(url, data=json.dumps(payload).encode(),
        headers={'Content-Type': 'application/json', 'User-Agent': 'EpargnantLibre-Data/1.0'})
    with urllib.request.urlopen(request, timeout=25) as response:
        body = response.read(4_000_001)
    require(len(body) <= 4_000_000, 'Réponse de découverte INSEE trop volumineuse')
    return json.loads(body)


def discover_insee(key):
    initial, query, title_pattern = SOURCES[key]
    # These evergreen figures retain their ID and publish the new survey on the
    # same page. The four annual/periodic publications require actual discovery.
    if key in ('ageWealth', 'ageHoldings', 'transmissions'):
        return f'{INSEE}/fr/statistiques/{initial}'
    response = json_post(f'{INSEE}/fr/solr/consultation', {
        'q': query, 'start': 0, 'rows': 100, 'filters': [],
        'sortFields': [{'field': 'dateDiffusion', 'order': 'desc'}],
    })
    require(response.get('status') == 0 and isinstance(response.get('documents'), list), 'Découverte INSEE invalide')
    candidates = [d for d in response['documents'] if re.fullmatch(title_pattern, norm(d.get('titre', '')))
                  and d.get('diffusion') is True and str(d.get('id', '')).isdigit()]
    require(bool(candidates), f'Publication INSEE introuvable : {key}')
    latest = max(candidates, key=lambda d: int(re.search(r'\d{4}$', norm(d['titre']))[0]))
    return f'{INSEE}/fr/statistiques/{latest["id"]}'


def table_grid(table):
    """Expand rowspan/colspan before selecting named hierarchical columns."""
    grid = []
    occupied = {}
    for r, row in enumerate(table.find_all('tr')):
        cells = {}
        c = 0
        for cell in row.find_all(['th', 'td'], recursive=False):
            while (r, c) in occupied:
                cells[c] = occupied[r, c]
                c += 1
            value = cell.get_text(' ', strip=True)
            for dr in range(int(cell.get('rowspan', 1))):
                for dc in range(int(cell.get('colspan', 1))):
                    occupied[r + dr, c + dc] = value
                    if dr == 0:
                        cells[c + dc] = value
            c += int(cell.get('colspan', 1))
        for (rr, cc), value in occupied.items():
            if rr == r:
                cells[cc] = value
        grid.append([cells.get(i, '') for i in range(max(cells, default=-1) + 1)])
    return grid


def table_value(soup, caption_pattern, row_pattern, column_pattern, column_exclude=None):
    table = unique([t for t in soup.find_all('table') if t.find('caption')
                    and re.search(caption_pattern, norm(t.find('caption').get_text(' ', strip=True)))], 'Table INSEE ambiguë/absente')
    grid = table_grid(table)
    row_index, row = unique([(i, r) for i, r in enumerate(grid) if r and re.search(row_pattern, norm(r[0]))], 'Ligne INSEE ambiguë/absente')
    # Include only actual header rows, rather than previous observations.
    header_count = len(table.find('thead').find_all('tr')) if table.find('thead') else 1
    headers = [' '.join(norm(r[i]) for r in grid[:header_count] if i < len(r)) for i in range(len(row))]
    indices = [i for i, h in enumerate(headers) if i > 0 and re.search(column_pattern, h)
               and not (column_exclude and re.search(column_exclude, h))]
    col = unique(indices, f'Colonne INSEE ambiguë/absente : {column_pattern}')
    caption = table.find('caption').get_text(' ', strip=True)
    years = re.findall(r'\b20\d{2}\b', norm(caption).split('lecture')[0])
    if not years:
        years = re.findall(r'\b20\d{2}\b', ' '.join(headers))
    require(bool(years), 'Période absente du tableau INSEE')
    return number(row[col]), max(map(int, years)), caption


def paragraph_value(soup, pattern):
    matches = []
    for p in soup.find_all('p'):
        text = norm(p.get_text(' ', strip=True))
        found = re.search(pattern, text)
        if found:
            matches.append((number(found['value']), text))
    return unique(matches, 'Phrase INSEE ambiguë/absente')


def parse_households(key, body, url, today):
    soup = BeautifulSoup(body, 'html.parser')
    text = norm(soup.get_text(' ', strip=True))
    title = soup.title.get_text(' ', strip=True).split(' - Insee')[0].strip()
    published = soup.select_one('.date-diffusion')
    publication_date = re.search(r'\b(\d{2})/(\d{2})/(\d{4})\b',published.get_text(' ',strip=True) if published else '')
    require(publication_date is not None,'Date de publication INSEE absente')
    published_at = dt.date(int(publication_date[3]),int(publication_date[2]),int(publication_date[1])).isoformat()
    require(published_at <= today,'Publication INSEE future')
    require('insee' in norm(soup.title.get_text()), 'Publication hors INSEE')
    require(('france hors mayotte' in text or 'france, secteur prive' in text or key == 'salaries'
             or (key == 'living' and 'france metropolitaine' in text)), 'Champ géographique INSEE absent/incompatible')
    expected_scope = 'france metropolitaine' if key == 'living' else 'france hors mayotte'
    patterns = {'wealth': r'^figure 1 ', 'holdings': r'^figure (1a|2|3c) ', 'living': r'^figure 3 ',
                'ageWealth': r'^montants de patrimoine brut selon l.age',
                'ageHoldings': r'^taux de detention.*(selon l.age|categorie socioprofessionnelle)',
                'transmissions': r'.*'}
    if key in patterns:
        selected = [t for t in soup.find_all('table') if t.caption and re.search(patterns[key], norm(t.caption.get_text(' ', strip=True)))]
        require(bool(selected), 'Tableaux de référence absents')
        for table in selected:
            figure = table.find_parent('figure')
            require(figure is not None and expected_scope in norm(figure.get_text(' ', strip=True)),
                    'Champ géographique du tableau modifié/absent')
    records = {}
    def add(id_, value, year, table, second=None):
        require(2010 <= year <= int(today[:4]), 'Période INSEE future/invalide')
        require(0 <= value <= (10_000_000 if 'wealth' in id_ or 'salary' in id_ else 100), f'Valeur hors limites : {id_}')
        if second is not None:
            require(0 <= second <= 100, 'Comparaison INSEE hors limites')
        records[id_] = {'value': value, 'year': year, 'referencePeriod': str(year) if key == 'salaries' else f'Début {year}',
                        'checkedAt': today, 'sourceUrl': url, 'sourceTitle': title, 'sourceKey': key, 'publishedAt': published_at, 'table': table,
                        'population': 'salariés' if key == 'salaries' else 'personnes' if key == 'living' else 'ménages',
                        'provisional': key == 'living' and bool(re.search(r'provisoir', text)),
                        'sha256': hashlib.sha256(body).hexdigest()}
        if second is not None:
            records[id_]['secondValue'] = second
    def field(id_, table, row, column, exclude=None):
        v, y, caption = table_value(soup, table, row, column, exclude)
        add(id_, v, y, caption)
        return v, y, caption
    if key == 'wealth':
        field('wealth-top10', r'^figure 1 ', r'^9 .*decile', r'^patrimoine net$')
        field('wealth-median', r'^figure 1 ', r'^mediane', r'^patrimoine net$')
        v, paragraph = paragraph_value(soup, r"l'autre moitie n'en possede que (?P<value>[\d,.]+) %")
        year = int(unique(re.findall(r'debut (20\d{2})', paragraph), 'Période patrimoine'))
        require('patrimoine brut' in paragraph and 'la moitie la mieux dotee' in paragraph, 'Classement patrimoine modifié')
        add('wealth-share', v, year, 'Part du patrimoine brut détenue par la moitié la moins dotée')
    elif key == 'holdings':
        for id_, row in [('homeowners',r'^residence principale'),('debt',r'^endettement$'),('retirement-savings',r'^epargne retraite$'),('other-homes',r'^autres logements$')]:
            table = unique([t for t in soup.find_all('table') if t.find('caption') and re.search(r'^figure 1a ',norm(t.find('caption').get_text(' ',strip=True)))], 'Table détention France')
            years = re.findall(r'\b20\d{2}\b', table.find('caption').get_text(' ',strip=True).split('Lecture')[0])
            field(id_,r'^figure 1a ',row,rf'^{max(map(int,years))}$')
        product = r'^figure 2 '
        for id_, row in [('lep',r'^livret.*\(lep\)'),('ldds',r'^livret.*\(ldds'),('pel',r'^plan epargne logement'),('employee-savings',r'^epargne salariale$')]:
            field(id_,product,row,r'^taux de detention$')
        first = table_value(soup,product,r'^livret a ou bleu$',r'^taux de detention$')
        second = table_value(soup,product,r'^assurance-vie$',r'^taux de detention$')
        require(first[1] == second[1], 'Périodes livret/assurance incompatibles')
        add('livret-assurance', *first, second=second[0])
        for id_, pattern in [('pea',r'(?P<value>[\d,.]+) % (?:des menages detiennent )?un plan d.epargne en actions'),
                             ('cto',r'(?P<value>[\d,.]+) % des menages detiennent un compte.titres ordinaire')]:
            v, p = paragraph_value(soup, pattern)
            require('menages' in p, 'Population PEA/CTO absente')
            year = first[1]
            add(id_,v,year,'Texte : détention du PEA' if id_ == 'pea' else 'Texte : détention du CTO')
        a = table_value(soup,r'^figure 3c ',r'^ensemble$',r'^immobilier$')
        b = table_value(soup,r'^figure 3c ',r'^ensemble$',r'^pret.*consommation')
        require(a[1] == b[1], 'Périodes crédits incompatibles')
        add('debt-types',*a,second=b[0])
    elif key == 'living':
        rows = [('unexpected-expense',r'^faire face a une depense non prevue de 1 000 euros$'),('holidays',r'^se payer une semaine de vacances'),
                ('heating',r'^chauffer suffisamment'),('bills-on-time',r'^payer a temps'),('personal-spending',r'^depenser une petite somme'),('protein-meals',r'^manger de la viande')]
        table = unique([t for t in soup.find_all('table') if t.find('caption') and re.search(r'^figure 3 ',norm(t.find('caption').get_text(' ',strip=True)))], 'Table privations')
        year = max(int(x) for x in table_grid(table)[0] if re.fullmatch(r'20\d{2}', x))
        for id_, row in rows:
            v, _, caption = table_value(soup,r'^figure 3 ',row,rf'^{year}$')
            add(id_,v,year,caption)
    elif key == 'salaries':
        require('equivalent temps plein' in text and 'secteur prive' in text and 'apprentis' in text and 'stagiaires' in text,
                'Champ des salaires EQTP modifié')
        for id_, row in [('salary-top10',r'^9 .*decile'),('salary-median',r'^mediane')]:
            field(id_,r'^figure 3 ',row,r'ensemble .*en euros\)',r'evolution')
    elif key == 'ageWealth':
        field('young-wealth',r'^montants de patrimoine brut selon l.age',r'^moins de 30 ans$',r'^mediane$')
        field('thirties-wealth',r'^montants de patrimoine brut selon l.age',r'^de 30 a 39 ans$',r'^9 .*decile$')
    elif key == 'ageHoldings':
        field('young-homeowners',r'^taux de detention.*selon l.age',r'^moins de 30 ans$',r'^residence principale$')
        a = table_value(soup,r'^taux de detention.*categorie socioprofessionnelle',r'^cadres \(autre',r'^valeurs mobilieres$')
        b = table_value(soup,r'^taux de detention.*categorie socioprofessionnelle',r'^ouvriers$',r'^valeurs mobilieres$')
        add('securities-workers',*a,second=b[0])
    elif key == 'transmissions':
        year = int(unique(sorted(set(re.findall(r'debut (20\d{2})',norm(soup.find('table').find('caption').get_text(' ',strip=True))))), 'Période transmissions'))
        for id_, pattern in [('inheritance',r'(?P<value>[\d,.]+) % des menages ont deja herite'),('donation',r'(?P<value>[\d,.]+) % des menages ont deja recu une donation')]:
            v,_ = paragraph_value(soup,pattern)
            add(id_,v,year,'Au moins un membre du ménage concerné au cours de sa vie')
    return records


MONTHS = {'janvier':1,'fevrier':2,'mars':3,'avril':4,'mai':5,'juin':6,'juillet':7,'aout':8,'septembre':9,'octobre':10,'novembre':11,'decembre':12}
def parse_savings(body, today):
    soup = BeautifulSoup(body,'html.parser')
    require(soup.title and norm(soup.title.get_text()).startswith('livret a'), 'Page hors Livret A')
    text = norm(soup.get_text(' ',strip=True))
    found = unique(re.findall(r'elle est de (\d+(?:[,.]\d+)?) % depuis le (\d+)(?:er)? (\w+) (20\d{2})',text), 'Taux légal Livret A absent/ambigu')
    rate,day,month,year = found
    date = dt.date(int(year),MONTHS[month],int(day)).isoformat()
    require(date <= today and date.endswith('-01'), 'Date d’effet Livret A future/incompatible')
    require(0 <= number(rate) <= 20, 'Taux Livret A hors limites')
    return {'effectiveAt':date,'rate':number(rate),'checkedAt':today,'sourceUrl':SAVINGS_URL,'sha256':hashlib.sha256(body).hexdigest()}


def parse_ministry_savings(body, today):
    soup = BeautifulSoup(body, 'html.parser')
    heading = unique([h for h in soup.find_all(['h2','h3']) if norm(h.get_text(' ',strip=True)) == 'le livret a'], 'Section Livret A absente/ambiguë')
    parts = []
    for node in heading.next_siblings:
        if node.name == heading.name:
            break
        if hasattr(node, 'get_text'):
            parts.append(node.get_text(' ',strip=True))
    text = norm(' '.join(parts))
    date_rate = unique(re.findall(r'taux de remuneration\s*:\s*depuis le (\d+)\s*(?:er)? (\w+) (20\d{2}), le taux est fixe a (\d+(?:[,.]\d+)?) %', text), 'Taux légal ministériel absent/ambigu')
    day, month, year, rate = date_rate
    date = dt.date(int(year), MONTHS[month], int(day)).isoformat()
    require(date <= today and date.endswith('-01') and 0 <= number(rate) <= 20, 'Date/taux ministériel invalide')
    return {'effectiveAt': date, 'rate': number(rate), 'checkedAt': today, 'sourceUrl': SAVINGS_ALTERNATIVE, 'sha256': hashlib.sha256(body).hexdigest()}


def parse_public_savings(body, today):
    soup = BeautifulSoup(body,'html.parser')
    require(soup.title and 'livret a' in norm(soup.title.get_text()), 'Page Service Public hors Livret A')
    text = norm(soup.get_text(' ',strip=True))
    found = unique(re.findall(r"a compter du (\d+)\s*(?:er)? (\w+) (20\d{2}), le taux d.interet annuel du livret a est fixe a (\d+(?:[,.]\d+)?) %",text), 'Taux Service Public absent/ambigu')
    day,month,year,rate = found
    date = dt.date(int(year),MONTHS[month],int(day)).isoformat()
    require(date <= today and date.endswith('-01') and 0 <= number(rate) <= 20, 'Date/taux Service Public invalide')
    return {'effectiveAt':date,'rate':number(rate),'checkedAt':today,'sourceUrl':SAVINGS_PUBLIC,'sha256':hashlib.sha256(body).hexdigest()}


def collect_savings(today):
    errors=[]
    for url,parse,fetch in [(SAVINGS_URL,parse_savings,official_download),
                            (SAVINGS_ALTERNATIVE,parse_ministry_savings,official_download),
                            (SAVINGS_PUBLIC,parse_public_savings,download)]:
        try:
            return parse(fetch(url),today)
        except Exception as error:
            errors.append(f'{url}: {error}')
    raise ValueError('; '.join(errors))


def parse_funds_euros(body, source_url, today):
    text = norm(pdf_text(body))
    require('contrats individuels' in text and 'avant prelevements sociaux' in text and 'nets de prelevements sur encours' in text,
            'Convention ACPR incompatible')
    found = re.search(r'taux de revalorisation en (20\d{2})\s*:\s*([\d,.]+) %', text)
    require(found is not None, 'Taux annuel ACPR absent')
    year, value = int(found[1]), number(found[2])
    require(year < int(today[:4]) and 0 <= value <= 20, 'Année/taux ACPR invalide')
    # The first summary block explicitly concerns individual contracts. The
    # collective-retirement figure later in the document must never be selected.
    before = text[max(0,found.start()-500):found.start()]
    require('individuel' in before and 'collectif' not in before[-100:], 'Population ACPR ambiguë')
    return {'year':year,'value':value,'checkedAt':today,'sourceUrl':source_url,'method':'ACPR contrats individuels, net de prélèvements sur encours, avant prélèvements sociaux','sha256':hashlib.sha256(body).hexdigest()}


def collect_funds_euros(today, previous):
    discovery_error=None
    try:
        url=discover_acpr()
    except Exception as error:
        # A known report can cover the latest possible complete calendar year.
        # Re-download it rather than interpreting inaccessible catalogues as a
        # failed data download. Once its year is older, discovery is mandatory.
        observations=[o for key,o in previous.items() if key.startswith('fonds_euros:')]
        latest=max(observations,key=lambda o:o['year'],default=None)
        require(latest is not None and latest['year']==int(today[:4])-1,
                f'Découverte ACPR obligatoire pour un nouveau millésime : {error}')
        url=latest['sourceUrl']
        parsed=urllib.parse.urlparse(url)
        require(parsed.scheme=='https' and parsed.hostname=='acpr.banque-france.fr'
                and parsed.path.startswith('/system/files/'), 'URL de rapport ACPR non qualifiée')
        discovery_error=str(error)
    observation=parse_funds_euros(official_download(url),url,today)
    if discovery_error:
        require(observation['year']==int(today[:4])-1,'Rapport de secours ACPR hors dernier millésime complet')
        observation['discoveryStatus']='latest-complete-year-revalidated'
        observation['discoveryNote']='Catalogue indisponible ; dernier millésime annuel complet téléchargé et revalidé sur son URL officielle.'
        print('ACPR : catalogue indisponible ; PDF officiel du dernier millésime annuel complet revalidé.',flush=True)
    return observation


def official_download(url, max_bytes=8_000_000):
    # Use standard public-page negotiation on Banque de France / ACPR Drupal.
    # Other collectors retain their existing document request conventions.
    try:
        return download(url, max_bytes=max_bytes, headers={
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
            'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,*/*;q=0.8',
        })
    except Exception as error:
        raise ValueError(f'{url}: {error}') from error


def discover_acpr_sitemap():
    ns = {'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
    index = ET.fromstring(official_download(ACPR+'/sitemap.xml'))
    maps = [x.text for x in index.findall('s:sitemap/s:loc',ns)]
    require(0 < len(maps) <= 20 and all(u.startswith(ACPR+'/sitemaps/') for u in maps), 'Plan ACPR incompatible')
    def entries(url):
        tree = ET.fromstring(official_download(url,max_bytes=4_000_000))
        return [x.text for x in tree.findall('s:url/s:loc',ns)]
    with ThreadPoolExecutor(max_workers=4) as pool:
        urls = [u for group in pool.map(entries,maps) for u in group]
    matches = [(int(re.search(r'revalorisation-(20\d{2})',u)[1]),u) for u in urls
               if u.startswith(ACPR+'/fr/') and re.search(r'revalorisation-(20\d{2})-des-contrats',u)]
    require(bool(matches),'Rapport annuel ACPR introuvable')
    year,url = max(matches)
    page = BeautifulSoup(official_download(url),'html.parser')
    pdfs = sorted({urllib.parse.urljoin(ACPR,a['href']) for a in page.find_all('a',href=True)
                   if re.search(r'AS\d+_revalorisation_'+str(year)+r'\.pdf$',a['href'],re.I)})
    return unique(pdfs,'PDF revalorisation ACPR ambigu/absent')


def discover_acpr():
    errors = []
    catalogues = [ACPR+'/fr/publications-et-statistiques/etudes-et-recherche',
                  ACPR+'/fr/publications-et-statistiques/etudes-et-recherche?page=0',
                  ACPR+'/fr/publications-acpr',
                  ACPR+'/fr/publications-acpr/etudes-et-recherches/analyses-et-syntheses']
    for catalogue in catalogues:
        try:
            soup = BeautifulSoup(official_download(catalogue), 'html.parser')
            links = {urllib.parse.urljoin(ACPR, a['href']) for a in soup.find_all('a',href=True)}
            matches = [(int(re.search(r'revalorisation-(20\d{2})',u)[1]),u) for u in links
                       if u.startswith(ACPR+'/fr/') and re.search(r'revalorisation-(20\d{2})-des-contrats',u)]
            require(bool(matches), 'Rapport annuel absent du catalogue ACPR')
            year, url = max(matches)
            page = BeautifulSoup(official_download(url), 'html.parser')
            pdfs = sorted({urllib.parse.urljoin(ACPR,a['href']) for a in page.find_all('a',href=True)
                           if urllib.parse.urljoin(ACPR,a['href']).startswith(ACPR+'/system/files/')
                           and re.search(r'AS\d+_revalorisation_'+str(year)+r'\.pdf$',a['href'],re.I)})
            return unique(pdfs,'PDF ACPR ambigu/absent')
        except Exception as error:
            errors.append(str(error))
    try:
        return discover_acpr_sitemap()
    except Exception as error:
        raise ValueError('; '.join(errors+[str(error)])) from error


def parse_scpi(body,url,today):
    text = norm(BeautifulSoup(body,'html.parser').get_text(' ',strip=True))
    headings = re.findall(r'rendement global immobilier (20\d{2})\s*:\s*([+\-]?[\d,.]+) %',text)
    require(bool(headings),'Rendement global immobilier annuel absent')
    year = max(int(y) for y,_ in headings)
    value = number(unique([v for y,v in headings if int(y)==year],'RGI ambigu'))
    require(year < int(today[:4]) and -100 < value < 100,'RGI annuel invalide')
    require('variation de la valeur de realisation' in text and 'taux de distribution' in text
            and 'des scpi' in text,'Convention RGI absente')
    return {'year':year,'value':value,'checkedAt':today,'sourceUrl':url,
            'method':'ASPIM rendement global immobilier, taux de distribution + variation de la valeur de réalisation par part',
            'sha256':hashlib.sha256(body).hexdigest()}


def collect_scpi(today):
    # Search the official WordPress catalogue; discover the next annual release,
    # including a revision that has a different URL from the initial release.
    page = BeautifulSoup(download(ASPIM_HOME),'html.parser')
    urls = {ASPIM_2025}
    for a in page.find_all('a',href=True):
        url = urllib.parse.urljoin(ASPIM_HOME,a['href'])
        if url.startswith(ASPIM_HOME) and ('performance' in url or 'indicateurs' in url):
            urls.add(url)
    # The public search includes previous pages beyond the latest news listing.
    search = BeautifulSoup(download('https://www.aspim.fr/?s='+urllib.parse.quote('rendement global immobilier')),'html.parser')
    for a in search.find_all('a',href=True):
        url = urllib.parse.urljoin(ASPIM_HOME,a['href'])
        if url.startswith(ASPIM_HOME) and ('performance' in url or 'indicateurs' in url):
            urls.add(url)
    require(len(urls)<=30,'Catalogue ASPIM trop large')
    observations=[]
    for url in sorted(urls):
        body=download(url)
        text=norm(BeautifulSoup(body,'html.parser').get_text(' ',strip=True))
        if re.search(r'rendement global immobilier 20\d{2}\s*:',text):
            observations.append(parse_scpi(body,url,today))
    require(bool(observations),'Publication annuelle RGI introuvable')
    latest=max(o['year'] for o in observations)
    candidates=[o for o in observations if o['year']==latest]
    require(len({o['value'] for o in candidates})==1,'RGI annuel contradictoire entre publications ASPIM')
    return candidates[0]


def merge(state,family,observations):
    result=copy.deepcopy(state)
    target=result.setdefault(family,{})
    for key,new in observations.items():
        if family=='benchmarks':
            id_=key.split(':')[0]
            latest=max((o['year'] for k,o in target.items() if k.startswith(id_+':')),default=0)
            require(new['year']>=latest,f'Régression de période {id_}')
        old=target.get(key)
        if old and new.get('year',0)<old.get('year',0):
            raise ValueError(f'Régression de période {family}/{key}')
        target[key]=new
    return result


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--apply',action='store_true')
    parser.add_argument('--output',type=pathlib.Path,required=True)
    parser.add_argument('--family',choices=['households','savings','scpi','fonds_euros'])
    args=parser.parse_args()
    today=dt.datetime.now(dt.timezone.utc).date().isoformat()
    state=json.loads(DEST.read_text()) if DEST.exists() else {'schemaVersion':1,'households':{},'savings':{},'benchmarks':{}}
    errors=[]; successes=[]
    jobs=[]
    if args.family in (None,'households'):
        for key in SOURCES:
            def collect(key=key):
                url=discover_insee(key)
                return 'households',parse_households(key,download(url),url,today)
            jobs.append(('insee-'+key,collect))
    if args.family in (None,'savings'):
        jobs.append(('livret-a',lambda:('savings',{'livret_a':collect_savings(today)})))
    if args.family in (None,'fonds_euros'):
        def funds():
            o=collect_funds_euros(today,state.get('benchmarks',{}))
            return 'benchmarks',{'fonds_euros:'+str(o['year']):o}
        jobs.append(('fonds-euros',funds))
    if args.family in (None,'scpi'):
        def scpi():
            o=collect_scpi(today)
            return 'benchmarks',{'scpi:'+str(o['year']):o}
        jobs.append(('scpi',scpi))
    def attempt(job):
        name,collect=job
        try:
            family,observations=collect()
            print(f'{name}: {len(observations)} observations validées',flush=True)
            return name,family,observations,None
        except Exception as error:
            print(f'{name}: ÉCHEC {error}',flush=True)
            return name,None,None,str(error)
    with ThreadPoolExecutor(max_workers=4) as pool:
        for name,family,observations,error in pool.map(attempt,jobs):
            if error:
                errors.append({'id':name,'error':error});continue
            try:
                if family=='savings':
                    current=max(state.get('savings',{}).values(),key=lambda o:o['effectiveAt'],default=None)
                    if current:
                        require(observations['livret_a']['effectiveAt']>=current['effectiveAt'],'Régression du taux légal Livret A')
                    observations={observations['livret_a']['effectiveAt']:observations['livret_a']}
                state=merge(state,family,observations)
                successes.append({'id':name,'count':len(observations)})
            except Exception as e:
                errors.append({'id':name,'error':str(e)})
    if args.apply:
        DEST.write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n')
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps({'checkedAt':today,'successes':successes,'errors':errors},ensure_ascii=False,indent=2)+'\n')
    return 1 if errors else 0


if __name__=='__main__':
    raise SystemExit(main())
