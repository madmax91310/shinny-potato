"""Ensure source updates change active records, without regressions or partial writes."""
import copy
import datetime as dt
import json
import pathlib
import tempfile
import unittest
from apply_etf_collection import apply, merge_collection
from data_automation import UTC
from update_bitcoin_monthly import collect, apply as apply_bitcoin

ROOT = pathlib.Path(__file__).resolve().parents[1]


class ActiveRefreshTests(unittest.TestCase):
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

    def test_no_commit_for_check_timestamp_only(self):
        first = merge_collection(self.report, {}, self.baseline)
        self.report['checkedAt'] = '2026-10-06T00:00:00+00:00'
        self.assertEqual(merge_collection(self.report, first, self.baseline), first)

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
