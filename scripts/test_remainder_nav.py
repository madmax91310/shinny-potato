"""Replay issuer captures; these tests are not a claim of provider availability."""
import datetime as dt
import unittest
from pathlib import Path
from unittest.mock import patch
from issuer_nav_history import ssga_nav, xlsx_rows, monthly, calendar_checks
ROOT=Path(__file__).resolve().parents[1]
NOW=dt.datetime(2026,10,23,tzinfo=dt.timezone.utc)
class StateStreetNav(unittest.TestCase):
    def test_export_exact_identity_currency_and_column(self):
        body=(ROOT/'reports/reliquat-79-2026-10-23/preuves/recherche-voies/zprv-nav.xlsx').read_bytes()
        nav=ssga_nav(body,'IE00BSPLC413','USD',NOW)
        self.assertEqual(min(nav),'2015-02-18')
        self.assertEqual(max(nav),'2026-10-22')
        self.assertEqual(nav['2026-10-22'],92.232)
        for isin,currency in [('IE00BSPLC298','USD'),('IE00BSPLC413','EUR')]:
            with self.assertRaisesRegex(ValueError,'identity/currency'):ssga_nav(body,isin,currency,NOW)
        rows=xlsx_rows(body)
        for row in rows:
            if row.get('A')=='Date':row['B']='Market price'
        with patch('issuer_nav_history.xlsx_rows',return_value=rows):
            with self.assertRaisesRegex(ValueError,'NAV column'):ssga_nav(body,'IE00BSPLC413','USD',NOW)
    def test_existing_nav_without_company_baseline_is_refreshed_but_never_bootstrapped(self):
        import json,copy
        from refresh_monthly_history import refresh
        proof=json.loads((ROOT/'reports/reliquat-79-2026-10-23/preuves/github-nav11/nav.json').read_text())
        incoming=next(r['record'] for r in proof['series'] if r['id']=='etfSmallValueEurope')
        source=next(r for r in json.loads((ROOT/'scripts/official-nav-remainder-sources.json').read_text()) if r['id']==incoming['id'])
        prior={k:v for k,v in incoming.items() if k!='proofRows'};current={source['id']:prior}
        merged,report=refresh({'series':[source]},current,{},NOW,lambda *_:incoming)
        self.assertEqual(report['series'][0]['status'],'validated')
        self.assertEqual(merged,current)
        _,report=refresh({'series':[source]},{},{},NOW,lambda *_:incoming)
        self.assertEqual(report['series'][0]['status'],'failed')
        self.assertIn('bootstrap',report['series'][0]['reason'])
        for field,value in [('navCurrency','USD'),('isin','IE00BSPLC413'),('navProvider','blackrock')]:
            bad=copy.deepcopy(incoming);bad[field]=value
            merged,report=refresh({'series':[source]},current,{},NOW,lambda *_:bad)
            self.assertEqual(report['series'][0]['status'],'failed')
            self.assertEqual(merged,current)
    def test_year_end_weekend_and_unfinished_year(self):
        points={'2020-12-31':100,'2021-12-31':120,'2022-12-30':90,'2023-12-29':135}
        checks=calendar_checks(points,{'2021':20,'2022':-25,'2023':50,'2024':0},2,dt.datetime(2024,10,1,tzinfo=dt.timezone.utc))
        self.assertEqual([r['end']for r in checks],['2021-12-31','2022-12-30','2023-12-29'])
        with self.assertRaisesRegex(ValueError,'disagreement'):calendar_checks(points,{'2023':49},2,NOW)
    def test_gap_is_never_bridged(self):
        with self.assertRaisesRegex(ValueError,'coverage'):monthly({'2025-12-31':100,'2026-02-27':101},'USD','USD','2025-12',dt.datetime(2026,3,1,tzinfo=dt.timezone.utc))
if __name__=='__main__':unittest.main()
