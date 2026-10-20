import copy
import datetime as dt
import json
from pathlib import Path
import unittest
from dws_liquidity_funds import parse_liquidity_document
from collect_dws_etf import parse_holdings

NOW=dt.datetime(2026,10,20,tzinfo=dt.timezone.utc)
ISIN='IE00BYQNZ507'
TEXT=('Deutsche Managed Dollar Fund Share class: Z-Class, ISIN: IE00BYQNZ507, '
      'German Security Code: A14X8V, Currency: USD. This key information is accurate as at 16.02.2026. '
      'The mandate invests in short term debt. It is a money market fund. '
      'Investments mature within 397 days; weighted average maturity should not exceed 60 days.')

class LiquidityFunds(unittest.TestCase):
    def test_exact_mandate_identity_date_and_hash_are_required(self):
        proof=parse_liquidity_document(b'%PDF-fixture',ISIN,NOW,TEXT)
        self.assertEqual(proof['isin'],ISIN)
        self.assertEqual(proof['asOf'],'2026-02-16')
        self.assertEqual(len(proof['sha256']),64)
        for bad in [TEXT.replace(ISIN,'IE00BZ3FDF20'),TEXT.replace('Currency: USD','Currency: EUR'),
                    TEXT.replace('money market fund','equity fund'),TEXT.replace('16.02.2026','16.02.2024'),
                    TEXT.replace('16.02.2026','21.10.2026')]:
            with self.subTest(text=bad),self.assertRaises(ValueError):
                parse_liquidity_document(b'%PDF-fixture',ISIN,NOW,bad)
        with self.assertRaises(ValueError):parse_liquidity_document(b'<html>',ISIN,NOW,TEXT)

    def test_fund_units_stay_separate_and_equity_weights_are_not_renormalised(self):
        body=json.loads((Path(__file__).parent/'fixtures/official-documents/dws-physical-holdings.json').read_text())
        fund=next(p for p in body['tables'][0]['values'] if p['header']['value']==ISIN)
        fund['header']['value']=ISIN;fund['column_0']['value']='DEUTSCHE GLOBAL LIQUIDITY SERI'
        fund['column_1']['sortValue']=0.07;fund['column_5']['value']='Mutual Fund'
        proof=parse_liquidity_document(b'%PDF-fixture',ISIN,NOW,TEXT)
        full=parse_holdings(body,{},NOW,'https://etf.dws.com/source',complete=True,non_equity_funds={ISIN:proof})['completeHoldings']
        self.assertNotIn(ISIN,[r['isin'] for r in full['rows']])
        self.assertEqual(full['excludedPositions'][0]['weightPct'],0.07)
        self.assertEqual(full['excludedNonEquityFundWeightPct'],0.07)
        self.assertEqual(full['rows'][0]['weightPct'],body['tables'][0]['values'][0]['column_1']['sortValue'])
        self.assertIn(proof['sourceUrl'],full['sourceUrls'])
        fund['column_5']['value']='Equities'
        corrected=parse_holdings(body,{},NOW,'https://etf.dws.com/source',complete=True,non_equity_funds={ISIN:proof})['completeHoldings']
        self.assertNotIn(ISIN,[r['isin'] for r in corrected['rows']])
        with self.assertRaises(ValueError):parse_holdings(body,{},NOW,'https://etf.dws.com/source',complete=True)
        with self.assertRaises(ValueError):parse_holdings(body,{},NOW,'https://etf.dws.com/source',complete=True,non_equity_funds={ISIN:{**proof,'isin':'IE00BZ3FDF20'}})

if __name__=='__main__':unittest.main()
