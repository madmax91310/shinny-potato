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
from collect_ai_portfolios import ROOT, UTC, ECB, calendars, parse_prices, parse_fx, get_json, download, chart_response, write_json_atomic


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
    instrument_ids={r['instrumentId'] for r in rows}
    qualified=[r for r in rows if r['status']=='qualified']
    counts={'instrumentsInventoried':len(instrument_ids),'listingCandidates':len(rows),
            'technicalCandidates':sum(not r.get('permanentExclusion') for r in rows),
            'testedCandidates':sum(bool(r.get('lastAttempt')) for r in rows),
            'admittedInstruments':len({r['instrumentId'] for r in qualified}),
            'qualifiedListings':len(qualified),
            **{k:sum(r['status']==k for r in rows) for k in ['temporary-failure','excluded','blocked','unprocessed']}}
    families={f:{'instruments':len({r['instrumentId'] for r in rows if r['family']==f}),
                 'candidates':sum(r['family']==f for r in rows),
                 'admittedInstruments':len({r['instrumentId'] for r in qualified if r['family']==f}),
                 **{s:sum(r['family']==f and r['status']==s for r in rows) for s in ['qualified','temporary-failure','excluded','blocked','unprocessed']}}
              for f in sorted({r['family'] for r in rows})}
    assert sum(counts[s] for s in ['qualifiedListings','temporary-failure','excluded','blocked','unprocessed'])==len(rows)
    report={'version':1,'generatedAt':dt.datetime.now(UTC).isoformat(),'counts':counts,'families':families,'candidates':rows}
    write_json_atomic(destination/'qualification.json',report)
    columns=['id','instrumentId','name','family','isin','mic','ticker','symbol','currency','sourceCurrency','priceScale','source','convention','coverageFrom','coverageThrough','calendarThrough','observedCoverageFrom','observedCoverageThrough','dailySourceUrl','sourceRetrievedAt','qualifiedSymbol','status','reason','lastAttempt','lastSuccess','sourceUrl','responseSha256']
    stream=io.StringIO();w=csv.DictWriter(stream,fieldnames=columns,extrasaction='ignore',lineterminator='\n');w.writeheader();w.writerows(rows)
    (destination/'qualification.csv').write_text(stream.getvalue())
    text='# Qualification quotidienne — Portefeuilles IA\n\nGénéré : '+report['generatedAt']+'\n\n'
    text+='\n'.join(f'- {k} : {v}' for k,v in counts.items())+'\n\n'
    text+='| Famille | Instruments | Candidats | Instruments admis | Cotations qualifiées | Échecs temporaires | Exclus | Bloqués | Non traités |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|\n'
    for f,c in families.items():text+='| '+f+' | '+' | '.join(str(c[k]) for k in ['instruments','candidates','admittedInstruments','qualified','temporary-failure','excluded','blocked','unprocessed'])+' |\n'
    text+='\nChaque ligne CSV/JSON correspond à une cotation candidate (ou à une identité sans cotation), jamais à une admission implicite. Les totaux de statuts se réconcilient avec les candidats. Un instrument est compté une seule fois parmi les admis. « Bloqué » signifie preuve, calendrier, change ou raccordement manquant, pas une réponse négative de la source. Les échecs réseau, les historiques insuffisants et les incohérences restent retentables. Les indices et supports non quotidiens ne deviennent pas des fonds.\n'
    (destination/'qualification.md').write_text(text)
    return report


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--root',type=pathlib.Path,default=ROOT)
    p.add_argument('--workers',type=int,default=4)
    p.add_argument('--batch-size',type=int,default=100,help='Checkpoint interval, never a functional limit')
    p.add_argument('--mode',choices=['remaining','retry','due','all'],default='remaining')
    p.add_argument('--cache',type=pathlib.Path,default=pathlib.Path('/tmp/ai-daily-response-cache'))
    args=p.parse_args();assert 1<=args.workers<=6 and args.batch_size>0
    folder=args.root/'data/ai-portfolios';folder.mkdir(parents=True,exist_ok=True)
    market_path=folder/'market.json';market=json.loads(market_path.read_text()) if market_path.exists() else {}
    path=folder/'qualification.json';old=json.loads(path.read_text()) if path.exists() else {'candidates':[]}
    book=json.loads((folder/'book.json').read_text()) if (folder/'book.json').exists() else {'competitions':[]}
    frozen={a for c in book['competitions'] if c.get('status')=='launched' for a in c['config']['universe']}
    old_by={r['id']:r for r in old['candidates']};now=dt.datetime.now(UTC);today=now.date()
    start=market.get('calendarFrom',(today-dt.timedelta(days=100)).isoformat());end=(today+dt.timedelta(days=70)).isoformat()
    market.update({'version':1,'generatedAt':now.isoformat(),'asOf':(today-dt.timedelta(days=1)).isoformat(),'calendarFrom':start,'calendarThrough':end})
    for key in ['series','status','calendars','calendarValidity']:market.setdefault(key,{})
    market.setdefault('revisions',[])
    fx=parse_fx(download(ECB,max_bytes=12_000_000),now,start);fx['retrievedAt']=now.isoformat();fx['rates']={d:r for d,r in fx['rates'].items() if d>=(dt.date.fromisoformat(start)-dt.timedelta(days=7)).isoformat()};market['fx']=fx
    market['status']['ECB']={'ok':True,'asOf':max(fx['rates']),'attemptedAt':now.isoformat()}
    candidates=discover();rows=[];queue=[];calendar_cache={}
    currencies=set.intersection(*(set(r) for r in fx['rates'].values()))|{'EUR'}
    for asset in candidates:
        prior=old_by.get(asset['id'],{});row={**asset,**{k:prior[k] for k in ['status','reason','lastAttempt','lastSuccess','coverageFrom','coverageThrough','calendarThrough','observedCoverageFrom','observedCoverageThrough','dailySourceUrl','sourceRetrievedAt','responseSha256','attempts','qualifiedSymbol','observedSourceCurrency'] if k in prior}}
        # A changed identity invalidates the old certificate, never silently rebases a series.
        if prior and any(prior.get(k)!=asset.get(k) for k in ['instrumentId','symbol','currency','mic']):
            row.update(status='blocked',reason='Identité de cotation modifiée depuis la qualification ; revue explicite requise.');rows.append(row);continue
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
            if needed:queue.append(row)
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
                if row['currency']=='GBP' and meta.get('currency') in ['GBP','GBp','GBX']:
                    candidate.update(sourceCurrency=meta['currency'],priceScale=1 if meta['currency']=='GBP' else .01)
                series=parse_prices(raw,candidate,market['calendars'][row['calendar']],now,market['series'].get(row['id']))
                series.update(sourceUrl=actual,retrievedAt=retrieved,isin=row['isin'],listingEvidenceId=row.get('evidenceId'),symbol=symbol,currency=row['currency'])
                for d in series['points']:
                    dates=[f for f in fx['rates'] if f<=d]
                    if row['currency']!='EUR' and (not dates or row['currency'] not in fx['rates'][max(dates)]):raise ValueError('Change historique absent pour '+d)
                attempts.append({'url':actual,'result':'qualified','at':at,'retrievedAt':retrieved})
                return row,{'status':'qualified','reason':'Identité, place, type, devise, séances et cours quotidiens contrôlés.','lastAttempt':at,'lastSuccess':at,'coverageFrom':series['anchorDate'],'coverageThrough':max(series['points']),'responseSha256':series['responseSha256'],'observedSourceCurrency':candidate.get('sourceCurrency'),'priceScale':candidate.get('priceScale',1),'qualifiedSymbol':symbol,'attempts':attempts,**observed},series
            except Exception as e:
                last_error=str(e);attempts.append({'url':actual,'requestedUrl':url,'result':last_error,'at':at,**({'retrievedAt':retrieved} if entry and entry.get('raw') else {})})
        return row,{'status':'temporary-failure','reason':failure_reason(attempts) if attempts else last_error,'lastAttempt':at,'attempts':attempts,**observed},None
    def save():
        # Preserve listing IDs already frozen in a book; no automatic replacement.
        previous={a['id']:a for a in market.get('universe',[])}
        market['universe']=[{**r} for r in rows]
        book=json.loads((folder/'book.json').read_text()) if (folder/'book.json').exists() else {'competitions':[]}
        used={a for c in book['competitions'] for a in c['config']['universe']}
        current={a['id'] for a in market['universe']}
        market['universe'] += [a for k,a in previous.items() if k in used and k not in current]
        reports(rows,folder);write_json_atomic(market_path,market)
    save();print(f'{len(rows)} candidats inventoriés ; {len(queue)} à traiter ({args.mode}).',flush=True)
    with futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        for i,(row,update,series) in enumerate(pool.map(qualify,queue),1):
            row.update(update);key=row['id']
            market['status'][key]={'ok':series is not None,'attemptedAt':update['lastAttempt'],**({'asOf':update['coverageThrough']} if series else {'error':update['reason']})}
            if series:
                old_points=market['series'].get(key,{}).get('points',{})
                changes=[{'date':d,'before':old_points[d],'after':v} for d,v in series['points'].items() if d in old_points and (abs(old_points[d]['synthetic']-v['synthetic'])>1e-7 or abs(old_points[d]['close']-v['close'])>1e-7)]
                if changes:market['revisions'].append({'at':update['lastAttempt'],'asset':key,'changes':changes})
                market['series'][key]=series
            print(f'{i}/{len(queue)} {key} {update["status"]}: {update["reason"][:160]}',flush=True)
            if i%args.batch_size==0:save()
    save()
    print(json.dumps(reports(rows,folder)['counts'],ensure_ascii=False),flush=True)

if __name__=='__main__':main()
