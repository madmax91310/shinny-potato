"""Exact broker/market parsers. Values come from bounded official documents."""
import datetime as dt
import hashlib
import re
from bs4 import BeautifulSoup
from collect_regulatory_data import unique
SOURCES = {
 'xtb':'https://www.xtb.com/fr/fichiers/table-des-frais-et-commissions_052026.pdf',
 'saxo':'https://www.home.saxo/-/media/documents/regional/fr-fr/manuals/brochure-tarifaire-generale-2026.pdf',
 'caidf':'https://ca-paris.credit-agricole.fr/Reglementaire/Tarifs/2026/CADIF_tarif2026_PART/conditions_tarifaires_particuliers_caidf_04_2026.pdf',
 'ibkr':'https://www.interactivebrokers.ie/fr/pricing/commissions-stocks-europe.php',
 'tr':'https://support.traderepublic.com/fr-fr/784-Are-there-commissions-for-order-execution',
 'bd':'https://www.boursedirect.fr/pdf/tarifs_bd.pdf',
}
MONTHS={m:i for i,m in enumerate(['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'],1)}
def num(s): return float(s.replace('\xa0','').replace(' ','').replace(',','.'))
def get(pattern,s): return unique(pattern,s)
def fmt(v): return f'{v:g}'.replace('.',',')
def require(s,*labels):
 if any(label not in s for label in labels): raise ValueError('Identité, marché ou condition manquante: '+str(labels))
def metadata(s,url,today,date=None,previous=None,anchor=None):
 if date and (date>today or (previous and previous.get('asOf') and date<previous['asOf'])):raise ValueError('Date future ou régression de publication')
 return dict(asOf=date,checkedAt=today,sourceUrl=url,sha256=hashlib.sha256(s.encode()).hexdigest(),
  page=next((i for i,p in enumerate(s.split('\f'),1) if anchor and anchor in p),None),
  method='Barème officiel, marché et forfait exacts ; date de contrôle distincte de la publication',
  dateStatus='dated' if date else 'not-published')
def item(values,full,meta,scope):
 if not values or any(not isinstance(v,(float,int)) or not 0<=v<=100000000 for v in values.values()):raise ValueError('Valeurs hors bornes')
 return {**meta,'scope':scope,'values':values,'copy':{'resume':full,'full':full}}
def parse(name,s,today,previous=None):
 url=SOURCES[name]; fields={}
 if name=='ibkr':
  soup=BeautifulSoup(s,'html.parser');h=soup.find('h4',string='France')
  if not h:raise ValueError('Table France absente')
  section=h.find_parent('section');table=section.find('table');text=table.get_text(' ',strip=True).replace('\xa0',' ')
  require(text,'Dégressive','Fixe - IB SmartRouting','Fixe - Routage direct','Minimum par ordre (actions)')
  rows=table.find_all('tr'); first=rows[1].find_all('td');rates=[get(r'([\d,]+)\s*%',x.get_text(' ',strip=True)) for x in first[1:4]]
  mins=next(r for r in rows if r.find(['td','th']).get_text(' ',strip=True)=='Minimum par ordre (actions)').find_all('td')
  minimums=[get(r'([\d,]+)\s*EUR',x.get_text(' ',strip=True)) for x in mins[1:4]]
  v=dict(rate=rates[0],fixedRate=rates[1],directRate=rates[2],minimum=minimums[0],fixedMinimum=minimums[1],directMinimum=minimums[2])
  full=f"Actions France : {fmt(v['rate'])} %, minimum {fmt(v['minimum'])} € en dégressif, plus frais de Bourse possibles. En fixe SmartRouting : {fmt(v['fixedRate'])} %, minimum {fmt(v['fixedMinimum'])} € ; routage direct {fmt(v['directRate'])} %, minimum {fmt(v['directMinimum'])} €. Autres places : barèmes distincts, sous le plafond légal PEA."
  scope='IBKR direct ; actions entières France ; premier palier dégressif, fixe SmartRouting et routage direct'
  meta=metadata(s,url,today)
 elif name=='tr':
  text=BeautifulSoup(s,'html.parser').get_text(' ',strip=True)
  require(text,'transaction ponctuelle','plans','règlement')
  amount=re.search(r'frais de règlement externe de (un|[\d,]+) euro',text)
  if not amount:raise ValueError('Frais de règlement absents')
  v={'minimum':1.0 if amount[1]=='un' else num(amount[1])}
  # This support article does not qualify Direct Price. Do not recertify that mode.
  full=f"{fmt(v['minimum'])} € de règlement externe par transaction ponctuelle hors plans d’épargne. Tarif Direct Price distinct ; spread et coûts tiers possibles."
  scope='Trade Republic France ; frais externes des transactions ponctuelles hors plans ; Direct Price non recertifié'
  meta=metadata(s,url,today)
 elif name=='saxo':
  day,month,year=re.search(r'du (\d{1,2}) (\w+) (\d{4})',s).groups();months={'mai':5,'avril':4,'janvier':1,'septembre':9,'octobre':10,'juin':6,'juillet':7,'août':8,'février':2,'mars':3,'novembre':11,'décembre':12}
  date=dt.date(int(year),months[month],int(day)).isoformat()
  block=s.split('Euronext (1) :')[1].split('Service de Règlement Différé')[0]; require(block,'Classic','Platinum','VIP','Paris','Amsterdam')
  m=re.search(r'([\d,]+)%\s*\(min\.\s*([\d,]+)€\)',block)
  if not m:raise ValueError('Tarif Classic absent')
  v={'rate':num(m[1]),'minimum':num(m[2])};full=f"{fmt(v['rate'])} % sur Euronext en formule Classic, minimum {fmt(v['minimum'])} €, dans la limite du plafond légal de 0,50 % pour les ordres en ligne."
  scope='Saxo France ; actions/ETF Euronext ; Classic';meta=metadata(s,url,today,date,previous,'Euronext (1) :')
  garde=get(r'^\s*([\d,]+)€ Droits de garde\*',s);require(s,'* sauf PEA non-côté')
  fields['garde']=item({'fee':garde},f"{fmt(garde)} € sur les titres cotés ; exception pour les titres non cotés en PEA.",meta,'Titres cotés ; non cotés exclus')
  fx=get(r'Commission de change sur les devises\s+([\d,]+)\s*%',s)
  fields['change']=item({'rate':fx},f'{fmt(fx)} %.',{**meta,'page':next(i for i,p in enumerate(s.split('\f'),1) if 'Commission de change sur les devises' in p)},'Conversion de devises Saxo France')
  m=re.search(r'Transfert sortant de PEA/PEA-PME\s+([\d,]+) € par ligne \(Maximum ([\d,]+) €\)',s)
  if not m:raise ValueError('Sortie PEA absente')
  fields['sortant']=item({'perLine':num(m[1]),'maximum':num(m[2])},f'{m[1]} € par ligne, maximum {m[2]} €.',meta,'Transfert sortant PEA/PEA-PME')
 elif name=='xtb':
  d=re.search(r'En date du (\d{2})/(\d{2})/(\d{4})',s);date='-'.join([d[3],d[2],d[1]]) if d else None
  if not date:raise ValueError('Date XTB absente')
  block=s.split('2. Instruments des marchés organisés (OMI)')[1].split('3.')[0];require(block,'Actions, ETF','mois calendaire','tous les comptes','minimum 0 EUR5)','minimum 0 EUR','minimum 10 EUR')
  threshold=get(r'dépassement de ([\d ]+) EUR',block)
  rate=get(r'([\d.]+)%, minimum 10 EUR, minimum 0 EUR5\)',block)
  require(s,"La commission minimale pour les transactions sur OMI n'est pas facturée pour le PEA")
  v={'threshold':threshold,'rate':rate};full=f"0 % jusqu’à {threshold:,.0f} € de transactions mensuelles cumulées sur tes comptes, puis {fmt(rate)} %.".replace(f'{threshold:,.0f}', f'{threshold:,.0f}'.replace(',', ' '))
  scope='XTB ; actions/ETF OMI ; turnover mensuel cumulé tous comptes ; exemption minimum PEA';meta=metadata(s,url,today,date,previous,'2. Instruments des marchés organisés')
  fx=get(r'majoration de ([\d,]+) % en plus du taux de change',s)
  fields['change']=item({'rate':fx},f'{fmt(fx)} %.',meta,'Conversions OMI, transactions et opérations sur titres')
  m=re.search(r'Frais de garde8\)\s+([\d,]+)% par an.*?supérieur à ([\d ]+) EUR',s,re.S)
  if not m:raise ValueError('Garde XTB absente')
  rate_g=num(m[1]);threshold_g=num(m[2]);fields['garde']=item({'rate':rate_g,'threshold':threshold_g},f'Gratuits jusqu’à {threshold_g:,.0f} € de portefeuille, puis {fmt(rate_g)} % par an sur l’excédent.'.replace(f'{threshold_g:,.0f}',f'{threshold_g:,.0f}'.replace(',',' ')),meta,'Excédent valeur quotidienne moyenne du portefeuille ; prélèvement mensuel')
  m=re.search(r'Frais de sortie OMI du PEA.*?([\d]+) EUR par ISIN \(plafond de ([\d]+) EUR',s)
  if not m:raise ValueError('Sortie PEA XTB absente')
  fields['sortant']=item({'perLine':num(m[1]),'maximum':num(m[2])},f'{m[1]} € par ligne, maximum {m[2]} €.',meta,'Transfert sortant PEA ; tarif CTO non substitué')
 elif name=='caidf':
  d=re.search(r'en vigueur au (\d{2})\.(\d{2})\.(\d{2})',s);date=f'20{d[3]}-{d[2]}-{d[1]}' if d else None
  if not date:raise ValueError('Date CA IDF absente')
  block=s.split('Si abonné Invest Store Initial')[1].split('Commission de Service de Règlement Différé')[0]
  require(block,'Ordre ≤','Ordre entre','Ordre >','0,99€')
  ceilings=re.findall(r'Ordre ≤ ([\d ]+)€',block)
  interval=re.search(r'Ordre entre ([\d ]+)€ et ([\d ]+)€',block)
  if len(ceilings)!=2 or not interval:raise ValueError('Seuils PEA absents')
  small_limit=num(ceilings[1]);large_limit=num(interval[2])
  if small_limit!=num(interval[1]) or small_limit>=large_limit:raise ValueError('Seuils PEA incohérents')
  # The right column is PEA; the 0.99 EUR left column is CTO and must not be selected.
  rates=re.findall(r'([\d,]+)\s*%',block)
  if len(rates)!=5:raise ValueError('Colonnes CA IDF modifiées')
  v=dict(initial=num(rates[0]),small=num(rates[1]),middle=num(rates[2]),large=num(rates[3]),threshold=small_limit,upperThreshold=large_limit)
  # The two large-order rates in CTO and PEA must agree in this layout.
  if num(rates[4])!=v['large']:raise ValueError('Colonnes CA IDF ambiguës')
  annual=get(r'Option bourse Invest Store Initial\s+Gratuit\s+([\d]+)€',s);orders=get(r'Gratuit si ([\d]+) ordres minimum',s)
  age=re.search(r'Invest Store intégral (\d+) à (\d+) ans \(inclus\)\s+Gratuit',s)
  if not age:raise ValueError('Exemption âge absente')
  v.update(annual=annual,orders=orders,ageStart=int(age[1]),ageEnd=int(age[2]))
  full=f"Invest Store : Initial {fmt(v['initial'])} % ; Integral {fmt(v['small'])} % jusqu’à {int(small_limit)} €, {fmt(v['middle'])} % jusqu’à {large_limit:,.0f} €, puis {fmt(v['large'])} %. Integral : {fmt(annual)} €/an sous {fmt(orders)} ordres, gratuit dès {fmt(orders)} ordres ou pour les {age[1]}–{age[2]} ans.".replace(f'{large_limit:,.0f}',f'{large_limit:,.0f}'.replace(',',' '))
  scope='Crédit Agricole Île-de-France seulement ; colonne PEA/PEA-PME ; Internet Initial/Integral';meta=metadata(s,url,today,date,previous,'Si abonné Invest Store Initial')
  g=s.split('Droits de garde sur compte-titres et sur PEA')[-1].split('Particuliers |')[0];require(g,'Invest Store Intégral','exonération de droits de garde')
  rate=get(r'([\d,]+) %/semestre',g);maximum=get(r'Maximum de perception \(par compte\)\s+([\d]+)€/semestre',g)
  fixed=get(r'([\d,]+)€/semestre/compte',g);special=get(r'([\d,]+)€/semestre ⭢',g.split('Commission proportionnelle')[0])
  require(g,'gestion conseillée','mandats de gestion','OPC Crédit Agricole')
  fields['garde']=item({'rate':rate,'maximum':maximum,'fixed':fixed,'specialLine':special},f'Exonérés avec Integral, gestion conseillée ou mandat. Sinon : {fmt(fixed)} €/semestre/compte, {fmt(special)} €/semestre sur certaines lignes et {fmt(rate)} %/semestre de valorisation, plafonnés à {fmt(maximum)} €/semestre. Autres exemptions et cas particuliers au barème régional.',meta,'CA IDF ; exemptions et droits fixes conservés')
  t=s.split('Frais de transfert total ou partiel hors Crédit Agricole')[1].split('Opérations diverses')[0];per=get(r'([\d]+)€/ligne',t);maximum=get(r'Maximum de perception \(par compte\)\s+([\d]+)€',t)
  fields['sortant']=item({'perLine':per,'maximum':maximum},f'{fmt(per)} € par ligne, maximum {fmt(maximum)} € vers un établissement hors Crédit Agricole ; frais de correspondant possibles sur les titres étrangers.',meta,'CA IDF ; sortie hors Crédit Agricole')
 elif name=='bd':
  require(s.upper(),'CONDITIONS TARIFAIRES','PEA','PARIS','AMSTERDAM','BRUXELLES')
  d=re.search(r'Applicables à compter du (\d+) (\w+) (\d{4})',s)
  if not d:raise ValueError('Date Bourse Direct absente')
  months={'janvier':1,'février':2,'mars':3,'avril':4,'mai':5,'juin':6,'juillet':7,'août':8,'septembre':9,'octobre':10,'novembre':11,'décembre':12}
  date=dt.date(int(d[3]),months[d[2]],int(d[1])).isoformat()
  block=s.split('MONTANT DE L’ORDRE')[1].split('Droits de garde')[0]
  rows=[line for line in block.splitlines() if re.match(r'\s*(?:Jusqu’à|Entre|Supérieur)',line)]
  if len(rows)!=5:raise ValueError('Paliers Bourse Direct ambigus')
  fees=[]
  for line in rows[:4]:
   amounts=re.findall(r'([\d ,]+)\s*€',line)
   # The first row additionally contains the small-order ceiling (198 EUR).
   offset=1 if not fees else -2
   if len(amounts)<3 or num(amounts[offset])!=num(amounts[offset+1]):raise ValueError('Colonnes Bourse Direct modifiées')
   fees.append(num(amounts[offset+1]))
  require(rows[0],'198 €','0,5%')
  thresholds=[num(re.findall(r'([\d ]+)\s*€',line)[0 if i==0 else 1]) for i,line in enumerate(rows[:3])]
  thresholds.append(get(r'Entre [\d ]+ et ([\d ]+) €',rows[3]))
  if thresholds!=[500,1000,2000,4400]:raise ValueError('Seuils standard modifiés')
  rates=re.findall(r'([\d,]+)\s*%',rows[4])
  if len(rates)!=2 or rates[0]!=rates[1]:raise ValueError('Taux PEA ambigu')
  rate=num(rates[1]);v={'rate':rate,**{f'fee{i}':fee for i,fee in enumerate(fees)}}
  full='Euronext : plafond légal PEA de 0,50 % ; '+', '.join(f'{fmt(fee)} € jusqu’à {limit} €' for limit,fee in zip(thresholds,fees))+f', puis {fmt(rate)} % sur la totalité de l’ordre.'
  scope='Bourse Direct ; Internet Euronext ; colonne PEA/PEA-PME/Jeunes';meta=metadata(s,url,today,date,previous,'MONTANT DE L’ORDRE')
 else:raise ValueError('Courtier non pris en charge')
 anchors={'saxo':{'garde':'0€ Droits de garde*','change':'Commission de change sur les devises','sortant':'Transfert sortant de PEA/PEA-PME'},'xtb':{'change':'Toutes les conversions de devises liées','garde':'Frais de garde8)','sortant':'Frais de sortie OMI du PEA'},'caidf':{'garde':'Droits de garde sur compte-titres et sur PEA','sortant':'Frais de transfert total ou partiel hors Crédit Agricole'}}
 for key,o in fields.items():
  anchor=anchors[name][key];o['page']=next(i for i,p in enumerate(s.split('\f'),1) if anchor in p and (name!='caidf' or key!='garde' or 'Les droits de garde sont prélevés' in p))
 result=item(v,full,meta,scope);result['fields']=fields
 short={'saxo':f"{fmt(v.get('rate',0))} % · min {fmt(v.get('minimum',0))} €",'xtb':f"0 % jusqu’à {v.get('threshold',0):,.0f} €/mois".replace(',',' '),'caidf':f"Initial {fmt(v.get('initial',0))} % / Integral dès {fmt(v.get('large',0))} %",'ibkr':f"Dès {fmt(v.get('rate',0))} % · min {fmt(v.get('minimum',0))} €",'tr':f"{fmt(v.get('minimum',0))} € hors plans"}
 result['copy']['resume']=short.get(name,full);result['copy']['detail']=scope
 return result

SUPPLEMENT_SOURCES={
 'ibkr_pea_garde':('ibkr','garde','https://www.interactivebrokers.ie/fr/accounts/plan-depargne-en-action-accounts.php'),
 'ibkr_pea_transfer':('ibkr','sortant','https://www.interactivebrokers.ie/fr/accounts/plan-depargne-en-action-accounts.php'),
 'ibkr_fx':('ibkr','change','https://www.interactivebrokers.ie/fr/pricing/commissions-spot-currencies.php'),
 'bourso_transfer':('bourso','entrant','https://www.boursobank.com/aide-en-ligne/bourse/mobilite-bourse/question/proposez-vous-une-offre-en-cas-de-transfert-de-compte-bourse-53103659'),
 'fortuneo_transfer':('fortuneo','entrant','https://www.fortuneo.fr/faq/fortuneo-rembourse-t-il-les-frais-de-transfert-dun-compte-bourse'),
 'saxo_offer':('saxo','offerPea','https://www.home.saxo/fr-fr/accounts/pea/terms-and-conditions'),
 'saxo_amundi':('saxo','offerAmundi','https://www.home.saxo/fr-fr/campaigns/amundi-etf'),
}
def parse_supplement(key,s,today):
 broker,field,url=SUPPLEMENT_SOURCES[key];s=BeautifulSoup(s,'html.parser').get_text(' ',strip=True).replace('\xa0',' ')
 meta=metadata(s,url,today);v={};end=None;start=None
 if key in ('ibkr_pea_garde','ibkr_pea_transfer'):
  require(s,"Pas de frais d'ouverture du PEA, ni de frais de tenue de compte ou de frais de transfert.",'Pas de droits de garde','Pas de frais de transfert','Pas de frais de tenue de compte')
  v={'fee':0}
  full='Aucun droit de garde ni frais de tenue de compte PEA annoncés.' if field=='garde' else '0 € annoncé par IBKR.'
 elif key=='ibkr_fx':
  require(s,'point de base','conversion de devise automatique','discrétion')
  manual=get(r'1 000 000 000\s+([\d,]+) point de base',s)
  minimum=get(r'Minimum par ordre\s+2 Palier I - ([\d,]+) USD',s)
  auto=get(r'discrétion\) ([\d,]+)\s*%',s)
  v={'manualRate':manual/100,'minimumUsd':minimum,'automaticRate':auto}
  full=f"Barème général : généralement {fmt(auto)} % en automatique ; en manuel {fmt(manual/100)} %, minimum {fmt(minimum)} USD. Disponibilité à confirmer sur PEA."
 elif key=='bourso_transfer':
  require(s,'premier transfert total','double des frais','valorisation totale du compte','justificatif','toujours ouvert')
  cap=get(r'limite de ([\d ]+) € TTC',s);months=get(r'dans les ([\d]+) mois suivant le transfert',s)
  v={'maximum':cap,'requestMonths':months,'multiplier':2}
  full=f"Possible ✅ Premier transfert total : frais remboursés au double, jusqu’à {cap:,.0f} €, sans dépasser la valeur du compte, sous conditions. Justificatif à envoyer dans les {fmt(months)} mois ; compte toujours ouvert au remboursement.".replace(f'{cap:,.0f}',f'{cap:,.0f}'.replace(',',' '))
 elif key=='fortuneo_transfer':
  require(s.lower(),'1er transfert','pea','justificatif','titres + espèces')
  cap=get(r"Jusqu'à ([\d ]+) € pour un compte transféré d'un encours minimum de",s)
  high=get(r'encours minimum de ([\d ]+) €',s);middle=get(r'([\d ]+) € maximum pour un compte transféré d.un encours compris',s)
  lower=get(r'encours compris entre ([\d ]+) €',s);small=get(r'([\d ]+) € maximum pour un compte transféré d.un encours inférieur',s)
  months=get(r'dans les ([\d]+) mois suivant l.opening',s) if 'opening' in s else get(r'dans les ([\d]+) mois suivant l.opening'.replace('opening','ouverture'),s)
  v=dict(maximum=cap,high=high,middle=middle,lower=lower,small=small,requestMonths=months)
  money=lambda x:f'{x:,.0f}'.replace(',',' ')
  full=f"Possible ✅ Premier transfert remboursé jusqu’à {money(small)} € si l’encours est inférieur à {money(lower)} €, {money(middle)} € de {money(lower)} à moins de {money(high)} €, ou {money(cap)} € à partir de {money(high)} €, sous conditions. Justificatif dans les {fmt(months)} mois suivant l’ouverture."
 elif key=='saxo_offer':
  require(s,'exclusivement sur les comptes PEA','ordres d’achat et de vente','commissions de change','ouverts ou transférés')
  count=get(r'sélection de ([\d]+) actions européennes',s)
  d=re.search(r's.applique entre le (\d+) (\w+) (\d{4}) et le (\d+) (\w+) (\d{4})',s)
  if not d:raise ValueError('Période offre PEA absente')
  months=MONTHS;start=dt.date(int(d[3]),months[d[2]],int(d[1])).isoformat();end=dt.date(int(d[6]),months[d[5]],int(d[4])).isoformat()
  v={'count':count};full=f"{fmt(count)} actions européennes sans courtage à l’achat et à la vente pour les nouveaux PEA éligibles, ouverts ou transférés. Les commissions de change restent dues."
 else:
  require(s,'achats au comptant','sélection','ETF Amundi','six mois','12 derniers mois')
  d=re.search(r"Jusqu'au (\d+) (\w+) (\d{4}) inclus",s)
  if not d:raise ValueError('Fin offre Amundi absente')
  end=dt.date(int(d[3]),MONTHS[d[2]],int(d[1])).isoformat();v={'transferLockMonths':6,'priorAccountMonths':12}
  full='Une sélection d’ETF Amundi sans courtage à l’achat, dont certains sont éligibles au PEA. La vente reste payante selon le tarif applicable. Sous conditions : comptes de même nature sur les 12 derniers mois exclus ; transfert des positions concernées bloqué six mois.'
 result=item(v,full,meta,f'{broker} ; {field} ; conditions explicites de la page officielle')
 if end:
  if start and start>end:raise ValueError('Période offre inversée')
  result.update(until=end,start=start)
 return broker,field,result

def base_supplements(name,s,observation):
 """Fields separately scoped within the existing two official brochures."""
 meta={k:observation[k] for k in ['asOf','checkedAt','sourceUrl','sha256','page','method']};fields={}
 if name=='bourso':
  fx=get(r'Taux de change J\+1 \(J étant le jour de négociation\) \+ ([\d,]+) points',s)
  fields['change']=item({'fxPoints':fx},f'Taux J+1 majoré de {fmt(fx)} point de cours ; ce n’est pas un pourcentage fixe.',meta,'Bourse hors zone euro ; point de cours, pas pourcentage')
  m=re.search(r'([\d]+)€ par ligne dans la limite de\s*.*?Transfert de titres vers établissement tiers \(PEA, PEA 18-25 ans, PEA-PME\)\s*([\d]+)€ par compte transféré',s,re.S)
  if not m:raise ValueError('Transfert Bourso PEA absent')
  fields['sortant']=item({'perLine':num(m[1]),'maximum':num(m[2])},f'{m[1]} € par ligne, maximum {m[2]} €.',meta,'Transfert sortant PEA ; distinct du CTO')
 elif name=='fortuneo':
  fx=get(r'Taux de change "J\+1" \+ ([\d.]+)%',s)
  fields['change']=item({'rate':fx},f'Taux J+1 et commission appliquée par l’intermédiaire + {fmt(fx)} %.',meta,'Conversions Bourse ; frais intermédiaire conservés')
  per=get(r'Transfert ou donation de titres Bourse France[^\n]*?([\d]+) € par ligne',s)
  non=get(r'Transfert ou donation de titres en nominatif non enregistrés Euroclear ou non cotés[^\n]*?([\d]+) € par ligne',s)
  cap=get(r'maximum légal de ([\d]+) € pour le transfert',s)
  fields['sortant']=item({'perLine':per,'nonListed':non,'maximum':cap},f'{fmt(per)} € par ligne cotée, {fmt(non)} € pour les titres non cotés ou nominatifs hors Euroclear, maximum {fmt(cap)} €.',meta,'Transfert sortant PEA ; distinction coté/non coté')
  require(s,'Droits de garde                                                                                                           GRATUIT')
  fields['garde']=item({'fee':0},'Aucun ✅',meta,'Garde Bourse Fortuneo')
 anchors={'bourso':{'change':'Taux de change J+1 (J étant','sortant':'Transfert de titres vers établissement tiers (PEA'},'fortuneo':{'change':'Taux de change \"J+1\"','sortant':'Transfert ou donation de titres Bourse France','garde':'Droits de garde'}}
 for key,value in fields.items():
  value['page']=next(i for i,p in enumerate(s.split('\f'),1) if anchors[name][key] in p)
 return fields
