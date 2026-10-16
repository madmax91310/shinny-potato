import copy
import datetime as dt
import unittest
from collect_ranking_sources import parse_fx, validate_record
from data_automation import UTC


def document(rows):
    return ('<Envelope xmlns="http://www.gesmes.org/xml/2002-08-01"><Cube xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref">' + ''.join(
        f'<Cube time="{day}"><Cube currency="USD" rate="{rate}"/></Cube>' for day, rate in rows) + '</Cube></Envelope>').encode()


class RankingSourcesTest(unittest.TestCase):
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
        for mutate in [lambda x: x.update(currency='USD'), lambda x: x['points'].pop(1), lambda x: x['points'][1].__setitem__(1, 0), lambda x: x.update(periodStart='2020-02', points=x['points'][1:])]:
            changed = copy.deepcopy(record)
            mutate(changed)
            with self.assertRaises(Exception):
                validate_record(changed, record)


if __name__ == '__main__':
    unittest.main()
