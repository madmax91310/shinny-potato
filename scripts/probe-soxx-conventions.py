"""Preserve price/adjusted series and corporate actions for exact SOXX investigation."""
import json,pathlib,datetime as dt
from refresh_monthly_history import collect_one
from issuer_documents import download
P=pathlib.Path('reports/corrections-2026-10-22/preuves')
config=next(r for r in json.load(open('scripts/monthly-automation.json'))['series']if r['id']=='soxx')
r=collect_one({**config,'field':'adjclose','precision':6},dt.datetime.now(dt.timezone.utc));raw=r.pop('rawResponse');(P/'soxx-ajuste.json').write_text(json.dumps(r))
(P/'soxx-evenements.json').write_text(json.dumps(raw['1d']['chart']['result'][0]))
url='https://www.ishares.com/us/products/239705/ishares-phlx-semiconductor-etf'
try:
 b=download(url,max_bytes=15000000);(P/'soxx-identite.html').write_bytes(b)
 print('Official SOXX identity',b'US4642875235'in b,b'SOXX'in b)
except Exception as e:print('Official identity blocked:',e)
print('events',raw['1d']['chart']['result'][0].get('events',{}).keys())
