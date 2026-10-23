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
    parser.add_argument('--scope', required=True, choices=['fx','holdings','metadata','practical','copper','ai','conflict','actors','brokers','insurance','pending','discovery','financial','holdings-retry','holdings-hsbc'])
    parser.add_argument('--output', type=pathlib.Path, required=True)
    args = parser.parse_args()
    out = args.output.resolve(); out.mkdir(parents=True, exist_ok=True)
    report = out/'observation.json'
    commands = {
        'actors': ['collect_presentation_actors.py','--apply'],
        'brokers': ['collect_broker_tariffs.py','--apply'],
        'insurance': ['collect_insurance.py','--apply'],
        'pending': ['check_pending_sources.py'],
        'discovery': ['discover_holdings_sources.py'],
        'financial':['verify_review_financial.py'],
        'fx': ['collect_ranking_sources.py','--only','fx','--apply'],
        'holdings-hsbc':['collect_dca_complete_holdings.py','--apply','--only','IE00B4K6B022'],
        'holdings-retry':['collect_dca_complete_holdings.py','--apply','--only','IE00B4K6B022','IE00BJGWQN72','IE00BDVPNG13','IE0002Y8CX98','IE000W8WMSL2'],
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
        for filename in ['additional-etf-sources.json','exposure-etf-expansion.json','ssga-etf.json']:
            shares.extend(s for s in json.loads((ROOT/'scripts'/filename).read_text())['instruments'] if s['isin']=='IE00B3T9LM79')
        if len(shares)!=1: raise ValueError('Ambiguous conflict source configuration')
        shares[0].setdefault('parser','ssga')
        current=json.loads((ROOT/'src/data/automated-etf.json').read_text())
        merged, value=refresh({'instruments':shares},current,{},dt.datetime.now(UTC))
        write_json_atomic(report,value)
        code=0 if all(r['status']=='validated' for r in value['shares']) else 1
        write_json_atomic(out/'conflict-registry.json',{s['isin']:merged[s['isin']] for s in shares})
    else:
        command=[sys.executable,str(ROOT/'scripts'/commands[args.scope][0]),*commands[args.scope][1:]]
        if args.scope not in ['discovery','financial']:
            command += ['--report' if args.scope=='ai' else '--output',str(report)]
        if args.scope=='financial':command += ['--output',str(out)]
        with (out/'collection.log').open('w') as log:
            result=subprocess.run(command,cwd=ROOT,stdout=log,stderr=subprocess.STDOUT,timeout=1700)
        code=result.returncode
        print((out/'collection.log').read_text(),flush=True)
    if args.scope=='discovery': shutil.copy2(ROOT/'public/data/holdings-discovery.json',report)
    paths={
        'actors':['src/data/automated-presentation-actors.json'],
        'brokers':['src/data/automated-broker-tariffs.json'],
        'insurance':['src/data/automated-insurance.json'],
        'discovery':['public/data/holdings-discovery.json','scripts/generated-holdings-sources.json','src/data/dca-complete-holdings.json'],
        'fx':['src/data/monthly-fx.json','scripts/source-snapshots/ranking-collection-status.json'],
        'holdings':['src/data/dca-complete-holdings.json','src/data/dca-holdings-status.json','src/data/dca-security-classifications.json'],
        'metadata':['src/data/automated-instrument-metadata.json','src/data/instrument-metadata-status.json'],
        'practical':['src/data/automated-practical-sheets.json'],
        'ai':['data/ai-portfolios'],
    }
    for relative in paths.get('holdings' if args.scope in ['holdings-retry','holdings-hsbc'] else args.scope,[]):
        source=ROOT/relative; target=out/relative;target.parent.mkdir(parents=True,exist_ok=True)
        if source.is_dir(): shutil.copytree(source,target,dirs_exist_ok=True)
        elif source.exists():shutil.copy2(source,target)
        else:raise FileNotFoundError('Required validated registry missing from proof: '+relative)
    if report.exists():
        value=json.loads(report.read_text())
        for key in ['errors','failures','failed','changed','observations']:
            if key in value:print(key,json.dumps(value[key],ensure_ascii=False)[:20000],flush=True)
    (out/'execution.json').write_text(json.dumps({'scope':args.scope,'startedAt':started,'completedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'exitCode':code,'publication':'not-requested'},indent=2)+'\n')
    return code


if __name__=='__main__': raise SystemExit(main())
