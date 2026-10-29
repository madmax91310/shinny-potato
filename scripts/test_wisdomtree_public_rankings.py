import copy,datetime as dt,gzip,hashlib,json,pathlib,unittest
from unittest.mock import patch
from collect_wisdomtree_holdings import parse_public_rankings,collect_public_rankings
from wisdomtree_api_holdings import CLASS_CONFIG
FIX=pathlib.Path(__file__).with_name('fixtures')/'wisdomtree-complete'
NOW=dt.datetime(2026,10,29,tzinfo=dt.timezone.utc)
def load(isin):return json.loads(gzip.decompress((FIX/(isin+'.rankings.json.gz')).read_bytes()))
class PublicRankings(unittest.TestCase):
 def test_captured_fixture_hashes_match_the_committed_bodies(self):
  manifest=json.loads((FIX/'manifest.json').read_text())
  for isin,entry in manifest['observations'].items():
   for key,suffix in [('json','.json.gz'),('pdf','.pdf.gz'),('rankings','.rankings.json.gz'),('ssrComparison','.ssr-rankings.json.gz')]:
    with self.subTest(isin=isin,source=key):
     raw=gzip.decompress((FIX/(isin+suffix)).read_bytes())
     self.assertEqual(hashlib.sha256(raw).hexdigest(),entry[key]['sha256'])
     self.assertEqual(len(raw),entry[key]['bytes'])

 def test_all_six_fund_files_match_independent_ssr_no_country_sector_index_double_count(self):
  for isin,config in CLASS_CONFIG.items():
   with self.subTest(isin=isin):
    body=load(isin);fund=[r for r in body if r['rankClassificationID']==1]
    rows,date=parse_public_rankings(body,{'isin':isin},NOW,{fund[0]['additionalInfo2']:'US0378331005'})
    self.assertEqual(date,'2026-10-23');self.assertEqual(len(rows),len(fund))
    self.assertAlmostEqual(sum(r['weightPct']for r in rows),100,delta=.02)
    self.assertGreater(sum(r['pct']for r in body),3.9,'Other classifications exist but never enter the holdings')
    original=json.loads(gzip.decompress((FIX/(isin+'.ssr-rankings.json.gz')).read_bytes()))
    self.assertEqual({r['additionalInfo2']:(r['pct'],r['dt'][:10])for r in fund},
                     {r['descriptorB']:(r['pctWeight'],r['dt'][:10])for r in original})
    self.assertEqual(sum(r['isin']is not None for r in rows),1)
    with self.assertRaises(ValueError):parse_public_rankings(fund[:10],{'isin':isin},NOW,{fund[0]['additionalInfo2']:'US0378331005'})

 def test_identity_partial_future_negative_duplicate_and_wrong_scopes_refused(self):
  isin='IE00BJGWQN72';original=load(isin);mapping={original[0]['additionalInfo2']:'US0378331005'}
  for key,value in [('wtID',1),('ticker','WTAI LN'),('entityName','Other fund'),('dt','2026-10-30'),('dt','2026-10-22'),('pct',float('nan')),('pct',-.01),('pct',.7),('ranking',999),('additionalInfo2',original[1]['additionalInfo2']),('rankClassification','Index')]:
   body=copy.deepcopy(original);body[0][key]=value
   with self.subTest(key=key,value=value),self.assertRaises(ValueError):parse_public_rankings(body,{'isin':isin},NOW,mapping)
  body=[r for r in original if r['rankClassificationID']!=1]
  with self.assertRaises(ValueError):parse_public_rankings(body,{'isin':isin},NOW,mapping)

 def test_real_document_acquisition_and_independently_dated_identities(self):
  isin='IE00BJGWQN72';body=load(isin);raw=json.dumps(body).encode();doc=gzip.decompress((FIX/(isin+'.pdf.gz')).read_bytes())
  mapping={r['additionalInfo2']:f'US{i:010d}'for i,r in enumerate(body)if r['rankClassificationID']==1}
  calls=[]
  def fetch(url,**kwargs):calls.append(url);return doc if '/pdr/'in url else raw
  with patch('collect_wisdomtree_holdings.complete_identity_mapping',return_value=(mapping,['2026-10-28'],{})):
   h=collect_public_rankings({'isin':isin,'currency':'USD'},NOW,fetch)
   self.assertEqual(h['asOf'],'2026-10-23');self.assertEqual(h['identityAsOf'],'2026-09-30')
   self.assertEqual(h['identityAsOfDates'],['2026-10-28']);self.assertTrue(h['complete'])
   self.assertEqual(h['unidentifiedWeightPct'],0);self.assertEqual(len(calls),2)
   self.assertEqual(h['coverageProof']['rankClassificationID'],1)
  with patch('collect_wisdomtree_holdings.complete_identity_mapping',return_value=(mapping,['2020-01-01'],{})):
   with self.assertRaisesRegex(ValueError,'dates incompatible'):collect_public_rankings({'isin':isin,'currency':'USD'},NOW,fetch)
