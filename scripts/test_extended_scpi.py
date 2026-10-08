import copy
import datetime as dt
import json
import pathlib
import unittest
from collect_extended_scpi import parse_transitions, parse_activimmo, latest
from collect_scpi import validate, refresh, iroko_portfolio, remake_portfolio
from collect_corum import parse_annual_portfolio, parse_annual_price_history, parse_eurion_quarterly
FIXTURES=pathlib.Path(__file__).parent/'fixtures/extended-scpi'
ROOT=pathlib.Path(__file__).resolve().parents[1]
TODAY=dt.date(2026,10,8)
URL='https://www.arkea-reim.com/report.pdf'
def pages(k):return json.loads((FIXTURES/(k+'-bbox.json')).read_text())

class ExtendedScpiTests(unittest.TestCase):
    def test_transitions_distributions_not_pga_or_target(self):
        text='''SCPI Transitions Europe Bulletin d’information 30/06/2026
        Performances passées PGA 8.60 % Objectif 6 %
        8.16 % 8.25 % 7.60 % Taux de distribution
        2023 2024 2025 À retenir Prix de part 200 € 200 € 202 €
        Activité locative (TOF) 99 %* garanties locatives
        Informations générales Frais Commission de souscription 10 % HT max.
        Commission de gestion 10 % HT max. des loyers
        Prix de souscription 202 € Première souscription : 5 parts
        Délai de jouissance 1er jour du 6ème mois Fréquence de distribution potentielle Trimestrielle'''
        note='commission perçue par la Société de Gestion : 10% HT maximum de la totalité des produits locatifs exigibles et encaissés hors taxes et hors charges refacturées aux locataires et des produits financiers nets'
        r=parse_transitions(text,pages('transitions'),note,URL,TODAY)
        self.assertEqual([v['distribution'] for v in r['annual']['years']],[8.16,8.25,7.6])
        self.assertEqual(r['portfolio']['buildings']['value'],59)
        self.assertEqual(r['portfolio']['tenants']['value'],358)
        self.assertEqual(r['conditions']['minimum'],1010)
        for key in ('countries','sectors'):self.assertEqual(sum(v['value'] for v in r['snapshot'][key]),100)
        with self.assertRaises(ValueError):parse_transitions(text.replace('2023 2024 2025','2022 2023 2024'),pages('transitions'),note,URL,TODAY)
    def test_activimmo_current_annex_not_old_minimum(self):
        text='ACTIVIMMO PATRIMOINE AU 30.06.2026 93,3% TOF hors développements indemnité de résiliation anticipée'
        annual='2021 2022 2023 2024 2025 Prix de souscription au 1er janvier (2019) 610,00€ 610,00€ 610,00€ 610,00€ 610,00€ Taux de distribution sur valeur de marché 6,02% 5,50% 5,52% 5,50% 5,49% Report à nouveau cumulé par part constitué un portefeuille de 179 actifs versement d’un dividende mensuel'
        note='Gestion perçoit définitivement 10% HT sur loyers et produits financiers nets. Minimum : 10 parts avant mai 2026 ; le minimum sera d’une (1) part. Jouissance au premier jour du sixième mois.'
        annex='A compter du 1er juillet 2026, (613,50 €) par part ; commission de souscription incluse : 10,6% hors taxes'
        r=parse_activimmo(text,pages('activimmo'),annual,note,annex,URL,URL,URL,URL,TODAY)
        self.assertEqual(r['price']['value'],613.5)
        self.assertEqual(r['price']['asOf'],'2026-07-01')
        self.assertEqual(r['conditions']['minimum'],613.5)
        self.assertEqual(r['conditions']['frequency'],'mensuels')
        self.assertEqual(r['portfolio']['tenants']['value'],369)
        self.assertEqual(r['portfolio']['buildings']['asOf'],'2025-12-31')
        self.assertEqual(r['priceHistory']['years'][-1],{'asOf':'2026-07-01','value':613.5})
        for key in ('countries','sectors'):self.assertAlmostEqual(sum(v['value'] for v in r['snapshot'][key]),100)
        with self.assertRaises(ValueError):parse_activimmo(text,pages('activimmo'),annual,note,annex.replace('2026','2027'),URL,URL,URL,URL,TODAY)
    def test_eurion_quarterly_not_annual_data(self):
        snapshot,portfolio=parse_eurion_quarterly('CORUM Eurion DONNÉES AU 30 JUIN 2026 FINANCIER (TOF) 99,92 %',pages('eurion'),URL,TODAY)
        self.assertEqual(snapshot['asOf'],'2026-06-30')
        self.assertEqual(snapshot['countries'][0],{'label':'Pays-Bas','value':27})
        self.assertEqual(portfolio['buildings']['value'],54)
        self.assertEqual(portfolio['tenants']['value'],129)
        self.assertEqual(portfolio['occupancy']['value'],99.92)
    def test_corum_annual_prices_and_metrics_keep_dates(self):
        text='LE PROFIL 167 nombre d’immeubles 412 nombre de locataires Taux d’occupation financier 96,2 % y compris les locaux sous franchise de loyer'
        r=parse_annual_portfolio(text,2025,URL)
        self.assertEqual(r['occupancy']['value'],96.2);self.assertEqual(r['tenants']['asOf'],'2025-12-31')
        history=parse_annual_price_history('Évolution du prix de la part 2025 2024 2023 2022 2021\nPrix de souscription au 31/12 1135 € 1135 € 1135 € 1135 € 1090 €\nDividende brut',TODAY,URL)
        self.assertEqual(history['years'][0],{'asOf':'2021-12-31','value':1090})
    def test_iroko_latest_non_null_and_no_future_observation(self):
        rows=[{'name':k,'value':v,'update_date':'2026-06-30'} for k,v in [('asset_count',183),('tenant_count',471),('financial_occupancy_rate',96.88)]]
        rows += [{'name':'asset_count','value':999,'update_date':'2027-01-01'},{'name':'tenant_count','value':None,'update_date':'2026-09-30'}]
        r=iroko_portfolio(rows,TODAY);self.assertEqual(r['buildings']['value'],183);self.assertEqual(r['tenants']['value'],471)
    def test_bad_metrics_or_regression_preserve_whole_record(self):
        row=next(r for r in json.loads((ROOT/'src/data/automated-scpi.json').read_text())['records'] if r['id']=='corum-origin');previous={'records':[row]}
        for mutation in [lambda r:r['portfolio']['occupancy'].update(value=101),lambda r:r['portfolio']['tenants'].update(value=float('nan')),lambda r:r['portfolio']['buildings'].update(asOf='2024-12-31'),lambda r:r.pop('priceHistory')]:
            bad=copy.deepcopy(row);mutation(bad)
            result,obs=refresh(previous,{row['id']:lambda today:bad},TODAY)
            self.assertEqual(result,previous);self.assertEqual(obs[0]['status'],'failure')
    def test_latest_completed_bulletin(self):
        urls=['https://issuer.fr/BTI-T2-2026-ActivImmo.pdf','https://issuer.fr/BTI-T4-2026-ActivImmo.pdf','https://issuer.fr/BTI-T1-2026-ActivImmo.pdf']
        self.assertEqual(latest(urls,r'BTI-T(?P<quarter>\d)-(?P<year>\d{4})-ActivImmo',TODAY),urls[0])
        pattern=r'te_(?:t(?P<quarter>\d)|s(?P<semester>\d))[-_](?P<year>\d{4})'
        self.assertEqual(latest(['https://issuer.fr/te_s1-2026.pdf','https://issuer.fr/te_s2-2026.pdf'],pattern,TODAY),'https://issuer.fr/te_s1-2026.pdf')
        self.assertEqual(latest(urls,r'BTI-T(?P<quarter>\d)-(?P<year>\d{4})-ActivImmo',dt.date(2026,6,30)),urls[0])
    def test_remake_tenants_not_inferred_from_leases(self):
        r=remake_portfolio('pour la diversification : 77 immeubles Locaux occupés sous franchise 145 Baux','2026-06-30',URL,pages('remake'))
        self.assertEqual(r['buildings']['value'],77);self.assertEqual(r['occupancy']['value'],98.93);self.assertNotIn('tenants',r)

if __name__=='__main__':unittest.main()
