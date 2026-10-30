import copy
import datetime as dt
import json
from pathlib import Path
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from apply_etf_collection import merge_collection
from collect_document_etf import collect_one
from collect_product_calendars import collect_abtc_product_fields, abtc_calendar
from data_automation import UTC

FIX=Path(__file__).parent/'fixtures/official-documents/product-calendars'
CONFIG=json.loads((Path(__file__).parent/'additional-etf-sources.json').read_text())
SHARE=next(x for x in CONFIG['instruments']if x['isin']=='CH0454664001')
NOW=dt.datetime(2026,10,30,23,30,tzinfo=UTC)

class AbtcProductFields(unittest.TestCase):
    def live(self):return json.loads((FIX/'abtc-product-live-20261030.json').read_text())
    def observation(self,product=None):
        product=product if product is not None else self.live()
        with patch('collect_product_calendars.download',return_value=json.dumps(product).encode()),patch('collect_product_calendars.collect_abtc_calendar',side_effect=HTTPError('api',503,'temporary failure',None,None)):
            return collect_one(SHARE,NOW)

    def test_real_official_product_aum_fee_units_and_dates(self):
        r=self.observation()
        self.assertEqual(r['aum']['amount'],618385969.835628)
        self.assertEqual(r['aum']['currency'],'USD');self.assertEqual(r['aum']['scope'],'share-class')
        self.assertEqual(r['aum']['asOf'],'2026-10-30') # Not future effective_date2026-11-02.
        self.assertEqual(r['characteristics']['terPct'],1.49)
        self.assertNotIn('asOf',r['characteristics']) # NAV date is not the fee effective date.
        self.assertEqual(r['sourceUrl'],'https://api.primary.21shares.com/api/product_details/ABTC')
        self.assertNotIn('performance',r)
        self.assertEqual([x['field']for x in r['collectionErrors']],['performance'])

    def test_other_dated_characteristics_and_history_preserved_after_partial_failure(self):
        r=self.observation();old={'currency':'USD','productId':SHARE['isin'],'provider':'21Shares','sourceUrl':SHARE['sourceUrl'],
            'characteristics':{'terPct':1.49,'index':'Old exact reference','checkedAt':'2026-10-06'},
            'characteristicChecks':{'index':{'checkedAt':'2026-10-06','sourceUrl':'old-document','asOf':'2026-09-30'}},
            'performance':{'years':{'2025':-4.71},'checkedAt':'2026-10-06','currency':'USD','basis':'fund','asOf':'2026-10-06'}}
        baseline=copy.deepcopy(old)
        merged=merge_collection({'checkedAt':NOW.isoformat(),'shares':[r]},{SHARE['isin']:old},{})[SHARE['isin']]
        self.assertEqual(old,baseline)
        self.assertEqual(merged['performance'],old['performance'])
        self.assertEqual(merged['characteristicChecks']['index'],old['characteristicChecks']['index'])
        self.assertEqual(merged['characteristicChecks']['terPct']['checkedAt'],'2026-10-30')
        self.assertEqual(merged['aum']['asOf'],'2026-10-30')

    def test_invalid_fields_do_not_suppress_independently_valid_fields(self):
        for field,value in [('total_nav',None),('total_nav',True),('total_nav',float('nan')),('total_nav',-1)]:
            p=self.live();p['data'][field]=value;r=self.observation(p)
            self.assertNotIn('aum',r);self.assertEqual(r['characteristics']['terPct'],1.49)
            self.assertIn('aum',[x['field']for x in r['collectionErrors']])
        for value in [None,True,float('inf'),1.49,-.01]:
            p=self.live();p['data']['details']['annual_fee']=value;r=self.observation(p)
            self.assertNotIn('characteristics',r);self.assertTrue(r['exposureOnly']);self.assertIn('aum',r)
            self.assertIn('characteristics',[x['field']for x in r['collectionErrors']])

    def test_identity_currency_and_stale_product_fail_closed(self):
        for defect in ['isin','ticker','currency','date','future','unsuccessful','lastUpdated']:
            p=self.live()
            if defect=='isin':p['data']['details']['isin']='CH1199067674'
            if defect=='ticker':p['data']['ticker']='BTC'
            if defect=='currency':p['data']['currency']['short_name']='EUR'
            if defect=='date':p['data']['valuation_date']='2026-09-30'
            if defect=='future':p['data']['valuation_date']='2026-11-02'
            if defect=='unsuccessful':p['success']=False
            if defect=='lastUpdated':p['lastUpdated']='2026-09-30T00:00:00Z'
            with self.subTest(defect=defect),self.assertRaises((ValueError,TypeError)):self.observation(p)

    def test_single_product_request_and_existing_split_oracle_without_pdf(self):
        payloads=[json.loads((FIX/('abtc-'+name+'.json')).read_text())for name in ['product_details','history','product_performance_metrics']]
        now=dt.datetime(2026,10,7,tzinfo=UTC);by={name:body for name,body in zip(['product_details','product_valuation_history','product_performance_metrics'],payloads)};calls=[]
        def fetch(url,**kwargs):calls.append(url);return json.dumps(by[url.split('/')[-2]]).encode()
        with patch('collect_product_calendars.download',side_effect=fetch),patch('collect_document_etf.download',side_effect=AssertionError('Gone PDF must not be used')):
            r=collect_one(SHARE,now)
        self.assertEqual(len(calls),3);self.assertEqual(len(set(calls)),3)
        self.assertEqual(r['performance']['years'],abtc_calendar(*payloads,SHARE,now,'reference')['years'])
        self.assertEqual(r['collectionErrors'],[])

    def test_shared_validator_changes_trigger_both_ordinary_consumers(self):
        root=Path(__file__).resolve().parents[1]
        for filename in ['collect-etf-pilot.yml','update-publication-observations.yml']:
            text=(root/'.github/workflows'/filename).read_text()
            push=text.split('  push:',1)[1].split('  pull_request:',1)[0]
            pull=text.split('  pull_request:',1)[1].split('permissions:',1)[0]
            for scope in [push,pull]:self.assertIn("'scripts/collect_product_calendars.py'",scope)
        issuer=(root/'.github/workflows/collect-etf-pilot.yml').read_text()
        self.assertIn("python -m unittest discover -s scripts -p 'test_abtc_product_fields.py'",issuer)

    def test_network_failure_never_turns_into_a_source_success(self):
        with patch('collect_product_calendars.download',side_effect=HTTPError('api',503,'failed',None,None)),self.assertRaises(HTTPError):collect_one(SHARE,NOW)
        with patch('collect_product_calendars.download',return_value=b'{}'),self.assertRaises(ValueError):collect_one(SHARE,NOW)

if __name__=='__main__':unittest.main()
