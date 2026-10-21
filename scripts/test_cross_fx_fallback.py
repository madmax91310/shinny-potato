import datetime as dt
import unittest
from collect_ranking_sources import cross_fx_document, CROSS_SERIES, parse_cross_fx, parse_fred_series
from test_ranking_sources import fred, document
from data_automation import UTC


class CrossFxFallback(unittest.TestCase):
    def test_transport_fallback_keeps_exact_series_and_source_attempts(self):
        calls = []
        def fetch(url, **policy):
            calls.append((url, policy))
            if len(calls) == 1: raise TimeoutError('temporary timeout')
            return fred([('1999-01-29', 32), ('1999-02-26', 33)])
        now = dt.datetime(1999, 3, 12, tzinfo=UTC)
        raw, url, attempts = cross_fx_document('TWD', now, fetch)
        self.assertIn('cosd=1999-01-01&coed=1999-03-12', calls[0][0])
        self.assertEqual(url, CROSS_SERIES['TWD'])
        self.assertEqual(len(attempts), 2)
        self.assertEqual([p['max_attempts'] for _, p in calls], [2, 2])
        rate = parse_cross_fx(raw, document([('1999-01-29', 1.2), ('1999-02-26', 1.35)]), now, source_url=url)
        self.assertEqual(rate['observations']['1999-02']['value'], 44.55)
        self.assertEqual(rate['sourceUrl'], url)

    def test_invalid_financial_document_cannot_trigger_an_access_fallback(self):
        calls = []
        def fetch(url, **policy): calls.append(url); return b'observation_date,DEXJPUS\n1999-01-29,32'
        now = dt.datetime(1999, 3, 12, tzinfo=UTC)
        raw, url, _ = cross_fx_document('TWD', now, fetch)
        with self.assertRaisesRegex(ValueError, 'Wrong FRED'):
            parse_fred_series(raw, 'DEXTAUS')
        self.assertEqual(len(calls), 1)

    def test_all_access_failures_remain_errors(self):
        def fetch(*args, **kwargs): raise TimeoutError('offline')
        with self.assertRaisesRegex(ValueError, 'access failed'):
            cross_fx_document('TWD', dt.datetime(2026, 10, 21, tzinfo=UTC), fetch)


if __name__ == '__main__': unittest.main()
