"""CBC Taiwan daily interbank USD/TWD + ECB USD/EUR, with both fixing dates retained.
No monthly quote, bank retail spread or interpolated fixing enters this method.
"""
import datetime as dt,hashlib,json,math
from bisect import bisect_right
from data_automation import UTC
CBC_TWD='https://cpx.cbc.gov.tw/api/OpenData/FTDOpenData_Day'

def parse_cbc(body,now,start):
    raw=json.loads(body);rates={}
    if not isinstance(raw,list) or len(raw)<20:raise ValueError('CBC daily history absent or too short')
    for row in raw:
        date=dt.datetime.strptime(row['日期'],'%Y%m%d').date();value=float(row['NTD_USD'])
        if date>now.date():raise ValueError('Future CBC fixing')
        if not math.isfinite(value) or not 0<value<1000:raise ValueError('Invalid CBC TWD/USD unit or value')
        day=date.isoformat()
        if day in rates:raise ValueError('Duplicate CBC fixing')
        if day>=(dt.date.fromisoformat(start)-dt.timedelta(days=20)).isoformat():rates[day]=value
    return {'rates':rates,'sourceUrl':CBC_TWD,'retrievedAt':now.isoformat(),'responseSha256':hashlib.sha256(body).hexdigest(),'quoteUnit':'TWD per USD','convention':'CBC Taiwan interbank daily close'}

def enrich_twd(fx,now,start,fetch,previous=None,required=False):
    from collect_ai_portfolios import calendars
    prior=(previous or {}).get('supplemental',{}).get('TWD')
    supplement=parse_cbc(fetch(CBC_TWD,max_bytes=3_000_000),now,start) if required else prior
    if not supplement:return fx
    cutoff=(now.date()-dt.timedelta(days=1)).isoformat();tw=supplement['rates'];tw_dates=sorted(d for d in tw if d<=cutoff)
    # Preserve the ECB observations separately from the derived valuation-date grid.
    base={d:{k:v for k,v in r.items() if k!='TWD'} for d,r in fx['rates'].items()};ecb_dates=sorted(base)
    calendar=calendars([{'calendar':'XTAI'}],(dt.date.fromisoformat(start)-dt.timedelta(days=20)).isoformat(),cutoff)['XTAI'];sessions=sorted(calendar)
    derived={d:dict(r) for d,r in base.items()};origins={}
    missing=[d for d in sessions if start<=d<=cutoff and d not in tw]
    for day in sorted(set(ecb_dates)|set(tw_dates)):
        if day>cutoff:continue
        e=bisect_right(ecb_dates,day)-1;t=bisect_right(tw_dates,day)-1;s=bisect_right(sessions,day)-1
        if min(e,t,s)<0:continue
        ed,td=ecb_dates[e],tw_dates[t]
        if td<sessions[s]:continue # A genuinely missing expected Taiwan fixing is never forward-filled.
        values=dict(base[ed]);values['TWD']=values['USD']*tw[td]
        derived[day]=values;origins[day]={'TWDUSDDate':td,'USDEURDate':ed,'TWDPerUSD':tw[td],'USDPerEUR':base[ed]['USD']}
    fx.update(rates=derived,supplementalGaps={'TWD':missing},supplemental={'TWD':supplement},derivedFixingOrigins={'TWD':origins},supplementalMethod='TWD per EUR = CBC TWD per USD × ECB USD per EUR; each last published official fixing dated separately. Taiwan missing expected sessions are refused; closed-session carry is explicit.')
    return fx

def validate_fx_date(fx,currency,date):
    if currency=='EUR':return
    dates=sorted(d for d in fx['rates'] if d<=date) if currency=='TWD' else [d for d in fx.get('expectedDates',sorted(fx['rates'])) if d<=date]
    if not dates or date>fx['validThrough'] or not fx['rates'][dates[-1]].get(currency):raise ValueError('Change historique non qualifié : '+currency+' '+date)
    if currency=='TWD':
        origin=fx.get('derivedFixingOrigins',{}).get('TWD',{}).get(dates[-1])
        if not origin or any(origin['TWDUSDDate']<d<=date for d in fx.get('supplementalGaps',{}).get('TWD',[])):raise ValueError('Fixing CBC attendu manquant : '+date)
