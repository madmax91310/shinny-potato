"""Independent Decimal reconciliation; imports no application/collector code."""
from decimal import Decimal, getcontext
import gzip
import json
from pathlib import Path
import sys
getcontext().prec=40
root=Path(__file__).resolve().parents[1]
old=json.loads(gzip.decompress((root/'scripts/fixtures/investment-units-20261106/before.json.gz').read_bytes()))
new=json.loads((root/'src/data/automated-etf-monthly.json').read_text())
D=lambda x:Decimal(str(x))

def calculate(points,start,mode):
    prices=[D(p)for m,p in points if start<=m<='2026-10']
    units=D(1000)/prices[0]if mode=='lump'else sum(D(1000)/p for p in prices)
    return units*prices[-1]

rows=[]
for id in old:
    for start in ['2020-01','2026-01','2026-02','2026-03']:
        for mode in ['lump','dca']:
            expected=[]
            for m,p in old[id]['points']:
                value=D(p)
                if id=='etfLU1829219390'and m<'2026-10':value/=D(80)
                if id=='etf_timber_ishares'and m=='2026-02':
                    # SIX's observed 26.66; preserve the provider's income factor.
                    q=D(dict(old[id]['anniversaryPoints'])[m]);value=D('26.66')*value/q
                expected.append([m,value])
            previous=calculate(old[id]['points'],start,mode)
            oracle=calculate(expected,start,mode);actual=calculate(new[id]['points'],start,mode)
            difference=actual-oracle
            # Source prices carry six decimals; accumulated DCA rounding differs
            # from the unrounded official-unit oracle. This bound is in euros/
            # dollars on 1000 per month, never a return qualification threshold.
            assert abs(difference)<D('.10'),(id,start,mode,difference)
            rows.append(dict(id=id,start=start,end='2026-10',mode=mode,amount='1000',before=str(previous),independent=str(oracle),publishedAfter=str(actual),roundingDifference=str(difference)))
# Separate valuation convention: issuer NAV is independent of exchange quotes.
body=json.loads(gzip.decompress((root/'scripts/fixtures/investment-units-20261106/bnke-official.json.gz').read_bytes()))
import datetime as dt
hist={h['indicator']:{dt.datetime.fromtimestamp(p['date']/1000,dt.timezone.utc).date().isoformat():D(p['data'])for p in h['historicalData']}for h in body['products'][0]['historics']if h['indicator']!='navCurrency'}
nav=D(1000)*hist['countervalorisedAdjustedNAV']['2026-10-30']/hist['countervalorisedAdjustedNAV']['2020-01-31']
report=dict(method='Independent Decimal cash/units arithmetic on immutable pre-fix observations plus officially proven units; no application or collector imports',results=rows,independentIssuerNav=dict(start='2020-01-31',end='2026-10-30',currency='EUR',finalValue=str(nav),note='NAV return, not an exchange price; source difference retained'))
if len(sys.argv)>1:Path(sys.argv[1]).write_text(json.dumps(report,indent=2)+'\n')
else:print(json.dumps(report,indent=2))
