import copy,datetime as dt,gzip,hashlib,json,subprocess,unittest
from pathlib import Path
from unittest.mock import patch
import dws_liquidity_funds as held
from collect_dws_etf import parse_holdings
FIX=Path(__file__).parent/'fixtures/dws-held-funds-20261112'
NOW=dt.datetime(2026,11,12,tzinfo=dt.timezone.utc)
ROOT_ISIN='IE000L6ZMMC4'
def raw(name):return gzip.decompress((FIX/(name+'.gz')).read_bytes())
def proofs():
    return {**{i:held.parse_liquidity_document(raw(n),i,NOW)for i,n in [('IE00BZ3FDG37','sterling-z-kid.pdf'),('IE00BZ3FDF20','euro-z-kid.pdf')]},'LU0514695187':held.parse_held_equity_fund(raw('india-etf-product.json').decode(),'LU0514695187',NOW)}
def parsed(body=None,qualified=None):
    return parse_holdings(body if body is not None else json.loads(raw('all-world-holdings.json')),{},NOW,'https://etf.dws.com/api/pdp/en-gb/etf/'+ROOT_ISIN+'/holdings',complete=True,non_equity_funds=proofs()if qualified is None else qualified)['completeHoldings']
class HeldFunds(unittest.TestCase):
    def test_real_pdfs_and_exact_share_metadata_keep_own_dates_and_currencies(self):
        provenance=json.loads((FIX/'provenance.json').read_text())
        for name,meta in provenance['files'].items():self.assertEqual(hashlib.sha256(raw(name)).hexdigest(),meta['sha256'])
        p=proofs();self.assertEqual(p['IE00BZ3FDG37']['currency'],'GBP');self.assertEqual(p['IE00BZ3FDF20']['currency'],'EUR')
        self.assertEqual(p['IE00BZ3FDG37']['asOf'],'2026-02-16')
        self.assertEqual(p['LU0514695187']['kind'],'non-transparised-equity-fund')
        self.assertNotEqual(p['LU0514695187']['kind'],'non-equity-money-market-fund')
    def test_complete_native_book_keeps_units_outside_partial_company_perimeter(self):
        body=json.loads(raw('all-world-holdings.json'));original=copy.deepcopy(body);h=parsed(body)
        self.assertEqual(body,original);self.assertFalse(h['complete'])
        excluded={r['isin']:r for r in h['excludedPositions']}
        self.assertEqual(set(excluded),{'LU0514695187','IE00BZ3FDG37','IE00BZ3FDF20'})
        native={r['header']['value']:r for r in body['tables'][0]['values']}
        for row in h['rows']:self.assertEqual(row['weightPct'],native[row['isin']]['column_1']['sortValue'])
        for isin,row in excluded.items():self.assertEqual(row['weightPct'],native[isin]['column_1']['sortValue'])
        self.assertEqual(h['untransparisedEquityFundWeightPct'],1.60588225)
        self.assertAlmostEqual(h['excludedNonEquityFundWeightPct'],.10992713+.28255989)
        self.assertFalse(h['navReconciliation']['normalizationApplied'])
        self.assertEqual(h['navReconciliation']['sourceRowCount'],len(native))
        self.assertAlmostEqual(h['navReconciliation']['selectedWeightPct']+sum(h['navReconciliation']['excludedWeightPctByType'].values()),h['navReconciliation']['publishedNetWeightPct'])
        india=next(r for r in h['navReconciliation']['qualifiedExcludedPositions']if r['isin']=='LU0514695187')
        self.assertEqual(india['sourceAssetClass'],'Equities')
        self.assertEqual(h,parsed(body))
    def test_unknown_funds_missing_proof_and_wrong_money_market_attribution_fail_closed(self):
        for key in proofs():
            p=proofs();p.pop(key)
            with self.subTest(key=key),self.assertRaises(ValueError):parsed(qualified=p)
        p=proofs();p['LU0514695187']['kind']='non-equity-money-market-fund'
        with self.assertRaises(ValueError):parsed(qualified=p)
        body=json.loads(raw('all-world-holdings.json'));row=next(r for r in body['tables'][0]['values']if r['header']['value']=='LU0514695187');row['column_5']['value']='Cash'
        with self.assertRaises(ValueError):parsed(body)
    def test_exact_equity_fund_class_currency_and_replication_required(self):
        original=json.loads(raw('india-etf-product.json'))
        for key,value in [('ISIN','IE00BZ3FDG37'),('Share class currency','GBP'),('Investment methodology','Direct Replication (physically)'),('Exchange traded fund / Non-exchange traded fund','Non-exchange traded fund')]:
            b=copy.deepcopy(original)
            from collect_dws_etf import items
            item=next(r for r in items(b['pdpResult']['pageSections']['keyFacts'])if r['key']==key);item['value']=value
            with self.subTest(key=key),self.assertRaises(ValueError):held.parse_held_equity_fund(json.dumps(b),'LU0514695187',NOW)
        with self.assertRaises((ValueError,KeyError)):held.parse_held_equity_fund('{}','LU0514695187',NOW)
    def test_failed_new_source_control_never_becomes_a_cache_success(self):
        with patch.dict(held._cache,{},clear=True):
            with patch.object(held,'get_text',return_value=raw('india-etf-product.json').decode())as get:
                first=held.qualify_held_fund('LU0514695187',NOW);self.assertEqual(held.qualify_held_fund('LU0514695187',NOW),first);self.assertEqual(get.call_count,1)
            previous=copy.deepcopy(held._cache)
            with patch.object(held,'get_text',side_effect=OSError('isolated outage')):
                with self.assertRaises(OSError):held.qualify_held_fund('LU0514695187',NOW+dt.timedelta(days=1))
            self.assertEqual(held._cache,previous)
    def test_actual_company_consumer_remains_partial_and_order_invariant(self):
        subprocess.run(['node','scripts/test-dws-held-fund-consumers.mjs'],check=True)
if __name__=='__main__':unittest.main()
