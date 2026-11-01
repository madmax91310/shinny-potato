"""Real AMZN response regression; no live request and no published test prices."""
import copy
import datetime as dt
import gzip
import hashlib
import json
from pathlib import Path
import unittest

from refresh_monthly_history import collect_yahoo
from data_automation import UTC

FIXTURES = Path(__file__).parent / 'fixtures/yahoo-terminal-monthly-20261101'
NOW = dt.datetime(2026, 11, 1, tzinfo=UTC)


class TerminalQuote(unittest.TestCase):
    def setUp(self):
        manifest = json.loads((FIXTURES / 'manifest.json').read_text())
        self.config = manifest['config']
        self.raw = {}
        for interval, name in [('1d', 'daily'), ('1mo', 'monthly')]:
            body = gzip.decompress((FIXTURES / (name + '.json.gz')).read_bytes())
            self.assertEqual(hashlib.sha256(body).hexdigest(), manifest['responses'][name]['sha256'])
            self.raw[interval] = json.loads(body)

    def run_source(self, raw=None):
        raw = raw or self.raw
        def fetch(url):
            return copy.deepcopy(raw['1mo' if 'interval=1mo' in url else '1d'])
        return collect_yahoo(self.config, NOW, fetch)

    def test_real_terminal_quote_does_not_change_any_financial_point(self):
        result = self.run_source()
        without_quote = copy.deepcopy(self.raw)
        monthly = without_quote['1mo']['chart']['result'][0]
        monthly['timestamp'].pop()
        for group in monthly['indicators'].values():
            for row in group:
                for values in row.values():
                    values.pop()
        canonical = self.run_source(without_quote)
        for field in ['points', 'proofRows', 'anniversaryPoints']:
            self.assertEqual(result[field], canonical[field], field)
        self.assertEqual(len(result['points']), 251)
        self.assertEqual(result['points'][-1][0], '2026-10')
        evidence = result['terminalMonthlyQuoteEvidence']
        self.assertEqual(evidence['sessionDate'], '2026-10-30')
        self.assertEqual(evidence['close'], evidence['monthlyClose'])
        self.assertEqual(evidence['close'], evidence['dailyClose'])
        self.assertNotIn('terminalMonthlyQuoteEvidence', canonical)

    def test_any_missing_identity_date_or_exact_price_proof_still_refuses(self):
        for mutation in ['quote-price', 'monthly-price', 'daily-price', 'market-time',
                         'missing-market-time', 'session-date', 'two-terminal-quotes',
                         'historical-shift', 'symbol', 'currency']:
            raw = copy.deepcopy(self.raw)
            monthly = raw['1mo']['chart']['result'][0]
            daily = raw['1d']['chart']['result'][0]
            if mutation == 'quote-price': monthly['indicators']['quote'][0]['close'][-1] += .000001
            if mutation == 'monthly-price': monthly['indicators']['quote'][0]['close'][-2] += .000001
            if mutation == 'daily-price': daily['indicators']['quote'][0]['close'][-1] += .000001
            if mutation == 'market-time': monthly['meta']['regularMarketTime'] -= 1
            if mutation == 'missing-market-time': monthly['meta'].pop('regularMarketTime')
            if mutation == 'session-date': monthly['timestamp'][-1] -= 86400
            if mutation == 'two-terminal-quotes':
                monthly['timestamp'].append(monthly['timestamp'][-1]+1)
                monthly['meta']['regularMarketTime'] = monthly['timestamp'][-1]
                for group in monthly['indicators'].values():
                    for row in group:
                        for values in row.values(): values.append(values[-1])
            if mutation == 'historical-shift': monthly['timestamp'][-5] += 86400
            if mutation == 'symbol': monthly['meta']['symbol'] = 'OTHER'
            if mutation == 'currency': monthly['meta']['currency'] = 'EUR'
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                self.run_source(raw)


if __name__ == '__main__':
    unittest.main()
