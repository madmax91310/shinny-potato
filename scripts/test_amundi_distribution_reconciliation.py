import copy
import datetime as dt
import gzip
import json
import math
import unittest
from pathlib import Path
from qualified_distributions import amundi_events, official_events, reconcile_adjustments
from refresh_monthly_history import collect_yahoo, yahoo_chart

ROOT = Path(__file__).resolve().parents[1]
NOW = dt.datetime(2026, 10, 24, tzinfo=dt.timezone.utc)


class AmundiHistoricalCash(unittest.TestCase):
    def setUp(self):
        self.source = next(s for s in json.loads((ROOT / 'scripts/monthly-automation.json').read_text())['series'] if s['id'] == 'etfFR0007054358')
        self.reference = self.source['distributionEvidence']
        self.payload = json.loads(gzip.decompress((ROOT / self.reference['path']).read_bytes()))
        self.provenance = json.loads((ROOT / self.reference['metadataPath']).read_text())[0]
        archive = json.loads(gzip.decompress((ROOT / self.reference['quoteEvidence']['path']).read_bytes()))
        plain = copy.deepcopy(self.source)
        plain.pop('distributionEvidence')
        self.before = collect_yahoo(plain, NOW, fetch=lambda url: archive['1mo' if 'interval=1mo' in url else '1d'])
        self.daily, _ = yahoo_chart(self.before['rawResponse']['1d'], self.source, '1d')

    def test_historical_cash_is_qualified_even_when_the_current_policy_is_accumulation(self):
        events, source = official_events(self.source)
        product = next(p for p in self.payload['products'] if p['productId'] == self.source['isin'])
        self.assertEqual(product['characteristics']['DISTRIBUTION_POLICY'], 'Capitalisation')
        self.assertEqual(len(events), 12)
        self.assertEqual(events['2020-07-08'], .62)
        self.assertEqual(events['2020-12-09'], .14)
        self.assertEqual(len(source['officialCashDateChecks']), 12)

    def test_twelve_missing_adjustments_are_repaired_without_changing_raw_quotes(self):
        untouched = copy.deepcopy(self.before)
        result = reconcile_adjustments(self.source, self.before, self.daily, NOW)
        self.assertEqual(self.before, untouched)
        self.assertEqual(result['anniversaryPoints'], untouched['anniversaryPoints'])
        old, new = dict(untouched['points']), dict(result['points'])
        annual = lambda points, year: (points[f'{year}-12'] / points[f'{year-1}-12'] - 1) * 100
        self.assertAlmostEqual(annual(old, 2020), -5.109594, places=4)
        self.assertAlmostEqual(annual(new, 2020), -2.8850475, places=4)
        for year in range(2021, 2026):
            self.assertAlmostEqual(annual(old, year), annual(new, year), places=5)
        self.assertEqual({p['status'] for p in result['distributionAdjustmentProof']}, {'missing-adjustment'})
        self.assertTrue(all(p['evidenceCheckedAt'] == self.provenance['checkedAt'] for p in result['distributionAdjustmentProof']))
        self.assertNotEqual(self.provenance['checkedAt'], NOW.isoformat())

    def test_a_partial_or_complete_future_vendor_fix_is_never_counted_twice(self):
        expected = reconcile_adjustments(self.source, self.before, self.daily, NOW)
        events, _ = official_events(self.source)
        for selected in [['2020-07-08'], list(events)]:
            fixed = copy.deepcopy(self.before)
            factors = {day: 1 - events[day] / max((row for row in self.daily if row[0].isoformat() < day), key=lambda row: row[0])[1] for day in selected}
            factor = lambda day: math.prod(value for exdate, value in factors.items() if day < exdate)
            raw = fixed['rawResponse']['1d']['chart']['result'][0]
            for i, stamp in enumerate(raw['timestamp']):
                day = dt.datetime.fromtimestamp(stamp, dt.timezone.utc).date().isoformat()
                if raw['indicators']['adjclose'][0]['adjclose'][i] is not None:
                    raw['indicators']['adjclose'][0]['adjclose'][i] *= factor(day)
            for point, row in zip(fixed['points'], fixed['proofRows']):
                row['value'] *= factor(row['date'])
                point[1] = round(row['value'], self.source['precision'])
            daily, _ = yahoo_chart(fixed['rawResponse']['1d'], self.source, '1d')
            result = reconcile_adjustments(self.source, fixed, daily, NOW)
            self.assertEqual(result['points'], expected['points'])
            self.assertEqual(sum(p['status'] == 'already-adjusted' for p in result['distributionAdjustmentProof']), len(selected))

    def test_wrong_share_currency_date_or_structure_cannot_qualify_cash(self):
        for mutation, message in [('identity', 'identity'), ('currency', 'currency'), ('date', 'date/factor'), ('schema', 'columns changed')]:
            payload = copy.deepcopy(self.payload)
            product = next(p for p in payload['products'] if p['productId'] == self.source['isin'])
            if mutation == 'identity':
                product['characteristics']['ISIN'] = 'WRONG'
            elif mutation == 'currency':
                history = next(h for h in product['historics'] if h['indicator'] == 'navCurrency')
                next(r for r in history['historicalData'] if r['date'] == 1594166400000)['data'] = 'USD'
            elif mutation == 'date':
                for indicator in ['dividendAmount', 'dividendCurrency']:
                    history = next(h for h in product['historics'] if h['indicator'] == indicator)
                    next(r for r in history['historicalData'] if r['date'] == 1594166400000)['date'] += 2 * 86400000
            else:
                product['historics'] = [h for h in product['historics'] if h['indicator'] != 'dividendCurrency']
            reference = copy.deepcopy(self.reference)
            if mutation == 'date': reference['dates'] = [d if d != '2020-07-08' else '2020-07-10' for d in reference['dates']]
            with self.assertRaisesRegex(ValueError, message):
                amundi_events(self.source, payload, reference, self.provenance)

    def test_a_unit_event_in_the_issuers_dividend_field_is_not_treated_as_cash(self):
        source = {**self.source, 'isin': 'FR0010342592'}
        reference = {**self.reference, 'dates': ['2026-07-09']}
        with self.assertRaisesRegex(ValueError, 'currency'):
            amundi_events(source, self.payload, reference, self.provenance)
        # Even a misleading EUR label cannot make a factor-200 unit event cash.
        payload = copy.deepcopy(self.payload)
        product = next(p for p in payload['products'] if p['productId'] == source['isin'])
        next(h for h in product['historics'] if h['indicator'] == 'dividendCurrency')['historicalData'][0]['data'] = 'EUR'
        with self.assertRaisesRegex(ValueError, 'possible split or other unit event'):
            amundi_events(source, payload, reference, self.provenance)


if __name__ == '__main__':
    unittest.main()
