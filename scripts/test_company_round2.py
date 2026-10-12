"""Synthetic statements: column identity, actual Q4, weekly periods and splits."""
import copy
import datetime as dt
import unittest
from unittest.mock import patch
from company_round2_publications import statement_periods, normalise_eps_basis, collect

TODAY=dt.date(2026,10,12)
URL='https://issuer.example/earnings'
def statement(header,rv,net,eps,op=None):
    return 'Consolidated Statements of Operations\n(in millions, except per share data)\n'+header+'\nNet Revenue '+rv+'\nNet Income '+net+'\nOperating income '+(op or net)+'\nDiluted Earnings per Share '+eps+'\n'

class Statements(unittest.TestCase):
    def test_actual_quarter_and_annual_are_separate(self):
        text=statement('Three Months Ended December 31, Twelve Months Ended December 31,\n2025 2024 2025 2024','100 80 350 300','20 10 50 40','2 1 5 4')
        ps=statement_periods(text,'mastercard',URL,TODAY)
        self.assertEqual([p['durationMonths']for p in ps],[3,12])
        self.assertEqual(ps[0]['dilutedEPS'],2)
        self.assertEqual(ps[1]['dilutedEPS'],5)
        self.assertEqual(ps[0]['netIncome'],20e6)
    def test_nine_months_never_becomes_annual(self):
        text=statement('Three Months Ended September 30, Nine Months Ended September 30,\n2026 2025 2026 2025','100 80 300 240','20 10 60 30','2 1 6 3')
        self.assertEqual([p['durationMonths']for p in statement_periods(text,'mastercard',URL,TODAY)],[3])
    def test_current_previous_sequential_and_previous_year(self):
        text=statement('Fiscal Quarter Ended Two Fiscal Quarters Ended\nJune 1, March 2, June 2, June 1, June 2,\n2026 2026 2025 2026 2025','100 90 80 190 160','20 18 10 38 20','2 1.8 1 3.8 2')
        text=text.replace('Diluted Earnings per Share','Diluted')
        ps=statement_periods(text,'broadcom',URL,TODAY)
        self.assertEqual(ps[0]['previousEnd'],'2025-06-02')
        self.assertEqual(ps[0]['previousRevenue'],80e6)
    def test_unknown_units_and_future_are_rejected(self):
        t=statement('Three Months Ended June 30,\n2026 2025','100 80','20 10','2 1')
        with self.assertRaises(ValueError):statement_periods(t.replace('in millions','in billions'),'mastercard',URL,TODAY)
        with self.assertRaises(ValueError):statement_periods(t.replace('2026','2027'),'mastercard',URL,TODAY)
    def test_issuer_symbol_identity(self):
        with self.assertRaises(ValueError):collect({'id':'mastercard','currency':'USD','symbol':'ADBE'},TODAY)

class ShareBasis(unittest.TestCase):
    def data(self):
        accounts={'quarters':[{'end':'2026-06-30','sourceUrl':URL,'dilutedEPS':1},{'end':'2026-03-31','sourceUrl':URL,'dilutedEPS':1},{'end':'2025-12-31','sourceUrl':URL,'dilutedEPS':1},{'end':'2025-09-30','sourceUrl':'https://issuer.example/old','dilutedEPS':5}],'trailing':{}}
        stamp=int(dt.datetime(2025,12,18,tzinfo=dt.timezone.utc).timestamp())
        body={'chart':{'result':[{'events':{'splits':{'s':{'date':stamp,'numerator':5,'denominator':1}}}}]}}
        quote={'asOf':'2026-10-09','sourceUrl':'https://quote.example/chart'}
        return accounts,body,quote
    def test_declared_split_normalises_eps_without_losing_reported_value(self):
        a,b,q=self.data()
        def get(url):return b'<p>five-for-one stock split, which was effective December 17, 2025.</p>'if url==URL else b'<p>Original earnings release</p>'
        with patch('company_round2_publications.get',get):normalise_eps_basis(a,{'id':'servicenow'},q,b)
        self.assertEqual(a['quarters'][-1]['reportedDilutedEPS'],5)
        self.assertEqual(a['quarters'][-1]['dilutedEPS'],1)
        self.assertEqual(a['trailing']['dilutedEPS'],4)
        self.assertEqual(a['trailing']['splitAdjustments'][0]['ratio'],5)
    def test_missing_or_disagreeing_declaration_is_rejected(self):
        a,b,q=self.data();old=copy.deepcopy(a)
        with patch('company_round2_publications.get',return_value=b'<p>Quarterly earnings</p>'):
            with self.assertRaises(ValueError):normalise_eps_basis(a,{'id':'servicenow'},q,b)
        self.assertEqual(a,old)
        b['chart']['result'][0]['events']['splits']['s']['numerator']=4
        with patch('company_round2_publications.get',return_value=b'<p>five-for-one stock split, effective December 17, 2025.</p>'):
            with self.assertRaises(ValueError):normalise_eps_basis(a,{'id':'servicenow'},q,b)

if __name__=='__main__':unittest.main()
