"""Public issuer documents for Transitions Europe and ActivImmo."""
import calendar
import datetime as dt
import re
import urllib.parse
from bs4 import BeautifulSoup
from publication_periods import completed_year, latest_annual
from collect_scpi import fetch, pdf_text, required, number
from collect_corum import bbox_pages
PRODUCTS={'transitions-europe':('Transitions Europe','https://www.arkea-reim.com/immobilier/pa_89367/scpi-transitions-europe'), 'activimmo':('ActivImmo','https://alderan.fr/scpi-activimmo/')}


def phrase(words, label):
    """Locate a complete phrase on a PDF line, retaining its horizontal extent."""
    tokens=label.split();result=[]
    for w in words:
        if w['text']!=tokens[0]:continue
        row=sorted([v for v in words if abs(v['y']-w['y'])<1 and v['x']>=w['x']-.1],key=lambda v:v['x'])
        if [v['text'] for v in row[:len(tokens)]]==tokens:
            result.append({**w,'right':row[len(tokens)-1]['right']})
    return result


def percentages(words):
    rows=[]
    for w in words:
        m=re.fullmatch(r'([\d,.]+)%',w['text'])
        if m:rows.append({**w,'value':number(m[1])});continue
        if w['text']!='%':continue
        nearby=[v for v in words if abs(v['y']-w['y'])<1 and re.fullmatch(r'[\d,.]+',v['text']) and 0<w['x']-v['right']<12]
        if nearby:
            n=max(nearby,key=lambda v:v['right']);rows.append({**n,'right':w['right'],'value':number(n['text'])})
    return rows


def allocation(words, labels, region, above, distance):
    filtered=[w for w in words if region(w)];values=percentages(filtered);result=[]
    for label in labels:
        found=phrase(filtered,label)
        if len(found)!=1:raise ValueError('Missing/ambiguous allocation label: '+label)
        w=found[0];center=(w['x']+w['right'])/2
        candidates=[v for v in values if 0<(w['y']-v['y'] if above else v['y']-w['y'])<distance and abs((v['x']+v['right'])/2-center)<40]
        if not candidates:raise ValueError('Missing allocation weight: '+label)
        v=min(candidates,key=lambda v:abs((v['x']+v['right'])/2-center)+abs(v['y']-w['y'])*.2)
        result.append({'label':label,'value':v['value']})
    return result


def end_date(text, pattern):
    m=required(pattern,text);d=dt.date(int(m[3]),int(m[2]),int(m[1]));return d.isoformat()


def metric(value, date, url, label, basis=None):
    return {'value':value,'asOf':date,'sourceUrl':url,'label':label,**({'basis':basis} if basis else {})}


def counter(words, label, region, above=True):
    found=phrase([w for w in words if region(w)],label)
    if len(found)!=1:raise ValueError('Missing/ambiguous portfolio count: '+label)
    w=found[0];center=(w['x']+w['right'])/2
    candidates=[v for v in words if re.fullmatch(r'\d+',v['text']) and 0<(w['y']-v['y'] if above else v['y']-w['y'])<60 and abs((v['x']+v['right'])/2-center)<70]
    if not candidates:raise ValueError('Missing portfolio count: '+label)
    return int(min(candidates,key=lambda v:abs(v['y']-w['y'])+abs((v['x']+v['right'])/2-center)*.5)['text'])


def parse_transitions(text,pages,note,url,today):
    required(r'SCPI Transitions\s+Europe',text)
    date=end_date(text,r'Bulletin d’information (\d{2})/(\d{2})/(\d{4})')
    page=next(p for p in pages if any(w['text']=='typologique' for w in p['words']))
    words=page['words'];width=page['width']
    countries=allocation(words,['Espagne','Allemagne','Pays-Bas','Irlande','Italie','Pologne','Belgique'],lambda w:width*.39<w['x']<width*.63 and 350<w['y']<470,True,30)
    sectors=allocation(words,['Bureaux','Commerce','Logistique','Life Science','Hospitalité','Activité','Éducation'],lambda w:width*.10<w['x']<width*.36 and 350<w['y']<470,True,30)
    compact=re.sub(r'\s+',' ',text)
    fees=compact.split('Informations générales Frais',1)[1]
    price=number(required(r'Prix de souscription ([\d,.]+) €',fees)[1])
    minimum=int(required(r'Première souscription : (\d+) parts',fees)[1])
    entry=number(required(r'Commission de.{0,100}?([\d,.]+)\s*% HT max.',fees)[1])
    gestione=number(required(r'Commission.{0,100}?([\d,.]+)\s*% HT max. des loyers',fees)[1])
    required(r'Délai de jouissance 1er jour du 6ème mois',fees);required(r'Fréquence de distribution potentielle Trimestrielle',fees)
    n=re.sub(r'\s+',' ',note)
    management=number(required(r'commission perçue.{0,100}?([\d,.]+)% HT maximum.*?totalité des produits',n)[1])
    if management!=gestione:raise ValueError('Management tariff differs between note and bulletin')
    required(r'locatifs exigibles et encaissés hors taxes et hors charges refacturées aux locataires et des produits financiers nets',n)
    perf=required(r'Performances passées(.*?)Activité locative',text)[1] if 'Performances passées' in text else text
    line=required(r'([\d.]+)\s*%\s+([\d.]+)\s*%\s+([\d.]+)\s*%\s+Taux de distribution',perf)
    years_line=required(r'\b(20\d{2})\s+(20\d{2})\s+(20\d{2})\s+À retenir',perf)
    years=[int(years_line[i]) for i in range(1,4)]
    completed_year(years,today,count=3)
    if years!=sorted(years):raise ValueError('Annual distribution columns changed')
    annual=[{'year':y,'distribution':number(line[i+1])} for i,y in enumerate(years)]
    portfolio={}
    label=phrase([w for w in words if w['x']<width*.65], 'Nombre d’actifs')[0]
    count=next(w for w in words if re.fullmatch(r'\d+',w['text']) and abs(w['y']-label['y'])<4 and label['right']<w['x']<label['right']+100)
    portfolio['buildings']=metric(int(count['text']),date,url,'Actifs immobiliers')
    activity=next(p for p in pages if any(w['text']=='locative' for w in p['words']) and any(w['text']=='(TOF)' for w in p['words']))
    portfolio['tenants']=metric(counter(activity['words'],'Nombre de locataires',lambda w:w['x']<width*.6,False),date,url,'Locataires')
    occ=number(required(r'\(TOF\)\s+.*?([\d,.]+)\s*%\*',text)[1])
    required(r'garanties locatives',compact)
    portfolio['occupancy']=metric(occ,date,url,'Taux d’occupation financier','Inclut les garanties locatives de certaines surfaces vacantes ; distinct du taux physique.')
    price_row=required(r'Prix de part\s+([\d,.]+) €\s+([\d,.]+) €\s+([\d,.]+) €',text)
    history={'years':[{'asOf':f'{y}-12-31','value':number(price_row[i+1])} for i,y in enumerate(years)],'sourceUrl':url}
    return {'snapshot':{'asOf':date,'countries':countries,'sectors':sectors,'sourceUrls':[url]},'annual':{'years':annual,'sourceUrl':url},'price':{'value':price,'asOf':date,'sourceUrl':url},'priceHistory':history,'portfolio':portfolio,
            'conditions':{'minimum':minimum*price,'enjoyment':'Premier jour du 6e mois suivant la souscription.','frequency':'trimestriels','subscriptionFee':entry,'subscriptionTax':'HT','subscriptionFeeMax':True,'managementFee':management,'managementTax':'HT','managementFeeMax':True,'managementBasis':'produits locatifs exigibles et encaissés HT hors charges refacturées et produits financiers nets','exit':'Prix de retrait minoré de la commission de souscription HT ; rachat soumis aux conditions de liquidité.','otherFees':'Commissions possibles sur les travaux et cessions ; détail dans la note d’information.','sourceUrl':url,'sourceUrls':[url]}}


def parse_activimmo(text,pages,annual,note,price_note,url,annual_url,note_url,price_url,today):
    required(r'ACTIVIMMO',text)
    date=end_date(text,r'PATRIMOINE\s+AU (\d{2})\.(\d{2})\.(\d{4})')
    page=next(p for p in pages if any(w['text']=='TYPOLOGIQUE' for w in p['words']))
    countries=allocation(page['words'],['Allemagne','Espagne','France','Irlande','Italie','Pays-Bas','Portugal'],lambda w:w['x']>280 and 380<w['y']<415,True,20)
    sectors=allocation(page['words'],['Entrepôt logistique','Locaux d’activités','Logistique urbaine','Transport','Autres'],lambda w:w['x']<250 and 235<w['y']<400,False,50)
    n=re.sub(r'\s+',' ',note);p=re.sub(r'\s+',' ',price_note)
    effective=required(r'compter du (\d+)(?:er)? juillet (\d{4})',p)
    price_date=dt.date(int(effective[2]),7,int(effective[1])).isoformat()
    if dt.date.fromisoformat(price_date)>today:raise ValueError('Future price annex')
    price=number(required(r'\(([\d,.]+) €\) par part',p)[1])
    entry=number(required(r'commission de souscription incluse.*?([\d,.]+)% hors taxes',p)[1])
    management=number(required(r'Gestion perçoit définitivement.*?([\d,.]+)% HT',n)[1])
    required(r'loyers et produits financiers nets',n);required(r'mai 2026.*?sera d’une \(1\) part',n)
    required(r'premier jour du sixième mois',n)
    required(r'versement d’un dividende mensuel',annual)
    a=re.sub(r'\s+',' ',annual)
    periods = [int(y) for y in required(r'((?:20\d{2}\s+){4}20\d{2})',a)[1].split()]
    completed_year(periods,today,count=5)
    if periods != sorted(periods):raise ValueError('Annual columns changed')
    header=r'\s+'.join(map(str,periods))
    block=required('('+header+r'.*?)Report à nouveau cumulé par part',a)[1]
    values=required(r'Taux de distribution sur valeur de marché\s+([\d,.]+)%\s+([\d,.]+)%\s+([\d,.]+)%\s+([\d,.]+)%\s+([\d,.]+)%',block)
    years=[{'year':y,'distribution':number(values[i+1])} for i,y in enumerate(periods)][-3:]
    annual_year=completed_year([r['year'] for r in years],today,count=3)
    occ=number(required(r'([\d,.]+)% TOF',text)[1]);required(r'hors développements',text);required(r'indemnité de résiliation anticipée',text)
    activity=next(p for p in pages if any(w['text']=='LOCATIF' for w in p['words']))
    portfolio={'occupancy':metric(occ,date,url,'Taux d’occupation financier','Hors développements ; inclut une indemnité de résiliation anticipée. Ce taux n’est pas un taux physique.'), 'tenants':metric(counter(activity['words'],'locataires',lambda w:w['x']>page['width']*.55 and w['y']<400),date,url,'Locataires')}
    assets=int(required(r'constitué un portefeuille de (\d+) actifs',a)[1])
    portfolio['buildings']=metric(assets,f'{annual_year}-12-31',annual_url,'Actifs immobiliers')
    price_values=required(r'Prix de souscription au 1er janvier.*?([\d,.]+)€\s+([\d,.]+)€\s+([\d,.]+)€\s+([\d,.]+)€\s+([\d,.]+)€',block)
    history={'years':[{'asOf':f'{y}-01-01','value':number(price_values[i+1])} for i,y in enumerate(periods)][-3:]+[{'asOf':price_date,'value':price}],'sourceUrl':annual_url,'sourceUrls':[annual_url,price_url],'dateNote':'Rapport : prix au 1er janvier de chaque année ; dernière valeur issue de l’annexe tarifaire.'}
    return {'snapshot':{'asOf':date,'countries':countries,'sectors':sectors,'sourceUrls':[url]},'annual':{'years':years,'sourceUrl':annual_url},'price':{'value':price,'asOf':price_date,'sourceUrl':price_url},'priceHistory':history,'portfolio':portfolio,
            'conditions':{'minimum':price,'enjoyment':'Premier jour du 6e mois suivant la souscription et son règlement.','frequency':'mensuels','subscriptionFee':entry,'subscriptionTax':'HT','managementFee':management,'managementTax':'HT','managementBasis':'recettes locatives HT et produits financiers nets','exit':'Prix de retrait égal au prix de souscription moins la commission de souscription HT ; revente non garantie.','otherFees':'Commissions complémentaires possibles ; TVA récupérée par la SCPI selon la note d’information.','sourceUrl':note_url,'sourceUrls':[note_url,price_url]}}


def document_links(html,base):
    return list(dict.fromkeys(urllib.parse.urljoin(base,a['href']) for a in BeautifulSoup(html,'html.parser').select('a[href]') if '.pdf' in a['href']))


def latest(urls,pattern,today):
    selected=[]
    for url in urls:
        m=re.search(pattern,urllib.parse.unquote(url),re.I)
        if m:
            year=int(m['year']);month=int(m['quarter'])*3 if m.groupdict().get('quarter') else int(m['semester'])*6
            date=dt.date(year,month,calendar.monthrange(year,month)[1])
            if date<=today:selected.append((date,url))
    if not selected:raise ValueError('Missing official completed-period bulletin')
    return max(selected)[1]


def collect(id_,today):
    name,base=PRODUCTS[id_]
    links=document_links(fetch(base if id_=='transitions-europe' else 'https://alderan.fr/scpi-documentation/').decode(),'https://www.arkea-reim.com/' if id_=='transitions-europe' else base)
    if id_=='transitions-europe':
        url=latest(links,r'te_(?:t(?P<quarter>\d)|s(?P<semester>\d))[-_](?P<year>\d{4})',today)
        note_url=next(u for u in links if 'note_d_information' in u)
        pdf=fetch(url);result=parse_transitions(pdf_text(pdf),bbox_pages(pdf),pdf_text(fetch(note_url)),url,today)
        result['conditions']['sourceUrls'].append(note_url)
    else:
        url=latest(links,r'BTI-T(?P<quarter>\d)-(?P<year>\d{4})-ActivImmo',today)
        annual_url,_=latest_annual(links,r'Rapport-annuel-(?P<year>20\d{2})-ActivImmo',today)
        note_url=next(u for u in links if 'Note-dinformation-SCPI-ActivImmo-1' in u)
        price_url=max((u for u in links if 'Modification-des-prix-de-part' in u),key=lambda u:u.rsplit('/',1)[-1])
        pdf=fetch(url);result=parse_activimmo(pdf_text(pdf),bbox_pages(pdf),pdf_text(fetch(annual_url)),pdf_text(fetch(note_url)),pdf_text(fetch(price_url)),url,annual_url,note_url,price_url,today)
        linked_year=int(required(r'Rapport-annuel-(20\d{2})-ActivImmo',annual_url)[1])
        if result['annual']['years'][-1]['year']!=linked_year:raise ValueError('Annual URL and published columns disagree')
    return {'id':id_,'name':name,'sourceUrl':base,'checkedAt':today.isoformat(),**result}
