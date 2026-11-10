"""Ensure source updates change active records, without regressions or partial writes."""
import copy
import contextlib
import datetime as dt
import io
import json
import pathlib
import tempfile
import unittest
from unittest.mock import patch
import refresh_additional_etf
from apply_etf_collection import apply, merge_collection, checked_observation
from data_automation import UTC
from update_bitcoin_monthly import collect, apply as apply_bitcoin

ROOT = pathlib.Path(__file__).resolve().parents[1]


class ActiveRefreshTests(unittest.TestCase):
    def run_extension_report(self, report, merged):
        """Exercise the real CLI writes, summary and final failure gate offline."""
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            (root / 'scripts').mkdir()
            (root / 'src/data').mkdir(parents=True)
            (root / 'scripts/additional-etf-sources.json').write_text('{"instruments": []}')
            active = root / 'src/data/automated-etf.json'
            active.write_text('{}')
            baseline = root / 'baseline.json'
            baseline.write_text('{}')
            output, summary = root / 'report.json', root / 'summary.md'
            stdout = io.StringIO()
            exit_code = 0
            with patch.object(refresh_additional_etf, 'ROOT', root), \
                    patch.object(refresh_additional_etf, 'refresh', return_value=(merged, report)), \
                    patch('sys.argv', ['refresh', '--baseline', str(baseline), '--output', str(output), '--apply']), \
                    patch.dict('os.environ', {'GITHUB_STEP_SUMMARY': str(summary)}, clear=True), \
                    contextlib.redirect_stdout(stdout):
                try:
                    refresh_additional_etf.main()
                except SystemExit as error:
                    exit_code = error.code
            self.assertEqual(json.loads(active.read_text()), merged)
            self.assertEqual(json.loads(output.read_text()), report)
            return exit_code, summary.read_text(), stdout.getvalue()

    def test_source_attempt_formats_and_incomplete_receipts_preserve_126_records(self):
        attempts = [
            {'url': 'https://issuer.test/primary', 'reason': 'HTTP 403'},
            {'url': 'https://issuer.test/document', 'status': 'validated'},
            {'sourceUrl': 'https://issuer.test/alias', 'status': 'unavailable', 'error': 'HTTP 503'},
            {'sourceUrl': 'https://issuer.test/current', 'status': 'validated'},
            {'attempt': 1, 'sha256': 'digest', 'status': 'missing-complete-fund-file'},
            {'status': 'failed', 'reason': 'ambiguous date'},
            {}, {'url': None, 'sourceUrl': None}, None, 'incomplete',
            {'url': 'https://issuer.test/http', 'sourceUrl': 'https://issuer.test/browser',
             'status': 'partial', 'reason': 'unqualified holdings', 'error': 'date mismatch'},
        ]
        merged = {f'SHARE{i}': {'aum': {'amount': 100 + i, 'asOf': '2026-11-06'},
                              'performance': {'years': {'2025': 7.5}}} for i in range(126)}
        report = {'shares': [{'isin': isin, 'provider': 'issuer', 'status': 'validated',
                             'sourceUrl': 'https://issuer.test/retained',
                             'sourceAttempts': copy.deepcopy(attempts) if i == 0 else []}
                            for i, isin in enumerate(merged)], 'notQualified': []}
        before = copy.deepcopy(report)
        code, summary, stdout = self.run_extension_report(report, merged)
        self.assertEqual(code, 0)
        self.assertEqual(report, before)
        self.assertIn('126/126 shares validated', stdout)
        for text in ('HTTP 403', 'HTTP 503', 'ambiguous date', 'URL non renseignée',
                     'Tentative invalide', 'missing-complete-fund-file', 'digest',
                     'https://issuer.test/current', 'https://issuer.test/document',
                     'https://issuer.test/http', 'https://issuer.test/browser', 'date mismatch'):
            self.assertIn(text, summary)
            self.assertIn(text, stdout)
        self.assertNotIn('Source de secours utilisée', summary)
        self.assertNotIn('Source recovered', stdout)
        missing = refresh_additional_etf.source_attempts_text(
            {'isin': 'UNKNOWN', 'sourceAttempts': [{'status': 'unavailable'}]})
        self.assertNotIn('https://', missing)
        self.assertIn('URL non renseignée', missing)

    def test_report_keeps_financial_failures_and_partial_errors_fatal(self):
        valid = {'isin': 'VALID', 'provider': 'issuer', 'status': 'validated',
                 'sourceUrl': 'https://issuer.test/document',
                 'sourceAttempts': [{'sourceUrl': 'https://issuer.test/primary', 'error': 'HTTP 403'},
                                    {'url': 'https://issuer.test/document', 'status': 'validated'}]}
        failures = [
            {'isin': 'BAD', 'provider': 'issuer', 'status': 'failed', 'reason': 'Ambiguous fund date'},
            {**valid, 'collectionErrors': [{'field': 'holdings', 'reason': 'Invalid financial weights'}]},
            {**valid, 'collectionErrors': [{'field': 'rankings-primary-http', 'reason': 'HTTP 403',
                                          'qualifiedFallbackAvailable': True}]},
        ]
        for failure in failures:
            with self.subTest(failure=failure):
                report = {'shares': [valid, failure], 'notQualified': []}
                code, summary, stdout = self.run_extension_report(
                    report, {'VALID': {'aum': {'amount': 123}}, 'BAD': {'retained': True}})
                self.assertEqual(code, 1)
                reason = failure.get('reason') or failure['collectionErrors'][0]['reason']
                self.assertIn(reason, summary)
                self.assertIn(reason, stdout)
                self.assertIn('https://issuer.test/document', summary)

    def test_extension_failure_signals_after_preserving_valid_updates(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            (root / 'scripts').mkdir()
            (root / 'src/data').mkdir(parents=True)
            (root / 'scripts/additional-etf-sources.json').write_text('{"instruments": []}')
            active = root / 'src/data/automated-etf.json'
            active.write_text('{"unavailable": {"old": true}}')
            baseline = root / 'baseline.json'
            baseline.write_text('{}')
            output = root / 'observation.json'
            merged = {'unavailable': {'old': True}, 'valid': {'updated': True}}
            report = {'shares': [
                {'isin': 'unavailable', 'provider': 'issuer', 'status': 'failed', 'reason': 'HTTP 403'},
                {'isin': 'valid', 'provider': 'issuer', 'status': 'validated'}
            ], 'notQualified': []}
            with patch.object(refresh_additional_etf, 'ROOT', root), \
                    patch.object(refresh_additional_etf, 'refresh', return_value=(merged, report)), \
                    patch('sys.argv', ['refresh', '--baseline', str(baseline), '--output', str(output), '--apply']), \
                    patch.dict('os.environ', {}, clear=True):
                with self.assertRaises(SystemExit) as error:
                    refresh_additional_etf.main()
            self.assertEqual(error.exception.code, 1)
            self.assertEqual(json.loads(active.read_text()), merged)
            self.assertEqual(json.loads(output.read_text()), report)

    def test_extension_partial_field_failure_signals_after_applying_valid_fields(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            (root / 'scripts').mkdir()
            (root / 'src/data').mkdir(parents=True)
            (root / 'scripts/additional-etf-sources.json').write_text('{"instruments": []}')
            active = root / 'src/data/automated-etf.json'
            active.write_text('{"unavailable": {"old": true}}')
            baseline = root / 'baseline.json'
            baseline.write_text('{}')
            output = root / 'observation.json'
            merged = {'unavailable': {'old': True}, 'valid': {'updated': True}}
            report = {'shares': [
                {'isin': 'unavailable', 'provider': 'issuer', 'status': 'validated',
                 'collectionErrors': [{'field': 'performance', 'reason': 'HTTP 502'}]},
                {'isin': 'valid', 'provider': 'issuer', 'status': 'validated'}
            ], 'notQualified': []}
            with patch.object(refresh_additional_etf, 'ROOT', root), \
                    patch.object(refresh_additional_etf, 'refresh', return_value=(merged, report)), \
                    patch('sys.argv', ['refresh', '--baseline', str(baseline), '--output', str(output), '--apply']), \
                    patch.dict('os.environ', {}, clear=True):
                with self.assertRaises(SystemExit) as error:
                    refresh_additional_etf.main()
            self.assertEqual(error.exception.code, 1)
            self.assertEqual(json.loads(active.read_text()), merged)
            self.assertEqual(json.loads(output.read_text()), report)

    def setUp(self):
        self.report = json.loads((ROOT / 'scripts/source-snapshots/etf-pilot-2026-10-05.json').read_text())
        self.baseline = {s['isin']: {'currency': 'USD'} for s in self.report['shares']}

    def test_replaces_old_values_and_is_idempotent(self):
        first = merge_collection(self.report, {}, self.baseline)
        report = copy.deepcopy(self.report)
        report['checkedAt'] = '2026-10-06T00:00:00+00:00'
        report['shares'][0]['aum']['asOf'] = '2026-10-06'
        report['shares'][0]['aum']['amount'] += 100
        updated = merge_collection(report, first, self.baseline)
        isin = report['shares'][0]['isin']
        self.assertEqual(updated[isin]['aum']['amount'], first[isin]['aum']['amount'] + 100)
        self.assertEqual(merge_collection(report, updated, self.baseline), updated)

    def test_published_fertilizer_subindustry_retains_exact_label(self):
        report = copy.deepcopy(self.report)
        row = report['shares'][0]['sectors']['rows'][0]
        row['name'] = 'Fertilizers & Agricultural Chemicals'
        result = merge_collection(report, {}, self.baseline)
        actual = result[report['shares'][0]['isin']]['sectors']['rows'][0]
        self.assertEqual(actual['label'], row['name'])
        row['name'] = 'Unknown fertilizer classification'
        with self.assertRaises(ValueError):
            merge_collection(report, {}, self.baseline)

    def test_old_or_missing_allocation_does_not_erase_or_redate(self):
        first = merge_collection(self.report, {}, self.baseline)
        report = copy.deepcopy(self.report)
        report['shares'][0]['countries'] = {'status': 'not-published', 'rows': []}
        report['shares'][0]['sectors']['asOf'] = '2026-09-01'
        updated = merge_collection(report, first, self.baseline)
        isin = report['shares'][0]['isin']
        self.assertEqual(updated[isin]['countries'], first[isin]['countries'])
        self.assertEqual(updated[isin]['sectors'], first[isin]['sectors'])

    def test_invalid_late_share_cannot_partially_write(self):
        with tempfile.TemporaryDirectory() as directory:
            destination = pathlib.Path(directory) / 'active.json'
            destination.write_text('{}\n')
            self.report['shares'][-1]['sectors']['rows'][0]['name'] = 'Unknown sector'
            with self.assertRaises(ValueError):
                apply(self.report, destination, self.baseline)
            self.assertEqual(destination.read_text(), '{}\n')

    def test_successful_check_preserves_value_date_and_modification(self):
        first = merge_collection(self.report, {}, self.baseline)
        self.report['checkedAt'] = '2026-10-06T00:00:00+00:00'
        updated = merge_collection(self.report, first, self.baseline)
        isin = self.report['shares'][0]['isin']
        for field in ('aum', 'sectors', 'performance'):
            self.assertEqual(updated[isin][field]['checkedAt'], '2026-10-06')
            self.assertEqual(updated[isin][field]['modifiedAt'], first[isin][field]['modifiedAt'])
            self.assertEqual(updated[isin][field].get('asOf'), first[isin][field].get('asOf'))
        self.assertEqual(merge_collection(self.report, updated, self.baseline), updated)


    def test_legacy_value_has_no_invented_modification_date(self):
        previous = {'amount': 10, 'asOf': '2026-09-30', 'checkedAt': '2026-10-01'}
        same = checked_observation({'amount': 10, 'asOf': '2026-09-30'}, previous, '2026-10-10')
        self.assertEqual(same['checkedAt'], '2026-10-10')
        self.assertNotIn('modifiedAt', same)
        changed = checked_observation({'amount': 11, 'asOf': '2026-09-30'}, same, '2026-10-11')
        self.assertEqual(changed['modifiedAt'], '2026-10-11')
        self.assertEqual(changed['asOf'], previous['asOf'])

    def bitcoin_response(self, interval, now):
        end = dt.datetime(now.year, now.month, 1, tzinfo=UTC)
        start = dt.datetime(2015, 1, 1, tzinfo=UTC)
        stamps = []
        while start < end:
            stamps.append(int(start.timestamp()))
            start += dt.timedelta(days=1)
        if interval == '1mo':
            stamps = [s for s in stamps if dt.datetime.fromtimestamp(s, UTC).day == 1]
        return {'chart': {'error': None, 'result': [{'meta': {'symbol': 'BTC-USD', 'currency': 'USD', 'exchangeTimezoneName': 'UTC', 'dataGranularity': interval}, 'timestamp': stamps, 'indicators': {'quote': [{'close': [38483.125] * len(stamps)}]}}]}}

    def test_bitcoin_complete_homogeneous_history_and_rounding(self):
        now = dt.datetime(2015, 3, 4, tzinfo=UTC)
        fetch = lambda url: self.bitcoin_response('1mo' if 'interval=1mo' in url else '1d', now)
        report = collect(now, fetch)
        self.assertEqual(report['points'], [['2015-01', 38483.13], ['2015-02', 38483.13]])
        with tempfile.TemporaryDirectory() as directory:
            destination = pathlib.Path(directory) / 'bitcoin.json'
            self.assertTrue(apply_bitcoin(report, destination))
            self.assertFalse(apply_bitcoin({**report, 'checkedAt': '2015-03-05'}, destination))
            with self.assertRaises(ValueError):
                apply_bitcoin({**report, 'periodEnd': '2015-01'}, destination)

    def test_bitcoin_rejects_missing_final_day_and_wrong_symbol(self):
        now = dt.datetime(2015, 3, 4, tzinfo=UTC)
        for defect in ('symbol', 'daily'):
            def fetch(url):
                interval = '1mo' if 'interval=1mo' in url else '1d'
                body = self.bitcoin_response(interval, now)
                r = body['chart']['result'][0]
                if defect == 'symbol':
                    r['meta']['symbol'] = 'ETH-USD'
                elif interval == '1d':
                    r['timestamp'].pop()
                    r['indicators']['quote'][0]['close'].pop()
                return body
            with self.assertRaises(ValueError):
                collect(now, fetch)


if __name__ == '__main__':
    unittest.main()
