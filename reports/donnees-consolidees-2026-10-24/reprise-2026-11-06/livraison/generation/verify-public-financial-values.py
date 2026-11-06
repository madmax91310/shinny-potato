"""Compare the real browser's 16 results to Decimal math over exact published points."""
import pathlib,json,decimal,datetime,re,gzip
R=pathlib.Path('/tmp/automation-20261106/proofs');d=decimal.Decimal;decimal.getcontext().prec=40
records=json.load(gzip.open(R/'financial-public/automated-etf-monthly.json.gz','rt'));rows=json.load(open(R/'financial-calculator-public/results.json'));out=[]
assert len(rows)==16
for row in rows:
 state=row['state'];start=f"{state['startYear']:04d}-{state['startMonth']:02d}";series=records[state['assetId']];assert series['periodEnd']=='2026-10'
 p=[d(str(p))for month,p in series['points']if start<=month<='2026-10'];assert len(p)>0
 units=d(1000)/p[0]if state['mode']=='lump'else sum(d(1000)/x for x in p)
 expected=units*p[-1];shown=re.sub(r'[^0-9]','',row['value'])
 assert shown==str(expected.quantize(d(1),rounding=decimal.ROUND_HALF_UP)),(row['key'],shown,str(expected))
 assert row['pngSha256']==row['previewSha256']and not row['errors']
 out.append({'key':row['key'],'publishedPeriodEnd':series['periodEnd'],'shown':shown,'exactDecimal':str(expected),'integerRounding':'ROUND_HALF_UP','pngMatchesPreview':True})
json.dump({'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'publicBuild':json.load(open(R/'financial-public/context.json'))['build'],'importsApplicationCalculationCode':False,'cases':out},open(R/'financial-public/independent-calculator-check.json','w'),indent=2)
print('16 real public results match independent Decimal calculations on exact published observations.')
# Explicit February boundary exercises WOOD's repaired month and historical EUR conversion.
records.update(json.load(gzip.open(R/'financial-public/automated-monthly.json.gz','rt')))
fx=json.load(gzip.open(R/'financial-public/monthly-fx.json.gz','rt'))['months']
ranking=json.load(open(R/'financial-ranking-boundaries-public/results.json'));assert not ranking['errors']and len(ranking['results'])==4
labels={'etfLU1829219390':'Amundi Euro Stoxx Banks','etf_timber_ishares':'iShares Global Timber','apple':'Apple'};rr=[]
for row in ranking['results']:
 for id,label in labels.items():
  record=records[id];prices={m:d(str(p))for m,p in record['points']};currency=record['currency'];start,end=row['start'],row['end']
  rate=lambda month:d(str(fx[month]['rates'][currency]))
  p0,p1=prices[start]/rate(start),prices[end]/rate(end);expected=(p1/p0-1)*100
  line=next(l for l in row['text'].splitlines()if label in l);m=re.search(r'([+\-−]?\d+(?:,\d+)?)\s*%',line);assert m,line
  shown=d(m[1].replace('−','-').replace(',','.'));assert shown==expected.quantize(d('.01'),rounding=decimal.ROUND_HALF_UP),(id,start,shown,expected)
  rr.append({'browserCase':row['key'],'id':id,'start':start,'end':end,'nativeCurrency':currency,'outputCurrency':'EUR','ecbStart':str(rate(start)),'ecbEnd':str(rate(end)),'independentReturnPct':str(expected),'shownPct':str(shown),'matchesRoundedDecimal':True})
json.dump({'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'publicBuild':json.load(open(R/'financial-public/context.json'))['build'],'importsApplicationCalculationCode':False,'cases':rr},open(R/'financial-public/independent-ranking-check.json','w'),indent=2)
print('12 real public ranking values, including February WOOD, match independent Decimal and published ECB observations.')
