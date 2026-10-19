import datetime as dt
import unittest
from collect_instrument_metadata import parse_text, collect


class MetadataCompletionTests(unittest.TestCase):
    ISIN='IE00B4L5Y983'

    def test_explicit_hedge_rows_in_both_languages(self):
        for label,value,expected in [
            ('Currency risk','Currency unhedged',False),
            ('Currency risk','Currency hedged EUR',True),
            ('Couverture du risque de change','Non couvert contre le risque de change',False),
            ('Couverture du risque de change','Couvert en EUR',True),
        ]:
            with self.subTest(value=value):
                self.assertIs(parse_text(f'{self.ISIN}\n{label}\n{value}\n',self.ISIN)['currencyHedge'],expected)

    def test_unknown_hedge_is_never_false(self):
        for text in ['Currency risk\n-','Currency risk\nNot disclosed', 'EUR Hedged ETF', 'Currency risk\nUSD', 'Currency risk\nCurrency partially hedged']:
            self.assertNotIn('currencyHedge',parse_text(self.ISIN+'\n'+text,self.ISIN))

    def test_wrong_share_and_contradictory_hedges_are_rejected(self):
        for text in ['IE00BDBRDM35\nCurrency risk\nCurrency hedged EUR',self.ISIN+'\nCurrency risk\nCurrency hedged EUR\nCurrency Hedged: No']:
            with self.assertRaises(ValueError):parse_text(text,self.ISIN)

    def test_secondary_source_hedge_retains_actual_document_evidence(self):
        import hashlib
        body=(self.ISIN+'\nCurrency risk\nCurrency unhedged\n').encode()
        values,_=collect({'isin':self.ISIN,'urls':['https://www.justetf.com/en/etf-profile.html?isin='+self.ISIN]},dt.datetime(2026,10,19,tzinfo=dt.timezone.utc),lambda _:body)
        self.assertIs(values['currencyHedge']['value'],False)
        self.assertEqual(values['currencyHedge']['sha256'],hashlib.sha256(body).hexdigest())
        self.assertEqual(values['currencyHedge']['checkedAt'],'2026-10-19')


if __name__=='__main__':unittest.main()
