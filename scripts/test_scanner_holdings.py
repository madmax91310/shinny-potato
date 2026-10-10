"""Scanner source qualification, rollback protection and independent freshness."""
import datetime as dt
import json
import pathlib
import tempfile
import unittest

from data_automation import UTC
from refresh_scanner_holdings import audit, refresh
from scanner_holdings import (freshness, merge_snapshot, observed_coverage,
                             parse_complete_ishares)

NOW = dt.datetime(2026, 10, 10, 12, tzinfo=UTC)
POLICY = {'maxSnapshotAgeDays': 7, 'maxCheckAgeDays': 2, 'peaWatch': ['FR001400U5Q4']}


def share():
    fields = {'asOfDate': 20261008,
              'issueName': [f'Company {i}' for i in range(12)] + ['EUR cash', 'Future'],
              'holdingPercent': [8.0] * 12 + [3.0, 1.0],
              'isin': [f'US{i:09d}1' for i in range(12)] + ['-', None],
              'assetClass': ['Equity'] * 12 + ['Cash', 'Futures'],
              'countryOfRisk': ['United States'] * 12 + ['France', None],
              'sectorName': ['Technology'] * 12 + ['Cash', None],
              'ticker': [str(i) for i in range(12)] + [None, None],
              'marketCurrencyCode': ['USD'] * 12 + ['EUR', 'USD'],
              'exchange': ['NASDAQ'] * 12 + [None, None]}
    return {'isin': 'IE00B4L5Y983', 'name': 'World test', 'productId': 251882,
            'currency': 'USD', 'index': 'MSCI World Index (Net)',
            'sourceUrl': 'https://www.blackrock.com/product-data/api/test',
            'rawComponents': {
                'keyFundFacts': {'containersByNameMap': {'default': {'dataPointsByNameMap': {
                    'isin': {'value': 'IE00B4L5Y983'},
                    'fundMethodologyTypeCode': {'value': 'Optimised'}}}}},
                'holdings': {'containersByNameMap': {'all': {'dataPointsByNameMap': {
                    k: {'value': v} for k, v in fields.items()}}}}}}


def points(s):
    return s['rawComponents']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']


class ScannerTests(unittest.TestCase):
    def test_preserves_all_positions_cash_and_derivatives(self):
        s = parse_complete_ishares(share(), NOW)
        self.assertEqual(s['positionCount'], 14)
        self.assertEqual(s['equityPositionCount'], 12)
        self.assertEqual(s['equityWeightPct'], 96)
        self.assertEqual(s['portfolioWeightPct'], 100)
        self.assertEqual(s['basis'], 'fund')
        self.assertEqual(s['rows'][-1]['assetClass'], 'Futures')

    def test_rejects_substitute_basket(self):
        s = share()
        s['rawComponents']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']['fundMethodologyTypeCode']['value'] = 'Swap'
        with self.assertRaisesRegex(ValueError, 'physical'):
            parse_complete_ishares(s, NOW)

    def test_preserves_unidentified_corporate_actions(self):
        s = share()
        points(s)['isin']['value'][-3] = None
        result = parse_complete_ishares(s, NOW)
        self.assertEqual(result['unidentifiedEquityPositionCount'], 1)
        self.assertEqual(result['unidentifiedEquityWeightPct'], 8)
        self.assertIsNone(result['rows'][-3]['isin'])

    def test_repeated_isin_preserved_for_aggregation(self):
        s = share()
        points(s)['isin']['value'][1] = points(s)['isin']['value'][0]
        result = parse_complete_ishares(s, NOW)
        self.assertEqual(result['equityPositionCount'], 12)
        self.assertEqual(result['uniqueEquityIsinCount'], 11)
        self.assertEqual(result['portfolioWeightPct'], 100)

    def test_rejects_truncation_and_wrong_identity(self):
        for mutation in ('truncation', 'identity', 'columns', 'nan', 'future'):
            with self.subTest(mutation=mutation):
                s = share()
                if mutation == 'truncation':
                    for p in points(s).values():
                        if isinstance(p['value'], list): p['value'].pop(0)
                elif mutation == 'identity':
                    s['rawComponents']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']['isin']['value'] = 'FR001400U5Q4'
                elif mutation == 'columns': points(s)['sectorName']['value'].pop()
                elif mutation == 'nan': points(s)['holdingPercent']['value'][0] = float('nan')
                else: points(s)['asOfDate']['value'] = 20261011
                with self.assertRaises(ValueError): parse_complete_ishares(s, NOW)

    def test_same_date_conflict_and_rollback_preserve_previous(self):
        incoming = parse_complete_ishares(share(), NOW)
        previous = merge_snapshot(incoming, None, '2026-10-10', NOW, POLICY)
        s = share()
        points(s)['holdingPercent']['value'][0] = 7
        points(s)['holdingPercent']['value'][1] = 9
        with self.assertRaisesRegex(ValueError, 'same source date'):
            merge_snapshot(parse_complete_ishares(s, NOW), previous, '2026-10-10', NOW, POLICY)
        points(s)['asOfDate']['value'] = 20261007
        with self.assertRaisesRegex(ValueError, 'Older'):
            merge_snapshot(parse_complete_ishares(s, NOW), previous, '2026-10-10', NOW, POLICY)

    def test_check_does_not_redate_snapshot_or_modification(self):
        incoming = parse_complete_ishares(share(), NOW)
        previous = merge_snapshot(incoming, None, '2026-10-09', NOW, POLICY)
        current = merge_snapshot(incoming, previous, '2026-10-10', NOW, POLICY)
        self.assertEqual(current['asOf'], '2026-10-08')
        self.assertEqual(current['modifiedAt'], '2026-10-09')
        self.assertEqual(current['checkedAt'], '2026-10-10')
        self.assertFalse(freshness(current, NOW + dt.timedelta(days=3), POLICY)['fresh'])

    def test_stale_snapshot_rejected_even_after_successful_check(self):
        s = share()
        points(s)['asOfDate']['value'] = 20261001
        with self.assertRaisesRegex(ValueError, 'Stale'):
            merge_snapshot(parse_complete_ishares(s, NOW), None, '2026-10-10', NOW, POLICY)

    def test_new_date_with_suspicious_position_count_rejected(self):
        incoming = parse_complete_ishares(share(), NOW)
        previous = merge_snapshot(incoming, None, '2026-10-10', NOW, POLICY)
        changed = {**incoming, 'asOf': '2026-10-09', 'equityPositionCount': 100}
        with self.assertRaisesRegex(ValueError, 'equity-count'):
            merge_snapshot(changed, previous, '2026-10-10', NOW, POLICY)

    def test_pea_top_ten_never_qualifies_as_complete(self):
        record = {'holdings': {'basis': 'index', 'rows': [{'weightPct': 3}] * 10,
                              'asOf': '2026-10-08', 'checkedAt': '2026-10-10'}}
        coverage = observed_coverage(record, NOW, POLICY)
        self.assertFalse(coverage['available'])
        self.assertEqual(coverage['publishedWeightPct'], 30)
        self.assertTrue(coverage['freshness']['fresh'])

    def test_failed_collection_keeps_last_good_file_and_check_date(self):
        s = share()
        source = {'instruments': [{**{k: s[k] for k in ('isin', 'name', 'productId', 'currency')}, 'collectHoldings': True}]}
        with tempfile.TemporaryDirectory() as folder:
            report = {'checkedAt': NOW.isoformat(), 'shares': [s]}
            manifest, failures = refresh(report, POLICY, source, {}, folder, NOW)
            self.assertFalse(failures)
            self.assertFalse(audit(folder, NOW))
            path = pathlib.Path(folder) / (s['isin'] + '.json')
            previous = path.read_bytes()
            import hashlib
            self.assertEqual(manifest['instruments'][s['isin']]['fileSha256'], hashlib.sha256(previous).hexdigest())
            later = NOW + dt.timedelta(days=1)
            manifest, failures = refresh({'checkedAt': later.isoformat(), 'shares': []}, POLICY, source, {}, folder, later)
            self.assertEqual(len(failures), 1)
            self.assertEqual(path.read_bytes(), previous)
            self.assertEqual(manifest['instruments'][s['isin']]['checkedAt'], '2026-10-10')
            self.assertEqual(manifest['instruments'][s['isin']]['status'], 'retained-after-failure')
            self.assertTrue(audit(folder, NOW + dt.timedelta(days=3)))

    def test_manifest_integrity_and_frozen_freshness(self):
        s = share()
        source = {'instruments': [{**{k: s[k] for k in ('isin', 'name', 'productId', 'currency')}, 'collectHoldings': True}]}
        with tempfile.TemporaryDirectory() as folder:
            refresh({'checkedAt': NOW.isoformat(), 'shares': [s]}, POLICY, source, {}, folder, NOW)
            self.assertTrue(audit(folder, NOW + dt.timedelta(days=3)))
            path = pathlib.Path(folder) / (s['isin'] + '.json')
            body = json.loads(path.read_text()); body['rows'][0]['weightPct'] = 42
            path.write_text(json.dumps(body))
            with self.assertRaisesRegex(ValueError, 'hash mismatch'): audit(folder, NOW)

    def test_file_bytes_integrity_includes_metadata_and_format(self):
        s = share()
        source = {'instruments': [{**{k: s[k] for k in ('isin', 'name', 'productId', 'currency')}, 'collectHoldings': True}]}
        with tempfile.TemporaryDirectory() as folder:
            refresh({'checkedAt': NOW.isoformat(), 'shares': [s]}, POLICY, source, {}, folder, NOW)
            path = pathlib.Path(folder) / (s['isin'] + '.json')
            path.write_bytes(path.read_bytes() + b'\n')
            with self.assertRaisesRegex(ValueError, 'file hash mismatch'): audit(folder, NOW)

    def test_old_or_naive_source_report_rejected(self):
        for stamp in ('2026-10-08T12:00:00+00:00', '2026-10-10T12:00:00'):
            with self.assertRaises(ValueError):
                refresh({'checkedAt': stamp}, POLICY, {'instruments': []}, {}, '/unused', NOW)


if __name__ == '__main__':
    unittest.main()
