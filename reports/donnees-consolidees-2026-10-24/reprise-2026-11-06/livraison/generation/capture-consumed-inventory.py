"""Capture the published body whose exact blob/digest the consumed inbox declares."""
import pathlib,json,gzip,hashlib,datetime,os,urllib.request,time
root=pathlib.Path(os.environ.get('CAPTURE_DIR','/tmp/automation-20261106/public-final'))
manifest=json.load(open(root/'publication-manifest.json'));blob=manifest['files']['public/data/data-automation-inventory.json']
inbox=json.load(gzip.open(root/'data-review-inbox.json.gz','rt'))if(root/'data-review-inbox.json.gz').exists()else json.load(open(root/'data-review-inbox.json'))
raw=pathlib.Path('/tmp/automation-20261106/scratch/inventory-current.raw');digest=hashlib.sha256();count=0
url='https://madmax91310.github.io/shinny-potato/data/data-automation-inventory.json'
with urllib.request.urlopen(url+'?exact-inventory='+str(time.time_ns()),timeout=60)as r,raw.open('wb')as f:
 if r.status!=200:raise ValueError('Published inventory unavailable')
 while chunk:=r.read(1024*1024):
  count+=len(chunk)
  if count>400_000_000:raise ValueError('Published inventory exceeds bounded capture')
  digest.update(chunk);f.write(chunk)
sha=digest.hexdigest();blobhash=hashlib.sha1(b'blob '+str(count).encode()+b'\0')
with raw.open('rb')as f,gzip.open(root/'data-automation-inventory.json.gz','wb')as out:
 while chunk:=f.read(1024*1024):blobhash.update(chunk);out.write(chunk)
assert blobhash.hexdigest()==blob,'Public inventory differs from the captured manifest'
assert inbox['inventorySha256']==sha and inbox['inventoryBlobSha']==blob,'Public inventory differs from the actually consumed inbox'
proof={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'bytes':count,'blob':blob,'sha256':sha,'matchesActuallyConsumedInbox':True,'mode':'actual-public-http-body','url':url,'gitObjectExistenceNotRequiredForGeneratedFile':True,'doesNotRenewFinancialSourceDates':True}
(root/'inventory-capture-proof.json').write_text(json.dumps(proof,indent=2));print(json.dumps(proof))
