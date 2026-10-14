"""Published statement regressions: share units, annual columns, reconciliation."""
import datetime as dt
import json
import re
from pathlib import Path
import unittest
from unittest.mock import patch, MagicMock
from company_extended_publications import parse_us
from company_round3_publications import parse

SAMPLES = json.loads((Path(__file__).parent/'source-snapshots/company-coverage-statements.json').read_text())

class Coverage(unittest.TestCase):
    def costco(self, text):
        with patch('company_extended_publications.sections', return_value=[text]):
            return parse_us(b'issuer', 'costco')

    def test_costco_explicit_thousands_and_annual_columns(self):
        result = self.costco(SAMPLES['costco'])
        self.assertEqual(result['annual']['averageDilutedShares'], 444427000)
        self.assertEqual(result['annual']['previousAverageDilutedShares'], 444803000)
        self.assertEqual(result['quarter']['averageDilutedShares'], 444364000)

    def test_costco_unknown_unit_or_inconsistent_count_is_omitted(self):
        for text in [SAMPLES['costco'].replace('000’s', 'millions'),
                     SAMPLES['costco'].replace('444,427', '44,427')]:
            self.assertNotIn('averageDilutedShares', self.costco(text)['annual'])

    def test_costco_external_caption_and_53_week_comparative(self):
        from html import escape
        title = 'COSTCO WHOLESALE CORPORATION CONSOLIDATED STATEMENTS OF INCOME (dollars in millions, except per share data) (unaudited)'
        rows = ''.join('<tr><td>'+escape(line)+'</td></tr>' for line in SAMPLES['costco2024'].splitlines())
        raw = ('<p>'+title+'</p><table>'+rows+'</table>').encode()
        annual = parse_us(raw, 'costco')['annual']
        self.assertEqual(annual['end'], '2024-09-01')
        self.assertEqual(annual['previousEnd'], '2023-09-03')
        self.assertEqual(annual['previousAverageDilutedShares'], 444452000)
        with self.assertRaises(ValueError):
            parse_us(raw.replace(b'CONSOLIDATED STATEMENTS OF INCOME', b'ADJUSTED RESULTS'), 'costco')

    def test_wm_annual_count_from_issuer_statement(self):
        # This is the PDF's consolidated income statement, not its adjusted EPS summary.
        with patch('company_round3_publications.text', return_value=SAMPLES['waste-management']):
            result = parse(b'issuer', 'waste-management', SAMPLES['sources']['waste-management'], dt.date(2026,10,14))
        annual = next(p for p in result if p['durationMonths'] == 12)
        self.assertEqual(annual['averageDilutedShares'], 404200000)
        self.assertEqual(annual['previousAverageDilutedShares'], 403400000)

class ExpandedCoverage(unittest.TestCase):
    def cash(self, content, annual=None):
        from company_round4_publications import disney_cash
        with patch('company_round3_publications.text', return_value=content):
            return disney_cash(b'issuer', annual or {'end':'2025-09-27','previousEnd':'2024-09-28'})

    def test_disney_wrapped_diluted_shares_use_group_income(self):
        from company_round4_publications import parse
        page=MagicMock();page.extract_text.return_value=SAMPLES['disneyIncome']
        with patch('company_round4_publications.pdfplumber.open')as pdf:
            pdf.return_value.__enter__.return_value.pages=[page]
            periods=parse(b'%PDF','disney',SAMPLES['sources']['disneyIncome'],dt.date(2026,10,14))
        annual=next(p for p in periods if p['durationMonths']==12)
        self.assertEqual(annual['netIncome'],12404000000)
        self.assertEqual(annual['averageDilutedShares'],1811000000)
        self.assertEqual(annual['previousAverageDilutedShares'],1831000000)

    def test_disney_reconciles_two_annual_periods(self):
        a=self.cash(SAMPLES['disneyCash'])
        self.assertEqual(a['freeCashFlow'], 10077000000)
        self.assertEqual(a['previousFreeCashFlow'], 8559000000)
        self.assertEqual(a['dividendsPaid'], 1803000000)
        self.assertEqual(a['shareRepurchases'], 3500000000)
        self.assertEqual(a['shareBasedCompensation'], 1363000000)

    def test_disney_rejects_quarter_units_and_misaligned_dates(self):
        for old,new in [('Year Ended','Quarter Ended'),('in millions','in thousands'),('September 27','September 28'),('2024','2023')]:
            with self.assertRaises(ValueError):self.cash(SAMPLES['disneyCash'].replace(old,new))

    def test_disney_printed_dash_is_zero_without_shifting_columns(self):
        a=self.cash(SAMPLES['disneyCash'].replace('Dividends (1,803) (1,366)', 'Dividends (1,803) —'))
        self.assertEqual(a['dividendsPaid'],1803000000)
        self.assertEqual(a['previousDividendsPaid'],0)

    def test_disney_does_not_invent_absent_dividends(self):
        content=re.sub(r'^Dividends .*$','',SAMPLES['disneyCash'],flags=re.M)
        a=self.cash(content)
        self.assertNotIn('dividendsPaid',a)
        self.assertEqual(a['freeCashFlow'],10077000000)


class SupplementalCash(unittest.TestCase):
    def test_multiple_documents_preserve_capex_and_optional_fields(self):
        from company_round3_publications import publication_decision
        annuals={
            'https://example.com/2025':{'end':'2025-12-31','previousEnd':'2024-12-31','revenue':100,'previousRevenue':90,'netIncome':20,'previousNetIncome':18,'durationMonths':12},
            'https://example.com/2024':{'end':'2024-12-31','previousEnd':'2023-12-31','revenue':90,'previousRevenue':80,'netIncome':18,'previousNetIncome':16,'durationMonths':12},
        }
        def document(year):return f'''Consolidated Statements of Cash Flows
(in millions)
Years Ended
{year} {year-1}
Net income 20 18
Net cash provided by operating activities 50 40
Purchases of property and equipment (12) (10)
Dividends paid (4) (3)
Repurchases of common stock (5) (6)
Stock-based compensation 2 1
'''
        refs=[{k:a[k]for k in ['end','revenue','netIncome']}|{'sourceUrl':u}for u,a in reversed(list(annuals.items()))]
        company={'history':{'years':refs},'annual':refs[-1]}
        with patch('company_round3_publications.get',side_effect=lambda url,**kw:url),patch('company_round3_publications.parse',side_effect=lambda raw,*args:[annuals[raw]]),patch('company_round3_publications.text',side_effect=lambda url,**kw:document(int(url[-4:]))):
            result=publication_decision({'id':'netflix'},company,dt.date(2026,10,14))
        for r in result['years']:
            self.assertEqual(r['capitalExpenditure'],12000000)
            self.assertEqual(r['freeCashFlow'],38000000)
            self.assertEqual(r['dividendsPaid'],4000000)
            self.assertEqual(r['shareRepurchases'],5000000)

class WrappedShares(unittest.TestCase):
    def test_servicenow_published_counts_are_not_eps_or_guidance(self):
        from company_round2_publications import statement_periods
        def annual(text):return next(p for p in statement_periods(text,'servicenow',SAMPLES['sources']['servicenowIncome'],dt.date(2026,10,14))if p['durationMonths']==12)
        a=annual(SAMPLES['servicenowIncome'])
        self.assertEqual(a['averageDilutedShares'],1047000000)
        self.assertEqual(a['previousAverageDilutedShares'],1042000000)
        self.assertNotIn('averageDilutedShares',annual(SAMPLES['servicenowIncome'].replace('1,047','10,470')))

if __name__ == '__main__':
    unittest.main()
