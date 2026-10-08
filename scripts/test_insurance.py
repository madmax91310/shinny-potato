import copy
import datetime as dt
import json
import pathlib
import unittest
from collect_insurance import parse_contract, parse_fund, refresh, validate
TODAY=dt.date(2026,10,8)
ROOT=pathlib.Path(__file__).resolve().parents[1]

class InsuranceTests(unittest.TestCase):
    def contract(self):
        return '''<section><h1>Linxea Spirit 2</h1><img alt="Spirica">ETF SCPI Private Equity Actions</section>
        <h2>Plus de 1100 supports disponibles</h2>Accessible dès 500€ de versement initial
        Versement libre dès 100€ Versement programmé dès 100€/mois
        <table><tr><td>Versement</td><td>0 %</td><td>3 %</td></tr>
        <tr><td>Arbitrage en ligne</td><td>0 %</td></tr>
        <tr><td>Gestion des unités de compte / an</td><td>0,5 %</td></tr>
        <tr><td>Transactions ETF</td><td>0,06 %</td></tr></table>
        Simulation 20 ans : versement initial 10000€ Bonus 5 %'''
    def previous(self):
        return json.loads((ROOT/'src/data/automated-insurance.json').read_text())
    def test_contract_column_not_simulation_or_average(self):
        r=parse_contract(self.contract(),'linxea-spirit-2',TODAY)
        self.assertEqual(r['fees']['subscription'],0)
        self.assertEqual(r['fees']['units'],.5)
        self.assertEqual(r['access']['initial'],500)
        with self.assertRaises(ValueError):parse_contract(self.contract().replace('Spirica','Inconnu'),'linxea-spirit-2',TODAY)
    def test_fund_history_excludes_bonus_and_future(self):
        html='''LE FONDS EUROS Nouvelle Génération 3,08 % Net en 2025 3,13 % Net en 2024 3,13 % Net en 2023 8 % Net en 2026 Accessible à 100 % Les rendements passés Bonus 5 % en 2025 garantie nette de frais de gestion de 98 % frais de gestion de 2 % sans conditions d’unités de compte jusqu’à 5 millions d’euros'''
        r=parse_fund(html,'linxea-spirit-2','Euro Nouvelle Génération','Nouvelle Génération','https://www.linxea.com',TODAY)
        self.assertEqual(r['years'],[{'year':2023,'return':3.13},{'year':2024,'return':3.13},{'year':2025,'return':3.08}])
        with self.assertRaises(ValueError):parse_fund(html.replace('en 2025','en 2022'),'linxea-spirit-2','Euro Nouvelle Génération','Nouvelle Génération','https://www.linxea.com',TODAY)
    def test_failed_contract_preserved_other_updated(self):
        previous=self.previous();updated=copy.deepcopy(previous['records'][1]);updated['fees']['units']=.7
        def failed(day):raise ValueError('Source changed')
        result,obs=refresh(previous,{previous['records'][0]['id']:failed,updated['id']:lambda day:updated},TODAY)
        self.assertEqual(result['records'][0],previous['records'][0]);self.assertEqual(result['records'][1]['fees']['units'],.7)
        self.assertEqual([o['status'] for o in obs],['failure','success'])
    def test_invalid_or_old_history_preserves_previous(self):
        previous=self.previous();bad=copy.deepcopy(previous['records'][0]);bad['euroFunds'][0]['years'].pop()
        self.assertEqual(refresh(previous,{bad['id']:lambda day:bad},TODAY)[0],previous)
        bad=copy.deepcopy(previous['records'][0]);bad['euroFunds'][0]['managementFeeMax']=float('nan')
        with self.assertRaises(ValueError):validate(bad,TODAY)

if __name__=='__main__':unittest.main()
