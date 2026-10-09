import copy
import datetime as dt
import json
import pathlib
import unittest
from collect_insurance import parse_contract, parse_fund, refresh, validate, qualify_vie_guarantees, vie_notice_url
TODAY=dt.date(2026,10,8)
ROOT=pathlib.Path(__file__).resolve().parents[1]

class InsuranceTests(unittest.TestCase):
    def test_vie_notice_net_guarantee_and_conflicting_fees(self):
        notice=(ROOT/'scripts/fixtures/linxea-vie-essential.txt').read_text()
        record=copy.deepcopy(next(r for r in self.previous()['records'] if r['id']=='linxea-vie'))
        qualify_vie_guarantees(record,notice,'https://www.linxea.com/document/conditions-generales-linxea-vie/')
        self.assertEqual([f['guarantee'] for f in record['euroFunds']],[99.25,99.25])
        self.assertIn('calculé',record['euroFunds'][1]['guaranteeBasis'])
        for altered in [notice.replace('0 ,75','0 ,80'),notice.replace('nettes\nde frais','brutes\nde frais'),notice.replace('Eurossima','Autre fonds')]:
            with self.assertRaises(ValueError):qualify_vie_guarantees(record,altered,'https://www.linxea.com/document/notice/')

    def test_notice_discovery_and_missing_qualified_condition(self):
        self.assertEqual(vie_notice_url('<a href="/document/notice/">Conditions générales du contrat</a>'),'https://www.linxea.com/document/notice/')
        for html in ['', '<a href="https://other.test/notice">Conditions générales du contrat</a>']:
            with self.assertRaises(ValueError):vie_notice_url(html)
        previous=self.previous()
        for field in ('guarantee','maxAllocation','ceiling'):
            bad=copy.deepcopy(previous['records'][0]);bad['euroFunds'][0][field]=None
            result,obs=refresh(previous,{bad['id']:lambda day:bad},TODAY)
            self.assertEqual(result,previous);self.assertEqual(obs[0]['status'],'failure')

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
    def test_conditional_range_is_not_presented_as_one_return(self):
        html="""LE FONDS EUROS Netissima Accessible à 100 % 3 % Net en 2025 3 % net en 2024 3,10 % à 4,12 % net en 2023 selon la part UC détenue (1) Net de frais
        Fonctionnement des Fonds euros de Linxea Vie Netissima Stratégie d’investissement
        sans conditions d’unités de compte jusqu’au 31/12/2026. 0,75 % par an de frais de gestion pour les contrats ouverts après 2017.
        Rachat total : Taux Minimum Garanti Arbitrages Documents applicables"""
        r=parse_fund(html,'linxea-vie','Netissima','Netissima','https://www.linxea.com',TODAY,'capital est garanti à hauteur de 99,25 %')
        self.assertEqual(r['years'][0],{'year':2023,'returnMin':3.1,'returnMax':4.12,'condition':'selon la part UC détenue'})
        self.assertEqual(r['accessValidUntil'],'2026-12-31')
        with self.assertRaises(ValueError):parse_fund(html.replace('31/12/2026','31/12/2025'),'linxea-vie','Netissima','Netissima','https://www.linxea.com',TODAY,'capital est garanti à hauteur de 99,25 %')
    def test_zen_penalty_and_available_history(self):
        html="""LE FONDS EUROS Euroflex 100 % en fonds € 3,25 % Net en 2025 1 % en 2024 Les performances passées
        Fonctionnement des Fonds euros de Linxea Zen Apicil Euroflex Stratégie d’investissement
        sans limite de montant et sans conditions d’unités de compte. 1,6 % de frais de gestion annuel Garantie en capital à hauteur de 98,4 %
        2 % de pénalité en cas d’arbitrage. Un rachat total en cours d’année entraîne la perte de tout droit Arbitrages Documents applicables"""
        r=parse_fund(html,'linxea-zen','Apicil Euroflex','Euroflex','https://www.linxea.com',TODAY)
        self.assertEqual([v['year'] for v in r['years']],[2024,2025])
        self.assertIn('2 % de pénalité',r['operations'])
        self.assertIn('rachat total',r['notes'])

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
