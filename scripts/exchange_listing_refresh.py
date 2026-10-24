"""Renew only already-consumed ordinary-share identities; never collect prices or discover a universe."""
import copy,csv,datetime as dt,hashlib,io,json,re
from pathlib import Path
from issuer_documents import download

def security_type(name, default='ordinary'):
 n=name.lower()
 # Share descriptors outrank words in the issuer name (e.g. Preferred Bank common stock).
 descriptor=n.rsplit(' - ',1)[-1]
 if re.search(r'\b(common stock|ordinary shares?)\b',descriptor) and not re.search(r'\b(units?|warrants?|rights?|options?|preferred|depositary|depository|ads|adr|cdi)\b',descriptor) and not re.search(r'\b(fund|investment trust|investment company)\b',n):return 'ordinary'
 for pattern,kind in [(r'\b(?:etc|exchange[ -]*traded commodit(?:y|ies))\b','ETC'),(r'\b(?:etn|exchange[ -]*traded notes?)\b','ETN'),(r'\b(?:etp|exchange[ -]*traded products?)\b','ETP'),(r'\b(?:etf|exchange[ -]*traded funds?)\b','ETF'),(r'\b(units?|stapled)\b','unit'),(r'\b(warrants?|rights?|options?)\b','warrant-right'),(r'\b(preferred|preference|pref|pfd|vorzugsaktien|\bvz\b)\b','preferred'),(r'\b(notes?|debentures?|bonds?)\b','debt'),(r'\b(etf|etn|etp|exchange.traded)\b','ETF'),(r'\b(closed.end|\bfund\b|investment trust|investment company)\b','closed-end-fund'),(r'\b(depositary|depository|adr|ads|cdi|gdr|tdr|sdb)\b','depositary-receipt')]:
  if re.search(pattern,n):return kind
 return default

def observations(body,source_id,now):
    if source_id in ('nasdaq','us-other'):
        text=body.decode('utf-8-sig');stamp=re.search(r'File Creation Time: (\d{2})(\d{2})(\d{4})',text)
        if not stamp:raise ValueError('Missing official directory date')
        asof=f'{stamp[3]}-{stamp[1]}-{stamp[2]}'
        if dt.date.fromisoformat(asof)>now.date():raise ValueError('Future directory date')
        rows=[]
        for r in csv.DictReader(io.StringIO(text),delimiter='|'):
            ticker=r.get('Symbol')or r.get('ACT Symbol')
            if not ticker or ticker.startswith('File Creation'):continue
            mic='XNAS'if source_id=='nasdaq'else {'N':'XNYS','A':'XASE','P':'ARCX','Z':'BATS','V':'IEXG'}.get(r['Exchange'])
            kind='test-issue'if r.get('Test Issue')=='Y'else'ETF'if r.get('ETF')=='Y'else security_type(r['Security Name'])
            rows.append(dict(ticker=ticker,mic=mic,currency='USD',name=r['Security Name'],shareType=kind))
        return rows,asof
    if source_id=='nordic-main':
        data=json.loads(body);rows=data['data']['instrumentListing']['rows']
        if len(rows)!=int(data['data']['pagination']['total']):raise ValueError('Incomplete Nordic directory')
        asof=data['status']['timestamp'][:10]
        if dt.date.fromisoformat(asof)>now.date():raise ValueError('Future directory date')
        return [dict(ticker=r['symbol'],mic=r.get('micCode'),currency=r['currency'],name=r['fullName'],isin=r['isin'],orderbook=r['orderbookId'],shareType=security_type(r['fullName']))for r in rows],asof
    raise ValueError('Unsupported shared directory')

def refresh(document,now,fetch=download):
    result=copy.deepcopy(document);successes=[];errors=[];cache={}
    # These are already-established common ISIN links, not an ISIN inference from an exchange name.
    common=json.loads((Path(__file__).resolve().parents[1]/'src/data/global-equities.json').read_text())
    aliases={r['aiListingId']:r['isin']for r in common if r.get('aiListingId')}
    for row in result['listings']:
        if row.get('sourceId')not in ('nasdaq','us-other','nordic-main'):continue
        identifier=row.get('isin')or aliases.get(row['id'])or row['id'];url=row['sourceUrl']
        try:
            if url not in cache:
                try:
                    body=fetch(url,max_bytes=6_000_000,max_attempts=1);points,asof=observations(body,row['sourceId'],now);cache[url]=(points,asof,hashlib.sha256(body).hexdigest())
                except Exception as e:cache[url]=e
            if isinstance(cache[url],Exception):raise cache[url]
            points,asof,sha=cache[url];matches=[r for r in points if r['ticker']==row['ticker']and r['currency']==row['currency']]
            if len(matches)!=1:raise ValueError('Exact directory listing missing or ambiguous')
            current=matches[0]
            if current['shareType']!='ordinary'or current['name']!=row['name']:raise ValueError('Security class or exact issuer label changed; old proof retained')
            if row.get('isin')and current.get('isin')and row['isin']!=current['isin']:raise ValueError('Exact share ISIN changed')
            updates={}
            if row['sourceId']=='nordic-main':
                detail_url='https://api.nasdaq.com/api/nordic/instruments/'+str(current['orderbook'])+'/info?assetClass=SHARES&lang=en'
                raw=fetch(detail_url,max_bytes=1_000_000,max_attempts=1);header=json.loads(raw)['data']['qdHeader']
                if (header['isin'],header['symbol'],header['currency'])!=(row['isin'],row['ticker'],row['currency']):raise ValueError('Nordic exact share identity changed')
                current['mic']={'Nasdaq Stockholm':'XSTO','Nasdaq Helsinki':'XHEL','Nasdaq Copenhagen':'XCSE','Nasdaq Iceland':'XICE'}.get(header['exchange'])
                updates.update(identityDetailSourceUrl=detail_url,identityDetailSha256=hashlib.sha256(raw).hexdigest())
            if current['mic']!=row['mic']:raise ValueError('Exact venue changed')
            if asof<max(row.get('sourceAsOf',''),row.get('listingObservation',{}).get('asOf','')):raise ValueError('Older directory observation refused')
            row['listingObservation']={**updates,'sourceUrl':url,'asOf':asof,'checkedAt':now.isoformat(),'sha256':sha}
            successes.append({'id':identifier,'sourceUrl':url,'asOf':asof})
        except Exception as e:errors.append({'id':identifier,'sourceUrl':url,'error':str(e),'lastSuccessAt':row.get('listingObservation',{}).get('checkedAt',row.get('checkedAt')),'attemptedAt':now.isoformat()})
    return result,{'successes':successes,'errors':errors}
