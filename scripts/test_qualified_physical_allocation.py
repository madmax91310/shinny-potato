"""Actual 98.74% primary tables and a separately qualified 96-title portfolio."""
import copy
import datetime as dt
import gzip
import hashlib
import json
from pathlib import Path
import unittest
from unittest.mock import patch
import collect_qualified_exposures as collector
import qualified_physical_allocation as fallback
from producer_report_plans import build_plan
from producer_report_contract import finish, normalize_contract, validate_contract

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT/'scripts/fixtures/defence-physical-allocation'
RAW = gzip.decompress((FIXTURE/'response-20261112.json.gz').read_bytes()).decode()
BODY = json.loads(RAW)
PROVENANCE = json.loads((FIXTURE/'provenance.json').read_text())
NOW = dt.datetime.fromisoformat(PROVENANCE['checkedAt'])
CONFIG = next(c for c in json.loads((ROOT/'scripts/qualified-exposure-sources.json').read_text())['instruments'] if c['isin'] == fallback.ISIN)
SHARE = {**CONFIG, 'currency': 'USD'}
URL = PROVENANCE['sourceUrl']


class QualifiedPhysicalAllocation(unittest.TestCase):
    def prepare(self, body=BODY, config=SHARE):
        return fallback.prepare(body, config, NOW, URL, RAW if body is BODY else json.dumps(body), {})

    def collect(self, body=BODY):
        raw = RAW if body is BODY else json.dumps(body)
        def fetch(url, *args, **kwargs):
            self.assertEqual(url, URL)
            return raw
        with patch.object(collector, 'get_text', side_effect=fetch) as source:
            record = collector.collect_one(CONFIG, NOW)
        self.assertEqual(source.call_count, 1)
        return record

    def test_actual_source_and_original_nav_weights_without_primary_repair(self):
        self.assertEqual(hashlib.sha256(RAW.encode()).hexdigest(), PROVENANCE['sha256'])
        original = copy.deepcopy(BODY)
        _, qualified = self.prepare()
        self.assertEqual(BODY, original)
        proof = qualified['compositionQualification']
        self.assertEqual(proof['positionCount'], 96)
        self.assertAlmostEqual(proof['portfolioWeightPct'], 100.00005)
        self.assertFalse(proof['normalizationApplied'])
        self.assertFalse(proof['primaryRepaired'])
        self.assertFalse(proof['indexCompositionCertified'])
        self.assertFalse(proof['overlapQualified'])
        self.assertAlmostEqual(sum(r['weightPct'] for r in qualified['countries']['rows']), 100.00005)
        self.assertAlmostEqual(sum(r['weightPct'] for r in qualified['sectors']['rows']), 100.00005)
        self.assertEqual([r['name']for r in qualified['sectors']['rows']],['Industrials','Cash and/or Derivatives'])
        self.assertAlmostEqual(qualified['sectors']['rows'][0]['weightPct'],99.8186)
        self.assertAlmostEqual(qualified['sectors']['rows'][1]['weightPct'],0.18145)
        for check in qualified['primaryAllocationChecks']:
            self.assertAlmostEqual(check['publishedWeightPct'], 98.74)
            self.assertEqual(check['status'], 'failed')
            self.assertNotIn('checkedAt', check)
            self.assertEqual(check['asOf'], '2026-11-11')
            self.assertTrue(check['qualifiedFallbackAvailable'])

    def test_real_record_and_merge_keep_top_ten_distinct_from_full_source_count(self):
        record = self.collect()
        self.assertEqual(len(record['holdings']['rows']), 10)
        self.assertEqual(record['holdings']['coverageProof']['positionCount'], 96)
        self.assertEqual(record['countriesRisk']['method'], 'Country of risk, all published holdings including cash/derivatives, no renormalisation')
        self.assertEqual({e['field'] for e in record['collectionErrors']}, {'countries-primary', 'sectors-primary'})
        current = json.loads((ROOT/'src/data/automated-etf.json').read_text())
        merged = collector.merge_collection({'checkedAt': NOW.isoformat(), 'shares': [record]}, current, {})
        self.assertEqual(merged[fallback.ISIN]['countries']['asOf'], '2026-11-11')
        self.assertAlmostEqual(sum(r['weightPct'] for r in merged[fallback.ISIN]['sectors']['rows']), 100.00005)

    def test_identity_mandate_count_dates_and_missing_classification_refuse(self):
        paths = [(['productId'], 1), (['currencyCode'], 'EUR'),
                 (['componentsByNameMap', 'keyFundFacts', 'containersByNameMap', 'default', 'dataPointsByNameMap', 'isin', 'value'], 'IE00B4L5Y983'),
                 (['componentsByNameMap', 'keyFundFacts', 'containersByNameMap', 'default', 'dataPointsByNameMap', 'productStructure', 'value'], 'Synthetic'),
                 (['componentsByNameMap', 'fundamentalsAndRisk', 'containersByNameMap', 'default', 'dataPointsByNameMap', 'numHoldings', 'value'], 95),
                 (['componentsByNameMap', 'fundamentalsAndRisk', 'containersByNameMap', 'default', 'dataPointsByNameMap', 'numHoldings', 'asOfDate'], 20261110)]
        for path, value in paths:
            body = copy.deepcopy(BODY); node = body
            for key in path[:-1]: node = node[key]
            node[path[-1]] = value
            with self.subTest(path=path), self.assertRaises((ValueError, KeyError)):
                self.prepare(body)
        for key, value in [('isin', ''), ('sectorName', 'Unknown'), ('holdingPercent', -1)]:
            body = copy.deepcopy(BODY)
            body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap'][key]['value'][0] = value
            with self.subTest(column=key), self.assertRaises(ValueError): self.prepare(body)
        with self.assertRaises(ValueError): self.prepare(BODY, {**SHARE, 'isin': 'IE00B4L5Y983'})

    def test_other_funds_and_legacy_mode_are_untouched(self):
        body, result = self.prepare(config={**SHARE, 'allocationFallback': None})
        self.assertIs(body, BODY)
        self.assertIsNone(result)
        self.assertNotIn('primaryAllocationChecks', BODY)

    def test_primary_recovery_is_a_real_success_and_no_fallback(self):
        body = copy.deepcopy(BODY)
        exposure = body['componentsByNameMap']['exposureBreakdowns']['containersByNameMap']
        for node in [exposure['geography']['subContainersByNameMap']['countries'], exposure['sector']]:
            # Isolated hypothetical complete response, never written to production.
            weights = node['dataPointsByNameMap']['fund']['value'];weights[0] += 1.26
        parsed, result = self.prepare(body)
        self.assertIs(parsed, body)
        self.assertNotIn('compositionQualification', result)
        self.assertTrue(all(r['status'] == 'succeeded' and r['checkedAt'] == NOW.isoformat() for r in result['primaryAllocationChecks']))
        self.assertNotIn('collectionErrors', result)

    def test_malformed_primary_retains_failure_and_full_book_without_mutating_response(self):
        body=copy.deepcopy(BODY)
        body['componentsByNameMap']['exposureBreakdowns']['containersByNameMap']['sector']={'dataPointsByNameMap':None}
        original=copy.deepcopy(body)
        record=self.collect(body)
        self.assertEqual(body,original)
        self.assertEqual(record['sectors']['asOf'],'2026-11-11')
        self.assertAlmostEqual(sum(r['weightPct']for r in record['sectors']['rows']),100.00005)
        self.assertEqual(record['primaryAllocationChecks'][1]['status'],'failed')
        self.assertNotIn('checkedAt',record['primaryAllocationChecks'][1])

    def test_one_primary_success_does_not_mix_it_with_another_source_photograph(self):
        body=copy.deepcopy(BODY)
        countries=body['componentsByNameMap']['exposureBreakdowns']['containersByNameMap']['geography']['subContainersByNameMap']['countries']['dataPointsByNameMap']
        countries['fund']['value'][0]+=1.26
        countries['asOf']['value']=20261110
        record=self.collect(body)
        self.assertEqual([c['status']for c in record['primaryAllocationChecks']],['succeeded','failed'])
        self.assertEqual(record['primaryAllocationChecks'][0]['asOf'],'2026-11-10')
        self.assertEqual(record['countries']['asOf'],'2026-11-11')
        self.assertEqual(record['sectors']['asOf'],'2026-11-11')
        self.assertEqual(record['countries']['rows'][0],{'name':'United States','weightPct':63.71543})
        self.assertEqual(len(record['collectionErrors']),1)

    def test_successful_unchanged_source_control_is_not_cache_or_new_data_period(self):
        with patch.object(collector,'get_text',return_value=RAW) as source:
            first=collector.collect_one(CONFIG,NOW)
            second=collector.collect_one(CONFIG,NOW+dt.timedelta(hours=1))
        self.assertEqual(source.call_count,2)
        self.assertNotEqual(first['checkedAt'],second['checkedAt'])
        self.assertEqual(first['countries']['asOf'],second['countries']['asOf'])
        self.assertEqual(first['countries']['rows'],second['countries']['rows'])
        self.assertEqual(first['sectors']['rows'],second['sectors']['rows'])
        self.assertTrue(all('checkedAt'not in c for c in second['primaryAllocationChecks']))

    def test_individual_primary_failures_reach_existing_monitor_contract(self):
        record = self.collect()
        plan = build_plan('collect_qualified_exposures', ['--only', CONFIG['id']])
        plan.update(producer='collect_qualified_exposures',reportStem='qualified-exposures',declaredAt=NOW.isoformat(),nonce='isolated-defence-source-contract')
        plan['sha256']=hashlib.sha256(json.dumps(plan,sort_keys=True).encode()).hexdigest()
        requested = {r['id'] for r in plan['items'] if r['selected']}
        self.assertEqual(requested, {fallback.ISIN, fallback.primary_id(fallback.ISIN, 'countries'), fallback.primary_id(fallback.ISIN, 'sectors')})
        native = {'records': [record], 'excluded': []}
        native['contractResults'] = fallback.contract_results([CONFIG], native)
        contract = finish(native, plan)['resultContract']
        validate_contract(contract)
        normalized = normalize_contract(contract)
        self.assertEqual({r['id'] for r in normalized['successes']}, {fallback.ISIN})
        self.assertEqual({r['id'] for r in normalized['errors']}, requested - {fallback.ISIN})
        self.assertTrue(all(r.get('phase') == 'validation' for r in contract['outcomes'] if r['status'] == 'failed'))
        omitted = copy.deepcopy(native)
        omitted['contractResults']['errors'].pop()
        missing = finish(omitted, plan)['resultContract']
        self.assertTrue(any(r['status'] == 'failed' and r.get('kind')=='omission' for r in missing['outcomes']))

    def test_network_failure_and_failed_fallback_do_not_certify_primary_or_cache(self):
        with patch.object(collector, 'get_text', side_effect=TimeoutError('isolated network timeout')):
            with self.assertRaises(TimeoutError): collector.collect_one(CONFIG, NOW)
        report = {'records': [], 'excluded': [{'isin': fallback.ISIN, 'active': True, 'error': 'network timeout'}]}
        results = fallback.contract_results([CONFIG], report)
        self.assertEqual(results['successes'], [])
        self.assertEqual(len(results['errors']), 1)
        self.assertEqual(len(results['inactive']), 2)
        self.assertTrue(all(r['sourceAttempted'] is False for r in results['inactive']))
        body = copy.deepcopy(BODY)
        body['componentsByNameMap']['fundamentalsAndRisk']['containersByNameMap']['default']['dataPointsByNameMap']['numHoldings']['value'] = 95
        with patch.object(collector, 'get_text', return_value=json.dumps(body)):
            with self.assertRaises(ValueError) as caught: collector.collect_one(CONFIG, NOW)
        self.assertEqual(len(caught.exception.primaryAllocationChecks), 2)
        self.assertTrue(all(r['status'] == 'failed' for r in caught.exception.primaryAllocationChecks))


if __name__ == '__main__': unittest.main()
