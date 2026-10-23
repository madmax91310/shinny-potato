import copy
import datetime as dt
import gzip
import json
import unittest
from bs4 import BeautifulSoup
from pathlib import Path
from unittest.mock import patch
from collect_official_share_history import configurations, collect_one
from collect_vaneck_etf import parse_calendar_performance

ROOT=Path(__file__).resolve().parents[1]
P=ROOT/'reports/reliquat-2026-10-23/preuves'
NOW=dt.datetime(2026,10,23,tzinfo=dt.timezone.utc)
FX='<g:Envelope xmlns:g="http://www.gesmes.org/xml/2002-08-01" xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref"><Cube><Cube time="2026-10-22"><Cube currency="USD" rate="1.17"/></Cube></Cube></g:Envelope>'

class VanEckRoutes(unittest.TestCase):
    def source(self,isin):
        candidates=json.loads((ROOT/'reports/vaneck-nav-remainder-2026-10-23/candidats.json').read_text())
        return next(s for s in configurations()+candidates if s['isin']==isin)
    def collect(self,isin,change=None,api_change=None):
        source=copy.deepcopy(self.source(isin))
        if isin=='IE00BQQP9F84':source['navCalendarSource']='page-api'
        titles={r['isin']:r for r in json.loads((P/'vaneck-daily-collectes.json').read_text())}
        row=titles.get(isin,{'title':'VanEck S&P Global Mining UCITS ETF - GDIG','file':'mining-official-nav.download'})
        title=row['title'];ticker=title.rsplit(' - ',1)[1];slug=source['sourceUrl'].rstrip('/').rsplit('/',1)[1]
        discovery=ROOT/'reports/vaneck-nav-remainder-2026-10-23/api-discovery'
        page=gzip.decompress((discovery/(isin+'-page.html.gz')).read_bytes()).decode()
        ticker=BeautifulSoup(page,'html.parser').find('ve-fundticker').get_text(strip=True)
        metadata={'data':{'CurrencyName':'USD','Ticker':ticker,'DownloadUrl':f'/ucits/investments/{slug}/downloads/fundhistoprices/'}}
        if change:source,page,metadata=change(source,page,metadata)
        def document(url):
            if url==source['sourceUrl']:return page.encode()
            if '/fundhistoprices/'in url:return (P/row['file']).read_bytes()
            if '/fact-sheets/'in url and isin=='IE00BDFBTQ78':return gzip.decompress((P/(isin+'-inception.pdf.gz')).read_bytes())
            raise AssertionError('NAV route must not download a region-gated factsheet: '+url)
        def api(url):
            if '/HistoPricesBlock/'in url:return metadata
            controller=url.split('/Main/')[1].split('/')[0]
            result=json.loads((discovery/(isin+'-'+controller+'.json')).read_text())
            return api_change(controller,result)if api_change else result
        with patch('collect_official_share_history.get_text',return_value=FX):
            return collect_one(source,NOW,json_fetch=api,document_fetch=document)
    def test_three_exact_accumulating_routes_and_existing_mining(self):
        for isin,years in [('IE00BYWQWR46',6),('IE000M7V94E1',2),('IE000YU9K6K2',3),('IE00BDFBTQ78',7)]:
            with self.subTest(isin=isin):
                r=self.collect(isin)
                self.assertEqual(r['isin'],isin);self.assertEqual(r['currency'],'EUR')
                self.assertEqual(len(r['calendarProof']['checks']),years)
                if isin!='IE00BDFBTQ78':self.assertEqual(r['calendarProof']['officialPageCalendar']['isin'],isin)
                self.assertEqual(r['latestLevel']['nativeCurrency'],'USD')
                self.assertEqual(r['latestLevel']['fxAsOf'],'2026-10-22')
                self.assertNotIn('symbol',r);self.assertNotIn('mic',r)
    def test_identity_currency_and_cross_fund_download_fail_closed(self):
        isin='IE00BYWQWR46'
        def wrong_currency(s,p,m):m['data']['CurrencyName']='EUR';return s,p,m
        def wrong_download(s,p,m):m['data']['DownloadUrl']='/ucits/investments/mining-etf/downloads/fundhistoprices/';return s,p,m
        def wrong_heading(s,p,m):return s,p.replace('Video Gaming','Other Fund'),m
        def prelaunch(s,p,m):s['periodStart']='2010-01';return s,p,m
        for mutation in [wrong_currency,wrong_download,wrong_heading,prelaunch]:
            with self.subTest(mutation=mutation.__name__),self.assertRaises(ValueError):self.collect(isin,mutation)
    def test_gold_mining_calendar_disagreement_is_not_silenced(self):
        with self.assertRaisesRegex(ValueError,'2017: 11.656'):
            self.collect('IE00BQQP9F84')
    def test_wrong_us_fund_share_currency_income_and_calendar_fail_closed(self):
        def mutation(kind):
            def change(controller,result):
                data=result['data']
                if kind=='us-ticker'and controller=='FundDetailsBlock':data['Ticker']='ESPO'
                if kind in ['income','currency']and controller=='FundDetailsBlock':
                    for row in data['Values']:
                        if row['Title']==('Income Treatment'if kind=='income'else'Base Currency'):row['Value']='Distributing'if kind=='income'else'EUR'
                if kind=='share'and controller=='TradingInformationBlock':data['Items'][0]['Isin']='US92189F1066'
                if kind=='calendar-currency'and controller=='PerformancePastYearsChartBlock':data['DisclaimerText']=data['DisclaimerText'].replace('in USD','in EUR')
                if kind in ['missing-year','benchmark-only']and controller=='PerformancePastYearsChartBlock':
                    series=json.loads(data['Series'])
                    if kind=='missing-year':series[0]['data'][-1]=None
                    else:series=series[1:]
                    data['Series']=json.dumps(series)
                return result
            return change
        for kind in ['us-ticker','income','currency','share','calendar-currency','missing-year','benchmark-only']:
            with self.subTest(kind=kind),self.assertRaises(ValueError):self.collect('IE00BYWQWR46',api_change=mutation(kind))
    def test_api_precision_is_preserved_and_mining_candidate_is_not_forced(self):
        r=self.collect('IE00BYWQWR46')
        self.assertEqual(next(c for c in r['calendarProof']['checks']if c['year']==2020)['publishedDecimalPlaces'],1)
        def api(s,p,m):s['navCalendarSource']='page-api';return s,p,m
        with self.assertRaisesRegex(ValueError,'2022: 1.945'):
            self.collect('IE00BDFBTQ78',api)
    def test_failed_api_refresh_preserves_record_and_proof_dates(self):
        from refresh_monthly_history import refresh
        r=self.collect('IE00BYWQWR46');r['checkedAt']='2026-10-22';r['latestLevel']['checkedAt']='2026-10-22'
        source=self.source('IE00BYWQWR46')
        baseline={source['id']:{'currency':'EUR','points':[{'date':d,'price':v}for d,v in r['points']]}}
        def failed(*args):raise ValueError('Official API wrong share')
        merged,report=refresh({'series':[source]},{source['id']:r},baseline,NOW,collect=failed)
        self.assertEqual(merged[source['id']],r);self.assertEqual(report['series'][0]['status'],'failed')
        self.assertNotIn('evidence',report['series'][0])
    def test_calendar_uses_fund_inception_and_preserves_source_precision(self):
        text=(P/'IE00BQQP9F84-inception.txt').read_text()
        performance,precision=parse_calendar_performance(text,{'isin':'IE00BQQP9F84','currency':'USD'},NOW)
        self.assertIn('2016',performance['years'],'The index inception in 2025 must not truncate the fund history')
        self.assertEqual(precision['2018'],0);self.assertEqual(precision['2017'],1)

if __name__=='__main__':unittest.main()
