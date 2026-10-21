"""Regression checks for sector scope, accounting tags and platform exceptions."""
import copy
import datetime as dt
import json
import re
from pathlib import Path
import unittest
from collect_index_documents import msci_composition, msci_returns
from refresh_index_sources import validate_complete_sheet
from collect_presentation_actors import parse

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / 'scripts/fixtures/official-documents/sector-expansion'
NOW = dt.datetime(2026, 10, 12, tzinfo=dt.timezone.utc)


class SupportExpansion(unittest.TestCase):
    def test_sector_scope_requires_explicit_classification_and_complete_countries(self):
        configs = json.loads((ROOT/'scripts/index-automation.json').read_text())['indices']
        for slug in ['industrials', 'consumer-staples']:
            config = next(c for c in configs if c['id'] == 'msci-world-'+slug)
            # Entirely synthetic layout: no proprietary factsheet is redistributed.
            countries = 'COUNTRY WEIGHTS\nUnited States 60%  Japan 30%  Other 10%'
            text = '\n'.join([
                'SEP 30, 2026    Index Factsheet', config['name']+' Index (USD)',
                config['sectorScope']['proof'], 'Number of 100',
                'CUMULATIVE INDEX PERFORMANCE — NET RETURNS (USD)',
                'ANNUAL PERFORMANCE (%)',
                *[f'{year}  {year - 2019:.2f}  2.00' for year in range(2020, 2026)],
                'INDEX PERFORMANCE', 'TOP 10 CONSTITUENTS', 'Float Adj Mkt Cap',
                *[f'SYNTHETIC COMPANY {i}  US  100.00  1.00' for i in range(10)],
                'FACTORS -', 'SUB-INDUSTRY WEIGHTS', countries,
            ])
            facts = msci_composition(text, config, NOW, country_text=countries)
            self.assertEqual(len(facts['holdings']), 10)
            self.assertEqual(facts['sectors'][0][1], 100)
            self.assertGreater(len(facts['countries']), 1)
            self.assertAlmostEqual(sum(v for _,v in facts['countries']), 100, delta=.1)
            self.assertEqual({y for y,_ in msci_returns(text,config,NOW)}, set(range(2020,2026)))
            with self.assertRaises(ValueError):
                msci_composition(text.replace('classiﬁed','not classified'), config, NOW, country_text=countries)
            with self.assertRaises(ValueError):
                msci_composition(text, config, NOW, country_text=re.sub(r'United States \d+(?:\.\d+)?%', '', countries))

    def test_platform_fee_exceptions_and_changed_clauses_fail_closed(self):
        fixtures = json.loads((ROOT/'scripts/fixtures/presentation-actors/public-terms.json').read_text())
        for id_,old,new in [('lendosphere','1% de la somme débitée','9% de la somme débitée'),('tudigo','20 % de la plus-value générée','25 % de la plus-value générée')]:
            original=parse(id_,fixtures[id_],NOW.date())
            changed=copy.deepcopy(fixtures[id_]); changed[0]=changed[0].replace(old,new)
            self.assertNotEqual(original['offers'][0]['fields']['fees']['value'],parse(id_,changed,NOW.date())['offers'][0]['fields']['fees']['value'])
            changed[0]=changed[0].replace(new,'non publié')
            with self.assertRaises(ValueError):parse(id_,changed,NOW.date())
        fee=parse('lendosphere',fixtures['lendosphere'],NOW.date())['offers'][0]['fields']['fees']['value']
        self.assertIn('sans les investir : 1 %',fee)

    def test_complete_index_qualification_refuses_missing_holdings_and_price_returns(self):
        records=json.loads((ROOT/'src/data/automated-indices.json').read_text())
        record=records['msci-world-industrials']
        observation={'id':'msci-world-industrials',**record}
        validate_complete_sheet(observation,NOW)
        for mutated in ['holdings','variant']:
            bad=copy.deepcopy(observation)
            if mutated=='holdings':bad['facts']['holdings']=[]
            else:bad['returns']['variant']='PRICE'
            with self.assertRaises(ValueError):validate_complete_sheet(bad,NOW)


if __name__=='__main__':unittest.main()
