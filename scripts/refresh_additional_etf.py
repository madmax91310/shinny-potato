"""Independent exact-share refresh; invalid sources preserve their previous active values."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import datetime as dt
import json
import os
import pathlib
from data_automation import UTC,write_json_atomic
from apply_etf_collection import merge_collection
from collect_dws_etf import collect_one as dws
from collect_vanguard_etf import collect_one as vanguard
from collect_vaneck_etf import collect_one as vaneck
from collect_invesco_etf import collect_one as invesco
from collect_amundi_index_exposure import collect_one as amundi_index

ROOT=pathlib.Path(__file__).resolve().parents[1]


def collect_one(share,now):
    if share['parser']=='dws':
        return dws(share, now)
    return {'vanguard':vanguard,'vaneck':vaneck,'invesco':invesco,'amundi-index':amundi_index}[share['parser']](share,now)


def refresh(config,current,baseline,now=None,collect=collect_one):
    now=now or dt.datetime.now(UTC)
    def one(share):
        try:
            result=collect(share,now)
            if result.get('performance')and baseline.get(share['isin'],{}).get('currency')not in (None,result['performance']['currency']):
                result.setdefault('unavailable',[]).append('performance: existing simulation currency differs; history preserved')
                result.pop('performance')
            merged=merge_collection({'checkedAt':now.isoformat(),'shares':[result]},current,baseline)
            return {'isin':share['isin'],'provider':share['provider'],'status':'validated','record':merged[share['isin']],
                    'unavailable':result.get('unavailable',[]),'sourceUrl':result.get('sourceUrl')}
        except Exception as error:
            return {'isin':share['isin'],'provider':share['provider'],'status':'failed','reason':str(error),
                    'sourceUrl':share.get('sourceUrl',share.get('pageUrl'))}
    with ThreadPoolExecutor(max_workers=4)as pool:observations=list(pool.map(one,[s for s in config['instruments'] if s.get('enabled', True)]))
    merged=dict(current)
    for o in observations:
        if o['status']=='validated':merged[o['isin']]=o['record']
    return merged,{'checkedAt':now.isoformat(),'shares':observations,'notQualified':[s['isin'] for s in config['instruments'] if not s.get('enabled', True)]}


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--baseline',required=True,type=pathlib.Path);p.add_argument('--output',required=True,type=pathlib.Path);p.add_argument('--apply',action='store_true');args=p.parse_args()
    config=json.loads((ROOT/'scripts/additional-etf-sources.json').read_text());path=ROOT/'src/data/automated-etf.json'
    merged,report=refresh(config,json.loads(path.read_text()),json.loads(args.baseline.read_text()))
    write_json_atomic(args.output,report)
    if args.apply and merged!=json.loads(path.read_text()):write_json_atomic(path,merged)
    print(f"ETF extension: {sum(o['status']=='validated'for o in report['shares'])}/{len(report['shares'])} shares validated; all exceptions recorded.")
    for observation in report['shares']:
        if observation['status'] == 'failed':
            print(f"Source failed: {observation['isin']} — {observation['reason']}")
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'],'a')as h:
            h.write('\n## Extensions ETF et expositions synthétiques\n\n| Part | Source | État | Limites |\n|---|---|---|---|\n')
            h.write('Hors automatisation : '+', '.join(report['notQualified'])+'\n\n')
            for o in report['shares']:h.write(f"| {o['isin']} | {o['provider']} | {o['status']} | {o.get('reason',' ; '.join(o.get('unavailable',[])))} |\n")
    if any(o['status']=='failed'for o in report['shares']if next(s for s in config['instruments']if s['isin']==o['isin']and s['provider']==o['provider']).get('required',False)):raise SystemExit(1)


if __name__=='__main__':main()
