import copy,datetime as dt,gzip,json,unittest
from pathlib import Path
from unittest.mock import patch
from qualify_anniversary_price_units import qualify,probe_url
from refresh_monthly_history import collect_one
ROOT=Path(__file__).resolve().parents[1]
NOW=dt.datetime(2026,11,6,tzinfo=dt.timezone.utc)
class AnniversaryUnitReview(unittest.TestCase):
    def setUp(self):
        self.config=next(r for r in json.loads((ROOT/'scripts/monthly-automation.json').read_text())['series']if r['id']=='apple')
        self.body=json.loads(gzip.decompress((ROOT/'scripts/fixtures/investment-units-20261106/apple-action-probe.json.gz').read_bytes()))
        self.record={'points':[['2020-07',100],['2020-08',120],['2020-09',130]],'anniversaryPoints':[['2020-07',100],['2020-08',120],['2020-09',130]],'proofRows':[{'date':d,'value':v}for d,v in [('2020-07-31',100),('2020-08-31',120),('2020-09-30',130)]],'checkedAt':'2026-11-05','responseSha256':'original-price-hash','sourceUrls':['original-price-source'],'rawResponse':{}}
    def test_actual_declaration_withholds_only_unverified_quote_months(self):
        original=copy.deepcopy(self.record);r=qualify(self.config,self.record,NOW,probe=self.body)
        self.assertEqual(r['anniversaryExcludedMonths'],['2020-07'])
        for key in ['points','anniversaryPoints','checkedAt','responseSha256']:self.assertEqual(r[key],original[key])
        self.assertFalse(r['anniversaryPriceReview']['historicalQuoteValidation'])
        self.assertTrue(all(e['corporateActionValidation']=='provider-declaration-only'for e in r['anniversaryPriceReview']['events']))
        self.assertEqual(self.record,original)
        again=qualify(self.config,r,NOW,probe=self.body)
        self.assertEqual(again,r)
    def test_next_ordinary_collection_probes_current_month_actions(self):
        # OHLC collector stays on completed months; action probe reaches current day.
        url=probe_url(self.config,NOW);self.assertIn('period2='+str(int(NOW.timestamp())),url)
        with patch('refresh_monthly_history.collect_yahoo',return_value=self.record),patch('qualify_anniversary_price_units.get_json',return_value=self.body)as fetch:
            r=collect_one(self.config,NOW)
        fetch.assert_called_once_with(url);self.assertEqual(r['anniversaryExcludedMonths'],['2020-07'])
    def test_no_declaration_never_modifies_extreme_genuine_prices(self):
        body=copy.deepcopy(self.body);body['chart']['result'][0]['events']={}
        self.record['points'][1][1]=10000
        self.assertIs(qualify(self.config,self.record,NOW,probe=body),self.record)
    def test_invalid_identity_and_ratio_rejected(self):
        for key,value in [('symbol','MSFT'),('currency','EUR'),('dataGranularity','1d')]:
            body=copy.deepcopy(self.body);body['chart']['result'][0]['meta'][key]=value
            with self.assertRaises(ValueError):qualify(self.config,self.record,NOW,probe=body)
        body=copy.deepcopy(self.body);next(iter(body['chart']['result'][0]['events']['splits'].values()))['denominator']=0
        with self.assertRaises(ValueError):qualify(self.config,self.record,NOW,probe=body)
    def test_official_comparison_proof_does_not_certify_old_quote(self):
        body=copy.deepcopy(self.body);body['chart']['result'][0]['events']={}
        self.record['splitComparisonEvidence']={'exDate':'2020-08-31','ratio':25,'sourceUrl':'official','sha256':'hash'}
        r=qualify(self.config,self.record,NOW,probe=body)
        self.assertEqual(r['anniversaryExcludedMonths'],['2020-07'])
        self.assertEqual(r['anniversaryPriceReview']['events'][0]['corporateActionValidation'],'official-operation; historical-quote-unconfirmed')
    def test_independently_qualified_bank_quotes_are_preserved(self):
        self.record['splitAdjustmentEvidence']={'ratio':80}
        self.assertIs(qualify(self.config,self.record,NOW,fetch=lambda _:self.fail('Unnecessary probe')),self.record)
if __name__=='__main__':unittest.main()
