import copy,datetime as dt,gzip,json,unittest
from pathlib import Path
from amundi_nav_history import parse,anniversary_price_history
ROOT=Path(__file__).resolve().parents[1];NOW=dt.datetime(2026,10,26,12,tzinfo=dt.timezone.utc)
class AmundiAnniversaryPrices(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  folder=ROOT/'reports/donnees-consolidees-2026-10-24/preuves/reprise-20261026/anniversary-price-final-sources'
  cls.body=json.loads(gzip.decompress(next(folder.glob('*.json.gz')).read_bytes()))
  cls.source=next(s for s in json.loads((ROOT/'scripts/official-nav-remainder-sources.json').read_text())if s['id']=='etfFR0007054358Nav')
 def prices(self,body):
  nav,_,_=parse(body,self.source,NOW);prices,proof=anniversary_price_history(body,self.source,NOW,nav);return nav,prices,proof
 def test_historical_cash_is_removed_from_price_only_but_not_performance(self):
  nav,prices,proof=self.prices(self.body)
  self.assertAlmostEqual(prices['2019-10-25'],35.1802,places=4)
  self.assertGreater(prices['2019-10-25']-nav['2019-10-25'],.9)
  self.assertAlmostEqual(prices['2025-10-23'],nav['2025-10-23'],places=5)
  self.assertEqual(prices[max(prices)],nav[max(nav)])
  self.assertEqual(set(proof['anniversaryCashChecks']),set(self.source['anniversaryCashDates']))
 def test_unit_adjustments_are_retained_without_adding_cash_twice(self):
  _,original,_=self.prices(self.body);b=copy.deepcopy(self.body)
  for h in b['products'][0]['historics']:
   if h['indicator']=='officialNav':
    for r in h['historicalData']:
     day=dt.datetime.fromtimestamp(r['date']/1000,dt.timezone.utc).date().isoformat()
     if day>='2025-11-01':r['data']/=200
  _,prices,_=self.prices(b)
  self.assertAlmostEqual(prices['2019-10-25'],original['2019-10-25']/200,places=6)
  self.assertAlmostEqual(prices[max(prices)],original[max(original)]/200,places=6)
 def test_omitted_known_cash_and_wrong_cash_amount_stay_refused(self):
  for defect in ['missing','amount']:
   b=copy.deepcopy(self.body);h=next(h for h in b['products'][0]['historics']if h['indicator']=='dividendAmount')
   if defect=='missing':h['historicalData'].pop()
   else:h['historicalData'][-1]['data']*=2
   with self.subTest(defect=defect),self.assertRaises(ValueError):self.prices(b)
 def test_future_announced_cash_does_not_change_observed_prices(self):
  _,original,_=self.prices(self.body);b=copy.deepcopy(self.body);day='2026-10-30';stamp=dt.datetime.fromisoformat(day+'T00:00:00+00:00').timestamp()*1000
  for h in b['products'][0]['historics']:
   if h['indicator']in ['dividendAmount','dividendCurrency']:h['historicalData'].append({'date':stamp,'data':.5 if h['indicator']=='dividendAmount'else'EUR'})
  _,prices,proof=self.prices(b)
  self.assertEqual(prices,original);self.assertEqual(proof['anniversaryDeferredCashDates'],[day])
if __name__=='__main__':unittest.main()
