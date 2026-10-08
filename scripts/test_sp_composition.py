import datetime as dt
import json
import pathlib
import unittest
from collect_sp_composition import parse_composition, parse_legend
from data_automation import UTC
ROOT=pathlib.Path(__file__).resolve().parents[1]
class CompositionTests(unittest.TestCase):
 def fixture(self,euro):
  name='euro'if euro else'global-quality';root=ROOT/'scripts/fixtures/sp-composition'
  c=next(c for c in json.loads((ROOT/'scripts/index-automation.json').read_text())['indices']if c['id']==('sp-euro-dividend-aristocrats'if euro else'sp-global-dividend-aristocrats'))
  return (root/(name+'-2026-09-30.txt')).read_text(),(root/(name+'-legend.txt')).read_text(),c
 def test_primary_snapshots(self):
  for euro in [True,False]:
   text,legend,c=self.fixture(euro);facts=parse_composition(text,legend,legend,c,dt.datetime(2026,10,8,tzinfo=UTC))
   self.assertEqual(facts['asOf'],'2026-09-30');self.assertEqual(facts['constituents'],40 if euro else 90)
   self.assertEqual(facts['holdings'],[])
   self.assertAlmostEqual(sum(v for _,v in facts['countries']),99.9 if euro else 100.1,places=1)
   self.assertEqual(facts['topWeight'],37.1 if euro else 17.6)
 def test_identity_stale_counts_and_ocr_rejection(self):
  text,legend,c=self.fixture(False);now=dt.datetime(2026,10,8,tzinfo=UTC)
  for bad in [text.replace('QUALITY INCOME',''),text.replace('NUMBER OF CONSTITUENTS                                                                                                                                   90','NUMBER OF CONSTITUENTS 89')]:
   with self.assertRaises(ValueError):parse_composition(bad,legend,legend,c,now)
  with self.assertRaises(ValueError):parse_composition(text,legend,legend,c,dt.datetime(2027,1,1,tzinfo=UTC))
  with self.assertRaises(ValueError):parse_composition(text,legend,legend.replace('25.7%','25.8%'),c,now)
  with self.assertRaises(ValueError):parse_legend('Financials 25.7%')
  with self.assertRaises(ValueError):parse_legend(legend+'\nFinancials 25.7%')
if __name__=='__main__':unittest.main()
