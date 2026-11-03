import copy
import datetime as dt
import unittest
import urllib.error
from unittest.mock import patch
from wisdomtree_api_holdings import parse, identity_map, pending_identity, collect_pending_proofs
from security_identifier_observations import API, digest

NOW=dt.datetime(2026,10,21,tzinfo=dt.timezone.utc)
SHARE={'isin':'IE00BJGWQN72','currency':'USD'}

def portfolio():
    return [{'dt':'2026-10-19T00:00:00Z','wtClassID':3104137,'fundTicker':'WCLD LN',
             'assetGroup':'EQ','securityName':f'Stock {i}','securityTicker':f'T{i} US',
             'figi':f'BBG{i:09d}','wgt':1/12,'checkSumWgtEntity':1,'checkSumWgtAssetGroup':1}
            for i in range(12)]

class ApiHoldings(unittest.TestCase):
    def test_positive_receipts_renew_before_expiry_and_negative_lookups_retry(self):
        from wisdomtree_identity_cache import recent_lookup_keys,lookup_key
        positive={'idType':'ID_ISIN','idValue':'US0000000001'}
        negative={'idType':'ID_ISIN','idValue':'US0000000002','exchCode':'M0','includeUnlistedEquities':True}
        def receipt(age):return {'checkedAt':(NOW-dt.timedelta(days=age)).isoformat(),
                                'request':[positive,negative],'response':[{'data':[{'figi':'BBG000000000'}]},{'warning':'No identifier found.'}]}
        self.assertEqual(recent_lookup_keys([receipt(7)],NOW,358,7),{lookup_key(positive),lookup_key(negative)})
        self.assertEqual(recent_lookup_keys([receipt(8)],NOW,358,7),{lookup_key(positive)})
        self.assertEqual(recent_lookup_keys([receipt(358)],NOW,358,7),{lookup_key(positive)})
        self.assertEqual(recent_lookup_keys([receipt(359)],NOW,358,7),set())
        self.assertEqual(recent_lookup_keys([receipt(-1)],NOW,358,7),set())

    def test_failed_pending_renewal_keeps_the_original_still_valid_proof(self):
        row={'figi':'BBG000000001','shareClassFIGI':'BBG000000002','ticker':'T0','marketSector':'Equity','securityType':'Common Stock'}
        response=[{'data':[copy.deepcopy(row)]},{'data':[copy.deepcopy(row)]}]
        source='https://www.wisdomtree.com/api/fund-holdings/3104137'
        e={'sourceUrl':API,'checkedAt':(NOW-dt.timedelta(days=359)).isoformat(),
           'request':[{'idType':'ID_CUSIP','idValue':'748193208'},{'idType':'ID_ISIN','idValue':'US0000000001'}],
           'response':response,'sha256':digest(response),'issuerPendingIdentity':{'identifier':'FIGI-PENDING-748193208','securityTicker':'T0 US','sourceUrl':source,'sourceSha256':'a'*64}}
        item={'figi':'FIGI-PENDING-748193208','securityTicker':'T0 US','securityName':'Stock 0'}
        attempts=[]
        def unavailable(jobs):attempts.append(jobs);return [{'warning':'No identifier found.'}for _ in jobs]
        renewed=collect_pending_proofs([item],[e],{'STOCK0':{'US0000000001'}},NOW,source,b'new source',unavailable)
        self.assertEqual(len(attempts),1);self.assertEqual(renewed,[e]);self.assertEqual(pending_identity(renewed[0],NOW)[1],'US0000000001')
        fresh={**e,'checkedAt':NOW.isoformat()}
        self.assertEqual(collect_pending_proofs([item],[fresh],{},NOW,source,b'new source',lambda _:self.fail('Fresh proof must not be re-dated')),[fresh])

    def test_identifier_cache_is_lossless_bounded_and_never_redates_evidence(self):
        from wisdomtree_identity_cache import expand_observation,compact_observation
        record={'checkedAt':NOW.isoformat(),'sha256':'a'*64,'request':[{'idType':'ID_ISIN','idValue':'US0000000001'}],
                'response':[{'data':[{'name':'Société électricité','weight':.12345678901234567}]}]}
        compact=compact_observation(record)
        self.assertEqual(expand_observation(compact),record)
        self.assertEqual(compact_observation(compact),compact)
        for wrong in [{**compact,'response':[]},{**compact,'responseGzipBase64':'bad!'},
                      {**compact,'responseGzipBase64':'a'*8_000_001}]:
            with self.assertRaises(ValueError):expand_observation(wrong)

    def test_pending_namespace_crosswalk_requires_exact_security_class_and_ticker(self):
        for suffix,kind in [('748193208','ID_CUSIP'),('Y2925Z103','ID_CINS'),('BS28Y61','ID_SEDOL')]:
            row={'figi':'BBG000000001','shareClassFIGI':'BBG000000002','ticker':'T0','marketSector':'Equity','securityType':'Common Stock'}
            responses=[{'data':[copy.deepcopy(row)]},{'data':[copy.deepcopy(row)]}]
            e={'sourceUrl':API,'checkedAt':NOW.isoformat(),'request':[{'idType':kind,'idValue':suffix},{'idType':'ID_ISIN','idValue':'US0000000001'}],
               'response':responses,'sha256':digest(responses),'issuerPendingIdentity':{'identifier':'FIGI-PENDING-'+suffix,'securityTicker':'T0 US',
               'sourceUrl':'https://www.wisdomtree.com/api/fund-holdings/3104137','sourceSha256':'a'*64}}
            self.assertEqual(pending_identity(e,NOW),('FIGI-PENDING-'+suffix,'US0000000001'))
            body=portfolio();body[0]['figi']='FIGI-PENDING-'+suffix
            # Even an injected dictionary entry cannot assign a placeholder.
            plain=parse(body,SHARE,NOW,{body[0]['figi']:'US0000000001',body[1]['figi']:'US0000000002'})[0]
            self.assertIsNone(plain[0]['isin'])
            resolved=parse(body,SHARE,NOW,{body[1]['figi']:'US0000000002'},pending_observations=[e])[0]
            self.assertEqual(resolved[0]['isin'],'US0000000001')
            for key,value in [('figi','BBG000000009'),('shareClassFIGI','BBG000000009'),('securityType','ADR'),('ticker','T1')]:
                wrong=copy.deepcopy(e);wrong['response'][1]['data'][0][key]=value;wrong['sha256']=digest(wrong['response'])
                with self.subTest(kind=kind,key=key),self.assertRaises(ValueError):pending_identity(wrong,NOW)
            for patch in [{'checkedAt':'2020-01-01T00:00:00+00:00'},{'checkedAt':'2026-11-01T00:00:00+00:00'},{'sha256':'0'*64}]:
                with self.assertRaises(ValueError):pending_identity({**e,**patch},NOW)
            wrong=copy.deepcopy(e);wrong['issuerPendingIdentity']['sourceUrl']='https://www.wisdomtree.com/api/fund-holdings/7369317'
            with self.assertRaises(ValueError):parse(body,SHARE,NOW,{body[1]['figi']:'US0000000002'},pending_observations=[wrong])

    def test_preferred_precision_source_only_falls_back_on_acquisition_failure(self):
        from collect_wisdomtree_holdings import collect
        from wisdomtree_api_holdings import IssuerApiUnavailable
        share={'isin':'IE00BKLF1R75'}
        with patch('wisdomtree_api_holdings.collect',return_value={'asOf':'2026-10-28'}) as api,patch('collect_wisdomtree_holdings.collect_public_rankings') as rounded:
            self.assertEqual(collect(share,NOW)['asOf'],'2026-10-28');api.assert_called_once();rounded.assert_not_called()
        with patch('wisdomtree_api_holdings.collect',side_effect=ValueError('Wrong exact fund')),patch('collect_wisdomtree_holdings.collect_public_rankings') as rounded:
            with self.assertRaises(ValueError):collect(share,NOW)
            rounded.assert_not_called()
        with patch('wisdomtree_api_holdings.collect',side_effect=IssuerApiUnavailable('503')),patch('collect_wisdomtree_holdings.collect_public_rankings',return_value={'asOf':'2026-10-23'}):
            result=collect(share,NOW);self.assertEqual(result['asOf'],'2026-10-23');self.assertEqual(result['accessAttempts'][0]['status'],'unavailable')

    def test_unidentified_is_retained_never_inferred_from_name(self):
        body=portfolio()
        rows,date,cash=parse(body,SHARE,NOW,{'BBG000000000':'US0000000001'})
        self.assertEqual(date,'2026-10-19');self.assertEqual(cash,0)
        self.assertEqual(len(rows),12);self.assertAlmostEqual(sum(r['weightPct']for r in rows),100)
        self.assertEqual(rows[0]['isin'],'US0000000001');self.assertIsNone(rows[1]['isin'])
        body[-1].update(securityName='CASH W-O',securityTicker=None,figi=None)
        rows,_,cash=parse(body,SHARE,NOW,{'BBG000000000':'US0000000001'})
        self.assertEqual(len(rows),11);self.assertAlmostEqual(cash,100/12)

    def test_wrong_fund_future_partial_short_or_duplicate_rejected(self):
        for key,value in [('wtClassID',1),('fundTicker','WRONG'),('dt','2026-10-22'),
                          ('wgt',-.1),('wgt',float('nan')),('checkSumWgtEntity',float('nan')),('checkSumWgtAssetGroup',float('inf')),('checkSumWgtEntity',True),('checkSumWgtEntity',.99),('figi','BBG000000001')]:
            body=portfolio();body[0][key]=value
            with self.subTest(key=key,value=value),self.assertRaises(ValueError):
                parse(body,SHARE,NOW,{'BBG000000000':'US0000000001'})
        with self.assertRaises(ValueError):parse(portfolio()[:-1],SHARE,NOW,{'BBG000000000':'US0000000001'})
        with self.assertRaises(ValueError):parse(portfolio(),SHARE,NOW,{})

    def test_only_the_fund_api_transport_is_marked_for_fallback(self):
        from wisdomtree_api_holdings import collect,IssuerApiUnavailable
        text='IE00BJGWQN72 WisdomTree Cloud Computing UCITS ETF - USD Acc Replication Method Physical (fully replicated) Base Currency USD WCLD WCLD LN Document Date: 20/10/2026'
        for code in [403,429,503,404]:
            def fetch(url,**kwargs):
                if 'dataspanapi' in url:return b'%PDF-test'
                raise urllib.error.HTTPError(url,code,'Source unavailable',{},None)
            with self.subTest(code=code),patch('wisdomtree_api_holdings.pdf_text',return_value=text):
                with self.assertRaises(IssuerApiUnavailable if code!=404 else urllib.error.HTTPError):collect(SHARE,NOW,fetch=fetch)
        def identity_failure(url,**kwargs):raise urllib.error.HTTPError(url,403,'Identity document unavailable',{},None)
        with self.assertRaises(urllib.error.HTTPError):collect(SHARE,NOW,fetch=identity_failure)

    def test_exact_figi_cache_expiry_conflict_and_proof(self):
        response=[{'data':[{'figi':'BBG000000000','marketSector':'Equity','name':'Different label'}]}]
        row={'sourceUrl':API,'checkedAt':NOW.isoformat(),'request':[{'idType':'ID_ISIN','idValue':'US0000000001'}],
             'response':response,'sha256':digest(response)}
        self.assertEqual(identity_map([row],NOW),{'BBG000000000':'US0000000001'})
        expired={**row,'checkedAt':'2025-01-01T00:00:00+00:00'}
        self.assertEqual(identity_map([expired],NOW),{})
        self.assertEqual(identity_map([{**row,'checkedAt':'2026-10-22T00:00:00+00:00'}],NOW),{})
        with self.assertRaises(ValueError):identity_map([{**row,'sha256':'0'*64}],NOW)
        conflict=copy.deepcopy(row);conflict['request'][0]['idValue']='US0000000002'
        with self.assertRaises(ValueError):identity_map([row,conflict],NOW)

    def test_venue_requires_both_same_composite_and_share_class(self):
        def evidence(job,rows):
            response=[{'data':rows}]
            return {'sourceUrl':API,'checkedAt':NOW.isoformat(),'request':[job],'response':response,'sha256':digest(response)}
        row={'figi':'BBG000000001','marketSector':'Equity','compositeFIGI':'BBG000000002','shareClassFIGI':'BBG000000003'}
        isin=evidence({'idType':'ID_ISIN','idValue':'US0000000001'},[row])
        venue=evidence({'idType':'ID_BB_GLOBAL','idValue':'BBG000000004'},[{**row,'figi':'BBG000000004'}])
        self.assertEqual(identity_map([venue,isin],NOW)['BBG000000004'],'US0000000001')
        for key in ['compositeFIGI','shareClassFIGI','figi']:
            wrong=evidence(venue['request'][0],[{**venue['response'][0]['data'][0],key:'BBG000000009'}])
            self.assertNotIn('BBG000000004',identity_map([isin,wrong],NOW))

if __name__=='__main__':unittest.main()
