"""Live validation of the eight newly automated official ETF/ETC sources."""
import datetime as dt
import json
import pathlib
from refresh_additional_etf import refresh
from collect_non_bond_expansion import collect_one
from data_automation import UTC
ROOT=pathlib.Path(__file__).resolve().parents[1]
if __name__=='__main__':
 config=json.loads((ROOT/'scripts/non-bond-expansion-sources.json').read_text())
 current=json.loads((ROOT/'src/data/non-bond-etf-records.json').read_text())
 _,report=refresh(config,current,{},collect=collect_one)
 for row in report['shares']:
  print(row['isin'],row['status'],row.get('reason',''))
  if row['status']!='validated':raise SystemExit(1)
  record=row['record'];assert record['characteristics']['listings'] and record['performance']['years']
 print('Eight official exact-share sources and complete NAV calendars validated; no data written.')
