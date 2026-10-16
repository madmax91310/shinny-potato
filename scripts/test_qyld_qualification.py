import datetime as dt
import unittest
from collect_public_issuer import Page, qualify_qyld
from apply_etf_collection import merge_collection

NOW=dt.datetime(2026,10,14,tzinfo=dt.timezone.utc)
SHARE={'isin':'IE00BM8R0J59','sourceUrl':'https://globalxetfs.eu/funds/qyld/'}
TOKENS=['Performance History','USD Accumulating','1 Year','19.39%','Options Contract Detail',
'Top 10 Reference Index Constituents','As of 08 Oct 2026','8.30','NVDA','NVIDIA Corp','9.20','NVDA','NVIDIA Corp','Holdings are subject to change.',
'Reference Index Sector Breakdown','As of 30 Sep 2026','Financials','16.9','Source: AltaVista Research, LLC']
def qualify(tokens):
    return qualify_qyld(Page(''.join('<p>'+t+'</p>' for t in tokens)),SHARE,NOW,'a'*64)
class Qualification(unittest.TestCase):
    def test_conflicting_repeated_positions_and_wrong_share(self):
        q=qualify(TOKENS)
        self.assertEqual(q['holdings']['status'],'source-conflict')
        self.assertEqual(q['performance']['status'],'not-published')
        self.assertEqual(q['countries']['status'],'not-published')
        self.assertEqual(q['sectors']['status'],'unqualified')
        self.assertEqual(q['holdings']['checkedAt'],'2026-10-14')
    def test_identical_duplicates_and_changed_source_require_qualification(self):
        self.assertEqual(qualify([t.replace('9.20','8.30') for t in TOKENS])['holdings']['status'],'unqualified')
        self.assertEqual(qualify(TOKENS+['Country Allocation'])['countries']['status'],'unqualified')
        self.assertEqual(qualify([t.replace('USD Accumulating','USD Distributing') for t in TOKENS])['performance']['status'],'unqualified')
    def test_incomplete_page_does_not_prove_non_publication(self):
        self.assertTrue(all(q['status']=='unqualified' for q in qualify([]).values()))
    def test_basket_weights_are_not_reference_index_conflicts(self):
        tokens = [t.replace('9.20', '8.30') for t in TOKENS]
        at = tokens.index('Holdings are subject to change.')
        tokens[at:at] = ['Basket Constituents', '4.23', 'NVDA', 'NVIDIA CORP']
        q = qualify(tokens)
        self.assertEqual(q['holdings']['status'], 'unqualified')
        self.assertNotIn('4.23', q['holdings']['evidence'])
    def test_current_layout_without_options_heading(self):
        tokens = [t.replace('Options Contract Detail', 'Trading Information') for t in TOKENS]
        self.assertEqual(qualify(tokens)['performance']['status'], 'not-published')
    def test_qualification_persists_and_older_run_cannot_replace_it(self):
        share={**SHARE,'productId':SHARE['isin'],'currency':'USD','characteristics':{'terPct':.45},'fieldQualification':qualify(TOKENS)}
        report={'checkedAt':NOW.isoformat(),'shares':[share]}
        current=merge_collection(report,{}, {})
        self.assertEqual(current[SHARE['isin']]['fieldQualification'],share['fieldQualification'])
        old={**report,'checkedAt':'2026-10-13T00:00:00Z','shares':[{**share,'fieldQualification':qualify([])}]}
        self.assertEqual(merge_collection(old,current,{})[SHARE['isin']]['fieldQualification'],share['fieldQualification'])
