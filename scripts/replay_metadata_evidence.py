"""Requalify archived successful responses without redating their evidence."""
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
from collect_instrument_metadata import ROOT, FIELDS, collect, field_diagnostics
from data_automation import UTC, write_json_atomic


def load_documents(roots):
    documents={}
    for root in roots:
        manifest=json.loads((root/'manifest.json').read_text())
        for row in manifest['instruments']:
            for item in row['documents']:
                path=(root/item['file']).resolve()
                if root.resolve() not in path.parents:raise ValueError('Evidence path outside archive')
                body=path.read_bytes()
                if hashlib.sha256(body).hexdigest()!=item['sha256']:raise ValueError('Evidence digest mismatch')
                checked=dt.datetime.fromisoformat(item['checkedAt'])
                if checked.tzinfo is None or checked>dt.datetime.now(UTC):raise ValueError('Invalid evidence observation time')
                key=(row['isin'],item['requestedUrl'])
                previous=documents.get(key)
                if previous is None or item['checkedAt']>previous['checkedAt']:
                    documents[key]={**item,'body':body,'isin':row['isin']}
    return documents


def replay(source,documents):
    available=[doc for (isin,_),doc in documents.items() if isin==source['isin']]
    if not available:return {},[]
    by_url={}
    for doc in available:
        previous=by_url.get(doc['sourceUrl'])
        if previous is None or doc['checkedAt']>previous['checkedAt']:by_url[doc['sourceUrl']]=doc
    # Archives contain successful responses only. Failed requests never supply a body,
    # a success timestamp, or a synthetic value.
    bound={**source,'urls':list(by_url)}
    now=max(dt.datetime.fromisoformat(doc['checkedAt']) for doc in available)
    values,errors=collect(bound,now,fetch=lambda url:by_url[url]['body'])
    for field,record in values.items():
        doc=by_url[record['sourceUrl']]
        if doc['sha256']!=record['sha256']:raise ValueError('Replayed field is not bound to its document')
        record['checkedAt']=doc['checkedAt'][:10]
        if field=='listings':
            for row in record['value']:
                proof=by_url[row['sourceUrl']]
                if proof['sha256']!=row['sha256']:raise ValueError('Replayed listing is not bound to its document')
                row['checkedAt']=proof['checkedAt'][:10]
    return values,errors


def replay_status(roots,records,replayed,holds,prior):
    attempts={}
    for root in roots:
        for row in json.loads((root/'manifest.json').read_text())['instruments']:
            if row['checkedAt']>attempts.get(row['isin'],{}).get('checkedAt',''):attempts[row['isin']]=row
    status={**prior}
    for isin,row in attempts.items():
        values={**row['values']};errors=[*row['errors']]
        if isin in holds:
            hold=holds[isin];values.pop(hold['field'],None)
            errors.append({'sourceUrl':hold['sources'][0]['sourceUrl'],'field':hold['field'],'qualificationRequired':True,'error':'Qualification de publication requise : contradiction entre sources non résolue.','sources':hold['sources']})
        urls=list(dict.fromkeys([doc['requestedUrl'] for doc in row['documents']]+[error['sourceUrl'] for error in errors]))
        missing=[field for field in FIELDS if field not in values]
        status[isin]={'checkedAt':row['checkedAt'],'observed':list(values),'pending':missing,
            'firstPendingAt':{field:row['checkedAt'] if field in replayed[isin]['values'] else prior.get(isin,{}).get('firstPendingAt',{}).get(field,row['checkedAt']) for field in missing},
            'errors':errors,'fields':field_diagnostics({'isin':isin,'urls':urls},values,errors,records.get(isin,{}),dt.datetime.fromisoformat(row['checkedAt']))}
    return status


def main():
    p=argparse.ArgumentParser();p.add_argument('--archives',nargs='+',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--records-output',type=Path,required=True);p.add_argument('--status-output',type=Path);a=p.parse_args()
    documents=load_documents(a.archives)
    sources=json.loads((ROOT/'scripts/instrument-metadata-sources.json').read_text())['instruments']
    holds={r['isin']:r for r in json.loads((ROOT/'scripts/metadata-qualification-holds.json').read_text())['instruments']}
    records=json.loads((ROOT/'src/data/automated-instrument-metadata.json').read_text());rows=[]
    for source in sources:
        if source['isin'] in holds:source={**source,'qualificationHolds':[holds[source['isin']]]}
        values,errors=replay(source,documents)
        for field,value in values.items():
            if value['checkedAt']>=records.get(source['isin'],{}).get(field,{}).get('checkedAt',''):
                records.setdefault(source['isin'],{})[field]=value
        rows.append({'isin':source['isin'],'values':values,'errors':errors})
    write_json_atomic(a.records_output,records)
    if a.status_output:
        prior=json.loads((ROOT/'src/data/instrument-metadata-status.json').read_text())
        write_json_atomic(a.status_output,replay_status(a.archives,records,{row['isin']:row for row in rows},holds,prior))
    write_json_atomic(a.output,{'checkedAt':dt.datetime.now(UTC).isoformat(),'method':'Replay of digest-verified public responses; original successful observation dates retained.','instruments':rows})
    print(f'Replayed {len(documents)} verified responses for {len(rows)} instruments; no network requests.')


if __name__=='__main__':main()
