import copy
import datetime as dt
import unittest
import urllib.error
from unittest.mock import patch
from wisdomtree_api_holdings import parse, identity_map
from security_identifier_observations import API, digest

NOW=dt.datetime(2026,10,21,tzinfo=dt.timezone.utc)
SHARE={'isin':'IE00BJGWQN72','currency':'USD'}

def portfolio():
    return [{'dt':'2026-10-19T00:00:00Z','wtClassID':3104137,'fundTicker':'WCLD LN',
             'assetGroup':'EQ','securityName':f'Stock {i}','securityTicker':f'T{i} US',
             'figi':f'BBG{i:09d}','wgt':1/12,'checkSumWgtEntity':1,'checkSumWgtAssetGroup':1}
            for i in range(12)]

class ApiHoldings(unittest.TestCase):
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
