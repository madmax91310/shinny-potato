"""Exact product validation for physical ETCs; ETF validation must stay strict."""
import copy,datetime as dt,json,pathlib,unittest
from collect_etf_pilot import parse_share
ROOT=pathlib.Path(__file__).resolve().parents[1]
class PhysicalEtc(unittest.TestCase):
 def setUp(self):
  self.body=json.loads((ROOT/'scripts/fixtures/ishares-physical-platinum.json').read_text())
  self.config=next(x for x in json.loads((ROOT/'scripts/additional-etf-sources.json').read_text())['instruments'] if x['isin']=='IE00B4LHWP62')
  self.now=dt.datetime(2026,10,13,tzinfo=dt.timezone.utc)
 def test_physical_structure_and_calendar(self):
  r=parse_share(self.body,self.config,self.now)
  self.assertEqual(r['distribution'],'No Income');self.assertIsNone(r['index'])
  self.assertEqual(r['aum']['scope'],'fund');self.assertEqual(r['performance']['currency'],'USD')
  self.assertEqual(r['performance']['years']['2025'],121.33)
 def test_identity_currency_structure_and_policy_fail_closed(self):
  for field,value in [('isin','IE00B4556L06'),('baseCurrencyCode','EUR'),('productStructure','Synthetic'),('ucitsCompliantFlag','Yes'),('useOfProfitsCode','Accumulating')]:
   b=copy.deepcopy(self.body);b['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap'][field]['value']=value
   with self.subTest(field=field),self.assertRaises(ValueError):parse_share(b,self.config,self.now)
 def test_no_implicit_etf_fallback(self):
  c={**self.config};c.pop('physicalMetal');c.pop('currencyField')
  with self.assertRaises((KeyError,ValueError)):parse_share(self.body,c,self.now)
if __name__=='__main__':unittest.main()
