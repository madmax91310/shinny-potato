import pathlib,csv,gzip,json,hashlib,datetime,collections
r=pathlib.Path('/dev/shm/data-automation-20261028');o=r/'consolidated-30oct';b=pathlib.Path('/workspace/finalisation-donnees-20261027');csv.field_size_limit(16000000)
def ids(path,keys):
 with(gzip.open(path,'rt',encoding='utf-8-sig',newline='')if path.suffix=='.gz'else path.open(encoding='utf-8-sig',newline=''))as f:
  reader=csv.DictReader(f,delimiter=';'); found=set();count=0
  for x in reader:
   key=tuple(x[k]for k in keys);assert key not in found,(path,key);found.add(key);count+=1
 return found,count
checks=[]
for name,key,count in [('perimetre-initial-complet.csv.gz',['id'],661),('reconciliation-79-ecarts.csv',['isin','year'],79),('statut-19-actions.csv',['action'],19),('bilan-par-outil.csv',['route'],24),('matrice-donnees-usages.csv.gz',['id_suivi'],None),('suivi-consolide.csv.gz',['id_suivi'],None),('restant-a-verifier.csv.gz',['id_suivi'],None)]:
 old,n=ids(b/name,key);new,m=ids(o/name,key);assert old<=new,(name,'lost identities');assert count is None or m==count,(name,m,count);checks.append({'file':name,'priorIdentities':n,'finalIdentities':m,'allPriorIdentitiesPreserved':True,'unique':True,'sha256':hashlib.sha256((o/name).read_bytes()).hexdigest()})
with (o/'reconciliation-79-ecarts.csv').open(encoding='utf-8-sig',newline='')as f:fin=list(csv.DictReader(f,delimiter=';'))
assert collections.Counter(x['fenetre_mensuelle_qualifiee_30oct']for x in fin)=={'True':70,'False':9};assert all(x['nouvelle_fenetre_30oct']=='False'for x in fin)
d={'verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'checks':checks,'financialWindows':{'constantCases':79,'qualified':70,'refused':9,'newQualifiedMonthly':0},'notAnAutomationCoverageRate':True,'sourceAndConsumerProofsRemainScoped':True}
(r/'proofs-29oct/deliverable-identity-verification-30oct.json').write_text(json.dumps(d,ensure_ascii=False,indent=2));print(json.dumps(d,ensure_ascii=False))
