"""Qualify the issuer's income-adjusted series, never add cash to that series."""
import datetime as dt
import math
import re
from issuer_nav_history import calendar_checks


def qualify(body, parsed, source, now):
    if source.get('navHistoryKind') != 'official-income-reinvested-index':
        raise ValueError('Explicit official income-series convention required')
    nav, total = parsed['nav'], parsed['totalReturn']
    income = parsed['distribution']
    if income not in {'Distributing', 'No Income'}:
        raise ValueError('Unqualified income treatment for this adapter')
    checks = calendar_checks(total, parsed['years'], 2, now)
    cash_checks = []
    if income == 'Distributing':
        table = body['componentsByNameMap']['performance']['containersByNameMap']['distributions']['subContainersByNameMap']['table']['dataPointsByNameMap']
        dates, amounts, currencies = (table['exDate']['value'], table['totalDistribution']['value'], table['totalDistribution']['prefix'])
        if len({len(dates),len(amounts),len(currencies)}) != 1 or len(set(dates)) != len(dates):
            raise ValueError('Ambiguous official cash columns')
        years=set(source['distributionValidationYears']);observed_years=set()
        for date, amount, currency in zip(dates, amounts, currencies):
            day=dt.datetime.strptime(str(date),'%Y%m%d').date().isoformat()
            if int(day[:4]) not in years:continue
            if currency.strip()!=source['navCurrency'] or isinstance(amount,bool) or not re.fullmatch(r'[0-9]+(?:\.[0-9]+)?',str(amount)):
                raise ValueError('Unqualified official dividend currency/amount')
            amount=float(amount)
            if not math.isfinite(amount) or amount<=0:raise ValueError('Invalid official dividend amount')
            previous=sorted(d for d in nav.keys() & total.keys() if d<day)
            following=sorted(d for d in nav.keys() & total.keys() if d>=day)
            if not previous or day not in nav or not following:
                raise ValueError('Missing official ex-date NAV or bounded return observation')
            before,after=previous[-1],following[0]
            if (dt.date.fromisoformat(after)-dt.date.fromisoformat(before)).days>4:
                raise ValueError('Official cash interval has missing valuations')
            other_cash=[dt.datetime.strptime(str(d),'%Y%m%d').date().isoformat()for d in dates]
            if sum(before<d<=after for d in other_cash)!=1:
                raise ValueError('Several cash events in the bounded interval')
            # An isolated missing TR date is never interpolated. The observed
            # NAV/TR factors on both sides still check the one published cash event.
            observed=(total[after]/nav[after])/(total[before]/nav[before])
            if not 0<amount<nav[before]:raise ValueError('Cash/share units not qualified')
            expected=1/(1-amount/nav[before])
            # Numerical representation check of the published NAV/TR adjustment,
            # not a market/NAV alert threshold. Never patch the issuer's levels.
            if not math.isclose(observed,expected,rel_tol=1e-6,abs_tol=1e-8):
                raise ValueError('Official cash adjustment not reconciled: '+day)
            observed_years.add(int(day[:4]))
            cash_checks.append({'exDate':day,'previousSession':before,'amount':amount,'currency':currency.strip(),
                                'previousNav':nav[before],'exDateNav':nav[day],'returnObservationDate':after,'missingReturnOnExDate':day not in total,
                                'observedIncomeFactor':observed,'publishedCashBackAdjustmentFactor':expected,
                                'difference':observed-expected,'cashAddedByApplication':False})
        if observed_years!=years:
            raise ValueError('Requested dividend-validation year not covered')
    else:
        # No Income is an explicit issuer state, not an inference from the name.
        calendar_checks(nav,parsed['years'],2,now)
    # A monthly consumer needs the real month-end observation, not every daily
    # value. Extra issuer NAV rows are accepted only when the NAV is identical
    # through the end of that month; their dates never move the TR observation.
    monthly_checks=[]
    final=lambda points:{d[:7]:d for d in sorted(points)if source['periodStart']<=d[:7]<now.strftime('%Y-%m')}
    nav_ends,return_ends=final(nav),final(total)
    if nav_ends.keys()!=return_ends.keys():raise ValueError('Missing official monthly end')
    for month,nend in nav_ends.items():
        tend=return_ends[month]
        if nend!=tend:
            tail=[d for d in nav if tend<=d<=nend]
            if tend not in nav or nend<tend or (dt.date.fromisoformat(nend)-dt.date.fromisoformat(tend)).days>4 or any(nav[d]!=nav[tend]for d in tail):
                raise ValueError('Monthly NAV/return end not independently qualified: '+month)
            monthly_checks.append({'month':month,'returnAsOf':tend,'lastNavAsOf':nend,'unchangedNav':nav[tend],
                                   'qualification':'Published NAV unchanged through month end; TR date and values not extended'})
    anchor=max(nav.keys() & total.keys())
    if max(total)>anchor:
        raise ValueError('Income index newer than the available exact-share NAV anchor')
    factor=nav[anchor]/total[anchor]
    normalized={day:value*factor for day,value in total.items() if day<=anchor}
    normalized[anchor]=nav[anchor]
    # Check the units of every monthly NAV used by the price-only anniversary
    # channel against the issuer income index and all published cash events.
    # No Income disagreement makes the performance point ambiguous as well.
    all_cash={}
    if income=='Distributing':
        for date,amount,currency in zip(dates,amounts,currencies):
            ex=dt.datetime.strptime(str(date),'%Y%m%d').date().isoformat()
            if not source['periodStart']<=ex[:7] or ex>anchor:continue
            if currency.strip()!=source['navCurrency'] or not re.fullmatch(r'[0-9]+(?:\.[0-9]+)?',str(amount)):
                raise ValueError('Historical monthly cash units not qualified')
            previous=max(d for d in nav if d<ex)
            value=float(amount)
            if not 0<=value<nav[previous]:raise ValueError('Historical cash/share units invalid')
            all_cash[ex]=1/(1-value/nav[previous])
    unit_checks=[];blocked=[]
    anchor_ratio=total[anchor]/nav[anchor]
    for month,tend in return_ends.items():
        observed=total[tend]/nav[tend]
        expected=anchor_ratio/math.prod(f for ex,f in all_cash.items()if tend<ex<=anchor)
        qualified=math.isclose(observed,expected,rel_tol=1e-6,abs_tol=1e-8)
        if not qualified:blocked.append(month)
        unit_checks.append({'month':month,'returnAsOf':tend,'publishedNav':nav[tend],
                            'publishedIncomeIndex':total[tend],'observedRatio':observed,
                            'expectedRatioAfterPublishedCash':expected,'qualified':qualified})
    return normalized, {'incomeTreatment':income,'returnSourceComponent':'performance.chart.performanceData',
                        'officialIncomeReinvestedChartChecks':checks,'officialDistributionFactorChecks':cash_checks,'monthEndDateChecks':monthly_checks,
                        'monthlyShareUnitChecks':unit_checks,'historyExcludedMonths':blocked if income=='No Income'else[],
                        'anniversaryExcludedMonths':blocked if income=='Distributing'else[],
                        'dailyContinuity':'Published gaps preserved; this adapter qualifies monthly/annual consumers and the latest same-date level, not an arbitrary daily purchase date',
                        'scaleProof':{'anchorDate':anchor,'officialPerShareNav':nav[anchor],'sourceIncomeIndex':total[anchor],'factor':factor},
                        'controlledInstrument':source['isin'],
                        'controlledFields':['isin','performance.chart.currencySymbol','performance.returns.annualNavCurrency',
                                            'performance.chart.navData','performance.chart.performanceData','performance.returns.annualNav']+
                                           (['performance.distributions.exDate','performance.distributions.totalDistribution']if income=='Distributing'else['useOfProfitsCode']),
                        'requestedStart':source['periodStart']+'-01','controlledCalendarYears':sorted(parsed['years'])}
