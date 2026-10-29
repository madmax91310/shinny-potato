"""Observe access to pending sources without certifying any financial field."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import datetime as dt
import hashlib
import ipaddress
import json
import re
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
        # Some official download routes return an nginx error page with HTTP
        # 200. A reachable error page is not a successful access observation.
        title=re.search(br'<title[^>]*>\s*((?:403|429|500|502|503|504)\b[^<]*)</title>',raw[:100_000],re.I)
        if title:raise ValueError('HTTP 200 contains an error document: '+title[1].decode('utf-8',errors='replace'))
        digest=hashlib.sha256(raw).hexdigest()
        changed=bool(previous.get('sha256') and previous['sha256']!=digest)
        row.update(status='changed-unqualified' if changed else 'accessible-unqualified',
                   finalUrl=actual,sha256=digest,bytes=len(raw),lastAccessibleAt=now.isoformat())
        # Content qualification remains separate from HTTP availability. This
        # is the same ordinary monitor, never an alternative finance producer.
        from native_source_evidence import describe_native_source
        try:
            content=describe_native_source(url,raw,now)
            if content:row['nativeCompositionProbe']={**content,'sha256':digest,'finalUrl':actual}
        except Exception as error:
            row['nativeCompositionProbe']={'checkedAt':now.isoformat(),'sha256':digest,
                'qualification':'research-content-only','financialDataQualified':False,
                'error':str(error)[:350]}
    except Exception as error:
        row.update(status='unavailable',error=str(error)[:350],lastAccessibleAt=previous.get('lastAccessibleAt'),
                   sha256=previous.get('sha256'))
        if previous.get('nativeCompositionProbe'):
            row['nativeCompositionProbe']=previous['nativeCompositionProbe']
    return row

MAX_SOURCES_PER_CONNECTION = 8


def source_urls(row):
    """Keep the primary and independent configured routes, in declared order."""
    values=[row.get('sourceUrl'),*(row.get('configuredSourceUrls') or [])]
    return list(dict.fromkeys(u for u in values if isinstance(u,str) and u))


def check(backlog,previous,now,fetch=download):
    choices={}
    for row in backlog:
        for url in source_urls(row)[:MAX_SOURCES_PER_CONNECTION]:
            choices[url]=previous.get('sources',{}).get(url,{})
    def one(item):return item[0],inspect(item[0],now,item[1],fetch)
    with ThreadPoolExecutor(max_workers=6) as pool:
        sources=dict(pool.map(one,choices.items()))
    observations={}
    for row in backlog:
        urls=source_urls(row)
        checked=urls[:MAX_SOURCES_PER_CONNECTION]
        # A reachable alternative is an access observation only. Every failed
        # primary remains in sources and sourceChecks; no financial closure.
        selected=next((u for u in checked if sources[u]['status']!='unavailable'),next(iter(checked),None))
        key=row['id']+':'+row['field']
        observations[key]={'prerequisite':prerequisite(row),**(sources[selected] if selected else {
            'status':'not-configured','lastAccessAttemptAt':now.isoformat(),
            'qualification':'access-check-only','financialDataQualified':False}),
            'primarySourceUrl':next(iter(urls),None),
            'sourceChecks':[{'sourceUrl':u,'status':sources[u]['status']} for u in checked],
            'notCheckedSourceUrls':urls[MAX_SOURCES_PER_CONNECTION:]}
    return {'schemaVersion':1,'checkedAt':now.isoformat(),
        'method':'HTTP access and content changes only; primary and configured alternatives are checked independently with a bounded budget. Never renew financial checkedAt, asOf or lastSuccessAt, and never resolve a qualification incident.',
        'sources':sources,'observations':observations}

def main():
    p=argparse.ArgumentParser();p.add_argument('--inventory',type=Path,default=Path('public/data/data-automation-inventory.json'))
    p.add_argument('--output',type=Path,default=Path('public/data/pending-source-checks.json'));args=p.parse_args()
    previous=json.loads(args.output.read_text()) if args.output.exists() else {}
    report=check(json.loads(args.inventory.read_text())['backlog'],previous,dt.datetime.now(dt.timezone.utc))
    args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print('Pending sources checked:',len(report['sources']),'connections retained:',len(report['observations']))

if __name__=='__main__':main()
