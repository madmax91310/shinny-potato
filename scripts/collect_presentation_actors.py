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
from collect_scpi import fetch, pdf_text, number, required

SOURCES = {
 'fundora': ['https://www.fundora.fr/questions'],
 'mymarguerit': ['https://www.mymarguerit.com/'],
 'bacchus': ['https://bacchusconseil.com/fonctionnement/','https://bacchusconseil.com/gfv/gfv-cave-de-tain-crozes-hermitage/'],
 'france-valley': ['https://www.france-valley.com/gfi-france-valley-patrimoine','https://www.france-valley.com/gfi-france-valley-forets','https://www.france-valley.com/fonciere-europe','https://www.france-valley.com/hubfs/DIC%20-%20GFI%20FRANCE%20VALLEY%20PATRIMOINE.pdf'],
 'enerfip': ['https://www.enerfip.eu/fr/legal/convention-investisseur'],
 'hectarea': ['https://www.hectarea.io/aide/fonctionnement','https://www.hectarea.io/aide/portefeuille','https://www.hectarea.io/aide/investir'],
 'bricks': ['https://www.bricks.co/fonctionnement','https://www.bricks.co/frais'],
 'anaxago': ['https://www.anaxago.com/axclimat','https://www.anaxago.com/operations-financees'],
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
  dic=texts[3]
  required(r'Nom du produit : GFI FRANCE VALLEY PATRIMOINE',dic)
  stamp=required(r'Date de production du document d’informations clés : (\d{2})/(\d{2})/(20\d{2})',dic)
  dic_date=f'{stamp[3]}-{stamp[2]}-{stamp[1]}'
  if dt.date.fromisoformat(dic_date)>today:raise ValueError('Future GFI key information document')
  required(r'France Valley ne facture pas de coût de sortie sur ce produit',dic)
  required(r'FRANCE VALLEY perçoit une rémunération pour les transactions sur le marché secondaire',dic)
  required(r'rachat demandé soit compensé par une souscription permettant d’en couvrir le coût',dic)
  offers[0]['fields']['exit']=field('exit','Retrait compensé par une nouvelle souscription : pas de frais de sortie facturés par le GFI ou France Valley. Valeur de retrait définie dans la note d’information ; l’absence de frais de sortie ne garantit pas la récupération du montant investi. Sans souscription en face, une cession sur le marché secondaire peut être rémunérée. Prix et délai non garantis.',3)
  offers[0]['fields']['exit']['effectiveAt']=dic_date
  offers[0]['missing']=['Note d’information et bulletin de souscription actualisés ; conditions du marché secondaire']
  offers[0]['presentation']={'intro':'Acheter une forêt entière demande un budget conséquent. Le GFI France Valley Patrimoine permet de détenir des parts d’un patrimoine forestier géré pour toi.', 'vehicle':'Parts du GFI France Valley Patrimoine', 'mechanism':'Le GFI acquiert et gère des forêts. Ton placement évolue avec la valeur de ce patrimoine et son exploitation ; tu ne choisis pas une parcelle à utiliser personnellement.'}
  for index,key,name in [(1,'gfi-forets','GFI France Valley Forêts'),(2,'fonciere-europe','France Valley Foncière Europe')]:
   page=texts[index];is_sas=index==2
   required('SAS France Valley Foncière Europe' if is_sas else 'GFI France Valley Forêts',page)
   minimum=val(r'Montant minimum d’investissement ([\d ]+) €',page)
   horizon=val(r'Horizon de placement Min\. (\d+) ans',page)
   costs=required(r'La transparence sur les frais(?: du GFI)? (.*?)Vous donner toutes les clés',page)[1]
   entry=val(r'Commission de souscription\(2\) : [\d,.]+% HT \(([\d,.]+)% TTC\)' if is_sas else r'Commission de souscription\(2\) : ([\d,.]+)% TTC',costs)
   management=val(r'Commission de gestion\(3\) : [\d,.]+% HT \(([\d,.]+)% TTC\)/an' if is_sas else r'Commission de gestion\(3\) : ([\d,.]+)% TTC/an',costs)
   for amount in (entry,management):bounded(amount,0,100,'forest fund fee')
   required(r'aucune garantie ne peut être donnée quant au délai de revente',page)
   required(r'l’impact économique net est donc bien en HT',costs.replace("l'impact",'l’impact'))
   if is_sas:
    hold=val(r'période de détention minimale de (\d+) mois',page)
    extra=val(r'Droit d’entrée maximum : ([\d,.]+)%',costs)
    fixed=number(required(r'dépositaire.*?\(([\d. ]+) € TTC\)',costs)[1].replace('.',''))
    variable=val(r'dépositaire.*?\(([\d,.]+)% TTC\)',costs)
    required(r'l[’\']éventuel excédent est réinvesti dans le fonds',page)
    fee_text=f'Droit d’entrée : {fmt(extra)} % maximum, sans TVA ; souscription : {fmt(entry)} % TTC maximum. Gestion : {fmt(management)} % TTC/an. Dépositaire : {fmt(fixed)} € TTC/an + {fmt(variable)} % de l’actif jusqu’à 50 M€. Autres tranches non chiffrées sur cette page.'
    duration=f'Horizon conseillé : au moins {fmt(horizon)} ans ; détention minimale ELTIF : {fmt(hold)} mois. Le minimum ne garantit pas un remboursement.'
   else:
    fixed=number(required(r'dépositaire.*?([\d.]+) € TTC \+ commission variable',costs)[1].replace('.',''))
    required(r'0,048% TTC.*?0,03% TTC.*?0,018% TTC',costs)
    required(r'ces derniers soient capitalisés dans la valeur de votre investissement',page)
    fee_text=f'Souscription : {fmt(entry)} % TTC maximum. Gestion : {fmt(management)} % TTC/an sur la valeur des actifs du GFI. Dépositaire : {fmt(fixed)} € TTC + 0,048 % jusqu’à 50 M€, 0,03 % de 50 à 200 M€, 0,018 % au-delà.'
    duration=f'Horizon conseillé : au moins {fmt(horizon)} ans. Les contraintes fiscales de conservation sont à vérifier pour le GFI choisi ; elles ne garantissent pas une sortie.'
   transaction=val(r'Commission de transaction : [\d,.]+% HT \(([\d,.]+)% TTC\)' if is_sas else r'Commission de transaction : ([\d,.]+)% TTC',costs)
   notary=val(r'Frais de notaire/droits de mutation : ([\d,.]+)% environ',costs)
   fee_text+=f' Acquisition des forêts : transaction {fmt(transaction)} % TTC, notaire/mutation environ {fmt(notary)} %, expertise 12–120 € TTC/ha. Charges d’exploitation et administratives supplémentaires. TVA récupérée par le véhicule selon la page ; bases de frais distinctes.'
   o=offer(key,name,'Produit forestier distinct du GFI Patrimoine ; documentation publique, souscription à confirmer.' if is_sas else 'Gamme de GFI forestiers français ; le nom et les documents du GFI ouvert sont à confirmer.',{'access':f'Minimum affiché : {fmt(minimum)} €.','fees':fee_text,'duration':duration,'income':'Les coupes de bois participent au résultat ; les excédents peuvent être capitalisés. Aucun revenu annuel ni rendement minimum garanti.','exit':'Sortie dépendante des demandes de souscription ou d’acquisition ; aucun délai ou prix de revente garanti.'},['DIC, statuts et bulletin du véhicule effectivement souscrit ; détail des charges'],[['Minimum annoncé',f'{fmt(minimum)} €'],['Horizon conseillé',f'≥ {fmt(horizon)} ans'],['Gestion / an',f'{fmt(management)} % TTC']])
   for f in o['fields'].values():f['sourceUrl']=urls[index]
   o['presentation']={'intro':'Investir dans des forêts européennes sans gérer les arbres toi-même, ça te parle ? France Valley Foncière Europe détient et exploite un patrimoine forestier.' if is_sas else 'Tu aimerais investir dans des forêts françaises ? La gamme France Valley Forêts permet d’en détenir des parts, avec une gestion déléguée.', 'vehicle':'Actions de la SAS France Valley Foncière Europe' if is_sas else 'Parts du GFI de la gamme France Valley Forêts choisi à la souscription', 'mechanism':'La SAS acquiert et exploite des forêts européennes. Tu détiens des actions de la société, dont la valeur dépend notamment du patrimoine et du bois.' if is_sas else 'Le GFI acquiert et gère des forêts françaises. Chaque véhicule de la gamme a son propre patrimoine et ferme aux nouveaux investisseurs une fois sa collecte atteinte.'}
   offers.append(o)
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
  tariff=texts[1];required('Bricks',tariff)
  amount=val(r'frais de retrait de ([\d,.]+)€ TTC par virement bancaire externe',tariff)
  annual=val(r'offrons (\d+) retraits gratuits par année glissante',tariff)
  low,high=map(number,required(r'honoraires de ([\d,.]+) à ([\d,.]+)% HT du montant total collecté par projet',tariff).groups())
  if annual!=free or not 0<=low<=high<=100:raise ValueError('Conflicting Bricks fee terms')
  offers=[offer('obligations-immobilieres','Obligations immobilières Bricks','Règles de la plateforme ; l’émetteur, le coupon et l’échéance dépendent du projet.',{'access':f'Dès {fmt(ticket)} € annoncés.','fees':f'Pas de frais d’entrée ni de gestion pour l’investisseur. Retraits bancaires du solde : {fmt(free)} gratuits par année glissante, puis {fmt(amount)} € TTC chacun. Honoraires facturés au porteur de projet : {fmt(low)} à {fmt(high)} % HT du montant collecté ; ils ne sont pas une retenue directe sur ton versement.','duration':'Durée du titre propre au projet ; aucun délai commun qualifié.','income':'Intérêts selon le titre ; un taux annoncé n’est pas une performance réalisée.','exit':'Retirer le solde disponible ne permet pas de récupérer le capital encore investi dans une obligation. Remboursement et éventuelle cession dépendent du titre.'},['Projet précis : FICI, émetteur, coupon et échéance'],[['Accès annoncé',f'{fmt(ticket)} €'],['Retraits gratuits',f'{fmt(free)} / 12 mois'],['Retraits suivants',f'{fmt(amount)} € TTC']])]
  offers[0]['fields']['fees']['sourceUrl']=urls[1]
 elif id_=='anaxago':
  required(r'Format : Société de Libre Partenariat \(SLP\)',t)
  duration,extensions,years=map(int,required(r'Durée de vie du fonds\* : (\d+) ans \(prorogeable (\d+)x (\d+) an\)',t).groups())
  entry=val(r'Part B et E : ([\d,.]+)%',t)
  required(r'part E qui n’est pas dégressive',t.replace("n'est",'n’est'))
  required(r'dégressivité de 0,1 point/an à partir de la 6',t)
  required(r'Calendrier prévisionnel des flux pour toute souscription supérieure ou égale à 100.000€',t)
  initial=val(r'1er appel : ([\d,.]+)% à la souscription',t)
  semester=val(r'Puis ([\d,.]+)% par semestre',t)
  soup=BeautifulSoup(documents[1],'html.parser')
  card=soup.select_one('#campaign-widget-axclimat-i')
  if not card or card.get('data-campaign-state')!='Souscriptions terminées':raise ValueError('AxClimat subscription status changed; qualify new offer status')
  stamp=required(r'Cloturé le (\d{2})/(\d{2})/(20\d{2})',card.get_text(' ',strip=True))
  closed=f'{stamp[3]}-{stamp[2]}-{stamp[1]}'
  if dt.date.fromisoformat(closed)>today:raise ValueError('Future AxClimat closure')
  for key,part in [('axclimat-i','E'),('axclimat-i-b','B')]:
   ticket=val(r'Part '+part+r' : ([\d ]+)€',required(r'Souscription minimum : (.*?)Frais d’entrée',t.replace("d'entrée",'d’entrée'))[1])
   management=val(r'Part '+part+r' : ([\d,.]+)% / an',required(r'Frais de gestion récurrents : (.*?)Estimation des distributions',t)[1])
   access=f'Part {part} : minimum annoncé {fmt(ticket)} €.'
   access+=f' Calendrier publié dès 100000 € : {fmt(initial)} % à la souscription, puis {fmt(semester)} % par semestre.' if part=='B' else ' Échéancier de versement propre à cette part à confirmer ; le calendrier publié dès 100000 € n’est pas appliqué au ticket de 20000 €.'
   fee=f'Entrée : {fmt(entry)} %. Gestion récurrente : {fmt(management)} %/an'
   fee+=', sans dégressivité pour la part E.' if part=='E' else ' de N à N+5, puis baisse de 0,1 point/an annoncée à partir de la sixième année.'
   fee+=' Bases de calcul, frais sous-jacents et éventuelle commission de performance à vérifier dans les documents de cette part.'
   o=offer(key,'AxClimat I — part '+part,'SLP de private equity européen ; souscriptions clôturées, présentation informative.',{'access':access,'fees':fee,'duration':f'Durée de vie : {duration} ans, prorogeable {extensions} fois {years} an ; aucune date de remboursement garantie.','income':'Distributions annoncées à partir de la sixième année : estimation, pas un calendrier garanti. Le TRI cible n’est pas une performance réalisée.','exit':'Cessions et liquidations selon les documents du fonds ; revente rapide non garantie.'},['DIC et règlement de la part : bases des frais, coûts sous-jacents, cession'+(' et échéancier de versement' if part=='E' else '')],[['Ticket de la part',f'{fmt(ticket)} €'],['Gestion annoncée',f'{fmt(management)} %/an'],['Souscriptions','Clôturées']])
   o['availability']={'status':'closed','asOf':closed,'checkedAt':today.isoformat(),'sourceUrl':urls[1]}
   o['presentation']={'intro':'Investir dans la décarbonation peut aussi passer par des entreprises non cotées. AxClimat I, présenté par Anaxago, sélectionne des fonds européens dans ce domaine.', 'vehicle':'Parts '+part+' de la Société de Libre Partenariat AxClimat I', 'mechanism':'Le fonds investit dans des fonds de private equity et prévoit une poche de co-investissements et d’infrastructures. La part choisie détermine notamment ton ticket et tes frais.', 'distinction':'Tu détiens la part '+part+' d’AxClimat I. Les chiffres des opérations immobilières d’Anaxago ne représentent pas la performance de ce fonds.'}
   offers.append(o)
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

def collect(id_,today):
 raw=[fetch(u) for u in SOURCES[id_]]
 documents=[pdf_text(data) if u.endswith('.pdf') else data.decode() for u,data in zip(SOURCES[id_],raw)]
 record=parse(id_,documents,today)
 for source,data in zip(record['sources'],raw):source['sha256']=hashlib.sha256(data).hexdigest()
 return record

def refresh(previous,adapters,today):
 result=copy.deepcopy(previous);observations=[]
 for id_,adapter in adapters.items():
  try:
   record=adapter(today)
   if record['id']!=id_ or record['checkedAt']!=today.isoformat() or not record['offers']:raise ValueError('Wrong actor or collection date')
   if len(record['offers'])!=len({o['id'] for o in record['offers']}):raise ValueError('Duplicate offer identities')
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
