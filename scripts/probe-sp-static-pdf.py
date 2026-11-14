"""Read-only source experiment: cached names select routes, never certify data."""
import base64,datetime as dt,gzip,hashlib,json,os,pathlib,re,sys,urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from collect_sp_composition import collect
now=dt.datetime.now(dt.timezone.utc)
configs=[c for c in json.loads((ROOT/'scripts/index-automation.json').read_text())['indices']if c['id']in ['sp-global-dividend-aristocrats','sp-euro-dividend-aristocrats']]
report={'kind':'isolated public-source experiment; no production write','checkedAt':now.isoformat(),'expected':[{'id':c['id'],'fields':['composition'],'indexId':c['compositionIndexId']}for c in configs],'results':[]}
feed=json.loads((ROOT/'scripts/observations/sp-public-feed.json').read_text())['observations']
for c in configs:
 result={'id':c['id'],'selected':True,'sourceAttempted':False,'cachedMetadataOnlySelectsFilename':True}
 try:
  cached=base64.b64decode(feed[c['id']]['bodyBase64'],validate=True)
  assert hashlib.sha256(cached).hexdigest()==feed[c['id']]['sha256']
  if cached[:2]==b'\x1f\x8b':cached=gzip.decompress(cached)
  detail=json.loads(cached)['indexDetailHolder']['indexDetail'];assert detail['indexId']==c['compositionIndexId']
  name=detail['factsheetPdfName'];assert re.fullmatch(r'fs-[a-z0-9-]+\.pdf',name)
  url='https://www.spglobal.com/spdji/en/documents/factsheets/'+name
  result.update(sourceUrl=url,advertisedFilename=name,sourceAttempted=True)
  req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36','Accept':'application/pdf','Referer':c['compositionPageUrl']})
  with urllib.request.urlopen(req,timeout=30)as response:
   raw=response.read(8_000_001);result.update(httpStatus=response.status,responseUrl=response.url,bytes=len(raw),contentType=response.headers.get('Content-Type'),sha256=hashlib.sha256(raw).hexdigest())
  assert len(raw)<=8_000_000 and raw.startswith(b'%PDF'),'Response is not a bounded PDF'
  candidate={**c,'sourceUrl':url};candidate.pop('compositionDataUrl',None)
  facts=collect(candidate,now,fetch=lambda requested:raw if requested==url else (_ for _ in ()).throw(ValueError('Unexpected source route')))
  result.update(status='qualified',sourceRetrievedAt=dt.datetime.now(dt.timezone.utc).isoformat(),facts=facts)
 except Exception as e:result.update(status='failed',error=str(e))
 report['results'].append(result)
out=pathlib.Path(os.environ['RUNNER_TEMP'])/'sp-static-pdf.json';out.write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
raise SystemExit(0 if len(report['results'])==2 and all(r['status']=='qualified'for r in report['results'])else 1)
