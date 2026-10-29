import copy,unittest
from holdings_reconciliation import reconcile_positions
import test_dca_complete_realestate as fixtures

class NavReconciliation(unittest.TestCase):
 def fixture(self):
  body=fixtures.CompleteRealEstate().body();p=body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
  extra={'isin':None,'issueName':'EUR hedge','holdingPercent':-.8,'assetClass':'Forwards','countryOfRisk':'-','sectorName':'-', 'ticker':'USD/EUR','marketCurrencyCode':'EUR','exchange':'-'}
  p['holdingPercent']['value']=[60.8,40]
  for key,value in extra.items():p[key]['value'].append(value)
  return body
 def test_accounting_evidence_does_not_relax_existing_excess_guard(self):
  b=self.fixture()
  with self.assertRaisesRegex(ValueError,r'100\.800000.*100\.5.*net NAV 100\.000000.*Forwards'):
   fixtures.CompleteRealEstate().parse(b)
 def test_signed_excluded_perimeter_and_unknown_security_remain_distinct(self):
  b=self.fixture();p=b['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
  values={
   'isin':['US0378331005','US5949181045',*[f'US00000000{i:02d}'for i in range(10)],None,None],
   'issueName':[f'Company {i}'for i in range(12)]+['Unlisted CVR','Cash'],
   'holdingPercent':[60,29.6997,*([1]*10),.0003,.3],
   'assetClass':['Equity']*13+['Cash']}
  for key in list(p):
   if key=='asOfDate':continue
   p[key]['value']=values.get(key,[p[key]['value'][0]]*14)
  h,_=fixtures.CompleteRealEstate().parse(b);proof=h['navReconciliation']
  self.assertEqual(h['rows'][-1]['isin'],None);self.assertEqual(proof['selectedWeightPct'],99.7)
  self.assertEqual(proof['excludedWeightPctByType'],{'Cash':.3});self.assertEqual(proof['sourceRowCount'],14)
  self.assertEqual(proof['unidentifiedPositions'][0]['name'],'Unlisted CVR');self.assertFalse(proof['normalizationApplied'])
  self.assertAlmostEqual(proof['publishedNetWeightPct'],100)
 def test_truncated_misaligned_and_non_finite_accounting_are_refused(self):
  positions=[{'name':'A','isin':'US0378331005','assetClass':'Equity','weightPct':99.3},{'name':'cash','assetClass':'Cash','weightPct':.7}]
  for selected in [[0,0],[2],[],[True]]:
   with self.subTest(selected=selected),self.assertRaises(ValueError):reconcile_positions(positions,selected,'2026-10-28')
  for value in [float('nan'),True,40]:
   bad=copy.deepcopy(positions);bad[0]['weightPct']=value
   with self.subTest(value=value),self.assertRaises(ValueError):reconcile_positions(bad,[0],'2026-10-28')

if __name__=='__main__':unittest.main()
