"""Regression guards against wrong shares, dates, economic scope and partial years."""
import copy
import datetime as dt
import json
from pathlib import Path
import unittest
import urllib.error
from unittest.mock import patch
from collect_public_issuer import wisdomtree, bitwise, globalx, wisdomtree_factsheet, collect_one as public_collect
from collect_lg_api import parse as lg, decode
from collect_remaining_documents import coinshares, ubs, collect_one, ubs_urls
from apply_etf_collection import merge_collection
from data_automation import UTC

FIX=Path(__file__).parent/'fixtures/official-documents/new-issuers'
NOW=dt.datetime(2026,10,6,tzinfo=UTC)
CONFIG=json.loads((Path(__file__).parent/'additional-etf-sources.json').read_text())
def share(isin):return next(s for s in CONFIG['instruments']if s['isin']==isin)

class IssuerSources(unittest.TestCase):
    def test_wisdomtree_identity_dates_and_allocations(self):
        text=(FIX/'wisdomtree.html').read_text();s=share('IE00BZ56SW52')
        result=wisdomtree(text,s,NOW)
        self.assertEqual(result['characteristics']['terPct'],.38)
        self.assertEqual(result['aum']['scope'],'fund')
        self.assertEqual(result['sectors']['basis'],'fund')
        self.assertAlmostEqual(sum(r['weightPct']for r in result['countries']['rows']),100,delta=.1)
        self.assertNotIn('performance',result)
        for a,b in [('IE00BZ56SW52','IE00OTHER001'),('05/10/2026','05/01/2026'),('61.34%','1.34%'),('US$1,645,809,873','1,645,809,873')]:
            with self.assertRaises(ValueError):wisdomtree(text.replace(a,b),s,NOW)

    def test_copper_fee_components_stay_separate(self):
        text=(FIX/'copper.html').read_text()
        result=wisdomtree(text,share('GB00B15KXQ89'),NOW)
        self.assertEqual(result['characteristics']['terPct'],.49)
        self.assertEqual(result['characteristics']['annualSwapRatePct'],.45)

    def test_wisdomtree_pdf_calendar_and_launch_year(self):
        text=(FIX/'wisdomtree-calendar.txt').read_text();s=share('IE00BZ56SW52')
        def parse(t,config=s):
            with patch('issuer_documents.pdf_text',return_value=t), patch('collect_wisdomtree_allocations.allocations',return_value={}):return wisdomtree_factsheet(b'%PDF-body',config,NOW)
        r=parse(text)
        self.assertEqual(r['performance']['years']['2025'],16.33)
        self.assertEqual(r['performance']['years']['2020'],16.26)
        self.assertNotIn('aum',r)
        self.assertNotIn('2020',parse(text.replace('03/06/2016','03/06/2020'))['performance']['years'])
        for a,b in [('IE00BZ56SW52','IE00OTHER001'),('Base Currency USD','Base Currency EUR'),('31/08/2026','31/01/2026'),('2025','2026')]:
            with self.assertRaises(ValueError):parse(text.replace(a,b))
        with self.assertRaises(ValueError):parse(text,{**s,'factsheetUrl':'https://example.com/facts.pdf'})

    def test_wisdomtree_fallback_only_on_transport_failure(self):
        text=(FIX/'wisdomtree-calendar.txt').read_text();s=share('IE00BZ56SW52')
        failure=urllib.error.HTTPError(s['sourceUrl'],403,'Forbidden',{},None)
        with patch('collect_public_issuer.get_text',side_effect=failure),patch('collect_public_issuer.download',return_value=b'%PDF-body'),patch('issuer_documents.pdf_text',return_value=text),patch('collect_wisdomtree_allocations.allocations',return_value={}):
            r=public_collect(s,NOW)
            self.assertEqual(r['sourceUrl'],s['factsheetUrl'])
            self.assertEqual(r['performance']['asOf'],'2026-08-31')
        bad=(FIX/'wisdomtree.html').read_text().replace(s['isin'],'IE00OTHER001')
        with patch('collect_public_issuer.get_text',return_value=bad),patch('collect_public_issuer.download')as fetch:
            with self.assertRaises(ValueError):public_collect(s,NOW)
            fetch.assert_not_called()

    def test_bitwise_launch_year_not_full_fund_history(self):
        text=(FIX/'bitwise.html').read_text();s=share('DE000A27Z304');r=bitwise(text,s,NOW)
        self.assertEqual(r['aum']['amount'],917010591.29)
        self.assertNotIn('performance',r)
        with self.assertRaises(ValueError):bitwise(text.replace('Price Reference Currency</p>\n<p>USD','Price Reference Currency</p>\n<p>EUR'),s,NOW)
        with self.assertRaises(ValueError):bitwise(text.replace('DE000A27Z304','DE000OTHER00'),s,NOW)

    def test_globalx_exact_share_aum_and_no_basket_exposure(self):
        text=(FIX/'globalx.html').read_text();s=share('IE00BM8R0J59');r=globalx(text,s,NOW)
        self.assertEqual(r['characteristics']['terPct'],.45)
        self.assertNotIn('holdings',r)
        with self.assertRaises(ValueError):globalx(text.replace(s['isin'],'IE00OTHER001'),s,NOW)

    def test_lg_calendar_not_rolling_and_current_document_authority(self):
        payload=json.loads((FIX/'lg.json').read_text());s=share('IE00BF0M2Z96');r=lg(payload,s,NOW,'hash')
        self.assertEqual(r['performance']['years'],{'2025':72.17,'2024':-1.14,'2023':8.11,'2022':-14.01,'2021':15.95,'2020':79.49})
        self.assertEqual(r['aum']['asOf'],'2026-10-05')
        self.assertEqual(r['characteristics']['asOf'],'2026-08-31')
        fields=[f['code_name']for f in payload['metadata']['share_class_fields']]
        def changed(key,value):
            c=copy.deepcopy(payload);c['funds'][0]['share_classes'][0]['data'][fields.index(key)]=value;return c
        self.assertEqual(lg(changed('launchDate','2020-06-08'),s,NOW,'h')['performance']['years'].get('2020'),None)
        for key,value in [('shareclassISIN','IE00OTHER001'),('shareclassCurrency','EUR'),('factSheet',[['https://example.com/facts.pdf',0,'English','2026-08-31']])]:
            with self.assertRaises(ValueError):lg(changed(key,value),s,NOW,'h')
        c=copy.deepcopy(payload);c['metadata']['year_end_date']='2026-12-31'
        with self.assertRaises(ValueError):lg(c,s,NOW,'h')
        with self.assertRaises(ValueError):decode([{'code_name':'x'},{'code_name':'x'}],[1,2])

    def test_coinshares_price_table_never_fund_performance(self):
        for isin,file,fee in [('GB00BLD4ZL17','coinshares.txt',.15),('GB00BLD4ZM24','coinshares-eth.txt',0)]:
            text=(FIX/file).read_text();s=share(isin);r=coinshares(text,s,NOW,'h')
            self.assertEqual(r['characteristics']['terPct'],fee)
            self.assertNotIn('performance',r)
            self.assertNotIn('aum',r)
            with self.assertRaises(ValueError):coinshares(text.replace('31 August 2026','31 January 2026'),s,NOW,'h')

    def test_wisdomtree_pdf_outage_preserves_valid_html_and_reports_failure(self):
        text=(FIX/'wisdomtree.html').read_text();s=share('IE00BZ56SW52')
        failure=urllib.error.HTTPError(s['factsheetUrl'],502,'temporary outage',{},None)
        with patch('collect_public_issuer.get_text',return_value=text),patch('collect_public_issuer.download',side_effect=failure):
            result=public_collect(s,NOW)
        self.assertIn('aum',result)
        self.assertEqual(result['collectionErrors'][0]['field'],'performance')
        self.assertNotIn('performance',result)

    def test_wisdomtree_rejected_pdf_preserves_html_without_applying_pdf_fields(self):
        text=(FIX/'wisdomtree.html').read_text();s=share('IE00BZ56SW52')
        for reason in ['Wrong WisdomTree UCITS exact share/currency',
                       'Official document date is missing, future or stale',
                       'Expected official PDF, received another document']:
            with self.subTest(reason=reason), patch('collect_public_issuer.get_text',return_value=text), \
                 patch('collect_public_issuer.download',return_value=b'invalid'), \
                 patch('collect_public_issuer.wisdomtree_factsheet',side_effect=ValueError(reason)):
                result=public_collect(s,NOW)
            self.assertEqual(result['aum']['amount'],1645809873)
            self.assertEqual(result['characteristics']['terPct'],.38)
            self.assertNotIn('performance',result)
            self.assertEqual(result['collectionErrors'][0]['reason'],reason)

    def test_wisdomtree_invalid_allocations_preserve_valid_pdf_calendars(self):
        text=(FIX/'wisdomtree-calendar.txt').read_text();s=share('IE00BZ56SW52')
        with patch('issuer_documents.pdf_text',return_value=text), \
             patch('collect_wisdomtree_allocations.allocations',side_effect=ValueError('Truncated official composition')):
            result=wisdomtree_factsheet(b'%PDF-body',s,NOW)
        self.assertEqual(result['performance']['years']['2025'],16.33)
        self.assertEqual(result['characteristics']['terPct'],.38)
        self.assertNotIn('sectors',result)
        self.assertNotIn('holdings',result)
        self.assertEqual(result['collectionErrors'][0]['field'],'allocations')

    def test_wisdomtree_first_single_full_year_is_accepted(self):
        s=share('IE0002Y8CX98');now=NOW.replace(year=2027)
        text="Document Date: 30/09/2027\nISIN IE0002Y8CX98\nBase Currency EUR\nTotal Expense Ratio 0.40%\nInception Date 04/03/2025\n"+s['documentName']+"\nCalendar Year Performance (Net of fees)\nName 2026\n\n"+s['documentName']+" 12.34%\n\nRolling 12-month"
        with patch('issuer_documents.pdf_text',return_value=text),patch('collect_wisdomtree_allocations.allocations',return_value={}):
            r=wisdomtree_factsheet(b'test-first-calendar',s,now)
        self.assertEqual(r['performance']['years'],{'2026':12.34})
        with patch('issuer_documents.pdf_text',return_value=text.replace('Name 2026','Name 2027')),self.assertRaises(ValueError):
            wisdomtree_factsheet(b'test-incomplete-calendar',s,now)

    def test_ubs_exact_index_scope_and_month_discovery(self):
        text=(FIX/'ubs.txt').read_text();s=share('IE00BD4TXV59');r=ubs(text,s,NOW,'h')
        self.assertEqual(r['aum']['amount'],17446660000)
        self.assertEqual(len(r['holdings']['rows']),10)
        self.assertEqual(r['holdings']['basis'],'index')
        self.assertEqual(r['performance']['years'],{'2022':-18.26,'2023':23.79,'2024':18.86,'2025':21.31})
        self.assertEqual(r['performance']['currency'],'USD')
        for a,b in [('Fund (USD)','Fund (EUR)'),('2022      2023','2022      2022'),('YTD2','Annual'),('Ø p.a.','Rolling')]:
            with self.assertRaises(ValueError):ubs(text.replace(a,b),s,NOW,'h')
        urls=list(ubs_urls(NOW));self.assertIn('20260930',urls[0]);self.assertIn('20260831',urls[1])
        def fetch(url, **kwargs):
            if url.replace('https://www.swissfunddata.ch/', 'https://swissfunddata.ch/')==urls[0]:raise ValueError('Expected official PDF; received Dokument nicht gefunden | Swiss Fund Data at '+url)
            return b'%PDF-body'
        with patch('collect_remaining_documents.download',side_effect=fetch),patch('collect_remaining_documents.pdf_text',return_value=text):
            r=collect_one(s,NOW)
            self.assertEqual(r['sourceUrl'],urls[1])

        def timeout(url, **kwargs):
            if url.replace('https://www.swissfunddata.ch/', 'https://swissfunddata.ch/')==urls[0]:raise TimeoutError('latest month timed out')
            return b'%PDF-body'
        with patch('collect_remaining_documents.download',side_effect=timeout),patch('collect_remaining_documents.pdf_text',return_value=text):
            self.assertEqual(collect_one(s,NOW)['sourceUrl'],urls[1])
        with patch('collect_remaining_documents.download',side_effect=ValueError('unexpected HTML')):
            with self.assertRaises(ValueError):collect_one(s,NOW)

    def test_recent_launch_preserves_existing_simulation(self):
        s=share('IE00BF0M2Z96');p=json.loads((FIX/'lg.json').read_text());fields=[f['code_name']for f in p['metadata']['share_class_fields']]
        p['funds'][0]['share_classes'][0]['data'][fields.index('launchDate')]='2020-06-08'
        r=lg(p,s,NOW,'h');old={s['isin']:{'productId':s['isin'],'currency':'USD','sourceUrl':s['sourceUrl'],'characteristics':{'terPct':0.49,'checkedAt':'2026-10-01'}}}
        merged=merge_collection({'checkedAt':'2026-10-06','shares':[r]},old,{s['isin']:{'currency':'USD'}})
        self.assertNotIn('2020',merged[s['isin']]['performance']['years'])
        self.assertIn('2025',merged[s['isin']]['performance']['years'])
        self.assertIn('aum',merged[s['isin']])

    def test_ubs_september_pdf_content_order_avoids_overlapping_calendar_headers(self):
        layout=(FIX/'ubs-september-layout.txt').read_text()
        raw=(FIX/'ubs-september-raw.txt').read_text()
        s=share('IE00BD4TXV59')
        with self.assertRaises(ValueError):ubs(layout,s,NOW,'h')
        r=ubs(layout,s,NOW,'h',performance_text=raw)
        self.assertEqual(r['performance']['asOf'],'2026-09-30')
        self.assertEqual(r['performance']['years'],{'2022':-18.26,'2023':23.79,'2024':18.86,'2025':21.31})
        self.assertNotIn('2026',r['performance']['years'])
        self.assertEqual(r['holdings']['basis'],'index')
        self.assertEqual(len(r['holdings']['rows']),10)
        for before,after in [('Fund (USD)','Fund (EUR)'),('in % 2022 2023','in % 2022 2022'),('YTD2','Annual')]:
            with self.assertRaises(ValueError):ubs(layout,s,NOW,'h',performance_text=raw.replace(before,after))

if __name__=='__main__':unittest.main()
