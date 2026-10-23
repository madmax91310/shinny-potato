"""Read-only real-source checks; no observations are applied by this probe."""
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
from broker_profiles import DOCUMENTS, SOURCES, parse
from collect_broker_tariffs import fetch_content
from data_automation import UTC, write_json_atomic

def collect_ibkr_cash(today):
    raws={key:fetch_content(SOURCES[key]['url'])for key in DOCUMENTS['ibkr']['cash']}
    return parse('ibkr','cash',raws,today)

def main():
    p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);args=p.parse_args()
    now=dt.datetime.now(UTC)
    try:
        record=collect_ibkr_cash(now.date().isoformat())
        result={'checkedAt':now.isoformat(),'status':'validated','record':record}
    except Exception as e:
        result={'checkedAt':now.isoformat(),'status':'failed','reason':str(e)}
    write_json_atomic(args.output,result)
    print(json.dumps(result,ensure_ascii=False))
    if result['status']!='validated':raise SystemExit(1)
if __name__=='__main__':main()
