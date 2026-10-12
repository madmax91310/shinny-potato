import datetime as dt
from pathlib import Path
import unittest
from unittest.mock import patch
from collect_presentation_performance import SOURCES, parse, refresh

FIXTURES = Path(__file__).parent/'fixtures/presentation-performance'
NOW = dt.datetime(2026, 10, 12, tzinfo=dt.timezone.utc)
FILES = ['FR001400U5Q4.txt', 'LU2970735911.txt', 'SPEA.txt', 'qntm.txt']

class PerformanceTests(unittest.TestCase):
    def test_exact_shares_and_periods(self):
        expected = [15.44, .39, 16.26, 17.47]
        for share, filename, ytd in zip(SOURCES, FILES, expected):
            with self.subTest(isin=share['isin']):
                result = parse((FIXTURES/filename).read_text(), share, NOW)
                self.assertEqual(result['years'], {})
                self.assertEqual(result['currency'], share['currency'])
                self.assertEqual(result['asOf'], '2026-09-30')
                self.assertEqual(next(o['value'] for o in result['observations'] if o['label']=='Depuis janvier'), ytd)
                self.assertFalse(any(o['label']=='Depuis le lancement' for o in result['observations']) if share['parser']!='amundi' else False)
                with self.assertRaises(ValueError): parse((FIXTURES/filename).read_text().replace(share['isin'],'WRONGSHARE00'), share, NOW)
                with self.assertRaises(ValueError): parse((FIXTURES/filename).read_text(), share, NOW + dt.timedelta(days=300))

    def test_vaneck_standalone_header_is_not_the_fund_row(self):
        text = (FIXTURES/'qntm.txt').read_text().replace('Performance History (%)', 'Performance History (%)\nETF')
        text = text.replace('ETF                                              0.55', 'Reinvestment                   ETF                                              0.55')
        result = parse(text, SOURCES[3], NOW)
        self.assertEqual(result['observations'][2]['value'], 17.47)

    def test_benchmark_is_never_used(self):
        text = (FIXTURES/'FR001400U5Q4.txt').read_text()
        text = text.replace('15,55%', '999,55%')
        result = parse(text, SOURCES[0], NOW)
        self.assertEqual(result['observations'][0]['value'], 15.44)
        with self.assertRaises((ValueError, TypeError)):
            parse(text.replace(' Portefeuille', ' RemovedFund'), SOURCES[0], NOW)

    def test_failure_preserves_records_and_is_reported(self):
        current = {s['isin']: {'sentinel': True} for s in SOURCES}
        def fail(url): raise ValueError('transport unavailable')
        merged, report = refresh(current, NOW, fetch=fail)
        self.assertEqual(merged, current)
        self.assertTrue(all(r['status']=='failed' for r in report['shares']))

if __name__ == '__main__': unittest.main()
