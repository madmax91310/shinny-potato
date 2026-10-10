import copy
import json
import pathlib
import tempfile
import unittest
from unittest.mock import patch
from test_issuer_refresh import amundi, NOW
from collect_amundi_etf import collect
from collect_ssga_etf import collect as collect_ssga
from apply_etf_collection import apply_valid_shares, merge_collection
from etf_anomalies import anomalies
from publish_automation_status import normalize_report
from refresh_additional_etf import refresh


class ResilienceTests(unittest.TestCase):
    def test_amundi_bad_missing_duplicate_products_are_isolated(self):
        p, s = amundi()
        q, t = copy.deepcopy(p), copy.deepcopy(s)
        q['productId'] = q['characteristics']['ISIN'] = t['isin'] = 'OTHER'
        for bad in [[], [q, q], [{**q, 'currencies': {'CURRENCY': 'USD'}}]]:
            report = collect({'instruments': [s, t]}, NOW, lambda _: {'products': [p, *bad]})
            self.assertEqual([r['isin'] for r in report['shares']], ['TESTSHARE'])
            self.assertEqual(report['failures'][0]['isin'], 'OTHER')
            normalized = normalize_report(report)
            self.assertEqual(len(normalized['successes']), 1)
            self.assertEqual(len(normalized['errors']), 1)

    def test_amundi_transport_failure_records_every_share(self):
        def fail(_):
            raise TimeoutError('source timeout')
        report = collect({'instruments': [{'isin': 'ONE'}, {'isin': 'TWO'}]}, NOW, fail)
        self.assertEqual([f['isin'] for f in report['failures']], ['ONE', 'TWO'])

    def test_ssga_transport_failure_does_not_block_good_share(self):
        def fetch(url, *args):
            if url == 'bad':
                raise TimeoutError('timeout')
            return 'good'
        with patch('collect_ssga_etf.parse_page', return_value=({'isin': 'GOOD'}, None)):
            report = collect_ssga({'instruments': [{'isin': 'GOOD', 'sourceUrl': 'good'},
                {'isin': 'BAD', 'sourceUrl': 'bad'}]}, NOW, fetch)
        self.assertEqual(report['shares'], [{'isin': 'GOOD'}])
        self.assertEqual(report['failures'][0]['isin'], 'BAD')

    def records(self):
        from collect_amundi_etf import parse_product
        p, s = amundi()
        share = parse_product(p, s, NOW)
        old = merge_collection({'checkedAt': NOW.isoformat(), 'shares': [share]}, {}, {})
        return old, share

    def test_history_correction_quarantines_only_bad_share_and_records_proposal(self):
        old, share = self.records()
        share['performance']['years']['2024'] = 25
        healthy = copy.deepcopy(share)
        healthy['isin'] = healthy['productId'] = 'HEALTHY'
        report = {'checkedAt': NOW.isoformat(), 'shares': [share, healthy]}
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory) / 'data.json'
            path.write_text(json.dumps(old))
            self.assertTrue(apply_valid_shares(report, path, {}))
            active = json.loads(path.read_text())
        self.assertEqual(active['TESTSHARE'], old['TESTSHARE'])
        self.assertIn('HEALTHY', active)
        self.assertEqual(report['failures'][0]['proposedObservation']['performance']['years']['2024'], 25)
        self.assertEqual(len(normalize_report(report)['errors']), 1)

    def test_aum_spike_and_composition_shift_are_detected(self):
        old, share = self.records()
        share['aum']['amount'] *= 2
        self.assertTrue(any('aum:' in issue for issue in anomalies(old['TESTSHARE'], share)))
        old['TESTSHARE']['countries']['rows'] = [{'name': 'United States', 'weightPct': 50}, {'name': 'France', 'weightPct': 50}]
        share['countries']['rows'] = [{'name': 'United States', 'weightPct': 80}, {'name': 'France', 'weightPct': 20}]
        self.assertTrue(any('countries:' in issue for issue in anomalies(old['TESTSHARE'], share)))

    def test_rounding_new_year_older_data_and_different_aum_scope_are_not_anomalies(self):
        old, share = self.records()
        share['performance']['years']['2024'] += .1
        share['performance']['years']['2023'] += .99
        share['performance']['years']['2025'] = 10
        del old['TESTSHARE']['performance']['years']['2025']
        share['aum']['amount'] *= 3
        share['aum']['scope'] = 'fund'
        self.assertEqual(anomalies(old['TESTSHARE'], share), [])
        share['aum']['scope'] = 'share-class'
        share['aum']['asOf'] = '2026-01-01'
        self.assertEqual(anomalies(old['TESTSHARE'], share), [])

    def test_top_holdings_weight_jump_and_repeated_suspicion_stay_blocked(self):
        old, share = self.records()
        share['holdings']['rows'][0]['weightPct'] = 30
        self.assertTrue(any('holdings:' in issue for issue in anomalies(old['TESTSHARE'], share)))
        for stamp in ['2026-10-05', '2026-10-06']:
            with self.assertRaisesRegex(ValueError, 'Suspicious ETF change'):
                merge_collection({'checkedAt': stamp, 'shares': [share]}, old, {})

    def test_extensions_use_the_same_guard_and_preserve_other_products(self):
        old, share = self.records()
        share['performance']['years']['2024'] = 30
        healthy = copy.deepcopy(share)
        healthy['isin'] = healthy['productId'] = 'HEALTHY'
        proposals = {s['isin']: s for s in [share, healthy]}
        active, report = refresh({'instruments': [
            {'isin': isin, 'provider': 'Test'} for isin in proposals]}, old, {}, NOW,
            collect=lambda config, now: proposals[config['isin']])
        self.assertEqual(active['TESTSHARE'], old['TESTSHARE'])
        self.assertIn('HEALTHY', active)
        failed = next(s for s in report['shares'] if s['isin'] == 'TESTSHARE')
        self.assertEqual(failed['status'], 'failed')
        self.assertIn('proposedObservation', failed)


if __name__ == '__main__':
    unittest.main()
