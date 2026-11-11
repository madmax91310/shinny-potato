
import os,pathlib,subprocess,json,shutil,base64,datetime,urllib.request
ROOT=pathlib.Path.cwd();TEMP=pathlib.Path(os.environ['RUNNER_TEMP']);OUT=pathlib.Path(os.environ['RECIPE_OUTPUT']);OUT.mkdir(parents=True,exist_ok=True);CANDIDATE='912a46c76c8cbd4a29ebecd3e19b038a3790299a'
def run(*a,**kw):return subprocess.run(a,check=True,**kw)
run('git','fetch','--depth=1','origin',CANDIDATE);run('git','checkout','--detach',CANDIDATE);shutil.copyfile(TEMP/'probe-public-browser.mjs',ROOT/'scripts/probe-vaneck-real-gate.mjs')
run('npm','ci')
if not shutil.which('pdftotext'):run('sudo','apt-get','update');run('sudo','apt-get','install','-y','poppler-utils')
run('npx','playwright','install','--with-deps','chromium')
run('node','scripts/test-vaneck-document.mjs');run('node','scripts/test-vaneck-gate-ui.mjs');run('node','scripts/probe-vaneck-real-gate.mjs')
results=json.loads((OUT/'real-source-results.json').read_text());assert results['sourceCode']==CANDIDATE
archive=TEMP/'vaneck-candidate-evidence';branch='reports/consolidated-automation-evidence-20261106';folder='reports/donnees-consolidees-2026-10-24/reprise-2026-11-10/livraison/preuves/vaneck-gate-candidat-2026-11-11'
run('git','clone','--single-branch','--depth=1','--branch',branch,'https://github.com/madmax91310/shinny-potato.git',str(archive),stdout=subprocess.DEVNULL);dest=archive/folder;dest.mkdir(parents=True,exist_ok=True)
for p in OUT.glob('*.json'):shutil.copyfile(p,dest/p.name)
(dest/'STATUT.md').write_text('PR #1231 : preuve candidate en lecture seule, avant fusion. Les fixtures contrôlent les deux anciennes erreurs de confirmation et les contrôles retail. Les résultats JSON sont issus de requêtes réelles à deux routes officielles de la même part. Aucun registre financier ni date applicative modifié. La qualification des champs, le passage du producteur de production, sa publication et le cron restent à vérifier séparément. Les PDF bruts restent dans l’artefact GitHub de ce test, sans déduire une licence de réutilisation.\n',encoding='utf8')
run('git','-C',str(archive),'config','user.name','github-actions[bot]');run('git','-C',str(archive),'config','user.email','41898282+github-actions[bot]@users.noreply.github.com');run('git','-C',str(archive),'add','--',folder);run('git','-C',str(archive),'commit','-m','Archive candidate VanEck fallback source proof without a production claim')
auth=base64.b64encode(('x-access-token:'+os.environ['GH_TOKEN']).encode()).decode();env=os.environ.copy();env.update(GIT_CONFIG_COUNT='1',GIT_CONFIG_KEY_0='http.https://github.com/.extraheader',GIT_CONFIG_VALUE_0='AUTHORIZATION: basic '+auth)
try:run('git','-C',str(archive),'push','origin','HEAD:refs/heads/'+branch,env=env,stdout=subprocess.DEVNULL)
except subprocess.CalledProcessError:
 run('git','-C',str(archive),'fetch','origin',branch);run('git','-C',str(archive),'rebase','origin/'+branch);run('git','-C',str(archive),'push','origin','HEAD:refs/heads/'+branch,env=env,stdout=subprocess.DEVNULL)
sha=subprocess.check_output(['git','-C',str(archive),'rev-parse','HEAD'],text=True).strip();print('VANECK_CANDIDATE_ARCHIVED',sha,'source',CANDIDATE,'successes',sum(r['status']=='succeeded'for r in results['rows']),flush=True)
