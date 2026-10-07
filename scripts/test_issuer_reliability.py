"""Outages must recover only through qualified sources and preserve unrelated data."""
import copy
import datetime as dt
import html
import json
import pathlib
import tempfile
import unittest
import urllib.error
from unittest.mock import patch
from data_automation import UTC, ResponseFormatError, retry_delay, get_text
from issuer_documents import download
from collect_etf_pilot import collect, fetch_product, apply_valid_shares
from collect_public_issuer import collect_one as public_collect, globalx
from apply_etf_collection import merge_collection

ROOT = pathlib.Path(__file__).resolve().parents[1]
FIX = ROOT / 'scripts/fixtures'
NOW = dt.datetime(2026, 10, 7, tzinfo=UTC)
SHARE = {'isin': 'IE00B4L5Y983', 'productId': 251882, 'currency': 'USD', 'requireFullHistory': False}
CONFIG = json.loads((ROOT/'scripts/additional-etf-sources.json').read_text())['instruments']


def share(isin):
    return next(s for s in CONFIG if s['isin'] == isin)


def components():
    return json.loads((FIX/'ishares-world-pilot.json').read_text())


def markup(c):
    return ''.join('<walrus-render-on-client componentprops="' + html.escape(json.dumps(v), quote=True) + '"></walrus-render-on-client>' for v in c.values())


def payload(c=None):
    return {'productId': 251882, 'currencyCode': 'USD', 'componentsByNameMap': c or components()}


class Reliability(unittest.TestCase):
    def test_retry_after_seconds_date_cap_invalid_and_terminal_errors(self):
        def e(value):
            return urllib.error.HTTPError('https://issuer.test', 429, 'limited', {'Retry-After': value}, None)
        self.assertEqual(retry_delay(e('12'), 0), 12)
        self.assertEqual(retry_delay(e('99999'), 0), 30)
        self.assertEqual(retry_delay(e('Wed, 07 Oct 2026 00:00:15 GMT'), 0, NOW), 15)
        for value in ('bad', '-1', 'NaN', 'inf'):
            self.assertEqual(retry_delay(e(value), 1), 2)
        for code in (403, 404):
            error = urllib.error.HTTPError('https://issuer.test', code, 'denied', {}, None)
            with patch('data_automation.urllib.request.urlopen', side_effect=error) as opener:
                with self.assertRaises(urllib.error.HTTPError):
                    get_text('https://issuer.test', ('text/html',), opener=opener, sleep=lambda _: None)
                self.assertEqual(opener.call_count, 1)
        with patch('issuer_documents.urllib.request.build_opener') as builder, patch('issuer_documents.time.sleep') as sleep:
            builder.return_value.open.side_effect = [e('12'), e('99999'), e('1')]
            with self.assertRaises(urllib.error.HTTPError): download('https://issuer.test/file.pdf')
            self.assertEqual([c.args[0] for c in sleep.call_args_list], [12, 30])

    def test_ishares_api_outage_recovers_exact_share_from_current_html(self):
        error = urllib.error.HTTPError('https://issuer.test', 403, 'denied', {}, None)
        for failure in (error, TimeoutError(), ResponseFormatError('consent page')):
            with patch('collect_etf_pilot.get_text', side_effect=failure), patch('issuer_documents.public_page', return_value=markup(components())):
                report = collect({'instruments': [SHARE]}, {SHARE['isin']: {}}, NOW, fetch=lambda *a: (_ for _ in ()).throw(failure))
            self.assertEqual(report['failures'], [])
            result = report['shares'][0]
            self.assertEqual(result['performance']['years']['2025'], 21.16)
            self.assertIn('/products/251882/', result['sourceUrl'])
            self.assertEqual(result['sourceAttempts'][-1]['status'], 'validated')

    def test_ishares_valid_wrong_or_corrupt_api_never_uses_fallback(self):
        bad = payload(); bad['productId'] = 999
        with patch('issuer_documents.public_page') as fallback:
            report = collect({'instruments': [SHARE]}, {SHARE['isin']: {}}, NOW, fetch=lambda *a: json.dumps(bad))
            self.assertEqual(len(report['failures']), 1); fallback.assert_not_called()
            with self.assertRaises(json.JSONDecodeError): fetch_product(SHARE, lambda *a: 'not json')
            fallback.assert_not_called()

    def test_ishares_wrong_or_stale_fallback_is_rejected(self):
        for key, value in [('isin', 'WRONG'), ('seriesBaseCurrencyCode', 'EUR')]:
            c = components(); c['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap'][key]['value'] = value
            with patch('issuer_documents.public_page', return_value=markup(c)):
                report = collect({'instruments': [SHARE]}, {SHARE['isin']: {}}, NOW, fetch=lambda *a: (_ for _ in ()).throw(TimeoutError()))
            self.assertFalse(report['shares']); self.assertEqual(len(report['failures']), 1)
        with patch('issuer_documents.public_page', return_value=markup(components())):
            report = collect({'instruments': [SHARE]}, {SHARE['isin']: {}}, dt.datetime(2027, 1, 1, tzinfo=UTC), fetch=lambda *a: (_ for _ in ()).throw(TimeoutError()))
        self.assertFalse(report['shares'])

    def test_one_failed_ishares_keeps_healthy_share_and_previous_failed_record(self):
        other = {**SHARE, 'isin': 'FAILED', 'productId': 2}
        def fetch(url, *args):
            if 'portfolioId=2&' in url: raise TimeoutError('offline')
            return json.dumps(payload())
        with patch('issuer_documents.public_page', side_effect=TimeoutError('also offline')):
            report = collect({'instruments': [other, SHARE]}, {SHARE['isin']: {}}, NOW, fetch)
        self.assertEqual([s['isin'] for s in report['shares']], [SHARE['isin']])
        self.assertEqual(report['failures'][0]['isin'], 'FAILED')
        previous = {'FAILED': {'currency': 'USD', 'productId': 2, 'sourceUrl': 'https://issuer.test', 'characteristics': {'terPct': 0.2, 'checkedAt': '2026-10-01'}}}
        merged = merge_collection(report, previous, {})
        self.assertEqual(merged['FAILED'], previous['FAILED']); self.assertIn(SHARE['isin'], merged)

    def test_missing_holdings_does_not_discard_valid_api_fees_and_returns(self):
        s = {**SHARE, 'collectHoldings': True}
        report = collect({'instruments': [s]}, {s['isin']: {}}, NOW, lambda *a: json.dumps(payload()))
        self.assertFalse(report['failures']); r = report['shares'][0]
        self.assertEqual(r['collectionErrors'][0]['field'], 'holdings')
        self.assertIn('aum', r); self.assertIn('performance', r); self.assertNotIn('holdings', r)

    def test_merge_rejection_preserves_that_record_and_applies_healthy_lot_atomically(self):
        report = collect({'instruments': [SHARE]}, {SHARE['isin']: {}}, NOW, lambda *a: json.dumps(payload()))
        bad = copy.deepcopy(report['shares'][0]); bad['isin'] = 'FAILED'; bad['productId'] = 2
        bad['sectors']['rows'][0]['name'] = 'Unqualified new sector'
        report['shares'].insert(0, bad)
        previous = {'FAILED': {'currency': 'USD', 'productId': 2, 'sourceUrl': 'https://issuer.test', 'characteristics': {'terPct': .2}}}
        with tempfile.TemporaryDirectory() as folder:
            path = pathlib.Path(folder)/'active.json'; path.write_text(json.dumps(previous))
            self.assertTrue(apply_valid_shares(report, path, {}))
            merged = json.loads(path.read_text())
        self.assertEqual(merged['FAILED'], previous['FAILED'])
        self.assertIn(SHARE['isin'], merged)
        self.assertEqual(report['failures'][0]['isin'], 'FAILED')
        self.assertEqual(len(report['shares']), 1)

    def test_wisdomtree_transport_format_fallback_and_identity_failure(self):
        s = share('IE00BZ56SW52')
        with patch('collect_public_issuer.get_text', side_effect=ResponseFormatError('blocked')), patch('collect_public_issuer.download', return_value=b'%PDF-test'), patch('collect_public_issuer.wisdomtree_factsheet', return_value={'sourceUrl': s['factsheetUrl']}) as pdf:
            result = public_collect(s, NOW)
        self.assertEqual(result['sourceAttempts'][-1]['url'], s['factsheetUrl']); pdf.assert_called_once()
        text = (FIX/'official-documents/new-issuers/wisdomtree.html').read_text().replace(s['isin'], 'IE00WRONG000')
        with patch('collect_public_issuer.get_text', return_value=text), patch('collect_public_issuer.download') as pdf:
            with self.assertRaises(ValueError): public_collect(s, NOW)
            pdf.assert_not_called()

    def test_qyld_route_fallback_and_dated_block_scope(self):
        s = share('IE00BM8R0J59'); text = (FIX/'official-documents/new-issuers/globalx.html').read_text()
        # An unrelated navigation amount must never be selected.
        text = '<p>Fund AUM</p><p>$1.00</p>' + text
        with patch('collect_public_issuer.public_page', side_effect=[TimeoutError('offline'), text]):
            result = public_collect(s, NOW)
        self.assertEqual(result['aum']['amount'], 952012772.68)
        self.assertEqual(result['sourceUrl'], s['fallbackUrls'][0])
        self.assertNotIn('performance', result); self.assertNotIn('holdings', result)
        with patch('collect_public_issuer.public_page', return_value=text.replace(s['isin'], 'WRONG')) as fetch:
            with self.assertRaises(ValueError): public_collect(s, NOW)
            self.assertEqual(fetch.call_count, 1)
        for bad in (text.replace('05 Oct 2026', '05 Jan 2026'), text + text):
            with self.assertRaises(ValueError): globalx(bad, s, NOW)
        with patch('collect_public_issuer.public_page', side_effect=TimeoutError('offline')) as fetch:
            with self.assertRaises(TimeoutError): public_collect(s, NOW)
            self.assertEqual(fetch.call_count, 2)


if __name__ == '__main__': unittest.main()
