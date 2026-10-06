import datetime as dt
import unittest
from collect_document_etf import parse, parse_legacy
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
        with self.assertRaises(ValueError):parse_legacy(text.replace('IE00TEST0001','IE00OTHER001'),share,NOW)
        with self.assertRaises(ValueError):parse_legacy(text.replace('30/sept./2026','30/janv./2026'),share,NOW)

if __name__=='__main__':unittest.main()
