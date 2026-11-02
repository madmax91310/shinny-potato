import csv,gzip,io,json,pathlib,sys,collections
base=pathlib.Path(sys.argv[1]); proof=base/'preuves/reprise-2026-11-01'; prefix='preuves/reprise-2026-11-01/'
def read(n):
 b=(base/n).read_bytes();b=gzip.decompress(b) if n.endswith('.gz') else b;r=csv.DictReader(io.StringIO(b.decode('utf-8-sig')),delimiter=';');return list(r.fieldnames),list(r)
def write(n,fields,rows):
 o=io.StringIO(newline='');w=csv.DictWriter(o,fieldnames=fields,delimiter=';',lineterminator='\n');w.writeheader();w.writerows(rows);b=o.getvalue().encode('utf-8-sig');(base/n).write_bytes(gzip.compress(b,mtime=0) if n.endswith('.gz') else b)
record=json.loads((proof/'monthly-752-first-recording-proof.json').read_text());publication=json.loads((proof/'monthly-october-publication-proof.json').read_text());assert publication['allRequiredMonthlyInputsPublished']
acquired={r['id'] for r in record['sourceOutcomesMatchedToRecordedSeries'] if r['sourceStatus']=='validated'};assert len(acquired)==679
failed={r['id'] for r in record['sourceOutcomesMatchedToRecordedSeries'] if r['sourceStatus']=='failed'};assert len(failed)==5 and not acquired&failed
browser=[json.loads((proof/n/'proof.json').read_text()) for n in ['public-final-histories-usd','public-final-paypal-eur','public-final-sbux-eur','public-final-korea-eur']]
fields,rows=read('matrice-donnees-usages.csv.gz');ids=[r['id_suivi'] for r in rows]
extra=['collecte_enregistree_publiee_1nov','preuve_source_publiee_1nov'];fields += [k for k in extra if k not in fields];matches=0
for r in rows:
 key=r['actif_identifiant'].removeprefix('history:')
 if r['actif_identifiant'].startswith('history:') and key in acquired:
  matches+=1;r['collecte_enregistree_publiee_1nov']='Mois clos2026-10 : réponse source individuelle validée, enregistrement06a8557 et trois blobs publics identiques. Ne certifie pas chaque champ ni toutes les fenêtres anciennes.';r['preuve_source_publiee_1nov']=prefix+'monthly-october-publication-proof.json ; '+prefix+'monthly-752-first-recording-proof.json#'+key
 for n,b in zip(['public-final-histories-usd','public-final-paypal-eur','public-final-sbux-eur','public-final-korea-eur'],browser):
  calc=next((x for x in b['calculations'] if 'history:'+x['id']==r['actif_identifiant']),None)
  if calc and r['route']=='/calculateur-investissement':
   r['preuve_intervention_1nov']=prefix+n+'/proof.json';r['usage_verifie_1nov']='Calcul public janvier2020–octobre2026, devise'+calc['targetCurrency']+', montant indépendant sur les blobs publiés ; source native'+calc['nativeCurrency']+'.';r['limite_preuve_1nov']='Texte et PNG seulement pour les actifs explicitement présents dans downloads ; aucune certification des autres fenêtres.'
  if b['comparison']['id']==key and r['route']=='/classements-performances':
   r['preuve_intervention_1nov']=prefix+n+'/proof.json';r['usage_verifie_1nov']='Comparaison octobre2024–octobre2026, rendement annualisé et2026partielle indépendants, devise'+b['calculations'][0]['targetCurrency']+', texte etPNG.';r['limite_preuve_1nov']='Année2026partielle distincte du classement annuel complet ; aucune ancienne divergence expliquée.'
assert ids==[r['id_suivi'] for r in rows];write('matrice-donnees-usages.csv.gz',fields,rows)
fields,rows=read('bilan-par-outil.csv')
for r in rows:
 if r['route']=='/calculateur-investissement':
  r.update(fonctionnement_demontre_1nov='679/684historiques du mois clos collectés, validés, enregistrés et publiés ;16calculs USD publics, PayPal/SBUX/KoreaEUR indépendants, textes/PNG ciblés. Rattrapage automatique du mois clos corrigé.',actualisation_partielle_1nov='Les5queues NAV/TR octobre refusées conservent septembre. Source iShares quotidienne trop courte pour corroborer la borne réinvestie ; aucune extrapolation.',blocages_1nov='9/79anciennes fenêtres sur6parts restent refusées, plus5queues octobre et Palladium2014-12hors79 ;77anciennes divergences+2résidus distincts.',suite_1nov='Obtenir distributions/niveaux réinvestis/identité exacts manquants ; observer le prochain cron fournisseur après correction.',preuve_1nov=prefix+'monthly-october-publication-proof.json ; '+prefix+'public-final-histories-usd/proof.json ; '+prefix+'public-final-paypal-eur/proof.json ; '+prefix+'public-final-sbux-eur/proof.json ; '+prefix+'public-final-korea-eur/proof.json')
 if r['route']=='/classements-performances':
  r.update(fonctionnement_demontre_1nov='PayPalUSD/EUR, SBUXEUR et KoreaEUR : octobre2024–octobre2026, rendement annualisé et2026partielle recalculés, textes/PNG ;679séries publiées ne valent pas679recettes navigateur.',actualisation_partielle_1nov='Années complètes, couleurs fixes, exaequo et protections contrôlés enCI ; les nouveaux mois refusés restent exclus.',blocages_1nov='9anciennes fenêtres refusées et5queues octobre non corroborées ; aucun calendrier annuel existant compté comme nouveau mois.',suite_1nov='Mêmes pièces financières que le calculateur ; cron fournisseur futur distinct des lancements push/manuels.',preuve_1nov=prefix+'public-final-histories-usd/proof.json ; '+prefix+'public-final-paypal-eur/proof.json ; '+prefix+'public-final-sbux-eur/proof.json ; '+prefix+'public-final-korea-eur/proof.json')
 if r['route']=='/il-y-a-x-ans':
  r['fonctionnement_demontre_1nov']='665/670observations acquises au producteur ordinaire41356639048 :14anciens KeyError de change éliminés après BCE ; publication de ce nouveau run à vérifier séparément.5niveaux conservés29/30octobre restent utilisables et vérifiés avec calcul/date/6PNG.';r['blocages_1nov']='5contrôles NAV/TR quotidiens toujours en échec ; FTSE All-World mensuel fournisseur incomplet ; aucune date de réussite rajeunie pour les valeurs conservées.';r['preuve_1nov']+=' ; '+prefix+'publication-after-fx-41356639048-summary.json'
 if r['route']=='/performance-depuis':
  r['fonctionnement_demontre_1nov']+='679historiques octobre et changes communs réellement publiés, suite de consommateurs NAV complète réussie ; pas de nouveau parcours navigateur spécifique revendiqué.';r['blocages_1nov']='9anciennes fenêtres et5queues octobre toujours refusées ; périodes indépendamment qualifiées conservées.'
write('bilan-par-outil.csv',fields,rows)
p=base/'matrice-bilan.json';x=json.loads(p.read_text());x['publication1nov']={'sourceRun':41348779291,'recordCommit':record['recordCommit'],'validatedSeries':679,'expectedSeries':684,'failedSeries':sorted(failed),'sourceOutcomeConsumerRowsMatched':matches,'independentBrowserCalculations':sum(len(b['calculations']) for b in browser),'publicInputsProof':prefix+'monthly-october-publication-proof.json','qualificationStatesPreserved':True,'coverageLimit':'Comptes de séries, de contrats et de recettes distincts ; aucun taux global de certification.'};p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n');print(json.dumps(x['publication1nov'],ensure_ascii=False))
