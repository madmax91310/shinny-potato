"""A same-share official-origin migration must preserve prices, units and scope."""
import copy
import datetime as dt
import gzip
import hashlib
import json
from pathlib import Path
import unittest
from collect_official_share_history import collect_one, configurations
from collect_product_calendars import abtc_calendar, issuer_json
from twentyone_shares_listing import URL, SECONDARY_URL, decode_document, listing_rows

ROOT=Path(__file__).resolve().parents[1]
FIX=ROOT/'scripts/fixtures/abtc-secondary-20261114'
NOW=dt.datetime(2026,11,14,14,40,tzinfo=dt.timezone.utc)

class SecondaryOrigin(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.provenance=json.loads((FIX/'provenance.json').read_text())
        cls.bodies={r['url']:gzip.decompress((FIX/r['fixture']).read_bytes())for r in cls.provenance['sources']}
        cls.source=next(r for r in configurations()if r['id']=='etfCH0454664001Nav')

    def record(self):
        fx=json.loads(gzip.decompress((FIX/'validated-monthly-fx.json.gz').read_bytes()))
        return collect_one(self.source,NOW,document_fetch=self.bodies.__getitem__,fx_data=fx,
            text_fetch=lambda *_:gzip.decompress((FIX/'current-ecb-90d.xml.gz').read_bytes()).decode())

    def test_real_wire_integrity_and_existing_split_calendar_oracle(self):
        for entry in self.provenance['sources']:
            self.assertEqual(hashlib.sha256(self.bodies[entry['url']]).hexdigest(),entry['sha256'])
            self.assertTrue(entry['url'].startswith('https://api.secondary.21shares.com/api/'))
        payloads=[issuer_json(self.bodies['https://api.secondary.21shares.com/api/'+name+'/ABTC'])for name in('product_details','product_valuation_history','product_performance_metrics')]
        result=abtc_calendar(*payloads,{'isin':'CH0454664001','currency':'USD'},NOW,self.source['sourceUrl'])
        self.assertEqual(result['years'],{'2020':277.89,'2021':65.02,'2022':-65.41,'2023':151.83,'2024':114.17,'2025':-4.71})
        self.assertNotIn('2019',result['years']);self.assertNotIn('2026',result['years'])

    def test_monthly_financial_values_identical_to_preserved_primary_and_idempotent(self):
        before=json.loads(gzip.decompress((FIX/'prior-qualified-primary-monthly.json.gz').read_bytes()))
        self.assertEqual(hashlib.sha256(gzip.decompress((FIX/'prior-qualified-primary-monthly.json.gz').read_bytes())).hexdigest(),self.provenance['priorQualifiedPrimaryMonthly']['sha256'])
        first=self.record();second=self.record()
        self.assertEqual(first['points'],before['points']);self.assertEqual(second['points'],first['points'])
        self.assertEqual(len(first['points']),92);self.assertEqual(first['points'][0][0],'2019-03');self.assertEqual(first['points'][-1][0],'2026-10')
        self.assertEqual(first['navCurrency'],'USD');self.assertEqual(first['currency'],'EUR')
        self.assertEqual(len(first['calendarProof']['checks']),6)
        self.assertIn('already reflected',first['calendarProof']['splitAdjustment'])

    def test_wrong_instrument_base_currency_and_double_split_still_refused(self):
        originals=[issuer_json(self.bodies['https://api.secondary.21shares.com/api/'+name+'/ABTC'])for name in('product_details','product_valuation_history','product_performance_metrics')]
        for defect in('isin','currency','double-split'):
            p,h,m=copy.deepcopy(originals)
            if defect=='isin':p['data']['details']['isin']='DE000A27Z304'
            if defect=='currency':p['data']['currency']['short_name']='EUR'
            if defect=='double-split':next(r for r in h['data']if r['valuation_date']=='2021-04-09')['nav_per_share']/=14
            with self.subTest(defect=defect),self.assertRaises(ValueError):abtc_calendar(p,h,m,{'isin':'CH0454664001','currency':'USD'},NOW,'secondary')

    def test_secondary_listing_is_exact_paris_eur_not_usd_nav(self):
        raw=self.bodies[SECONDARY_URL];body=decode_document(raw,SECONDARY_URL,SECONDARY_URL)
        source={'isin':'CH0454664001','listings':[{'ticker':'ABTC','mic':'XPAR','exchange':'Euronext Paris','currency':'EUR'}]}
        rows=listing_rows(body,source,SECONDARY_URL,'2026-11-14')
        self.assertEqual(len(rows),1);self.assertEqual(rows[0]['currency'],'EUR');self.assertEqual(rows[0]['mic'],'XPAR')
        self.assertNotIn('nav_per_unit',rows[0])
        for quote in('USD','GBP'):
            wrong=copy.deepcopy(source);wrong['listings'][0]['currency']=quote
            with self.assertRaises(ValueError):listing_rows(body,wrong,SECONDARY_URL,'2026-11-14')

    def test_redirect_and_unregistered_routes_remain_refused(self):
        raw=self.bodies[SECONDARY_URL]
        for requested,final in[(SECONDARY_URL,URL),(URL,SECONDARY_URL),(SECONDARY_URL,SECONDARY_URL+'?other=1'),(SECONDARY_URL.replace('https:','http:'),SECONDARY_URL),('https://api.secondary.21shares.com.evil.invalid/api/product_details/ABTC',SECONDARY_URL)]:
            with self.subTest(requested=requested,final=final),self.assertRaises(ValueError):decode_document(raw,requested,final)

    def test_all_live_nav_and_calendar_targets_agree_without_rewriting_legacy_evidence(self):
        sources=json.loads((ROOT/'scripts/additional-etf-sources.json').read_text())['instruments']
        share=next(r for r in sources if r['isin']=='CH0454664001')
        self.assertEqual(share['calendarApiBase'],'https://api.secondary.21shares.com');self.assertEqual(share['sourceUrl'],SECONDARY_URL)
        self.assertEqual(self.source['sourceUrl'],'https://api.secondary.21shares.com/api/product_valuation_history/ABTC')
        monthly=next(r for r in json.loads((ROOT/'scripts/monthly-automation.json').read_text())['series']if r['id']==self.source['id'])
        self.assertEqual(monthly['sourceUrl'],self.source['sourceUrl']);self.assertEqual(monthly['valuationBasis'],'fund-nav-total-return')
        metadata=next(r for r in json.loads((ROOT/'scripts/instrument-metadata-sources.json').read_text())['instruments']if r['isin']=='CH0454664001')
        self.assertIn(SECONDARY_URL,metadata['urls']);self.assertNotIn(URL,metadata['urls'])
        hosts=json.loads((ROOT/'scripts/listing-source-hosts.json').read_text())['hosts']
        self.assertIn('api.primary.21shares.com',hosts);self.assertIn('api.secondary.21shares.com',hosts)
        self.assertEqual(metadata['listings'][0]['sourceUrl'],URL) # Original dated evidence, not a fictional new consultation.

if __name__=='__main__':unittest.main()
