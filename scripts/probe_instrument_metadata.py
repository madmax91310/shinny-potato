"""Read-only, reproducible source evidence for metadata adapter qualification.

Never writes a production registry. Each successful response is bound to its requested
ISIN, effective source URL, actual observation time and SHA-256 in the manifest.
"""
import argparse
import datetime as dt
import hashlib
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from collect_instrument_metadata import ROOT, collect, merge_field_observation
from data_automation import UTC, write_json_atomic


def probe(source, directory):
    observed=[]
    def record(url,effective,body):
        digest=hashlib.sha256(body).hexdigest()
        filename=source['isin']+'-'+digest+'.body'
        (directory/filename).write_bytes(body)
        observed.append({'requestedUrl':url,'sourceUrl':effective,'checkedAt':dt.datetime.now(UTC).isoformat(),'sha256':digest,'file':filename})
    now=dt.datetime.now(UTC)
    values,errors=collect(source,now,on_document=record)
    row={'isin':source['isin'],'checkedAt':now.isoformat(),'values':values,'errors':errors,'documents':observed}
    write_json_atomic(directory/(source['isin']+'.json'),row)
    return row


def main():
    p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);p.add_argument('--only',nargs='+');p.add_argument('--shard-count',type=int,default=1);p.add_argument('--records-output',type=Path);a=p.parse_args()
    if not 1<=a.shard_count<=16:raise ValueError('Invalid evidence shard count')
    a.output.mkdir(parents=True,exist_ok=True)
    sources=json.loads((ROOT/'scripts/instrument-metadata-sources.json').read_text())['instruments']
    if a.only:
        sources=[s for s in sources if s['isin'] in a.only]
        if {s['isin'] for s in sources}!=set(a.only):raise ValueError('Unknown probe ISIN')
    def one(source):
        directory=a.output/f"part-{int(source['isin'][-1])%a.shard_count}" if a.shard_count>1 else a.output
        directory.mkdir(parents=True,exist_ok=True)
        return probe(source,directory)
    with ThreadPoolExecutor(max_workers=6) as pool:rows=list(pool.map(one,sources))
    if a.shard_count>1:
        for shard in range(a.shard_count):
            write_json_atomic(a.output/f'part-{shard}'/'manifest.json',{'instruments':[r for r in rows if int(r['isin'][-1])%a.shard_count==shard]})
    write_json_atomic(a.output/'manifest.json',{'checkedAt':dt.datetime.now(UTC).isoformat(),'instruments':rows})
    if a.records_output:
        records=json.loads((ROOT/'src/data/automated-instrument-metadata.json').read_text())
        for row in rows:
            for field,value in row['values'].items():
                record=records.setdefault(row['isin'],{})
                record[field]=merge_field_observation(field,record.get(field),value)
        write_json_atomic(a.records_output,records)
    print(json.dumps({'instruments':len(rows),'observedFields':sum(len(r['values']) for r in rows),'documents':sum(len(r['documents']) for r in rows)}))


if __name__=='__main__':main()
