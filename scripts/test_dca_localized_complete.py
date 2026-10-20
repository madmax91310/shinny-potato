"""Localized labels observed on issuer pages must preserve the same strict gates."""
import copy
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
