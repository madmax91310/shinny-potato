"""Refresh scoped public offer terms, never extrapolate project contracts from a platform."""
import argparse
import concurrent.futures
import copy
import datetime as dt
import hashlib
import json
import pathlib
import re
from bs4 import BeautifulSoup
from collect_scpi import fetch, number, required

SOURCES = {
 'fundora': ['https://www.fundora.fr/questions'],
 'mymarguerit': ['https://www.mymarguerit.com/'],
 'bacchus': ['https://bacchusconseil.com/fonctionnement/','https://bacchusconseil.com/gfv/gfv-cave-de-tain-crozes-hermitage/'],
 'france-valley': ['https://www.france-valley.com/gfi-france-valley-patrimoine'],
 'enerfip': ['https://www.enerfip.eu/fr/legal/convention-investisseur'],
 'hectarea': ['https://www.hectarea.io/aide/fonctionnement','https://www.hectarea.io/aide/portefeuille','https://www.hectarea.io/aide/investir'],
 'bricks': ['https://www.bricks.co/fonctionnement'],
 'anaxago': ['https://www.anaxago.com/blog/entrepreneurs/private-equity-decarbonation-revolution-industrielle-europe'],
 'matis': ['https://www.matis.club/comment-investir/schema-investissement','https://www.matis.club/comment-investir'],
}
PATH=pathlib.Path(__file__).resolve().parents[1]/'src/data/automated-presentation-actors.json'
LABELS={'access':'Accès','fees':'Frais publiés','duration':'Durée','income':'Revenus','exit':'Sortie'}

def plain(html):
 soup=BeautifulSoup(html,'html.parser')
 for el in soup.select('script, style, nav, footer'):el.decompose()
 return re.sub(r'\s+',' ',soup.get_text(' ',strip=True)).replace('\u200d','').replace('\u2028',' ')

def bounded(value, low, high, label):
 if not low<=value<=high:raise ValueError('Out-of-range published '+label)
 return value

def fmt(n):return f'{n:g}'.replace('.',',')

def parse(id_, documents, today):
 if len(documents)!=len(SOURCES[id_]):raise ValueError('Incomplete official source set')
 texts=[plain(doc) for doc in documents];t=texts[0];urls=SOURCES[id_]
 required({'france-valley':'GFI France Valley Patrimoine','bacchus':'Bacchus Conseil','anaxago':'AxClimat I','mymarguerit':'MyMarguerit','fundora':'Fundora','matis':'matis','enerfip':'Enerfip','hectarea':'Hectarea','bricks':'Bricks'}[id_],t)
 def val(pattern, text=t, group=1):return number(required(pattern,text)[group])
 def field(key,text,source=0):return {'label':LABELS[key],'value':text,'sourceUrl':urls[source]}
 def offer(key,name,scope,values,missing=(),metrics=(),warnings=()):
  return {'id':key,'name':name,'scope':scope,'fields':{k:field(k,v) for k,v in values.items()},'missing':list(missing),'highlights':list(metrics),'warnings':list(warnings)}
 offers=[];effective=None
 if id_=='fundora':
  ticket=val(r'À partir de ([\d ]+) € pour l’offre grand public')
  premium=val(r'À partir de ([\d ]+) € pour l’offre premium Fundora Plus')
  low,high=required(r'généralement entre (\d+) et (\d+) ans \(avec possibles extensions\)',t).groups()
  required(r'Il n’existe pas de mécanisme de rachat garanti ou de liquidité organisée',t)
  for key,name,pattern in [('classique','Classique',r'La formule Classique prévoit.*?\(([\d,.]+) % à ([\d,.]+) %\).*?\(([\d,.]+) % à ([\d,.]+) %\)'),('horizon','Horizon',r'La formule Horizon prévoit.*?\(([\d,.]+) % à ([\d,.]+) %\).*?\(([\d,.]+) % à ([\d,.]+) %\)')]:
   a,b,c,d=map(number,required(pattern,t).groups())
   if not 0<=a<=b<=100 or not 0<=c<=d<=10:raise ValueError('Inconsistent formula fee ranges')
   offers.append(offer(key,'Fundora — '+name,'Formule tarifaire grand public sous mandat ; stratégie et fonds à choisir séparément.',{'access':f'Grand public dès {fmt(ticket)} € ; Fundora Plus dès {fmt(premium)} € (offre distincte, appels progressifs).','fees':f'Entrée : {fmt(a)} à {fmt(b)} %. Gestion annuelle : {fmt(c)} à {fmt(d)} %. Barème selon le montant ; vérifier les frais des fonds sous-jacents et le mandat.','duration':f'Durée générale des fonds : {low} à {high} ans, extensions possibles ; durée propre à la stratégie.','income':'Gains éventuels lors des distributions et cessions des fonds ; aucune performance réalisée du mandat n’est qualifiée.','exit':'Pas de rachat garanti ni de liquidité organisée ; cession à un acquéreur possible, sans garantie de prix ou de délai.'},['Frais complets des fonds sous-jacents et stratégie sélectionnée'],[['Accès annoncé',f'{fmt(ticket)} €'],['Entrée',f'{fmt(a)}–{fmt(b)} %'],['Gestion / an',f'{fmt(c)}–{fmt(d)} %']]))
 elif id_=='mymarguerit':
  entry=val(r'Quels sont les frais \? ([\d,.]+) % de frais s’appliquent au moment de la souscription')
  unit=val(r'Unité de Compte \(UC\) de ([\d ]+)€')
  paid=val(r'soit ([\d ]+)€/UC')
  exitfee=val(r'([\d,.]+) % de frais sur la valeur de l’UC au moment de la cession')
  # The advertised whole-euro total is rounded, not an exact commission reconciliation.
  if not 0<=entry<=100 or not 0<=exitfee<=100 or not 0<unit<=paid or abs(paid-unit*(1+entry/100))>1:raise ValueError('Unit value and advertised subscription total disagree')
  stamp=required(r'Tarif appliqué au (\d+)er janvier (20\d{2})',t);effective=f'{stamp[2]}-01-{int(stamp[1]):02d}'
  required(r'capitalisé pendant les 3 premières années.*?partir de la 4.*?capitalisation.*?produit annuel',t)
  required(r'sortie est possible à tout moment selon les conditions prévues au contrat',t)
  offers=[offer('cheptel','Cheptel MyMarguerit','Conditions publiques du placement bovin ; l’UC décrite ici n’est pas un support d’assurance vie.',{'access':f'Valeur annoncée par UC : {fmt(unit)} € ; coût de souscription annoncé : {fmt(paid)} €/UC, arrondi et frais inclus. Minimum contractuel d’UC à confirmer.','fees':f'Souscription : {fmt(entry)} % sur la valeur de l’UC ; cession : {fmt(exitfee)} % sur sa valeur au moment de la vente. Autres coûts de régie et d’assurance à vérifier au contrat.','duration':'Capitalisation pendant les trois premières années ; à partir de la quatrième, capitalisation ou produit annuel. Cela ne constitue pas une garantie de remboursement.','income':'Produit annuel ou capitalisation selon le contrat et le choix autorisé à partir de la quatrième année ; revenus non garantis.','exit':'La page annonce une sortie à tout moment selon le contrat ; délai, prix et engagement de rachat à vérifier. Des frais de cession s’appliquent.'},['Minimum contractuel d’UC, coûts complets de régie/assurance, délai et prix de sortie'],[['Coût / UC annoncé',f'{fmt(paid)} €'],['Frais de souscription',f'{fmt(entry)} %'],['Frais de cession',f'{fmt(exitfee)} %']])]
 elif id_=='bacchus':
  required(r'GFV Cave de Tain Crozes-Hermitage',texts[1])
  years=val(r'bail à long terme de (\d+) ans');renew=val(r'renouvelable par période de (\d+) ans')
  required(r'dotation peut être perçue en numéraire',t);required(r'prix de cession des parts est fixé tous les trois ans',t)
  offers=[offer('cave-de-tain','GFV Cave de Tain — Crozes-Hermitage','Groupement nommé sur la page du domaine ; modalités du modèle Bacchus à confirmer dans son dossier.',{'access':'Parts du GFV Cave de Tain Crozes-Hermitage ; prix par part et minimum de souscription non publiés dans la page du domaine.','fees':'Le modèle met 4/5 des impôts fonciers à la charge du fermier. Frais de souscription, de gestion et de cession propres au groupement non chiffrés dans ces pages.','duration':f'Bail du modèle : {fmt(years)} ans, renouvelable par périodes de {fmt(renew)} ans. La durée du bail n’est pas une durée de blocage de l’investisseur.','income':'Fermage versé en argent et/ou en nature ; dotation en bouteilles fixée dans le bail. Montant propre au domaine non publié.','exit':'Cession soumise aux statuts et à un acquéreur ; prix de cession du modèle fixé en assemblée tous les trois ans. Aucun délai de revente garanti.'},['Dossier du GFV : ticket, frais chiffrés, bail et dotation exacte'],[['Véhicule','GFV'],['Domaine','Cave de Tain'],['Appellation','Crozes-Herm.']])]
  offers[0]['fields']['access']['sourceUrl']=urls[1]
 elif id_=='france-valley':
  ticket=val(r'Montant minimum d’investissement ([\d ]+) €')
  minimum=val(r'Durée de détention minimum (\d+) mois')
  horizon=val(r'Horizon de placement Min\. (\d+) ans')
  fees=required(r'La transparence sur les frais du GFI (.*?)Vous donner toutes les clés',t)[1]
  entry=val(r'Commission de souscription\(2\) : ([\d,.]+)% TTC',fees)
  management=val(r'Commission de gestion\(3\) : ([\d,.]+)% TTC/an sur la valeur des actifs',fees)
  transaction=val(r'Commission de transaction : ([\d,.]+)% TTC',fees)
  notary=val(r'Frais de notaire/droits de mutation : ([\d,.]+)% environ',fees)
  bounded(management,0,10,'GFI management fee')
  for fee in (entry,transaction,notary):bounded(fee,0,100,'GFI fee')
  required(r'4\.200 € TTC \+ commission variable',fees);required(r'12 à 120 € TTC/ha',fees)
  required(r'0,048% TTC.*?0,03% TTC.*?0,018% TTC',fees)
  required(r'75%.*?1 200€ TTC',fees)
  required(r'récupère donc les 20% de TVA.*?impact économique net est donc bien en HT',fees)
  offers=[offer('gfi-patrimoine','GFI France Valley Patrimoine','Parts du GFI Patrimoine, hors autres produits France Valley ; communication publicitaire, DIC sur demande.',{'access':f'Minimum annoncé dans les caractéristiques : {fmt(ticket)} €. La page conserve ailleurs un ancien montant : retenir la rubrique du produit et confirmer avant souscription.','fees':f'Souscription : {fmt(entry)} % TTC maximum. Gestion du GFI : {fmt(management)} % TTC/an maximum sur la valeur des actifs. Dépositaire : 4 200 € TTC + 0,048 % jusqu’à 50 M€, 0,03 % entre 50 et 200 M€, 0,018 % au-delà. Acquisition : expertise environ 12–120 € TTC/ha, transaction {fmt(transaction)} % TTC, notaire/mutation environ {fmt(notary)} %. Donation/succession : procédure forfaitaire 1 200 € TTC. Frais du véhicule, bases distinctes ; TVA récupérée par le GFI, impact économique HT selon la page.','duration':f'Placement recommandé : au moins {fmt(horizon)} ans ; détention minimale ELTIF : {fmt(minimum)} mois. Ni le minimum de détention ni la recommandation ne garantissent une sortie.','income':'Exploitation forestière et évolution du prix des parts ; excédent d’exploitation réinvesti dans le fonds, revenus non garantis.','exit':'Revente dépendante des souscriptions ou acquisitions enregistrées ; pas de garantie de délai ni de prix.'},['DIC et conditions de souscription actualisées à obtenir'],[['Minimum annoncé',f'{fmt(ticket)} €'],['Souscription max.',f'{fmt(entry)} % TTC'],['Gestion max. / an',f'{fmt(management)} % TTC']])]
 elif id_=='enerfip':
  ticket=val(r'ne peut être inférieur à dix euros \(([\d ]+) €\)')
  required(r'Aucun frais direct n’est facturé.*?Cependant, des frais indirects',t)
  wallet=val(r'un euro \(([\d,.]+) €\) par virement effectué.*?inférieur à cent euros \(100 €\)')
  required(r'1 €\) par Bulletin de souscription.*?2 500 €\).*?fonds n’ont pas été libérés',t)
  required(r'supportés soit par le Porteur de Projet soit par la Société interposée',t)
  stamp=required(r'22/05/2026',t);effective='2026-05-22'
  offers=[offer('projets','Projets Enerfip — convention investisseur','Règles de la plateforme ; taux, émetteur et échéance restent propres à chaque opération.',{'access':f'Minimum fixé par chaque levée, plancher de {fmt(ticket)} € dans la convention.','fees':f'Pas de frais directs ordinaires annoncés, avec exceptions contractuelles : {fmt(wallet)} € possible par virement entrant inférieur à 100 € ; 1 € possible pour un bulletin signé d’au moins 2 500 € non libéré en fin de levée. Frais indirects possibles si une société interposée les supporte ; détail sur demande.','duration':'Échéance du titre indiquée dans les termes et conditions de la levée ; aucune durée commune qualifiée.','income':'Intérêts ou résultat des titres souscrits ; taux et échéancier à lire dans la fiche de l’opération.','exit':'Remboursement dépendant de l’émetteur ; présence d’Enerdeal ne garantit ni acquéreur ni prix de revente.'},['Projet précis : FICI, émetteur, taux, échéance et frais indirects'],[['Plancher plateforme',f'{fmt(ticket)} €'],['Instrument','Selon projet'],['Durée','Selon titre']])]
 elif id_=='hectarea':
  ticket=val(r'Vous pouvez investir à partir de ([\d ]+)€ avec Hectarea',texts[2])
  a,b=map(number,required(r'commission de ([\d,.]+)% à ([\d,.]+)% au moment de l’investissement',t.replace("l'investissement",'l’investissement')).groups())
  c,d=map(number,required(r'commission de ([\d,.]+)% à ([\d,.]+)% sur les fermages',t).groups())
  required(r'sur la plus-value lors du rachat',t)
  if not 0<=a<=b<=100 or not 0<=c<=d<=100:raise ValueError('Inconsistent Hectarea commissions')
  threshold=val(r'Retrait.*?montant inférieur à ([\d,.]+)€',texts[1])
  required(r'versés systématiquement et mensuellement',texts[1])
  effective='2026-07-22';required(r'Mis à jour le 22 juillet 2026',t)
  offers=[offer('obligations-foncieres','Obligations foncières Hectarea','Offre obligataire dès 100 € ; exclut l’achat direct de terres dès 100 K€.',{'access':f'Obligations dès {fmt(ticket)} € annoncés ; émission et conditions propres au terrain.','fees':f'Structuration initiale : {fmt(a)} à {fmt(b)} %. Commissions de {fmt(c)} à {fmt(d)} % sur les fermages et la plus-value de rachat. Pas de frais sur les montants sous gestion annoncés. Retraits du portefeuille inférieurs à {fmt(threshold)} € : frais possibles, montant non chiffré sur la page.','duration':'Durée de l’obligation et calendrier de rachat propres au projet ; l’exemple de calcul de TRI ne fixe pas une durée commune.','income':'Fermages versés mensuellement sur le portefeuille ; démarrage parfois différé après le financement. Plus-value de rachat éventuelle, non garantie.','exit':'Le retrait des sommes disponibles du portefeuille ne constitue pas une revente des obligations ; conditions de sortie propres au titre.'},['Projet précis : échéance, émetteur, coupon et tarif de petit retrait'],[['Accès annoncé',f'{fmt(ticket)} €'],['Structuration',f'{fmt(a)}–{fmt(b)} %'],['Frais loyers / gain',f'{fmt(c)}–{fmt(d)} %']])]
  offers[0]['fields']['income']['sourceUrl']=urls[1]
  offers[0]['fields']['fees']['sourceUrls']=urls
 elif id_=='bricks':
  ticket=val(r'à partir de ([\d ]+) euros')
  required(r'pas de frais d’entrée, ni frais de gestion',t);free=val(r'retraits \((\d+) gratuits par an\)')
  offers=[offer('obligations-immobilieres','Obligations immobilières Bricks','Conditions générales présentées par la plateforme ; aucun projet individuel présumé ouvert.',{'access':f'Dès {fmt(ticket)} € annoncés pour les projets présentés.','fees':f'Pas de frais d’entrée ni de gestion annoncés ; {fmt(free)} retraits gratuits par an, tarif des suivants à confirmer. Les coûts supportés par l’émetteur restent à examiner dans sa fiche.','duration':'Durée cible propre à chaque projet ; aucun délai commun qualifié.','income':'Intérêts selon le titre ; la plage commerciale de taux ne constitue pas une performance réalisée.','exit':'Pas de retrait immédiat du capital investi ; échéance et éventuelle cession dépendent du projet.'},['Projet précis : FICI, émetteur, coupon, échéance, tarif de retraits'],[['Accès annoncé',f'{fmt(ticket)} €'],['Instrument','Obligations'],['Solde : retraits gratuits',f'{fmt(free)} / an']])]
 elif id_=='anaxago':
  ticket=val(r'ticket minimum de ([\d ]+) euros');calls=val(r'versés progressivement sur (\d+) ans')
  required(r'fonds AxClimat I\. Il s’agit d’un fonds de fonds',t)
  offers=[offer('axclimat-i','AxClimat I','Fonds de fonds dédié à la décarbonation ; conditions annoncées dans un article officiel, disponibilité actuelle non établie.',{'access':f'Ticket annoncé : {fmt(ticket)} €, versés progressivement sur {fmt(calls)} ans.','fees':'Barème complet des frais non publié dans l’article ; les économies du co-investissement ne signifient pas zéro frais pour le fonds.','duration':f'Appels de fonds sur {fmt(calls)} ans annoncés ; cette période n’est pas la durée de détention ni la date de remboursement.','income':'Distributions et cessions des fonds ; TRI commercial cible distinct des performances réalisées, non qualifiées ici.','exit':'Durée de vie, extensions et règles de cession à vérifier dans la documentation du fonds ; liquidité non garantie.'},['DIC : frais complets, durée, extensions, conditions et ouverture actuelle'],[['Ticket annoncé',f'{fmt(ticket)} €'],['Appels de fonds',f'{fmt(calls)} ans'],['Véhicule','Fonds de fonds']])]
 elif id_=='matis':
  ticket=val(r'accessibles à partir de ([\d ]+)€',texts[1])
  target=val(r'Horizon d’investissement cible (\d+) mois',t.replace("d'investissement",'d’investissement'))
  overview=val(r'horizon cible de (\d+) mois',texts[1])
  order=val(r'transmission d’ordres ([\d,.]+)%');placement=val(r'service de placement ([\d,.]+)%');carry=val(r'matis holding\) ([\d,.]+)%')
  required(r'taxes et droits.*?transport.*?honoraire.*?frais de fonctionnement',t)
  for fee in (order,placement,carry):bounded(fee,0,100,'Matis commission')
  warnings=[] if overview==target else [f'Pages officielles divergentes : présentation {fmt(overview)} mois, schéma {fmt(target)} mois. Confirmer la durée dans les conditions de l’offre choisie.']
  offers=[offer('oca-oeuvre','Matis — société projet par œuvre','OCA d’une SAS ; modalités générales, œuvre et émetteur à sélectionner séparément.',{'access':f'À partir de {fmt(ticket)} € par société annoncé sur la page française.','fees':f'Réception/transmission d’ordres : {fmt(order)} %. Placement : {fmt(placement)} %. Carried interest : {fmt(carry)} % de la plus-value au bénéfice de Matis Holding. L’émission inclut aussi taxes/droits, transport, conseil et fonctionnement de la société ; bases et montants propres à l’offre, pas de coût total déduit de ces seuls pourcentages.','duration':f'Schéma : horizon cible {fmt(target)} mois, revente anticipée possible. Présentation : cible {fmt(overview)} mois. La cible n’est pas une échéance de remboursement garantie ; durée du titre à confirmer.','income':'Produit de revente de l’œuvre après les charges et les conditions du titre ; plus-value non garantie.','exit':'Sortie liée à la revente et au titre ; aucune disponibilité personnelle de l’œuvre, pas de remboursement anticipé garanti.'},['Œuvre et FICI : durée du titre, bases des commissions, autres coûts'],[['Accès annoncé',f'{fmt(ticket)} €'],['Instrument','Oblig. conv.'],['Durée','À confirmer']],warnings)]
  offers[0]['fields']['access']['sourceUrl']=urls[1]
  offers[0]['fields']['duration']['sourceUrls']=urls
 if effective and dt.date.fromisoformat(effective)>today:raise ValueError('Future source terms')
 for o in offers:
  for f in o['fields'].values():
   f['checkedAt']=today.isoformat()
   if effective:f['effectiveAt']=effective
 return {'id':id_,'checkedAt':today.isoformat(),'verification':'public-terms','sources':[{'url':u,'sha256':hashlib.sha256(doc.encode()).hexdigest()} for u,doc in zip(urls,documents)],'offers':offers}

def collect(id_,today):return parse(id_,[fetch(u).decode() for u in SOURCES[id_]],today)

def refresh(previous,adapters,today):
 result=copy.deepcopy(previous);observations=[]
 for id_,adapter in adapters.items():
  try:
   record=adapter(today)
   if record['id']!=id_ or record['checkedAt']!=today.isoformat() or not record['offers']:raise ValueError('Wrong actor or collection date')
   old=previous.get(id_,{})
   if record['checkedAt']<old.get('checkedAt',''):raise ValueError('Regressing collection date')
   old_offers={o['id']:o for o in old.get('offers',[])};new={o['id']:o for o in record['offers']}
   if not old_offers.keys()<=new.keys():raise ValueError('Qualified offer disappeared')
   for key,o in new.items():
    if set(o['fields'])!=set(LABELS) or any(not f.get('value') or not f.get('sourceUrl','').startswith('https://') for f in o['fields'].values()):raise ValueError('Incomplete source-qualified terms')
    old_dates=[f['effectiveAt'] for f in old_offers.get(key,{}).get('fields',{}).values() if f.get('effectiveAt')]
    new_dates=[f['effectiveAt'] for f in o['fields'].values() if f.get('effectiveAt')]
    if old_dates and (not new_dates or min(new_dates)<max(old_dates)):raise ValueError('Regressing effective terms')
   result[id_]=record;observations.append({'id':id_,'name':id_,'status':'success'})
  except Exception as e:observations.append({'id':id_,'name':id_,'status':'failure','reason':str(e)[:500]})
 return result,{'observations':observations}

def main():
 p=argparse.ArgumentParser();p.add_argument('--apply',action='store_true');p.add_argument('--output',type=pathlib.Path,required=True);args=p.parse_args();today=dt.date.today()
 previous=json.loads(PATH.read_text()) if PATH.exists() else {}
 # Network work is independent; merge and validation remain atomic per actor.
 with concurrent.futures.ThreadPoolExecutor(max_workers=9) as pool:
  futures={id_:pool.submit(collect,id_,today) for id_ in SOURCES}
  data,report=refresh(previous,{id_:lambda day,f=f:f.result() for id_,f in futures.items()},today)
 args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 if args.apply:PATH.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report,ensure_ascii=False))
 return int(any(o['status']=='failure' for o in report['observations']))
if __name__=='__main__':raise SystemExit(main())
