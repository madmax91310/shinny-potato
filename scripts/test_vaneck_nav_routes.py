import copy
import datetime as dt
import gzip
import json
import unittest
from pathlib import Path
from unittest.mock import patch
from collect_official_share_history import configurations, collect_one
from collect_vaneck_etf import parse_calendar_performance

ROOT=Path(__file__).resolve().parents[1]
P=ROOT/'reports/reliquat-2026-10-23/preuves'
NOW=dt.datetime(2026,10,23,tzinfo=dt.timezone.utc)
FX='<g:Envelope xmlns:g="http://www.gesmes.org/xml/2002-08-01" xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref"><Cube><Cube time="2026-10-22"><Cube currency="USD" rate="1.17"/></Cube></Cube></g:Envelope>'

class VanEckRoutes(unittest.TestCase):
    def source(self,isin):return next(s for s in configurations()if s['isin']==isin)
    def collect(self,isin,change=None):
        source=copy.deepcopy(self.source(isin))
        titles={r['isin']:r for r in json.loads((P/'vaneck-daily-collectes.json').read_text())}
        row=titles.get(isin,{'title':'VanEck S&P Global Mining UCITS ETF - GDIG','file':'mining-official-nav.download'})
        title=row['title'];ticker=title.rsplit(' - ',1)[1];slug=source['sourceUrl'].rstrip('/').rsplit('/',1)[1]
        page=f'<h1>{title.rsplit(" - ",1)[0]}</h1>{isin}<ve-histopricesblock data-blockid="b" data-pageid="p"></ve-histopricesblock><ve-fundticker>{ticker}</ve-fundticker>'
        metadata={'data':{'CurrencyName':'USD','Ticker':ticker,'DownloadUrl':f'/ucits/investments/{slug}/downloads/fundhistoprices/'}}
        pdf=gzip.decompress((P/(isin+'-inception.pdf.gz')).read_bytes())
        if change:source,page,metadata=change(source,page,metadata)
        def document(url):
            if url==source['sourceUrl']:return page.encode()
            if '/fundhistoprices/'in url:return (P/row['file']).read_bytes()
            if '/fact-sheets/'in url:return pdf
            raise AssertionError(url)
        with patch('collect_official_share_history.get_text',return_value=FX):
            return collect_one(source,NOW,json_fetch=lambda _:metadata,document_fetch=document)
    def test_three_exact_accumulating_routes_and_existing_mining(self):
        for isin,years in [('IE00BYWQWR46',6),('IE000M7V94E1',2),('IE000YU9K6K2',3),('IE00BDFBTQ78',7)]:
            with self.subTest(isin=isin):
                r=self.collect(isin)
                self.assertEqual(r['isin'],isin);self.assertEqual(r['currency'],'EUR')
                self.assertEqual(len(r['calendarProof']['checks']),years)
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
    def test_calendar_uses_fund_inception_and_preserves_source_precision(self):
        text=(P/'IE00BQQP9F84-inception.txt').read_text()
        performance,precision=parse_calendar_performance(text,{'isin':'IE00BQQP9F84','currency':'USD'},NOW)
        self.assertIn('2016',performance['years'],'The index inception in 2025 must not truncate the fund history')
        self.assertEqual(precision['2018'],0);self.assertEqual(precision['2017'],1)

if __name__=='__main__':unittest.main()
