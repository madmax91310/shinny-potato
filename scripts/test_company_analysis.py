import copy
import datetime as dt
import unittest
from refresh_company_analysis import parse_accounts, parse_quote, parse_overview

TODAY = dt.date(2026, 10, 7)
PROFILE = {'cik':'0000000001', 'symbol':'TEST', 'currency':'USD'}

def row(start, end, value, filed='2026-02-15', form='10-K'):
    return {'start':start, 'end':end, 'val':value, 'filed':filed, 'form':form}

def accounts():
    return {'cik':1, 'facts':{'us-gaap':{
        'Revenues':{'units':{'USD':[row('2024-01-01','2024-12-31',100),row('2025-01-01','2025-12-31',120)]}},
        'NetIncomeLoss':{'units':{'USD':[row('2024-01-01','2024-12-31',10),row('2025-01-01','2025-12-31',8)]}},
        'NetCashProvidedByUsedInOperatingActivities':{'units':{'USD':[row('2025-01-01','2025-12-31',20)]}},
        'PaymentsToAcquirePropertyPlantAndEquipment':{'units':{'USD':[row('2025-01-01','2025-12-31',5)]}},
    }}}

class CompanyAnalysisTests(unittest.TestCase):
    def test_aligned_annual_periods_and_comparatives(self):
        a = parse_accounts(accounts(), PROFILE, TODAY)['annual']
        self.assertAlmostEqual(a['revenueGrowth'],20)
        self.assertAlmostEqual(a['incomeGrowth'],-20)
        self.assertEqual(a['freeCashFlow'],15)

    def test_restatements_win(self):
        body = accounts()
        body['facts']['us-gaap']['Revenues']['units']['USD'].append(row('2024-01-01','2024-12-31',110,'2026-03-01'))
        self.assertEqual(parse_accounts(body, PROFILE, TODAY)['annual']['previousRevenue'],110)

    def test_wrong_identity_and_mismatched_periods_rejected(self):
        body = accounts(); body['cik'] = 2
        with self.assertRaises(ValueError): parse_accounts(body, PROFILE, TODAY)
        body = accounts(); body['facts']['us-gaap']['NetIncomeLoss']['units']['USD'][-1]['start'] = '2025-01-02'
        with self.assertRaises(ValueError): parse_accounts(body, PROFILE, TODAY)

    def test_no_loss_growth_percentage(self):
        body = accounts(); body['facts']['us-gaap']['NetIncomeLoss']['units']['USD'][0]['val'] = -10
        self.assertIsNone(parse_accounts(body, PROFILE, TODAY)['annual']['incomeGrowth'])

    def test_nan_and_future_rows_rejected(self):
        body = accounts(); body['facts']['us-gaap']['Revenues']['units']['USD'][-1]['val'] = float('nan')
        with self.assertRaises(ValueError): parse_accounts(body, PROFILE, TODAY)
        body = accounts(); body['facts']['us-gaap']['Revenues']['units']['USD'][-1]['filed'] = '2027-01-01'
        with self.assertRaises(ValueError): parse_accounts(body, PROFILE, TODAY)

    def test_quarter_is_not_year_to_date(self):
        body = accounts()
        for tag,val in [('Revenues',45),('NetIncomeLoss',3)]:
            body['facts']['us-gaap'][tag]['units']['USD'] += [row('2026-01-01','2026-06-30',999,'2026-08-01','10-Q'),row('2026-04-01','2026-06-30',val,'2026-08-01','10-Q')]
        self.assertEqual(parse_accounts(body,PROFILE,TODAY)['quarter']['revenue'],45)

    def test_quote_excludes_intraday(self):
        now = dt.datetime(2026,10,7,18,tzinfo=dt.timezone.utc)
        stamps = [int(dt.datetime(2026,10,day,14,tzinfo=dt.timezone.utc).timestamp()) for day in [6,7]]
        body = {'chart':{'result':[{'meta':{'symbol':'TEST','currency':'USD','dataGranularity':'1d','exchangeTimezoneName':'America/New_York'},'timestamp':stamps,'indicators':{'quote':[{'close':[100,200]}]}}]}}
        self.assertEqual(parse_quote(body,PROFILE,now)['price'],100)
        body['chart']['result'][0]['meta']['currency'] = 'EUR'
        with self.assertRaises(ValueError):parse_quote(body,PROFILE,now)

    def test_rate_limit_is_not_a_valuation(self):
        with self.assertRaises(ValueError):parse_overview({'Information':'rate limit'},PROFILE,dt.datetime(2026,10,7,tzinfo=dt.timezone.utc))
        body = {'Symbol':'TEST','Currency':'USD','LatestQuarter':'2026-06-30','PERatio':'None','ForwardPE':'-1'}
        value = parse_overview(body,PROFILE,dt.datetime(2026,10,7,tzinfo=dt.timezone.utc))
        self.assertIsNone(value['peTTM']);self.assertIsNone(value['forwardPE'])

if __name__ == '__main__': unittest.main()
