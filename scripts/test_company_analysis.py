import copy
import datetime as dt
import unittest
import json
from pathlib import Path
from unittest.mock import patch
from refresh_company_analysis import parse_accounts, parse_quote, parse_overview, parse_history, validate_history
import company_publications as publications
import company_forecasts as forecasts

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

    def test_real_issuer_statements_have_correct_periods_and_columns(self):
        samples = json.loads((Path(__file__).parent/'source-snapshots/company-publications-2026-10-07.json').read_text())
        expected = {'apple':('2026-06-27',109417e6,2.02), 'alphabet':('2026-06-30',119796e6,9.11),
                    'nvidia':('2026-07-26',96221e6,2.46), 'amazon':('2026-06-30',200606e6,5.75),
                    'microsoft':('2026-06-30',90007e6,4.81)}
        for ident,(end,revenue,eps) in expected.items():
            with self.subTest(ident=ident), patch.object(publications,'sections',return_value=samples[ident]):
                result,_ = publications.statement(b'',ident)
                self.assertEqual(result['quarter']['end'],end)
                self.assertEqual(result['quarter']['revenue'],revenue)
                self.assertEqual(result['quarter']['dilutedEPS'],eps)
                if ident!='microsoft':self.assertIsNone(result['annual'])
                else:self.assertEqual(result['annual']['revenue'],331839e6)

    def test_cash_flow_definitions_and_negative_numbers(self):
        self.assertEqual(publications.numbers('$ (1 ) (20) 3.00'),[-1,-20,3])
        samples = json.loads((Path(__file__).parent/'source-snapshots/company-publications-2026-10-07.json').read_text())
        for key,expected in [('apple-annual',98767e6),('alphabet-annual',73266e6),('nvidia-annual',96676e6),('amazon-annual',7695e6),('microsoft',66987e6)]:
            ident=key.split('-')[0]
            with self.subTest(ident=ident),patch.object(publications,'sections',return_value=samples[key]):
                result,_=publications.statement(b'',ident)
                publications.add_cash_flow(b'',result['annual'],ident)
                self.assertEqual(result['annual']['freeCashFlow'],expected)

    def test_changed_or_non_gaap_layout_is_rejected(self):
        samples = json.loads((Path(__file__).parent/'source-snapshots/company-publications-2026-10-07.json').read_text())
        broken = [s.replace('2026 2025 2026 2025','2026 2025 2025 2024').replace('109,417','109,417 999') for s in samples['apple']]
        with patch.object(publications,'sections',return_value=broken):
            with self.assertRaises(ValueError):publications.statement(b'','apple')
        with patch.object(publications,'sections',return_value=['Non-GAAP highlights: revenue 100 EPS 2']):
            with self.assertRaises(ValueError):publications.statement(b'','nvidia')

    def test_missing_current_debt_is_not_assumed_zero(self):
        samples = json.loads((Path(__file__).parent/'source-snapshots/company-publications-2026-10-07.json').read_text())
        with patch.object(publications,'sections',return_value=samples['alphabet']):
            b=publications.balance(b'','alphabet','2026-06-30')
            self.assertEqual(b['cash'],55911e6)
            self.assertNotIn('netDebt',b)


class HistoryAndForecastTests(unittest.TestCase):
    def history(self):
        body = accounts()
        for tag, value in [('Revenues', 90), ('NetIncomeLoss', -2)]:
            body['facts']['us-gaap'][tag]['units']['USD'].append(row('2023-01-01', '2023-12-31', value))
        return body

    def test_history_preserves_losses_and_latest_restatements(self):
        body = self.history()
        body['facts']['us-gaap']['NetIncomeLoss']['units']['USD'].append(row('2024-01-01', '2024-12-31', 12, '2026-03-01'))
        rows = parse_history(body, PROFILE, TODAY)
        self.assertEqual([r['end'] for r in rows], ['2023-12-31','2024-12-31','2025-12-31'])
        self.assertLess(rows[0]['margin'], 0)
        self.assertEqual(rows[1]['netIncome'], 12)
        self.assertEqual(rows[1]['margin'], 12)

    def test_short_and_gapped_history_rejected(self):
        with self.assertRaises(ValueError): parse_history(accounts(), PROFILE, TODAY)
        rows = parse_history(self.history(), PROFILE, TODAY)
        rows[0]['end'] = '2022-12-31'
        with self.assertRaises(ValueError): validate_history(rows, TODAY)
        body = self.history(); body['cik'] = 99
        with self.assertRaises(ValueError): parse_history(body, PROFILE, TODAY)

    def fixture(self):
        return (Path(__file__).parent/'source-snapshots/company-finviz-2026-10-07.html').read_text()

    def test_real_forecasts_use_eps_estimate_not_same_label_growth(self):
        value = forecasts.parse(self.fixture(), {'symbol':'AAPL','currency':'USD'}, TODAY)
        self.assertEqual(value['forwardEPS'], 9.61)
        self.assertEqual(value['growthEPS5Y'], 12.73)
        self.assertEqual(value['reportedPEG'], 2.74)
        self.assertIn('prochain', value['forwardHorizon'].lower())

    def test_changed_definition_identity_and_inconsistent_ratios_rejected(self):
        for raw in [self.fixture().replace('data-ticker="AAPL"','data-ticker="MSFT"'),
                    self.fixture().replace('EPS estimate for next year','EPS growth next year'),
                    self.fixture().replace('>2.74<','>8.74<'),
                    self.fixture().replace('>9.61<','>NaN<')]:
            with self.subTest(raw=raw[:30]), self.assertRaises(ValueError):
                forecasts.parse(raw, {'symbol':'AAPL','currency':'USD'}, TODAY)

    def test_missing_estimates_are_not_invented(self):
        raw = self.fixture().replace('>12.73%<','>-<').replace('>2.74<','>-<')
        value = forecasts.parse(raw, {'symbol':'AAPL','currency':'USD'}, TODAY)
        self.assertIsNone(value['growthEPS5Y'])
        self.assertIsNone(value['reportedPEG'])

    def test_older_alphabet_wrapped_eps_and_summary_not_a_statement(self):
        fixtures = json.loads((Path(__file__).parent/'source-snapshots/company-alphabet-history.json').read_text())
        for year, revenue in [('2022',282836e6),('2023',307394e6)]:
            sections = ['Highlights: quarter ended; in millions; statements of income referenced below'] + fixtures[year]
            with patch.object(publications, 'sections', return_value=sections):
                result, _ = publications.statement(b'', 'alphabet')
            self.assertEqual(result['annual']['revenue'], revenue)

    def test_issuer_history_uses_newer_comparatives(self):
        recent = {'annual': {'end':'2025-12-31','previousEnd':'2024-12-31', 'revenue':120, 'previousRevenue':110,'netIncome':8,'previousNetIncome':12}}
        older = {'annual': {'end':'2024-12-31','previousEnd':'2023-12-31', 'revenue':100, 'previousRevenue':90,'netIncome':10,'previousNetIncome':-2}}
        with patch.object(publications, 'candidates', return_value=[['https://issuer/recent'], ['https://issuer/older']]), patch.object(publications, 'get', return_value=b''), patch.object(publications, 'statement', side_effect=[(recent,''),(older,'')]):
            rows = publications.collect_history({'id':'amazon'}, TODAY)
        self.assertEqual(rows[1]['netIncome'],12)
        self.assertEqual(rows[1]['sourceUrl'],'https://issuer/recent')
        self.assertEqual(rows[0]['netIncome'],-2)

class ExtendedIssuerTests(unittest.TestCase):
    def setUp(self):
        self.samples = json.loads((Path(__file__).parent/'source-snapshots/company-extended-publications-2026-10-07.json').read_text())

    def sample(self, key, all_blocks=False):
        item = self.samples[key]
        return item['identity']+'\n'+'\n'.join(item['statements'] if all_blocks else item['statements'][:1])

    def test_european_consolidated_profit_is_group_share(self):
        from company_extended_publications import parse_europe
        expected = [('lvmh',80807e6,10878e6),('air-liquide',26940.2e6,3517.9e6),('schneider',40152e6,4163e6),('totalenergies',182344e6,13127e6)]
        for ident,revenue,income in expected:
            key = 'total-fy' if ident=='totalenergies' else ident+'-fy'
            with self.subTest(ident=ident):
                r=parse_europe(self.sample(key,ident=='totalenergies'),ident,2025)[-1]
                self.assertEqual(r['revenue'],revenue);self.assertEqual(r['netIncome'],income)
                self.assertEqual(r['durationMonths'],12)
                if ident=='air-liquide':self.assertNotIn('dilutedEPS',r)
                if ident=='schneider':self.assertEqual(r['operatingIncome'],6699e6)

    def test_lvmh_half_year_skips_middle_full_year_column(self):
        from company_extended_publications import parse_europe
        r=parse_europe(self.sample('lvmh-hy'),'lvmh',2026,True)[-1]
        self.assertEqual(r['revenue'],38644e6);self.assertEqual(r['previousRevenue'],39810e6)
        self.assertEqual(r['previousEnd'],'2025-06-30');self.assertEqual(r['durationMonths'],6)
        for ident in ['air-liquide','schneider']:
            r=parse_europe(self.sample(ident+'-hy'),ident,2026,True)[-1]
            self.assertEqual(r['end'],'2026-06-30');self.assertEqual(r['durationMonths'],6)

    def test_wrong_unit_identity_and_columns_fail_closed(self):
        from company_extended_publications import parse_europe
        source=self.sample('lvmh-fy')
        for broken in [source.replace('LVMH','Wrong issuer'),source.replace('EUR millions','USD millions'),source.replace('80,807','80,807 999')]:
            with self.subTest(broken=broken[:30]),self.assertRaises(ValueError):parse_europe(broken,'lvmh',2025)

    def test_total_quarter_excludes_excise_and_previous_quarter(self):
        from company_extended_publications import parse_total_quarter
        r=parse_total_quarter(self.sample('total-q2'))
        self.assertEqual(r['end'],'2026-06-30');self.assertEqual(r['revenue'],57097e6)
        self.assertEqual(r['netIncome'],5438e6);self.assertEqual(r['dilutedEPS'],2.41)
        self.assertEqual(r['previousRevenue'],44676e6)
        for key,end,eps in [('total-q1','2026-03-31',2.64),('total-q3','2025-09-30',1.64),('total-fy','2025-12-31',1.30)]:
            quarter=parse_total_quarter(self.sample(key))
            self.assertEqual(quarter['end'],end)
            self.assertEqual(quarter['dilutedEPS'],eps)

    def test_visa_uses_class_a_diluted_eps_and_three_months(self):
        import company_extended_publications as extended
        with patch.object(extended,'pdf_text',return_value=self.sample('visa-q3')):
            r=extended.parse_us(b'','visa')
        self.assertIsNone(r['annual']);self.assertEqual(r['quarter']['revenue'],11633e6)
        self.assertEqual(r['quarter']['dilutedEPS'],2.97)
        with patch.object(extended,'pdf_text',return_value=self.sample('visa-q4')):
            r=extended.parse_us(b'','visa')
        self.assertEqual(r['annual']['dilutedEPS'],10.20)

    def test_costco_includes_membership_and_preserves_sixteen_weeks(self):
        import company_extended_publications as extended
        with patch.object(extended,'sections',return_value=self.samples['costco-q4']['statements']):
            r=extended.parse_us(b'','costco')
        self.assertEqual(r['annual']['revenue'],303154e6)
        self.assertEqual(r['quarter']['durationWeeks'],16)
        self.assertEqual(r['quarter']['dilutedEPS'],6.75)
        self.assertEqual(r['annual']['end'],'2026-08-30')
        self.assertNotIn('durationMonths',r['quarter'])
        for key,end,eps in [('costco-q2','2026-02-15',4.58),('costco-q3','2026-05-10',4.93)]:
            with patch.object(extended,'sections',return_value=self.samples[key]['statements']):
                parsed=extended.parse_us(b'','costco')
            self.assertIsNone(parsed['annual'])
            self.assertEqual(parsed['quarter']['durationWeeks'],12)
            self.assertEqual(parsed['quarter']['end'],end)
            self.assertEqual(parsed['quarter']['dilutedEPS'],eps)

    def test_air_liquide_reloads_official_pdfs_when_landing_pages_fail(self):
        import company_extended_publications as extended
        old=json.loads((Path(__file__).parents[1]/'src/data/company-analysis.json').read_text())['companies']['air-liquide']
        def extract(raw):return self.sample('air-liquide-hy' if b'first-half' in raw else 'air-liquide-fy')
        with patch.object(extended,'europe_documents',return_value=[]),patch.object(extended,'load',side_effect=lambda url:url.encode()) as fetch,patch.object(extended,'pdf_text',side_effect=extract):
            r=extended.collect_europe({'id':'air-liquide'},TODAY,old)
        self.assertEqual(r['annual']['revenue'],26940.2e6)
        self.assertEqual(r['halfYear']['end'],'2026-06-30')
        self.assertEqual(r['historyObservedAt'],old['history']['observedAt'])
        self.assertEqual(fetch.call_count,2)
        for row in [old['annual'],old['halfYear'],*old['history']['years']]:row['sourceUrl']='https://unverified.example/report.pdf'
        with patch.object(extended,'europe_documents',return_value=[]),self.assertRaises(ValueError):
            extended.collect_europe({'id':'air-liquide'},TODAY,old)

    def test_air_archive_discovers_new_reports_without_cached_urls(self):
        import company_extended_publications as extended
        url='https://www.airliquide.com/sites/airliquide.com/files/2028-02/air-liquide-pr-fy-2027-results.pdf'
        with patch.object(extended,'links',side_effect=lambda page:[url] if page.endswith('regulated-information') else []):
            reports=list(extended.europe_documents('air-liquide',dt.date(2028,3,1)))
        self.assertIn((2027,False,url),reports)

    def test_january_retains_previous_calendar_year_half_report(self):
        import company_extended_publications as extended
        urls=[]
        def source(url):
            urls.append(url)
            if '2026-first-half' in url:return ['https://issuer/LVMH_2026Firsthalffinancialreport.pdf']
            return []
        with patch.object(extended,'links',side_effect=source):
            documents=list(extended.europe_documents('lvmh',dt.date(2027,1,7)))
        self.assertIn((2026,True,'https://issuer/LVMH_2026Firsthalffinancialreport.pdf'),documents)
        self.assertFalse(any('2027-first-half' in url for url in urls))
        with patch.object(extended,'links',return_value=[]):
            documents=list(extended.europe_documents('schneider',dt.date(2027,1,7)))
        self.assertEqual(documents[0][0:2],(2026,True))

    def test_cached_history_retains_its_real_observation_date(self):
        import company_extended_publications as extended
        cached={'years':[{'end':f'{y}-12-31','revenue':100,'netIncome':10} for y in [2023,2024,2025]],'observedAt':'2026-09-15'}
        parsed=[dict(cached['years'][-1])]
        with patch.object(extended,'europe_documents',return_value=[(2025,False,'https://issuer/report')]),patch.object(extended,'load',return_value=b''),patch.object(extended,'pdf_text',return_value=''),patch.object(extended,'parse_europe',return_value=parsed):
            r=extended.collect_europe({'id':'lvmh'},TODAY,{'history':cached})
        self.assertEqual(r['historyObservedAt'],'2026-09-15')
        self.assertIsNone(extended.cached_history({'history':cached},dt.date(2026,10,16)))

if __name__ == '__main__': unittest.main()
