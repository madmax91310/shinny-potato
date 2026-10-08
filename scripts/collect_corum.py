"""CORUM documents: discover current annual report and note on official product pages."""
import datetime as dt
import pathlib
import re
import subprocess
import tempfile
import urllib.parse
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
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
    annual = latest([u for u in links if re.search(r'rapport annuel\s+'+re.escape(name.lower())+r'\s+'+str(today.year-1),decoded(u))])
    note = latest([u for u in links if name.lower() in decoded(u) and 'note d information' in decoded(u)])
    return annual,note


def parse_annual(text, today):
    block = required(r'Évolution du prix de la part\s+(.*?)Variation du prix de la part',text).group(1)
    years = [int(v) for v in required(r'^((?:20\d{2}\s+){4}20\d{2})',block.strip()).group(1).split()]
    if years[:3] != [today.year-1,today.year-2,today.year-3]:raise ValueError('Annual distribution periods changed')
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
    annual_url,note_url=documents(fetch(base+'/documents').decode(),name,today)
    annual_data=fetch(annual_url);annual=pdf_text(annual_data);note=pdf_text(fetch(note_url))
    required(re.escape(name),annual);required(re.escape(name),note)
    fees=BeautifulSoup(fetch(base+'/frais'),'html.parser').get_text(' ',strip=True)
    countries,sectors=parse_annual_allocations(bbox_pages(annual_data))
    as_of=f'{today.year-1}-12-31'
    price,conditions=parse_conditions(note,id_,fees)
    product=BeautifulSoup(fetch(base),'html.parser').get_text(' ',strip=True)
    advertised=number(required(r'Prix de la part\s+([\d ]+)\s*€',product).group(1))
    if advertised != price['value']: raise ValueError('Product price differs from official note')
    return {'id':id_,'name':name,'sourceUrl':base,'checkedAt':today.isoformat(),
            'snapshot':{'asOf':as_of,'dateNote':'Répartition du dernier rapport annuel complet ; les bulletins trimestriels ne sont pas utilisés pour ces tableaux.',
                        'countries':countries,'sectors':sectors,'sourceUrls':[annual_url]},
            'annual':{'years':parse_annual(annual,today),'sourceUrl':annual_url},
            'price':{**price,'sourceUrl':note_url},'conditions':{**conditions,'sourceUrl':note_url}}
