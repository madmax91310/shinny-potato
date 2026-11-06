"""Exact listing unit repairs. Detection alone never supplies a price or split.

Provider captures remain intact. Each collection rechecks the primary evidence;
comparison-only IMIE qualification deliberately remains in qualified_split_comparison.
"""
import copy
import datetime as dt
import hashlib
import json
import math
import re
from data_automation import get_json
from issuer_documents import download

BNKE_NOTICE = 'https://www.webdisclosure.fr/press-release/lyxor-sp-500-ucits-etf-acc-etr-multi-units-luxembourg-notice-to-the-shareholders-Oftu9lO8NCy'
SIX_ID = 'https://www.six-group.com/fqs/ref.json?select=ISIN,ValorSymbol,TradingBaseCurrency&where=ValorId=IE00B27YCF74USD4'
SIX_PRICES = 'https://www.six-group.com/fqs/charts.json?select=ValorId&where=ValorId=IE00B27YCF74USD4&netting=1440&fromdate=20260220&todate=20260331'


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, allow_nan=False).encode()).hexdigest()


def identity(config, expected):
    if tuple(config.get(k) for k in ['isin','symbol','mic','currency','field','consumerScope']) != expected:
        raise ValueError('Unqualified history unit repair identity')


def wood_quotes(config, daily, monthly, now, fetch=get_json):
    if not config.get('historicalQuoteRepairSource'):
        return daily, monthly, None, {}
    identity(config, ('IE00B27YCF74','WOOD.SW','XSWX','USD','adjclose','catalog'))
    if config['historicalQuoteRepairSource'] != SIX_PRICES:
        raise ValueError('Unqualified exchange quote source')
    ref, prices = fetch(SIX_ID), fetch(SIX_PRICES)
    if (ref.get('colNames') != ['ISIN','ValorSymbol','TradingBaseCurrency']
            or ref.get('rowData') != [['IE00B27YCF74','WOOD','USD']]
            or ref.get('totalRows') != 1):
        raise ValueError('SIX exact listing/currency not confirmed')
    valors=prices.get('valors',[])
    if len(valors)!=1 or valors[0].get('ValorId')!='IE00B27YCF74USD4' or prices.get('nettingMinutes')!=1440:
        raise ValueError('Wrong SIX historical listing or frequency')
    rows=valors[0]['data']; dates=rows['Date']; closes=rows['Close']
    if len(dates)!=len(closes) or dates!=sorted(set(dates)):
        raise ValueError('Invalid SIX historical dates')
    official={dt.datetime.strptime(str(d),'%Y%m%d').date():v for d,v in zip(dates,closes)}
    if any(isinstance(v,bool) or not isinstance(v,(int,float)) or not math.isfinite(v) or v<=0 for v in closes):
        raise ValueError('Invalid SIX historical close')
    incident=[dt.date(2026,2,d) for d in [25,26,27]]
    if not set(incident+[dt.date(2026,2,24),dt.date(2026,3,31)])<=official.keys():
        raise ValueError('Missing SIX incident or surrounding session')
    provider={d:(c,a)for d,c,a in daily}
    if not set(incident+[dt.date(2026,2,24),dt.date(2026,3,31)])<=provider.keys():
        raise ValueError('Missing Yahoo incident or surrounding session')
    # No dividend/split may be silently imported into the price replacement.
    factors=[provider[d][1]/provider[d][0] for d in incident+[dt.date(2026,2,24),dt.date(2026,3,31)]]
    if any(not math.isclose(f,factors[0],rel_tol=1e-6) for f in factors):
        raise ValueError('Yahoo income adjustment changes across the isolated quote error')
    for d in [dt.date(2026,2,24),dt.date(2026,3,31)]:
        if not math.isclose(provider[d][0],official[d],rel_tol=1e-7):
            raise ValueError('SIX/Yahoo surrounding listing quotes differ')
    checks=[]
    def replacement(d,c,a):
        target=official[d]
        if math.isclose(c,target,rel_tol=1e-7):return c,a
        if not math.isclose(c/100,target,rel_tol=1e-7):
            raise ValueError('Unexplained SIX/Yahoo incident quote difference')
        # Use the observed exchange close, not a guessed decimal shift.
        checks.append(dict(date=d.isoformat(),providerClose=c,providerAdjusted=a,
                           officialClose=target,value=target*(a/c),factor=a/c))
        return target,target*(a/c)
    fixed=[(d,*replacement(d,c,a))if d in incident else(d,c,a)for d,c,a in daily]
    checked_monthly=[];monthly_checks=[]
    for d,c,a in monthly:
        if d.strftime('%Y-%m')=='2026-02':
            target=official[incident[-1]]
            if not (math.isclose(c,target,rel_tol=1e-7)or math.isclose(c/100,target,rel_tol=1e-7)):
                raise ValueError('Unexplained SIX/Yahoo monthly quote difference')
            monthly_checks.append(dict(date=d.isoformat(),sourceSession=incident[-1].isoformat(),providerClose=c,officialClose=target,changed=not math.isclose(c,target,rel_tol=1e-7)))
            checked_monthly.append((d,target,target))
        else:checked_monthly.append((d,c,a))
    proof=dict(isin=config['isin'],symbol=config['symbol'],currency='USD',mic='XSWX',
               checkedAt=now.date().isoformat(),sourceUrls=[SIX_ID,SIX_PRICES],
               identitySha256=digest(ref),pricesSha256=digest(prices),checks=checks,monthlyChecks=monthly_checks,
               status='repaired'if checks or any(c['changed']for c in monthly_checks) else'already-correct',
               cause='Yahoo quotes are 100 times the official same-listing SIX closes on 25–27 February 2026; no corporate action inferred',
               scope='Monthly sampled prices only; additional Yahoo daily scale errors through 16 March are retained in raw captures and are not qualified daily history',
               method='Official exchange close replacement; unchanged provider adjusted/close factor independently checked on surrounding sessions')
    return fixed,checked_monthly,proof,{'sixIdentity':ref,'sixPrices':prices}


def bnke_split(config, result, now, fetch_notice=None, fetch_nav=None):
    if not config.get('splitAdjustmentNotice'):
        return result
    identity(config, ('LU1829219390','BNKE.PA','XPAR','EUR','adjclose','catalog'))
    if config['splitAdjustmentNotice'] != BNKE_NOTICE:
        raise ValueError('Unqualified split adjustment notice')
    from bs4 import BeautifulSoup
    from collect_amundi_etf import fetch_api, API
    from amundi_nav_history import request_payload
    body=(fetch_notice or download)(BNKE_NOTICE)
    # Page title, JSON-LD metadata and footer name another fund. Qualify the body.
    soup=BeautifulSoup(body,'html.parser')
    for tag in soup(['script','style']):tag.decompose()
    text=' '.join(soup.get_text(' ',strip=True).split())
    required=['AMUNDI EURO STOXX BANKS UCITS ETF ACC','ISIN: LU1829219390',
              '79 new shares for each one share held','80 shares','an eightieth',
              '27 October 2026','no share identification codes']
    if (any(s not in text for s in required) or not re.search(r'factor 1\s*:\s*80',text)
            or not re.search(r'Ex-Date\s+27 October 2026\s+Effective Date of the Split\s+27 October 2026',text)
            or not re.search(r'Luxembourg, September 25\s*th\s*, 2026',text)):
        raise ValueError('Official BNKE split identity, ratio, date or continuity changed')
    exdate='2026-10-27'
    if now.date().isoformat()<exdate:raise ValueError('Future BNKE split')
    request=request_payload({**config,'navCurrency':'EUR'},now)
    nav=(fetch_nav or fetch_api)(request)
    products=nav.get('products',[])
    if len(products)!=1 or products[0].get('productId')!=config['isin']:
        raise ValueError('Wrong Amundi split corroboration share')
    p=products[0];facts=p['characteristics']
    if (facts.get('ISIN')!=config['isin'] or facts.get('CURRENCY')!='EUR'
            or facts.get('DISTRIBUTION_POLICY')!='Capitalisation' or p['currencies']['CURRENCY']!='EUR'):
        raise ValueError('Amundi split corroboration currency/income mismatch')
    histories={h['indicator']:{dt.datetime.fromtimestamp(r['date']/1000,dt.timezone.utc).date().isoformat():r['data'] for r in h['historicalData']}for h in p['historics']}
    raw=histories['officialNav'];adjusted=histories['countervalorisedAdjustedNAV'];currencies=histories['navCurrency']
    common=sorted(raw.keys()&adjusted.keys());anchor=common[-1]
    if anchor<exdate or currencies[anchor]!='EUR':raise ValueError('No post-split official scale anchor')
    scale=raw[anchor]/adjusted[anchor]
    if not math.isclose(scale,1/80,rel_tol=1e-7):raise ValueError('Official split scale not corroborated')
    # This 2% check separates quote/NAV market differences from factors 80/1.
    # It is solely an explicit units test, never a return reconciliation tolerance.
    def unit_factor(value,target):
        candidates=[f for f in [1,80] if math.isclose(value/f,target,rel_tol=.02)]
        if len(candidates)!=1:raise ValueError('BNKE quote/NAV units unconfirmed')
        return candidates[0]
    checks=[];unverified=[];out=copy.deepcopy(result)
    point_map=dict(out['points']);anniversary=dict(out['anniversaryPoints'])
    for row in out['proofRows']:
        day=row['date'];month=day[:7]
        if day not in raw or day not in adjusted or currencies.get(day)!='EUR':
            unverified.append(month);continue
        target=adjusted[day]*scale
        provider_value=row.get('providerValue',row['value'])
        divisor=unit_factor(provider_value,target)
        # A factor is authorized only before the official ex-date.
        if day>=exdate and divisor!=1:raise ValueError('Post-split BNKE units disagree')
        if day<exdate and not math.isclose(raw[day]/80,target,rel_tol=1e-7):
            raise ValueError('Official pre-split income/units not reconciled')
        if day>=exdate and not math.isclose(raw[day],target,rel_tol=1e-7):
            raise ValueError('Official post-split income/units not reconciled')
        quoted_factor=unit_factor(raw[day],row['close']) if day<exdate else 1
        # Yahoo close may itself become split-adjusted on a future collection.
        quoted=row['close']*quoted_factor
        if not math.isclose(quoted,raw[day],rel_tol=.02):raise ValueError('Historical BNKE quoted-price units unconfirmed')
        original=provider_value;row['providerValue']=original;row['providerClose']=row['close']
        row['value']=original/divisor;row['anniversaryValue']=quoted
        point_map[month]=math.floor(row['value']*10**config['precision']+.5)/10**config['precision']
        anniversary[month]=math.floor(quoted*10**config['precision']+.5)/10**config['precision']
        checks.append(dict(date=day,providerValue=original,divisor=divisor,normalisedValue=row['value'],
                           officialAdjustedNav=target,officialRawNav=raw[day],providerClose=row['close'],
                           historicalClose=quoted,historicalMultiplier=quoted_factor))
    # The issuer does not certify the predecessor before this share's inception.
    # Keep the observations, but withhold those windows rather than invent a link.
    if unverified:
        out['historyExcludedMonths']=sorted(set(out.get('historyExcludedMonths',[])+unverified))
        out['historyExclusionReasons']={**out.get('historyExclusionReasons',{}),**{m:'BNKE.PA : unités historiques non corroborées par Amundi pour '+m+' ; continuité du prédécesseur non qualifiée.'for m in unverified}}
    # Existing deployed consumers understand this month-level restriction.
    # Carry it in data too, so a validated-data/fallback publication cannot
    # reintroduce the false anniversary loss on an older code snapshot.
    split_months=[c['date'][:7]for c in checks if c['date']<exdate]
    out['anniversaryPriceUnitExclusions']=split_months
    out['anniversaryExcludedMonths']=sorted(set(out.get('anniversaryExcludedMonths',[])+split_months))
    out['points']=[[m,point_map[m]]for m,_ in out['points']]
    out['anniversaryPoints']=[[m,anniversary[m]]for m,_ in out['anniversaryPoints']]
    out['splitAdjustmentEvidence']=dict(isin=config['isin'],symbol='BNKE.PA',mic='XPAR',currency='EUR',
        sourceUrl=BNKE_NOTICE,sha256=hashlib.sha256(body).hexdigest(),checkedAt=now.date().isoformat(),
        exDate=exdate,noticeDate='2026-09-25',ratio=80,navSourceUrl=API,navSha256=digest(nav),
        scaleAnchor=anchor,scaleFactor=scale,checks=checks,unverifiedMonths=unverified,
        method='Official exact-share split and independent issuer NAV scale; each monthly price checked; raw historical quote kept separately')
    out['sourceUrls']=list(dict.fromkeys(out['sourceUrls']+[BNKE_NOTICE,API]))
    out['rawResponse']['splitUnitCorroboration']={'noticeSha256':hashlib.sha256(body).hexdigest(),'request':request,'nav':nav,'noticeHtml':body.decode('utf-8')}
    return out


def withhold_isolated_scale_points(result):
    """Investigation guard, NOT an error finding or a guessed price correction.

    A tenfold reversal on both sides withholds only the sampled observation.
    Ordinary large moves (including the real crashes/rallies in the audit) stay
    untouched. A primary-source repair runs before this guard, never after it.
    """
    points=result['points'];suspects=[]
    for before,point,after in zip(points,points[1:],points[2:]):
        a,b=point[1]/before[1],point[1]/after[1]
        if (a>10 and b>10)or(a<.1 and b<.1):suspects.append(point[0])
    if not suspects:return result
    result=copy.deepcopy(result)
    result['historyExcludedMonths']=sorted(set(result.get('historyExcludedMonths',[])+suspects))
    result['historyExclusionReasons']={**result.get('historyExclusionReasons',{}),**{
        m:'Point mensuel '+m+' : rupture d’échelle isolée potentielle (facteur supérieur à 10 sur les deux côtés), sans preuve financière indépendante ; observation conservée, fenêtres utilisant ce mois refusées.'for m in suspects}}
    result['scaleInvestigation']={'months':suspects,'status':'unconfirmed','automaticDetection':True,
        'financialValidation':False,'method':'Two-sided factor >10; no interpolation, clipping or numerical repair'}
    return result
