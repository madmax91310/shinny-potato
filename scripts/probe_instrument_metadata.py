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
from collect_instrument_metadata import ROOT, fetch_document, collect
from data_automation import UTC, write_json_atomic


def probe(source, directory):
    observed=[]
    def fetch(url):
        body,effective=fetch_document(url,isin=source['isin'])
        digest=hashlib.sha256(body).hexdigest()
        filename=source['isin']+'-'+digest+'.body'
        (directory/filename).write_bytes(body)
        observed.append({'requestedUrl':url,'sourceUrl':effective,'checkedAt':dt.datetime.now(UTC).isoformat(),'sha256':digest,'file':filename})
        return body
    now=dt.datetime.now(UTC)
    values,errors=collect(source,now,fetch)
    return {'isin':source['isin'],'checkedAt':now.isoformat(),'values':values,'errors':errors,'documents':observed}


def main():
    p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);p.add_argument('--only',nargs='+');a=p.parse_args()
    a.output.mkdir(parents=True,exist_ok=True)
    sources=json.loads((ROOT/'scripts/instrument-metadata-sources.json').read_text())['instruments']
    if a.only:
        sources=[s for s in sources if s['isin'] in a.only]
        if {s['isin'] for s in sources}!=set(a.only):raise ValueError('Unknown probe ISIN')
    with ThreadPoolExecutor(max_workers=6) as pool:rows=list(pool.map(lambda s:probe(s,a.output),sources))
    write_json_atomic(a.output/'manifest.json',{'checkedAt':dt.datetime.now(UTC).isoformat(),'instruments':rows})
    print(json.dumps({'instruments':len(rows),'observedFields':sum(len(r['values']) for r in rows),'documents':sum(len(r['documents']) for r in rows)}))


if __name__=='__main__':main()
