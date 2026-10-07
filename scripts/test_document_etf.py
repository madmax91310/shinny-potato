import datetime as dt
import unittest
import urllib.error
from unittest.mock import patch
from collect_document_etf import parse, parse_legacy, collect_legacy, parse_legacy_factsheet
from apply_etf_collection import merge_collection
from data_automation import UTC

NOW=dt.datetime(2026,10,6,tzinfo=UTC)
class Documents(unittest.TestCase):
    def test_etp_calendar_not_underlying_or_rolling(self):
        share={'isin':'GB00TEST0001','name':'Test ETP','currency':'USD','documentType':'wisdomtree'}
        text='Document Date: 30/09/2026\nISIN GB00TEST0001\nBase Currency USD\nManagement Fee 0.2%\nCalendar Year Performance (Net of fees)\nName 2024 2025\nTest ETP 12% -2%\nUnderlying 15% 3%\nRolling 12-month'
        result=parse(text,share,NOW)
        self.assertEqual(result['performance']['years'],{'2024':12,'2025':-2})
        self.assertNotIn('aum',result)
        for old,new in [('Base Currency USD','Base Currency EUR'),('2024 2025','2025 2026'),('GB00TEST0001','GB00OTHER001'),('Calendar Year','Rolling Year')]:
            with self.assertRaises(ValueError):parse(text.replace(old,new),share,NOW)
    def test_partial_characteristics_preserve_fields(self):
        current={'XX':{'currency':'USD','productId':'XX','sourceUrl':'https://issuer.test','characteristics':{'terPct':.3,'index':'Existing index','distribution':'Existing policy','checkedAt':'2026-10-01'}}}
        report={'checkedAt':'2026-10-06','shares':[{'isin':'XX','currency':'USD','productId':'XX','sourceUrl':'https://issuer.test','characteristics':{'terPct':.2}}]}
        merged=merge_collection(report,current,{})
        self.assertEqual(merged['XX']['characteristics']['terPct'],.2)
        self.assertEqual(merged['XX']['characteristics']['distribution'],'Existing policy')
    def test_legacy_exact_isin_scope_and_date(self):
        share={'isin':'IE00TEST0001','productId':123,'currency':'EUR'}
        text='var portfolioId = "123";'
        for key,value in [('isin','IE00TEST0001'),('seriesBaseCurrencyCode','EUR'),('totalNetAssets','Actif net <span>au 30/sept./2026</span> EUR 1\u202f234\u202f567'),('emeaMgt','<b>TER</b><span>0,20%</span>')]:
            text+=f'<div class="product-data-item col-{key}"><span>{value}</span></div>'
        text+='</section>'
        result=parse_legacy(text,share,NOW)
        self.assertEqual(result['aum']['amount'],1234567)
        self.assertEqual(result['aum']['scope'],'share-class')
        english=text.replace('au 30/sept./2026','as of 30/Sep/2026').replace('\u202f','’')
        self.assertEqual(parse_legacy(english,share,NOW)['aum']['amount'],1234567)
        with self.assertRaises(ValueError):parse_legacy(text.replace('IE00TEST0001','IE00OTHER001'),share,NOW)
        with self.assertRaises(ValueError):parse_legacy(text.replace('30/sept./2026','30/janv./2026'),share,NOW)

    def test_legacy_transport_fallback_preserves_exact_source(self):
        primary='https://www.ishares.com/ch/professionals/en/products/123/'
        backup='https://www.blackrock.com/fr/particuliers/products/123/'
        share={'isin':'IE00TEST0001','productId':123,'currency':'EUR','sourceUrl':primary,'fallbackUrls':[backup]}
        text='var portfolioId = "123";'
        for key,value in [('isin','IE00TEST0001'),('seriesBaseCurrencyCode','EUR'),('totalNetAssets','Actif net <span>au 30/sept./2026</span> EUR 1 234 567'),('emeaMgt','<b>TER</b><span>0,20%</span>')]:
            text+=f'<div class="product-data-item col-{key}"><span>{value}</span></div>'
        text+='</section>'
        calls=[]
        def fetch(url,*args):
            calls.append(url)
            if url==primary:raise urllib.error.HTTPError(url,403,'Forbidden',{},None)
            return text
        result=collect_legacy(share,NOW,fetch)
        self.assertEqual(calls,[primary,backup])
        self.assertEqual(result['aum']['amount'],1234567)
        self.assertEqual(result['sourceUrl'],backup)
        self.assertEqual(result['aum']['sourceUrl'],backup)
        self.assertEqual(len(result['aum']['sha256']),64)
        with patch('collect_document_etf.collect_legacy_document',return_value={'performance':{'years':{'2025':6.61}},'unavailable':[]}):
            annual=collect_legacy({**share,'factsheetUrl':'https://www.blackrock.com/fr/particuliers/literature/fact-sheet/test.pdf'},NOW,fetch)
            self.assertEqual(annual['performance']['years'],{'2025':6.61})
            self.assertEqual(annual['aum'],result['aum'])
        with patch('collect_document_etf.collect_legacy_document',side_effect=TimeoutError('document unavailable')):
            partial=collect_legacy({**share,'factsheetUrl':'https://www.blackrock.com/fr/particuliers/literature/fact-sheet/test.pdf'},NOW,fetch)
            self.assertEqual(partial['aum'],result['aum'])
            self.assertEqual(partial['collectionErrors'][0]['field'],'performance')
        def unavailable(url,*args):raise urllib.error.HTTPError(url,403,'Forbidden',{},None)
        with self.assertRaises(urllib.error.HTTPError):collect_legacy(share,NOW,unavailable)
        # Successful but invalid data never silently falls back to another page.
        for old,new in [('IE00TEST0001','IE00OTHER001'),('30/sept./2026','30/janv./2026'),('EUR','USD')]:
            calls.clear()
            def invalid(url,*args):
                calls.append(url)
                return text.replace(old,new)
            with self.assertRaises(ValueError):collect_legacy(share,NOW,invalid)
            self.assertEqual(calls,[primary])
        with self.assertRaises(ValueError):
            collect_legacy({**share,'fallbackUrls':['https://example.com/products/123/']},NOW,fetch)

    def test_legacy_monthly_document_and_newer_active_values(self):
        share={'isin':'IE00TEST0001','productId':123,'currency':'EUR','sourceUrl':'https://www.blackrock.com/fr/particuliers/literature/fact-sheet/test.pdf'}
        text="Informations sur l'actif net au 31-août-2026. Toutes les autres statistiques\nsont en date du 07-sept.-2026."
        facts="ISIN : IE00TEST0001\nDevise de la Classe d'Actions : EUR\nRatio des charges totales : 0,20%\nUtilisation des gains : Capitalisation\nActif net de la Catégorie d’actions (M) :\n2.070,79 EUR\nActif net du Fonds (M) : 2.085,27 EUR"
        result=parse_legacy_factsheet(text,facts,share,NOW)
        self.assertEqual(result['aum']['amount'],2070790000)
        self.assertEqual(result['aum']['asOf'],'2026-08-31')
        self.assertEqual(result['characteristics']['asOf'],'2026-09-07')
        calendar = "\nPERFORMANCE DE L'ANNÉE CIVILE\n2021 2022 2023 2024 2025\nClasse d’Actions - - - - 6,61\nIndice de référence - - - - 6,77\nCROISSANCE DE 10 000\n"
        annual=parse_legacy_factsheet(text+calendar,facts,share,NOW)
        self.assertEqual(annual['performance']['years'],{'2025':6.61})
        for old,new in [('2025','2026'),('2024','2025'),('6,61','6,61 8,2'),('Classe d’Actions','Indice')]:
            with self.assertRaises(ValueError):parse_legacy_factsheet(text+calendar.replace(old,new),facts,share,NOW)
        unpublished=parse_legacy_factsheet(text+calendar.replace('6,61','-'),facts,share,NOW)
        self.assertNotIn('performance',unpublished)
        self.assertIn('performance: no completed calendar year published for this share',unpublished['unavailable'])
        for old,new in [('IE00TEST0001','IE00OTHER001'),('EUR','USD'),('Capitalisation','Distribution')]:
            with self.assertRaises(ValueError):parse_legacy_factsheet(text,facts.replace(old,new),share,NOW)
        with self.assertRaises(ValueError):parse_legacy_factsheet(text.replace('31-août','31-mai'),facts,share,NOW)
        current={'IE00TEST0001':{'currency':'EUR','productId':123,'sourceUrl':share['sourceUrl'],'aum':{'amount':2300000000,'asOf':'2026-10-02','checkedAt':'2026-10-06'},'characteristics':{'terPct':.1,'checkedAt':'2026-10-06'}}}
        merged=merge_collection({'checkedAt':'2026-10-06','shares':[result]},current,{})
        self.assertEqual(merged['IE00TEST0001']['aum'],current['IE00TEST0001']['aum'])
        self.assertEqual(merged['IE00TEST0001']['characteristics'],current['IE00TEST0001']['characteristics'])
        current['IE00TEST0001']['characteristics']['asOf']='2026-09-07'
        merged=merge_collection({'checkedAt':'2026-10-06','shares':[result]},current,{})
        self.assertEqual(merged['IE00TEST0001']['characteristics'],current['IE00TEST0001']['characteristics'])

if __name__=='__main__':unittest.main()
