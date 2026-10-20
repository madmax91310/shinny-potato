"""Qualify new PEA adapters on every unresolved share without publishing data."""
import argparse,json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from probe_instrument_metadata import probe
from collect_instrument_metadata import ROOT
from data_automation import write_json_atomic

def main():
 p=argparse.ArgumentParser();p.add_argument('--output',required=True,type=Path);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
 records=json.loads((ROOT/'src/data/automated-instrument-metadata.json').read_text())
 sources=json.loads((ROOT/'scripts/instrument-metadata-sources.json').read_text())['instruments']
 selected=[]
 for source in sources:
  if source['isin'] in records and 'pea' in records[source['isin']] and source['isin'] not in ['IE000DQLYVB9','FR0011550185']:continue
  source=dict(source);source['urls']=[u for u in source['urls']if u.startswith('https://etf.dws.com/api/pdp/fr-fr/etf/') or u.startswith('https://extraetf.com/fr/etf-profile/') or u.startswith('https://www.francetransactions.com/bourse/etf/')]
  extra='https://extraetf.com/fr/etf-profile/'+source['isin']
  if extra not in source['urls']:source['urls'].append(extra)
  selected.append(source)
 with ThreadPoolExecutor(max_workers=3)as pool:rows=list(pool.map(lambda s:probe(s,a.output),selected))
 for row in rows:
  if 'pea' in row['values']:records.setdefault(row['isin'],{})['pea']=row['values']['pea']
 write_json_atomic(a.output/'manifest.json',{'instruments':rows})
 write_json_atomic(a.output/'qualified-records.json',records)
 print(json.dumps({'attempted':len(rows),'qualified':sum('pea'in r['values']for r in rows),'totalPea':sum('pea'in r for r in records.values()),'unqualified':[r['isin']for r in rows if 'pea'not in r['values']]}))

if __name__=='__main__':main()
