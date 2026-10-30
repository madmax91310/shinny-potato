import base64
import copy
import datetime as dt
import gzip
import json
from pathlib import Path
import unittest
from unittest.mock import patch
from unittest.mock import Mock
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

MSCI=json.loads(gzip.decompress((Path(__file__).with_name('fixtures')/'invesco-economic-index/msci-index-books.json.gz').read_bytes()))['books']

class MsciEconomicIndex(unittest.TestCase):
    def test_real_september_table_date_and_original_weights(self):
        for isin,f in MSCI.items():
            h=parse_capture(f['capture'],json.dumps(f['metadata']).encode(),isin,NOW)
            self.assertEqual(h['asOf'],'2026-09-15')
            self.assertEqual(h['rows'],f['qualifiedRecord']['rows'])
            self.assertIn('15-Sept-26',f['capture']['tableText'])
            bad=copy.deepcopy(f['capture']);bad['tableText']=bad['tableText'].replace('15-Sept-26','16-Sept-26');bad['tableTextSha256']=digest(bad['tableText'])
            with self.assertRaises(ValueError):parse_capture(bad,json.dumps(f['metadata']).encode(),isin,NOW)

    def test_exact_subject_documents_and_rejection_of_changed_variants(self):
        for isin,f in MSCI.items():
            def extract(raw,rectangle=None):
                return f['subjectRightText'] if rectangle==(300,300) else f['subjectLeftText'] if rectangle==(0,300) else f['subjectText']
            with patch('invesco_economic_index.pdf_text',side_effect=extract),patch('collect_amundi_index_exposure.pdf_text',side_effect=extract):
                self.assertEqual(qualify_subject(isin,NOW,lambda _:b'pdf')[2],'2026-09-30')
            share,_=contracts(isin)
            for old,new in [(isin,'FR0013412269'),(share['shareBenchmarkLabel'],share['shareBenchmarkLabel']+' ESG'),(share['objectiveTokens'][0],'changed benchmark convention')]:
                if old not in f['subjectText']:continue
                def changed(raw,rectangle=None):return extract(raw,rectangle).replace(old,new)
                with self.subTest(isin=isin,old=old),patch('invesco_economic_index.pdf_text',side_effect=changed),patch('collect_amundi_index_exposure.pdf_text',side_effect=changed),self.assertRaises(ValueError):
                    qualify_subject(isin,NOW,lambda _:b'pdf')

    def test_index_acquisition_is_shared_within_the_source_cycle(self):
        from invesco_economic_index import acquire_index
        from concurrent.futures import ThreadPoolExecutor
        f=MSCI['FR001400U5Q4'];fetch=Mock(return_value=json.dumps(f['metadata']).encode())
        result=Mock(returncode=0,stdout=json.dumps(f['capture']))
        with patch('invesco_economic_index.subprocess.run',return_value=result)as browser:
            with ThreadPoolExecutor(max_workers=4)as pool:
                records=list(pool.map(lambda _:acquire_index('msci-world-net',NOW,fetch),range(4)))
            self.assertEqual(fetch.call_count,1);self.assertEqual(browser.call_count,1)
            self.assertTrue(all(r==records[0]for r in records))
            acquire_index('msci-world-net',NOW+dt.timedelta(seconds=1),fetch)
            self.assertEqual(fetch.call_count,2,'Another actual collection cycle must contact the source again')

    def test_one_source_failure_is_shared_but_other_index_and_next_cycle_recover(self):
        from invesco_economic_index import acquire_index
        from concurrent.futures import ThreadPoolExecutor
        fail=[True];calls={}
        world=contracts('FR001400U5Q4')[1]['metadataSourceUrl']
        def fetch(url):
            calls[url]=calls.get(url,0)+1
            if url==world and fail[0]:raise ConnectionError('One publisher source unavailable')
            f=MSCI['FR001400U5Q4']if url==world else MSCI['FR0013412038']
            return json.dumps(f['metadata']).encode()
        def attempt(_):
            try:acquire_index('msci-world-net',NOW,fetch)
            except ConnectionError:return 'retained, not refreshed'
        with patch('invesco_economic_index.subprocess.run',return_value=Mock(returncode=0,stdout=json.dumps(MSCI['FR0013412038']['capture']))):
            with ThreadPoolExecutor(max_workers=4)as pool:self.assertEqual(list(pool.map(attempt,range(4))),['retained, not refreshed']*4)
            self.assertEqual(calls[world],1)
            self.assertIsInstance(acquire_index('msci-europe-net',NOW,fetch),tuple)
            fail[0]=False
            with self.assertRaises(ConnectionError):acquire_index('msci-world-net',NOW,fetch)
            self.assertIsInstance(acquire_index('msci-world-net',NOW+dt.timedelta(seconds=1),fetch),tuple)
            self.assertEqual(calls[world],2)

    def test_currency_method_fails_closed_on_changed_document(self):
        from invesco_economic_index import currency_method
        with self.assertRaisesRegex(ValueError,'requires qualification'):
            currency_method('msci-world-net',NOW,lambda _:b'changed methodology')
        with self.assertRaises(ConnectionError):
            currency_method('msci-world-net',NOW,Mock(side_effect=ConnectionError('Official method unavailable')))


EXTRA=json.loads(gzip.decompress((Path(__file__).with_name('fixtures')/'invesco-economic-index/additional-reference-shares.json.gz').read_bytes()))['books']

class PhysicalFundReferences(unittest.TestCase):
    def test_actual_references_never_claim_physical_fund_assets(self):
        for isin,f in EXTRA.items():
            h=f['qualifiedRecord']
            self.assertEqual(h['basis'],'index');self.assertTrue(h['approximation'])
            self.assertTrue(h['coverageProof']['referenceOnlyForSubject'])
            parsed=parse_capture(f['capture'],json.dumps(f['metadata']).encode(),isin,NOW)
            self.assertEqual(parsed['rows'],h['rows'])

    def test_exact_ubs_benchmark_document_and_no_rescue_for_changed_index(self):
        isin='IE00BD4TXV59';f=EXTRA[isin]
        def extract(body,rectangle=None,raw=False):return f['subjectRawText'] if raw else f['subjectText']
        with patch('invesco_economic_index.pdf_text',side_effect=extract):
            self.assertEqual(qualify_subject(isin,NOW,lambda *a,**kw:b'pdf')[2],'2026-09-30')
        with patch('invesco_economic_index.pdf_text',return_value=f['subjectText'].replace('MSCI World Total Return Net','MSCI World Total Return Gross')),self.assertRaises(ValueError):
            qualify_subject(isin,NOW,lambda *a,**kw:b'pdf')

    def test_bnp_physical_share_uses_its_own_net_nasdaq_document(self):
        isin='IE000QDFFK00';f=EXTRA[isin];url=f['qualifiedRecord']['shareSourceUrl']
        with patch('invesco_economic_index.pdf_text',return_value=f['subjectText']),patch('collect_bnp_etf.discover',return_value=(url,'2026-09-30')):
            self.assertEqual(qualify_subject(isin,NOW,lambda _:b'pdf')[2],'2026-09-30')
        with patch('invesco_economic_index.pdf_text',return_value=f['subjectText'].replace(isin,'FR0011871110')),patch('collect_bnp_etf.discover',return_value=(url,'2026-09-30')),self.assertRaises(ValueError):
            qualify_subject(isin,NOW,lambda _:b'pdf')


RUSSELL=json.loads(gzip.decompress((Path(__file__).with_name('fixtures')/'invesco-economic-index/russell-equity-reference.json.gz').read_bytes()))

class RussellEquityReference(unittest.TestCase):
    def test_original_equity_weights_and_exact_net30_subject(self):
        f=RUSSELL;isin='LU1681038672'
        h=parse_capture(f['capture'],json.dumps(f['metadata']).encode(),isin,NOW)
        self.assertEqual(h['rows'],f['qualifiedRecord']['rows'])
        self.assertEqual(h['asOf'],'2026-10-29')
        def extract(raw,rectangle=None):
            return f['subjectRightText'] if rectangle==(300,300) else f['subjectLeftText'] if rectangle==(0,300) else f['subjectText']
        with patch('invesco_economic_index.pdf_text',side_effect=extract),patch('collect_amundi_index_exposure.pdf_text',side_effect=extract):
            self.assertEqual(qualify_subject(isin,NOW,lambda _:b'pdf')[2],'2026-09-30')
        def changed(raw,rectangle=None):return extract(raw,rectangle).replace('RU20N30U','RU20INTR')
        with patch('invesco_economic_index.pdf_text',side_effect=changed),patch('collect_amundi_index_exposure.pdf_text',side_effect=changed),self.assertRaises(ValueError):
            qualify_subject(isin,NOW,lambda _:b'pdf')

    def test_changed_return_method_cannot_be_used(self):
        from invesco_economic_index import return_weight_method
        with self.assertRaisesRegex(ValueError,'requires qualification'):
            return_weight_method('russell2000-equity-members',NOW,lambda _:b'changed rules')
        with self.assertRaises(ConnectionError):
            return_weight_method('russell2000-equity-members',NOW,Mock(side_effect=ConnectionError('Rules unavailable')))

if __name__=='__main__':unittest.main()
