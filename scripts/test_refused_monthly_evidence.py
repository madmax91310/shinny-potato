"""Real FCA notices: exact security, separate dates and currencies; no runtime admission."""
import gzip
import json
import unittest
from inspect_refused_monthly_evidence import EVIDENCE, hsbc_notice, replay


class RefusedEvidence(unittest.TestCase):
    def body(self, name='august'):
        return gzip.decompress((EVIDENCE / 'sources' / f'hsbc-fca-{name}.html.gz').read_bytes())

    def test_real_notices_distinguish_ex_record_payment_and_trading_units(self):
        expected = [('february', '2024-02-01', '2024-02-02', '2024-02-22', .2214),
                    ('august', '2024-08-08', '2024-08-09', '2024-08-30', 1.2623)]
        for name, ex, record, pay, amount in expected:
            with self.subTest(name=name):
                row = hsbc_notice(self.body(name))
                self.assertEqual([row[k] for k in ['exDate', 'recordDate', 'paymentDate', 'amount']],
                                 [ex, record, pay, amount])
                self.assertEqual(row['currency'], 'EUR')
                self.assertFalse(row['quoteCurrencyInferred'])

    def test_missing_share_and_duplicate_notices_are_rejected(self):
        with self.assertRaisesRegex(ValueError, 'exact HSBC security'):
            hsbc_notice(self.body(), 'IE000UNKNOWN0')
        with self.assertRaisesRegex(ValueError, 'duplicate'):
            hsbc_notice(self.body() + self.body())

    def test_neighbouring_dividend_currency_cannot_qualify_the_exact_share(self):
        body = self.body().replace(b'1.2623 EUR', b'1.2623 USD')
        with self.assertRaisesRegex(ValueError, 'currency'):
            hsbc_notice(body)

    def test_replay_keeps_the_unresolved_windows_refused(self):
        result = replay()
        self.assertEqual(result, json.loads((EVIDENCE / 'replay.json').read_text()))
        self.assertEqual(result['additionalQualifiedWindows'], 0)
        self.assertFalse(result['hsbc']['monthlyWindowRestored'])
        self.assertFalse(result['hsbc']['contradictionWithEuronextClosed'])
        self.assertFalse(result['hsbc']['providerPricesModified'])
        self.assertFalse(result['qualificationCriteriaChanged'])
        self.assertIn('cash adjustment not reconciled', result['blackrock']['refusal'])
        self.assertEqual(sum(not r['passed'] for r in result['blackrock']['cashChecks']), 2)
        self.assertTrue(all(not r['zeroDistributionsProven'] and not r['admitted'] for r in result['amundi']))
        self.assertEqual(result['bitwise']['publishedTimestamp'][:10], '2023-02-09')


if __name__ == '__main__':
    unittest.main()
