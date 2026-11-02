import copy
import datetime as dt
import gzip
import hashlib
import json
from pathlib import Path
import unittest
import subprocess
from unittest.mock import patch

from twentyone_shares_listing import URL, ISIN, decode_document, listing_rows
from collect_instrument_metadata import collect, fetch_document, parse_listings

FIX = Path(__file__).parent / 'fixtures/21shares-listing-20261102'
SOURCE = {'isin': ISIN, 'urls': [URL], 'listings': [
    {'ticker': 'ABTC', 'mic': 'XPAR', 'exchange': 'Euronext Paris', 'currency': 'EUR'}]}
NOW = dt.datetime(2026, 11, 2, 16, 42, tzinfo=dt.timezone.utc)


class OfficialListing(unittest.TestCase):
    def setUp(self):
        self.raw = (FIX / 'product.json.gz').read_bytes()
        self.body = gzip.decompress(self.raw)
        self.doc = json.loads(self.body)

    def rows(self, doc=None, source=None):
        return listing_rows(json.dumps(doc or self.doc).encode(), source or SOURCE, URL, '2026-11-02')

    def test_actual_wire_fixture_and_bounded_decoder(self):
        meta = json.loads((FIX / 'provenance.json').read_text())
        self.assertEqual(hashlib.sha256(self.raw).hexdigest(), meta['wireSha256'])
        self.assertEqual(decode_document(self.raw, URL, URL), self.body)
        self.assertEqual(decode_document(self.body, URL, URL), self.body)

    def test_exact_existing_quote_not_all_api_exchanges(self):
        rows = self.rows()
        self.assertEqual(len(rows), 1)
        self.assertEqual({k: rows[0][k] for k in SOURCE['listings'][0]}, SOURCE['listings'][0])
        self.assertNotIn('symbol', rows[0])  # No Yahoo symbol invented from Bloomberg.
        self.assertNotIn('nav_per_unit', rows[0])

    def test_other_or_unsuccessful_product_refused(self):
        for key, value in [('ticker', 'OTHER'), ('product_name', 'Another product'), ('details', None)]:
            doc = copy.deepcopy(self.doc); doc['data'][key] = value
            with self.subTest(key=key), self.assertRaises(ValueError): self.rows(doc)
        doc = copy.deepcopy(self.doc); doc['data']['details']['isin'] = 'DE000A27Z304'
        with self.assertRaises(ValueError): self.rows(doc)
        doc = copy.deepcopy(self.doc); doc['success'] = False
        with self.assertRaises(ValueError): self.rows(doc)

    def test_no_characteristic_inferred_from_nulls_or_nav_currency(self):
        values, errors = collect(SOURCE, NOW, fetch=lambda url: self.raw)
        self.assertEqual(errors, [])
        self.assertEqual(set(values), {'listings'})
        self.assertEqual(values['listings']['value'][0]['currency'], 'EUR')
        self.assertEqual(self.doc['data']['currency']['short_name'], 'USD')
        self.assertEqual(values['listings']['sha256'], hashlib.sha256(self.body).hexdigest())

    def test_missing_duplicate_or_other_currency_quote_refused(self):
        for mode in ['missing', 'duplicate', 'currency', 'ticker']:
            doc = copy.deepcopy(self.doc)
            venue = next(r for r in doc['data']['exchanges'] if r['exchange'] == 'Euronext Paris')
            if mode == 'missing': venue['local_tickers'] = []
            if mode == 'duplicate': venue['local_tickers'] *= 2
            if mode == 'currency': venue['local_tickers'][0]['currency'] = 'USD'
            if mode == 'ticker': venue['local_tickers'][0]['name'] = 'BTCU FP'
            with self.subTest(mode=mode), self.assertRaises(ValueError): self.rows(doc)

    def test_duplicate_venue_refused(self):
        doc = copy.deepcopy(self.doc)
        doc['data']['exchanges'].append(copy.deepcopy(next(r for r in doc['data']['exchanges'] if r['exchange'] == 'Euronext Paris')))
        with self.assertRaises(ValueError): self.rows(doc)

    def test_configured_identity_and_currency_not_overwritten(self):
        for key, value in [('currency', 'USD'), ('mic', 'XLON'), ('ticker', 'BTCU')]:
            source = copy.deepcopy(SOURCE); source['listings'][0][key] = value
            with self.subTest(key=key), self.assertRaises(ValueError): self.rows(source=source)

    def test_future_or_undated_response_refused(self):
        for value in ['2026-11-03T00:00:00Z', '2026-11-02T00:00:00', None]:
            doc = copy.deepcopy(self.doc); doc['lastUpdated'] = value
            with self.subTest(value=value), self.assertRaises(ValueError): self.rows(doc)

    def test_route_and_redirect_refused(self):
        for url in [URL+'?other=1', URL.replace('ABTC', 'CBTC'), 'https://example.com/product']:
            with self.subTest(url=url), self.assertRaises(ValueError): decode_document(self.raw, URL, url)

    def test_invalid_and_truncated_gzip_refused(self):
        for raw in [self.raw[:-12], b'\x1f\x8bnotgzip']:
            with self.assertRaises(ValueError): decode_document(raw, URL, URL)

    def test_decoded_size_is_bounded(self):
        with patch('twentyone_shares_listing.MAX_BYTES', 200):
            with self.assertRaisesRegex(ValueError, 'decoded document'): decode_document(gzip.compress(b'A'*201), URL, URL)

    def test_changed_or_duplicate_json_structure_refused(self):
        for raw in [b'[]', b'{"success":true,"success":true}', b'<html>Unavailable</html>']:
            with self.assertRaises(ValueError): listing_rows(raw, SOURCE, URL, '2026-11-02')

    def test_failure_does_not_become_source_evidence(self):
        values, errors = collect(SOURCE, NOW, fetch=lambda url: self.raw[:-12])
        self.assertEqual(values, {})
        self.assertTrue(errors)

    def test_native_collector_boundary_and_qualified_rows(self):
        body, url = fetch_document(URL, fetch=lambda url: self.raw, isin=ISIN)
        rows = parse_listings(body, SOURCE, url, '2026-11-02')
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['sourceUrl'], URL)
        self.assertIn(ISIN, rows[0]['evidenceId'])

    def test_shared_consumer_admits_official_origin_not_an_unregistered_mirror(self):
        code = """import assert from 'node:assert/strict';
import {officialListingSource} from './src/data/qualified-listings.js';
assert(officialListingSource({sourceUrl:'https://api.primary.21shares.com/api/product_details/ABTC'}));
for(const sourceUrl of ['http://api.primary.21shares.com/api/product_details/ABTC',
'https://api.primary.21shares.com.evil.invalid/api/product_details/ABTC',
'https://extraetf.com/fr/etf-profile/CH0454664001'])assert(!officialListingSource({sourceUrl}));
"""
        subprocess.run(['node','--input-type=module','-e',code],cwd=Path(__file__).parents[1],check=True)


if __name__ == '__main__': unittest.main()
