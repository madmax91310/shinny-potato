"""Synthetic transport/market fixtures: never imported by the application."""
import datetime as dt
import email.message
import io
import json
import pathlib
import tempfile
import unittest
import urllib.error

from data_automation import UTC, completed_month_window, get_json, write_json_atomic
from probe_bitcoin_monthly import BASE, collect, compare, extract_monthly, refresh, summary

NOW = dt.datetime(2026, 10, 3, 10, tzinfo=UTC)
START, END = completed_month_window(NOW)
PRODUCT = {'id': 'BTC-USD', 'base_currency': 'BTC', 'quote_currency': 'USD'}


def candles(start=START, end=END):
    rows = []
    day = start
    while day < end:
        # Deliberately different open/close to catch selecting the opening price.
        rows.append([int(day.timestamp()), 90, 110, 95, 100, 1])
        day += dt.timedelta(days=1)
    return list(reversed(rows))


def baseline():
    return {'assetId': 'bitcoin', 'currency': 'USD',
            'points': [{'date': f'2026-{month:02}', 'price': 99} for month in range(4, 10)]}


class JsonResponse(io.BytesIO):
    def __init__(self, body, content_type='application/json'):
        super().__init__(body)
        self.headers = email.message.Message()
        self.headers['Content-Type'] = content_type


class AutomationTests(unittest.TestCase):
    def test_utc_window_year_boundary_and_timezone(self):
        start, end = completed_month_window(dt.datetime(2027, 1, 1, tzinfo=UTC))
        self.assertEqual(start.isoformat(), '2026-07-01T00:00:00+00:00')
        self.assertEqual(end.isoformat(), '2027-01-01T00:00:00+00:00')
        local = dt.datetime(2026, 10, 1, 1, tzinfo=dt.timezone(dt.timedelta(hours=2)))
        self.assertEqual(completed_month_window(local)[1].month, 9)

    def test_close_not_open_unsorted_and_outside_window(self):
        data = candles()
        data += [[int(END.timestamp()), 90, 110, 95, 109, 1]]
        points = extract_monthly(data, START, END)
        self.assertEqual(len(points), 6)
        self.assertEqual(points[-1], {'date': '2026-09', 'price': 100, 'sourceDate': '2026-09-30'})

    def test_leap_day_missing_candle_and_duplicate(self):
        start = dt.datetime(2024, 2, 1, tzinfo=UTC)
        end = dt.datetime(2024, 3, 1, tzinfo=UTC)
        data = candles(start, end)
        self.assertEqual(extract_monthly(data, start, end)[0]['sourceDate'], '2024-02-29')
        for broken in (data[1:], data + data[:1]):
            with self.assertRaises(ValueError):
                extract_monthly(broken, start, end)

    def test_invalid_numeric_schema_ohlc_and_bucket(self):
        for index, value in [(4, float('nan')), (4, float('inf')), (4, True), (4, 0),
                             (4, 120), (0, int(START.timestamp()) + 3600), (5, -1)]:
            with self.subTest(index=index, value=value):
                data = candles()
                data[0][index] = value
                with self.assertRaises(ValueError):
                    extract_monthly(data, START, END)
        with self.assertRaises(ValueError):
            extract_monthly({'message': 'unavailable'}, START, END)

    def test_matching_prices_never_authorize_splicing(self):
        active = baseline()
        for point in active['points']:
            point['price'] = 100
        comparison = compare(extract_monthly(candles(), START, END), active)
        self.assertEqual(comparison['maxAbsoluteDifferencePct'], 0)
        self.assertFalse(comparison['automaticConnectionAllowed'])

    def test_wrong_identity_baseline_currency_and_missing_overlap(self):
        with self.assertRaises(ValueError):
            collect(baseline(), NOW, lambda url: {**PRODUCT, 'quote_currency': 'EUR'})
        for active in ({**baseline(), 'currency': 'EUR'},
                       {**baseline(), 'points': [{'date': '2020-01', 'price': 99}]},
                       {**baseline(), 'points': baseline()['points'] * 2}):
            with self.assertRaises(ValueError):
                compare(extract_monthly(candles(), START, END), active)

    def test_preserve_previous_report_after_fetch_or_validation_failure(self):
        with tempfile.TemporaryDirectory() as directory:
            destination = pathlib.Path(directory) / 'report.json'
            destination.write_text('previous evidence')
            for fetch in (lambda url: (_ for _ in ()).throw(TimeoutError()),
                          lambda url: PRODUCT if url == BASE else candles()[1:]):
                with self.assertRaises((ValueError, TimeoutError)):
                    refresh(destination, baseline(), NOW, fetch)
                self.assertEqual(destination.read_text(), 'previous evidence')
            report = refresh(destination, baseline(), NOW, lambda url: PRODUCT if url == BASE else candles())
            self.assertEqual(json.loads(destination.read_text()), report)
            self.assertEqual(report['periodEnd'], '2026-09')
            self.assertIn('Observation uniquement', summary(report))

    def test_http_retries_are_bounded_and_html_rejected(self):
        calls, waits = [], []
        def opener(request, timeout):
            calls.append(request.full_url)
            if len(calls) < 3:
                raise urllib.error.HTTPError(request.full_url, 429, 'limited', {}, None)
            return JsonResponse(b'{"ok": true}')
        self.assertEqual(get_json(BASE, opener, waits.append), {'ok': True})
        self.assertEqual(len(calls), 3)
        self.assertEqual(waits, [1, 2])
        with self.assertRaises(ValueError):
            get_json(BASE, lambda request, timeout: JsonResponse(b'<html>blocked</html>', 'text/html'))
        with self.assertRaises(ValueError):
            get_json(BASE, lambda request, timeout: JsonResponse(b'{"price": NaN}'))

    def test_transport_failure_is_not_silenced(self):
        attempts = []
        def opener(request, timeout):
            attempts.append(1)
            raise urllib.error.URLError('offline')
        with self.assertRaises(urllib.error.URLError):
            get_json(BASE, opener, lambda delay: None)
        self.assertEqual(len(attempts), 3)

    def test_upstream_503_page_with_200_json_retries_then_recovers(self):
        calls, waits = [], []
        def opener(request, timeout):
            calls.append(request.full_url)
            return JsonResponse(b'<html><head><title>503 Service Temporarily Unavailable</title></head></html>' if len(calls) < 3 else b'{"ok": true}')
        self.assertEqual(get_json(BASE, opener, waits.append), {'ok': True})
        self.assertEqual(waits, [1, 2])
        self.assertEqual(len(calls), 3)

    def test_upstream_error_exhausts_retries_but_bad_json_is_not_retried(self):
        for body, attempts in [(b'<html><title>502 Bad Gateway</title></html>', 3),
                               (b'<html>sign in</html>', 1), (b'{broken', 1),
                               (b'{"price": NaN}', 1)]:
            calls = []
            def opener(request, timeout):
                calls.append(1)
                return JsonResponse(body)
            with self.assertRaises((ValueError, urllib.error.HTTPError)):
                get_json(BASE, opener, lambda _: None)
            self.assertEqual(len(calls), attempts)

    def test_invalid_json_never_truncates_existing_report(self):
        with tempfile.TemporaryDirectory() as directory:
            destination = pathlib.Path(directory) / 'report.json'
            destination.write_text('previous evidence')
            with self.assertRaises(ValueError):
                write_json_atomic(destination, {'price': float('nan')})
            self.assertEqual(destination.read_text(), 'previous evidence')


if __name__ == '__main__':
    unittest.main()
