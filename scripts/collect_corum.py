"""CORUM documents: discover current annual report and note on official product pages."""
import datetime as dt
import pathlib
import re
import subprocess
import tempfile
import urllib.parse
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from publication_periods import completed_year, latest_annual
from collect_scpi import fetch, pdf_text, number, required

PRODUCTS = {'corum-origin': ('CORUM Origin','corum-origin'), 'corum-xl': ('CORUM XL','corum-xl'), 'corum-eurion': ('CORUM Eurion','eurion')}
COUNTRIES = ['Pays-Bas','Italie','Irlande','Espagne','Finlande','Belgique','France','Allemagne','Lituanie','Slovénie','Portugal','Estonie','Lettonie','Royaume-Uni','Pologne','Canada','Suède','Norvège','Danemark','États-Unis','Autriche']
SECTORS = {'Industriel':'Industriel et logistique','Parking':'Parkings','Bureau':'Bureaux','Commerce':'Commerces','Hôtellerie':'Hôtellerie','Logistique':'Logistique','Activité':'Activités','Santé':'Santé','Éducation':'Éducation et loisirs','Education':'Éducation et loisirs'}
MONTHS = {'janvier':1,'février':2,'mars':3,'avril':4,'mai':5,'juin':6,'juillet':7,'août':8,'septembre':9,'octobre':10,'novembre':11,'décembre':12}


def documents(html, name, today):
    links = list(dict.fromkeys(urllib.parse.urljoin('https://www.corum.fr', a['href']) for a in BeautifulSoup(html,'html.parser').select('a[href]') if '.pdf' in a['href']))
    def decoded(url):return re.sub(r'\s+',' ',urllib.parse.unquote(url)).lower()
    def latest(candidates):
        valid=[]
        for url in candidates:
            m=required(r'/files/(\d{4})-(\d{2})/',url)
            stamp=dt.date(int(m[1]),int(m[2]),1)
            if stamp<=today:valid.append((stamp,url))
        if not valid:raise ValueError('Missing current official document')
        return max(valid,key=lambda r:r[0])[1]
    annual, _ = latest_annual(links, r'rapport annuel\s+'+re.escape(name)+r'\s+(?P<year>20\d{2})', today)
    note = latest([u for u in links if name.lower() in decoded(u) and 'note d information' in decoded(u)])
    return annual,note


def parse_annual(text, today):
    block = required(r'Évolution du prix de la part\s+(.*?)Variation du prix de la part',text).group(1)
    years = [int(v) for v in required(r'^((?:20\d{2}\s+){4}20\d{2})',block.strip()).group(1).split()]
    completed_year(years, today, count=5)
    if years != sorted(years, reverse=True):raise ValueError('Annual distribution columns changed')
    line = required(r'Taux de distribution\[\d+\]\s*([^\n]+)',block).group(1)
    rates = [number(v) for v in re.findall(r'([\d,.]+)\s*%',line)]
    if len(rates)!=len(years):raise ValueError('Annual rates do not match columns')
    return sorted([{'year':year,'distribution':value} for year,value in zip(years,rates)][:3],key=lambda r:r['year'])


def bbox_pages(data):
    with tempfile.TemporaryDirectory() as d:
        path=pathlib.Path(d)/'report.pdf';path.write_bytes(data)
        xml=subprocess.check_output(['pdftotext','-bbox-layout',str(path),'-'],timeout=60)
    root=ET.fromstring(re.sub(rb"[\x00-\x08\x0b\x0c\x0e-\x1f]", b"", xml));pages=[]
    for page in root.iter():
        if page.tag.split('}')[-1]!='page':continue
        words=[{'text':w.text or '', 'x':float(w.attrib['xMin']), 'right':float(w.attrib['xMax']), 'y':float(w.attrib['yMin'])} for w in page.iter() if w.tag.split('}')[-1]=='word']
        pages.append({'width':float(page.attrib['width']),'words':words})
    return pages


def parse_annual_allocations(pages):
    page=next((p for p in pages if any(w['text']=='géographique' for w in p['words']) and any(w['text']=='TYPOLOGIQUE' for w in p['words'])),None)
    if not page:raise ValueError('Missing annual allocation page')
    words=page['words'];width=page['width']
    heading=next(w for w in words if w['text']=='géographique')
    labels=[w for w in words if w['text'] in COUNTRIES and w['x']<width*.30 and heading['y']<w['y']<heading['y']+300]
    def percentages(region):
        output=[]
        for pct in region:
            if pct['text']!='%':continue
            candidates=[w for w in region if abs(w['y']-pct['y'])<1 and re.fullmatch(r'[\d,.]+',w['text']) and 0<pct['x']-w['right']<45]
            if candidates:
                nearest=max(candidates,key=lambda w:w['right']);output.append({**pct,'numberX':nearest['x'],'value':number(nearest['text'])})
        return output
    country_values=percentages([w for w in words if w['x']<width*.31 and heading['y']+20<w['y']<heading['y']+310])
    countries=[]
    for label in labels:
        candidates=[v for v in country_values if abs(v['y']-label['y'])<4 and v['x']>label['right']]
        if not candidates:raise ValueError('Missing country weight: '+label['text'])
        # Some reports retain an earlier chart label underneath the updated one.
        # The rendered end-of-bar label is the rightmost aligned percentage.
        value=max(candidates,key=lambda v:v['x'])['value']
        countries.append({'label':label['text'],'value':value})
    sector_labels=[w for w in words if w['text'] in SECTORS and w['x']>width*.72 and w['y']<700]
    sector_values=percentages([w for w in words if w['x']>width*.72 and 120<w['y']<650])
    sectors=[]
    for label in sector_labels:
        candidates=[v for v in sector_values if 5<label['y']-v['y']<65 and abs(v['numberX']-label['x'])<5]
        if not candidates:raise ValueError('Missing sector weight: '+label['text'])
        value=min(candidates,key=lambda v:label['y']-v['y'])['value']
        sectors.append({'label':SECTORS[label['text']],'value':value})
    return countries,sectors


def parse_annual_portfolio(text, year, url):
    page=next((p for p in text.split('\f') if 'LE PROFIL' in p and 'nombre de locataires' in p),None)
    if not page:raise ValueError('Missing annual property summary')
    compact=re.sub(r'\s+',' ',page);date=f'{year}-12-31'
    def observation(value,label,basis=None):
        return {'value':value,'label':label,'asOf':date,'sourceUrl':url,**({'basis':basis} if basis else {})}
    buildings=int(required(r'(\d+) nombre d.immeubles',compact)[1])
    tenants=int(required(r'(\d+) nombre de locataires',compact)[1])
    occupancy=number(required(r'Taux d.occupation.{0,180}?([\d,.]+)\s*%',compact)[1])
    required(r'y compris les locaux sous franchise de loyer',compact)
    return {'buildings':observation(buildings,'Immeubles'),'tenants':observation(tenants,'Locataires'),
            'occupancy':observation(occupancy,'Taux d’occupation financier','Inclut les locaux sous franchise de loyer ; distinct de l’occupation physique.')}


def parse_annual_price_history(text, today, url):
    block=required(r'Évolution du prix de la part\s+(.*?)Dividende brut',text)[1]
    years=[int(y) for y in required(r'^((?:20\d{2}\s+){4}20\d{2})',block.strip())[1].split()]
    completed_year(years, today, count=5)
    if years != sorted(years, reverse=True):raise ValueError('Annual price columns changed')
    values=re.findall(r'([\d,. ]+)\s*€',required(r'Prix de souscription au 31/12([^\n]+)',block)[1])
    if len(values)!=len(years):raise ValueError('Price columns do not match')
    return {'years':sorted([{'asOf':f'{y}-12-31','value':number(v)} for y,v in zip(years,values)],key=lambda r:r['asOf']), 'sourceUrl':url}


def parse_eurion_quarterly(text,pages,url,today):
    from collect_extended_scpi import allocation,counter,metric
    required(r'CORUM Eurion',text)
    stamp=required(r'DONNÉES AU (\d+) (\w+) (\d{4})',text)
    date=dt.date(int(stamp[3]),MONTHS[stamp[2].lower()],int(stamp[1])).isoformat()
    if dt.date.fromisoformat(date)>today:raise ValueError('Future quarterly publication')
    page=next(p for p in pages if any(w['text']=='typologique' for w in p['words']) and any(w['text']=='géographique' for w in p['words']))
    words=page['words']
    sector_labels={'Bureau*':'Bureaux','Hôtellerie':'Hôtellerie','Industriel':'Industriel et logistique','Commerce':'Commerces','Éducation':'Éducation et loisirs'}
    sectors=allocation(words,list(sector_labels),lambda w:280<w['y']<330,True,25)
    for r in sectors:r['label']=sector_labels[r['label']]
    countries=[]
    for label in [w for w in words if w['text'] in COUNTRIES and w['x']<100 and 380<w['y']<620]:
        found=[]
        for pct in words:
            if pct['text']!='%' or pct['x']>300 or abs(pct['y']-label['y'])>2:continue
            values=[v for v in words if re.fullmatch(r'[\d,.]+',v['text']) and abs(v['y']-pct['y'])<5 and 0<pct['x']-v['right']<15]
            if values:found.append(number(max(values,key=lambda v:v['right'])['text']))
        if len(found)!=1:raise ValueError('Ambiguous quarterly country weight: '+label['text'])
        countries.append({'label':label['text'],'value':found[0]})
    if abs(sum(r['value'] for r in countries)-100)>.15 or abs(sum(r['value'] for r in sectors)-100)>.15:raise ValueError('Incomplete quarterly allocation')
    compact=re.sub(r'\s+',' ',text)
    occupancy=number(required(r'FINANCIER \(TOF\).{0,600}?([\d,.]+)\s*%',compact)[1])
    portfolio={'buildings':metric(counter(words,'Nombre d’immeubles',lambda w:w['y']<210),date,url,'Immeubles'),
               'tenants':metric(counter(words,'Nombre de locataires',lambda w:w['y']<210),date,url,'Locataires'),
               'occupancy':metric(occupancy,date,url,'Taux d’occupation financier','Inclut les locaux sous franchise de loyer ; distinct du taux physique.')}
    return {'asOf':date,'countries':countries,'sectors':sectors,'sourceUrls':[url],'dateNote':'Répartitions extraites du dernier bulletin trimestriel officiel.'},portfolio


def origin_occupancy(html, today, url):
    """Use only the dated TOF block; nearby undated counts keep their annual source."""
    soup=BeautifulSoup(html,'html.parser')
    matches=[]
    for title in soup.select('.assets-title'):
        heading=title.get_text(' ',strip=True)
        match=re.fullmatch(r'Des immeubles loués à ([\d,.]+)\s*%',heading,re.I)
        if not match:continue
        block=title.find_parent(class_='row').parent
        text=block.get_text(' ',strip=True)
        required(r'Taux d.Occupation Financier',text)
        stamp=required(r'au (\d{2})/(\d{2})/(\d{4})',text)
        date=dt.date(int(stamp[3]),int(stamp[2]),int(stamp[1]))
        if date>today:raise ValueError('Future CORUM occupancy date')
        matches.append({'value':number(match[1]),'asOf':date.isoformat(),'sourceUrl':url,'label':'Taux d’occupation financier',
                        'basis':'Loyers facturés rapportés aux loyers théoriques si tous les immeubles étaient loués ; méthode de la page officielle, distincte de l’occupation physique.'})
    if len(matches)!=1:raise ValueError('Missing/ambiguous dated CORUM Origin TOF')
    return matches[0]


def parse_conditions(text, id_, fee_page):
    compact=re.sub(r'\s+',' ',text)
    required(r'au moins une \(1\) part sociale',compact)
    price=required(r'fixer le prix de souscription de la part à ([\d ,]+) € (?:à compter du|depuis le) (\d+)(?:er)? (\w+) (\d{4})',compact)
    effective=dt.date(int(price[4]),MONTHS[price[3].lower()],int(price[2])).isoformat()
    value=number(price[1])
    entry=number(required(r'commission de souscription de ([\d,.]+)\s*%\s*TT[IC] du prix de souscription',compact).group(1))
    management=number(required(r'perçoit une commission de gestion de ([\d,.]+)\s*%\s*TTC',compact).group(1))
    month=required(r'entrée en jouissance est fixée.{0,100}au 1er jour du (\d+)ème mois suivant la souscription',compact).group(1)
    required(r'produits locatifs HT encaissés et les produits financiers nets',compact)
    required(r'dividendes.{0,100}mensuellement',fee_page)
    conditions={'minimum':value,'enjoyment':f'Premier jour du {month}e mois suivant la souscription et son règlement.',
                'frequency':'mensuels','subscriptionFee':entry,'managementFee':management,'managementTax':'TTC',
                'managementBasis':'produits locatifs HT encaissés et produits financiers nets',
                'exit':'Prix de retrait égal au prix de souscription diminué de la commission de souscription ; rachat non garanti.',
                'otherFees':'Commissions possibles lors de la vente des immeubles ; conditions détaillées dans la note d’information.'}
    required(r'prix de souscription.*?diminué de la commission de souscription',compact)
    if id_=='corum-xl':
        outside=number(required(r'zone euro et de ([\d,.]+)\s*%\s*TTC.{0,180}hors zone euro',compact).group(1))
        conditions['managementZones']={'euro':management,'outside':outside}
    return {'value':value,'asOf':effective},conditions


def collect(id_,today):
    name,slug=PRODUCTS[id_];base='https://www.corum.fr/nos-scpi/'+slug
    documents_html=fetch(base+'/documents').decode()
    annual_url,note_url=documents(documents_html,name,today)
    annual_data=fetch(annual_url);annual=pdf_text(annual_data);note=pdf_text(fetch(note_url))
    required(re.escape(name),annual);required(re.escape(name),note)
    fees=BeautifulSoup(fetch(base+'/frais'),'html.parser').get_text(' ',strip=True)
    countries,sectors=parse_annual_allocations(bbox_pages(annual_data))
    annual_year = max(r['year'] for r in parse_annual(annual,today))
    linked_year=int(required(r'rapport annuel\s+'+re.escape(name)+r'\s+(20\d{2})',urllib.parse.unquote(annual_url))[1])
    if annual_year!=linked_year:raise ValueError('Annual URL and published columns disagree')
    as_of=f'{annual_year}-12-31'
    price,conditions=parse_conditions(note,id_,fees)
    product=BeautifulSoup(fetch(base),'html.parser').get_text(' ',strip=True)
    advertised=number(required(r'Prix de la part\s+([\d ]+)\s*€',product).group(1))
    if advertised != price['value']: raise ValueError('Product price differs from official note')
    portfolio=parse_annual_portfolio(annual,annual_year,annual_url)
    snapshot={'asOf':as_of,'dateNote':'Répartition du dernier rapport annuel complet ; les bulletins trimestriels ne sont pas utilisés pour ces tableaux.', 'countries':countries,'sectors':sectors,'sourceUrls':[annual_url]}
    if id_=='corum-origin':
        url=base+'/patrimoine'
        observation=origin_occupancy(fetch(url).decode(),today,url)
        if observation['asOf']>=portfolio['occupancy']['asOf']:portfolio['occupancy']=observation
    if id_=='corum-eurion':
        from collect_extended_scpi import document_links, latest
        url=latest(document_links(documents_html,base),r'CORUM Eurion.*?(?P<year>\d{4})-T(?P<quarter>[1-4])\.pdf',today)
        data=fetch(url)
        snapshot,portfolio=parse_eurion_quarterly(pdf_text(data),bbox_pages(data),url,today)
    return {'id':id_,'name':name,'sourceUrl':base,'checkedAt':today.isoformat(),
            'snapshot':snapshot, 'portfolio':portfolio, 'priceHistory':parse_annual_price_history(annual,today,annual_url),
            'annual':{'years':parse_annual(annual,today),'sourceUrl':annual_url},
            'price':{**price,'sourceUrl':note_url},'conditions':{**conditions,'sourceUrl':note_url}}
