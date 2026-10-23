import datetime as dt
import unittest
from ishares_metrics import parse_metrics
from apply_etf_collection import merge_collection
from data_automation import UTC

NOW = dt.datetime(2026, 10, 23, tzinfo=UTC)
URL = 'https://www.blackrock.com/example'
def body(value=40, stamp=20261021):
    return {'fundamentalsAndRisk': {'containersByNameMap': {'default': {'dataPointsByNameMap': {'numHoldings': {'value': value, 'asOfDate': stamp}}}}}}

class DatedMetrics(unittest.TestCase):
    def test_count_keeps_its_own_date_and_source(self):
        m = parse_metrics(body(), NOW, URL)['numHoldings']
        self.assertEqual((m['value'], m['asOf'], m['checkedAt'], m['sourceUrl']), (40, '2026-10-21', '2026-10-23', URL))
    def test_absent_component_never_becomes_zero(self):
        self.assertEqual(parse_metrics({}, NOW, URL), {})
    def test_invalid_or_undated_metric_is_rejected(self):
        for value, stamp in [(True,20261021),(0,20261021),(40.5,20261021),(40,None),(40,20261024),(40,20260101)]:
            with self.assertRaises((ValueError,TypeError)):
                parse_metrics(body(value,stamp), NOW, URL)
    def test_absent_or_older_metric_preserves_the_last_observation(self):
        old_metric = parse_metrics(body(), NOW, URL)['numHoldings']
        old = {'TEST': {'currency': 'USD', 'productId': 1, 'metrics': {'numHoldings': old_metric}}}
        share = {'isin': 'TEST', 'currency': 'USD', 'productId': 1, 'sourceUrl': URL,
                 'characteristics': {'terPct': .5, 'index': 'Index', 'distribution': 'Accumulating'}}
        for metrics in [{}, {'numHoldings': {**old_metric, 'value': 39, 'asOf': '2026-09-30'}}]:
            merged = merge_collection({'checkedAt': NOW.isoformat(), 'shares': [{**share, 'metrics': metrics}]}, old, {})
            self.assertEqual(merged['TEST']['metrics']['numHoldings'], old_metric)
    def test_newer_metric_is_applied_without_using_the_check_date_as_snapshot(self):
        metric = parse_metrics(body(), NOW, URL)['numHoldings']
        share = {'isin': 'TEST', 'currency': 'USD', 'productId': 1, 'sourceUrl': URL,
                 'characteristics': {'terPct': .5, 'index': 'Index', 'distribution': 'Accumulating'},
                 'metrics': {'numHoldings': metric}}
        merged = merge_collection({'checkedAt': NOW.isoformat(), 'shares': [share]}, {}, {})
        self.assertEqual(merged['TEST']['metrics']['numHoldings']['asOf'], '2026-10-21')
        self.assertEqual(merged['TEST']['metrics']['numHoldings']['checkedAt'], '2026-10-23')
