import copy
import datetime as dt
import json
from pathlib import Path
import unittest
from collect_atland_scpi import parse_epargne
from collect_other_insurance import parse_lucya, parse_placement
from collect_scpi import remake_price_history, validate as validate_scpi, refresh as refresh_scpi
from collect_insurance import validate as validate_insurance, refresh as refresh_insurance
from insurance_literal import LiteralReader, nuxt_returns

ROOT=Path(__file__).resolve().parents[1]
TODAY=dt.date(2026,10,8)
URL='https://issuer.example/report.pdf'
PAGES=json.loads((ROOT/'scripts/fixtures/presentation-expansion/epargne-bbox.json').read_text())
BULLETIN='''SCPI Épargne Pierre 2ÈME TRIMESTRE 2026 Le profil du patrimoine au 30/06/2026
Les acquisitions sont localisées en France. Hors VEFA non livrées.
division par dix du prix de part, passant de 208 € à 20,80 € à compter du 1er juillet.
multiplication par dix du nombre de parts détenues.
Le prix de souscription d'une part depuis le 1er juillet 2026 : 20,80 € (soit 12 % TTC).
100 parts lors de la 1ère souscription. Au 1er jour du 6ème mois.
Souscriptions entre le 1er février 2026 et le 31 décembre 2026 : jouissance au premier jour du mois suivant.
À partir de janvier 2027, les revenus potentiels seront distribués mensuellement.
à compter de janvier prochain : chaque mois, et non plus chaque trimestre.
Le taux d'occupation financier s'établit à 94,14 %'''
ANNUAL='''Évolution du prix de la part
2025 2024 2023 2022 2021
Prix de souscription (si augmentation de capital) 208 208 208 208 208
❯ Taux de distribution(1) 5,28% 5,28% 5,28% 5,28% 5,36%
PGA 7 % Objectif 5,3 % Nombre de baux 1020'''
PRODUCT='<p>Commission de gestion 12 % TTC du montant total des recettes brutes encaissées</p><p>Prix de souscription (dont 12% TTC de commission) 20,80 €</p>'

def stored(kind,id_):
    return next(r for r in json.loads((ROOT/f'src/data/automated-{kind}.json').read_text())['records'] if r['id']==id_)

class ExpansionTests(unittest.TestCase):
    def epargne(self,text=BULLETIN,annual=ANNUAL,today=TODAY):
        return {'id':'epargne-pierre',**parse_epargne(text,PAGES,annual,URL,URL,today,PRODUCT)}
    def test_split_is_neutral_and_minimum_is_100_shares(self):
        r=validate_scpi(self.epargne(),TODAY)
        self.assertEqual(r['conditions']['minimum'],2080)
        self.assertEqual(r['priceHistory']['corporateActions'][0]['ratio'],10)
        self.assertEqual(r['portfolio']['tenants']['value'],760)
        self.assertEqual(r['portfolio']['buildings']['value'],411)
        self.assertEqual(r['portfolio']['occupancy']['value'],94.14)
        self.assertEqual([x['distribution'] for x in r['annual']['years']],[5.28]*3)
        self.assertAlmostEqual(sum(x['value'] for x in r['snapshot']['regions']),100)
    def test_future_price_and_wrong_split_rejected(self):
        for text in [BULLETIN.replace('20,80 €','21 €'),BULLETIN.replace('juillet 2026','juillet 2027')]:
            with self.assertRaises(ValueError):self.epargne(text)
    def test_calendar_rollover_does_not_shift_corporate_action(self):
        annual=ANNUAL.replace('2025 2024 2023 2022 2021','2026 2025 2024 2023 2022').replace('208 208 208 208 208','20,80 208 208 208 208')
        r=self.epargne(annual=annual,today=dt.date(2027,2,1))
        self.assertEqual(r['price']['asOf'],'2026-07-01')
        self.assertEqual(r['conditions']['frequency'],'mensuels')
        self.assertNotIn('01/02/2026',r['conditions']['enjoyment'])
        validate_scpi(r,dt.date(2027,2,1))
    def test_lost_split_or_invalid_region_preserves_whole_record(self):
        previous={'records':[self.epargne()]}
        for mutation in [lambda r:r['priceHistory'].pop('corporateActions'),lambda r:r['snapshot']['regions'][0].update(value=90),lambda r:r['priceHistory']['corporateActions'][0].update(ratio=100)]:
            bad=copy.deepcopy(previous['records'][0]);mutation(bad)
            result,obs=refresh_scpi(previous,{'epargne-pierre':lambda day:bad},TODAY)
            self.assertEqual(result,previous);self.assertEqual(obs[0]['status'],'failure')
    def test_remake_year_end_prices_not_withdrawal_counts(self):
        annual='''31.12.2024 Remake Live
Évolution du capital
N-3 0 0 0 0
N-2 101 55 4 200
N-1 102 55 4 204
N 103 55 4 204
Évolution des conditions de cession ou de retrait
N-2 0 817
N-1 0 878
N 0 900
Évolution du prix 2025 999'''
        r=remake_price_history(annual,URL,{'asOf':'2026-06-30','value':204,'sourceUrl':URL},TODAY)
        self.assertEqual(r['years'],[{'asOf':'2022-12-31','value':200},{'asOf':'2023-12-31','value':204},{'asOf':'2024-12-31','value':204},{'asOf':'2026-06-30','value':204}])
        with self.assertRaises(ValueError):remake_price_history(annual.replace('31.12.2024','31.12.2026'),URL,{'asOf':'2026-06-30','value':204,'sourceUrl':URL},TODAY)
    def test_literal_reader_rejects_execution(self):
        for source in ['eval("bad")','process.exit()','Array(10001)','unknown','{a:fetch("url")}']:
            with self.assertRaises(ValueError):LiteralReader(source).read()
        self.assertEqual(LiteralReader('{a:.5,b:[flag,null]}',{'flag':True}).read(),{'a':.5,'b':[True,None]})
    def test_nuxt_aliases_and_ambiguous_publications(self):
        source='window.__NUXT__=(function(a){x.rendement={subtitle:"UC encours",data:a};return x}([1,2]));'
        self.assertEqual(nuxt_returns(source)['data'],[1,2])
        with self.assertRaises(ValueError):nuxt_returns(source.replace('return x','y.rendement={};return x'))
    def placement_html(self):
        values=[{'year':y,'rows':[[['Part d’UC ≥ 60 %',3.25],['Part d’UC 40 à 60 %',2.4],['Part d’UC < 40 %',1.9]],[['Part d’UC ≥ 60 %',3.45],['Part d’UC 40 à 60 %',2.6],['Part d’UC < 40 %',2.1]]]} for y in [2023,2024,2025]]
        pub=json.dumps({'subtitle':'selon la part d’unités de compte et les encours','data':values},ensure_ascii=False)
        return '<h1>Placement-direct Vie</h1><p>SwissLife Assurance et Patrimoine Versement initial 500€ Versements libres 50€ Versements programmés 50€/mois plus de 1300 supports d’investissement 300 actions en direct moins de 250 000€ plus de 250 000€ Rendement net en 2025 Jusqu’à 3,45 % Le désinvestissement sur les ETF supporte des frais de 0,10 % Une opération sur les actions en direct supporte des frais de 0,45 %</p><script>window.__NUXT__=(function(a){x.rendement='+pub+';return x}(null));</script>'
    def placement(self,html=None):
        fees='Placement-direct Vie Frais sur versement 0 % Frais d’arbitrage libre Proportionnels ou forfaitaires 0 % Support unités de compte 0,8 % pour les titres vifs / 0,5 % Sinon Support fonds en Euros 0,6 %'
        return parse_placement(html or self.placement_html(),'Placement-direct Vie SwissLife peut limiter temporairement et sans préavis les possibilités de sortie du fonds en euros. Les droits exprimés en euros comportent une garantie en capital égale aux sommes versées, nettes des prélèvements effectués au titre des frais de souscription et de gestion ; sur le fonds en euros : 0,60 % de l’épargne sur base annuelle. Garantie plancher décès ; option « allocation déléguée », les frais sont majorés de 0,40 % sur base annuelle de l’épargne en unités de compte concernée par l’option ; option « allocation opportunités 100 % Trackers », les frais sont majorés de 0,70 % sur base annuelle de l’épargne en unités de compte concernée par l’option.',fees,URL,URL,TODAY)
    def test_one_fund_and_conditional_rates(self):
        r=validate_insurance(self.placement(),TODAY);f=r['euroFunds'][0]
        self.assertEqual(len(r['euroFunds']),1)
        self.assertEqual(f['guarantee'],99.4);self.assertIsNone(f['maxAllocation'])
        self.assertEqual([o['additionalFee'] for o in r['fees']['options']],[.4,.7])
        self.assertEqual((f['years'][-1]['returnMin'],f['years'][-1]['returnMax']),(1.9,3.45))
        self.assertEqual(len(f['years'][-1]['tiers']),6)
        self.assertIn('0,8 %/an',r['fees']['notes'])
    def test_hero_maximum_must_match_barème(self):
        with self.assertRaises(ValueError):self.placement(self.placement_html().replace('Jusqu’à 3,45','Jusqu’à 9'))
    def test_inconsistent_tier_and_disappearing_fund_preserve_record(self):
        for id_ in ['placement-direct-vie','lucya-cardif']:
            r=stored('insurance',id_);bad=copy.deepcopy(r)
            if id_=='lucya-cardif':bad['euroFunds'].pop()
            else:bad['euroFunds'][0]['years'][-1]['tiers'][0]['return']=10
            result,obs=refresh_insurance({'records':[r]},{id_:lambda day:bad},TODAY)
            self.assertEqual(result,{'records':[r]});self.assertEqual(obs[0]['status'],'failure')
    def lucya(self,html=None):
        html=html or """<h1>Lucya Cardif</h1><p>Cardif Assurance Vie
Versement initial 500 € minimum Versements libres 500 € minimum Versements libres programmés 50 €/mois minimum
Plus de 2300 supports en unités de compte : OPCVM, ETF, Titres, Immobilier.
Un montant en unités de compte au minimum deux fois supérieur.
Des opérations financières de 0,10 % s’appliquent aux supports de type ETF et actions.
Le Fonds général 2023 3,00 %* 2024 2,75 %* 2025 2,75 %* base de frais de gestion 0,70 %
Le Fonds Euro Private Strategies 2023 3,00 %* 2024 3,00 %* 2025 2,75 %* base de frais de gestion 3 % max
Autres supports. (2) Le Fonds Général : garantie annuelle du capital est de 99,3 %.
(3) Le fonds Euro Private Stratégies : garantie annuelle du capital est de 97 %.</p>"""
        notice='Lucya Cardif : si le taux français publié est inférieur à 0,7 %, la part affectée à l’ensemble des fonds en euros à 30 % maximum. En cas de rachat partiel ou total dans un délai de 3 ans, frais à 3 % du montant désinvesti du support en unités de compte SCPI.'
        fees='Contrat LUCYA CARDIF Support unités de compte 0,50 % maximum Frais sur versement 0 % maximum Proportionnels ou forfaitaires 0 % maximum Frais d’adhésion à l’association ayant souscrit le contrat 10 €'
        return parse_lucya(html,notice,fees,URL,URL,TODAY)
    def test_lucya_parser_keeps_distinct_histories_and_conditional_cap(self):
        r=validate_insurance(self.lucya(),TODAY)
        self.assertEqual([f['years'][1]['return'] for f in r['euroFunds']],[2.75,3])
        self.assertEqual(r['fees']['etfTrade'],.1)
        self.assertEqual(r['fees']['membership'],10)
        self.assertIsNone(r['euroFunds'][0]['maxAllocation'])
        self.assertIn('30 %',r['euroFunds'][0]['notes'])
    def test_wrong_lucya_identity_rejected(self):
        html='<h1>Lucya Cardif</h1><p>Autre assureur</p>'
        with self.assertRaises(ValueError):self.lucya(html)
    def test_lucya_distinct_funds_and_unknown_general_quota(self):
        # Contract observations are also exercised end to end against live documents.
        r=validate_insurance(stored('insurance','lucya-cardif'),TODAY);general,private=r['euroFunds']
        self.assertEqual((general['guarantee'],private['guarantee']),(99.3,97))
        self.assertEqual((general['managementFeeMax'],private['managementFeeMax']),(.7,3))
        self.assertIsNone(general['maxAllocation']);self.assertAlmostEqual(private['maxAllocation'],100/3)
        self.assertEqual(r['fees']['membership'],10)
        self.assertIn('0,7 %',general['notes'])

if __name__=='__main__':unittest.main()
