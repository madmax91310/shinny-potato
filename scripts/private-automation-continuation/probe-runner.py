
import os,json,pathlib,subprocess,urllib.request,urllib.error,time,datetime,hashlib,csv,io,gzip,base64,zipfile,shutil,collections
ROOT=pathlib.Path.cwd();OUT=pathlib.Path(os.environ['RECIPE_OUTPUT']);OUT.mkdir(parents=True,exist_ok=True);TEMP=pathlib.Path(os.environ['RUNNER_TEMP']);BRANCH='reports/consolidated-automation-evidence-20261106';FOLDER='reports/donnees-consolidees-2026-10-24/reprise-2026-11-10/livraison';BASE='https://madmax91310.github.io/shinny-potato/';API='https://api.github.com/repos/madmax91310/shinny-potato';TARGET='283e60cd56ce8c533a471ee558a3d44432d69786'
def now():return datetime.datetime.now(datetime.UTC).isoformat()
def save(n,d): (OUT/n).write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf8')
class SafeRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,newurl):
  redirected=super().redirect_request(req,fp,code,msg,headers,newurl)
  if redirected and not newurl.startswith('https://api.github.com/'):redirected.remove_header('Authorization')
  return redirected
opener=urllib.request.build_opener(SafeRedirect())
def read(url):
 req=urllib.request.Request(url)
 if url.startswith('https://api.github.com/'):req.add_header('Authorization','Bearer '+os.environ['GH_TOKEN']);req.add_header('Accept','application/vnd.github+json')
 with opener.open(req,timeout=90)as r:return r.read()
def load(url):return json.loads(read(url))
def run(*cmd,**kw):return subprocess.run(cmd,check=True,**kw)
def git(*args):return subprocess.check_output(['git',*args],text=True).strip()
def writecsv(path,rows):
 keys=list(dict.fromkeys(k for r in rows for k in r))
 with path.open('w',encoding='utf-8-sig',newline='')as f:
  w=csv.DictWriter(f,fieldnames=keys,delimiter=';');w.writeheader();w.writerows({k:json.dumps(v,ensure_ascii=False)if isinstance(v,(dict,list))else v for k,v in r.items()}for r in rows)
PRIMARY=['scripts/source-snapshots/monthly-collection-status.json','src/data/automated-etf-monthly.json','src/data/qualified-listing-records.json','src/data/dca-complete-holdings.json','src/data/dca-holdings-status.json','src/data/exposure-etf-expansion-records.json','src/data/automated-indices.json']
CODE=['src/data/holding-weight-basis.js','src/data/etf-cards.js','scripts/monthly-automation.json','scripts/lib/data-qualification.mjs','src/data/history-window-quality.js']
expected={p:git('rev-parse','HEAD:'+p)for p in PRIMARY+CODE}
save('probe-scope.json',{'declaredAt':now(),'probeCommit':git('rev-parse','HEAD'),'targetRecordingCommit':TARGET,'expectedPrimaryBlobs':{p:expected[p]for p in PRIMARY},'expectedCodeBlobs':{p:expected[p]for p in CODE},'purpose':'Read-only public qualification and export; no financial source collection or production deployment is invoked'})
end=time.monotonic()+7200;last=None;ready=None
while time.monotonic()<end:
 try:
  b=load(BASE+'build-info.json');m=load(BASE+'data/publication-manifest.json');data=b.get('dataSha')or b['sha'];state=(b['sha'],data)
  if state!=last:print(now(),'Public build',state,flush=True);last=state
  if all(m['files'].get(p)==expected[p]for p in PRIMARY):
   for rev in set([b['sha'],data]):run('git','fetch','--filter=blob:none','--depth=1','origin',rev,stdout=subprocess.DEVNULL)
   if all(git('rev-parse',b['sha']+':'+p)==expected[p]for p in CODE):
    assert load(BASE+'build-info.json')==b
    ready={'checkedAt':now(),'rawBuildInfo':b,'effectiveDataSha':data,'publicManifest':m,'expectedPrimaryBlobs':{p:expected[p]for p in PRIMARY},'verifiedCodeBlobs':{p:expected[p]for p in CODE},'meaning':'Exact public primary Git identities and code fingerprints, not supplier execution or cron proof'};save('public-primary-adoption.json',ready);break
 except Exception as e:print('Publication not yet verified:',type(e).__name__,str(e)[:140],flush=True)
 time.sleep(45)
if ready is None:raise TimeoutError('Fresh source recording and final code not yet public after bounded wait; no deployment-only request made')
run('git','checkout','--detach',ready['effectiveDataSha'])
for name,dest in [('probe-extract.mjs','probe-extract.mjs'),('probe-public-browser.mjs','scripts/probe-public-browser.mjs')]:shutil.copyfile(TEMP/name,ROOT/dest)
raw='https://raw.githubusercontent.com/madmax91310/shinny-potato/'+BRANCH+'/'+FOLDER+'/'
old79=list(csv.DictReader(io.StringIO(read(raw+'fenetres-79-statuts.csv').decode('utf-8-sig')),delimiter=';'));assert len(old79)==79
cases=[{'id':r['id'],'isin':r['instrument'],'year':int(r['année']),'previouslyQualified':r.get('qualification_moteur_10nov',r.get('qualified','')).lower()=='true'}for r in old79];assert sum(c['previouslyQualified']for c in cases)==71
save('archive-cases-79.json',cases)
oldidx=list(csv.DictReader(io.StringIO(read(raw+'compositions-indices.csv').decode('utf-8-sig')),delimiter=';'));save('archive-index-ids.json',list(dict.fromkeys(r['indice_id']for r in oldidx)))
run('npm','ci');run('node','scripts/build-dca-exposures.mjs');run('node','scripts/build-index-company-compositions.mjs');run('node','probe-extract.mjs');run('npx','playwright','install','--with-deps','chromium');run('node','scripts/probe-public-browser.mjs')
family=json.loads(gzip.decompress((OUT/'family.json.gz').read_bytes()));windows=load((OUT/'windows-79.json').as_uri()) if False else json.loads((OUT/'windows-79.json').read_text())
assert family['sourceCommit']==ready['effectiveDataSha'];assert all(r['qualified']for r in windows['rows']if r['previouslyQualified'])
# Keep real supplier reports and recording receipts separate from read-only tests.
artifact_specs=[(13816743218,42930361553,'workflow_dispatch'),(13815950152,42926326644,'push'),(13815024701,42930314406,'push'),(13816556420,42930314344,'push'),(13784741849,42845464106,'schedule'),(13805585584,42893015896,'push'),(13232852348,41639923023,'push')]
contracts=[];receipt_adoption=[]
for aid,rid,event in artifact_specs:
 try:
  z=zipfile.ZipFile(io.BytesIO(read(API+'/actions/artifacts/'+str(aid)+'/zip')))
  for info in z.infolist():
   p=pathlib.PurePosixPath(info.filename);assert not p.is_absolute()and '..'not in p.parts
   if not info.filename.endswith('.json'):continue
   if info.filename=='data-publication-receipt.json':
    receipt=json.loads(z.read(info));rows=[{'path':p,'producerBlob':blob,'publicBlob':ready['publicManifest']['files'].get(p),'matchesOriginalProducer':ready['publicManifest']['files'].get(p)==blob}for p,blob in receipt['files'].items()];receipt_adoption.append({'artifact':aid,'run':rid,'event':event,'receipt':receipt,'files':rows});continue
   if info.file_size>150000000:continue
   obj=json.loads(z.read(info));contract=obj.get('resultContract')
   if contract:
    contracts.append({'artifact':aid,'run':rid,'event':event,'path':info.filename,'reportSha256':hashlib.sha256(z.read(info)).hexdigest(),'resultContract':contract,'errors':obj.get('errors')or obj.get('failures'),'meaning':'Exact original producer outcome contract; not a financial certification of each retained field. No old attempt scope reconstructed.'})
   if info.filename.endswith('monthly-observation.json'):
    save('palladium-fresh-monthly-source-report.json',{'artifact':aid,'run':rid,'event':event,'report':obj,'recordingCommit':TARGET})
 except Exception as e:contracts.append({'artifact':aid,'run':rid,'event':event,'evidenceRetrievalError':str(e),'meaning':'Evidence retrieval failed; not reclassified as source failure or successful control'})
(OUT/'native-producer-contracts.json.gz').write_bytes(gzip.compress(json.dumps(contracts,ensure_ascii=False).encode()));save('legacy-receipt-adoption.json',receipt_adoption)
runs={}
for rid in [42926326372,42930361553,42930314344,42930314406,42926326644]:
 try:runs[str(rid)]={'run':load(API+'/actions/runs/'+str(rid)),'jobs':load(API+'/actions/runs/'+str(rid)+'/jobs?per_page=100')['jobs']}
 except Exception as e:runs[str(rid)]={'error':str(e)}
save('github-real-executions.json',runs)
# Capture existing monitor independently; never close an old failure by mere ancestry.
try:
 wrapper=load('https://raw.githubusercontent.com/madmax91310/shinny-potato/automation-status/automation-status.json');decoded=gzip.decompress(base64.b64decode(wrapper['data']));assert len(decoded)==wrapper['decodedBytes'];assert hashlib.sha256(decoded).hexdigest()==wrapper['sha256'];monitor=json.loads(decoded);targets={42845464106,42893015896,41639923023,42926326644,42930361553};selected=[]
 def visit(x):
  if isinstance(x,dict):
   if any(str(x.get(k,''))in {str(n)for n in targets}for k in ['runId','run_id','id']):selected.append(x);return
   for v in x.values():visit(v)
  elif isinstance(x,list):
   for v in x:visit(v)
 visit(monitor);(OUT/'monitor-selected-real-runs.json.gz').write_bytes(gzip.compress(json.dumps({'checkedAt':now(),'wrapperDecodedBytes':wrapper['decodedBytes'],'wrapperSha256':wrapper['sha256'],'selected':selected},ensure_ascii=False).encode()));del decoded,monitor
except Exception as e:save('monitor-evidence-limit.json',{'checkedAt':now(),'error':str(e),'meaning':'No monitor incident closure inferred from this missing verification'})
# Build dated views in the SAME canonical delivery folder; earlier matrices stay historical.
archive=TEMP/'automation-report-archive';run('git','clone','--single-branch','--depth=1','--branch',BRANCH,'https://github.com/madmax91310/shinny-potato.git',str(archive),stdout=subprocess.DEVNULL)
dest=archive/FOLDER;proofs=dest/'preuves'/'suite-2026-11-11';proofs.mkdir(parents=True,exist_ok=True)
for p in OUT.iterdir():
 if p.is_file()and p.name!='public-export.json':shutil.copyfile(p,proofs/p.name)
shutil.copytree(OUT/'png',proofs/'png',dirs_exist_ok=True)
rows=[]
for h in family['histories']:
 bad=[r for r in h['intervals']if not r.get('qualified')]
 rows.append({'actif_id':h['id'],'isin':h.get('isin'),'nom':h['name'],'devise':h['currency'],'convention':h.get('convention'),'premier_mois':h['first'],'dernier_mois':h['last'],'points':h['points'],'intervalles_valides':len(h['intervals'])-len(bad),'intervalles_refuses':bad,'annees_annuelles_admises':h['annualPriceYears'],'source':h['sourceUrls'],'configuration_producteur':h['configuredAutomation'],'dernier_controle_mensuel':h['latestMonthlyControl'],'date_registre_consomme':h['sourceCheckedAt'],'publication_verifiee':ready['effectiveDataSha'],'preuve':'preuves/suite-2026-11-11/public-primary-adoption.json','limite':'Configuration ne prouve pas un passage source; contrats réels distincts, conventions et refus ciblés conservés.'})
writecsv(dest/'performances-mensuelles-suite-2026-11-11.csv',rows)
rows=[]
for s in family['supports']:
 q=s['qualification'];rows.append({'actif_id':s['id'],'isin':s.get('isin'),'nom':s['name'],'pays':s['countries'],'secteurs':s['sectors'],'positions':s['holdings'],'qualification_recouvrement':q,'recouvrement_integral_admis':bool(q)and all(r.get('valid')and r.get('complete')for r in q),'hors_perimetre_actions':s['outside'],'indisponibilites':s['unavailable'],'publication_verifiee':ready['effectiveDataSha'],'preuve_consommateurs':'preuves/suite-2026-11-11/public-consumers-browser.json','limite':'Capacités par photographie et périmètre ; proxy ETF différent d’indice exact, classement différent de poids NAV.'})
writecsv(dest/'compositions-expositions-suite-2026-11-11.csv',rows);writecsv(dest/'compositions-indices-suite-2026-11-11.csv',[{**r,'publication_verifiee':ready['effectiveDataSha']}for r in family['indices']])
writecsv(dest/'fenetres-79-suite-2026-11-11.csv',[{**r,'distinction':'Voie indépendante qualifiée ne clôture pas l’ancienne divergence;77divergences+2résidus séparés','publication_verifiee':ready['effectiveDataSha']}for r in windows['rows']])
old=list(csv.DictReader((dest/'reconciliation-diagnostics-initiaux.csv').open(encoding='utf-8-sig'),delimiter=';'));current=json.loads(gzip.decompress((OUT/'public-export.json.gz').read_bytes()));by={r['id']:r for r in current['rows']}
writecsv(dest/'reconciliation-diagnostics-suite-2026-11-11.csv',[{**r,'date_suite_11nov':now(),'presence_exacte_suite_11nov':r['id_initial']in by,'categorie_suite_11nov':by.get(r['id_initial'],{}).get('kind'),'cause_suite_11nov':by.get(r['id_initial'],{}).get('cause'),'resolution_suite_11nov':by.get(r['id_initial'],{}).get('resolutionEvidence'),'limite_suite_11nov':'Absence seule ne prouve jamais résolution; les colonnes anciennes gardent leur photographie datée.'}for r in old])
count=sum(r['qualified']for r in windows['rows']);blocked=[r['id']for r in windows['rows']if not r['qualified']];admitted=sum(bool(s['qualification'])and all(q.get('valid')and q.get('complete')for q in s['qualification'])for s in family['supports']);proof=ready['rawBuildInfo'];stamp=now()
head=f"État vérifié le {stamp}. Code public {proof['sha']}; données {ready['effectiveDataSha']}. Suivi unique #881. Recette isolée GitHub, sans collecte supplémentaire ni redéploiement pour obtenir un statut vert. Les anciennes matrices restent datées ; les fichiers suite-2026-11-11 donnent les vues courantes.\n"
hist=head+f"""
| Historique | Disponibilité / usages | Actualisation démontrée | Blocage |
|---|---|---|---|
| Bitwise Paris EUR, même ISIN DE000A27Z304 |65mois juin2021–octobre2026; calculateur, Performance depuis, comparaison/classement, anniversaire déjà vérifiés publiquement |Source réelle push42893015896 à20:15:40UTC10nov, enregistrement8a4a8c4a; quotidien42893015651,9nov58.584EUR recoupé à clôture Euronext; nouvelles empreintes publiques vérifiées |Pas2021entier; ne répare ni n’explique Xetra |
| Bitwise Xetra EUR |Périodes valides conservées; ancienne route2023/24 encore refusée |Historique longHTTP400; flux court limité à3séances et métadonnée firstTradeDate5nov2026 |Continuité et bornes exactes de l’ancienne cotation, pas lancement réel du produit |
| WTI/Wheat/NGAS et Brent/WTI2020 |Usages qualifiés préservés, octobre2026 |Cron42845464106 source/enregistrementb28; reçu original comparé aux blobs publics; contrôleNAV distinct42774587390 |Le cours ne prouve pas une nouvelle acquisition NAV2020; tentative historique échouée demeure historique |
| Palladium IPDM.L, Londres USD |186mois mai2011–octobre2026, comparaison/classement déc2013–déc2015 et PNG vérifiés ordinateur/mobile |Reprise ordinaire ciblée42930361553, contrôle11nov00:34:00UTC, unchanged-verified réel; commit283e60cd poussé00:46:12; source/identité/publication/consommateurs vérifiés |NAVdéc2014 non réparée; cours2025 toujours refusé; investissement2014→aujourd’hui non rétabli; pas nouveau parcours anniversaire |
| Groupe constant79 |{count}/79 cas avec au moins une voie mensuelle qualifiée; toutes71fenêtres antérieures préservées |Deux gains Bitwise2023/24 par voie Paris distincte |Six sans voie: {', '.join(blocked)}; huit anciennes routes refusées restent distinctes des voies indépendantes |
\nLe premier push palladium42922668365 a acquis correctement mais a été refusé à l’enregistrement après modification concurrente des entrées. Ce refus reste conservé. La nouvelle consultation n’est pas une publication aveugle de cette sortie. Août2015 utilise la dernière séance quotidienne recoupée par une seconde fenêtre; les contrôles et seuils sont conservés. Le prix d’une part reste distinct de la NAV et du rendement réinvesti. Le palladium décembre2014 exige la borne NAV officielle et sa convention; le cours Londres n’explique pas cette ancienne divergence.\n
Les autres pièces: DE000A0H08P6/2019 exige les facteurs officiels de réinvestissement avril/juillet et la borne de fin d’année; DE000A27Z304/2021 manque décembre2020 et la continuité; FR0010755611/2021/2024 et FR0013411998/2025,FR0013412004/2025 exigent les flux/distributions et bornes couvrant les calendriers exacts. Les cellules documentaires vides ne valent jamais zéro.77anciennes divergences et2résidus restent suivis séparément.\n
Prochains horaires nominaux UTC après ce relevé: reprise mensuelle conditionnelle11nov06:45, cycle mensuel16nov06:15, cotations nonbond11nov07:15. Les derniers crons consultés sont antérieurs aux derniers correctifs: lancement manuel/push prouvé, premier cron postcorrectif pas encore observé. L’attente ne bloque pas les autres réparations.\n
CSV: [toutes les routes](performances-mensuelles-suite-2026-11-11.csv), [79cas](fenetres-79-suite-2026-11-11.csv). {len(family['histories'])}routes inventoriées: ce dénominateur n’est pas un nombre de parts uniques ni une certification indépendante de tous les champs.\n"""
comp=head+f"""
| Composition | Périmètre / usages autorisés | Actualisation | Blocage / pièce |
|---|---|---|---|
| Dow Jones |Photographie officielle31octobre, pays/secteurs/titres/entreprises; acquis préservés |Collecteur commun, nouvelles données publiques vérifiées par empreintes |Dates et périmètres conservés |
| Russell1000 |Pays/secteurs,1022titres31octobre; format classique conservé |Voie officielle existante maintenue |Top10entreprises exact après regroupement des classes: rangs/livre supplémentaires manquants |
| Six WisdomTree |Pays/secteurs indépendants conservés; classements stockés mais refusés comme poids NAV |Producteur réel42926326644,204attendus/203observations; source DataSpan/browser accessible, enregistrement9824ee99; retentions et reprises automatiques testées |SixAPI natives403; poids NAV/cash non qualifiés; pas de recouvrement intégral ni concentration dérivée de ces classements |
| STOXX600 FR0011550193 |Photographies valides conservées |Dernier producteur conserve l’incident individuel malgré jobvert |601lignes publiées pour contrat600; preuve datée du périmètre économique/traitement UPM-WISA manquante |
| DWS AllWorld, Uranium, SmallCap, EMIMI |Ventilations compatibles, livres présents conservés; couverture partielle explicite |Collecteurs communs existants, données publiques contrôlées |AllWorld: fonds monétaire4.66566796% et notionnels; Uranium: deuxVERDERA distinctes0.002% sansidentité; SmallCap: AKERO CVR; EMIMI: HEG GRAPHITE sansISIN |
| Autres fonds/indices |Capacités exactes par champ et photographie dans les CSV |Déclenchements selon publication source, pas tous les jours par principe |Livres exacts, identités/poids, accès ou qualification selon chaque ligne; quatre L&G création≠livre économique; S&P dividendes accès403; QYLD20lignes contradictoires |
\nCorrection financière démontrée: Quantum au9novembre possède47mêmesISIN sur deux réponses officielles, mais l’API native donne99.7068663385412%actions+0.2931336614588322%cash, le classement99.9998%actions. Six arrondis dépassent le modèle proportionnel naïf: la cause n’est pas attribuée sans preuve. #1227 et #1230 refusent la certification NAV de ces classements dans le recouvrement, la concentration et les présentations/comparaisons; aucune réintroduction par un secours manuel. Les six fiches restent sélectionnables avec copie/PNG, sans ajout technique aux images. Les anciennes preuves17.64%/22.07% prouvaient l’arithmétique du classement, pas son dénominateur NAV.\n
#1225 tente les six livres natifs avant le secours; panne de transport différente d’une contradiction financière; un classement non qualifié ne remplace pas un dernier livre natif cohérent. Dernières dates conservées. Les403 sont observés dans Ubuntu, macOS et le vrai producteur; aucun nouvel essai identique pour remplir un compteur. L’accès DataSpan public n’établit pas une licence de redistribution; les conditions non vérifiées restent non vérifiées, sans interdiction inventée.\n
{admitted}/{len(family['supports'])}identifiants de supports admis intégralement par le moteur courant; ce sont des capacités de photographies et alias, pas un taux de collectes autonomes. {len(family['indices'])}références d’indices examinées dans l’extraction actuelle. Recouvrement partiel, poids inconnus/liquidités et proxys distincts sont conservés. JEPG, Corée, Russell et Dow préservés.\n
Recette publique: six portfolios DCA avec calcul, qualification, invariance à l’ordre et PNG identique à l’aperçu, ordinateur/mobile; six présentationsETF avec sélection/copie et12exports. Les pays/secteurs indépendants ne sont pas retirés avec les classements. Prochains horaires nominaux11novUTC: indices06:40,ETF07:10,expositions07:45,livres07:50; premier cron après derniers correctifs à observer. Radar reste arrêté; aucun composant IA/Analyse d’entreprise restauré.\n
CSV: [fonds et supports](compositions-expositions-suite-2026-11-11.csv), [indices](compositions-indices-suite-2026-11-11.csv). Accès fournisseur, absence de livre, qualification financière et licence restent distincts; aucun top10 renormalisé à100%.\n"""
(dest/'HISTORIQUES-PERFORMANCES-suite-2026-11-11.md').write_text(hist,encoding='utf8');(dest/'COMPOSITIONS-EXPOSITIONS-suite-2026-11-11.md').write_text(comp,encoding='utf8')
delivery=head+f"""
Corrections fusionnées: #1223 transaction expositions; #1224 voie BitwiseParis; #1225 priorité livres natifs et rétention; #1226/#1228 publication Pages/route de statut; #1227 qualification NAV; #1229 palladiumLondres distinct; #1230 consommateursETF et qualification de supervision minimale. Les contrôles requis des PR ont réussi avant fusion; le gate de production et les collectes ordinaires restent distingués des tests isolés.\n
La perte de l’environnement local a interrompu la première recette finale et l’archivage complet de ses pièces temporaires. Cette recette GitHub relit les données publiques et les consommateurs depuis le snapshot effectivement servi, sans nouvelle collecte ni déploiement. Elle ne reconstitue pas rétroactivement les preuves locales perdues. Les anciens rapports et leurs identités restent conservés. {len(old)}identités de l’ancien export archivé sont rapprochées des{len(current['rows'])}identités du nouvel export public intégral. L’export local supplémentaire de17:15(10745lignes) n’est pas présenté comme intégralement réconcilié en l’absence de son fichier archivé. Absence d’une identité seule ne vaut jamais résolution.\n
L’ancienne alerte de publication est analysée par reçus originaux et empreintes publiques dans preuves/suite-2026-11-11/legacy-receipt-adoption.json. Les quatre blobs nonbond inchangés peuvent démontrer leur adoption; un fichier remplacé ne certifie pas tous ses champs. Les échecs historiques, le refus d’écriture palladium initial et les pannes de fournisseur restent séparés. Aucun redéploiement uniquement pour obtenir un statut vert.\n
L’exécution des producteurs a été réelle, mais le premier cron postcorrectif demeure à observer. Les403 natifs WisdomTree, les pièces de distributions/bornes des six cas et les identités/périmètres de compositions restent ouverts. Le correctif du transport data-only Pages est testé; son exercice effectif se lit dans les étapes des runs archivés, jamais déduit d’un simple job publication vert qui a délégué au gate complet.\n
[Historiques/performance](HISTORIQUES-PERFORMANCES-suite-2026-11-11.md) et [Compositions/expositions](COMPOSITIONS-EXPOSITIONS-suite-2026-11-11.md) donnent deux tableaux séparés. Automatisation complète non revendiquée. Les maquettes, conventions, données partagées et arrêts Radar/IA sont préservés.\n"""
(dest/'LIVRAISON-suite-2026-11-11.md').write_text(delivery,encoding='utf8')
# Publish only dated views/proofs on the existing report branch, with ordinary fast-forward protection.
run('git','-C',str(archive),'config','user.name','github-actions[bot]');run('git','-C',str(archive),'config','user.email','41898282+github-actions[bot]@users.noreply.github.com')
paths=[str(p.relative_to(archive))for p in dest.glob('*suite-2026-11-11*')]+[str(proofs.relative_to(archive))]
run('git','-C',str(archive),'add','--',*paths);run('git','-C',str(archive),'commit','-m','Archive verified public histories and compositions continuation, 11 November')
auth=base64.b64encode(('x-access-token:'+os.environ['GH_TOKEN']).encode()).decode();push_env=os.environ.copy();push_env.update(GIT_CONFIG_COUNT='1',GIT_CONFIG_KEY_0='http.https://github.com/.extraheader',GIT_CONFIG_VALUE_0='AUTHORIZATION: basic '+auth)
try:run('git','-C',str(archive),'push','origin','HEAD:refs/heads/'+BRANCH,env=push_env,stdout=subprocess.DEVNULL)
except subprocess.CalledProcessError:
 run('git','-C',str(archive),'fetch','origin',BRANCH,stdout=subprocess.DEVNULL);run('git','-C',str(archive),'rebase','origin/'+BRANCH);run('git','-C',str(archive),'push','origin','HEAD:refs/heads/'+BRANCH,env=push_env,stdout=subprocess.DEVNULL)
rev=git('-C',str(archive),'rev-parse','HEAD')
save('archive-receipt.json',{'commit':rev,'branch':BRANCH,'path':FOLDER,'public':proof,'dataSha':ready['effectiveDataSha'],'checkedAt':stamp})
link='https://github.com/madmax91310/shinny-potato/blob/'+rev+'/'+FOLDER+'/'
body=f"""Suite consolidée historiques/performances et compositions/expositions — état vérifié {stamp}.\n\nPR#1223/#1224/#1225/#1226/#1227/#1228/#1229/#1230 fusionnées. Code public {proof['sha']}; données {ready['effectiveDataSha']}, empreintes primaires et recettes réelles contrôlées. BitwiseParis EUR juin2021–octobre2026 apporte deux voies indépendantes2023/2024: {count}/79cas mensuels qualifiés,71antérieurs préservés, six sans voie. Xetra,77divergences et2résidus restent distincts.\n\nPalladiumIPDM.L: consultation ciblée réelle11nov00:34UTC, source/identité/validation/enregistrement283e60cd/publication et comparaison/classement déc2013–déc2015/PNG vérifiés. Le push initial42922668365 a été correctement refusé à l’écriture et reste historique. NAVdéc2014 et cours2025 restent refusés; aucun investissement2014→aujourd’hui annoncé rétabli.\n\nWisdomTree: les203observations/204attendus de42926326644 sont distinguées du défautSTOXX601 et des sixAPI natives403. Classements disponibles≠poids NAV; la différence47ISIN/99.706866%+cash contre99.9998% est démontrée et les consommateurs protégés. Six fiches restent utilisables, pays/secteurs préservés, recouvrements NAV non prouvés refusés. Aucun seuil ni poids modifié.\n\nL’environnement local est devenu indisponible; la recette finale a été reprise en GitHub isolé, sans collecte supplémentaire ni redéploiement artificiel. Export intégral actuel{len(current['rows'])}identités, {len(old)}identités de l’ancien export archivé conservées. L’export local17:15 non archivé n’est pas déclaré intégralement réconcilié. Premier cron après derniers correctifs encore à observer; Radar arrêté, IA et Analyse d’entreprise non restaurés.\n\nRapports séparés dans le même suivi/branche d’archives:\n- [Historiques et performances]({link}HISTORIQUES-PERFORMANCES-suite-2026-11-11.md)\n- [Compositions et expositions]({link}COMPOSITIONS-EXPOSITIONS-suite-2026-11-11.md)\n- [Livraison, matrices courantes et preuves]({link}LIVRAISON-suite-2026-11-11.md)\n\nAutomatisation complète non revendiquée: pièces de distributions/bornes, identités/périmètres de compositions, accès natifs403 et cron postcorrectif restent explicitement ouverts."""
req=urllib.request.Request(API+'/issues/comments/6776720896',data=json.dumps({'body':body}).encode(),headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],'Content-Type':'application/json'},method='PATCH')
with urllib.request.urlopen(req,timeout=90)as response:assert response.status==200
print('ARCHIVED',rev,'public',proof['sha'],'data',ready['effectiveDataSha'],flush=True)
