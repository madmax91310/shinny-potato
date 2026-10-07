"""Published tables: pagination completeness, distinct bond issues and exact benchmarks."""
import copy
import datetime as dt
import json
import pathlib
import unittest
from unittest.mock import patch
from data_automation import UTC
from collect_vanguard_holdings import parse_pages, collect_one
from collect_document_etf import parse, collect_legacy_document
from collect_tracked_exposure import collect_one as tracked_exposure
from apply_etf_collection import merge_collection

ROOT = pathlib.Path(__file__).resolve().parents[1]
FIX = ROOT/'scripts/fixtures/official-documents'
NOW = dt.datetime(2026, 10, 7, tzinfo=UTC)
CONFIG = json.loads((ROOT/'scripts/additional-etf-sources.json').read_text())['instruments']


def share(isin):
    return next(s for s in CONFIG if s['isin'] == isin)


class PriorityCompletion(unittest.TestCase):
    def pages(self):
        return json.loads((FIX/'vanguard-bond-holdings.json').read_text())

    def test_real_paginated_bonds_retain_security_identity_and_nav_weights(self):
        result = parse_pages(self.pages(), share('IE00BZ163G84'), NOW)
        rows = result['rows']
        self.assertEqual(result['asOf'], '2026-08-31')
        self.assertEqual(result['basis'], 'fund')
        self.assertEqual(len(rows), 10)
        self.assertEqual(rows[0]['weightPct'], .13969)
        self.assertEqual(rows[0]['sedol'], 'BZ6D7P1')
        ab = [r for r in rows if r['name'].startswith('Anheuser')]
        self.assertEqual(len(ab), 2)
        self.assertNotEqual(ab[0]['maturityDate'], ab[1]['maturityDate'])
        self.assertLess(sum(r['weightPct'] for r in rows), 2)

    def test_wrong_share_currency_and_repeated_or_truncated_pages_rejected(self):
        for defect in ('isin', 'currency', 'portId', 'count', 'date', 'weight', 'coupon', 'duplicate', 'missing-top-identity'):
            p = self.pages()
            profile = p[0]['data']['funds'][0]['profile']
            holding = p[0]['data']['borHoldings'][0]['holdings']
            if defect == 'isin': profile['identifiers'][0]['altIdValue'] = 'WRONG'
            if defect == 'currency': profile['fundCurrency'] = 'USD'
            if defect == 'portId': profile['portId'] = '9695'
            if defect == 'count': holding['totalHoldings'] -= 1
            if defect == 'date': holding['items'][2]['effectiveDate'] = '2026-09-01'
            if defect == 'weight': holding['items'][2]['marketValuePercentage'] = True
            if defect == 'coupon': holding['items'][2]['couponRate'] = None
            if defect == 'duplicate': holding['items'][3] = copy.deepcopy(holding['items'][2])
            if defect == 'missing-top-identity': holding['items'][2]['sedol1'] = None
            with self.subTest(defect=defect), self.assertRaises(ValueError):
                parse_pages(p, share('IE00BZ163G84'), NOW)
        with self.assertRaises(ValueError): parse_pages(self.pages()[:1], share('IE00BZ163G84'), NOW)
        with self.assertRaises(ValueError): parse_pages(self.pages()[::-1], share('IE00BZ163G84'), NOW)
        with self.assertRaises(ValueError):
            parse_pages(self.pages(), share('IE00BZ163G84'), NOW + dt.timedelta(days=90))

    def test_pagination_requests_use_the_published_cursor_and_stop_at_end(self):
        pages, calls = self.pages(), []
        def fetch(query, variables, operation):
            calls.append(variables)
            return pages[len(calls)-1]
        collect_one(share('IE00BZ163G84'), NOW, fetch)
        self.assertEqual(len(calls), 3)
        self.assertIsNone(calls[0]['lastItemKey'])
        self.assertEqual(calls[1]['lastItemKey'], pages[0]['data']['borHoldings'][0]['holdings']['lastItemKey'])
        with self.assertRaises(ValueError):
            collect_one(share('IE00BZ163G84'), NOW, lambda *_: pages[0])

    def test_hsbc_fund_positions_do_not_use_benchmark_or_rolling_returns(self):
        text = (FIX/'hsbc-euro-stoxx.txt').read_text()
        s = share('IE00B4K6B022')
        result = parse(text, s, NOW)
        self.assertEqual(result['holdings']['rows'][0], {'name': 'ASML Holding NV', 'weightPct': 8.62})
        self.assertEqual(len(result['holdings']['rows']), 10)
        self.assertNotIn('performance', result)
        broken = parse(text.replace('8.62', 'NaN'), s, NOW)
        self.assertNotIn('holdings', broken)
        self.assertIn('aum', broken)
        self.assertEqual(broken['collectionErrors'][0]['field'], 'holdings')

    def test_exact_world_exposure_has_own_date_basis_and_proof(self):
        text = (FIX/'msci-world-current.txt').read_text()
        with patch('collect_tracked_exposure.pdf_text', return_value=text):
            result = tracked_exposure(share('IE0002XZSHO1'), NOW, 'MSCI World Index', lambda _: b'%PDF-real')
        for field in ('countries', 'sectors', 'holdings'):
            self.assertEqual(result[field]['basis'], 'index')
            self.assertEqual(result[field]['asOf'], '2026-09-30')
            self.assertEqual(result[field]['indexId'], 'world')
            self.assertEqual(len(result[field]['sha256']), 64)
        self.assertNotIn('performance', result)
        with self.assertRaises(ValueError):
            tracked_exposure(share('IE0002XZSHO1'), NOW, 'MSCI World ESG Index')
        with self.assertRaises(ValueError):
            tracked_exposure(share('IE000QDFFK00'), NOW, 'NASDAQ-100')

    def test_share_benchmark_change_keeps_fees_and_calendars_but_blocks_exposure(self):
        s = share('IE0002XZSHO1')
        text = (FIX/'ishares-wpea-current.txt').read_text()
        facts = (FIX/'ishares-wpea-facts.txt').read_text()
        with patch('collect_document_etf.download', return_value=b'%PDF-real'), \
                patch('collect_document_etf.pdf_text', side_effect=lambda body, crop=None: facts if crop else text.replace('Indice de référence : MSCI World Index', 'Indice de référence : MSCI World ESG Index')):
            r = collect_legacy_document(s, NOW)
        self.assertIn('aum', r)
        self.assertEqual(r['performance']['years'], {'2025': 6.61})
        self.assertNotIn('countries', r)
        self.assertEqual(r['collectionErrors'][0]['field'], 'exposures')

    def test_missing_bond_complement_does_not_erase_valid_prior_holdings(self):
        s = share('IE00BZ163G84')
        current = {s['isin']: {'currency': 'EUR', 'productId': s['isin'], 'sourceUrl': 'https://issuer.test',
                              'holdings': parse_pages(self.pages(), s, NOW)}}
        incoming = {**s, 'sourceUrl': 'https://issuer.test', 'productId': s['isin'],
                    'characteristics': {'terPct': .07}, 'collectionErrors': [{'field': 'holdings', 'reason': 'failed'}]}
        merged = merge_collection({'checkedAt': NOW.isoformat(), 'shares': [incoming]}, current, {})
        self.assertEqual(merged[s['isin']]['holdings'], current[s['isin']]['holdings'])


if __name__ == '__main__':
    unittest.main()
