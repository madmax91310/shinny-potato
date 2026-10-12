import copy
import datetime as dt
import html
import re
import json
from pathlib import Path
import unittest
from unittest.mock import patch
from company_decision import sec_decision, extended_publication_decision, amd_publication_decision, validate_decision
from test_company_analysis import accounts, row

TODAY = dt.date(2026, 10, 12)


class DecisionTests(unittest.TestCase):
    def test_optional_balance_requires_same_filing_and_common_income(self):
        from company_decision import sec_balance_components
        body=accounts()
        period={'start':'2025-01-01','end':'2025-12-31','filed':'2026-02-01','accn':'same'}
        facts=body['facts']['us-gaap']
        for tag, values in [('AssetsCurrent',[('2025-12-31',50)]),('LiabilitiesCurrent',[('2025-12-31',25)]),
                            ('StockholdersEquity',[('2024-12-31',100),('2025-12-31',120)])]:
            facts[tag]={'units':{'USD':[dict(end=end,val=val,filed=period['filed'],accn='same',form='10-K')for end,val in values]}}
        facts['NetIncomeLossAvailableToCommonStockholdersBasic']={'units':{'USD':[{**period,'val':20,'form':'10-K'}]}}
        result=sec_balance_components(body,period,TODAY)
        self.assertEqual(result['currentAssets'],50)
        self.assertEqual(result['roeIncome'],20)
        facts['StockholdersEquity']['units']['USD'][0]['accn']='different'
        self.assertNotIn('roeIncome',sec_balance_components(body,period,TODAY))
        facts['AssetsCurrent']['units']['USD'].append({**facts['AssetsCurrent']['units']['USD'][0],'val':60})
        self.assertNotIn('currentAssets',sec_balance_components(body,period,TODAY))

    def test_extra_cash_components_use_exact_annual_periods(self):
        body=accounts()
        for tag,val in [('PaymentsForRepurchaseOfCommonStock',10),('ShareBasedCompensation',3)]:
            body['facts']['us-gaap'][tag]={'units':{'USD':[row('2025-01-01','2025-12-31',val)]}}
        company={'annual':{'end':'2025-12-31','revenue':120,'netIncome':8}}
        p={'id':'test','cik':'0000000001','currency':'USD'}
        r=sec_decision(body,p,company,TODAY)['years'][-1]
        self.assertEqual(r['shareRepurchases'],10); self.assertEqual(r['shareBasedCompensation'],3)
        body['facts']['us-gaap']['ShareBasedCompensation']['units']['USD'][0]['start']='2025-10-01'
        self.assertNotIn('shareBasedCompensation',sec_decision(body,p,company,TODAY)['years'][-1])

    def test_amd_standard_sec_capex_does_not_become_consolidated_fcf(self):
        from refresh_company_analysis import parse_accounts
        body=accounts()
        annual=parse_accounts(body,{'id':'amd','cik':'0000000001'},TODAY)['annual']
        self.assertNotIn('freeCashFlow',annual)
        self.assertNotIn('freeCashFlow',annual['tags'])

    def test_alternative_taxonomy_scopes_are_not_merged(self):
        body=accounts()
        body['facts']['us-gaap']['InterestExpenseNonOperating']={'units':{'USD':[row('2025-01-01','2025-12-31',2)]}}
        body['facts']['us-gaap']['InterestExpense']={'units':{'USD':[row('2025-01-01','2025-12-31',3)]}}
        body['facts']['us-gaap']['PaymentsToAcquireProductiveAssets']=body['facts']['us-gaap'].pop('PaymentsToAcquirePropertyPlantAndEquipment')
        company={'annual':{'end':'2025-12-31','revenue':120,'netIncome':8}}
        p={'id':'test','cik':'0000000001','currency':'USD'}
        actual=sec_decision(body,p,company,TODAY)['years'][-1]
        self.assertEqual(actual['interestExpense'],2)
        self.assertEqual(actual['freeCashFlow'],15)

    def test_amd_consolidated_capex_includes_discontinued_operations(self):
        a={'end':'2025-12-27','previousEnd':'2024-12-28','revenue':34639e6,'previousRevenue':25785e6,'netIncome':4335e6,'previousNetIncome':1641e6,'sourceUrl':'https://ir.amd.com/report'}
        lines=['Three Months Ended Year Ended','December 27, 2025 December 28, 2024 December 27, 2025 December 28, 2024','Cash flows from operating activities:',
               'Net cash provided by operations 2,600 1,299 7,709 3,041','Purchases of property and equipment (222) (208) (974) (636)',
               'Purchases of property and equipment (8) — (38) —']
        raw=('<p>ADVANCED MICRO DEVICES, INC. CONDENSED CONSOLIDATED STATEMENTS OF CASH FLOWS (Millions)</p><table>'+''.join('<tr><td>'+html.escape(l)+'</td></tr>'for l in lines)+'</table>').encode()
        with patch('company_publications.get',return_value=raw),patch('company_amd_publications.parse',return_value={'annual':a}):
            d=amd_publication_decision({'id':'amd'},{'annual':a,'history':{'years':[a]}},TODAY)
        self.assertEqual(d['years'][-1]['capitalExpenditure'],1012e6)
        self.assertEqual(d['years'][-1]['freeCashFlow'],6697e6)

    def test_sec_period_alignment_interest_and_dividends(self):
        body = accounts()
        body['facts']['us-gaap']['InterestExpenseNonOperating'] = {'units': {'USD': [row('2025-01-01','2025-12-31',2)]}}
        body['facts']['us-gaap']['PaymentsOfDividendsCommonStock'] = {'units': {'USD': [row('2025-01-01','2025-12-31',3)]}}
        company = {'annual': {'end':'2025-12-31','revenue':120,'netIncome':8}}
        p = {'id':'test','cik':'0000000001','currency':'USD'}
        d = sec_decision(body,p,company,TODAY)
        self.assertEqual(d['years'][-1]['freeCashFlow'],15)
        self.assertEqual(d['years'][-1]['interestExpense'],2)
        self.assertEqual(d['years'][-1]['dividendsPaid'],3)
        validate_decision(d,company,TODAY)
        bad = copy.deepcopy(body)
        bad['facts']['us-gaap']['InterestExpenseNonOperating']['units']['USD'][0]['start']='2025-04-01'
        self.assertNotIn('interestExpense', sec_decision(bad,p,company,TODAY)['years'][-1])
        company['annual']['netIncome']=9
        with self.assertRaises(ValueError):sec_decision(body,p,company,TODAY)

    def test_nonfinite_and_unreconciled_cash_rejected(self):
        company={'annual':{'end':'2025-12-31'}}
        block={'annualEnd':'2025-12-31','years':[{'end':'2025-12-31','sourceUrl':'https://issuer.test/report','freeCashFlow':5,'operatingCashFlow':20,'capitalExpenditure':10}]}
        with self.assertRaises(ValueError):validate_decision(block,company,TODAY)
        block['years'][0]['freeCashFlow']=float('nan')
        with self.assertRaises(ValueError):validate_decision(block,company,TODAY)

    def test_real_consolidated_issuer_cash_tables(self):
        samples=json.loads((Path(__file__).parent/'source-snapshots/company-decision-statements-2026-10-12.json').read_text())
        expected={'lvmh':None,'air-liquide':2675e6,'schneider':4588e6,'totalenergies':10390e6,'visa':21577e6,'costco':9390e6}
        for ident,sample in samples.items():
            with self.subTest(issuer=ident):
                company={'annual':sample['annual'],'history':{'years':[sample['annual']]}}
                text=sample['text']
                # HTML roundtrip preserves the actual extracted Costco rows.
                raw=''.join('<table>'+''.join('<tr><td>'+html.escape(line)+'</td></tr>'for line in chunk.splitlines())+'</table>' for chunk in re.split(r'(?=COSTCO WHOLESALE CORPORATION)',text)).encode() if ident=='costco' else b'%PDF'
                with patch('company_extended_publications.load',return_value=raw),patch('company_extended_publications.pdf_text',return_value=text):
                    d=extended_publication_decision({'id':ident},company,TODAY)
                actual=d['years'][-1]
                if expected[ident] is None:
                    self.assertNotIn('freeCashFlow',actual)
                    self.assertEqual(actual['operatingCashFlow'],18874e6)
                else:self.assertAlmostEqual(actual['freeCashFlow'],expected[ident],places=3)
                if ident=='schneider':
                    # 6,748 before working-capital changes is NOT annual OCF.
                    self.assertEqual(actual['operatingCashFlow'],6131e6)
                    self.assertEqual(actual['interestExpense'],473e6)
                if ident=='totalenergies':self.assertEqual(actual['dividendsPaid'],8121e6)
                validate_decision(d,company,TODAY)


if __name__=='__main__':unittest.main()
