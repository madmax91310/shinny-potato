"""Recollect exact audit candidates without publishing, preserving every case."""
import sys,json,pathlib,datetime as dt,concurrent.futures
from refresh_monthly_history import collect_one
ROOT=pathlib.Path(__file__).resolve().parents[1]
P=ROOT/'reports/corrections-2026-10-22/preuves'
cases=json.load(open(P/'comparaisons-originales.json'))['alerts'];ids={r['id']for r in cases}
configs={r['id']:r for p in ['monthly-automation.json','non-bond-monthly-sources.json']for r in json.load(open(ROOT/'scripts'/p))['series']}
def one(id):
 try:
  config=configs[id];result=collect_one(config,dt.datetime.now(dt.timezone.utc));raw=result.pop('rawResponse');path=pathlib.Path('/tmp/audit-historical-responses');path.mkdir(exist_ok=True);(path/(id+'.json')).write_text(json.dumps(raw));return {'id':id,'ok':True,'record':result}
 except Exception as e:return {'id':id,'ok':False,'error':str(e)}
rows=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=3)as pool:
 for r in pool.map(one,sorted(ids)):
  rows.append(r);print(r['id'],r['ok'],r.get('error',''),flush=True);(P/'historiques-recollectes.json').write_text(json.dumps(rows,ensure_ascii=False))
