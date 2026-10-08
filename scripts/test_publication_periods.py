import copy
import datetime as dt
import json
from pathlib import Path
import unittest
from publication_periods import completed_year, latest_annual
from collect_scpi import validate as scpi_validate, refresh as scpi_refresh
from collect_insurance import validate as insurance_validate
from collect_corum import documents, origin_occupancy, parse_annual, parse_annual_price_history
from collect_other_insurance import placement_notice_conditions

ROOT = Path(__file__).resolve().parents[1]
JAN = dt.date(2027, 1, 1)
JUL = dt.date(2027, 7, 1)

class PublicationTests(unittest.TestCase):
    def records(self, kind):
        return json.loads((ROOT/f'src/data/automated-{kind}.json').read_text())['records']

    def test_january_and_june_keep_real_year_then_july_requires_new_publication(self):
        for kind, validator in [('scpi',scpi_validate),('insurance',insurance_validate)]:
            for record in self.records(kind):
                for today in [JAN,dt.date(2027,6,30)]:
                    result=validator(copy.deepcopy(record),today)
                    annuals=[result['annual']] if kind=='scpi' else result['euroFunds']
                    for annual in annuals:
                        self.assertEqual(annual['publication'],{'latestPublishedYear':2025,'expectedYear':2026,'awaitingPublication':True})
                        self.assertEqual(annual['years'][-1]['year'],2025)
                with self.assertRaises(ValueError):validator(copy.deepcopy(record),JUL)

    def test_new_2026_publication_in_2027_removes_waiting_status(self):
        for kind, validator in [('scpi',scpi_validate),('insurance',insurance_validate)]:
            for record in self.records(kind):
                annuals=[record['annual']] if kind=='scpi' else record['euroFunds']
                for annual in annuals:
                    for row in annual['years']:row['year']+=1
                    if kind=='insurance':annual['asOf']='2026-12-31'
                result=validator(record,JAN)
                annuals=[result['annual']] if kind=='scpi' else result['euroFunds']
                self.assertTrue(all(not a['publication']['awaitingPublication'] for a in annuals))

    def test_future_duplicates_gaps_and_too_old_are_failures(self):
        for years in [[2024,2025,2027],[2023,2025],[2025,2025],[],[2022,2023,2024]]:
            with self.assertRaises(ValueError):completed_year(years,JAN)
        with self.assertRaises(ValueError):completed_year([2023,2024,2025],JUL)

    def test_discovery_follows_new_links_without_guessing_urls(self):
        old='https://official.fr/RA_2025.pdf';new='https://official.fr/RA_2026.pdf';future='https://official.fr/RA_2027.pdf'
        pattern=r'RA_(?P<year>20\d{2})'
        self.assertEqual(latest_annual([old,future],pattern,JAN),(old,2025))
        self.assertEqual(latest_annual([old,new,future],pattern,JAN),(new,2026))
        with self.assertRaises(ValueError):latest_annual([old],pattern,JUL)
        with self.assertRaises(ValueError):latest_annual([new,new.replace('.pdf','-other.pdf')],pattern,JAN)

    def test_corum_report_year_is_never_redated_at_rollover(self):
        text='Évolution du prix de la part 2025 2024 2023 2022 2021\nPrix de souscription au 31/12 1135 € 1135 € 1135 € 1135 € 1090 €\nDividende brut\nTaux de distribution[3] 6,5 % 6,05 % 6,06 % 6,88 % 7,03 %\nVariation du prix de la part'
        self.assertEqual(parse_annual(text,JAN)[-1]['year'],2025)
        self.assertEqual(parse_annual_price_history(text,JAN,'https://official.fr/report.pdf')['years'][-1]['asOf'],'2025-12-31')
        html='<a href="/files/2026-04/Rapport annuel CORUM Origin 2025.pdf">rapport</a><a href="/files/2026-05/CORUM Origin note d information.pdf">note</a>'
        self.assertIn('2025.pdf',documents(html,'CORUM Origin',JAN)[0])

    def test_regressed_or_failed_source_preserves_record_not_success(self):
        record=self.records('scpi')[0]
        for fail in ['regression','network']:
            def adapter(day):
                if fail=='network':raise OSError('Official source unavailable')
                new=copy.deepcopy(record)
                for row in new['annual']['years']:row['year']-=1
                return new
            result, observations=scpi_refresh({'records':[record]},{record['id']:adapter},JAN)
            self.assertEqual(result,{'records':[record]})
            self.assertEqual(observations[0]['status'],'failure')

    def test_origin_tof_uses_its_own_date_not_undated_counts(self):
        html=(ROOT/'scripts/fixtures/corum/origin-occupancy.html').read_text()
        obs=origin_occupancy(html,dt.date(2026,10,8),'https://www.corum.fr/nos-scpi/corum-origin/patrimoine')
        self.assertEqual((obs['value'],obs['asOf']),(95.77,'2026-06-30'))
        for bad in [html.replace('30/06/2026','30/06/2027'),html.replace('30/06/2026','date absente'),html+html]:
            with self.assertRaises(ValueError):origin_occupancy(bad,dt.date(2026,10,8),obs['sourceUrl'])

    def test_optional_fees_and_guarantee_require_contractual_proof(self):
        notice='Les droits exprimés en euros comportent une garantie en capital égale aux sommes versées, nettes des prélèvements effectués au titre des frais de souscription et de gestion. sur le fonds en euros : 0,60 % de l’épargne sur base annuelle. garantie plancher décès. option « allocation déléguée », les frais sont majorés de 0,40 % sur base annuelle de l’épargne en unités de compte concernée par l’option. option « allocation opportunités 100 % Trackers », les frais sont majorés de 0,70 % sur base annuelle de l’épargne en unités de compte concernée par l’option.'
        guarantee,options=placement_notice_conditions(notice,.6)
        self.assertEqual(guarantee,99.4)
        self.assertEqual([o['additionalFee'] for o in options],[.4,.7])
        for bad in [notice.replace('0,60','0,80'),notice.replace('0,40 %','variable'),notice.replace('garantie en capital','absence de garantie')]:
            with self.assertRaises(ValueError):placement_notice_conditions(bad,.6)

if __name__=='__main__':unittest.main()
