"""Visible annual statements from Stock Analysis / S&P Global as a dated fallback.

Only visible table cells are used. TTM columns and locked cells are excluded;
annual EPS are never relabelled as analyst estimates or trailing EPS.
"""
import datetime as dt
import hashlib
import math
import re
from bs4 import BeautifulSoup
from company_publications import get
from company_decision import DECISION_VERSION, FCF_METHOD


def table(raw, profile, today):
    soup=BeautifulSoup(raw,'html.parser')
    if not soup.title or f"({profile['symbol']})" not in soup.title.get_text():
        raise ValueError('Financial statement identity mismatch')
    text=soup.get_text(' ',strip=True)
    if profile['currency']!='USD' or 'Financials in millions USD' not in text:
        raise ValueError('Financial statement units/currency missing')
    updated=re.search(r'Last updated: ([A-Za-z]+ \d{1,2}, \d{4})',text)
    if not updated:raise ValueError('Statement source date missing')
    date=dt.datetime.strptime(updated[1],'%b %d, %Y').date()
    if not 0<=(today-date).days<=200:raise ValueError('Statement source stale or future dated')
    output={}
    for t in soup.select('table'):
        rows={}
        for tr in t.select('tr'):
            cells=[c.get_text(' ',strip=True) for c in tr.find_all(['th','td'],recursive=False)]
            if not cells:continue
            if cells[0] in rows:raise ValueError('Duplicate statement row')
            rows[cells[0]]=cells[1:]
        if 'Fiscal Year' not in rows or 'Period Ending' not in rows:continue
        labels=rows['Fiscal Year'];dates=rows['Period Ending']
        if len(labels)!=len(dates):raise ValueError('Fiscal date alignment')
        for i,label in enumerate(labels):
            if not re.fullmatch(r'FY 20\d\d',label):continue
            match=re.search(r'([A-Za-z]{3} \d{1,2}, 20\d{2})$',dates[i])
            if not match:raise ValueError('Fiscal date missing')
            end=dt.datetime.strptime(match[1],'%b %d, %Y').date().isoformat()
            if end>today.isoformat():raise ValueError('Future annual account')
            record=output.setdefault(end,{})
            for key,values in rows.items():
                if key in ('Fiscal Year','Period Ending'):continue
                if len(values)!=len(labels):raise ValueError('Misaligned financial row')
                val=values[i].replace(',','').replace('−','-')
                if not re.fullmatch(r'-?\d+(?:\.\d+)?',val):continue
                value=float(val)
                if not math.isfinite(value):raise ValueError('Invalid financial number')
                if key in record and record[key]!=value:raise ValueError('Conflicting financial cells')
                record[key]=value
    if len(output)<4:raise ValueError('Four visible annual statements required')
    return output,date.isoformat(),hashlib.sha256(raw).hexdigest()


def collect(profile,today,load=get):
    base=f"https://stockanalysis.com/stocks/{profile['symbol'].lower()}/financials/"
    income_url=base+'income-statement/';cash_url=base+'cash-flow-statement/'
    income,asof,ihash=table(load(income_url),profile,today)
    cash,cash_asof,chash=table(load(cash_url),profile,today)
    if set(income)!=set(cash):raise ValueError('Cash and income fiscal years differ')
    years=[]
    for end in sorted(income):
        inc=income[end];flow=cash[end]
        for key in ('Revenue','Net Income','EPS (Diluted)','Shares Outstanding (Diluted)'):
            if key not in inc:raise ValueError('Missing required income field: '+key)
        for key in ('Operating Cash Flow','Capital Expenditures','Free Cash Flow','Net Income'):
            if key not in flow:raise ValueError('Missing required cash field: '+key)
        if inc['Net Income']!=flow['Net Income']:raise ValueError('Income/cash profit disagreement')
        if inc['Revenue']<=0 or inc['Shares Outstanding (Diluted)']<=0 or flow['Capital Expenditures']>0:
            raise ValueError('Unsupported financial signs')
        shares=inc['Shares Outstanding (Diluted)']*1e6
        common=inc.get('Net Income to Common',inc['Net Income'])*1e6
        # Displayed counts are rounded to millions; EPS reconciliation uses
        # an explicit rounding allowance rather than deriving an invented count.
        expected=inc['EPS (Diluted)']*shares
        tolerance=max(2e6,abs(common)*.02)
        if abs(expected-common)>tolerance:raise ValueError('Diluted shares/EPS do not reconcile')
        ocf=flow['Operating Cash Flow']*1e6;capex=-flow['Capital Expenditures']*1e6;fcf=ocf-capex
        if abs(fcf-flow['Free Cash Flow']*1e6)>2e6:raise ValueError('FCF does not reconcile with operations/investments')
        year={'end':end,'revenue':inc['Revenue']*1e6,'netIncome':inc['Net Income']*1e6,
              'dilutedEPS':inc['EPS (Diluted)'],'averageDilutedShares':shares,'sharesBasisSource':income_url,
              'operatingCashFlow':ocf,'capitalExpenditure':capex,'freeCashFlow':fcf,'freeCashFlowDefinition':FCF_METHOD,
              'sourceUrl':income_url,'additionalSourceUrls':[cash_url],
              'sourceName':'Stock Analysis / S&P Global Market Intelligence',
              'sourceAsOf':min(asof,cash_asof),'sourcePrecision':'Monetary amounts and diluted counts rounded to displayed millions'}
        for key,label in [('operatingIncome','Operating Income'),('dividendPerShare','Dividend Per Share')]:
            if label in inc:year[key]=inc[label]*(1 if key=='dividendPerShare' else 1e6)
        for key,label in [('shareBasedCompensation','Stock-Based Compensation'),('dividendsPaid','Common Dividends Paid'),('shareRepurchases','Repurchase of Common Stock')]:
            if label in flow:year[key]=abs(flow[label])*1e6
        years.append(year)
    from refresh_company_analysis import validate_history,growth
    validate_history(years,today)
    if (today-dt.date.fromisoformat(years[-1]['end'])).days>550:raise ValueError('Annual accounts stale')
    annual={**years[-1],'durationMonths':12,'previousEnd':years[-2]['end']}
    for key in ('revenue','netIncome','dilutedEPS'):
        annual['previous'+key[0].upper()+key[1:]]=years[-2][key]
    annual['revenueGrowth']=growth(annual['revenue'],annual['previousRevenue'])
    annual['incomeGrowth']=growth(annual['netIncome'],annual['previousNetIncome'])
    return {'annual':annual,'quarter':None,'history':years,'sourceUrl':income_url,
            'decision':{'observedAt':today.isoformat(),'annualEnd':annual['end'],'accountsEndAtCollection':annual['end'],
                        'years':years,'sourceUrl':income_url,'method':FCF_METHOD,'componentVersion':DECISION_VERSION},
            'provenance':{'provider':'Stock Analysis / S&P Global Market Intelligence','incomeUrl':income_url,'cashUrl':cash_url,
                          'sourceAsOf':min(asof,cash_asof),'incomeHash':ihash,'cashHash':chash,'observedAt':today.isoformat()}}
