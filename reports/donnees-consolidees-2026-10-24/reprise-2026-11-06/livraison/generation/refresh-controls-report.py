"""Read current operational controls from immutable master objects, not a dirty worktree."""
import pathlib,json,csv,subprocess,re,hashlib
import csv
csv.field_size_limit(32 * 1024 * 1024)
R=pathlib.Path('/tmp/automation-20261106');O=R/'livraison';repo=R/'repo'
def git(*args):return subprocess.check_output(['git',*args],cwd=repo)
ref=git('rev-parse','origin/master').decode().strip();registry=json.loads(git('show',ref+':src/data/automation-workflows.json'))
with open(O/'workflows-et-perimetres.csv',encoding='utf-8-sig',newline='')as f:prior={r['workflow']:r for r in csv.DictReader(f,delimiter=';')}
paths=git('ls-tree','-r','--name-only',ref,'.github/workflows').decode().splitlines();rows=[]
for path in paths:
 if not path.endswith(('.yml','.yaml')):continue
 name=path.rsplit('/',1)[-1];body=git('show',ref+':'+path);text=body.decode();crons=[v.strip().strip('"\'')for v in re.findall(r'^\s*-\s*cron:\s*(.+?)\s*$',text,re.M)];meta=registry.get(name,{})
 row=prior.get(name,{'workflow':name,'rôle':'rôle non qualifié dans le suivi antérieur ; conservé explicitement'})
 row.update({'enregistré':name in registry,'programmations':crons,'consommateurs':meta.get('tools',[]),'routes':meta.get('paths',[]),'collectionJob':meta.get('collectionJob'),'automaticité_déclarée':meta.get('automatic','non renseignée ; déclencheurs et registre font foi'),'référence_master_des_contrôles':ref,'sha256_workflow':hashlib.sha256(body).hexdigest(),'périmètre_prouvé_dans_ce_lot':'voir reçus individuels ; déclencheur ou succès global ne certifie pas les champs'})
 if meta.get('automatic')is False:row['rôle']='collecte sur demande ; automatisation volontairement arrêtée, pas une panne ni une donnée réparée'
 rows.append(row)
keys=list(dict.fromkeys(k for r in rows for k in r))
with open(O/'workflows-et-perimetres.csv','w',encoding='utf-8-sig',newline='')as f:
 w=csv.DictWriter(f,fieldnames=keys,delimiter=';');w.writeheader();w.writerows({k:json.dumps(v,ensure_ascii=False)if isinstance(v,(dict,list))else v for k,v in r.items()}for r in rows)
b=json.load(open(O/'bilan.json'));b.update({'operationalControlsMasterRef':ref,'workflowFiles':len(rows),'registeredWorkflowEntries':len(registry),'workflowFilesWithCron':sum(bool(r['programmations'])for r in rows),'registeredManualWorkflows':[k for k,v in registry.items()if v.get('automatic')is False],'concurrentRadarStopPreserved':['1188','1189']});(O/'bilan.json').write_text(json.dumps(b,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:b[k]for k in ['operationalControlsMasterRef','workflowFiles','registeredWorkflowEntries','workflowFilesWithCron','registeredManualWorkflows']}))
