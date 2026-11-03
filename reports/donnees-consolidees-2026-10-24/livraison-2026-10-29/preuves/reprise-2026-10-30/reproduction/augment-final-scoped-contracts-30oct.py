import csv,gzip,json,pathlib,collections,datetime
csv.field_size_limit(16000000)
r=pathlib.Path('/dev/shm/data-automation-20261028');out=r/'consolidated-30oct';p=r/'proofs-29oct';file=out/'matrice-donnees-usages.csv.gz'
with gzip.open(file,'rt',encoding='utf-8-sig',newline='')as f:q=csv.DictReader(f,delimiter=';');cols=q.fieldnames;rows=list(q)
release=json.loads((p/'final-release-proof-30oct.json').read_text());summary=json.loads((p/'exact-share-annual-public-30oct/summary.json').read_text());assert len(summary['results'])==10
annual={x['isin']for x in summary['results']}|{'GB00B15KXQ89'}
monthly=json.loads((p/'five-wisdom-panx-ordinary-recording-30oct.json').read_text());histories={'history:'+x['id']:x for x in monthly['cases']if x['isin']!='FR0013412269'}
counts=collections.Counter()
def qualify(x,proof,scope,limit):
 x.update(etat='A',nature_ecart='chaîne automatisée et usage vérifiés sur le périmètre exact',blocage='',statut_consommateur_declare='raccordé et vérifié dans le périmètre déclaré',preuve_intervention_30oct='preuves/reprise-2026-10-30/'+proof,usage_verifie_30oct=scope,limite_preuve_30oct=limit,publication_code=release['publicVersion']['sha'],publication_donnees=release['publicVersion'].get('dataSha',release['publicVersion']['sha']))
 counts[proof]+=1
for x in rows:
 if x['route']in ['/generateur-portefeuilles','/duels-portefeuilles'] and x['actif_identifiant']in annual and x['donnee']=='Rendements 2020–2025' and x.get('id_publication_30oct'):
  proof='copper-manual-nav-public-30oct/results.json'if x['actif_identifiant']=='GB00B15KXQ89'else'exact-share-annual-public-30oct/'+x['actif_identifiant']+'/results.json'
  qualify(x,proof,'Calendrier exact et devise contrôlés dans les deux moteurs, conversionBCE unique, sélection/calcul/texte/aperçu/PNG sur1280/390. Minimum automatique inchangé, contrôles de recettes existants conservés.','Les années effectivement disponibles seulement sont utilisées : un calendrier partiel n’est pas certifié sur six années. Absence de période antérieure respectée ; voies annuelles distinctes des neuf fenêtres mensuelles refusées et des77anciennes divergences.')
 if x['route']in ['/calculateur-investissement','/performance-depuis'] and x['actif_identifiant']in histories and x['donnee']=='Série historique':
  d=histories[x['actif_identifiant']]
  qualify(x,'five-wisdom-panx-ordinary-recording-30oct.json','Voie NAV WisdomTree de la part exacte,17champs de qualification et ancrages annuels ; contrôle source ordinaire inchangé-vérifié, enregistrement1591536, manifeste public concordant. Calculateur EUR/USD/unique/DCA et Performance annuels, texte/PNG publics.','Cinq voies exactes seulement ; pas le catalogue complet, pas une licence de réutilisation, pas une explication des anciennes cotations ni un cron fournisseur post-correction observé.')
  x['dernier_controle_reussi']=d['sourceCheckedAt'];x['derniere_tentative_champ']=d['sourceCheckedAt'];x['derniere_donnee']=d['periodEnd'];x['derniere_execution_source']='https://github.com/madmax91310/shinny-potato/actions/runs/41098996392'
 if x['route']=='/presentations' and x['actif_identifiant']in ['scpi:transitions-europe','scpi:epargne-pierre']and x['donnee']in ['Pays et secteurs','Prix de souscription','Taux d’occupation financier']:
  qualify(x,'browser-scpi-q3-public-30oct/results.json','Source réelle bulletinsT3, reprise automatique bot41126561155, enregistrementd186ef9, publication par empreinte, pays/secteurs/prix/TOF exacts dans le texte, copie, aperçu et4PNG desktop/mobile.','Trois champs par SCPI seulement ; la preuve du bulletin ne renouvelle pas les frais ou caractéristiques non réextraits. Échéances futures non annoncées distinctes des retards réels.')
 if x['route']=='/pouvoir-achat' and x['actif_identifiant']=='purchasing:general' and x['donnee']=='Série INSEE utilisée et dernier niveau':
  qualify(x,'purchasing-public-independent-calculation-30oct.json','Collecte INSEE ordinaire, enregistrement136f23f/d1e072f, manifeste concordant. Calcul indépendant niveaux2015→septembre2026 : inflation24,6638579%, revenu équivalent1246,63858EUR, textes et PNG publics aux deux largeurs.','Série générale uniquement ; les hypothèses de revenu1000EUR et hausse10% sont des saisies de scénario, pas un salaire collecté. Octobre provisoire n’est pas présenté comme définitif.')
assert counts['browser-scpi-q3-public-30oct/results.json']==6,counts
assert counts['five-wisdom-panx-ordinary-recording-30oct.json']==10,counts
with gzip.open(file,'wt',encoding='utf-8-sig',newline='')as f:w=csv.DictWriter(f,fieldnames=cols,delimiter=';',lineterminator='\n');w.writeheader();w.writerows(rows)
b=json.loads((out/'matrice-bilan.json').read_text());b['statuts']=dict(collections.Counter(x['etat']for x in rows));b['diagnostics']=dict(collections.Counter(x['nature_ecart']for x in rows));b['scopedCurrentProofsAdded']=dict(counts);b['noCatalogueCertificationFromGreenJob']=True;(out/'matrice-bilan.json').write_text(json.dumps(b,ensure_ascii=False,indent=2));print(dict(counts))
