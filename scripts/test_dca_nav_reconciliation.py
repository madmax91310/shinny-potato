import copy,unittest,gzip,json,hashlib,datetime as dt
from pathlib import Path
from collect_dca_complete_holdings import parse_complete, collect_blackrock_complete
from holdings_reconciliation import HoldingsPerimeterError
from holdings_reconciliation import reconcile_positions
import test_dca_complete_realestate as fixtures

class NavReconciliation(unittest.TestCase):
 def test_real_issuer_bodies_preserve_unknown_rights_and_signed_accounting(self):
  root=Path(__file__).resolve().parents[1]/'reports/priority-compositions-2026-10-29'
  probes=json.loads((root/'blackrock-probes.json').read_text())
  for probe in probes:
   with self.subTest(isin=probe['isin']):
    raw=gzip.decompress((root/'source-bodies'/(probe['isin']+'.json.gz')).read_bytes())
    self.assertEqual(hashlib.sha256(raw).hexdigest(),probe['sha256'])
    body=json.loads(raw)
    if probe['isin']=='IE00B441G979':
     with self.assertRaisesRegex(ValueError,r'100\.762180.*net NAV 100\.000010'):
      parse_complete(body,probe['isin'],probe['sourceUrl'],dt.datetime(2026,10,29,tzinfo=dt.timezone.utc))
     continue
    h,_=parse_complete(body,probe['isin'],probe['sourceUrl'],dt.datetime(2026,10,29,tzinfo=dt.timezone.utc))
    p=h['navReconciliation'];self.assertAlmostEqual(p['selectedWeightPct'],probe['classTotals']['Equity'])
    self.assertEqual(len(p['unidentifiedPositions']),len(probe['unknownEquity']))
    self.assertAlmostEqual(p['publishedNetWeightPct'],sum(probe['classTotals'].values()))
    self.assertFalse(p['normalizationApplied']);self.assertEqual(len(h['rows']),p['selectedRowCount'])
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
 def test_gross_net_diagnostic_binds_exact_source_hash_and_control_without_admission(self):
  b=self.fixture();raw=json.dumps(b);now=dt.datetime(2026,10,16,tzinfo=dt.timezone.utc)
  config={'isin':'IE00B0M63284','url':'https://www.blackrock.com/?portfolioId=251808','fundAssetClass':'Real Estate'}
  with self.assertRaises(HoldingsPerimeterError) as caught:
   collect_blackrock_complete(config,now,fetch=lambda *args:raw)
  d=caught.exception.diagnostic
  self.assertFalse(d['financialDataQualified']);self.assertEqual(d['subjectIsin'],config['isin'])
  self.assertEqual(d['asOf'],'2026-10-15');self.assertEqual(d['checkedAt'],now.isoformat())
  self.assertEqual(d['sha256'],hashlib.sha256(raw.encode()).hexdigest())
  self.assertAlmostEqual(d['navReconciliation']['selectedWeightPct'],100.8)
  self.assertEqual(d['navReconciliation']['excludedWeightPctByType'],{'Forwards':-.8})
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
