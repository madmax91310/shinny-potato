import copy,datetime as dt,gzip,json,pathlib,unittest
from amundi_nav_history import parse,anniversary_price_history
from collect_official_share_history import configurations
ROOT=pathlib.Path(__file__).resolve().parents[1]
NOW=dt.datetime(2026,10,27,tzinfo=dt.timezone.utc)
class AmundiDistributingNav(unittest.TestCase):
 def setUp(self):
  self.body=json.loads(gzip.decompress((ROOT/'scripts/fixtures/amundi-distributing-nav/official-response.json.gz').read_bytes()))
  self.source=next(r for r in configurations()if r['id']=='etfLU1737652823Nav')
 def history(self,key):return next(h['historicalData']for h in self.body['products'][0]['historics']if h['indicator']==key)
 def test_exact_income_index_and_separate_cash_price_idempotence(self):
  nav,years,p=parse(self.body,self.source,NOW);price,pp=anniversary_price_history(self.body,self.source,NOW,nav)
  self.assertEqual(p['incomeTreatment'],'Distribution');self.assertEqual(len(p['incomeReinvestmentQualification']['cashChecks']),7)
  self.assertGreater(p['incomeReinvestmentQualification']['dailyUnitChecks'],1900)
  self.assertLess(p['incomeReinvestmentQualification']['maxRelativeUnitError'],1e-6)
  self.assertEqual(set(years),{str(y)for y in range(2020,2026)})
  for y in years:self.assertIn(int(y),{r['year']for r in p['officialIncomeReinvestedChartChecks']})
  self.assertEqual(parse(self.body,self.source,NOW)[0],nav)
  self.assertEqual(anniversary_price_history(self.body,self.source,NOW,nav)[0],price)
  self.assertEqual(price[max(price)],nav[max(nav)])
  self.assertNotAlmostEqual(price['2023-12-29'],nav['2023-12-29'])
 def test_distribution_without_explicit_qualification_is_still_refused(self):
  source={k:v for k,v in self.source.items()if k!='navHistoryKind'}
  with self.assertRaisesRegex(ValueError,'accumulating'):parse(self.body,source,NOW)
  for policy in ['Capitalisation','Capitalisation and/or distribution']:
   self.body['products'][0]['characteristics']['DISTRIBUTION_POLICY']=policy
   with self.assertRaisesRegex(ValueError,'explicit income'):parse(self.body,self.source,NOW)
 def test_missing_and_changed_cash_are_not_success(self):
  for key in ['dividendAmount','dividendCurrency']:
   body=copy.deepcopy(self.body);next(h for h in body['products'][0]['historics']if h['indicator']==key)['historicalData']=None
   with self.assertRaisesRegex(ValueError,key):parse(body,self.source,NOW)
  self.history('dividendAmount')[-2]['data']+=.1
  with self.assertRaisesRegex(ValueError,'cash date/factor'):parse(self.body,self.source,NOW)
 def test_known_cash_cannot_silently_disappear(self):
  for key in ['dividendAmount','dividendCurrency']:self.history(key).pop(-2)
  with self.assertRaisesRegex(ValueError,'Known historical'):parse(self.body,self.source,NOW)
 def test_unexplained_unit_change_is_refused(self):
  row=next(r for r in self.history('officialNav')if dt.datetime.fromtimestamp(r['date']/1000,dt.timezone.utc).date().isoformat()=='2024-02-29');row['data']*=1.01
  with self.assertRaisesRegex(ValueError,'units not corroborated'):parse(self.body,self.source,NOW)
 def test_historical_currency_and_launch_boundary_remain_strict(self):
  self.history('navCurrency')[100]['data']='USD'
  with self.assertRaisesRegex(ValueError,'currency'):parse(self.body,self.source,NOW)
  self.setUp()
  with self.assertRaisesRegex(ValueError,'before exact-share launch'):parse(self.body,self.source|{'periodStart':'2017-01'},NOW)
 def test_future_announced_cash_is_deferred_not_added(self):
  stamp=int(dt.datetime(2026,12,20,tzinfo=dt.timezone.utc).timestamp()*1000)
  for key,value in [('dividendAmount',1.5),('dividendCurrency','EUR')]:self.history(key).append({'date':stamp,'data':value})
  nav,years,proof=parse(self.body,self.source,NOW)
  self.assertIn('2026-12-20',proof['anniversaryDeferredCashDates'])
  self.assertEqual(len(proof['incomeReinvestmentQualification']['cashChecks']),7)
if __name__=='__main__':unittest.main()
