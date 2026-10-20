"""Observe access to pending sources without certifying any financial field."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import datetime as dt
import hashlib
import ipaddress
import json
from pathlib import Path
from urllib.parse import urlsplit
from issuer_documents import download

def public_url(url):
    try:
        p=urlsplit(url);host=p.hostname or ''
        if p.scheme!='https' or p.username or p.password or p.port not in (None,443):return False
        if not host or host in ('localhost','metadata.google.internal') or host.endswith(('.localhost','.local','.internal')):return False
        try:return ipaddress.ip_address(host).is_global
        except ValueError:return '.' in host
    except (ValueError,TypeError):return False

def prerequisite(row):
    if row.get('id') in ['actor:bricks','actor:enerfip','actor:hectarea','actor:matis']:
        return 'published-general-platform-condition-required'
    if row.get('type')=='actor':return 'exact-offer-and-underlying-documents-required'
    if row.get('actionState')=='tracked-index-needed':return 'economic-index-holdings-required'
    if row.get('actionState')=='source-conflict':return 'contradictory-evidence-requires-qualification'
    return 'source-and-field-qualification-required'

def inspect(url,now,previous,fetch=download):
    row={'sourceUrl':url,'lastAccessAttemptAt':now.isoformat(),
         'qualification':'access-check-only','financialDataQualified':False}
    try:
        if not public_url(url):raise ValueError('Public HTTPS source not configured')
        raw,actual=fetch(url,max_bytes=4_000_000,timeout=15,max_attempts=1,url_validator=public_url,return_source=True)
        if not public_url(actual):raise ValueError('Redirect outside public HTTPS scope')
        digest=hashlib.sha256(raw).hexdigest()
        changed=bool(previous.get('sha256') and previous['sha256']!=digest)
        row.update(status='changed-unqualified' if changed else 'accessible-unqualified',
                   finalUrl=actual,sha256=digest,bytes=len(raw),lastAccessibleAt=now.isoformat())
    except Exception as error:
        row.update(status='unavailable',error=str(error)[:350],lastAccessibleAt=previous.get('lastAccessibleAt'),
                   sha256=previous.get('sha256'))
    return row

def check(backlog,previous,now,fetch=download):
    choices={}
    for row in backlog:
        url=row.get('sourceUrl') or next(iter(row.get('configuredSourceUrls') or []),None)
        if url:choices[url]=previous.get('sources',{}).get(url,{})
    def one(item):return item[0],inspect(item[0],now,item[1],fetch)
    sources=dict(ThreadPoolExecutor(max_workers=6).map(one,choices.items()))
    observations={}
    for row in backlog:
        url=row.get('sourceUrl') or next(iter(row.get('configuredSourceUrls') or []),None)
        key=row['id']+':'+row['field']
        observations[key]={'prerequisite':prerequisite(row),**(sources[url] if url else {
            'status':'not-configured','lastAccessAttemptAt':now.isoformat(),
            'qualification':'access-check-only','financialDataQualified':False})}
    return {'schemaVersion':1,'checkedAt':now.isoformat(),
        'method':'HTTP access and content changes only; never renew financial checkedAt, asOf or lastSuccessAt, and never resolve a qualification incident.',
        'sources':sources,'observations':observations}

def main():
    p=argparse.ArgumentParser();p.add_argument('--inventory',type=Path,default=Path('public/data/data-automation-inventory.json'))
    p.add_argument('--output',type=Path,default=Path('public/data/pending-source-checks.json'));args=p.parse_args()
    previous=json.loads(args.output.read_text()) if args.output.exists() else {}
    report=check(json.loads(args.inventory.read_text())['backlog'],previous,dt.datetime.now(dt.timezone.utc))
    args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print('Pending sources checked:',len(report['sources']),'connections retained:',len(report['observations']))

if __name__=='__main__':main()
