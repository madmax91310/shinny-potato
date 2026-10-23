import copy
import datetime as dt
import unittest
from collect_ranking_sources import parse_fx, parse_cross_fx, apply_cross_rates, validate_record
from data_automation import UTC


def document(rows):
    return ('<Envelope xmlns="http://www.gesmes.org/xml/2002-08-01"><Cube xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref">' + ''.join(
        f'<Cube time="{day}"><Cube currency="USD" rate="{rate}"/></Cube>' for day, rate in rows) + '</Cube></Envelope>').encode()


def fred(rows, header='observation_date,DEXTAUS'):
    return (header + '\n' + ''.join(f'{day},{value}\n' for day, value in rows)).encode()


class RankingSourcesTest(unittest.TestCase):
    def test_cross_rate_uses_decimal_half_up_at_exact_ties(self):
        from collect_ranking_sources import cross_value
        self.assertEqual(cross_value(33.06, 1.3275), 43.8872)
        self.assertEqual(cross_value(29.03, 1.443), 41.8903)

    def test_cross_rate_uses_latest_common_day_and_keeps_provenance(self):
        now = dt.datetime(1999, 3, 3, tzinfo=UTC)
        ecb = document([('1999-01-28', 1.1), ('1999-01-29', 1.2), ('1999-02-25', 1.3), ('1999-02-26', 1.35), ('1999-03-01', 1.4)])
        # 29 January is a FRED holiday ('.'): the January rate uses the 28th; February uses the 26th.
        cross = parse_cross_fx(fred([('1999-01-28', 32.0), ('1999-01-29', '.'), ('1999-02-25', 33.0), ('1999-02-26', 33.5), ('1999-03-01', 34.0)]), ecb, now)
        self.assertEqual(cross['observations']['1999-01'], {'asOf': '1999-01-28', 'usdPerEur': 1.1, 'perUsd': 32.0, 'value': 35.2, 'ecbRates':{'EUR':1.0,'USD':1.1}})
        self.assertEqual(cross['observations']['1999-02']['asOf'], '1999-02-26')
        self.assertEqual(cross['observations']['1999-02']['value'], round(33.5 * 1.35, 4))
        self.assertNotIn('1999-03', cross['observations'])
        self.assertEqual(cross['sourceUrl'], 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=DEXTAUS')
        self.assertEqual(len(cross['sha256']), 64)
        fx = apply_cross_rates(parse_fx(ecb, now), {'TWD': cross})
        self.assertEqual(fx['months']['1999-01']['rates']['TWD'], 35.2)
        self.assertEqual(fx['months']['1999-01']['rates']['USD'], 1.2, 'ECB month-end stays the final ECB day')
        self.assertEqual(fx['derived']['TWD']['observations']['1999-02']['value'], round(33.5 * 1.35, 4))

    def test_cross_rate_rejects_stale_missing_duplicate_and_foreign_documents(self):
        now = dt.datetime(1999, 3, 3, tzinfo=UTC)
        ecb = document([('1999-01-29', 1.2), ('1999-02-26', 1.35)])
        for rows, header in [([('1999-01-15', 32.0), ('1999-02-26', 33.5)], 'observation_date,DEXTAUS'),   # stale January
                             ([('1999-02-26', 33.5)], 'observation_date,DEXTAUS'),   # missing January
                             ([('1999-01-29', 32.0), ('1999-01-29', 32.1), ('1999-02-26', 33.5)], 'observation_date,DEXTAUS'),
                             ([('1999-01-29', 32.0), ('1999-02-26', 33.5)], 'observation_date,DEXJPUS'),
                             ([('1999-01-29', -1), ('1999-02-26', 33.5)], 'observation_date,DEXTAUS')]:
            with self.assertRaises(ValueError):
                parse_cross_fx(fred(rows, header), ecb, now)
        self.assertEqual(parse_cross_fx(fred([('1999-01-29', 32.0), ('1999-02-26', 33.5)], 'DATE,DEXTAUS'), ecb, now)['observations']['1999-02']['value'], round(33.5 * 1.35, 4))
        # Weekly H.10 publication: a month that ended less than eight days ago may still be absent.
        lagging = parse_cross_fx(fred([('1999-01-29', 32.0)]), ecb, dt.datetime(1999, 3, 3, tzinfo=UTC))
        self.assertEqual(list(lagging['observations']), ['1999-01'])
        with self.assertRaises(ValueError):
            parse_cross_fx(fred([('1999-01-29', 32.0)]), ecb, dt.datetime(1999, 3, 9, tzinfo=UTC))

    def test_ecb_exact_final_observation(self):
        fx = parse_fx(document([('1999-01-28', 1.1), ('1999-01-29', 1.2), ('1999-02-26', 1.3), ('1999-03-01', 1.4)]), dt.datetime(1999, 3, 3, tzinfo=UTC))
        self.assertEqual(list(fx['months']), ['1999-01', '1999-02'])
        self.assertEqual(fx['months']['1999-01']['rates'], {'EUR': 1.0, 'USD': 1.2})
        self.assertEqual(fx['months']['1999-02']['asOf'], '1999-02-26')

    def test_ecb_reject_missing_stale_duplicate_future_nonfinite(self):
        now = dt.datetime(1999, 3, 3, tzinfo=UTC)
        valid = [('1999-01-29', 1.2), ('1999-02-26', 1.3)]
        for rows in [valid[:1], [('1999-01-05', 1.2), valid[1]], valid + [valid[0]], valid + [('1999-03-04', 1.2)], [valid[0], ('1999-02-26', 'NaN')], [valid[0], ('1999-02-26', 0)]]:
            with self.subTest(rows=rows), self.assertRaises(Exception):
                parse_fx(document(rows), now)

    def test_history_identity_continuity_and_regression(self):
        record = {'currency': 'EUR', 'symbol': 'EXACT', 'parser': 'yahoo', 'field': 'adjclose', 'periodStart': '2020-01', 'periodEnd': '2020-03', 'points': [['2020-01', 100], ['2020-02', 110], ['2020-03', 120]]}
        validate_record(record, record)
        for mutate in [lambda x: x.update(currency='USD'), lambda x: x.update(points=[['2020-01', 100], ['2020-02', 100], ['2020-03', 100]]), lambda x: x['points'].pop(1), lambda x: x['points'][1].__setitem__(1, 0), lambda x: x.update(periodStart='2020-02', points=x['points'][1:])]:
            changed = copy.deepcopy(record)
            mutate(changed)
            with self.assertRaises(Exception):
                validate_record(changed, record)


if __name__ == '__main__':
    unittest.main()

class RankingRetryTest(unittest.TestCase):
    def test_cross_retry_is_independent_and_failure_preserves_original_dates(self):
        from unittest.mock import patch
        from collect_ranking_sources import refresh_fx, ECB
        now = dt.datetime(1999, 3, 12, tzinfo=UTC)
        ecb = document([('1999-01-29', 1.2), ('1999-02-26', 1.35)])
        old = parse_fx(ecb, dt.datetime(1999, 3, 3, tzinfo=UTC))
        previous = {'fxFailed': False, 'crossFxFailed': True}
        def fetch(url, **kwargs):
            return ecb if url == ECB else fred([('1999-01-29', 32), ('1999-02-26', 33)])
        with patch('collect_ranking_sources.download', side_effect=fetch) as download:
            new, report = refresh_fx(old, previous, now, retry=True)
        self.assertEqual(download.call_count, 2)
        self.assertEqual(report['TWD']['status'], 'validated')
        self.assertEqual(new['months']['1999-02']['rates']['TWD'], 44.55)
        original = copy.deepcopy(new)
        def broken(url, **kwargs):
            if url == ECB: return ecb
            raise TimeoutError('TWD timeout')
        with patch('collect_ranking_sources.download', side_effect=broken):
            failed, report = refresh_fx(new, {'fxSources':report}, now)
        self.assertEqual(failed['derived'], original['derived'])
        self.assertEqual(report['TWD']['status'], 'failed')
        with patch('collect_ranking_sources.download') as download:
            _, skipped = refresh_fx(failed, {'fxSources':report}, now, selected=False)
        download.assert_not_called()
        self.assertEqual(skipped['TWD']['status'], 'failed')
