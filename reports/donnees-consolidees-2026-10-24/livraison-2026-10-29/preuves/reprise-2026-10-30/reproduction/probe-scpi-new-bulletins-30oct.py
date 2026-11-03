import pathlib,sys,json,gzip,hashlib,datetime
sys.path.insert(0,'scripts')
import collect_extended_scpi as ext,collect_atland_scpi as atl,collect_scpi as base
out=pathlib.Path('/dev/shm/data-automation-20261028/proofs-29oct/scpi-bulletins-30oct');out.mkdir(exist_ok=True)
original=base.fetch;receipts=[]
def fetch(url,*a,**kw):
 b=original(url,*a,**kw);h=hashlib.sha256(b).hexdigest();n=h+('.pdf'if b.startswith(b'%PDF')else'.html.gz');(out/n).write_bytes(b if b.startswith(b'%PDF')else gzip.compress(b));receipts.append({'url':url,'sha256':h,'file':n,'bytes':len(b)});return b
ext.fetch=atl.fetch=fetch
result={}
for identifier,module in [('transitions-europe',ext),('epargne-pierre',atl)]:
 try:
  r=module.collect(identifier,datetime.date(2026,10,30));result[identifier]={'record':r}
  try:base.validate(r,datetime.date(2026,10,30));result[identifier]['validation']='passed'
  except Exception as e:result[identifier]['validation']=str(e)
 except Exception as e:result[identifier]={'error':str(e)}
(out/'result.json').write_text(json.dumps({'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'receipts':receipts,'results':result},ensure_ascii=False,indent=2));print(json.dumps({'results':{k:{'error':v.get('error'),'validation':v.get('validation'),'snapshot':v.get('record',{}).get('snapshot')}for k,v in result.items()},'receipts':receipts},ensure_ascii=False))
