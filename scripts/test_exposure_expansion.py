import copy
import datetime as dt
import json
import unittest
from pathlib import Path
from collect_exposure_expansion import qualify
from collect_dws_etf import parse_holdings
from collect_invesco_allocations import parse_allocations

class Expansion(unittest.TestCase):
    def test_wrong_share_and_incomplete_exposure_rejected(self):
        s={'isin':'IE00B3RBWM25'}
        with self.assertRaises(ValueError):qualify({'isin':'IE00BK5BQT80'},s)
        with self.assertRaises(ValueError):qualify(s,s)
        value={**s,'countries':{'asOf':'2026-09-30','rows':[{'name':'France','weightPct':20}]},'sectors':{'asOf':'2026-09-30','rows':[{'name':'Technology','weightPct':100}]}}
        with self.assertRaises(ValueError):qualify(value,s)
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
