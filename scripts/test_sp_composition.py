import datetime as dt
import json
import pathlib
import unittest
import copy
import gzip
from collect_sp_composition import parse_composition, parse_legend
from collect_sp_composition import parse_public_data
from data_automation import UTC
ROOT=pathlib.Path(__file__).resolve().parents[1]
class CompositionTests(unittest.TestCase):
 def public_fixture(self, euro=False):
  name='euro' if euro else 'global-quality'
  d=json.loads((ROOT/f'scripts/fixtures/sp-composition/{name}-public-data-2026-09-30.json').read_text())
  c=self.fixture(euro)[2]
  return d,c
 def test_public_numerical_compositions(self):
  for euro in [False,True]:
   d,c=self.public_fixture(euro);body=json.dumps(d).encode()
   for encoded in [body,gzip.compress(body)]:
    f=parse_public_data(encoded,c,dt.datetime(2026,10,8,tzinfo=UTC))
    self.assertEqual(f['asOf'],'2026-09-30');self.assertEqual(f['constituents'],40 if euro else 90)
    self.assertEqual(len(f['holdings']),10)
    self.assertAlmostEqual(sum(v for _,v in f['countries']),100,places=2)
    self.assertAlmostEqual(sum(v for _,v in f['sectors']),100,places=2)
    self.assertAlmostEqual(sum(v for _,v in f['holdings']),f['topWeight'],places=1)
 def test_public_data_rejects_identity_dates_units_and_partial_blocks(self):
  d,c=self.public_fixture();now=dt.datetime(2026,10,8,tzinfo=UTC)
  changes=[
   lambda x:x['indexDetailHolder']['indexDetail'].update(indexId=123),
   lambda x:x['indexDetailHolder']['indexDetail'].update(indexName='S&P Global Dividend Aristocrats Screened Index (USD)'),
   lambda x:x['idsIndexCountryBreakdownHolder']['indexCountryBreakdown'][0].update(stockCount=42),
   lambda x:x['indexSectorBreakdownHolder']['indexSectorBreakdown'][0].update(marketCapitalPercentage=25.7),
   lambda x:x['indexSectorBreakdownHolder']['indexSectorBreakdown'][0].update(effectiveDate=1790654400000),
   lambda x:x['constituentHolder']['constituents'].pop(),
   lambda x:x['constituentHolder']['constituents'][0].update(indexWeight=0.9),
   lambda x:x['indexSectorBreakdownHolder'].update(status=False),
  ]
  for mutate in changes:
   bad=copy.deepcopy(d);mutate(bad)
   with self.assertRaises(ValueError):parse_public_data(json.dumps(bad).encode(),c,now)
  with self.assertRaises(ValueError):parse_public_data(json.dumps(d).encode(),c,dt.datetime(2027,1,1,tzinfo=UTC))
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
