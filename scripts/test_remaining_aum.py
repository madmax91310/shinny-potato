import copy
import datetime as dt
import json
import pathlib
import unittest
from collect_coinshares_aum import parse as coinshares
from collect_annual_fx import parse as fx
from collect_public_issuer import wisdomtree
from apply_etf_collection import merge_collection
from data_automation import UTC

FIXTURES = pathlib.Path(__file__).parent / 'fixtures/official-documents/remaining-aum'
NOW = dt.datetime(2026, 10, 6, tzinfo=UTC)


class RemainingAumTests(unittest.TestCase):
    def test_exact_coinshares_and_true_valuation_date(self):
        for isin, amount in [('GB00BLD4ZL17', 1815061350), ('GB00BLD4ZM24', 449702383)]:
            data = json.loads((FIXTURES / (isin + '.json')).read_text())
            share = {'isin': isin, 'currency': 'USD', 'aumCurrency': 'USD'}
            r = coinshares(data, share, NOW, 'https://www-api.coinshares.com/api/v2/Widgets')
            self.assertEqual(r['amount'], amount)
            self.assertEqual(r['asOf'], '2026-10-05')
            self.assertEqual(r['currency'], 'USD')
            for defect in ['isin', 'date', 'missing-date', 'duplicate', 'amount', 'currency']:
                bad = copy.deepcopy(data)
                config = dict(share)
                rows = bad[0]['sections'][0]['meta']
                if defect == 'isin': bad[1]['sections'][0]['meta'][0]['value'] = 'WRONG'
                if defect == 'date': next(r for r in rows if r['key'] == 'Rate Date')['value'] = '2026-07-01'
                if defect == 'missing-date': rows[:] = [r for r in rows if r['key'] != 'Rate Date']
                if defect == 'duplicate': rows.append(dict(rows[0]))
                if defect == 'amount': next(r for r in rows if r['key'] == 'AUM')['value'] = 'NaN'
                if defect == 'currency': config['aumCurrency'] = 'EUR'
                with self.subTest(isin=isin, defect=defect), self.assertRaises((ValueError, KeyError)):
                    coinshares(bad, config, NOW, 'https://www-api.coinshares.com/api/v2/Widgets')

    def test_ecb_completed_years_and_incomplete_daily_history(self):
        body = (FIXTURES / 'ecb-eurusd.xml').read_bytes()
        r = fx(body, NOW)
        self.assertNotIn('2026', r['years'])
        self.assertEqual(r['years']['2023'], {'value': 1.105, 'asOf': '2023-12-29'})
        self.assertEqual(r['years']['2025']['value'], 1.175)
        for modified in [body.replace(b'2025-12-31', b'2025-12-01'), body.replace(b'currency="USD"', b'currency="EUR"'), body.replace(b'1.175', b'NaN')]:
            with self.assertRaises(ValueError): fx(modified, NOW)

    def test_wisdomtree_real_html_and_wrong_share(self):
        text = (FIXTURES / 'wisdomtree-overview.html').read_text()
        config = {'isin': 'IE00BZ56SW52', 'currency': 'USD', 'sourceUrl': 'https://www.wisdomtree.com/gb/products/equities/wisdomtree-global-quality-dividend-growth-ucits-etf---usd-acc'}
        r = wisdomtree(text, config, NOW)
        self.assertEqual(r['aum']['amount'], 1645809873)
        self.assertEqual(r['aum']['asOf'], '2026-10-05')
        with self.assertRaises(ValueError): wisdomtree(text, {**config, 'isin': 'WRONG'}, NOW)

    def test_rollover_keeps_years_and_rejects_changed_method(self):
        old = {'TEST': {'currency': 'EUR', 'productId': 'TEST', 'sourceUrl': 'https://issuer.example/', 'characteristics': {'terPct': 0.1},
            'performance': {'basis': 'fund', 'currency': 'EUR', 'method': 'NAV total', 'years': {str(y): 1 for y in range(2020, 2026)}, 'checkedAt': '2026-10-05'}}}
        share = {**old['TEST'], 'isin': 'TEST', 'performance': {'basis': 'fund', 'currency': 'EUR', 'method': 'NAV total', 'years': {**{str(y): 1 for y in range(2021, 2026)}, '2026': 2}}}
        report = {'checkedAt': '2027-02-16', 'shares': [share]}
        result = merge_collection(report, old, {'TEST': {'currency': 'EUR'}})
        self.assertEqual(result['TEST']['performance']['years']['2026'], 2)
        self.assertEqual(result['TEST']['performance']['years']['2020'], 1)
        self.assertTrue(all(result['TEST']['performance']['years'][str(y)] == 1 for y in range(2020, 2026)))
        correction = copy.deepcopy(report)
        correction['shares'][0]['performance']['years']['2025'] = 2
        with self.assertRaisesRegex(ValueError, 'Suspicious ETF change'):
            merge_collection(correction, old, {'TEST': {'currency': 'EUR'}})
        for defect in ['method', 'currency', 'unfinished-year']:
            bad = copy.deepcopy(report)
            performance = bad['shares'][0]['performance']
            if defect == 'unfinished-year': performance['years']['2027'] = 3
            else: performance[defect] = 'WRONG'
            with self.assertRaises(ValueError): merge_collection(bad, old, {'TEST': {'currency': 'EUR'}})


if __name__ == '__main__': unittest.main()
