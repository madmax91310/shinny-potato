import copy
import datetime as dt
import json
import unittest
import urllib.error
from unittest.mock import patch
from collect_wisdomtree_holdings import rankings,parse
from discover_holdings_sources import discover
from security_identifier_observations import qualified,digest,API
NOW=dt.datetime(2026,10,20,tzinfo=dt.timezone.utc)
SHARE={'isin':'IE00BJGWQN72','sourceUrl':'https://www.wisdomtree.eu/fund','provider':'WisdomTree','name':'Cloud','currency':'USD'}

def fixture():
    rows=[dict(descriptorB=f'B{i:06}',wtClassID=123,rankClassificationID=1,dt='2026-10-19T00:00:00',pctWeight=1/11,constituentName=f'Security {i}',wgtSumCheck=1)for i in range(11)]
    return {'sectionKey':'holdings','entityId':123,'ranking':rows}
def page(value):
    text='1:'+json.dumps(value)+'\n'
    return 'Physical, Fully Replicated<script>self.__next_f.push('+json.dumps([1,text])+')</script>'

class Holdings(unittest.TestCase):
    def test_full_flight_and_identity_only_weights(self):
        data=fixture();mapping={r['descriptorB']:f'US{i:09}1'for i,r in enumerate(data['ranking'])}
        facts={'holdings':{'rows':[{'name':r['constituentName'],'weightPct':r['pctWeight']*100}for r in data['ranking'][:10]]}}
        with patch('collect_public_issuer.wisdomtree',return_value=facts):
            rows,stamp=parse(page(data),SHARE,NOW,mapping,['2026-10-19'])
            self.assertEqual(len(rows),11);self.assertEqual(stamp,'2026-10-19');self.assertAlmostEqual(sum(r['weightPct']for r in rows),100)
            with self.assertRaisesRegex(ValueError,'Unqualified'):parse(page(data),SHARE,NOW,{},['2026-10-19'])
            with self.assertRaisesRegex(ValueError,'Identity dates'):parse(page(data),SHARE,NOW,mapping,['2025-10-19'])
            bad=copy.deepcopy(data);bad['ranking'][0]['pctWeight']=.5
            with self.assertRaisesRegex(ValueError,'Incomplete weights'):parse(page(bad),SHARE,NOW,mapping,['2026-10-19'])
            for value in [float('nan'), float('inf'), True]:
                bad=copy.deepcopy(data)
                for row in bad['ranking']:row['wgtSumCheck']=value
                with self.assertRaisesRegex(ValueError,'Incomplete weights'):parse(page(bad),SHARE,NOW,mapping,['2026-10-19'])
            bad=copy.deepcopy(data);bad['ranking'][0]['dt']='2026-10-18'
            with self.assertRaisesRegex(ValueError,'Mixed fund/date'):parse(page(bad),SHARE,NOW,mapping,['2026-10-19'])
    def test_cloud_access_fallback_never_retries_a_financial_validation_failure(self):
        from collect_wisdomtree_holdings import collect
        value={'complete':True,'asOf':'2026-10-19','rows':[{'isin':'US0000000001'}]}
        with patch('wisdomtree_api_holdings.collect',side_effect=urllib.error.HTTPError('https://www.wisdomtree.com/api/fund-holdings/3104137',403,'Forbidden',{},None)),patch('collect_wisdomtree_holdings.collect_rankings',return_value=value) as alternate:
            result=collect(SHARE,NOW)
            self.assertEqual(result['asOf'],'2026-10-19')
            self.assertEqual(result['accessAttempts'][0]['status'],'unavailable')
            alternate.assert_called_once()
        for error in [ValueError('Wrong API fund identity'),urllib.error.HTTPError('https://www.wisdomtree.com/api/fund-holdings/3104137',404,'Removed',{},None)]:
            with patch('wisdomtree_api_holdings.collect',side_effect=error),patch('collect_wisdomtree_holdings.collect_rankings') as alternate:
                with self.assertRaises(type(error)):collect(SHARE,NOW)
                alternate.assert_not_called()
        from observation_status import holdings_status
        # A validated but older alternate never replaces the newer observation.
        with patch('wisdomtree_api_holdings.collect',side_effect=TimeoutError('down')),patch('collect_wisdomtree_holdings.collect_rankings',return_value={**value,'asOf':'2026-10-18'}):
            old=collect(SHARE,NOW)
        previous={'asOf':'2026-10-19','checkedAt':'2026-10-19T00:00:00+00:00'}
        error='Date regression' if previous['asOf']>old['asOf'] else None
        status=holdings_status({},previous,None,error,NOW)
        self.assertEqual(status['asOf'],'2026-10-19')
        self.assertEqual(status['lastSuccessAt'],previous['checkedAt'])
        self.assertEqual(status['status'],'failed')

    def test_sector_rows_complete_truncated_top100(self):
        data=fixture();allrows=data['ranking'];data['ranking']=allrows[:3]
        self.assertEqual(len(rankings(page({'holdings':data,'sectors':{'holdings':allrows}}))['ranking']),11)
        bad=copy.deepcopy(allrows[0]);bad['pctWeight']=.99
        with self.assertRaisesRegex(ValueError,'Contradictory'):rankings(page({'holdings':data,'other':[bad]}))
    def test_discovery_retains_good_data_and_promotes_only_complete(self):
        previous={SHARE['isin']:{'asOf':'2026-10-19','rows':[{'value':'preserve'}]}}
        for value in [None,{'complete':False},{'complete':True,'rows':[1],'asOf':'2026-10-21'},{'complete':True,'rows':[1],'asOf':'2026-10-18'}]:
            def fetch(*args):
                if value is None:raise ValueError('Source unavailable')
                return value
            config,records,report=discover([SHARE],{},previous,NOW,fetch)
            self.assertEqual(config,{});self.assertEqual(records,previous);self.assertFalse(report['observations'][SHARE['isin']]['financialDataQualified'])
        value={'complete':True,'rows':[1],'asOf':'2026-10-19'}
        config,records,report=discover([SHARE],{},previous,NOW,lambda *a:value)
        self.assertEqual(config[SHARE['isin']]['parser'],'wisdomtree-complete');self.assertTrue(report['observations'][SHARE['isin']]['financialDataQualified'])
        discover([SHARE],config,records,NOW,lambda *a:self.fail('Active collector must not be rediscovered'))

class Identifiers(unittest.TestCase):
    def evidence(self):
        row={'figi':'BBG000BK00N6','shareClassFIGI':'BBG001SCL2J2','marketSector':'Equity','securityType':'Common Stock'}
        response=[{'data':[row]},{'data':[row]}]
        return {'sourceUrl':API,'checkedAt':NOW.isoformat(),'request':[{'idType':'ID_SEDOL','idValue':'BN7GN02'},{'idType':'ID_ISIN','idValue':'IL0011794802'}],'response':response,'sha256':digest(response)}
    def test_exact_figi_and_share_class_not_name(self):
        value=self.evidence();self.assertEqual(qualified(value,NOW),('BN7GN02','IL0011794802'))
        value['response'][1]['data'][0]={**value['response'][1]['data'][0],'figi':'BBG000BK00N7'};value['sha256']=digest(value['response'])
        with self.assertRaisesRegex(ValueError,'Missing or ambiguous'):qualified(value,NOW)
    def test_ny_registered_share_is_distinct_from_another_security_type(self):
        value=self.evidence()
        for response in value['response']:response['data'][0]['securityType']='NY Reg Shrs'
        value['sha256']=digest(value['response'])
        self.assertEqual(qualified(value,NOW),('BN7GN02','IL0011794802'))
        value['response'][1]['data'][0]={**value['response'][1]['data'][0],'securityType':'Common Stock'}
        value['sha256']=digest(value['response'])
        with self.assertRaises(ValueError):qualified(value,NOW)

    def test_adr_queries_require_the_same_depositary_receipt_not_the_ordinary_share(self):
        value=self.evidence()
        for response in value['response']:
            response['data'][0]['securityType']='ADR'
        value['sha256']=digest(value['response'])
        self.assertEqual(qualified(value,NOW),('BN7GN02','IL0011794802'))
        value['response'][1]['data'][0]={**value['response'][1]['data'][0],'securityType':'Common Stock'}
        value['sha256']=digest(value['response'])
        with self.assertRaisesRegex(ValueError,'Missing or ambiguous'):qualified(value,NOW)

    def test_tamper_expiry_future_and_ambiguous_isin(self):
        value=self.evidence();value['sha256']='0'*64
        with self.assertRaisesRegex(ValueError,'evidence'):qualified(value,NOW)
        for date in ['2025-01-01T00:00:00+00:00','2026-10-21T00:00:00+00:00']:
            value=self.evidence();value['checkedAt']=date
            with self.assertRaisesRegex(ValueError,'Expired'):qualified(value,NOW)
        value=self.evidence();value['request'].append({'idType':'ID_ISIN','idValue':'US0000000001'});value['response'].append(value['response'][1]);value['sha256']=digest(value['response'])
        with self.assertRaisesRegex(ValueError,'ambiguous'):qualified(value,NOW)
if __name__=='__main__':unittest.main()
