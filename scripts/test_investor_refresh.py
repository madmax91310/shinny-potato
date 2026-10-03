"""Regression checks for automatic 13F snapshot refresh."""
import importlib.util
import json
import io
from email.message import Message
from contextlib import redirect_stderr
import pathlib
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('refresh_13f', pathlib.Path(__file__).with_name('update-investor-13f.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def portfolio(period, weight=1):
    return {'as_of': 'checked-now', 'data': {'snapshot': {'periodEnd': period, 'holdings': [{'weight': weight}]}}}


class RefreshTests(unittest.TestCase):
    def test_all_existing_investors_are_tracked(self):
        self.assertEqual(set(module.MANAGERS), {'tepper', 'ackman', 'berkshire', 'cathie-wood', 'thiel',
                         'druckenmiller', 'loeb', 'aschenbrenner', 'li-lu', 'gates-trust', 'klarman'})

    def test_options_keep_declared_weight_denominator(self):
        rows = [{'security': {'name': str(i), 'ticker': str(i)}, 'position_type': kind,
                 'value': value, 'change': 'hold'} for i, (kind, value) in enumerate([
                     ('direct', 40), ('direct', 30), ('call', 20), ('put', 10)])]
        fund = {'filing': {'report_period_on': '2026-06-30', 'quarter': 'Q2 2026', 'total_value': 100}}
        table = {'quarter': 'Q2 2026', 'total_value': 100, 'holdings': rows}
        with patch.object(module, 'get_json', side_effect=[fund, table]):
            result = module.make_portfolio('druckenmiller', 'duquesne-family-office', 'Stanley', 'Duquesne')
        holdings = result['data']['snapshot']['holdings']
        self.assertEqual([row['putCall'] for row in holdings], [None, None, 'CALL', 'PUT'])
        self.assertEqual(sum(row['weight'] for row in holdings if row['putCall'] is None), .7)

    def test_ackman_uses_fresher_validated_alternate(self):
        fund = {'filing': {'report_period_on': '2026-03-31'}}
        alternate = portfolio('2026-06-30')
        alternate['data']['identity'] = {'slug': 'ackman', 'archetype': 'hedge_fund'}
        with patch.object(module, 'get_json', side_effect=[fund, {}, alternate]):
            result = module.make_portfolio('ackman', 'pershing-square-capital-management', 'Bill', 'Pershing')
        self.assertEqual(result['data']['identity']['dataProvider'], 'Tracefour')
        self.assertEqual(result['data']['snapshot']['periodEnd'], '2026-06-30')

    def test_previous_quarter_survives_current_amendment(self):
        with tempfile.TemporaryDirectory() as folder:
            directory = pathlib.Path(folder)
            for slug in module.MANAGERS:
                (directory / f'{slug}.json').write_text(json.dumps(portfolio('2026-03-31')))
            with patch.object(module.time, 'sleep'):
                module.refresh(directory, lambda *args: portfolio('2026-06-30'))
                module.refresh(directory, lambda *args: portfolio('2026-06-30', .9))
            for slug in module.MANAGERS:
                archive = directory / 'archive' / slug / '2026-03-31.json'
                self.assertEqual(json.loads(archive.read_text())['data']['snapshot']['holdings'][0]['weight'], 1)
                current = json.loads((directory / f'{slug}.json').read_text())
                self.assertEqual(len(current['data']['filingHistory']), 1)
                self.assertEqual(current['data']['filingHistory'][0]['periodEnd'], '2026-03-31')
                self.assertFalse((directory / 'archive' / slug / '2026-06-30.json').exists())

    def test_provider_movements_and_pagination(self):
        def row(ticker, value, change, percent=None):
            return {'security': {'name': ticker, 'ticker': ticker}, 'position_type': 'direct',
                    'shares': value, 'value': value, 'change': change, 'change_percent': percent}
        rows = [row('NEW', 20, 'new'), row('UP', 20, 'add', 18), row('DOWN', 20, 'trim', 12),
                row('HOLD', 20, 'hold'), row('LAST', 20, 'hold'), row('EXIT', 0, 'sold')]
        fund = {'filing': {'report_period_on': '2026-03-31', 'quarter': 'Q1 2026', 'total_value': 100}}
        table = {'quarter': 'Q1 2026', 'total_value': 100, 'holdings': rows[:3],
                 'pagination': {'total_pages': 2, 'total': 6}}
        last = {**table, 'holdings': rows[3:]}
        with patch.object(module, 'get_json', side_effect=[fund, table, last]) as fetch:
            result = module.make_portfolio('klarman', 'baupost-group', 'Seth Klarman', 'Baupost')
        self.assertTrue(fetch.call_args.args[0].endswith('?page=2'))
        snapshot = result['data']['snapshot']
        self.assertTrue(snapshot['holdings'][0]['isNew'])
        self.assertEqual(snapshot['holdings'][1]['sharesChangePct'], 18)
        self.assertEqual(snapshot['holdings'][2]['sharesChangePct'], -12)
        self.assertIsNone(snapshot['holdings'][3]['sharesChangePct'])
        self.assertEqual(snapshot['quarterChanges']['priorPeriodLabel'], 'Q4 2025')
        self.assertEqual(snapshot['quarterChanges']['exits'][0]['ticker'], 'EXIT')
        self.assertEqual(len(snapshot['holdings']), 5)
        self.assertIsNone(module.shares_change({'security': {'ticker': 'BRK.{A,B}'}, 'change': 'add', 'change_percent': 20}))
        for value in [None, '18', float('nan'), -1, 101]:
            self.assertIsNone(module.shares_change({'change': 'trim', 'change_percent': value}))

    def test_unchanged_ignores_check_timestamp(self):
        with tempfile.TemporaryDirectory() as folder:
            path = pathlib.Path(folder) / 'li-lu.json'
            prior = portfolio('2026-06-30')
            prior['as_of'] = 'previous-check'
            path.write_text(json.dumps(prior))
            self.assertIsNone(module.prepare_update(path, portfolio('2026-06-30')))

    def test_older_report_cannot_overwrite(self):
        with tempfile.TemporaryDirectory() as folder:
            path = pathlib.Path(folder) / 'li-lu.json'
            path.write_text(json.dumps(portfolio('2026-06-30')))
            with self.assertRaisesRegex(ValueError, 'older report'):
                module.prepare_update(path, portfolio('2026-03-31'))

    def test_provider_failure_leaves_all_files_intact(self):
        with tempfile.TemporaryDirectory() as folder:
            directory = pathlib.Path(folder)
            for slug in module.MANAGERS:
                (directory / f'{slug}.json').write_text(json.dumps(portfolio('2026-06-30')))
            before = {p.name: p.read_bytes() for p in directory.iterdir()}
            def failing_fetch(slug, *args):
                if slug == 'gates-trust':
                    raise RuntimeError('provider unavailable')
                return portfolio('2026-09-30')
            with patch.object(module.time, 'sleep'), self.assertRaises(RuntimeError):
                module.refresh(directory, failing_fetch)
            self.assertEqual(before, {p.name: p.read_bytes() for p in directory.iterdir()})

    def test_new_quarter_and_amendment_are_saved(self):
        with tempfile.TemporaryDirectory() as folder:
            directory = pathlib.Path(folder)
            with patch.object(module.time, 'sleep'):
                module.refresh(directory, lambda *args: portfolio('2026-09-30'))
                module.refresh(directory, lambda *args: portfolio('2026-09-30', .9))
            for slug in module.MANAGERS:
                data = json.loads((directory / f'{slug}.json').read_text())
                self.assertEqual(data['data']['snapshot']['holdings'][0]['weight'], .9)
            self.assertFalse(list(directory.glob('*.tmp')))



class RateLimitTests(unittest.TestCase):
    url = 'https://foliofact.com/api/v1/funds/third-point/holdings?page=2'

    def error(self, hint=None, code=429):
        headers = Message()
        if hint is not None:
            headers['Retry-After'] = hint
        return module.urllib.error.HTTPError(self.url, code, 'provider error', headers, io.BytesIO())

    def setUp(self):
        self.clock = 1000.0
        self.delays = []
        self.starts = []
        self.patches = [patch.object(module, '_last_request_at', 0),
                        patch.object(module.time, 'monotonic', lambda: self.clock),
                        patch.object(module.time, 'sleep', self.sleep)]
        for mock in self.patches:
            mock.start()
            self.addCleanup(mock.stop)

    def sleep(self, seconds):
        self.delays.append(seconds)
        self.clock += seconds

    def fetch(self, outcomes):
        def open_request(*args, **kwargs):
            self.starts.append(self.clock)
            result = outcomes.pop(0)
            if isinstance(result, Exception):
                raise result
            return io.BytesIO(json.dumps(result).encode())
        return patch.object(module.urllib.request, 'urlopen', side_effect=open_request)

    def test_delta_seconds_and_same_paginated_url_retry(self):
        with self.fetch([self.error('42'), {'holdings': [1]}]) as fetch, redirect_stderr(io.StringIO()) as log:
            self.assertEqual(module.get_json(self.url), {'holdings': [1]})
        self.assertEqual(self.starts, [1000, 1042])
        self.assertEqual([call.args[0].full_url for call in fetch.call_args_list], [self.url, self.url])
        self.assertIn('retry 1/3', log.getvalue())

    def test_http_date_retry_after(self):
        now = module.dt.datetime(2026, 10, 3, 16, 31, tzinfo=module.dt.timezone.utc)
        with patch.object(module.dt, 'datetime', wraps=module.dt.datetime) as clock:
            clock.now.return_value = now
            with self.fetch([self.error('Sat, 03 Oct 2026 16:32:00 GMT'), {}]), redirect_stderr(io.StringIO()):
                module.get_json(self.url)
        self.assertEqual(self.starts, [1000, 1060])

    def test_missing_or_invalid_hint_uses_bounded_backoff_and_exhausts(self):
        for hint in [None, 'invalid', '-1', 'nan']:
            with self.subTest(hint=hint):
                errors = [self.error(hint) for _ in range(4)]
                start = self.clock
                with self.fetch(errors.copy()), redirect_stderr(io.StringIO()), self.assertRaises(module.urllib.error.HTTPError) as raised:
                    module.get_json(self.url)
                self.assertIs(raised.exception, errors[-1])
                self.assertEqual([b - a for a, b in zip(self.starts[-4:], self.starts[-3:])], [15, 30, 60])
                self.assertGreaterEqual(self.starts[-4], start)

    def test_zero_hint_still_respects_request_pacing(self):
        with self.fetch([self.error('0'), {}, {}]), redirect_stderr(io.StringIO()):
            module.get_json(self.url)
            module.get_json(self.url)
        for first, second in zip(self.starts, self.starts[1:]):
            self.assertAlmostEqual(second - first, 3.1)

    def test_excessive_hint_fails_without_retrying_early(self):
        with self.fetch([self.error('301')]) as fetch, redirect_stderr(io.StringIO()), self.assertRaises(module.urllib.error.HTTPError):
            module.get_json(self.url)
        self.assertEqual(fetch.call_count, 1)
        self.assertEqual(sum(self.delays), 0)

    def test_other_http_errors_and_invalid_json_are_not_retried(self):
        with self.fetch([self.error(code=500)]) as fetch, self.assertRaises(module.urllib.error.HTTPError):
            module.get_json(self.url)
        self.assertEqual(fetch.call_count, 1)
        with patch.object(module.urllib.request, 'urlopen', return_value=io.BytesIO(b'invalid')) as fetch, self.assertRaises(json.JSONDecodeError):
            module.get_json(self.url)
        self.assertEqual(fetch.call_count, 1)

    def test_exhausted_pagination_keeps_all_snapshots_and_archives_intact(self):
        with tempfile.TemporaryDirectory() as folder:
            directory = pathlib.Path(folder)
            for slug in module.MANAGERS:
                (directory / f'{slug}.json').write_text(json.dumps(portfolio('2026-06-30')))
            before = {p.relative_to(directory): p.read_bytes() for p in directory.rglob('*') if p.is_file()}
            def fetch(slug, *args):
                if slug == 'loeb':
                    module.get_json(self.url)
                return portfolio('2026-09-30')
            with self.fetch([self.error() for _ in range(4)]), redirect_stderr(io.StringIO()), self.assertRaises(module.urllib.error.HTTPError):
                module.refresh(directory, fetch)
            self.assertEqual(before, {p.relative_to(directory): p.read_bytes() for p in directory.rglob('*') if p.is_file()})

if __name__ == '__main__':
    unittest.main()
