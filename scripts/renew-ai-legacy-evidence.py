"""Renew only the audited legacy listing identities from two shared issuer holdings responses."""
import json,pathlib,datetime as dt,hashlib
from data_automation import get_json
ROOT=pathlib.Path(__file__).resolve().parents[1];P=ROOT/'reports/corrections-2026-10-22/preuves'
m=json.load(open(ROOT/'data/ai-portfolios/market.json'));legacy=json.load(open(P/'ai-35-initial.json')) if (P/'ai-35-initial.json').exists() else [r for r in m['universe']if r.get('status')=='qualified'and not r.get('evidenceId')]
rows=[];proofs=[]
for url in sorted({r['sourceUrl']for r in legacy}):
 try:
  raw=get_json(url);digest=hashlib.sha256(json.dumps(raw,sort_keys=True).encode()).hexdigest();p=raw['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap'];keys=['isin','ticker','marketCurrencyCode','exchange','issueName'];cols={k:p[k]['value']for k in keys};assert len({len(v)for v in cols.values()})==1
  for asset in [r for r in legacy if r['sourceUrl']==url]:
   normalize=lambda s:''.join(c for c in s.upper()if c.isalnum()).lstrip('0')
   matches=[{k:cols[k][i]for k in keys}for i,isin in enumerate(cols['isin'])if isin==asset['isin']and normalize(cols['ticker'][i])==normalize(asset['ticker'])]
   if len(matches)!=1:
    rows.append({'id':asset['id'],'url':url,'ok':False,'error':'Ambiguous or missing issuer listing'});continue
   row=matches[0];cur='GBP'if asset['sourceCurrency']in ['GBp','GBX']else asset['sourceCurrency']
   if row['marketCurrencyCode']!=cur:
    rows.append({'id':asset['id'],'url':url,'ok':False,'error':'Listing currency mismatch'});continue
   proof={'id':asset['id'],'isin':asset['isin'],'mic':asset['mic'],'ticker':asset['ticker'],'currency':asset['currency'],'sourceCurrency':asset['sourceCurrency'],'symbol':asset['symbol'],'sourceUrl':url,'checkedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'sha256':digest,'providerRow':row}
   proofs.append(proof)
  rows.append({'url':url,'ok':True,'sha256':digest})
 except Exception as e:rows.append({'url':url,'ok':False,'error':str(e)})
(P/'ai-legacy-renouvellement.json').write_text(json.dumps({'sources':rows,'proofs':proofs},ensure_ascii=False,indent=2))
print('renewed',len(proofs),'/',len(legacy),rows)
