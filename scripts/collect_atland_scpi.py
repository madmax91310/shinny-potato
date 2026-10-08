"""Épargne Pierre: completed bulletin, annual distributions and the share split."""
import datetime as dt
import re
from bs4 import BeautifulSoup
from collect_scpi import fetch, pdf_text, required, number
from collect_corum import bbox_pages
from collect_extended_scpi import document_links, latest, metric, counter, phrase, percentages, allocation

PRODUCTS={'epargne-pierre':('Épargne Pierre','https://atland-voisin.com/scpi/epargne-pierre/')}


def parse_epargne(text,pages,annual,url,annual_url,today,product_html):
    compact=re.sub(r'\s+',' ',text).replace('\x07','')
    required(r'SCPI Épargne Pierre',compact)
    date=required(r'Le profil du patrimoine au (\d{2})/(\d{2})/(\d{4})',compact)
    as_of=dt.date(int(date[3]),int(date[2]),int(date[1])).isoformat()
    page=next(p for p in pages if any(w['text']=='GÉOGRAPHIQUE' for w in p['words']))
    regions=allocation(page['words'],['Paris','Nord','Nord-Ouest','Nord-Est','Sud-Ouest','Sud-Est'],lambda w:200<w['x']<390 and 110<w['y']<280,True,30)
    regions[0]['label']='Paris et Île-de-France'
    required(r'Les acquisitions sont localisées en France',compact)
    required(r'Hors VEFA non livrées',compact)
    sectors=[]
    words=[w for w in page['words'] if w['x']<195 and 110<w['y']<280]
    values=percentages(words)
    for label in ['Bureaux','Commerces','Tourisme / Hôtel','Activités / Entrepôts','Santé / Education','Résidentiel / Alternatif']:
        found=phrase(words,label)
        if len(found)!=1:raise ValueError('Ambiguous Épargne Pierre sector')
        w=found[0];weights=[v for v in values if abs(w['y']-v['y'])<5 and 0<w['x']-v['right']<20]
        if len(weights)!=1:raise ValueError('Missing sector weight')
        sectors.append({'label':label,'value':weights[0]['value']})
    if abs(sum(r['value'] for r in regions)-100)>.15:raise ValueError('Incomplete French regional allocation')
    split=required(r'division par dix du prix de part, passant de ([\d,.]+) € à ([\d,.]+) € à compter du 1er juillet',compact)
    old,price=number(split[1]),number(split[2])
    required(r'multiplication par dix du nombre de parts détenues',compact)
    if abs(old/10-price)>.001:raise ValueError('Inconsistent share split')
    year=int(required(r'prix de souscription d.une part depuis le 1er juillet (20\d{2})',compact)[1])
    effective=f'{year}-07-01'
    if dt.date.fromisoformat(effective)>today:raise ValueError('Future price not current')
    required(r'prix de souscription d.une part depuis le 1er juillet '+str(year),compact)
    minimum=int(required(r'(\d+) parts lors de la 1ère souscription',compact)[1])
    entry=number(required(r'\(soit ([\d,.]+)\s*% TTC\)',compact)[1])
    product=re.sub(r'\s+',' ',BeautifulSoup(product_html,'html.parser').get_text(' ',strip=True))
    management=number(required(r'Commission de gestion ([\d,.]+)\s*% TTC du montant total des recettes brutes encaissées',product)[1])
    published=number(required(r'Prix de souscription \(dont [\d,.]+% TTC de commission\) ([\d,.]+)\s*€',product)[1])
    if published!=price:raise ValueError('Product price differs from bulletin')
    # Both the standard rule and its explicitly dated temporary exception are published.
    required(r'Au 1er jour du 6ème mois',compact)
    required(r'1er février '+str(year)+r' et le 31 décembre '+str(year),compact)
    required(r'jouissance au premier jour du mois suivant',compact)
    enjoyment=f'Premier jour du mois suivant la souscription et son règlement, pour les souscriptions du 01/02/{year} au 31/12/{year} ; règle habituelle : premier jour du 6e mois.'
    if today>dt.date(year,12,31):enjoyment='Premier jour du 6e mois suivant la souscription et son règlement.'
    future=int(required(r'À partir de janvier (20\d{2}), les revenus potentiels seront distribués mensuellement',compact)[1])
    required(r'à compter de janvier prochain.*?chaque mois, et non plus.*?chaque trimestre',compact)
    frequency='mensuels' if today>=dt.date(future,1,1) else 'trimestriels'
    info=next(p for p in pages if any(w['text']=='ACTIFS' for w in p['words']))
    assets=counter(info['words'],'ACTIFS',lambda w:w['y']>300)
    tenants=counter(info['words'],'LOCATAIRES',lambda w:w['y']>300)
    tof=number(required(r'taux d.occupation financier s.établit à ([\d,.]+)\s*%',compact)[1])
    block=required(r'Évolution du prix de la part\s+(.*?)❯ Taux de distribution\(1\)([^\n]+)',annual)
    periods=[int(y) for y in required(r'(20\d{2}\s+20\d{2}\s+20\d{2}\s+20\d{2}\s+20\d{2})',block[1])[1].split()]
    if periods!=list(range(today.year-1,today.year-6,-1)):raise ValueError('Changed annual periods')
    rates=[number(v) for v in re.findall(r'([\d,.]+)\s*%',block[2])]
    prices=[number(v) for v in required(r'Prix de souscription \(si augmentation de capital\)([^\n]+)',block[1])[1].split()]
    if len(rates)!=5 or len(prices)!=5 or any(v != (old if y < year else price) for y,v in zip(periods,prices)):raise ValueError('Annual columns or split basis changed')
    history=[{'asOf':f'{y}-12-31','value':v} for y,v in zip(periods,prices)]
    history=sorted(history,key=lambda r:r['asOf'])[-3:]
    history=sorted(history+[{'asOf':effective,'value':price}],key=lambda r:r['asOf'])
    action={'asOf':effective,'ratio':10,'oldPrice':old,'newPrice':price,'sourceUrl':url,
            'description':f'Division du prix de part par dix le 01/07/{year}, avec multiplication par dix des parts détenues : le passage de {old:g} € à {str(f'{price:g}').replace('.',',')} € ne représente pas une baisse de valeur du placement.'}
    return {'snapshot':{'asOf':as_of,'countries':[{'label':'France','value':100}],'regions':regions,'sectors':sectors,'sourceUrls':[url],
                        'dateNote':'Valeurs vénales hors VEFA non livrées ; exposition française détaillée par régions dans le bulletin.'},
            'portfolio':{'buildings':metric(assets,as_of,url,'Actifs immobiliers'),'tenants':metric(tenants,as_of,url,'Locataires'),
                         'occupancy':metric(tof,as_of,url,'Taux d’occupation financier','Inclut des locaux sous franchise et des locaux non disponibles à la location selon la méthode du bulletin.')},
            'annual':{'years':sorted([{'year':y,'distribution':v} for y,v in zip(periods[:3],rates[:3])],key=lambda r:r['year']),'sourceUrl':annual_url},
            'price':{'value':price,'asOf':effective,'sourceUrl':url},
            'priceHistory':{'years':history,'corporateActions':[action],'sourceUrls':[annual_url,url],'dateNote':action['description']+' Les prix antérieurs sont ceux publiés avant cette division.'},
            'conditions':{'minimum':minimum*price,'enjoyment':enjoyment,'frequency':frequency,'subscriptionFee':entry,'subscriptionTax':'TTC','managementFee':management,'managementTax':'TTC',
                          'managementBasis':'recettes brutes encaissées','exit':'Prix de retrait diminué de la commission de souscription HT ; contrepartie nécessaire et délai de revente non garanti.',
                          'otherFees':f'Commissions de cession et de travaux distinctes ; distributions mensuelles annoncées à compter de janvier {future}.',
                          'sourceUrl':url,'sourceUrls':[url,PRODUCTS['epargne-pierre'][1]]}}


def collect(id_,today):
    name,base=PRODUCTS[id_];html=fetch(base).decode();links=document_links(html,base)
    url=latest(links,r'BPI(?P<quarter>[1-4])T(?P<year>\d{4})-EP-',today)
    annual_url=next(u for u in links if re.search(r'RA_Epargne_Pierre_'+str(today.year-1)+r'_',u))
    data=fetch(url)
    return {'id':id_,'name':name,'sourceUrl':base,'checkedAt':today.isoformat(),**parse_epargne(pdf_text(data),bbox_pages(data),pdf_text(fetch(annual_url)),url,annual_url,today,html)}
