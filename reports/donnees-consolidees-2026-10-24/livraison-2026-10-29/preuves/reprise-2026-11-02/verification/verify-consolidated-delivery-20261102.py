"""Check preservation of every historical identity and original financial case, not financial certification."""
import csv,gzip,io,pathlib,json,subprocess,sys,collections,hashlib
csv.field_size_limit(8000000);root=pathlib.Path(sys.argv[1]);base=sys.argv[2]if len(sys.argv)>2 else'16254ce';results=[]
def parse(raw,gz):
 if gz:raw=gzip.decompress(raw)
 r=csv.DictReader(io.StringIO(raw.decode('utf-8-sig')),delimiter=';');return list(r.fieldnames),list(r)
for name,candidate in [('matrice-donnees-usages.csv.gz',['id_suivi']),('suivi-consolide.csv.gz',['id_suivi']),('restant-a-verifier.csv.gz',['id_suivi']),('perimetre-initial-complet.csv.gz',['id','diagnostic_id','id_suivi']),('reconciliation-79-ecarts.csv',['id']),('statut-19-actions.csv',['action'])]:
 path=root/name;oldfields,old=parse(subprocess.check_output(['git','show',base+':'+str(path)]),name.endswith('.gz'));fields,new=parse(path.read_bytes(),name.endswith('.gz'));key=next(k for k in candidate if k in oldfields);identity=lambda x:(x['isin'],x['year'])if name=='reconciliation-79-ecarts.csv'else x[key];a={identity(x):x for x in old};b={identity(x):x for x in new};assert len(a)==len(old)and len(b)==len(new),(name,'duplicate identity');assert a.keys()<=b.keys(),(name,'lost identities')
 for k,x in a.items():
  for f in oldfields:assert x[f]==b[k][f],(name,k,f,'historical value changed')
 results.append({'file':name,'oldIdentities':len(a),'currentIdentities':len(b),'oldValuesUnchanged':True})
print(json.dumps({'baseline':base,'checks':results,'limit':'Identity and historical-value preservation only; source/financial/publication proofs remain separate.'},ensure_ascii=False,indent=2))
