import copy
import datetime as dt
import json
import unittest
from discover_lg_holdings import collect,document_link,UnqualifiedHoldings

ISIN='IE00BYPLS672'
URL='https://fundcentres.lgim.com/srp/documents-id/9f3a4ebd-0038-4a92-8edd-5256eab14b58/Fundholdings.csv'
SHARE={'isin':ISIN,'currency':'USD','pageUrl':'https://fundcentres.landg.com/en/test/'+ISIN+'/'}
def page(state):return '<script type="application/json">'+json.dumps(state)+'</script>'
def state():return {'activeShareClass':{'data':{'id':893,'currency':'USD','parentId':'fund-100','data':{'shareclassISIN':ISIN}}},
    'activeFund':{'data':{'localId':'fund-100','data':{'productType':'ETF'}}},
    'pageSections':[{'key':'portfolioBreakdown','canvas':{'part':{'downloads':{'part':{'data':{'893':[{'name':'Download full fund holdings','url':URL}], '999':[{'name':'Wrong share','url':'https://evil.example/file'}]}}}}}}]}

class LGDiscoveryTests(unittest.TestCase):
    def test_generic_explorer_retry_still_rejects_creation_basket_and_wrong_share(self):
        raw=('ETF Trading ID'+ISIN+'\nBasket Trade Date2026-10-20\nCash Component is a balancing number\nBasket Client Disclaimer').encode()
        calls=[]
        def fetch(url):
            calls.append(url)
            return page(state()).encode() if url==SHARE['pageUrl'] else raw
        with self.assertRaises(UnqualifiedHoldings) as raised:
            collect(SHARE,None,fetch=fetch,page_fetch=lambda _:'<html>Generic explorer</html>')
        self.assertEqual(raised.exception.evidence['documentBasis'],'creation-basket')
        self.assertEqual(calls,[SHARE['pageUrl'],URL.replace('fundcentres.lgim.com','fundcentres.landg.com')])
        wrong=state();wrong['activeShareClass']['data']['data']['shareclassISIN']='IE00WRONG000'
        with self.assertRaisesRegex(ValueError,'Wrong L&G'):
            collect(SHARE,None,fetch=lambda _:self.fail('Wrong identity must not try another document'),page_fetch=lambda _:page(wrong))

    def test_exact_share_link_and_domain_migration(self):
        self.assertEqual(document_link(page(state()),SHARE),URL.replace('fundcentres.lgim.com','fundcentres.landg.com'))
        wrong=copy.deepcopy(SHARE);wrong['isin']='IE00WRONG000'
        with self.assertRaises(ValueError):document_link(page(state()),wrong)
        bad=state();bad['pageSections'][0]['canvas']['part']['downloads']['part']['data']['893'][0]['url']=URL.replace('fundcentres.lgim.com','evil.example')
        with self.assertRaises(ValueError):document_link(page(bad),SHARE)

    def test_creation_basket_does_not_become_portfolio(self):
        raw=('ETF Trading ID'+ISIN+'\nBasket Trade Date2026-10-20\nCash Component is a balancing number\nBasket Client Disclaimer').encode()
        with self.assertRaises(UnqualifiedHoldings)as raised:
            collect(SHARE,dt.datetime(2026,10,21),fetch=lambda _:raw,page_fetch=lambda _:page(state()))
        self.assertEqual(raised.exception.evidence['documentBasis'],'creation-basket')
        self.assertEqual(len(raised.exception.evidence['sourceSha256']),64)
        self.assertNotIn('checkedAt',raised.exception.evidence)
        with self.assertRaises(ValueError):collect(SHARE,None,fetch=lambda _:raw.replace(ISIN.encode(),b'IE00OTHER000'),page_fetch=lambda _:page(state()))

if __name__=='__main__':unittest.main()
