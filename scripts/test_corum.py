import datetime as dt
import json
import pathlib
import unittest
import copy
import hashlib
from unittest.mock import patch
from collect_corum import parse_annual_allocations, parse_annual, parse_conditions, documents, qualified_vector_quarterly
TODAY=dt.date(2026,10,8)
FIXTURES=pathlib.Path(__file__).parent/'fixtures/corum'

class CorumTests(unittest.TestCase):
    def test_vector_bulletin_requires_exact_qualified_bytes_and_period(self):
        registry=json.loads((FIXTURES.parent.parent/'corum-quarterly-qualified.json').read_text())
        data=b'%PDF-test-vector-document'
        for id_ in ('corum-origin','corum-xl'):
            test_registry=copy.deepcopy(registry);test_registry[id_]['sha256']=hashlib.sha256(data).hexdigest()
            with patch('collect_corum.json.loads',return_value=test_registry):
                snapshot,portfolio=qualified_vector_quarterly(data,id_,registry[id_]['sourceUrl'],TODAY)
                self.assertEqual(sum(r['value'] for r in snapshot['countries']),100)
                self.assertEqual(sum(r['value'] for r in snapshot['sectors']),100)
                self.assertEqual(snapshot['asOf'],'2026-06-30')
                self.assertEqual(portfolio['occupancy']['asOf'],'2026-06-30')
                for bad_data,url,day in [(data+b'changed',registry[id_]['sourceUrl'],TODAY),(data,registry[id_]['sourceUrl'].replace('2026-T2','2026-T3'),TODAY),(data,registry[id_]['sourceUrl'],dt.date(2026,5,1))]:
                    with self.assertRaises(ValueError):qualified_vector_quarterly(bad_data,id_,url,day)

    def test_columns_and_allocation_totals(self):
        for k in ('origin','xl','eurion'):
            c,s=parse_annual_allocations(json.loads((FIXTURES/(k+'-allocation.json')).read_text()))
            self.assertEqual(sum(r['value'] for r in c),100)
            self.assertEqual(sum(r['value'] for r in s),100)
        c,s=parse_annual_allocations(json.loads((FIXTURES/'origin-allocation.json').read_text()))
        self.assertEqual(next(r['value'] for r in s if r['label']=='Commerces'),26)
        self.assertEqual(next(r['value'] for r in c if r['label']=='Irlande'),13)
    def test_annual_columns_and_current_year(self):
        text='Évolution du prix de la part 2025 2024 2023 2022 2021\nTaux de distribution[3] 6,50 % 6,05 % 6,06 % 6,88 % 7,03 %\nVariation du prix de la part'
        self.assertEqual(parse_annual(text,TODAY),[{'year':2023,'distribution':6.06},{'year':2024,'distribution':6.05},{'year':2025,'distribution':6.5}])
        with self.assertRaises(ValueError):parse_annual(text.replace('2025','2024'),TODAY)
    def test_zone_fees_and_price_effective_date(self):
        text='au moins une (1) part sociale fixer le prix de souscription de la part à 195 € depuis le 1er juin 2022 commission de souscription de 12 % TTC du prix de souscription perçoit une commission de gestion de 12,40 % TTC en zone euro et de 15,90 % TTC sur les produits hors zone euro entrée en jouissance est fixée au 1er jour du 6ème mois suivant la souscription produits locatifs HT encaissés et les produits financiers nets prix de souscription diminué de la commission de souscription'
        price,c=parse_conditions(text,'corum-xl','dividendes versés mensuellement')
        self.assertEqual(price,{'value':195,'asOf':'2022-06-01'})
        self.assertEqual(c['managementZones'],{'euro':12.4,'outside':15.9})
        with self.assertRaises(ValueError):parse_conditions(text.replace('15,90 % TTC','taux variable'),'corum-xl','dividendes mensuellement')
    def test_missing_weight_fails(self):
        pages=json.loads((FIXTURES/'origin-allocation.json').read_text())
        pages[0]['words']=[w for w in pages[0]['words'] if w['text']!='%']
        with self.assertRaises(ValueError):parse_annual_allocations(pages)
    def test_discovery_rejects_old_annual(self):
        with self.assertRaises(ValueError):documents('<a href="/files/2025-04/Rapport annuel CORUM Origin 2024.pdf">PDF</a>','CORUM Origin',TODAY)

if __name__=='__main__':unittest.main()
