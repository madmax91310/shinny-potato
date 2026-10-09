"""Qualified distributor pages and contract notices outside the Linxea catalogue."""
import datetime as dt
import re
import urllib.parse
from bs4 import BeautifulSoup
from publication_periods import completed_year
from collect_scpi import fetch, pdf_text, number, required
from insurance_literal import nuxt_returns

PRODUCTS = {
    'lucya-cardif': ('Lucya Cardif','Cardif Assurance Vie','Lucya','https://lucya.com/assurance-vie/lucya-cardif/'),
    'placement-direct-vie': ('Placement-direct Vie','SwissLife Assurance et Patrimoine','Placement-direct.fr','https://www.placement-direct.fr/assurance-vie/placement-direct-vie'),
}


def plain(html):
    return re.sub(r'\s+',' ',BeautifulSoup(html,'html.parser').get_text(' ',strip=True)).replace('\x07','')


def identity(html, id_, today):
    name,insurer,distributor,url = PRODUCTS[id_]
    soup=BeautifulSoup(html,'html.parser')
    if not soup.h1 or soup.h1.get_text(' ',strip=True)!=name: raise ValueError('Wrong contract identity')
    required(re.escape(insurer),plain(html))
    return {'id':id_,'name':name,'insurer':insurer,'distributor':distributor,'sourceUrl':url,'checkedAt':today.isoformat()}


def parse_lucya(html, notice, fees_text, notice_url, fees_url, today):
    record=identity(html,'lucya-cardif',today);url=record['sourceUrl'];text=plain(html)
    notice=re.sub(r'\s+',' ',notice).replace('\x07','');fees_text=re.sub(r'\s+',' ',fees_text)
    required(r'Contrat LUCYA CARDIF',fees_text)
    required(r'Lucya Cardif',notice)
    units=number(required(r'Support unités de compte ([\d,.]+)\s*% maximum',fees_text)[1])
    subscription=number(required(r'Frais sur versement ([\d,.]+)\s*% maximum',fees_text)[1])
    arbitrage=number(required(r'Proportionnels ou forfaitaires ([\d,.]+)\s*% maximum',fees_text)[1])
    etf=number(required(r'opérations financières de ([\d,.]+)\s*% s’appliquent.*?de type ETF et actions',text)[1])
    membership=number(required(r'Frais d’adhésion à l’association ayant souscrit le contrat ([\d,.]+)\s*€',fees_text)[1])
    initial=number(required(r'Versement initial ([\d ]+)\s*€ minimum',text)[1])
    free=number(required(r'Versements libres ([\d ]+)\s*€ minimum',text)[1])
    monthly=number(required(r'Versements libres programmés ([\d ]+)\s*€/\s*mois minimum',text)[1])
    count=int(required(r'Plus de ([\d ]+) supports en unités de compte',text)[1].replace(' ',''))
    required(r'OPCVM, ETF, Titres, Immobilier',text)
    ratio=number(required(r'un montant en unités de compte au minimum (deux) fois supérieur',text)[1].replace('deux','2'))
    # Retain the contractual safeguard without assuming the current TME level.
    tme=number(required(r'français publié est inférieur à ([\d,.]+)\s*%',notice)[1])
    cap=number(required(r'affectée à l’ensemble des fonds en euros à ([\d,.]+)\s*% maximum',notice)[1])
    note=f'Cardif peut limiter l’ensemble des fonds euros à {cap:g} % du versement si le TME publié est inférieur à {str(f'{tme:g}').replace('.',',')} % ; voir la notice et les conditions applicables à l’opération.'
    euro=[]
    for name,label,end,fee_pattern,guarantee_pattern in [
        ('Fonds général','Le Fonds général','Le Fonds Euro Private Strategies',r'base de frais de gestion ([\d,.]+)\s*%',r'\(2\) Le Fonds Général.*?garantie annuelle du capital est de ([\d,.]+)\s*%'),
        ('Euro Private Strategies','Le Fonds Euro Private Strategies','Autres supports',r'base de frais de gestion ([\d,.]+)\s*% max',r'\(3\) Le fonds Euro Private Stratégies.*?garantie annuelle du capital est de ([\d,.]+)\s*%'),
    ]:
        card=required(re.escape(label)+r' (.*?)'+re.escape(end),text)[1]
        years=[{'year':int(y),'return':number(v)} for y,v in re.findall(r'(20\d{2}) ([\d,.]+)\s*%\*',card) if int(y)<today.year]
        # The hero rate's year is not adjacent to a rate; only the historical strip is parsed.
        if len(years)!=len({r['year'] for r in years}): raise ValueError('Conflicting Lucya annual strip')
        years=sorted(years,key=lambda r:r['year'])[-3:]
        completed_year([r['year'] for r in years],today)
        management=number(required(fee_pattern,card)[1]);guarantee=number(required(guarantee_pattern,text)[1])
        if abs(guarantee-(100-management))>.001: raise ValueError('Conflicting net guarantee and maximum fees')
        private=name=='Euro Private Strategies'
        euro.append({'name':name,'years':years,'asOf':f'{years[-1]["year"]}-12-31','guarantee':guarantee,'managementFeeMax':management,
                     'maxAllocation':100/(1+ratio) if private else None,'ceiling':None,
                     **({} if private else {'allocationEvidence':{'status':'not-published','checkedAt':today.isoformat(),'sourceUrls':[url,notice_url,fees_url],
                         'reason':'La notice prévoit une affectation euros et/ou unités de compte avec une limitation conditionnelle ; elle ne chiffre pas un maximum actuel inconditionnel propre au Fonds général.'}}),
                     'operations':f'Versements initial et libres : au moins {ratio:g} € en unités de compte non garanties pour 1 € sur ce fonds.' if private else 'Versements initial, libres et programmés ; arbitrages possibles.',
                     'notes':note,'sourceUrl':url,'sourceUrls':[url,notice_url,fees_url]})
    record.update(fees={'subscription':subscription,'arbitrage':arbitrage,'units':units,'etfTrade':etf,'sourceUrl':fees_url,'sourceUrls':[fees_url,notice_url,url],
                       'notes':f'Adhésion UFEP : {membership:g} € à l’ouverture. Les supports immobiliers ont leurs propres frais ; jusqu’à 3 % de sortie/arbitrage sur certaines SCPI détenues moins de trois ans selon la notice.',
                       'membership':membership,'scope':'Gestion libre ; hors frais des supports, garanties optionnelles et gestion déléguée.'},
                  access={'initial':initial,'free':free,'monthly':monthly,'sourceUrl':url},
                  supports={'minimumCount':count,'categories':['OPCVM','ETF','actions en direct','immobilier'],'sourceUrl':url},euroFunds=euro)
    required(r'En cas de rachat partiel ou total dans un délai de 3 ans.*?à 3 % du montant désinvesti du support en unités de compte SCPI',notice)
    return record


def parse_placement(html,notice,fees_text,notice_url,fees_url,today):
    record=identity(html,'placement-direct-vie',today);url=record['sourceUrl'];text=plain(html)
    notice=re.sub(r'\s+',' ',notice).replace('\x07','');fees_text=re.sub(r'\s+',' ',fees_text)
    required(r'Placement-direct Vie',fees_text)
    required(r'Placement-direct Vie',notice)
    subscription=number(required(r'Frais sur versement ([\d,.]+)\s*%',fees_text)[1])
    arbitrage=number(required(r'Frais d’arbitrage libre Proportionnels ou forfaitaires ([\d,.]+)\s*%',fees_text)[1])
    units=number(required(r'Support unités de compte ([\d,.]+)\s*% pour les titres vifs / ([\d,.]+)\s*% Sinon',fees_text)[2])
    shares=number(required(r'Support unités de compte ([\d,.]+)\s*% pour les titres vifs',fees_text)[1])
    management=number(required(r'Support fonds en Euros ([\d,.]+)\s*%',fees_text)[1])
    etf=number(required(r'désinvestissement sur les ETF supporte des frais de ([\d,.]+)\s*%',text)[1])
    initial=number(required(r'Versement initial ([\d ]+)€ Versements libres',text)[1])
    free=number(required(r'Versements libres ([\d ]+)€ Versements programmés',text)[1])
    monthly=number(required(r'Versements programmés ([\d ]+)€/mois',text)[1])
    count=int(required(r'plus de ([\d ]+) supports d’investissement',text)[1].replace(' ',''))
    required(r'300 actions en direct',text)
    soup=BeautifulSoup(html,'html.parser')
    serialized=[s.string for s in soup.select('script') if s.string and s.string.startswith('window.__NUXT__=')]
    if len(serialized)!=1: raise ValueError('Missing official serialized returns')
    publication=nuxt_returns(serialized[0]);required(r'part.*unités de compte.*encours',publication['subtitle'])
    required(r'moins de 250 000€.*plus de 250 000€',text)
    years=[]
    for item in publication['data']:
        if item['year']>=today.year:continue
        if len(item['rows'])!=2 or any(len(rows)!=3 for rows in item['rows']):
            # Older four-tier schedules are outside the three displayed years.
            if item['year']>=today.year-3:raise ValueError('Changed annual rate tiers')
            continue
        tiers=[]
        for encours,rows in zip(['Encours inférieur à 250 000 €','Encours supérieur à 250 000 €'],item['rows']):
            for uc,rate in rows:
                required(r'^Part d’UC ',uc)
                tiers.append({'encours':encours,'condition':uc,'return':rate})
        rates=[r['return'] for r in tiers]
        years.append({'year':item['year'],'returnMin':min(rates),'returnMax':max(rates),'condition':'selon la part d’unités de compte et l’encours du contrat','tiers':tiers})
    years=sorted(years,key=lambda r:r['year'])[-3:]
    published_year=completed_year([r['year'] for r in years],today,count=3)
    advertised=number(required(r'Rendement net en '+str(published_year)+r' Jusqu’à ([\d,.]+)\s*%',text)[1])
    if advertised!=years[-1]['returnMax']:raise ValueError('Advertised maximum differs from published tiers')
    required(r'SwissLife.*limiter temporairement et sans préavis les possibi-? ?lités de sortie du fonds en euros',notice)
    share_trade=number(required(r'sur les actions en direct supporte des frais de ([\d,.]+)\s*%',text)[1])
    guarantee, options = placement_notice_conditions(notice, management)

    record.update(fees={'subscription':subscription,'arbitrage':arbitrage,'units':units,'etfTrade':etf,'sourceUrl':fees_url,'sourceUrls':[fees_url,notice_url,url],
                       'notes':f'Gestion des actions en direct : {str(f'{shares:g}').replace('.',',')} %/an ; achat/vente des actions : {str(f'{share_trade:g}').replace('.',',')} % par opération. Les frais propres aux supports s’ajoutent.',
                       'options':options, 'scope':'Allocation libre ; options de gestion indiquées séparément, hors frais des supports.'},
                  access={'initial':initial,'free':free,'monthly':monthly,'sourceUrl':url},
                  supports={'minimumCount':count,'categories':['fonds d’investissement','ETF','actions en direct'],'sourceUrl':url},
                  euroFunds=[{'name':'Actif général SwissLife','years':years,'asOf':f'{years[-1]["year"]}-12-31','guarantee':guarantee,'guaranteeBasis':'Hors coût éventuel de la garantie optionnelle plancher décès ; la garantie se réduit chaque année des frais de gestion.', 'managementFeeMax':management,
                              'maxAllocation':None,'ceiling':None,'operations':'Allocation libre.',
                              'allocationEvidence':{'status':'not-published','checkedAt':today.isoformat(),'sourceUrls':[url,notice_url,fees_url],
                                  'reason':'La documentation de Placement-direct Vie ne chiffre pas la quote-part maximale actuelle de cet actif général ; les annonces du contrat distinct Placement-direct Euro+ ne s’y appliquent pas.'},
                              'notes':'Le taux dépend de la part d’unités de compte et de l’encours : le maximum ne s’applique pas à tous les contrats. SwissLife peut limiter temporairement les arbitrages sortants du fonds euros en cas de forte variation des marchés, selon la clause de sauvegarde.',
                              'sourceUrl':url,'sourceUrls':[url,notice_url,fees_url]}])
    record['fees']['notes'] += ' ' + ' '.join(o['description'] for o in options)
    return record


def placement_notice_conditions(notice, management):
    notice=re.sub(r'\s+',' ',notice).replace('\x07','')
    required(r'Les droits exprimés en euros comportent une garantie en capital égale aux sommes versées, nettes des prélèvements effectués au titre des frais de souscription et de gestion',notice)
    required(r'sur le fonds en euros : ([\d,.]+)\s*% de l’épargne sur base annuelle',notice)
    notice_fee=number(required(r'sur le fonds en euros : ([\d,.]+)\s*% de l’épargne sur base annuelle',notice)[1])
    if notice_fee!=management:raise ValueError('Notice and fee sheet disagree on euro fund charges')
    required(r'garantie.*?plancher décès',notice)
    options=[]
    for label in ['allocation déléguée','allocation opportunités 100 % Trackers']:
        fee=number(required(r'option « '+re.escape(label)+r' », les frais sont majorés de ([\d,.]+)\s*% sur base annuelle de l’épargne en unités de compte concernée par l’option',notice)[1])
        options.append({'name':label,'additionalFee':fee,'basis':'épargne en unités de compte concernée par l’option','description':f'Option {label} : +{str(f"{fee:g}").replace(".",",")} %/an sur les unités de compte concernées.'})
    return 100-management,options


def collect(id_,today):
    url=PRODUCTS[id_][3];html=fetch(url).decode();soup=BeautifulSoup(html,'html.parser')
    links=list(dict.fromkeys(urllib.parse.urljoin(url,a['href']) for a in soup.select('a[href]') if '.pdf' in a['href']))
    notice_url=next(u for u in links if ('notice-lucya-cardif' in u if id_=='lucya-cardif' else 'dispositions-generales-du-contrat-placement-direct-vie' in u))
    fees_url=next(u for u in links if ('frais-lucya-cardif' in u if id_=='lucya-cardif' else 'fiche-synthetique-des-frais-placement-direct-vie' in u))
    notice=pdf_text(fetch(notice_url),layout=False);fees_text=pdf_text(fetch(fees_url))
    parser=parse_lucya if id_=='lucya-cardif' else parse_placement
    return parser(html,notice,fees_text,notice_url,fees_url,today)
