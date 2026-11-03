"""Localized labels observed on issuer pages must preserve the same strict gates."""
import copy
import datetime as dt
import gzip
import hashlib
import json
from pathlib import Path
from collect_dca_complete_holdings import parse_complete
import unittest
from collect_dca_complete_holdings import physical_ssga_page
from test_dca_complete_realestate import CompleteRealEstate

class LocalizedComplete(CompleteRealEstate):
    def test_ssga_exact_row_and_spelling(self):
        for label,value in [('Replication Method','Optimised'),('Replication Method','Optimized'),('Méthode de Réplication','Optimisé'),('Méthode de Réplication','Réplication'),('Replikationsmethode','Optimiert')]:
            row=f'<tr><th>{label}</th><td>{value}</td></tr>'
            self.assertTrue(physical_ssga_page('<table>'+row+'</table>'))
            self.assertFalse(physical_ssga_page('<table>'+row+row+'</table>'))
        self.assertFalse(physical_ssga_page('<p>Replication Method Optimised</p>'))
        self.assertFalse(physical_ssga_page('<table><tr><th>Replication Method</th><td>Synthetic</td></tr></table>'))
        self.assertFalse(physical_ssga_page('<table><tr><th>Index Method</th><td>Optimised</td></tr></table>'))

    def test_german_is_literal_translation_not_inferred_identity(self):
        body=self.body()
        facts=body['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
        facts['assetClass']['value']='Aktien';facts['productStructure']['value']='Physisch'
        points=body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
        points['assetClass']['value']=['Aktien','Aktien']
        original=copy.deepcopy(body)
        result,classified=self.parse(body,'Equity')
        self.assertEqual(sum(r['weightPct'] for r in result['rows']),100)
        self.assertEqual(classified,[],'Untranslated sector/country names must not overwrite existing classifications')
        self.assertEqual(body,original,'Raw issuer proof stays intact')
        facts['productStructure']['value']='Synthetisch'
        with self.assertRaises(ValueError):self.parse(body,'Equity')
        facts['productStructure']['value']='Physisch';facts['isin']['value']='WRONG'
        with self.assertRaises(ValueError):self.parse(body,'Equity')

    def test_exact_german_share_same_snapshot_allocations(self):
        body = self.german_fixture()
        original = copy.deepcopy(body)
        configured = json.loads(Path(__file__).with_name('dca-complete-holdings-sources.json').read_text())['DE0002635307']
        self.assertIn('portfolioId=251931', configured['url'])
        self.assertIn('locale=de_DE', configured['url'])
        record, securities = self.parse_german(body)
        self.assertEqual(body, original)
        self.assertEqual(securities, [], 'No change to the security-classification pipeline')
        self.assertEqual(record['asOf'], '2026-10-30')
        points = body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
        expected = [(isin, weight) for isin, weight, kind in zip(points['isin']['value'], points['holdingPercent']['value'], points['assetClass']['value']) if kind == 'Aktien' and weight > 0]
        self.assertEqual([(r['isin'], r['weightPct']) for r in record['rows']], expected)
        facts = record['compositionFacts']
        self.assertEqual(facts['asOf'], record['asOf'])
        for field in ['countries', 'sectors']:
            self.assertEqual(facts[field]['asOf'], record['asOf'])
            self.assertAlmostEqual(sum(r['weightPct'] for r in facts[field]['rows']), 99.65944)
        self.assertIn('United Kingdom', [r['name'] for r in facts['countries']['rows']])
        self.assertIn('Financials', [r['name'] for r in facts['sectors']['rows']])

    def test_unknown_labels_never_certify_a_complete_allocation(self):
        for field, label in [('countryOfRisk', 'UNQUALIFIED COUNTRY'), ('sectorName', 'Sonstige'), ('sectorName', None)]:
            body = self.german_fixture()
            points = body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
            index = next(i for i, (kind, weight) in enumerate(zip(points['assetClass']['value'], points['holdingPercent']['value'])) if kind == 'Aktien' and weight > 0)
            points[field]['value'][index] = label
            record, _ = self.parse_german(body)
            self.assertTrue(record['complete'])
            self.assertNotIn('compositionFacts', record)

    def german_fixture(self):
        raw = Path(__file__).with_name('fixtures').joinpath('stoxx600-complete-20261101.json.gz').read_bytes()
        self.assertEqual(hashlib.sha256(raw).hexdigest(), '8f658a6aa92e87e1c5b90a8e975ebe733b71dc2ba0e77138f82921c9dada9162')
        return json.loads(gzip.decompress(raw))

    def parse_german(self, body):
        return parse_complete(body, 'DE0002635307', 'https://www.blackrock.com/?portfolioId=251931', dt.datetime(2026, 11, 1, tzinfo=dt.timezone.utc))
