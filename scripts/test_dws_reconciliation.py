import copy
import datetime as dt
import json
import pathlib
import unittest

from collect_dws_etf import parse_holdings
from verify_dws_compositions import verify, collect


class VerificationTests(unittest.TestCase):
    def setUp(self):
        self.isin = 'IE00BM67HS53'
        self.now = dt.datetime(2026, 10, 14, 10, tzinfo=dt.timezone.utc)
        self.body = json.loads((pathlib.Path(__file__).parent / 'fixtures/radar-review-583' / f'{self.isin}.json').read_text())
        self.url = f'https://etf.dws.com/api/pdp/en-gb/etf/{self.isin}/holdings'
        self.record = parse_holdings(self.body, {'isin': self.isin}, self.now, self.url)

    def test_live_complete_source_matches_and_is_archived(self):
        proof = verify(self.isin, self.record, self.now, lambda url: self.body)
        self.assertEqual(proof['body'], self.body)
        self.assertEqual(proof['sourceHash'], self.record['countries']['sha256'])

    def test_wrong_weights_hash_date_or_partial_portfolio_never_confirm(self):
        for defect in ('weight', 'hash', 'date', 'complete'):
            record = copy.deepcopy(self.record)
            if defect == 'weight': record['countries']['rows'][0]['weightPct'] += 1
            if defect == 'hash': record['countries']['sha256'] = '0' * 64
            if defect == 'date': record['countries']['asOf'] = '2026-10-11'
            if defect == 'complete': record['countries']['complete'] = False
            with self.subTest(defect=defect), self.assertRaises(ValueError):
                verify(self.isin, record, self.now, lambda url: self.body)
        partial = copy.deepcopy(self.body)
        partial['tables'][0]['values'] = partial['tables'][0]['values'][:2]
        with self.assertRaises(ValueError):
            verify(self.isin, self.record, self.now, lambda url: partial)

    def test_network_failure_preserves_error_and_produces_no_proof(self):
        def fail(url): raise TimeoutError('DWS timeout')
        report = collect({self.isin: self.record}, self.now, fail)
        self.assertEqual(report['verified'], [])
        self.assertIn('DWS timeout', report['errors'][0]['reason'])


if __name__ == '__main__':
    unittest.main()
