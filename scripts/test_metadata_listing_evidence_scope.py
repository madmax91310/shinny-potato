import ast
import copy
from pathlib import Path
import unittest
import subprocess
import sys
from metadata_listing_evidence_scope import DECODE, ROWS, URL, ISIN, isolated_adapter, select

BASE = '''def fetch_document(url,fetch=None,isin=None):
    try:
        return fetch(url),url
    except ValueError:
        raise
def parse_listings(body,source,url,checked):
    from urllib.parse import urlsplit
    return []
def collect(source,now):
    if url == 'other': fields={}
    elif url == 'rest': fields=ordinary()
'''


def head():
    tree=ast.parse(BASE)
    tree.body[0].body[0].body[:0]=ast.parse('from twentyone_shares_listing import URL as ABTC_URL, decode_document\n'+DECODE).body
    tree.body[1].body[1:1]=ast.parse('from twentyone_shares_listing import URL as ABTC_URL, listing_rows\n'+ROWS).body
    extra=ast.parse('if url == '+repr(URL)+': fields={}').body[0]
    extra.orelse=tree.body[2].body[0].orelse;tree.body[2].body[0].orelse=[extra]
    return ast.unparse(tree)


class EvidenceScope(unittest.TestCase):
    def setUp(self):
        self.helper=(Path(__file__).parent/'twentyone_shares_listing.py').read_text()
        self.config={'instruments':[{'isin':ISIN,'urls':[URL]}]}
        self.paths=['scripts/collect_instrument_metadata.py','scripts/twentyone_shares_listing.py']

    def test_only_exact_adapter_hooks_are_removed(self):
        self.assertTrue(isolated_adapter(BASE,head(),self.helper))

    def test_changed_unrelated_collector_logic_retains_full_scope(self):
        self.assertFalse(isolated_adapter(BASE,head()+'\nother_change=True',self.helper))

    def test_changed_hook_or_implicit_negative_retains_full_scope(self):
        self.assertFalse(isolated_adapter(BASE,head().replace('lambda candidate: candidate == ABTC_URL','None'),self.helper))
        self.assertFalse(isolated_adapter(BASE,head().replace("elif url == 'https://api.primary.21shares.com/api/product_details/ABTC':\n        fields = {}", "elif url == 'https://api.primary.21shares.com/api/product_details/ABTC':\n        fields = {'pea':False}"),self.helper))

    def test_import_time_side_effect_or_network_import_retains_full_scope(self):
        for suffix in ['\nimport urllib.request','\nnetwork_call()']:
            with self.subTest(suffix=suffix):self.assertFalse(isolated_adapter(BASE,head(),self.helper+suffix))

    def test_source_targets_must_be_identical_and_already_registered(self):
        changed=copy.deepcopy(self.config);changed['instruments'][0]['urls'].append('https://other.invalid')
        self.assertIsNone(select(self.config,changed,self.paths,BASE,head(),self.helper))
        missing={'instruments':[]}
        self.assertIsNone(select(missing,missing,self.paths,BASE,head(),self.helper))

    def test_broader_runtime_change_retains_full_scope(self):
        self.assertIsNone(select(self.config,self.config,self.paths+['src/data/instrument-listings.js'],BASE,head(),self.helper))

    def test_scope_fixed_before_network_and_not_from_successes(self):
        result=select(self.config,self.config,self.paths,BASE,head(),self.helper)
        self.assertEqual(result['ids'],[ISIN]);self.assertEqual(result['changedFields'],['listings'])
        self.assertNotIn('results',result)

    def test_scope_guard_does_not_import_the_producer_before_inspection(self):
        code="import sys;sys.modules['twentyone_shares_listing']=None;import metadata_listing_evidence_scope"
        subprocess.run([sys.executable,'-c',code],cwd=Path(__file__).parent,check=True)

    def test_only_the_official_origin_registration_and_predicate_export_are_narrow(self):
        paths=self.paths+['scripts/listing-source-hosts.json','src/data/qualified-listings.js']
        before={'hosts':['issuer.invalid']};after={'hosts':['issuer.invalid','api.primary.21shares.com']}
        consumer='const officialListingSource=row=>row;'
        args=dict(registry_before=before,registry_after=after,consumer_before=consumer,consumer_after='export '+consumer)
        self.assertIsNotNone(select(self.config,self.config,paths,BASE,head(),self.helper,**args))
        args['registry_after']={'hosts':after['hosts']+['unqualified.invalid']}
        self.assertIsNone(select(self.config,self.config,paths,BASE,head(),self.helper,**args))
        args['registry_after']=after;args['consumer_after']='export '+consumer+'\notherChange()'
        self.assertIsNone(select(self.config,self.config,paths,BASE,head(),self.helper,**args))


if __name__=='__main__':unittest.main()
