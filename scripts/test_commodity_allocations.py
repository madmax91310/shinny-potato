import copy
import datetime as dt
import pathlib
import unittest
from unittest.mock import patch
from collect_commodity_allocations import parse_allocation, add_allocation, SOURCE_URL
from apply_etf_collection import merge_collection
from data_automation import UTC

TEXT = (pathlib.Path(__file__).parent/'fixtures/official-documents/commodity-allocation/invesco.txt').read_text()
NOW = dt.datetime(2026, 10, 7, tzinfo=UTC)

class CommodityAllocations(unittest.TestCase):
    def test_exact_index_and_signed_rounding(self):
        r = parse_allocation(TEXT, NOW, 'a'*64)
        self.assertEqual(r['basis'], 'index')
        self.assertEqual(r['classification'], 'commodity-groups')
        self.assertEqual(r['asOf'], '2026-08-31')
        self.assertEqual(r['rows'][-1]['weightPct'], -.01)
        self.assertAlmostEqual(sum(x['weightPct'] for x in r['rows']), 100.09)

    def test_identity_dates_completeness_and_duplicates(self):
        for a,b in [('IE00BD6FTQ80','IE00OTHER001'),('BCOMTR','OTHER'),
                    ('31 Aug 2026','31 Aug 2027'),('31 Aug 2026','31 Jan 2026'),
                    ('Livestock  4.30\n',''),('Energy  35.50','Energy  135.50'),
                    ('■ Grains  22.60','■ Energy  22.60'),('Others  -0.01','Others  -1.00')]:
            with self.subTest(a=a), self.assertRaises(ValueError):
                parse_allocation(TEXT.replace(a,b), NOW, 'a'*64)

    def test_failed_extra_preserves_other_valid_fields(self):
        original={'index':'Different index', 'aum':{'amount':123}, 'sourceUrl':'https://example.org'}
        r=add_allocation(copy.deepcopy(original), {'collectCommodityAllocation':True,'commodityBenchmark':'Bloomberg Commodity'}, NOW)
        self.assertEqual(r['aum'], original['aum'])
        self.assertNotIn('commodityAllocation', r)
        self.assertEqual(r['collectionErrors'][0]['field'], 'commodityAllocation')

    def test_cross_issuer_provenance_and_no_other_fund_data(self):
        original={'index':'Bloomberg Commodity Index Total Return (Official)', 'sourceUrl':'https://www.blackrock.com/data'}
        with patch('collect_commodity_allocations.collect_allocation',return_value=parse_allocation(TEXT,NOW,'a'*64)):
            r=add_allocation(original, {'collectCommodityAllocation':True,'commodityBenchmark':original['index']}, NOW)
        a=r['commodityAllocation']
        self.assertEqual(a['sourceUrls'], [SOURCE_URL, original['sourceUrl']])
        self.assertNotIn('holdings',r)
        self.assertNotIn('sectors',r)
        self.assertNotIn('performance',r)

    def test_merge_keeps_newer_allocation_and_excluded_characteristics(self):
        isin='IE00BD6FTQ80'
        old={'currency':'USD','productId':isin,'sourceUrl':SOURCE_URL,'characteristics':{'terPct':.19,'distribution':None,'checkedAt':'2026-10-07'}}
        incoming=parse_allocation(TEXT,NOW,'a'*64)
        share={'isin':isin,'currency':'USD','productId':isin,'sourceUrl':SOURCE_URL,'commodityAllocation':incoming,'exposureOnly':True}
        report={'checkedAt':NOW.isoformat(),'shares':[share]}
        r=merge_collection(report,{isin:old},{})[isin]
        self.assertEqual(r['characteristics'],old['characteristics'])
        self.assertEqual(r['commodityAllocation']['checkedAt'],'2026-10-07')
        stale=copy.deepcopy(share);stale['commodityAllocation']['asOf']='2026-07-31'
        self.assertEqual(merge_collection({**report,'shares':[stale]},{isin:r},{})[isin],r)

if __name__ == '__main__': unittest.main()
