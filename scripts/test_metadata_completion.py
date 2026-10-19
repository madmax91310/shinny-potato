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
        values,_=collect({'isin':self.ISIN,'urls':['https://issuer.test/factsheet']},dt.datetime(2026,10,19,tzinfo=dt.timezone.utc),lambda _:body)
        self.assertIs(values['currencyHedge']['value'],False)
        self.assertEqual(values['currencyHedge']['sha256'],hashlib.sha256(body).hexdigest())
        self.assertEqual(values['currencyHedge']['checkedAt'],'2026-10-19')

    def test_bitwise_listing_is_bound_to_its_own_identity_and_currency(self):
        from pathlib import Path
        from collect_instrument_metadata import parse_listings
        body=Path(__file__).with_name('fixtures').joinpath('metadata-completion','bitwise-exact-listing.html').read_bytes()
        parse=lambda b,isin:parse_listings(b,{'isin':isin},'https://bitwiseinvestments.eu/products/bitwise-physical-bitcoin-etp/','2026-10-19')
        rows=parse(body,'DE000A27Z304')
        self.assertEqual([(r['mic'],r['ticker'],r['currency'],r['symbol']) for r in rows],[('XETR','BTCE','EUR','BTCE.DE')])
        self.assertEqual(parse(body,self.ISIN),[])
        # An unrelated share's row is not borrowed, even on the same issuer page.
        mixed=parse(body+body.replace(b'DE000A27Z304',self.ISIN.encode()).replace(b'BTCE',b'OTHER'),'DE000A27Z304')
        self.assertEqual([{k:v for k,v in r.items() if k!='sha256'} for r in mixed],[{k:v for k,v in r.items() if k!='sha256'} for r in rows])
        with self.assertRaisesRegex(ValueError,'tickers'):
            parse(body.replace(b'data-clipboard="BTCE GY"',b'data-clipboard="WRONG GY"'),'DE000A27Z304')
        self.assertEqual(parse(body.replace(b'data-exchange-currency="EUR"',b'data-exchange-currency="UNKNOWN"'),'DE000A27Z304'),[])

    def test_profile_scope_excludes_other_instruments_and_requires_identity(self):
        from pathlib import Path
        from collect_instrument_metadata import parse_justetf
        body=Path(__file__).with_name('fixtures').joinpath('metadata-completion','justetf-basics-with-promotion.html').read_bytes()
        expected={'distribution':'Distributing','domicile':'Ireland','replicationMethod':'Physical','currencyHedge':False}
        self.assertEqual(parse_justetf(body,'IE00BZ163G84'),expected)
        with self.assertRaisesRegex(ValueError,'identity'):parse_justetf(body,self.ISIN)
        with self.assertRaisesRegex(ValueError,'identity'):parse_justetf(body+body,'IE00BZ163G84')
        # A promotional PEA badge outside the profile's own badge is irrelevant.
        self.assertNotIn('pea',parse_justetf(body+b'<aside>Eligible PEA: Yes</aside>','IE00BZ163G84'))

    def test_explicit_broker_cells_distinguish_pea_from_pea_pme(self):
        from collect_instrument_metadata import parse_broker_pea
        def doc(label,value):return (self.ISIN+f'<table><tr><td>{label}</td><td>{value}</td></tr></table>').encode()
        self.assertEqual(parse_broker_pea(doc('PEA/PEA-PME/SRD','non / oui / non'),self.ISIN),{'pea':False})
        self.assertEqual(parse_broker_pea(doc('PEA','Yes'),self.ISIN),{'pea':True})
        self.assertEqual(parse_broker_pea(doc('PEA-PME','Yes'),self.ISIN),{})
        self.assertEqual(parse_broker_pea(doc('PEA','-'),self.ISIN),{})
        with self.assertRaisesRegex(ValueError,'identities'):parse_broker_pea(doc('PEA','No'),'IE00BDBRDM35')
        with self.assertRaisesRegex(ValueError,'Conflicting'):parse_broker_pea(doc('PEA','No')+doc('PEA','Yes'),self.ISIN)

    def test_combined_distribution_policy_is_not_truncated(self):
        self.assertEqual(parse_text(self.ISIN+'\nDistribution Policy: Capitalisation and/or distribution',self.ISIN)['distribution'],'Capitalisation and/or distribution')


if __name__=='__main__':unittest.main()
