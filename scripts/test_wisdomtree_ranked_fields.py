"""Real issuer-capture replay; this suite is not a live supplier certification."""
import copy
import datetime as dt
import gzip
import json
from pathlib import Path
import unittest
import urllib.error
from unittest.mock import patch
from wisdomtree_ranked_fields import parse_fields, augment_document
from wisdomtree_api_holdings import CLASS_CONFIG

NOW = dt.datetime(2026, 10, 29, tzinfo=dt.timezone.utc)
FIXTURES = Path(__file__).with_name('fixtures') / 'wisdomtree-complete'


class RankedFields(unittest.TestCase):
    ISIN = 'IE00BJGWQN72'
    def payload(self, isin=None):
        return json.loads(gzip.decompress((FIXTURES / ((isin or self.ISIN) + '.rankings.json.gz')).read_bytes()))
    def share(self, isin=None):
        isin = isin or self.ISIN
        return {'isin': isin, 'currency': CLASS_CONFIG[isin]['currency'], 'factsheetUrl': 'https://dataspanapi.wisdomtree.com/pdr/documents/FACTSHEET/UCITS/EU/EN-GB/' + isin}
    def acquire(self, payload=None):
        payload = payload if payload is not None else self.payload()
        return lambda *_: (json.dumps(payload).encode(), 'https://dataspanapi.wisdomtree.com/funddetails/rankings/?ticker=WCLD%20LN',
                           {'identitySourceUrl': self.share()['factsheetUrl'], 'identitySha256': 'a'*64, 'identityAsOf':'2026-09-30'},
                           {'ticker': payload[0]['ticker']}, [])
    def test_six_exact_shares_original_percentages_and_separate_dates(self):
        for isin in CLASS_CONFIG:
            with self.subTest(isin=isin):
                data = self.payload(isin)
                values, errors = parse_fields(data, self.share(isin), NOW, data[0]['ticker'])
                self.assertEqual(errors, [])
                self.assertEqual(set(values), {'holdings', 'sectors'})
                self.assertEqual(len(values['holdings']['rows']), 10)
                self.assertLess(sum(r['weightPct'] for r in values['holdings']['rows']), 100)
                self.assertEqual(values['holdings']['scope'], 'top-10')
                self.assertNotIn('complete', values['holdings'])
                self.assertEqual(values['sectors']['rankClassificationID'], 2)
                self.assertEqual(values['sectors']['rows'], [{'name': r['name'], 'weightPct': r['pct']*100} for r in data if r['rankClassificationID']==2])
                self.assertEqual(values['holdings']['asOf'], '2026-10-23')
    def test_wrong_share_ticker_currency_and_mixed_identity_fail(self):
        for change in ({'wtID':1}, {'ticker':'OTHER LN'}, {'entityName':'Other share'}):
            data=self.payload(); data[-1].update(change)
            with self.assertRaises(ValueError): parse_fields(data,self.share(),NOW,data[0]['ticker'])
        with self.assertRaises(ValueError): parse_fields(self.payload(),{**self.share(),'currency':'EUR'},NOW,self.payload()[0]['ticker'])
    def test_sector_failure_does_not_erase_the_top_ten(self):
        for change in ({'pct': float('nan')}, {'pct':True}, {'name':'Unknown'}, {'dt':'2026-11-30T00:00:00Z'}, {'rankClassification':'Index'}):
            data=self.payload(); next(r for r in data if r['rankClassificationID']==2).update(change)
            values,errors=parse_fields(data,self.share(),NOW,data[0]['ticker'])
            self.assertEqual(set(values), {'holdings'}); self.assertEqual([e['field'] for e in errors], ['sectors'])
    def test_partial_fund_ranking_keeps_the_independent_sector_table(self):
        data=self.payload(); data=[r for r in data if r['rankClassificationID']!=1 or r['ranking']<=9]
        values,errors=parse_fields(data,self.share(),NOW,data[0]['ticker'])
        self.assertEqual(set(values), {'sectors'}); self.assertEqual([e['field'] for e in errors], ['holdings'])
    def test_issuer_row_order_does_not_change_top_ten(self):
        data=self.payload();expected=parse_fields(data,self.share(),NOW,data[0]['ticker'])[0]
        self.assertEqual(expected['holdings'],parse_fields(list(reversed(data)),self.share(),NOW,data[0]['ticker'])[0]['holdings'])
    def test_newer_api_only_updates_two_fields_not_countries_aum_or_fees(self):
        result={'countries':{'asOf':'2026-10-19','rows':[{'name':'US','weightPct':100}],'checkedAt':'2026-10-20'},
                'aum':{'amount':123,'checkedAt':'2026-10-20'},'characteristics':{'terPct':.4,'asOf':'2026-09-30'},
                'holdings':{'asOf':'2026-09-30','rows':[]}, 'sectors':{'asOf':'2026-09-30','rows':[]}}
        before=copy.deepcopy(result);out=augment_document(result,self.share(),NOW,b'actual PDF in this attempt',self.acquire())
        for field in ('countries','aum','characteristics'):self.assertEqual(out[field],before[field])
        for field in ('holdings','sectors'):
            self.assertEqual(out[field]['asOf'],'2026-10-23');self.assertNotIn('checkedAt',out[field])
            self.assertEqual(out[field]['identityAsOf'],'2026-09-30')
        self.assertEqual(out['sourceAttempts'][-1]['fields'],['holdings','sectors'])
    def test_network_failure_preserves_all_values_and_dates_with_two_explicit_failures(self):
        result={'sectors':{'asOf':'2026-10-25','rows':[{'name':'Technology','weightPct':100}],'checkedAt':'2026-10-26'}}
        before=copy.deepcopy(result)
        def fail(*_):raise OSError('network unavailable')
        out=augment_document(result,self.share(),NOW,b'document',fail)
        self.assertEqual(out['sectors'],before['sectors']);self.assertEqual({e['field']for e in out['collectionErrors']},{'holdings','sectors'})
    def test_equal_dates_with_different_values_are_quarantined_without_arbitration(self):
        values,_=parse_fields(self.payload(),self.share(),NOW,self.payload()[0]['ticker'])
        result=copy.deepcopy(values); result['sectors']['rows'][0]['weightPct']-=1
        out=augment_document(result,self.share(),NOW,b'document',self.acquire())
        self.assertNotIn('sectors',out);self.assertEqual(out['holdings'],values['holdings'])
        self.assertEqual([e['field']for e in out['collectionErrors']],['sectors'])
        self.assertEqual(out['sourceAttempts'][-1]['fields'],[])
    def test_older_api_does_not_overwrite_or_renew_a_newer_primary(self):
        values,_=parse_fields(self.payload(),self.share(),NOW,self.payload()[0]['ticker'])
        result=copy.deepcopy(values)
        for value in result.values():value.update(asOf='2026-10-25',checkedAt='2026-10-26')
        before=copy.deepcopy(result);out=augment_document(result,self.share(),NOW,b'document',self.acquire())
        for field in before:self.assertEqual(out[field],before[field])
        self.assertEqual(out['sourceAttempts'][-1]['fields'],[])
        self.assertEqual(len(out['sourceAttempts'][-1]['deferred']),2)
    def test_ordinary_product_page_failure_uses_document_and_two_qualified_api_fields(self):
        from collect_public_issuer import collect_one
        document={'isin':self.ISIN,'countries':{'asOf':'2026-09-30','rows':[{'name':'US','weightPct':100}]},
                  'sectors':{'asOf':'2026-09-30','rows':[]},'holdings':{'asOf':'2026-09-30','rows':[]}}
        share={**self.share(),'parser':'wisdomtree-html','sourceUrl':'https://www.wisdomtree.com/gb/products/equities/wisdomtree-cloud-computing-ucits-etf---usd-acc'}
        with patch('collect_public_issuer.get_text',side_effect=urllib.error.URLError('HTTP 403')), patch('collect_public_issuer.download',return_value=b'PDF acquired in this attempt'), patch('collect_public_issuer.wisdomtree_factsheet',return_value=copy.deepcopy(document)), patch('wisdomtree_ranked_fields.augment_document',side_effect=lambda result,share,now,body:augment_document(result,share,now,body,self.acquire())):
            result=collect_one(share,NOW)
        self.assertEqual(result['countries'],document['countries'])
        self.assertEqual(result['sectors']['asOf'],'2026-10-23')
        self.assertEqual(result['holdings']['asOf'],'2026-10-23')
        self.assertIn('403',result['sourceAttempts'][0]['reason'])
        self.assertEqual(result['sourceAttempts'][-1]['fields'],['holdings','sectors'])


if __name__ == '__main__': unittest.main()
