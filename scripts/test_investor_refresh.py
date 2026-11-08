"""Regression checks for automatic 13F snapshot refresh."""
import importlib.util
import json
import io
from email.message import Message
from contextlib import redirect_stderr
import pathlib
import tempfile
import unittest
import copy
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('refresh_13f', pathlib.Path(__file__).with_name('update-investor-13f.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def portfolio(period, weight=1, slug='li-lu'):
    rows = [{'issuerName': 'Example', 'ticker': 'TEST', 'weight': weight, 'putCall': None}]
    if weight < 1:
        rows.append({'issuerName': 'Other', 'ticker': 'OTHER', 'weight': 1-weight, 'putCall': None})
    return {'as_of': 'checked-now', 'data': {'identity': {'slug': slug, 'archetype': 'hedge_fund'},
            'sourceUrl': 'https://foliofact.com/funds/example',
            'snapshot': {'periodEnd': period, 'holdings': rows}}}


class RefreshTests(unittest.TestCase):
    def setUp(self):
        fixed_date = patch.object(module, 'current_date', return_value=module.dt.date(2026, 10, 14))
        fixed_date.start()
        self.addCleanup(fixed_date.stop)

    def test_missing_tickers_keep_distinct_security_identities(self):
        data = portfolio('2026-06-30', .6)
        for row in data['data']['snapshot']['holdings']:
            row['ticker'] = 'Unmapped CUSIP'
        module.validate_portfolio(data, 'li-lu')
        data['data']['snapshot']['holdings'][1]['issuerName'] = 'Example'
        with self.assertRaisesRegex(ValueError, 'Duplicate security'):
            module.validate_portfolio(data, 'li-lu')

    def test_identity_quarter_duplicates_and_invalid_weights_rejected(self):
        good = portfolio('2026-06-30', .6)
        now = module.dt.date(2026, 10, 14)
        module.validate_portfolio(good, 'li-lu', now)
        for kind in ['identity', 'mid-quarter', 'future', 'stale', 'duplicate', 'nan', 'negative', 'boolean', 'source', 'incomplete']:
            bad = copy.deepcopy(good)
            snap = bad['data']['snapshot']
            if kind == 'identity': bad['data']['identity']['slug'] = 'ackman'
            if kind == 'mid-quarter': snap['periodEnd'] = '2026-06-29'
            if kind == 'future': snap['periodEnd'] = '2026-12-31'
            if kind == 'stale': snap['periodEnd'] = '2025-12-31'
            if kind == 'duplicate': snap['holdings'][1]['ticker'] = 'TEST'
            if kind == 'nan': snap['holdings'][0]['weight'] = float('nan')
            if kind == 'negative': snap['holdings'][0]['weight'] = -.6
            if kind == 'boolean': snap['holdings'][0]['weight'] = True
            if kind == 'source': bad['data']['sourceUrl'] = 'https://example.com/'
            if kind == 'incomplete': snap['holdings'].pop()
            with self.subTest(kind=kind), self.assertRaises(ValueError):
                module.validate_portfolio(bad, 'li-lu', now)

    def test_all_managers_checked_and_reported_on_multiple_failures(self):
        with tempfile.TemporaryDirectory() as folder:
            directory = pathlib.Path(folder) / 'investors'
            directory.mkdir()
            for slug in module.MANAGERS:
                (directory / f'{slug}.json').write_text(json.dumps(portfolio('2026-06-30', slug=slug)))
            before = {p.name: p.read_bytes() for p in directory.iterdir()}
            attempted = []
            def fetch(slug, *args):
                attempted.append(slug)
                if slug in ('tepper', 'hohn'): raise ValueError('Provider unavailable')
                return portfolio('2026-09-30', slug=slug)
            report = pathlib.Path(folder) / 'report.json'
            with patch.object(module.time, 'sleep'), self.assertRaisesRegex(RuntimeError, '2 manager'):
                module.refresh(directory, fetch, report)
            self.assertEqual(set(attempted), set(module.MANAGERS))
            for slug in module.MANAGERS:
                period = json.loads((directory / f'{slug}.json').read_text())['data']['snapshot']['periodEnd']
                self.assertEqual(period, '2026-06-30' if slug in ('tepper', 'hohn') else '2026-09-30', slug)
            self.assertEqual(before['tepper.json'], (directory / 'tepper.json').read_bytes())
            result = json.loads(report.read_text())
            self.assertEqual((result['status'], result['readyToApply']), ('partial', True))
            self.assertEqual(len(result['managers']), len(module.MANAGERS))
            self.assertEqual(sum(c['status'] == 'failed' for c in result['managers']), 2)
            reviews = {row['data']['identity']['slug']: row['data']['snapshot']['periodEnd'] for row in json.loads((directory / 'review-metadata.json').read_text())}
            self.assertEqual(set(reviews), set(module.MANAGERS))
            self.assertEqual((reviews['tepper'], reviews['berkshire']), ('2026-06-30', '2026-09-30'))

    def test_every_provider_failing_changes_nothing(self):
        with tempfile.TemporaryDirectory() as folder:
            directory = pathlib.Path(folder)
            for slug in module.MANAGERS:
                (directory / f'{slug}.json').write_text(json.dumps(portfolio('2026-06-30', slug=slug)))
            before = {p.name: p.read_bytes() for p in directory.iterdir()}
            report = pathlib.Path(folder) / 'report.json'
            def down(*args): raise RuntimeError('provider unavailable')
            with patch.object(module.time, 'sleep'), self.assertRaises(RuntimeError):
                module.refresh(directory, down, report)
            after = {p.name: p.read_bytes() for p in directory.iterdir() if p.name not in ('report.json', 'review-metadata.json')}
            self.assertEqual({k: v for k, v in before.items()}, after)
            self.assertEqual(json.loads(report.read_text())['status'], 'failed')

    def test_all_existing_investors_are_tracked(self):
        self.assertEqual(set(module.MANAGERS), {'morfit', 'dorsey', 'vinall', 'marks', 'watsa', 'gavin-baker', 'einhorn', 'halvorsen', 'gerstner', 'gayner', 'tepper', 'ackman', 'berkshire', 'cathie-wood', 'thiel',
                         'druckenmiller', 'loeb', 'aschenbrenner', 'li-lu', 'gates-trust', 'klarman', 'terry-smith', 'pabrai', 'hohn', 'baker-bros', 'icahn', 'laffont', 'renaissance'})

    def test_options_keep_declared_weight_denominator(self):
        rows = [{'security': {'name': str(i), 'ticker': str(i)}, 'position_type': kind,
                 'value': value, 'change': 'hold'} for i, (kind, value) in enumerate([
                     ('direct', 40), ('direct', 30), ('call', 20), ('put', 10)])]
        fund = {'fund': {'slug': 'duquesne-family-office'}, 'filing': {'report_period_on': '2026-06-30', 'quarter': 'Q2 2026', 'total_value': 100}}
        table = {'fund': {'slug': 'duquesne-family-office'}, 'quarter': 'Q2 2026', 'total_value': 100, 'holdings': rows}
        with patch.object(module, 'get_json', side_effect=[fund, table]):
            result = module.make_portfolio('druckenmiller', 'duquesne-family-office', 'Stanley', 'Duquesne')
        holdings = result['data']['snapshot']['holdings']
        self.assertEqual([row['putCall'] for row in holdings], [None, None, 'CALL', 'PUT'])
        self.assertEqual(sum(row['weight'] for row in holdings if row['putCall'] is None), .7)

    def test_ui_and_collector_track_the_same_managers(self):
        import re
        ui = (module.ROOT / 'src/data/investor-roster.js').read_text()
        self.assertEqual(set(module.MANAGERS), set(re.findall(r"\['([^']+)',", ui)))

    def test_ackman_uses_fresher_validated_alternate(self):
        fund = {'fund': {'slug': 'pershing-square-capital-management'}, 'filing': {'report_period_on': '2026-03-31'}}
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
                module.refresh(directory, lambda *args: portfolio('2026-06-30', slug=args[0]))
                module.refresh(directory, lambda *args: portfolio('2026-06-30', .9, slug=args[0]))
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
        fund = {'fund': {'slug': 'baupost-group'}, 'filing': {'report_period_on': '2026-03-31', 'quarter': 'Q1 2026', 'total_value': 100}}
        table = {'fund': {'slug': 'baupost-group'}, 'quarter': 'Q1 2026', 'total_value': 100, 'holdings': rows[:3],
                 'pagination': {'total_pages': 2, 'total': 6}}
        last = {**table, 'holdings': rows[3:]}
        with patch.object(module, 'get_json', side_effect=[fund, table, last]) as fetch:
            result = module.make_portfolio('klarman', 'baupost-group', 'Seth Klarman', 'Baupost')
        self.assertTrue(fetch.call_args_list[1].args[0].endswith('/holdings?per_page=100'))
        self.assertTrue(fetch.call_args.args[0].endswith('?per_page=100&page=2'))
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

    def test_review_metadata_is_lightweight_and_unchanged_poll_is_stable(self):
        with tempfile.TemporaryDirectory() as folder:
            directory = pathlib.Path(folder)
            with patch.object(module.time, 'sleep'):
                module.refresh(directory, lambda *args: portfolio('2026-06-30', slug=args[0]))
                before = {p.name: p.read_bytes() for p in directory.iterdir()}
                checked_later = portfolio('2026-06-30')
                checked_later['as_of'] = 'later-poll'
                module.refresh(directory, lambda *args: {**checked_later, 'data': {**checked_later['data'], 'identity': {'slug': args[0], 'archetype': 'hedge_fund'}}})
            self.assertEqual({k:v for k,v in before.items() if k != 'review-metadata.json'}, {p.name: p.read_bytes() for p in directory.iterdir() if p.name != 'review-metadata.json'})
            reviews = json.loads((directory / 'review-metadata.json').read_text())
            self.assertEqual({row['data']['identity']['slug'] for row in reviews}, set(module.MANAGERS))
            self.assertTrue(all(row['data']['snapshot'] == {'periodEnd': '2026-06-30'} for row in reviews))
            self.assertTrue(all(row['as_of'] == 'checked-now' for row in reviews))
            self.assertTrue(all(row['lastSuccessfulPollAt'] == 'later-poll' for row in reviews))
            self.assertTrue(all(row['positionsCollectedAt'] == 'checked-now' for row in reviews))
            with patch.object(module.time, 'sleep'), self.assertRaises(RuntimeError):
                module.refresh(directory, lambda *args: (_ for _ in ()).throw(RuntimeError('offline')))
            self.assertEqual(reviews, json.loads((directory / 'review-metadata.json').read_text()))

    def test_older_report_cannot_overwrite(self):
        with tempfile.TemporaryDirectory() as folder:
            path = pathlib.Path(folder) / 'li-lu.json'
            path.write_text(json.dumps(portfolio('2026-06-30')))
            with self.assertRaisesRegex(ValueError, 'older report'):
                module.prepare_update(path, portfolio('2026-03-31'))

    def test_provider_failure_only_holds_back_that_manager(self):
        with tempfile.TemporaryDirectory() as folder:
            directory = pathlib.Path(folder)
            for slug in module.MANAGERS:
                (directory / f'{slug}.json').write_text(json.dumps(portfolio('2026-06-30')))
            before = {p.name: p.read_bytes() for p in directory.iterdir()}
            def failing_fetch(slug, *args):
                if slug == 'gates-trust':
                    raise RuntimeError('provider unavailable')
                return portfolio('2026-09-30', slug=slug)
            with patch.object(module.time, 'sleep'), self.assertRaises(RuntimeError):
                module.refresh(directory, failing_fetch)
            self.assertEqual(before['gates-trust.json'], (directory / 'gates-trust.json').read_bytes())
            self.assertFalse((directory / 'archive' / 'gates-trust').exists())
            for slug in set(module.MANAGERS) - {'gates-trust'}:
                self.assertEqual(json.loads((directory / f'{slug}.json').read_text())['data']['snapshot']['periodEnd'], '2026-09-30')
                self.assertTrue((directory / 'archive' / slug / '2026-06-30.json').exists(), slug)

    def test_new_quarter_and_amendment_are_saved(self):
        with tempfile.TemporaryDirectory() as folder:
            directory = pathlib.Path(folder)
            with patch.object(module.time, 'sleep'):
                module.refresh(directory, lambda *args: portfolio('2026-09-30', slug=args[0]))
                module.refresh(directory, lambda *args: portfolio('2026-09-30', .9, slug=args[0]))
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
        self.patches = [patch.object(module, 'current_date', return_value=module.dt.date(2026, 10, 14)),
                        patch.object(module, '_last_request_at', 0),
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
            before = (directory / 'loeb.json').read_bytes()
            def fetch(slug, *args):
                if slug == 'loeb':
                    module.get_json(self.url)
                return portfolio('2026-09-30', slug=slug)
            with self.fetch([self.error() for _ in range(4)]), redirect_stderr(io.StringIO()), self.assertRaisesRegex(RuntimeError, 'kept at their last validated filing'):
                module.refresh(directory, fetch)
            self.assertEqual(before, (directory / 'loeb.json').read_bytes())
            self.assertFalse((directory / 'archive' / 'loeb').exists())

class PublicationTests(unittest.TestCase):
    """Real isolated Git races; never mutate a production portfolio."""
    @classmethod
    def setUpClass(cls):
        import subprocess
        cls.subprocess = subprocess
        cls.source = pathlib.Path(__file__).resolve().parent
        spec = importlib.util.spec_from_file_location(
            'investor_publication', cls.source / 'validate-investor-publication.py')
        cls.publication = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.publication)

    def setUp(self):
        import datetime as dt
        import shutil
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = pathlib.Path(self.tmp.name) / 'work'
        self.remote = pathlib.Path(self.tmp.name) / 'remote.git'
        self.root.mkdir()
        self.cmd(['git', 'init', '--bare', '-q', str(self.remote)])
        self.git('init', '-q', '-b', 'master')
        self.git('config', 'user.email', 'test@example.invalid')
        self.git('config', 'user.name', 'Isolated regression')
        (self.root / 'scripts').mkdir()
        for name in ['update-investor-13f.py', 'producer_report_contract.py',
                     'producer_report_plans.py', 'observation_rebase_guard.py',
                     'validate-investor-publication.py', 'commit-validated-data.sh',
                     'data_publication.py', 'stage_validated_projections.py']:
            shutil.copyfile(self.source / name, self.root / 'scripts' / name)
        (self.root / 'scripts/audit-investor-profiles.mjs').write_text(
            "if(process.env.FORCE_AUDIT_FAILURE)process.exit(13);console.log('audited');")
        directory = self.root / 'public/data/investors'
        directory.mkdir(parents=True)
        self.now = dt.datetime.now(dt.timezone.utc)
        start_quarter = self.now.date().replace(
            month=((self.now.month - 1) // 3) * 3 + 1, day=1)
        self.period = (start_quarter - dt.timedelta(days=1)).isoformat()
        self.old_clock = (self.now - dt.timedelta(days=1)).isoformat()
        self.fresh_clock = (self.now - dt.timedelta(seconds=1)).isoformat()
        self.reviews = []
        self.report = {'checkedAt': self.now.isoformat(), 'status': 'validated',
                       'readyToApply': True, 'managers': []}
        for slug in module.MANAGERS:
            data = portfolio(self.period, slug=slug)
            data['as_of'] = self.old_clock
            (directory / (slug + '.json')).write_text(json.dumps(data))
            self.reviews.append({'as_of': self.old_clock,
                                 'lastSuccessfulPollAt': self.old_clock,
                                 'positionsCollectedAt': self.old_clock,
                                 'data': {'identity': {'slug': slug},
                                          'snapshot': {'periodEnd': self.period}}})
            self.report['managers'].append({'slug': slug, 'status': 'validated',
                                            'periodEnd': self.period, 'changed': False})
        self.write_reviews()
        self.git('add', '.')
        self.git('commit', '-qm', 'Isolated collection base')
        self.base = self.git('rev-parse', 'HEAD')
        self.git('remote', 'add', 'origin', str(self.remote))
        self.git('push', '-q', 'origin', 'master')
        for review in self.reviews:
            review['lastSuccessfulPollAt'] = self.fresh_clock
        self.write_reviews()
        self.report_path = pathlib.Path(self.tmp.name) / 'source-report.json'
        self.report_path.write_text(json.dumps(self.report))

    def cmd(self, args, **kwargs):
        return self.subprocess.run(args, check=True, capture_output=True, text=True,
                                   **kwargs).stdout.strip()

    def git(self, *args):
        return self.cmd(['git', '-C', str(self.root), *args])

    def write_reviews(self):
        (self.root / 'public/data/investors/review-metadata.json').write_text(
            json.dumps(self.reviews))

    def advance(self, path):
        other = pathlib.Path(self.tmp.name) / ('other-' + str(len(list(
            pathlib.Path(self.tmp.name).glob('other-*')))))
        self.cmd(['git', 'clone', '-q', str(self.remote), str(other)])
        self.cmd(['git', '-C', str(other), 'config', 'user.email', 'other@example.invalid'])
        self.cmd(['git', '-C', str(other), 'config', 'user.name', 'Other writer'])
        target = other / path
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists():
            target.write_bytes(target.read_bytes() + b'\n')
        else:
            target.write_text('{"independent":true}\n')
        self.cmd(['git', '-C', str(other), 'add', path])
        self.cmd(['git', '-C', str(other), 'commit', '-qm', 'Concurrent observation'])
        self.cmd(['git', '-C', str(other), 'push', '-q', 'origin', 'master'])

    def record(self, fail_auditor=False):
        import os
        env = {**os.environ, 'VALIDATED_DATA_CHECK':
               'python3 scripts/validate-investor-publication.py check --report '
               + str(self.report_path), 'RUNNER_TEMP': self.tmp.name}
        if fail_auditor:
            env['FORCE_AUDIT_FAILURE'] = '1'
        return self.subprocess.run(
            ['bash', 'scripts/commit-validated-data.sh', 'Validated test polls',
             'public/data/investors'], cwd=self.root, env=env,
            capture_output=True, text=True)

    def test_reviewed_source_fingerprints_are_current(self):
        import hashlib
        for path, digest in self.publication.ACQUISITION_SHA256.items():
            self.assertEqual(hashlib.sha256(
                (self.source.parent / path).read_bytes()).hexdigest(), digest)

    def test_real_recording_preserves_three_independent_writers(self):
        for path in sorted(self.publication.INDEPENDENT):
            self.advance(path)
        result = self.record()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.git('fetch', '-q', 'origin', 'master')
        for path in self.publication.INDEPENDENT:
            self.assertIn('independent', self.git('show', 'origin/master:' + path))
        review = json.loads(self.git('show',
            'origin/master:public/data/investors/review-metadata.json'))[0]
        self.assertEqual(review['lastSuccessfulPollAt'], self.fresh_clock)
        self.assertEqual(review['positionsCollectedAt'], self.old_clock)
        self.assertNotIn('investor-publication', self.publication.guard.ALLOWED)

    def assert_remote_input_refused(self, path):
        self.advance(path)
        result = self.record()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('recollect', result.stdout + result.stderr)
        self.assertIn(path, result.stdout + result.stderr)

    def test_changed_acquisition_refuses(self):
        self.assert_remote_input_refused('scripts/update-investor-13f.py')

    def test_changed_own_holdings_refuse(self):
        self.assert_remote_input_refused('public/data/investors/loeb.json')

    def test_unknown_input_refuses(self):
        self.assert_remote_input_refused('src/data/monthly-fx.json')

    def test_failed_combined_financial_audit_prevents_push(self):
        self.advance('src/data/automated-etf.json')
        result = self.record(fail_auditor=True)
        self.assertNotEqual(result.returncode, 0)
        self.git('fetch', '-q', 'origin', 'master')
        reviews = json.loads(self.git('show',
            'origin/master:public/data/investors/review-metadata.json'))
        self.assertTrue(all(r['lastSuccessfulPollAt'] == self.old_clock for r in reviews))

    def test_success_without_change_preserves_position_date(self):
        result = self.publication.audit(self.root, self.report, self.base, self.now)
        self.assertEqual(result['validated'], len(module.MANAGERS))
        self.assertTrue(all(r['as_of'] == r['positionsCollectedAt'] == self.old_clock
                            for r in self.reviews))

    def test_missing_duplicate_and_unexpected_results_refuse(self):
        variants = [[], self.report['managers'][1:],
                    self.report['managers'] + [self.report['managers'][0]],
                    self.report['managers'] + [{'slug': 'unknown', 'status': 'validated'}]]
        for rows in variants:
            with self.subTest(rows=len(rows)):
                bad = {**self.report, 'managers': rows}
                with self.assertRaisesRegex(ValueError, 'missing, duplicate or unexpected'):
                    self.publication.audit(self.root, bad, self.base, self.now)

    def test_partial_failure_keeps_file_and_dates_but_validates_others(self):
        slug = self.report['managers'][0]['slug']
        self.report['managers'][0] = {'slug': slug, 'status': 'failed', 'reason': 'offline'}
        self.report['status'] = 'partial'
        self.reviews[0]['lastSuccessfulPollAt'] = self.old_clock
        self.write_reviews()
        result = self.publication.audit(self.root, self.report, self.base, self.now)
        self.assertEqual(result['retainedFailed'], 1)
        self.reviews[0]['lastSuccessfulPollAt'] = self.fresh_clock
        self.write_reviews()
        with self.assertRaisesRegex(ValueError, 'renewed a retained date'):
            self.publication.audit(self.root, self.report, self.base, self.now)
        self.reviews[0]['lastSuccessfulPollAt'] = self.old_clock
        self.write_reviews()
        path = self.root / 'public/data/investors' / (slug + '.json')
        payload = json.loads(path.read_text())
        payload['data']['snapshot']['holdings'][0]['weight'] = .99
        path.write_text(json.dumps(payload))
        with self.assertRaisesRegex(ValueError, 'changed its retained holdings'):
            self.publication.audit(self.root, self.report, self.base, self.now)

    def test_all_sources_failed_preserves_every_clock_without_certifying_checks(self):
        self.report['status'] = 'failed'
        self.report['readyToApply'] = False
        self.report['managers'] = [{'slug': slug, 'status': 'failed', 'reason': 'offline'}
                                   for slug in module.MANAGERS]
        for review in self.reviews:
            review['lastSuccessfulPollAt'] = self.old_clock
        self.write_reviews()
        result = self.publication.audit(self.root, self.report, self.base, self.now)
        self.assertEqual(result['validated'], 0)
        self.assertEqual(result['retainedFailed'], len(module.MANAGERS))

    def test_old_failed_filing_does_not_block_other_valid_managers(self):
        slug = self.report['managers'][0]['slug']
        path = self.root / 'public/data/investors' / (slug + '.json')
        payload = json.loads(path.read_text())
        payload['data']['snapshot']['periodEnd'] = '2020-12-31'
        path.write_text(json.dumps(payload))
        self.reviews[0]['data']['snapshot']['periodEnd'] = '2020-12-31'
        for review in self.reviews:
            review['lastSuccessfulPollAt'] = self.old_clock
        self.write_reviews()
        self.git('add', 'public/data/investors')
        self.git('commit', '-qm', 'Isolated old retained filing')
        self.base = self.git('rev-parse', 'HEAD')
        for review in self.reviews[1:]:
            review['lastSuccessfulPollAt'] = self.fresh_clock
        self.write_reviews()
        self.report['status'] = 'partial'
        self.report['managers'][0] = {'slug': slug, 'status': 'failed', 'reason': 'offline'}
        result = self.publication.audit(self.root, self.report, self.base, self.now)
        self.assertEqual(result['retainedFailed'], 1)
        self.assertEqual(result['validated'], len(module.MANAGERS) - 1)

    def test_invalid_financial_payload_and_old_report_refuse(self):
        import datetime as dt
        old = {**self.report, 'checkedAt': (self.now - dt.timedelta(hours=1)).isoformat()}
        with self.assertRaisesRegex(ValueError, 'job window'):
            self.publication.audit(self.root, old, self.base, self.now)
        slug = next(iter(module.MANAGERS))
        path = self.root / 'public/data/investors' / (slug + '.json')
        payload = json.loads(path.read_text())
        payload['data']['snapshot']['holdings'][0]['weight'] = float('nan')
        path.write_text(json.dumps(payload))
        with self.assertRaises(ValueError):
            self.publication.audit(self.root, self.report, self.base, self.now)


if __name__ == '__main__':
    unittest.main()
