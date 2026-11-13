import pathlib,urllib.request,urllib.error,datetime,hashlib,json,concurrent.futures,os
out=pathlib.Path(os.environ['PROBE_OUTPUT']);out.mkdir(exist_ok=True)
urls={
 'globalx-annual':'https://gxeustrapi.blob.core.windows.net/webpublic/uploads/Annual_Report_and_Audited_Financial_Statements_1_f4a7f3867b.pdf',
 'globalx-semiannual':'https://gxeustrapi.blob.core.windows.net/webpublic/uploads/Semi_Annual_Financial_Statements_2025_65b69869d5.pdf',
 'wisdomtree-annual':'https://dataspanapi.wisdomtree.com/pdr/documents/ANNUAL_REPORT/UCITS/GB/EN-GB/IE0002Y8CX98',
 'wisdomtree-semiannual':'https://dataspanapi.wisdomtree.com/pdr/documents/SEMI_ANNUAL_REPORT/UCITS/IT/EN-IT/IE0002Y8CX98',
 'sp-global-static-candidate':'https://www.spglobal.com/spdji/en/documents/factsheets/factsheet-sp-global-dividend-aristocrats-quality-income-index.pdf',
 'sp-euro-static-candidate':'https://www.spglobal.com/spdji/en/documents/factsheets/factsheet-sp-euro-high-yield-dividend-aristocrats-index.pdf'}
def one(item):
 name,url=item;a={'name':name,'url':url,'attemptedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceAuthenticated':False,'scope':'Read-only candidate official document, identity and financial qualification still required'}
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'EpargnantLibre public financial source qualification; lepargnantlibre@gmail.com'}),timeout=35)as resp:
   raw=resp.read(20000001);a.update(status=resp.status,finalUrl=resp.url,bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest(),isPdf=raw[:4]==b'%PDF')
   if len(raw)>20000000:raise ValueError('Document exceeds bounded20MB')
   if a['isPdf']:(out/(name+'.pdf')).write_bytes(raw)
 except Exception as e:a['error']=type(e).__name__+': '+str(e)
 a['completedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();return a
rows=list(concurrent.futures.ThreadPoolExecutor(max_workers=2).map(one,urls.items()));(out/'attempts.json').write_text(json.dumps({'rows':rows,'event':os.environ.get('GITHUB_EVENT_NAME'),'runId':os.environ.get('GITHUB_RUN_ID'),'production':False,'scheduled':False},indent=2));print(json.dumps([{'name':a['name'],'status':a.get('status'),'isPdf':a.get('isPdf'),'error':a.get('error')}for a in rows]))
