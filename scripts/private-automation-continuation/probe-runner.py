
import os,json,pathlib,subprocess,urllib.request,shutil,base64,csv,datetime
ROOT=pathlib.Path.cwd();TEMP=pathlib.Path(os.environ['RUNNER_TEMP']);OUT=pathlib.Path(os.environ['RECIPE_OUTPUT']);OUT.mkdir(parents=True,exist_ok=True);FOLDER='reports/donnees-consolidees-2026-10-24/reprise-2026-11-10/livraison';BRANCH='reports/consolidated-automation-evidence-20261106';BASE='https://madmax91310.github.io/shinny-potato/';API='https://api.github.com/repos/madmax91310/shinny-potato'
def run(*a,**kw):return subprocess.run(a,check=True,**kw)
def git(*a):return subprocess.check_output(['git',*a],text=True).strip()
def read(u):return json.load(urllib.request.urlopen(u,timeout=90))
def save(n,x):(OUT/n).write_text(json.dumps(x,ensure_ascii=False,indent=2),encoding='utf8')
paths=['src/data/automated-etf-monthly.json','src/data/monthly-fx.json','scripts/source-snapshots/monthly-collection-status.json','src/data/anniversary-levels.json']
expected={p:git('rev-parse','HEAD:'+p)for p in paths};b=read(BASE+'build-info.json');m=read(BASE+'data/publication-manifest.json');data=b.get('dataSha')or b['sha'];assert all(m['files'].get(p)==expected[p]for p in paths),'Public sources changed; reconcile before testing'
save('targeted-public-primary-adoption.json',{'checkedAt':datetime.datetime.now(datetime.UTC).isoformat(),'public':b,'effectiveDataSha':data,'exactSourceBlobs':expected,'meaning':'Read-only additional consumer checks; no source recollection or deployment'})
shutil.copyfile(ROOT/'scripts/private-automation-continuation/per-tool-snapshot.csv',OUT/'per-tool-input.csv')
run('git','fetch','--depth=1','origin',data,stdout=subprocess.DEVNULL);run('git','checkout','--detach',data);shutil.copyfile(TEMP/'probe-public-browser.mjs',ROOT/'scripts/probe-public-browser.mjs')
run('npm','ci');run('npx','playwright','install','--with-deps','chromium');run('node','scripts/probe-public-browser.mjs')
proof=json.loads((OUT/'targeted-consumers.json').read_text());assert proof['before']==b==proof['after'];assert not proof['errors']
valid=[r for r in proof['rows']if r.get('available')];refused=[r for r in proof['rows']if r.get('available')is False];pd=[r for r in valid if r.get('asset')=='etcPalladiumMarket'];paris=[r for r in valid if r.get('asset')=='etfDE000A27Z304Paris']
assert len(paris)==4,'Paris lump/DCA desktop/mobile';assert len([r for r in refused if r.get('year')==2013])==4,'Pd2013 crossing2025 stays refused';assert len(proof['rows'])==20
report=TEMP/'targeted-report-archive';run('git','clone','--single-branch','--depth=1','--branch',BRANCH,'https://github.com/madmax91310/shinny-potato.git',str(report),stdout=subprocess.DEVNULL)
dest=report/FOLDER;evidence=dest/'preuves/parcours-historiques-2026-11-11';evidence.mkdir(parents=True,exist_ok=True)
for p in OUT.iterdir():
 if p.is_file():shutil.copyfile(p,evidence/p.name)
shutil.copytree(OUT/'png',evidence/'png',dirs_exist_ok=True)
rows=list(csv.DictReader((OUT/'per-tool-input.csv').open(encoding='utf-8-sig'),delimiter=';'))
for r in rows:
 if r['outil']in ['Performance depuis','Il y a X ans']:r['preuve_et_portee']='Nouvelle recette publique actuelle Paris ordinateur/mobile : preuves/parcours-historiques-2026-11-11/targeted-consumers.json ; source/stockage/publication prouvés séparément.'
 if r['outil']=='Calculateur / Et si tu avais investi / DCA d’investissement':
  r['usages_disponibles']='Paris2023→octobre2026 : versement unique et DCA, montants natifsEUR, texte/copie/aperçu/PNG ordinateur-mobile vérifiés.'+(' Palladiumjanvier2026→octobre2026 : deux modes natifsUSD et mêmes exports vérifiés.'if len(pd)==4 else' Palladiumrécent : consulter refus précis dans la preuve.')
  r['limites']='Palladiumdepuis2013 refusé dans les deux modes et les deux viewports car traversant la restriction2025. Aucune donnée source ni convention modifiée pour cette recette.'
  r['preuve_et_portee']='preuves/parcours-historiques-2026-11-11/targeted-consumers.json ; formule indépendante sur les cours mensuels (versement unique et parts cumulées en DCA), exactitude des montants copiés et PNG égal à aperçu.'
 if r['outil'].startswith('Qui a vraiment gagné'):r['preuve_et_portee']+=' Nouvelle recette Paris2023/2024 ordinateur-mobile : preuves/parcours-historiques-2026-11-11/targeted-consumers.json.'
 r['version_code_publique']=b['sha'];r['version_donnees_publiques']=data
with(dest/'bilan-par-outil-suite-2026-11-11.csv').open('w',encoding='utf-8-sig',newline='')as f:w=csv.DictWriter(f,fieldnames=list(rows[0]),delimiter=';');w.writeheader();w.writerows(rows)
note=f"""\n\n## Complément de recette publique ciblée\n\nLe code public {b['sha']} et les données {data} sont restés identiques avant et après les vingt scénarios. Paris : versement unique/DCA depuis janvier2023, Performance depuis2023, anniversaire1an, comparaison/classement2023–2024, texte et PNG vérifiés sur ordinateur/mobile. Les calculs d’investissement sont recoupés par une formule indépendante sur les cours mensuels et le téléchargement est identique à l’aperçu. Palladium : {len(pd)}scénarios récents janvier2026→octobre2026 réellement calculés enUSD; les quatre scénarios partant de2013 restent refusés en raison de2025. Cette recette ne modifie aucune donnée ni convention et ne prouve pas un cron.\n\n[Preuves détaillées](preuves/parcours-historiques-2026-11-11/targeted-consumers.json) et [bilan par outil](bilan-par-outil-suite-2026-11-11.csv). Les limites de supervision et les pièces financières encore manquantes ci-dessus restent ouvertes.\n"""
for n in ['HISTORIQUES-PERFORMANCES-suite-2026-11-11.md','LIVRAISON-suite-2026-11-11.md']:
 p=dest/n;p.write_text(p.read_text(encoding='utf8')+note,encoding='utf8')
run('git','-C',str(report),'config','user.name','github-actions[bot]');run('git','-C',str(report),'config','user.email','41898282+github-actions[bot]@users.noreply.github.com')
run('git','-C',str(report),'add','--',FOLDER+'/preuves/parcours-historiques-2026-11-11',FOLDER+'/bilan-par-outil-suite-2026-11-11.csv',FOLDER+'/HISTORIQUES-PERFORMANCES-suite-2026-11-11.md',FOLDER+'/LIVRAISON-suite-2026-11-11.md');run('git','-C',str(report),'commit','-m','Prove new monthly quote consumers on the actual public build')
auth=base64.b64encode(('x-access-token:'+os.environ['GH_TOKEN']).encode()).decode();env=os.environ.copy();env.update(GIT_CONFIG_COUNT='1',GIT_CONFIG_KEY_0='http.https://github.com/.extraheader',GIT_CONFIG_VALUE_0='AUTHORIZATION: basic '+auth)
try:run('git','-C',str(report),'push','origin','HEAD:refs/heads/'+BRANCH,env=env,stdout=subprocess.DEVNULL)
except subprocess.CalledProcessError:
 run('git','-C',str(report),'fetch','origin',BRANCH);run('git','-C',str(report),'rebase','origin/'+BRANCH);run('git','-C',str(report),'push','origin','HEAD:refs/heads/'+BRANCH,env=env,stdout=subprocess.DEVNULL)
rev=git('-C',str(report),'rev-parse','HEAD');save('targeted-archive-receipt.json',{'commit':rev,'public':b,'dataSha':data,'validCalculatorScenarios':len(valid),'refusedScenarios':len(refused)})
req=urllib.request.Request(API+'/issues/comments/6776720896',headers={'Authorization':'Bearer '+os.environ['GH_TOKEN']});old=json.load(urllib.request.urlopen(req,timeout=90));body=old['body'].replace('bce8713376be8009cca70598b49e9819b579b8fd',rev)
body+='\n\nComplément ciblé : vingt scénarios publics Paris/palladium vérifiés, calculs indépendants, texte/copie/aperçu/PNG ordinateur-mobile. Paris calculateur unique/DCA, Performance depuis, anniversaire et deux classements prouvés sur la version actuelle. Palladium récent : '+str(len(pd))+'scénarios enUSD; quatre départs2013 restent refusés car traversant2025. Aucun nouveau run fournisseur ni déploiement. Bilan par outil et preuves ajoutés dans la même archive.'
req=urllib.request.Request(API+'/issues/comments/6776720896',data=json.dumps({'body':body}).encode(),headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],'Content-Type':'application/json'},method='PATCH');assert urllib.request.urlopen(req,timeout=90).status==200
print('TARGETED_ARCHIVED',rev,'public',b['sha'],'data',data,'pdRecentValid',len(pd),flush=True)
