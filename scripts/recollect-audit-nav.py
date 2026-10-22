"""Bounded exact-share rechecks for the 53 audited share identities; no writes to production."""
import pathlib,json,datetime as dt,concurrent.futures,sys
from refresh_additional_etf import collect_one
from collect_amundi_etf import collect as amundi
ROOT=pathlib.Path(__file__).resolve().parents[1];P=ROOT/'reports/corrections-2026-10-22/preuves'
ids={r['isin']for r in json.load(open(P/'comparaisons-originales.json'))['alerts']};configs={}
for path in ['scripts/etf-pilot.json','scripts/additional-etf-sources.json','scripts/qualified-exposure-sources.json','scripts/non-bond-qualified-sources.json','scripts/non-bond-expansion-sources.json','scripts/ssga-etf.json','scripts/exposure-etf-expansion.json']:
 data=json.load(open(ROOT/path));configs.update({r['isin']:{**r, **({'parser':'ishares'} if path.endswith('etf-pilot.json') else {'parser':'ssga'} if path.endswith('ssga-etf.json') else {})} for r in data.get('instruments',[]) if r['isin'] not in configs})
now=dt.datetime.now(dt.timezone.utc);rows=[]
if '--retry-failed' in sys.argv and (P/'nav-recollectes.json').exists():rows=[r for r in json.load(open(P/'nav-recollectes.json'))if r['ok']]
ac=[s for s in json.load(open(ROOT/'scripts/amundi-etf.json'))['instruments']if s['isin']in ids-{r['isin']for r in rows}]
try:
 report=amundi({'instruments':ac},now) if ac else {'shares':[],'failures':[]}
 (P/'nav-amundi-recollecte.json').write_text(json.dumps(report,ensure_ascii=False))
 for r in report.get('shares',[]):rows.append({'isin':r['isin'],'ok':True,'record':r})
 for r in report.get('failures',[]):rows.append({'isin':r['isin'],'ok':False,'error':r})
except Exception as e:
 rows.extend({'isin':s['isin'],'ok':False,'error':str(e)}for s in ac)
def one(isin):
 try:
  if isin not in configs:return {'isin':isin,'ok':False,'error':'Aucune configuration univoque dans les catalogues de collecte examinés'}
  s=configs[isin]
  if 'parser'not in s and s.get('productId'):
   from collect_qualified_exposures import collect_one as qualified
   return {'isin':isin,'ok':True,'record':qualified(s,now)}
  if 'parser'not in s:s={**s,'parser':'ishares'if s.get('provider')=='iShares'else'ssga'if s.get('provider')=='State Street'else'unknown'}
  if s.get('parser')=='amundi-expansion':
   from collect_exposure_expansion import collect as collect_expansion
   result=collect_expansion(s,now)
  elif s.get('parser')=='non-bond-expansion':
   from collect_non_bond_expansion import collect_one as collect_expansion
   result=collect_expansion(s,now)
  else:result=collect_one(s,now)
  return {'isin':isin,'ok':True,'record':result}
 except Exception as e:return {'isin':isin,'ok':False,'error':str(e)}
remaining=ids-{r['isin']for r in rows}
with concurrent.futures.ThreadPoolExecutor(max_workers=3)as pool:
 for row in pool.map(one,sorted(remaining)):
  rows.append(row);print(row['isin'],row['ok'],row.get('error',''),flush=True);(P/'nav-recollectes.json').write_text(json.dumps(rows,ensure_ascii=False))
assert {r['isin']for r in rows}==ids
