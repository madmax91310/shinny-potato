import copy
import datetime as dt
import unittest
from lifestrategy_holdings import derive, EQUITIES

NOW = dt.datetime(2026, 10, 20, tzinfo=dt.timezone.utc)
ISIN = 'IE00BMVB5K07'


def inputs():
    source = dict(asOf='2026-09-30', checkedAt='2026-10-20',
                  sourceUrl='https://fund-docs.vanguard.com/qualified.pdf')
    funds = [dict(name=name, weightPct=weight) for name, weight in [
        ('Vanguard FTSE All-World UCITS ETF (USD) Accumulating', 19.4),
        ('Vanguard FTSE Developed World UCITS ETF (USD) Accumulating', .8),
        ('Vanguard FTSE Emerging Markets UCITS ETF (USD) Accumulating', .1),
        ('Vanguard Global Aggregate Bond UCITS ETF EUR Hedged Accumulating', 79.7)]]
    record = dict(isin=ISIN, currency='EUR', documentSha256='a'*64,
                  holdings=dict(source, rows=funds),
                  assetAllocation=dict(source, rows=[dict(name=name, weightPct=weight)
                      for name, weight in [('Actions', 20.36), ('Obligations', 79.62), ('Liquidités', .02)]]))
    stocks = [dict(isin=f'US{i:010d}', name=f'Security {i}', weightPct=100/12) for i in range(12)]
    underliers = {EQUITIES[row['name']]: dict(source, complete=True, sha256='b'*64, rows=copy.deepcopy(stocks))
                  for row in funds if row['name'] in EQUITIES}
    return record, underliers


class LifeStrategyLookthroughTest(unittest.TestCase):
    def test_fund_nav_weights_not_scaled_to_equity_or_to_100(self):
        record, underliers = inputs()
        result = derive(ISIN, record, underliers, {}, NOW)
        self.assertEqual(result['scope'], 'equity-lookthrough')
        self.assertAlmostEqual(sum(r['weightPct'] for r in result['rows']), 20.3)
        self.assertAlmostEqual(result['rows'][0]['weightPct'], 20.3/12)
        self.assertEqual(len(result['rows']), 12)  # Same security through three funds, summed once.
        self.assertEqual(len(result['dependencies']), 3)
        self.assertEqual(result['asOf'], '2026-09-30')
        self.assertEqual(result['excludedWeightPctByType']['Bonds'], 79.62)

    def test_derivation_keeps_oldest_true_control_separate_from_validation(self):
        record,underliers=inputs()
        record['holdings']['checkedAt']='2026-10-18T22:00:00Z'
        record['assetAllocation']['checkedAt']='2026-10-18T19:00:00+00:00'
        before=copy.deepcopy((record,underliers))
        result=derive(ISIN,record,underliers,{},NOW)
        self.assertEqual(result['checkedAt'],'2026-10-18T19:00:00+00:00')
        self.assertEqual(result['validatedAt'],NOW.isoformat())
        self.assertEqual((record,underliers),before)
        record['assetAllocation']['checkedAt']='2026-10-18'
        result=derive(ISIN,record,underliers,{},NOW)
        self.assertEqual(result['checkedAt'],'2026-10-18','Date-only source control stays date-only')

    def test_missing_failed_partial_or_misaligned_dependency_rejected(self):
        for mutation in ('missing', 'failed', 'partial', 'date', 'stale', 'identity'):
            record, underliers = inputs()
            key = next(iter(underliers)); errors = {}
            if mutation == 'missing': del underliers[key]
            if mutation == 'failed': errors[key] = 'HTTP 503'
            if mutation == 'partial': underliers[key]['complete'] = False
            if mutation == 'date': underliers[key]['asOf'] = '2026-08-31'
            if mutation == 'stale': underliers[key]['checkedAt'] = '2026-08-01'
            if mutation == 'identity': underliers[key]['rows'][0]['isin'] = None
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                derive(ISIN, record, underliers, errors, NOW)

    def test_unknown_fund_or_wrong_share_rejected(self):
        record, underliers = inputs()
        with self.assertRaises(ValueError): derive('IE00BMVB5M21', record, underliers, {}, NOW)
        record['holdings']['rows'][0]['name'] += ' hedged'
        with self.assertRaises(ValueError): derive(ISIN, record, underliers, {}, NOW)

    def test_missing_fund_weight_and_date_mismatch_rejected(self):
        for mutation in ('weight', 'date'):
            record, underliers = inputs()
            if mutation == 'weight': record['holdings']['rows'][0]['weightPct'] -= 2
            else: record['assetAllocation']['asOf'] = '2026-08-31'
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                derive(ISIN, record, underliers, {}, NOW)


if __name__ == '__main__':
    unittest.main()
