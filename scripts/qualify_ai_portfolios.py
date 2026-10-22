"""Discover EVERY registry candidate, qualify in resumable bounded batches, reconcile report."""
import argparse
import concurrent.futures as futures
import csv
import datetime as dt
import hashlib
import io
import json
import pathlib
import subprocess
import time
import threading
from urllib.parse import quote, urlencode
from ai_portfolio_series import hydrate, persist, bucket
from ai_equity_diagnostics import category
from ai_portfolio_catalogue import compact_catalogue
from ai_portfolio_fx import enrich_twd, validate_fx_date
from collect_ai_portfolios import ROOT, UTC, ECB, calendars, parse_prices, parse_fx, get_json, download, chart_response, write_json_atomic


def write_json_atomic(destination,data):
    destination=pathlib.Path(destination);destination.parent.mkdir(parents=True,exist_ok=True)
    temporary=destination.with_suffix(destination.suffix+'.tmp');temporary.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'),allow_nan=False)+'\n');temporary.replace(destination)

def discover():
    return json.loads(subprocess.check_output(['node','scripts/ai-portfolio-universe.mjs'],cwd=ROOT))


def failure_reason(attempts):
    reasons=list(dict.fromkeys(a['result'] for a in attempts))
    meaningful=[r for r in reasons if not r.startswith('HTTP Error')]
    return (meaningful or reasons or ['Aucune réponse exploitable'])[0]


def should_attempt(prior, mode, now):
    if not prior.get('lastAttempt'):
        return True
    if mode=='remaining':
        return False
    if mode=='all':
        return True
    if mode=='retry':
        return prior.get('status')!='qualified'
    age=(now-dt.datetime.fromisoformat(prior['lastAttempt'])).total_seconds()/86400
    return age >= (7 if prior.get('status')=='qualified' else 1)


def reports(rows, destination):
    for r in rows:r['errorCategory']=category(r)
    instrument_ids={r['instrumentId'] for r in rows}
    qualified=[r for r in rows if r['status']=='qualified']
    counts={'instrumentsInventoried':len(instrument_ids),'listingCandidates':len(rows),
            'technicalCandidates':sum(not r.get('permanentExclusion') for r in rows),
            'testedCandidates':sum(bool(r.get('lastAttempt')) for r in rows),
            'admittedInstruments':len({r['instrumentId'] for r in qualified if not r.get('selectionBlock')}),
            'qualifiedListings':len(qualified),
            **{k:sum(r['status']==k for r in rows) for k in ['temporary-failure','excluded','blocked','unprocessed']}}
    families={f:{'instruments':len({r['instrumentId'] for r in rows if r['family']==f}),
                 'candidates':sum(r['family']==f for r in rows),
                 'admittedInstruments':len({r['instrumentId'] for r in qualified if r['family']==f and not r.get('selectionBlock')}),
                 **{s:sum(r['family']==f and r['status']==s for r in rows) for s in ['qualified','temporary-failure','excluded','blocked','unprocessed']}}
              for f in sorted({r['family'] for r in rows})}
    assert sum(counts[s] for s in ['qualifiedListings','temporary-failure','excluded','blocked','unprocessed'])==len(rows)
    report={'version':1,'generatedAt':dt.datetime.now(UTC).isoformat(),'counts':counts,'families':families,'candidates':compact_catalogue(rows)}
    write_json_atomic(destination/'qualification.json',report)
    columns=['id','instrumentId','name','family','isin','instrumentType','yahooInstrumentType','mic','ticker','symbol','currency','sourceCurrency','priceScale','source','convention','coverageFrom','coverageThrough','calendarThrough','observedCoverageFrom','observedCoverageThrough','dailySourceUrl','sourceRetrievedAt','qualifiedSymbol','status','reason','lastAttempt','lastSuccess','sourceUrl','responseSha256']
    stream=io.StringIO();w=csv.DictWriter(stream,fieldnames=columns,extrasaction='ignore',lineterminator='\n');w.writeheader();w.writerows(rows)
    (destination/'qualification.csv').write_text(stream.getvalue())
    text='# Qualification quotidienne — Portefeuilles IA\n\nGénéré : '+report['generatedAt']+'\n\n'
    text+='\n'.join(f'- {k} : {v}' for k,v in counts.items())+'\n\n'
    text+='| Famille | Instruments | Candidats | Instruments admis | Cotations qualifiées | Échecs temporaires | Exclus | Bloqués | Non traités |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|\n'
    for f,c in families.items():text+='| '+f+' | '+' | '.join(str(c[k]) for k in ['instruments','candidates','admittedInstruments','qualified','temporary-failure','excluded','blocked','unprocessed'])+' |\n'
    text+='\nChaque ligne CSV/JSON correspond à une cotation candidate (ou à une identité sans cotation), jamais à une admission implicite. Les totaux de statuts se réconcilient avec les candidats. Un instrument est compté une seule fois parmi les admis. « Bloqué » signifie preuve, calendrier, change ou raccordement manquant, pas une réponse négative de la source. Les échecs réseau, les historiques insuffisants et les incohérences restent retentables. Les indices et supports non quotidiens ne deviennent pas des fonds.\n'
    (destination/'qualification.md').write_text(text)
    return report


def replay_checkpoints(market,old_by,folder):
    for journal in sorted((folder/'qualification-checkpoints').glob('*.json')):
        for r in json.loads(journal.read_text()):
            if not old_by.get(r['id'],{}).get('lastAttempt') or (r.get('lastAttempt') or '')>(old_by[r['id']].get('lastAttempt') or ''):
                old_by[r['id']]=r
                market['status'][r['id']]={'ok':r['status']=='qualified','attemptedAt':r.get('lastAttempt'),'error':r.get('reason'),'asOf':r.get('coverageThrough')}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--recheck-cached',action='store_true',help='Revalidate retained responses after a verified calendar/accounting correction; original retrieval date is retained')
    p.add_argument('--ids-file',type=pathlib.Path,help='JSON array of an exhaustive diagnostic set; avoids operating-system argument limits')
    p.add_argument('--ids',default='',help='Target an explicit diagnostic set; default remains the entire discovered perimeter')
    p.add_argument('--root',type=pathlib.Path,default=ROOT)
    p.add_argument('--workers',type=int,default=4)
    p.add_argument('--batch-size',type=int,default=100,help='Checkpoint interval, never a functional limit')
    p.add_argument('--mode',choices=['remaining','retry','due','all'],default='remaining')
    p.add_argument('--time-budget',type=int,default=0,help='Graceful execution budget in seconds; zero processes the entire queue. Remaining candidates stay unprocessed.')
    p.add_argument('--cache',type=pathlib.Path,default=pathlib.Path('/tmp/ai-daily-response-cache'))
    args=p.parse_args();assert 1<=args.workers<=6 and args.batch_size>0
    target_ids=set(args.ids.split(',')) if args.ids else None
    if args.ids_file:
        values=json.loads(args.ids_file.read_text());assert isinstance(values,list) and all(isinstance(v,str) for v in values);target_ids=set(values)
    folder=args.root/'data/ai-portfolios';folder.mkdir(parents=True,exist_ok=True)
    market_path=folder/'market.json';market=json.loads(market_path.read_text()) if market_path.exists() else {}
    resident=set(market.get('series',{}));stored_paths={a['id']:a.get('seriesFile') for a in market.get('universe',[])}
    dirty={key for key in resident if not stored_paths.get(key) or not (folder/stored_paths[key]).exists()}
    hydrate(market,folder);started=time.monotonic()
    path=folder/'qualification.json';old=json.loads(path.read_text()) if path.exists() else {'candidates':[]}
    book=json.loads((folder/'book.json').read_text()) if (folder/'book.json').exists() else {'competitions':[]}
    frozen={a for c in book['competitions'] if c.get('status')=='launched' for a in c['config']['universe']}
    old_by={r['id']:r for r in old['candidates']}
    replay_checkpoints(market,old_by,folder)
    market['universe']=list(old_by.values());hydrate(market,folder)
    now=dt.datetime.now(UTC);today=now.date()
    start=market.get('calendarFrom',(today-dt.timedelta(days=100)).isoformat());end=(today+dt.timedelta(days=70)).isoformat()
    market.update({'version':1,'generatedAt':now.isoformat(),'asOf':(today-dt.timedelta(days=1)).isoformat(),'calendarFrom':start,'calendarThrough':end})
    for key in ['series','status','calendars','calendarValidity']:market.setdefault(key,{})
    market.setdefault('revisions',[])
    prior_fx=market.get('fx',{});candidates=discover()
    fx=parse_fx(download(ECB,max_bytes=12_000_000),now,start);fx['retrievedAt']=now.isoformat();fx['rates']={d:r for d,r in fx['rates'].items() if d>=(dt.date.fromisoformat(start)-dt.timedelta(days=7)).isoformat()};
    try:
        fx=enrich_twd(fx,now,start,download,previous=prior_fx,required=any(a.get('currency')=='TWD' for a in candidates))
        market['status']['CBC']={'ok':True,'attemptedAt':now.isoformat(),'sourceUrl':fx.get('supplemental',{}).get('TWD',{}).get('sourceUrl')}
    except Exception as e:
        market['status']['CBC']={'ok':False,'error':str(e),'attemptedAt':now.isoformat()}
        fx=enrich_twd(fx,now,start,download,previous=prior_fx,required=False)
    changes=[{'date':d,'before':prior_fx['rates'][d],'after':r} for d,r in fx['rates'].items() if d in prior_fx.get('rates',{}) and any(prior_fx['rates'][d][c]!=r[c] for c in set(prior_fx['rates'][d])&set(r))]
    if changes:market['revisions'].append({'at':now.isoformat(),'asset':'FX','sourceUrls':[fx['sourceUrl'],fx.get('supplemental',{}).get('TWD',{}).get('sourceUrl')],'changes':changes})
    market['fx']=fx
    market['status']['ECB']={'ok':True,'asOf':max(fx['rates']),'attemptedAt':now.isoformat()}
    rows=[];queue=[];calendar_cache={}
    correction_path=folder/'equity-scope/identity-corrections.json';identity_corrections={r['id']:r for r in json.loads(correction_path.read_text())} if correction_path.exists() else {}
    currencies=set.union(*(set(r) for r in fx['rates'].values()))|{'EUR'}
    for asset in candidates:
        prior=old_by.get(asset['id'],{});row={**asset,**{k:prior[k] for k in ['status','reason','lastAttempt','lastSuccess','coverageFrom','coverageThrough','calendarThrough','observedCoverageFrom','observedCoverageThrough','dailySourceUrl','sourceRetrievedAt','responseSha256','attempts','qualifiedSymbol','observedSourceCurrency','seriesFile','earliestQualificationDate','providerFirstTradeDate'] if k in prior}}
        certified=market['series'].get(asset['id'],{})
        if certified.get('responseSha256') and certified['responseSha256']==prior.get('responseSha256'):
            row.update(observedSourceCurrency=certified.get('sourceCurrency'),priceScale=certified.get('priceScale',1))
        # A changed identity invalidates the old certificate, never silently rebases a series.
        correction=identity_corrections.get(asset['id'],{})
        class_review=correction.get('before')==prior.get('instrumentId') and correction.get('after')==asset.get('instrumentId') and all(correction.get(k)==asset.get(k) for k in ['mic','ticker','currency'])
        if prior and not asset.get('permanentExclusion') and not prior.get('permanentExclusion') and (any(prior.get(k)!=asset.get(k) for k in ['symbol','currency','mic']) or prior.get('instrumentId')!=asset.get('instrumentId') and not class_review):
            row.update(status='blocked',reason='Identité de cotation modifiée depuis la qualification ; revue explicite requise.');rows.append(row);continue
        if class_review:
            row['identityReviewedAt']=correction['at']
            if asset['id'] in market['series']:
                market['series'][asset['id']].update(isin=asset.get('isin'),listingEvidenceId=asset.get('evidenceId'));dirty.add(asset['id'])
            market['revisions'].append({'kind':'identity-resolution','at':correction['at'],'asset':asset['id'],'before':correction['before'],'after':correction['after'],'financialEffect':'none; listing IDs and price units retained'})
        reason=asset.get('discoveryBlock')
        if not reason and asset.get('currency') not in currencies:reason='Change quotidien BCE absent pour '+str(asset.get('currency'))
        if not reason:
            try:
                if asset['calendar'] not in calendar_cache:calendar_cache.update(calendars([asset],start,end,market['calendarValidity']))
                market['calendars'][asset['calendar']]=calendar_cache[asset['calendar']]
                row['calendarThrough']=market['calendarValidity'][asset['calendar']]['through']
            except Exception as e:reason='Calendrier non qualifié : '+str(e)
        if reason:row.update(status='excluded' if asset.get('permanentExclusion') else 'blocked',reason=reason)
        else:
            row.setdefault('status','unprocessed');row.setdefault('reason','Aucune tentative réseau effectuée.')
            needed=should_attempt(prior,args.mode,now)
            if needed and (target_ids is None or row['id'] in target_ids):queue.append(row)
        rows.append(row)
    args.cache.mkdir(parents=True,exist_ok=True);cache_locks={}
    def qualify(row):
        at=dt.datetime.now(UTC).isoformat();attempts=[];last_error=None;observed={}
        # Try provider symbols documented by issuers, then the exact venue adapter.
        # A response from a different exchange/currency/type is still rejected.
        existing=market['series'].get(row['id'],{})
        symbols=[existing['symbol']] if row['id'] in frozen and existing.get('symbol') else row.get('symbolCandidates') or [row['symbol']]
        for symbol in symbols:
          for host in ['query2','query1']:
            url='https://'+host+'.finance.yahoo.com/v8/finance/chart/'+quote(symbol,safe='')+'?'+urlencode({'period1':int(dt.datetime.fromisoformat(start).replace(tzinfo=UTC).timestamp()),'period2':int(now.timestamp()),'interval':'1d','events':'div,splits','includeAdjustedClose':'true'})
            entry=None;actual=url
            cache=args.cache/(hashlib.sha256((today.isoformat()+start+symbol+host+'adjusted').encode()).hexdigest()+'.json')
            try:
                with cache_locks.setdefault(str(cache),threading.Lock()):
                    entry=json.loads(cache.read_text()) if cache.exists() else None
                    if entry and entry.get('raw') and not args.recheck_cached:
                        cached_time=dt.datetime.fromisoformat(entry['retrievedAt']).timestamp() if entry.get('retrievedAt') else cache.stat().st_mtime
                        if time.time()-cached_time>3600:entry=None
                    if entry and entry.get('error') and time.time()-entry.get('cachedAt',0)>3600:entry=None
                    if not entry:
                        time.sleep(.2)
                        try:entry={'raw':get_json(url,max_attempts=1),'url':url,'retrievedAt':dt.datetime.now(UTC).isoformat()}
                        except Exception as e:entry={'error':str(e),'url':url,'cachedAt':time.time()}
                        write_json_atomic(cache,entry)
                    if entry.get('error'):raise ValueError(entry['error'])
                    raw=entry['raw'];actual=entry['url']
                    retrieved=entry.get('retrievedAt') or dt.datetime.fromtimestamp(cache.stat().st_mtime,UTC).isoformat()
                data=raw['chart']['result'][0];meta=data['meta'];candidate={**row,'symbol':symbol}
                stamps=data.get('timestamp',[]);closes=data.get('indicators',{}).get('quote',[{}])[0].get('close',[])
                observed_dates=[dt.datetime.fromtimestamp(t,UTC).astimezone(__import__('zoneinfo').ZoneInfo(meta['exchangeTimezoneName'])).date().isoformat() for t,c in zip(stamps,closes) if c is not None and c>0]
                if observed_dates:observed={'observedCoverageFrom':min(observed_dates),'observedCoverageThrough':max(observed_dates),'dailySourceUrl':actual,'sourceRetrievedAt':retrieved}
                if observed_dates and meta.get('firstTradeDate'):
                    first_trade=dt.datetime.fromtimestamp(meta['firstTradeDate'],UTC).astimezone(__import__('zoneinfo').ZoneInfo(meta['exchangeTimezoneName'])).date().isoformat()
                    observed['providerFirstTradeDate']=first_trade
                    if first_trade>=start:
                        eligible=sorted(d for d in market['calendars'][row['calendar']] if d>=max(first_trade,min(observed_dates)))
                        observed['earliestQualificationDate']=eligible[19] if len(eligible)>=20 else None
                if row['currency']=='GBP' and meta.get('currency') in ['GBP','GBp','GBX']:
                    candidate.update(sourceCurrency=meta['currency'],priceScale=1 if meta['currency']=='GBP' else .01)
                series=parse_prices(raw,candidate,market['calendars'][row['calendar']],now,market['series'].get(row['id']),through=market['asOf'])
                series.update(sourceUrl=actual,retrievedAt=retrieved,isin=row['isin'],listingEvidenceId=row.get('evidenceId'),symbol=symbol,currency=row['currency'])
                for d in series['points']:validate_fx_date(fx,row['currency'],d)
                attempts.append({'url':actual,'result':'qualified','at':at,'retrievedAt':retrieved})
                return row,{'status':'qualified','reason':'Identité, place, type, devise, séances et cours quotidiens contrôlés.','lastAttempt':at,'lastSuccess':at,'coverageFrom':series['anchorDate'],'coverageThrough':max(series['points']),'responseSha256':series['responseSha256'],'observedSourceCurrency':candidate.get('sourceCurrency'),'priceScale':candidate.get('priceScale',1),'qualifiedSymbol':symbol,'attempts':attempts,**observed},series
            except Exception as e:
                last_error=str(e);attempts.append({'url':actual,'requestedUrl':url,'result':last_error,'at':at,**({'retrievedAt':retrieved} if entry and entry.get('raw') else {})})
        return row,{'status':'temporary-failure','reason':failure_reason(attempts) if attempts else last_error,'lastAttempt':at,'attempts':attempts,**observed},None
    def save():
        # Preserve listing IDs already frozen in a book; no automatic replacement.
        previous={a['id']:a for a in market.get('universe',[])}
        market['universe']=compact_catalogue([r for r in rows if not r.get('permanentExclusion')])
        book=json.loads((folder/'book.json').read_text()) if (folder/'book.json').exists() else {'competitions':[]}
        used={a for c in book['competitions'] for a in c['config']['universe']}
        current={a['id'] for a in market['universe']}
        market['universe'] += [a for k,a in previous.items() if k in used and k not in current]
        reports(rows,folder);write_json_atomic(market_path,persist(market,folder,resident,dirty));dirty.clear()
    save();print(f'{len(rows)} candidats inventoriés ; {len(queue)} à traiter ({args.mode}).',flush=True)
    queue.sort(key=lambda r:(bool(r.get('lastAttempt')),r.get('lastAttempt') or ''))
    checkpoint_rows=[]
    def checkpoint():
        if not checkpoint_rows:return
        persist(market,folder,resident,dirty);dirty.clear()
        write_json_atomic(folder/'qualification-checkpoints'/(dt.datetime.now(UTC).strftime('%Y%m%dT%H%M%S%f')+'.json'),checkpoint_rows)
        checkpoint_rows.clear()
    def results():
        iterator=iter(queue)
        with futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
            pending={pool.submit(qualify,r) for r in [next(iterator,None) for _ in range(args.workers)] if r}
            while pending:
                done,pending=futures.wait(pending,return_when=futures.FIRST_COMPLETED)
                for task in done:
                    yield task.result()
                    if not args.time_budget or time.monotonic()-started<args.time_budget:
                        r=next(iterator,None)
                        if r:pending.add(pool.submit(qualify,r))
    for i,(row,update,series) in enumerate(results(),1):
        row.update(update);key=row['id']
        market['status'][key]={'ok':series is not None,'attemptedAt':update['lastAttempt'],**({'asOf':update['coverageThrough']} if series else {'error':update['reason']})}
        if series:
            old_points=market['series'].get(key,{}).get('points',{})
            changes=[{'date':d,'before':old_points[d],'after':v} for d,v in series['points'].items() if d in old_points and (abs(old_points[d]['synthetic']-v['synthetic'])>1e-7 or abs(old_points[d]['close']-v['close'])>1e-7)]
            if changes:market['revisions'].append({'at':update['lastAttempt'],'asset':key,'changes':changes})
            market['series'][key]=series;dirty.add(key)
        if series:row['seriesFile']='series/'+bucket(key)
        checkpoint_rows.append(dict(row))
        print(f'{i}/{len(queue)} {key} {update["status"]}: {update["reason"][:160]}',flush=True)
        if i%args.batch_size==0:checkpoint()
    checkpoint();save()
    for journal in (folder/'qualification-checkpoints').glob('*.json'):journal.unlink()
    write_json_atomic(folder/'qualification-progress.json',{'at':dt.datetime.now(UTC).isoformat(),'mode':args.mode,'planned':len(queue),'completed':i if queue else 0,'timeBudgetSeconds':args.time_budget,'stopReason':'time-budget' if args.time_budget and time.monotonic()-started>=args.time_budget else 'queue-complete'})
    print(json.dumps(reports(rows,folder)['counts'],ensure_ascii=False),flush=True)

if __name__=='__main__':main()
