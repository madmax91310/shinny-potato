import urllib.request,urllib.error,json
urls={
 'sec-bulk':'https://www.sec.gov/Archives/edgar/daily-index/xbrl/companyfacts.zip',
 'apple':'https://www.apple.com/newsroom/rss-feed.rss',
 'microsoft':'https://www.microsoft.com/en-us/Investor/earnings/FY-2026-Q4/press-release-webcast',
 'nvidia':'https://investor.nvidia.com/rss/pressrelease.aspx',
 'amazon':'https://ir.aboutamazon.com/rss/pressrelease.aspx',
 'alphabet':'https://abc.xyz/investor/'
}
for key,url in urls.items():
 try:
  req=urllib.request.Request(url,method='HEAD' if key=='sec-bulk' else 'GET',headers={'User-Agent':'EpargnantLibre/1.0 https://github.com/madmax91310/shinny-potato'})
  with urllib.request.urlopen(req,timeout=15) as r:
   data=r.read(1000000) if key!='sec-bulk' else b''
   print(key,json.dumps({'status':r.status,'length':r.headers.get('Content-Length'),'type':r.headers.get('Content-Type'),'bytes':len(data)}),flush=True)
   if data:open('/tmp/publication-'+key+'.txt','wb').write(data)
 except Exception as e:print(key,json.dumps({'error':type(e).__name__,'status':getattr(e,'code',None)}),flush=True)
