import copy
import datetime as dt
import json
import hashlib
import pathlib
import unittest

from collect_dws_etf import parse_holdings
from verify_dws_compositions import verify, collect, check_report, stability_hash


class VerificationTests(unittest.TestCase):
    def setUp(self):
        self.isin = 'IE00BM67HS53'
        self.now = dt.datetime(2026, 10, 14, 10, tzinfo=dt.timezone.utc)
        self.body = json.loads((pathlib.Path(__file__).parent / 'fixtures/radar-review-583' / f'{self.isin}.json').read_text())
        self.url = f'https://etf.dws.com/api/pdp/en-gb/etf/{self.isin}/holdings'
        self.record = parse_holdings(self.body, {'isin': self.isin}, self.now, self.url)

    def test_live_complete_source_matches_and_is_archived(self):
        proof = verify(self.isin, self.record, self.now, lambda url: self.body)
        self.assertEqual(json.loads(proof['canonicalBody']), self.body)
        wire = json.loads(json.dumps(proof))
        self.assertEqual(hashlib.sha256(wire['canonicalBody'].encode()).hexdigest(), proof['sourceHash'])
        self.assertEqual(proof['sourceHash'], self.record['countries']['sha256'])

    def test_wrong_weights_hash_date_or_partial_portfolio_never_confirm(self):
        for defect in ('weight', 'hash', 'date', 'complete'):
            record = copy.deepcopy(self.record)
            if defect == 'weight': record['countries']['rows'][0]['weightPct'] += 1
            if defect == 'hash': record['countries']['sha256'] = '0' * 64
            if defect == 'date': record['countries']['asOf'] = '2026-10-11'
            if defect == 'complete': record['countries']['complete'] = False
            with self.subTest(defect=defect), self.assertRaises(ValueError):
                verify(self.isin, record, self.now, lambda url: self.body)
        partial = copy.deepcopy(self.body)
        partial['tables'][0]['values'] = partial['tables'][0]['values'][:2]
        with self.assertRaises(ValueError):
            verify(self.isin, self.record, self.now, lambda url: partial)

    def test_different_publication_dates_are_deferred_without_weight_comparison(self):
        record=copy.deepcopy(self.record)
        for field in ('countries','sectors'):
            record[field]['asOf']='2026-10-11'
            record[field]['rows'][0]['weightPct']+=5
        result=collect({self.isin:record},self.now,lambda url:self.body)
        self.assertEqual(result['verified'],[])
        self.assertEqual(result['errors'],[])
        self.assertEqual(result['deferred'][0]['reason'],'publication-lag')
        check_report(result)
        record['countries']['basis']='index'
        incompatible=collect({self.isin:record},self.now,lambda url:self.body)
        self.assertEqual(incompatible['deferred'],[])
        self.assertEqual(len(incompatible['errors']),1)
        with self.assertRaises(ValueError):
            check_report(incompatible)

    def test_gate_rejects_empty_missing_and_failed_checks(self):
        for report in (
            {'candidateCount':0,'verified':[],'deferred':[],'errors':[]},
            {'candidateCount':2,'verified':[{}],'deferred':[],'errors':[]},
            {'candidateCount':1,'verified':[],'deferred':[],'errors':[{'reason':'timeout'}]},
        ):
            with self.subTest(report=report), self.assertRaises(ValueError):
                check_report(report)

    def test_non_allocation_document_revision_keeps_both_hashes(self):
        body = copy.deepcopy(self.body)
        body['retrievedDisplayMetadata'] = {'label': 'updated'}
        proof = verify(self.isin, self.record, self.now, lambda url: body)
        self.assertEqual(proof['evidenceRelation'], 'same-qualified-allocations')
        self.assertEqual(proof['activeSourceHash'], self.record['countries']['sha256'])
        self.assertNotEqual(proof['sourceHash'], proof['activeSourceHash'])
        self.assertEqual(hashlib.sha256(proof['canonicalBody'].encode()).hexdigest(), proof['sourceHash'])
        # A real allocation change must still fail even when the old hash matches
        # the other active field. No tolerance, renormalisation or recertification.
        body['tables'][0]['values'][0]['column_1']['sortValue'] += .01
        with self.assertRaises(ValueError):
            verify(self.isin, self.record, self.now, lambda url: body)

    def test_network_failure_preserves_error_and_produces_no_proof(self):
        def fail(url): raise TimeoutError('DWS timeout')
        report = collect({self.isin: self.record}, self.now, fail)
        self.assertEqual(report['verified'], [])
        self.assertIn('DWS timeout', report['errors'][0]['reason'])

    def test_stability_ignores_only_display_name_with_unchanged_checksummed_isin(self):
        baseline = stability_hash(self.body)
        renamed = copy.deepcopy(self.body)
        row = renamed['tables'][0]['values'][0]
        row['column_0']['value'] = 'New display spelling'
        self.assertEqual(stability_hash(renamed), baseline)
        proof = verify(self.isin, self.record, self.now, lambda url: renamed)
        self.assertEqual(proof['stabilitySourceHash'], baseline)
        self.assertNotEqual(proof['sourceHash'], self.record['countries']['sha256'])
        for field, key, value in [('header','value','US0378331005'),
                                  ('column_1','sortValue',0.123456),
                                  ('column_2','sortValue',123456),
                                  ('column_3','value','France'),
                                  ('column_4','value','Finance'),
                                  ('column_5','value','Preferred Stock')]:
            changed = copy.deepcopy(self.body)
            changed['tables'][0]['values'][0][field][key] = value
            with self.subTest(field=field):
                self.assertNotEqual(stability_hash(changed), baseline)
        for identity in ['cash', 'US0378331006']:
            unknown = copy.deepcopy(self.body)
            unknown['tables'][0]['values'][0]['header']['value'] = identity
            changed = copy.deepcopy(unknown)
            changed['tables'][0]['values'][0]['column_0']['value'] = 'Different unidentified holding'
            self.assertNotEqual(stability_hash(changed), stability_hash(unknown))
        self.assertEqual(json.loads(verify(self.isin,self.record,self.now,lambda url:self.body)['canonicalBody']),self.body)

    def test_official_reit_class_preserves_country_industry_and_weights(self):
        body = copy.deepcopy(self.body)
        row = next(r for r in body['tables'][0]['values'] if r['column_5']['value'] == 'Equities')
        row['column_5']['value'] = 'Real Estate Investment Trust'
        parsed = parse_holdings(body, {'isin': self.isin}, self.now, self.url)
        for field in ('countries', 'sectors'):
            self.assertEqual(parsed[field]['rows'], self.record[field]['rows'])
        proof = verify(self.isin, parsed, self.now, lambda url: body)
        self.assertEqual(proof['sourceHash'], parsed['countries']['sha256'])
        row['column_1']['sortValue'] = -1
        with self.assertRaises(ValueError):
            parse_holdings(body, {'isin': self.isin}, self.now, self.url)
        row['column_5']['value'] = 'Unknown fund type'
        with self.assertRaises(ValueError):
            parse_holdings(body, {'isin': self.isin}, self.now, self.url)


if __name__ == '__main__':
    unittest.main()

