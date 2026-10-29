import copy
import datetime as dt
import json
import unittest
from pathlib import Path
from collect_exposure_expansion import qualify, qualify_refresh
from collect_dws_etf import parse_holdings
from collect_invesco_allocations import parse_allocations

class Expansion(unittest.TestCase):
    def test_panx_exact_index_not_collateral_or_nasdaq(self):
        from collect_amundi_index_exposure import parse_product
        config=json.loads((Path(__file__).parent/'exposure-etf-expansion.json').read_text())
        share=next(s for s in config['instruments'] if s['isin']=='FR0013412269')
        product=json.loads((Path(__file__).parent/'fixtures/official-documents/amundi-panx-index.json').read_text())['products'][0]
        now=dt.datetime(2026,10,29,tzinfo=dt.timezone.utc)
        result=parse_product(product,share,now)
        self.assertEqual(result['holdings']['basis'],'index')
        self.assertFalse(result['holdings'].get('complete',False))
        self.assertEqual(len(result['holdings']['rows']),10)
        self.assertTrue(all(r['isin'] for r in result['holdings']['rows']))
        for field in ('countries','sectors','holdings'):
            self.assertEqual(result[field]['asOf'],'2026-10-27')
        for key,value in [('ISIN','FR0011871110'),('BENCHMARK_NAME','NASDAQ 100'),('FUND_REPLICATION_METHODOLOGY','Direct(Physical)')]:
            changed=copy.deepcopy(product);changed['characteristics'][key]=value
            with self.assertRaises(ValueError):parse_product(changed,share,now)

    def test_german_other_is_explicit_and_keeps_raw_weights_and_dates(self):
        from collect_ishares_german import normalize
        body={'productId':251931,'currencyCode':'EUR','componentsByNameMap':{
            'keyFundFacts':{'containersByNameMap':{'default':{'dataPointsByNameMap':{
                'isin':{'value':'DE0002635307'},'useOfProfitsCode':{'value':'ausschüttend'}}}}},
            'exposureBreakdowns':{'containersByNameMap':{
                'sector':{'asOfDate':20261028,'dataPointsByNameMap':{
                    'type':{'value':['Industrie','Sonstige']},'weight':{'value':[17.23,0.01]}}},
                'geography':{'subContainersByNameMap':{'countries':{'dataPointsByNameMap':{
                    'type':{'value':['Deutschland']},'weight':{'value':[12.34]}}}}}}},
            'holdings':{'containersByNameMap':{'all':{'dataPointsByNameMap':{
                'countryOfRisk':{'value':['Deutschland']},'assetClass':{'value':['Aktien']}}}}}}}
        original=copy.deepcopy(body)
        result=normalize(body)
        sector=result['componentsByNameMap']['exposureBreakdowns']['containersByNameMap']['sector']
        self.assertEqual(sector['dataPointsByNameMap']['type']['value'],['Industrials','Other'])
        self.assertEqual(sector['dataPointsByNameMap']['weight']['value'],[17.23,0.01])
        self.assertEqual(sector['asOfDate'],20261028)
        self.assertEqual(body,original,'Issuer proof is never rewritten')
        body['componentsByNameMap']['exposureBreakdowns']['containersByNameMap']['sector']['dataPointsByNameMap']['type']['value']=['New unknown sector']
        with self.assertRaises(KeyError):normalize(body)
        body=copy.deepcopy(original);body['productId']=123
        with self.assertRaises(ValueError):normalize(body)

    def test_wrong_share_and_incomplete_exposure_rejected(self):
        s={'isin':'IE00B3RBWM25'}
        with self.assertRaises(ValueError):qualify({'isin':'IE00BK5BQT80'},s)
        with self.assertRaises(ValueError):qualify(s,s)
        value={**s,'countries':{'asOf':'2026-09-30','rows':[{'name':'France','weightPct':20}]},'sectors':{'asOf':'2026-09-30','rows':[{'name':'Technology','weightPct':100}]}}
        with self.assertRaises(ValueError):qualify(value,s)
    def test_partial_pdf_preserves_full_country_date_and_rejects_stale(self):
        now=dt.datetime(2026,10,16,tzinfo=dt.timezone.utc)
        share={'isin':'IE00BKLF1R75','parser':'wisdomtree-html'}
        result={'isin':share['isin'],'sectors':{'asOf':'2026-08-31','rows':[{'name':'Industrials','weightPct':100}]},
                'unavailable':['countries: PDF publishes only ten countries; complete previous allocation preserved']}
        previous={'countries':{'asOf':'2026-10-15','rows':[{'name':'France','weightPct':100}],
                              'sourceUrl':'https://www.wisdomtree.com/gb/products','sha256':'evidence'}}
        before=copy.deepcopy(previous)
        self.assertEqual(qualify_refresh(result,share,previous,now)[0]['asOf'],'2026-10-15')
        self.assertEqual(previous,before)
        self.assertNotIn('countries',result)
        previous['countries']['asOf']='2025-10-15'
        with self.assertRaises(ValueError):qualify_refresh(result,share,previous,now)
        with self.assertRaises(ValueError):qualify_refresh(result,share,{},now)

    def test_invesco_wrong_document_rejected(self):
        with self.assertRaises(ValueError):
            parse_allocations('IE000L2SA8K5 Replication method Physical',{'isin':'IE000716YHJ7'},dt.datetime.now(dt.timezone.utc))
    def test_warrants_not_relabelled_as_underlying_equity_sector(self):
        body=json.loads((Path(__file__).parent/'fixtures/official-documents/dws-physical-holdings.json').read_text())
        p=next(p for p in body['tables'][0]['values'] if p['column_1']['sortValue']>0)
        baseline=parse_holdings(body,{'isin':'IE00BM67HK77'},dt.datetime(2026,10,16,tzinfo=dt.timezone.utc),'https://etf.dws.com/holdings')
        old=sum(r['weightPct'] for r in baseline['sectors']['rows'] if r['name']=='Unassigned')
        p['column_5']['value']='Warrants'
        r=parse_holdings(body,{'isin':'IE00BM67HK77'},dt.datetime(2026,10,16,tzinfo=dt.timezone.utc),'https://etf.dws.com/holdings')
        self.assertTrue(any(x['name']=='Unassigned' and abs(x['weightPct']-old-p['column_1']['sortValue'])<1e-5 for x in r['sectors']['rows']))
        p['column_1']['sortValue']=-1
        with self.assertRaises(ValueError):parse_holdings(body,{'isin':'IE00BM67HK77'},dt.datetime(2026,10,16,tzinfo=dt.timezone.utc),'https://etf.dws.com/holdings')

if __name__=='__main__':unittest.main()

class InvescoHoldings(unittest.TestCase):
 def test_exact_physical_top_ten_retains_weight_and_wrapped_identity(self):
  from collect_invesco_allocations import parse_top_holdings
  share={'isin':'IE000716YHJ7','sourceUrl':'https://www.invesco.com/exact-share.pdf'}
  text=share['isin']+'\nReplication method Physical\n'+(Path(__file__).parent/'fixtures/official-documents/invesco-allworld-allocations.txt').read_text()
  result=parse_top_holdings(text,share,dt.datetime(2026,10,18,tzinfo=dt.timezone.utc))
  self.assertEqual(len(result['rows']),10)
  self.assertAlmostEqual(sum(r['weightPct'] for r in result['rows']),24.73)
  self.assertEqual(result['rows'][5]['name'],'TAIWAN SEMICONDUCTOR MANUFAC TWD10')
  for changed in [text.replace('Weight','Value'),text.replace('5.02','-5.02'),text.replace('30 Sep 2026','30 Sep 2027'),text.replace(share['isin'],'OTHER')]:
   with self.assertRaises(ValueError):parse_top_holdings(changed,share,dt.datetime(2026,10,18,tzinfo=dt.timezone.utc))
