"""Independent Decimal oracle over browser-captured public history bytes."""
from decimal import Decimal as D, ROUND_HALF_UP
from pathlib import Path
import json,hashlib,sys
folder=Path(sys.argv[1]);rows=json.loads((folder/'results.json').read_text(),parse_float=D);results=[]
for r in rows:
 meta=r['history'];p=folder/meta['file'];raw=p.read_bytes();assert hashlib.sha256(raw).hexdigest()==meta['sha256'];record=json.loads(raw,parse_float=D)
 assert record['isin']==meta['isin'] and record['currency']==meta['currency']
 points=[(p[0],D(p[1]))if isinstance(p,list)else(p['date'],D(p['price']))for p in record['points']];points=[(d,v)for d,v in points if r['start']<=d<=r['end']]
 assert points[0][0]==r['start']and points[-1][0]==r['end']
 def month(ym):return int(ym[:4])*12+int(ym[5:])
 assert all(month(b[0])-month(a[0])==1 for a,b in zip(points,points[1:])), 'No interpolation allowed'
 amount=D(r['state']['amountRaw']);units=amount/points[0][1]if r['state']['mode']=='lump'else sum((amount/p for _,p in points),D(0));capital=units*points[-1][1]
 assert abs(capital-r['independentFinalValue'])<D('.0000001')
 rounded=int(capital.quantize(D(1),rounding=ROUND_HALF_UP));assert int(''.join(c for c in r['displayed']if c.isdigit()))==rounded
 results.append({'key':r['key'],'currency':meta['currency'],'start':r['start'],'end':r['end'],'payments':1 if r['state']['mode']=='lump'else len(points),'invested':str(amount*(1 if r['state']['mode']=='lump'else len(points))),'finalValue':str(capital),'displayed':r['displayed'],'publicVersion':r['publicVersion'],'sourceSha256':meta['sha256']})
report={'method':'Decimal cash/units arithmetic on actual browser response bodies; no application or collector imports','results':results};output=folder/'independent-decimal.json';output.write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n');print(len(results),'public results independently verified:',output)
