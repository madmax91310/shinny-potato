"""DWS published performance chart: reinvested fund returns, never historical quotes."""
import datetime as dt
import math
import json
from bs4 import BeautifulSoup
from issuer_nav_history import positive, calendar_checks


def qualify(body, chart, facts, source, raw_nav, now):
    if source.get('navHistoryKind')!='official-income-reinvested-chart' or source.get('collectAnniversary') is not False:
        raise ValueError('Explicit performance-only DWS income convention required')
    isin,native=source['isin'],source['navCurrency']
    if facts['distribution']!='Distributing':raise ValueError('DWS income treatment changed')
    inception=facts['characteristics']['inceptionDate']
    if inception!=source.get('identityFrom') or source['periodStart']<inception[:7]:
        raise ValueError('DWS exact share launch changed')
    from collect_instrument_metadata import dws_identity
    dws_identity(json.dumps(body).encode(),isin)
    component=body['pdpResult']['pageSections']['performanceSection']['performanceChart']
    note=' '.join(BeautifulSoup(row.get('text',''),'html.parser').get_text(' ',strip=True)for row in component['disclaimerHtml'])
    if 'Performance shown above is net of fund fees and any index replication costs.' not in note or 'ETF performance calculation includes reinvested dividends.' not in note:
        raise ValueError('DWS chart fund income convention missing')
    configs=chart['seriesConfiguration']
    matches=[i for i,c in enumerate(configs)if c.get('chartType')=='Nav' and c.get('identifier')==f'NAV ({native})']
    if len(matches)!=1 or sum(c.get('chartType')=='Nav'for c in configs)!=1:
        raise ValueError('DWS fund chart currency/series ambiguous')
    column=matches[0];visibility=dt.datetime.fromtimestamp(configs[column]['notVisibleBefore']/1000,dt.timezone.utc).date().isoformat()
    if visibility!=inception:raise ValueError('DWS chart share launch differs from exact product')
    points={};previous=None
    for stamp,series in chart['values']:
        if isinstance(stamp,bool) or not isinstance(stamp,(int,float)) or not math.isfinite(stamp):raise ValueError('Invalid DWS chart date')
        instant=dt.datetime.fromtimestamp(stamp/1000,dt.timezone.utc);day=instant.date().isoformat()
        if instant.time()!=dt.time() or day<inception or day>now.date().isoformat() or previous is not None and stamp<=previous:
            raise ValueError('DWS chart duplicate/out-of-order/out-of-share date')
        previous=stamp
        if len(series)!=len(configs)or len(series[column])!=3:raise ValueError('DWS chart columns changed')
        values=series[column]
        if values==[None,None,None]:continue  # Index-only market day is not a fund valuation.
        level=positive(values[0])
        # This contract is deliberately restricted to the published current chart
        # shape. Do not guess a new adjusted/dividend column if its meaning changes.
        if values[1]!=values[0]or values[2]!=0:raise ValueError('DWS chart performance columns require new qualification')
        points[day]=level
    asof=dt.datetime.strptime(chart['asOfDate'],'%d/%m/%Y').date().isoformat()
    if not points or max(points)!=asof or asof!=max(raw_nav):
        raise ValueError('DWS same-date current share NAV anchor missing')
    checks=calendar_checks(points,facts['performance']['years'],2,now,inception)
    required={int(y)for y in facts['performance']['years']if f'{int(y)-1}-12'>=source['periodStart']}
    if {c['year']for c in checks}!=required:raise ValueError('DWS full-year bounds missing')
    cash=[a for a in body['pdpResult']['pageSections']['keyFacts']['accordionItems']if a['id']=='fundinformation-dividends']
    if len(cash)!=1:raise ValueError('DWS official share cash table missing')
    columns={c['key']:c['value']for c in cash[0]['table']['columns']}
    if columns.get('column_1')!='Dividend per Share'or columns.get('column_4')!='Ex Day':raise ValueError('DWS official cash schema changed')
    events=[]
    for row in cash[0]['table']['values']:
        day=dt.datetime.strptime(row['column_4']['value'],'%d/%m/%Y').date().isoformat();amount=positive(float(row['column_1']['value']))
        if day<inception or day>asof:raise ValueError('DWS cash outside exact-share chart window')
        if day not in points or not any(d<day for d in points):raise ValueError('DWS ex-day performance observation missing')
        before=max(d for d in points if d<day)
        if day not in raw_nav or before not in raw_nav or (dt.date.fromisoformat(day)-dt.date.fromisoformat(before)).days>4:
            raise ValueError('DWS cash NAV bounds missing')
        observed=(points[day]/raw_nav[day])/(points[before]/raw_nav[before]);expected=1+amount/raw_nav[day]
        if not math.isclose(observed,expected,rel_tol=1e-6,abs_tol=1e-8):raise ValueError('DWS official cash factor not reconciled: '+day)
        events.append({'exDate':day,'amount':amount,'currency':native,'cashAddedByApplication':False,'observedIncomeFactor':observed,'expectedIncomeFactor':expected})
    if not events or len({e['exDate']for e in events})!=len(events):raise ValueError('DWS share cash events missing or ambiguous')
    # Independently check units on every common valuation, including years with
    # no listed cash. Monthly admission requires each actual monthly end; an
    # unused daily mismatch is retained separately, never filled or interpolated.
    ratio=points[asof]/raw_nav[asof];unit_checks=[];daily_unqualified=[]
    month_ends={d[:7]:d for d in sorted(points)if source['periodStart']<=d[:7]<now.strftime('%Y-%m')}
    for day in sorted(points):
        if day[:7]<source['periodStart']:continue
        if day not in raw_nav:raise ValueError('DWS historical price anchor missing')
        expected=ratio/math.prod(e['expectedIncomeFactor']for e in events if day<e['exDate']<=asof)
        observed=points[day]/raw_nav[day]
        qualified=math.isclose(observed,expected,rel_tol=1e-6,abs_tol=1e-8)
        if not qualified:daily_unqualified.append({'date':day,'observedRatio':observed,'expectedRatio':expected})
        if day in month_ends.values():
            if not qualified:raise ValueError('DWS monthly income/share unit disagreement: '+day)
            unit_checks.append({'date':day,'observedRatio':observed,'expectedRatio':expected,'qualified':True})
    factor=raw_nav[asof]/points[asof]
    normalized={day:value*factor for day,value in points.items()};normalized[asof]=raw_nav[asof]
    return normalized,{'monthlyShareUnitChecks':unit_checks,'dailyQualificationLimit':{'admittedForArbitraryDailyPurchase':False,'unqualifiedDailyUnitDates':daily_unqualified},'scaleProof':{'anchorDate':asof,'officialPerShareNav':raw_nav[asof],'sourceIncomeIndex':points[asof],'factor':factor},'identityFrom':inception,'incomeTreatment':facts['distribution'],'sourceChartConvention':note,
        'officialIncomeReinvestedChartChecks':checks,'officialPublishedCashEvents':events,
        'currentShareNavAnchor':{'asOf':asof,'chartLevel':points[asof],'officialCurrentNav':raw_nav[asof]},
        'controlledInstrument':isin,'controlledFields':['ISIN','Share class currency','Share class launch date','performanceChart.disclaimerHtml','performancechart.seriesConfiguration','performancechart.values','Calendar year.Total return','Dividends.Ex Day','Dividends.Dividend per Share'],
        'cashTreatment':'Issuer performance already includes reinvestment; application adds no cash. Historical chart levels are not qualified as exchange prices or raw historical NAV.',
        'dailyContinuity':'Null fund rows remain missing; qualified only for available full monthly ends, not arbitrary-day investment or price-only anniversaries'}
