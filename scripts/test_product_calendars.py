import copy
import datetime as dt
import json
from pathlib import Path
import unittest
from unittest.mock import patch
from collect_public_issuer import Page
from collect_product_calendars import bitwise_calendar, hsbc_calendar, hsbc_chart, coinshares_calendar, abtc_calendar, issuer_json, collect_abtc_calendar
from collect_document_etf import collect_one as document_collect
from collect_remaining_documents import collect_one as remaining_collect
from data_automation import UTC

FIX=Path(__file__).parent/'fixtures/official-documents/product-calendars'
CONFIG=json.loads((Path(__file__).parent/'additional-etf-sources.json').read_text())
NOW=dt.datetime(2026,10,7,tzinfo=UTC)
def share(isin):return next(s for s in CONFIG['instruments'] if s['isin']==isin)

class ProductCalendars(unittest.TestCase):
    def abtc_payloads(self):
        return [json.loads((FIX/('abtc-'+key+'.json')).read_text()) for key in
                ('product_details','history','product_performance_metrics')]

    def test_abtc_adjusted_exact_nav_complete_years(self):
        r=abtc_calendar(*self.abtc_payloads(),share('CH0454664001'),NOW,'official-url')
        self.assertEqual(r['years'],{'2020':277.89,'2021':65.02,'2022':-65.41,'2023':151.83,'2024':114.17,'2025':-4.71})
        self.assertEqual(r['asOf'],'2026-10-06')
        self.assertNotIn('2019',r['years']);self.assertNotIn('2026',r['years'])
        for defect in ['wrong-isin','currency','row-currency','duplicate-date','nan','stale','future','missing-year-end',
                       'missing-month','wrong-month','wrong-inception','latest-nav','unadjusted-split','double-adjusted-split','api-failure']:
            p,h,m=self.abtc_payloads();row=h['data'][0]
            if defect=='wrong-isin':p['data']['details']['isin']='CH0454664027'
            if defect=='currency':p['data']['currency']['short_name']='EUR'
            if defect=='row-currency':row['fiat_denominator']='EUR'
            if defect=='duplicate-date':h['data'].append(copy.deepcopy(row))
            if defect=='nan':row['nav_per_share']=float('nan')
            if defect=='stale':h['lastUpdated']='2026-07-01T00:00:00Z'
            if defect=='future':row['valuation_date']='2026-10-08'
            if defect=='missing-year-end':h['data']=[r for r in h['data']if not r['valuation_date'].startswith('2024-12')]
            if defect=='missing-month':del next(b['2025']for b in m['data']['performance_monthly']if '2025'in b)['january']
            if defect=='wrong-month':next(b['2025']for b in m['data']['performance_monthly']if '2025'in b)['january']=.5
            if defect=='wrong-inception':m['data']['performance_details']['since_inception_performance']=0
            if defect=='latest-nav':p['data']['nav_per_unit']+=1
            if defect in ('unadjusted-split','double-adjusted-split'):
                next(r for r in h['data']if r['valuation_date']=='2021-04-09')['nav_per_share']*=14 if defect=='unadjusted-split'else 1/14
            if defect=='api-failure':h['success']=False
            with self.subTest(defect=defect),self.assertRaises(ValueError):abtc_calendar(p,h,m,share('CH0454664001'),NOW,'url')

    def test_abtc_bounded_gzip_and_official_sources(self):
        import gzip
        self.assertEqual(issuer_json(gzip.compress(b'{"success":true}')),{'success':True})
        with self.assertRaises(ValueError):issuer_json(gzip.compress(b' '*101),100)
        with self.assertRaises(ValueError):collect_abtc_calendar({**share('CH0454664001'),'calendarApiBase':'https://example.com'},NOW)

    def test_abtc_calendar_failure_preserves_factsheet(self):
        s=share('CH0454664001');healthy={'aum':{'amount':123},'characteristics':{'terPct':1.49},'unavailable':['performance: unavailable']}
        with patch('collect_document_etf.download',return_value=b'%PDF-test'),patch('collect_document_etf.pdf_text',return_value='text'),patch('collect_document_etf.parse',return_value=healthy),patch('collect_product_calendars.collect_abtc_calendar',side_effect=ValueError('unadjusted split')):
            r=document_collect(s,NOW)
        self.assertEqual(r['aum']['amount'],123);self.assertEqual(r['characteristics']['terPct'],1.49)
        self.assertNotIn('performance',r);self.assertEqual(r['collectionErrors'][0]['field'],'performance')

    def test_abtc_factsheet_failure_preserves_calendar(self):
        s=share('CH0454664001')
        calendar=abtc_calendar(*self.abtc_payloads(),s,NOW,'official-url')
        with patch('collect_document_etf.download',side_effect=TimeoutError('factsheet timeout')),patch('collect_product_calendars.collect_abtc_calendar',return_value=calendar):
            r=document_collect(s,NOW)
        self.assertEqual(r['performance'],calendar);self.assertTrue(r['exposureOnly'])
        self.assertEqual(r['collectionErrors'][0]['field'],'document')
        from apply_etf_collection import merge_collection
        existing={'currency':'USD','productId':s['isin'],'provider':'21Shares','sourceUrl':s['sourceUrl'],
                  'characteristics':{'terPct':1.49,'checkedAt':'2026-10-06'},'aum':{'amount':123,'asOf':'2026-10-06'}}
        merged=merge_collection({'checkedAt':NOW.isoformat(),'shares':[r]},{s['isin']:existing},{})[s['isin']]
        self.assertEqual(merged['characteristics'],existing['characteristics']);self.assertEqual(merged['aum'],existing['aum'])
        self.assertEqual(merged['performance']['years'],calendar['years'])

    def test_bitwise_exact_nav_and_exclude_ytd_launch(self):
        text=(FIX/'bitwise.html').read_text();s=share('DE000A27Z304')
        r=bitwise_calendar(Page(text),s,NOW,'hash')
        self.assertEqual(r['years'],{'2025':-9.68,'2024':120.73,'2023':150.42,'2022':-64.67,'2021':55.46})
        self.assertEqual(r['asOf'],'2026-10-07')
        for a,b in [('NAV is displayed in the base currency (USD)','Currency EUR'),('2025','2026'),('07-10-2026','07-01-2026'),('55.46%','NaN%'),('2021','2022')]:
            with self.subTest(a=a),self.assertRaises(ValueError):bitwise_calendar(Page(text.replace(a,b)),s,NOW,'h')

    def test_hsbc_fund_bars_not_benchmark(self):
        words=json.loads((FIX/'hsbc-words.json').read_text());text=(FIX/'hsbc.txt').read_text();s=share('IE00B4K6B022')
        with patch('collect_product_calendars.pdf_text',return_value=text),patch('collect_product_calendars.pdf_words',return_value=words):
            r=hsbc_calendar(b'%PDF-test',s,NOW)
        self.assertEqual(r['years']['2025'],21.8)
        self.assertEqual(r['years']['2020'],-2.8)
        self.assertEqual(len(r['years']),10)
        self.assertEqual(r['asOf'],'2026-03-03')
        for a,b in [('IE00B4K6B022','WRONG'),('Class:EUR','Class:USD'),('03 March 2026','03 March 2025'),('income reinvested','income distributed')]:
            with self.subTest(a=a),patch('collect_product_calendars.pdf_text',return_value=text.replace(a,b)),self.assertRaises(ValueError):hsbc_calendar(b'%PDF-test',s,NOW)
        for defect in ['missing-bar','legend-order','duplicate-year']:
            bad=copy.deepcopy(words)
            chart=bad[1]
            if defect=='missing-bar':chart[:]=[w for w in chart if w['text']!='21.8']
            if defect=='legend-order':next(w for w in chart if w['text']=='Benchmark')['x']=1
            if defect=='duplicate-year':chart.append(next(w for w in chart if w['text']=='2025'))
            with self.subTest(defect=defect),self.assertRaises(ValueError):hsbc_chart(bad,NOW)

    def test_coinshares_normalized_product_and_staking(self):
        for isin,last in [('GB00BLD4ZL17',-7.99),('GB00BLD4ZM24',-11.70)]:
            p=json.loads((FIX/(isin+'.json')).read_text());s=share(isin)
            r=coinshares_calendar(p,s,NOW,'https://www-api.coinshares.com/api/v2/Widgets')
            self.assertEqual(r['years']['2025'],last)
            self.assertEqual(set(r['years']),{'2022','2023','2024','2025'})
            self.assertEqual(r['asOf'],'2026-10-06')
            for defect in ['wrong-series','raw-ratio','duplicate-date','missing-boundary','nan','wrong-inception','stale','currency']:
                bad=copy.deepcopy(p);config=dict(s);series=bad[0]['sections'][0]['graph']['series'][0]
                if defect=='wrong-series':series['key']='BTC'
                if defect=='raw-ratio':series['scaleY']=''
                if defect=='duplicate-date':series['dataX'][1]=series['dataX'][0]
                if defect=='missing-boundary':
                    keep=[i for i,d in enumerate(series['dataX'])if not d.startswith('2023/12/')]
                    for k in ['dataX','dataY']:series[k]=[series[k][i]for i in keep]
                if defect=='nan':series['dataY'][1]='NaN'
                if defect=='wrong-inception':series['dataY'][-1]='999'
                if defect=='stale':series['updated']='2026-07-01T00:00:00Z'
                if defect=='currency':config['currency']='EUR'
                with self.subTest(isin=isin,defect=defect),self.assertRaises(ValueError):coinshares_calendar(bad,config,NOW,'url')

    def test_calendar_outage_preserves_independent_fields(self):
        s=share('IE00B4K6B022');healthy={'productId':s['isin'],'characteristics':{'terPct':.05},'aum':{'amount':1},'unavailable':[]}
        with patch('collect_document_etf.download',side_effect=[b'%PDF-test',TimeoutError('calendar timeout')]),patch('collect_document_etf.pdf_text',return_value='text'),patch('collect_document_etf.parse',return_value=copy.deepcopy(healthy)):
            r=document_collect(s,NOW)
        self.assertIn('aum',r);self.assertNotIn('performance',r);self.assertEqual(r['collectionErrors'][0]['field'],'performance')
        s=share('GB00BLD4ZM24')
        with patch('collect_remaining_documents.download',return_value=b'%PDF-test'),patch('collect_remaining_documents.pdf_text',return_value='text'),patch('collect_remaining_documents.coinshares',return_value=copy.deepcopy(healthy)),patch('collect_coinshares_aum.collect',return_value={'amount':2}),patch('collect_product_calendars.collect_coinshares_calendar',side_effect=ValueError('unqualified graph')):
            r=remaining_collect(s,NOW)
        self.assertEqual(r['aum']['amount'],2);self.assertNotIn('performance',r);self.assertEqual(r['collectionErrors'][0]['field'],'performance')

if __name__=='__main__':unittest.main()
