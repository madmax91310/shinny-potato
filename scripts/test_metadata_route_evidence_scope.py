import copy,unittest
from metadata_route_evidence_scope import select
A='IE00BZ048462';B='IE00B4L5Y983';PATHS=['scripts/build-automation-targets.mjs','scripts/instrument-metadata-supplemental-sources.json']
def before():return {'instruments':[{'isin':A,'fields':['listings'],'urls':['https://issuer.test/A'],'listings':[{'checkedAt':'current-date'}]},{'isin':B,'urls':['https://issuer.test/B']}]}
def after():
 d=before();d['instruments'][0]['fields'].append('currencyHedge');d['instruments'][0]['urls'].append('https://www.justetf.com/fr/etf-profile.html?isin='+A);return d
class EvidenceScope(unittest.TestCase):
 def test_only_changed_exact_route_is_selected_before_results(self):
  result=select(before(),after(),PATHS);self.assertEqual(result['mode'],'targeted-field-routes');self.assertEqual(result['ids'],[A]);self.assertNotIn('pea',result['fields'])
 def test_broader_runtime_change_preserves_full_qualification(self):
  self.assertEqual(select(before(),after(),PATHS+['scripts/collect_instrument_metadata.py'])['mode'],'full')
 def test_another_instrument_or_source_or_identity_change_cannot_hide_in_target(self):
  for mutate in [lambda d:d['instruments'][1].update(urls=['https://other.test']),lambda d:d['instruments'][0].update(listings=[]),lambda d:d['instruments'][0]['urls'].append('https://third.test'),lambda d:d['instruments'][0]['fields'].append('pea')]:
   d=after();mutate(d);self.assertEqual(select(before(),d,PATHS)['mode'],'full')
 def test_empty_or_different_instrument_inventory_does_not_certify_a_narrow_scope(self):
  self.assertEqual(select(before(),before(),PATHS)['mode'],'full');self.assertEqual(select(before(),{'instruments':[]},PATHS)['mode'],'full')
if __name__=='__main__':unittest.main()
