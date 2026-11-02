import sys,json,datetime,pathlib,hashlib,concurrent.futures,urllib.request,urllib.error
root=pathlib.Path(sys.argv[1]);out=pathlib.Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
configs=[c for c in json.load(open(root/'scripts/index-automation.json'))['indices'] if c.get('compositionIndexId')]
def probe(item):
 c,key=item;url=c[key];r={'id':c['id'],'kind':key,'url':url,'attemptedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0','Accept':'application/json, application/pdf, text/html','Referer':c['compositionPageUrl']})
  response=urllib.request.urlopen(req,timeout=25)
 except urllib.error.HTTPError as e:response=e
 except Exception as e:return {**r,'error':str(e)}
 with response:
  body=response.read(4000001);r.update(status=response.code,finalUrl=response.url,contentType=response.headers.get('Content-Type'),sha256=hashlib.sha256(body).hexdigest(),bytes=len(body))
  (out/(c['id']+'-'+key+'.response')).write_bytes(body)
 return r
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:rows=list(pool.map(probe,[(c,k) for c in configs for k in ['compositionDataUrl','sourceUrl','compositionPageUrl']]))
(out/'access.json').write_text(json.dumps(rows,indent=2));print(json.dumps(rows,indent=2))
