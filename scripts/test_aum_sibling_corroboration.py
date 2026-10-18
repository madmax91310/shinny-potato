"""A stored fund AUM corrected by another share class of the same fund."""
import copy
import unittest

from apply_etf_collection import merge_collection
from etf_anomalies import anomalies
from collect_exposure_expansion import CONFIG, fund_siblings
import json

# Real case (issue #583): Xtrackers MSCI World 1D kept 6.37 bn while the 1C
# workbook published 31,105,311,562.7068 USD for the same fund on 2026-10-15.
ISIN = 'IE00BK1PV551'
FUND = {'currency': 'USD', 'scope': 'fund', 'asOf': '2026-10-15', 'amount': 31105311562.7068}
OLD = {ISIN: {'currency': 'USD', 'productId': ISIN, 'sourceUrl': 'https://etf.dws.com/', 'provider': 'DWS',
              'characteristics': {'terPct': 0.19}, 'aum': {**FUND, 'amount': 6369611991.07679, 'checkedAt': '2026-10-16'}}}
SHARE = {'isin': ISIN, 'currency': 'USD', 'productId': ISIN, 'sourceUrl': 'https://etf.dws.com/', 'provider': 'DWS',
         'characteristics': {'terPct': 0.19}, 'aum': dict(FUND)}
REPORT = {'checkedAt': '2026-10-18T08:00:00+00:00', 'shares': [SHARE]}


class SiblingCorroborationTests(unittest.TestCase):
    def test_uncorroborated_jump_is_still_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Suspicious ETF change'):
            merge_collection(copy.deepcopy(REPORT), OLD, {})

    def test_identical_fund_total_from_sibling_share_accepts_correction(self):
        merged = merge_collection(copy.deepcopy(REPORT), OLD, {}, {ISIN: [dict(FUND)]})
        self.assertEqual(merged[ISIN]['aum']['amount'], FUND['amount'])

    def test_near_miss_siblings_do_not_corroborate(self):
        old, new = OLD[ISIN], SHARE
        for change in [{'amount': FUND['amount'] + 1}, {'asOf': '2026-10-14'}, {'currency': 'EUR'}, {'scope': 'share'}]:
            with self.subTest(change=change):
                self.assertTrue(anomalies(old, new, [{**FUND, **change}]))

    def test_only_shares_declared_as_same_fund_are_siblings(self):
        config = [{'isin': ISIN, 'fund': 'world'}, {'isin': 'IE00BJ0KDQ92', 'fund': 'world'},
                  {'isin': 'UNRELATED1', 'fund': 'other'}, {'isin': 'UNRELATED2'}]
        run = [('IE00BJ0KDQ92', dict(FUND)), ('UNRELATED1', dict(FUND)), ('UNRELATED2', dict(FUND))]
        self.assertEqual(fund_siblings(config[0], config, run), [FUND])
        # An unrelated share publishing the exact same total must not corroborate.
        self.assertEqual(fund_siblings(config[2], config, run), [])
        self.assertEqual(fund_siblings(config[3], config, run), [])
        unrelated_only = fund_siblings(config[0], config, run[1:])
        with self.assertRaisesRegex(ValueError, 'Suspicious ETF change'):
            merge_collection(copy.deepcopy(REPORT), OLD, {}, {ISIN: unrelated_only})

    def test_real_configuration_links_only_xtrackers_world_shares(self):
        config = json.loads(CONFIG.read_text())['instruments']
        groups = {}
        for share in config:
            if share.get('fund'):
                groups.setdefault(share['fund'], set()).add(share['isin'])
        self.assertEqual(list(groups.values()), [{'IE00BJ0KDQ92', ISIN}])


if __name__ == '__main__':
    unittest.main()
