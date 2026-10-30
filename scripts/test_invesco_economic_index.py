import base64
import copy
import datetime as dt
import gzip
import json
from pathlib import Path
import unittest
from unittest.mock import patch
from invesco_economic_index import collect,contracts,digest,parse_capture,qualify_metadata,qualify_subject

FIX=json.loads(gzip.decompress((Path(__file__).with_name('fixtures')/'invesco-economic-index/public-index-books.json.gz').read_bytes()))['books']
NOW=dt.datetime(2026,10,30,18,tzinfo=dt.timezone.utc)

class EconomicIndex(unittest.TestCase):
    def parse(self,isin,fixture=None):
        f=fixture or FIX[isin]
        return parse_capture(f['capture'],json.dumps(f['metadata']).encode(),isin,NOW)

    def test_actual_public_books_are_distinct_economic_index_references(self):
        for isin,n,stamp,total in [('FR0011550193',600,'2026-10-20',100.0016),('FR0011871110',101,'2026-10-29',100.0001)]:
            h=self.parse(isin)
            self.assertEqual((h['basis'],h['scope'],len(h['rows']),h['asOf']),('index','equity-index',n,stamp))
            self.assertAlmostEqual(sum(r['weightPct']for r in h['rows']),total)
            self.assertEqual(h['rows'],FIX[isin]['qualifiedRecord']['rows'])
            self.assertFalse(h['coverageProof']['normalizationApplied'])

    def test_exact_metadata_rejects_neighbour_index_fund_or_share(self):
        for isin,f in FIX.items():
            _,index=contracts(isin)
            for path,value in [('replicationMethod','Physical'),('hedgedIndicator',True),('shareClassCurrency','GBP'),('shareClassFullName','Another fund')]:
                d=copy.deepcopy(f['metadata']);d[path]=value
                with self.subTest(isin=isin,path=path),self.assertRaises(ValueError):qualify_metadata(json.dumps(d),index,NOW)
            for key,value in [('benchmarkFullName','EURO STOXX 50'),('indexBloombergTicker','NDX'),('indexRic','.XNDX'),('baseCurrency','EUR'if index['currency']=='USD'else'USD')]:
                d=copy.deepcopy(f['metadata']);d['benchmarkRelationships'][0][key]=value
                with self.subTest(isin=isin,key=key),self.assertRaises(ValueError):qualify_metadata(json.dumps(d),index,NOW)

    def test_top_ten_fund_basket_and_incompatible_page_proof_refused(self):
        isin='FR0011550193'
        for key,value in [('publisherRowCount',10),('economicExposurePublished',False),('separateSubstituteBasketPublished',False),('sourceUrl','https://issuer.example/holdings/fund'),('pageTitle','Another share'),('pageUrl','https://issuer.example/')]:
            f=copy.deepcopy(FIX[isin]);f['capture'][key]=value
            with self.subTest(key=key),self.assertRaises(ValueError):self.parse(isin,f)
        f=copy.deepcopy(FIX[isin]);f['capture']['widget']['variationType']='fund'
        with self.assertRaises(ValueError):self.parse(isin,f)
        for mutate in [lambda d:d.update(numberOfHoldings=600),lambda d:d.update(holdings=d['holdings'][:10]),lambda d:d.update(effectiveDate='2026-10-31'),lambda d:d['holdings'].__setitem__(1,d['holdings'][0]),lambda d:d['holdings'][0].update(isin=None),lambda d:d['holdings'][0].update(weight=-1),lambda d:d['holdings'][0].update(weight=20)]:
            f=copy.deepcopy(FIX[isin]);payload=json.loads(base64.b64decode(f['capture']['bodyBase64']));mutate(payload)
            raw=json.dumps(payload).encode();f['capture'].update(bodyBase64=base64.b64encode(raw).decode(),sourceSha256=digest(raw))
            with self.assertRaises(ValueError):self.parse(isin,f)

    def test_target_benchmark_not_borrowed_from_another_etf(self):
        isin='FR0011871110';text=FIX[isin]['subjectText']
        with patch('invesco_economic_index.pdf_text',return_value=text):
            self.assertEqual(qualify_subject(isin,NOW,lambda _:b'pdf')[2],'2026-09-30')
        for bad in [text.replace(isin,'FR0013412269'),text.replace('100% NASDAQ 100 NOTIONAL NET TOTAL RETURN','100% NASDAQ 100'),text.replace('Synthétique','Physique')]:
            with patch('invesco_economic_index.pdf_text',return_value=bad),self.assertRaises(ValueError):qualify_subject(isin,NOW,lambda _:b'pdf')

    def test_failure_propagates_and_stale_subject_proof_never_admitted(self):
        isin='FR0011871110';f=FIX[isin];raw=b'pdf'
        with patch('invesco_economic_index.qualify_subject',return_value=(raw,contracts(isin)[0]['shareDocumentBase'],'2026-01-01',None)),self.assertRaisesRegex(ValueError,'stale'):
            collect({'isin':isin,'currency':'EUR'},NOW,lambda _:b'{}',f['capture'])
        with patch('invesco_economic_index.qualify_subject',side_effect=ConnectionError('Issuer unavailable')),self.assertRaises(ConnectionError):
            collect({'isin':isin,'currency':'EUR'},NOW)

if __name__=='__main__':unittest.main()
