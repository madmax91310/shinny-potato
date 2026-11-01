"""Actual unmodified Yahoo/Nasdaq responses; all mutations remain isolated."""
import copy
import datetime as dt
import gzip
import hashlib
import json
from pathlib import Path
import unittest
from unittest.mock import patch

from data_automation import UTC
from refresh_monthly_history import collect_yahoo, collect_one, refresh

FIXTURES = Path(__file__).parent / 'fixtures/starbucks-month-close-20261101'
NOW = dt.datetime(2026, 11, 1, 19, tzinfo=UTC)


class OfficialClosingPrice(unittest.TestCase):
    def setUp(self):
        manifest = json.loads((FIXTURES/'manifest.json').read_text())
        self.config = next(row for row in json.loads((FIXTURES.parents[1]/'monthly-automation.json').read_text())['series'] if row['id'] == 'sbux')
        self.assertEqual(self.config, {k:v for k,v in manifest['config'].items() if k != 'terminalCloseCorroboration'})
        self.raw = {}
        for name, proof in manifest['responses'].items():
            body = gzip.decompress((FIXTURES/(name+'.json.gz')).read_bytes())
            self.assertEqual(hashlib.sha256(body).hexdigest(), proof['sha256'])
            self.raw[proof['sourceUrl']] = json.loads(body)
        self.daily = next(u for u in self.raw if 'interval=1d' in u)
        self.monthly = next(u for u in self.raw if 'interval=1mo' in u)
        self.info = next(u for u in self.raw if '/info?' in u)
        self.history = next(u for u in self.raw if '/historical?' in u)

    def collect(self, raw=None, config=None):
        raw = raw or self.raw
        return collect_yahoo(config or self.config, NOW, lambda url: copy.deepcopy(raw[url]))

    def test_distinct_quote_never_reprices_or_readjusts_the_history(self):
        with patch('nasdaq_month_close.supports', return_value=False):
            with self.assertRaisesRegex(ValueError, 'Shifted/duplicate'):
                self.collect()
        result = self.collect()
        healthy = copy.deepcopy(self.raw)
        block = healthy[self.monthly]['chart']['result'][0]
        count = len(block['timestamp'])
        block['timestamp'] = block['timestamp'][:-1]
        for series in block['indicators'].values():
            for values in series:
                for key, value in values.items():
                    if isinstance(value, list) and len(value) == count:
                        values[key] = value[:-1]
        reference = self.collect(healthy)
        for key in ('points', 'anniversaryPoints', 'proofRows'):
            self.assertEqual(result[key], reference[key])
        self.assertEqual(result['points'][-1], ['2026-10', 103.669998])
        proof = result['terminalMonthlyQuoteEvidence']['corroboration']
        self.assertEqual(proof['officialClose'], 103.67)
        self.assertEqual(proof['isin'], 'US8552441094')
        self.assertFalse(proof['providerQuoteDiscrepancyExplained'])
        self.assertEqual(result, self.collect(), 'Repeated acquisition neither rescales nor double-adjusts prices')

    def test_official_identity_format_dates_and_price_fail_closed(self):
        mutations = [
            lambda d:d[self.info]['data'].update(symbol='OTHER'),
            lambda d:d[self.info]['data'].update(stockType='ETF'),
            lambda d:d[self.info]['data'].update(companyName='Other share class'),
            lambda d:d[self.info]['data'].update(isNasdaqListed=1),
            lambda d:d[self.info].update(data=None),
            lambda d:d[self.history]['status'].update(rCode=403),
            lambda d:d[self.history]['data'].update(symbol='OTHER'),
            lambda d:d[self.history]['data'].update(totalRecords=100),
            lambda d:d[self.history]['data']['tradesTable'].update(rows=[]),
            lambda d:d[self.history]['data']['tradesTable']['headers'].update(close='Indicative price'),
            lambda d:d[self.history]['data']['tradesTable']['rows'][0].update(date='10/29/2026'),
            lambda d:d[self.history]['data']['tradesTable']['rows'][0].update(close='$103.65'),
            lambda d:d[self.history]['data']['tradesTable']['rows'][0].update(close='€103.67'),
            lambda d:d[self.monthly]['chart']['result'][0]['meta'].update(currency='EUR'),
            lambda d:d[self.monthly]['chart']['result'][0]['meta'].update(regularMarketTime=1793390401),
        ]
        for mutate in mutations:
            with self.subTest(mutation=mutate.__code__.co_firstlineno):
                raw = copy.deepcopy(self.raw);mutate(raw)
                with self.assertRaises((ValueError, KeyError, TypeError)):
                    self.collect(raw)

    def test_corroboration_is_not_a_rounding_tolerance_or_generic_bypass(self):
        from nasdaq_month_close import qualify
        block = self.raw[self.monthly]['chart']['result'][0]
        canonical, quote = block['indicators']['quote'][0]['close'][-2:]
        for key in ('id','symbol','currency','timezone','consumerScope','instrumentType','isin'):
            with self.subTest(key=key):
                with self.assertRaises(ValueError):
                    qualify({**self.config,key:'OTHER'}, dt.date(2026,10,30), canonical,
                            canonical, quote, block['meta'], lambda _: self.fail('Wrong instrument must not consult Nasdaq'))
        with patch('nasdaq_month_close.POLICY', 'unqualified-route'):
            with self.assertRaises(ValueError):self.collect()
        raw = copy.deepcopy(self.raw)
        # Both Yahoo historical candles agree, but not with the exact decimal
        # or binary32 representation of the Nasdaq cent quotation.
        for url, index in ((self.daily,-1),(self.monthly,-2)):
            raw[url]['chart']['result'][0]['indicators']['quote'][0]['close'][index] += .001
        with self.assertRaisesRegex(ValueError,'Official Nasdaq close differs'):
            self.collect(raw)

    def test_real_refresh_preserves_last_good_record_on_official_outage_and_is_idempotent(self):
        collected = self.collect()
        with patch('refresh_monthly_history.collect_yahoo', return_value=collected):
            record = collect_one(self.config, NOW)
        prior = {**record,'periodEnd':'2026-09','points':record['points'][:-1],
                 'anniversaryPoints':record['anniversaryPoints'][:-1],'checkedAt':'2026-10-31'}
        baseline = {'sbux':{'currency':'USD','points':[{'date':d,'price':v}for d,v in prior['points']]}}
        active, report = refresh({'series':[self.config]}, {'sbux':prior}, baseline, NOW, lambda *_:record)
        self.assertEqual(report['series'][0]['status'],'validated')
        again, second = refresh({'series':[self.config]}, active, baseline, NOW, lambda *_:record)
        self.assertEqual(active, again)
        self.assertEqual(second['series'][0]['status'],'validated')
        failed, outage = refresh({'series':[self.config]}, active, baseline, NOW+dt.timedelta(days=1),
            lambda *_:(_ for _ in ()).throw(TimeoutError('Official corroboration unavailable')))
        self.assertEqual(failed,active)
        self.assertEqual(outage['series'][0]['status'],'failed')


if __name__ == '__main__':
    unittest.main()
