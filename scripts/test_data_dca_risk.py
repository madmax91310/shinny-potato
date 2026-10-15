"""Keep both official country contracts through collection and daily application."""
import copy
import datetime as dt
import unittest
from unittest.mock import patch
from collect_etf_pilot import collect
from apply_etf_collection import merge_collection
from data_automation import UTC


class DcaRiskTests(unittest.TestCase):
    def test_holdings_geography_survives_alongside_published_table(self):
        share = {'isin': 'IE00B4L5Y983', 'productId': 251882, 'currency': 'USD', 'collectHoldings': True}
        published = {'asOf': '2026-10-14', 'sourceComponent': 'exposureBreakdowns.geography.countries',
                     'rows': [{'name': 'United States', 'weightPct': 73}, {'name': 'Other', 'weightPct': 27}]}
        risk = {'asOf': '2026-10-14', 'method': 'Country of risk, all published holdings including cash/derivatives, no renormalisation',
                'rows': [{'name': 'United States', 'weightPct': 74}, {'name': 'Other', 'weightPct': 26}]}
        parsed = {**share, 'terPct': .2, 'index': 'MSCI World', 'distribution': 'Accumulating',
                  'countries': published, 'rawComponents': {}}
        url = 'https://www.blackrock.com/product-data/api/v2/get-product-data?component=holdings.all'
        with patch('collect_etf_pilot.fetch_product', return_value=({}, url, [])), \
             patch('collect_etf_pilot.parse_share', return_value=copy.deepcopy(parsed)), \
             patch('collect_etf_holdings.parse_holdings', return_value=({'asOf': '2026-10-14', 'rows': []}, copy.deepcopy(risk))):
            report = collect({'instruments': [share]}, {share['isin']: {}}, dt.datetime(2026, 10, 15, tzinfo=UTC))
        self.assertFalse(report['failures'])
        output = merge_collection(report, {}, {})[share['isin']]
        self.assertEqual(output['countries']['rows'], published['rows'])
        self.assertEqual(output['countriesRisk']['rows'], risk['rows'])
        self.assertEqual(output['countriesRisk']['basis'], 'fund')
        self.assertEqual(output['countriesRisk']['sourceUrl'], url)
        self.assertEqual(output['countriesRisk']['checkedAt'], '2026-10-15')
        # A later collection that lacks the alternative must not erase or redate it.
        later = copy.deepcopy(report)
        later['checkedAt'] = '2026-10-16T12:00:00+00:00'
        del later['shares'][0]['countriesRisk']
        refreshed = merge_collection(later, {share['isin']: output}, {})[share['isin']]
        self.assertEqual(refreshed['countriesRisk'], output['countriesRisk'])


if __name__ == '__main__':
    unittest.main()
