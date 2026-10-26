"""Exact-share NAV qualification using archived, unmodified issuer responses."""
import copy
import datetime as dt
import gzip
import json
from pathlib import Path
import unittest
from unittest.mock import patch

from collect_dws_etf import items
from collect_official_share_history import collect_one, configurations

FIXTURES = Path(__file__).parent / 'fixtures/dws-nikkei'
NOW = dt.datetime(2026, 10, 26, tzinfo=dt.timezone.utc)
FX = '<g:Envelope xmlns:g="http://www.gesmes.org/xml/2002-08-01" xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref"><Cube><Cube time="2026-10-23"><Cube currency="USD" rate="1.2"/><Cube currency="JPY" rate="180"/></Cube></Cube></g:Envelope>'


class DwsShareNav(unittest.TestCase):
    def source(self):
        return copy.deepcopy(next(s for s in configurations() if s['id'] == 'etfLU2196470426Nav'))

    def collect(self, source_change=None, field_change=None, body_override=None):
        source = self.source()
        if source_change:
            source.update(source_change)
        body = json.loads(gzip.decompress((FIXTURES / 'product.json.gz').read_bytes()))
        for field in items(body['pdpResult']['pageSections']['keyFacts']):
            if field_change and field['key'] in field_change:
                field['value'] = field_change[field['key']]
        urls = []

        def document(url):
            urls.append(url)
            return body_override if body_override is not None else (FIXTURES / 'history.xlsx').read_bytes()

        with patch('collect_official_share_history.get_text', return_value=FX):
            result = collect_one(source, NOW, json_fetch=lambda url: body, document_fetch=document)
        self.assertIn('startDate=2020-10-27', urls[0])
        return result

    def test_native_calendar_launch_and_same_date_fx(self):
        record = self.collect()
        self.assertEqual((record['isin'], record['currency'], record['nativeValuationCurrency']), ('LU2196470426', 'EUR', 'JPY'))
        self.assertEqual(record['calendarProof']['identityBasis'], 'share-class-launch')
        self.assertEqual([row['year'] for row in record['calendarProof']['checks']], list(range(2021, 2026)))
        last = record['calendarProof']['checks'][-1]
        self.assertAlmostEqual(last['dailyDerived'], 28.24201483510165)
        self.assertEqual(last['published'], 28.24)
        self.assertEqual((len(record['points']), record['points'][0][0], record['periodEnd']), (72, '2020-10', '2026-09'))
        latest = record['latestLevel']
        self.assertEqual((latest['asOf'], latest['fxAsOf']), ('2026-10-23', '2026-10-23'))
        self.assertAlmostEqual(latest['value'], latest['nativeValue'] / 180)
        self.assertNotIn('symbol', record)
        self.assertNotIn('mic', record)

    def test_wrong_identity_currency_income_and_launch_fail_closed(self):
        for fields in [{'ISIN': 'LU0000000000'}, {'Share class currency': 'EUR'},
                       {'Income treatment': 'Distributing'}, {'Share class launch date': '28/10/2020'}]:
            with self.subTest(fields=fields), self.assertRaises(ValueError):
                self.collect(field_change=fields)
        for source in [{'periodStart': '2020-09'}, {'identityFrom': '2020-10-28'},
                       {'dwsIdentityBasis': 'unreviewed-policy'}, {'navCurrency': 'USD'}]:
            with self.subTest(source=source), self.assertRaises(ValueError):
                self.collect(source_change=source)

    def test_existing_merger_contract_is_not_bypassed(self):
        with self.assertRaisesRegex(ValueError, 'merger identity evidence'):
            self.collect(source_change={'dwsIdentityBasis': None})

    def test_empty_or_changed_workbook_fails(self):
        for body in [b'', b'<html>access denied</html>']:
            with self.subTest(body=body), self.assertRaises(Exception):
                self.collect(body_override=body)

    def test_failure_preserves_last_valid_values_and_dates(self):
        from refresh_monthly_history import refresh
        record = self.collect()
        record['checkedAt'] = '2026-10-23'
        record['latestLevel']['checkedAt'] = '2026-10-23'
        source = self.source()
        baseline = {source['id']: {'currency': 'EUR', 'points': [{'date': d, 'price': v} for d, v in record['points']]}}

        def failed(*args):
            raise ValueError('Exact share launch identity changed')

        merged, report = refresh({'series': [source]}, {source['id']: record}, baseline, NOW, collect=failed)
        self.assertEqual(merged[source['id']], record)
        self.assertEqual(report['series'][0]['status'], 'failed')
        self.assertNotIn('evidence', report['series'][0])

    def test_ordinary_refresh_keeps_validated_unchanged_source_and_rejects_policy_change(self):
        from refresh_monthly_history import refresh
        record = self.collect()
        source = self.source()
        baseline = {source['id']: {'currency': 'EUR', 'points': [{'date': d, 'price': v} for d, v in record['points']]}}
        merged, report = refresh({'series': [source]}, {source['id']: record}, baseline, NOW, collect=lambda *args: record)
        self.assertEqual(report['series'][0]['sourceState'], 'unchanged-verified')
        self.assertEqual(merged[source['id']]['latestLevel'], record['latestLevel'])
        changed = {**record, 'dwsIdentityBasis': 'other-contract'}
        merged, report = refresh({'series': [source]}, {source['id']: record}, baseline, NOW, collect=lambda *args: changed)
        self.assertEqual(report['series'][0]['status'], 'failed')
        self.assertIn('exact series identity changed', report['series'][0]['reason'])
        self.assertEqual(merged[source['id']], record)


if __name__ == '__main__':
    unittest.main()
