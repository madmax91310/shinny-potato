"""Read-only remote verification: no commits, dispatches or deployments."""
import argparse
import datetime as dt
import json
import pathlib
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--scope', required=True, choices=['fx','holdings','metadata','practical','copper','ai','conflict'])
    parser.add_argument('--output', type=pathlib.Path, required=True)
    args = parser.parse_args()
    out = args.output.resolve(); out.mkdir(parents=True, exist_ok=True)
    report = out/'observation.json'
    commands = {
        'fx': ['collect_ranking_sources.py','--only','fx','--apply'],
        'holdings': ['collect_dca_complete_holdings.py','--apply'],
        'metadata': ['collect_instrument_metadata.py','--only','IE00B0M62S72','IE0003R87OG3','IE00B579F325','IE00BD6FTQ80','--apply'],
        'practical': ['collect_practical_sheets.py','--apply'],
        'copper': ['collect_official_share_history.py','--only','etfGB00B15KXQ89','--capture-dir',str(out/'raw')],
        'ai': ['collect_ai_portfolios.py','--assets','IE00B4L5Y983-ETFP'],
    }
    started = dt.datetime.now(dt.timezone.utc).isoformat()
    if args.scope == 'conflict':
        from data_automation import UTC, write_json_atomic
        from refresh_additional_etf import refresh
        shares=[]
        for filename in ['additional-etf-sources.json','exposure-etf-expansion.json']:
            shares.extend(s for s in json.loads((ROOT/'scripts'/filename).read_text())['instruments'] if s['isin']=='IE00B3T9LM79')
        if len(shares)!=1: raise ValueError('Ambiguous conflict source configuration')
        current=json.loads((ROOT/'src/data/automated-etf.json').read_text())
        merged, value=refresh({'instruments':shares},current,{},dt.datetime.now(UTC))
        write_json_atomic(report,value)
        code=0 if all(r['status']=='validated' for r in value['shares']) else 1
        write_json_atomic(out/'conflict-registry.json',{s['isin']:merged[s['isin']] for s in shares})
    else:
        command=[sys.executable,str(ROOT/'scripts'/commands[args.scope][0]),*commands[args.scope][1:]]
        command += ['--report' if args.scope=='ai' else '--output',str(report)]
        with (out/'collection.log').open('w') as log:
            result=subprocess.run(command,cwd=ROOT,stdout=log,stderr=subprocess.STDOUT,timeout=1700)
        code=result.returncode
        print((out/'collection.log').read_text(),flush=True)
    paths={
        'fx':['src/data/monthly-fx.json','scripts/source-snapshots/ranking-collection-status.json'],
        'holdings':['src/data/dca-complete-holdings.json','src/data/dca-holdings-status.json','src/data/dca-security-classifications.json'],
        'metadata':['src/data/automated-instrument-metadata.json','src/data/instrument-metadata-status.json'],
        'practical':['src/data/automated-practical-sheets.json'],
        'ai':['data/ai-portfolios'],
    }
    for relative in paths.get(args.scope,[]):
        source=ROOT/relative; target=out/relative;target.parent.mkdir(parents=True,exist_ok=True)
        if source.is_dir(): shutil.copytree(source,target,dirs_exist_ok=True)
        elif source.exists():shutil.copy2(source,target)
    (out/'execution.json').write_text(json.dumps({'scope':args.scope,'startedAt':started,'completedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'exitCode':code,'publication':'not-requested'},indent=2)+'\n')
    return code


if __name__=='__main__': raise SystemExit(main())
