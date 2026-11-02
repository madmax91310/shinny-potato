"""Real exact-share responses; financial guards stay independent of the live catalogue size."""
import copy
import datetime as dt
import gzip
import hashlib
import json
from pathlib import Path
import unittest
from urllib.parse import parse_qs, urlsplit
from collect_etf_pilot import collect, parse_share
from collect_instrument_metadata import collect as collect_metadata, merge_field_observation
from apply_etf_collection import merge_collection
from refresh_additional_etf import refresh
from collect_official_share_history import collect_one

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT/'scripts/fixtures/new-instruments'
NOW = dt.datetime(2026, 11, 1, tzinfo=dt.timezone.utc)
OWN_ISINS = {r['isin'] for r in json.loads((ROOT/'src/data/new-instrument-identities.json').read_text())}
CONFIGS = [s for s in json.loads((ROOT/'scripts/additional-etf-sources.json').read_text())['instruments'] if s['isin'] in OWN_ISINS]
RECEIPTS = json.loads((ROOT/'docs/new-instruments-sources-2026-11-01.json').read_text())['observations']

def response(isin):
    return json.loads(gzip.decompress((FIXTURES/(isin+'.json.gz')).read_bytes()))

def fetch_cached(url, *_):
    pid = parse_qs(urlsplit(url).query)['portfolioId'][0]
    source = next(s for s in CONFIGS if str(s['productId']) == pid)
    return json.dumps(response(source['isin']), ensure_ascii=False)

class NewInstruments(unittest.TestCase):
    def test_each_real_response_identity_and_provenance(self):
        report = collect({'instruments': CONFIGS}, {s['isin']: {} for s in CONFIGS}, NOW, fetch=fetch_cached)
        self.assertFalse(report['failures'])
        records = merge_collection(report, {}, {})
        for source in CONFIGS:
            with self.subTest(isin=source['isin']):
                receipt = next(r for r in RECEIPTS if r['isin'] == source['isin'])
                raw = gzip.decompress((ROOT/receipt['fixture']).read_bytes())
                self.assertEqual(hashlib.sha256(raw).hexdigest(), receipt['sha256'])
                record = records[source['isin']]
                self.assertEqual(record['currency'], source['currency'])
                self.assertEqual(record['characteristics']['index'], source['expectedIndex'])
                self.assertEqual(record['characteristics']['replicationMethodRaw']['productStructure'], 'Physical')
                self.assertEqual(record['characteristics']['sha256'], receipt['sha256'])
                self.assertNotIn('asOf', record['characteristics'], 'Undated facts never borrow the AUM date')
                self.assertLess(record['aum']['asOf'], record['aum']['checkedAt'])
                for year, proof in record['performance']['yearEvidence'].items():
                    self.assertEqual(proof['asOf'], year+'-12-31')
                    self.assertEqual(proof['sha256'], receipt['sha256'])
                for field in ['countries', 'sectors', 'holdings']:
                    self.assertTrue(record[field]['rows'])
                    self.assertTrue(record[field]['sourceUrl'])
                    self.assertEqual(record[field]['sha256'], receipt['sha256'])

    def test_wrong_share_product_currency_policy_and_strategy(self):
        for source in CONFIGS:
            for field, bad in [('isin', 'IE00B4L5Y983'), ('indexSeriesName', 'Neighbour index'),
                               ('useOfProfitsCode', 'Neighbour policy'), ('assetClass', 'Other'),
                               ('productStructure', 'Synthetic'), ('ucitsCompliantFlag', 'No')]:
                with self.subTest(isin=source['isin'], field=field):
                    body = response(source['isin'])
                    body['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap'][field]['value'] = bad
                    with self.assertRaises(ValueError): parse_share(body, source, NOW)
            for field, bad in [('productId', 1), ('currencyCode', 'JPY')]:
                body = response(source['isin']); body[field] = bad
                with self.assertRaises(ValueError): parse_share(body, source, NOW)

    def test_missing_partial_conflict_and_failed_source_preserve_real_clock(self):
        source = CONFIGS[0]
        valid = collect({'instruments':[source]}, {source['isin']:{}}, NOW, fetch=fetch_cached)
        current = merge_collection(valid, {}, {})
        for missing in ['isin','emeaMgt','totalNetAssets']:
            body = response(source['isin'])
            del body['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap'][missing]
            invalid = collect({'instruments':[source]}, {source['isin']:{}}, NOW, fetch=lambda *_:json.dumps(body))
            self.assertTrue(invalid['failures'])
            self.assertEqual(merge_collection(invalid, current, {}), current)
        # A later successful fee-only response does not re-date holdings or years.
        partial = {**source, 'characteristics': {'terPct': current[source['isin']]['characteristics']['terPct']}}
        after = merge_collection({'checkedAt':'2026-11-02','shares':[partial]}, current, {})
        for field in ['aum','holdings','countries','sectors','performance']:
            self.assertEqual(after[source['isin']][field], current[source['isin']][field])
        self.assertEqual(after[source['isin']]['characteristicChecks']['index'], current[source['isin']]['characteristicChecks']['index'])
        body = response(source['isin'])
        del body['componentsByNameMap']['holdings']
        partial_response = collect({'instruments':[source]}, {source['isin']:{}}, NOW+dt.timedelta(days=1),
                                   fetch=lambda *_:json.dumps(body))
        self.assertFalse(partial_response['failures'])
        self.assertTrue(partial_response['shares'][0]['collectionErrors'])
        retained_holdings = merge_collection(partial_response, current, {})[source['isin']]['holdings']
        self.assertEqual(retained_holdings, current[source['isin']]['holdings'])
        def fail(*_): raise OSError('source unavailable')
        retained, report = refresh({'instruments':[source]}, current, {}, NOW, collect=fail)
        self.assertEqual(retained,current);self.assertEqual(report['shares'][0]['status'],'failed')

    def test_listing_route_does_not_certify_other_fields(self):
        routes = {s['isin']:s for s in json.loads((ROOT/'scripts/instrument-metadata-sources.json').read_text())['instruments']}
        for source in CONFIGS:
            current_route = routes[source['isin']]
            self.assertIn('listings', current_route['fields'])
            receipt = next(r for r in RECEIPTS if r['isin'] == source['isin'])
            # Replay the listing-only admission against its actual receipt. A
            # later separately qualified hedge route must not alter this oracle.
            route = {**current_route, 'fields': ['listings'], 'urls': [receipt['listingSourceUrl']]}
            raw = gzip.decompress((FIXTURES/(source['isin']+'-metadata.json.gz')).read_bytes())
            values, errors = collect_metadata(route,NOW,fetch=lambda *_,body=raw,**__:body)
            self.assertFalse(errors);self.assertEqual(list(values),['listings'])
            self.assertTrue(values['listings']['value'])
            for row in values['listings']['value']:
                self.assertIn(source['isin'],row['evidenceId']);self.assertEqual(row['sha256'],hashlib.sha256(raw).hexdigest())
            later, errors = collect_metadata(route,NOW,fetch=lambda *_:b'{"productId":0}')
            self.assertFalse(later);self.assertTrue(errors)
            old_receipt = {**values['listings'], 'checkedAt':'2026-10-31'}
            self.assertEqual(merge_field_observation('listings',values['listings'],old_receipt),values['listings'])

    def test_monthly_routes_replay_real_qualified_responses(self):
        sources = json.loads((ROOT/'scripts/new-instrument-nav-sources.json').read_text())
        # Fixture receipts belong to these immutable source responses, never the
        # production snapshot renewed by an ordinary monthly collection.
        evidence = json.loads((FIXTURES/'monthly/qualified-receipts.json').read_text())
        for source in sources:
            proof = evidence[source['id']]
            url,digest = next(iter(proof['rawSourceHashes'].items()))
            raw = gzip.decompress((FIXTURES/'monthly'/(digest+'.json.gz')).read_bytes())
            self.assertEqual(hashlib.sha256(raw).hexdigest(),digest)
            body = json.loads(raw)
            replay = collect_one(source,NOW,json_fetch=lambda *_,b=body:b)
            self.assertEqual(replay['points'],proof['points'])
            self.assertTrue(replay['calendarProof']['checks'])
            self.assertEqual(replay['anniversaryPoints'],proof['anniversaryPoints'])
            damaged = copy.deepcopy(body)
            damaged['componentsByNameMap']['performance']['containersByNameMap']['chart']['dataPointsByNameMap']['currencySymbol']['value']='JPY'
            with self.assertRaises(ValueError): collect_one(source,NOW,json_fetch=lambda *_:damaged)

    def test_benchmark_notices_keep_their_actual_response_proof(self):
        for receipt in RECEIPTS:
            if receipt.get('pageFixture'):
                raw = gzip.decompress((ROOT/receipt['pageFixture']).read_bytes())
                self.assertEqual(hashlib.sha256(raw).hexdigest(),receipt['pageSha256'])
                self.assertIn(receipt['isin'],raw.decode())

    def test_pre_launch_zero_is_excluded_but_in_life_zero_is_rejected(self):
        from issuer_nav_history import blackrock_nav
        body = response('IE00BFM6T814')
        parsed = blackrock_nav(body, 'IE00BFM6T814', 'USD', NOW)
        self.assertGreaterEqual(min(parsed['nav']), '2018-05-31')
        chart = body['componentsByNameMap']['performance']['containersByNameMap']['chart']['dataPointsByNameMap']['navData']
        position = next(i for i,d in enumerate(chart['asOfDate']) if d>=20180531)
        chart['value'][position] = 0
        with self.assertRaises(ValueError): blackrock_nav(body, 'IE00BFM6T814', 'USD', NOW)

    def test_emerging_navigation_uses_official_country_risks(self):
        receipts=json.loads((ROOT/'docs/new-instruments-sources-2026-11-01.json').read_text())['observations']
        for row in receipts:
            if not row.get('navigationFixture'): continue
            body=gzip.open(ROOT/row['navigationFixture'],'rb').read()
            self.assertEqual(hashlib.sha256(body).hexdigest(),row['pageSha256'])
            self.assertIn(row['isin'].encode(),body)
            self.assertRegex(body.lower(),rb'emerging\s+markets')

    def test_benchmark_changes_have_corroborating_exact_share_documents(self):
        receipts=json.loads((ROOT/'docs/new-instruments-sources-2026-11-01.json').read_text())['observations']
        changes=json.loads((ROOT/'src/data/benchmark-changes.json').read_text())['shares']
        for row in receipts:
            if row['isin'] not in changes: continue
            proof=row['benchmarkCorroboration']
            change=changes[row['isin']]
            self.assertEqual(change['corroborationUrl'],proof['sourceUrl'])
            self.assertNotEqual(change['sourceUrl'],change['corroborationUrl'])
            self.assertEqual(change['effectiveDate'],proof['effectiveDate'])
            pdf=gzip.open(ROOT/proof['fixture'],'rb').read()
            text=gzip.open(ROOT/proof['extractedTextFixture'],'rb').read()
            self.assertTrue(pdf.startswith(b'%PDF'))
            self.assertEqual(hashlib.sha256(pdf).hexdigest(),proof['sha256'])
            self.assertEqual(hashlib.sha256(text).hexdigest(),proof['extractedTextSha256'])
            self.assertIn(row['isin'].encode(),text)
            self.assertIn(proof['dateText'].encode(),text)
