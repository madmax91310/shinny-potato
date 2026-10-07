import copy
import datetime as dt
import json
import re
from pathlib import Path
import unittest
from unittest.mock import patch
import urllib.error
from collect_index_extensions import nasdaq_returns, amundi_composition, collect_amundi_composition
from collect_remaining_documents import collect_one as ubs_collect
from refresh_index_sources import merge_records
from refresh_index_sources import collect_one as refresh_index
from data_automation import UTC
F=Path(__file__).parent/'fixtures/official-documents/index-extensions'
CONFIG=json.loads((Path(__file__).parent/'index-automation.json').read_text())['indices']
NOW=dt.datetime(2026,10,6,tzinfo=UTC)
def cfg(id):return next(c for c in CONFIG if c['id']==id)
class IndexExtensions(unittest.TestCase):
    def test_nasdaq_calendar_exact_total_usd_and_exclude_ytd(self):
        c=cfg('nasdaq-pea');t=(F/'nasdaq-total.txt').read_text()
        stamp,v=nasdaq_returns(t,c,NOW)
        self.assertEqual(stamp,'2026-09-30');self.assertEqual(dict(v)[2025],21.02)
        self.assertEqual(dict(v)[2023],55.13);self.assertNotIn(2026,dict(v))
        for a,b in [('Total Return Index (XNDX)','(NDX)'),('Currency:\nUSD','Currency:\nEUR'),('09/30/2026','01/30/2026'),('2025','2026'),('2026','2027'),('CALENDER YEAR','ROLLING YEAR')]:
            with self.assertRaises(ValueError):nasdaq_returns(t.replace(a,b),c,NOW)
        with self.assertRaises(ValueError):nasdaq_returns(t,{**c,'returnVariant':'NET'},NOW)
    def test_amundi_explicit_index_exposures_and_counts(self):
        for id,count in [('nasdaq-pea',102),('topix',1636),('sp500-pea',503),('sp500-equal-weight',503),('stoxx600',600),('eurostoxx50',50),('russell-2000',1953)]:
            c=cfg(id);f=json.loads((F/(id+'.json')).read_text())
            def extract(body,crop=None):return f['left'] if crop==(0,300) else f['right'] if crop==(300,300) else f['full']
            with patch('collect_index_extensions.pdf_text',side_effect=extract),patch('collect_amundi_index_exposure.pdf_text',side_effect=extract):
                r=amundi_composition(b'%PDF-proof',c,NOW,'https://example.org/source')
                self.assertEqual(r['constituents'],count);self.assertEqual(len(r['holdings']),10)
                self.assertAlmostEqual(sum(v for _,v in r['countries']),100,delta=.2)
                self.assertAlmostEqual(sum(v for _,v in r['sectors']),100,delta=.2)
                original = f['full']
                f['full'] = re.sub(c['compositionIdentityPattern'], 'Wrong index', original)
                with self.assertRaises(ValueError):amundi_composition(b'%PDF-proof',c,NOW,'https://example.org/source')
                f['full'] = original
                for key,a,b in [('full',c['compositionIsin'],'FR001OTHER01'),('full',c.get('compositionReplication','Synthétique'),'Wrong method'),('full',c['compositionIdentityPattern'].replace('\\',''),'Wrong index'),('full','31/08/2026','31/01/2026'),('left','États-Unis','')]:
                    if a not in f[key]:continue
                    previous=f[key];f[key]=previous.replace(a,b)
                    with self.assertRaises((ValueError,IndexError)):amundi_composition(b'%PDF-proof',c,NOW,'https://example.org/source')
                    f[key]=previous
    def test_month_fallback_and_never_relabel_old_document(self):
        c=cfg('topix')
        def fetch(url):
            if '20260930' in url:raise urllib.error.HTTPError(url,404,'not published',{},None)
            return b'%PDF'
        with patch('collect_index_extensions.amundi_composition',return_value={'asOf':'2026-08-31'}) as parse:
            self.assertEqual(collect_amundi_composition(c,NOW,fetch)['asOf'],'2026-08-31')
            self.assertIn('20260831',parse.call_args.args[-1])
        with patch('collect_index_extensions.amundi_composition',return_value={'asOf':'2026-07-31'}):
            with self.assertRaises(ValueError):collect_amundi_composition(c,NOW,fetch)
    def test_invalid_observation_does_not_replace_good_composition(self):
        previous={'topix':{'facts':{'asOf':'2026-08-31','constituents':1636}}}
        self.assertEqual(merge_records(previous,[{'id':'topix','errors':[{'field':'composition'}]}]),previous)
    def test_ftse_returns_keep_their_source_when_amundi_composition_fails(self):
        c=cfg('russell-2000')
        returns='Data as at: 31 August 2026'
        with patch('collect_index_extensions.collect_amundi_composition',side_effect=ValueError('wrong index')),patch('refresh_index_sources.pdf_text',return_value=returns),patch('refresh_index_sources.ftse_returns',return_value=[[2025,12.81]]):
            r=refresh_index(c,NOW,lambda url:b'%PDF-proof')
        self.assertNotIn('facts',r)
        self.assertEqual(r['errors'][0]['field'],'composition')
        self.assertEqual(r['returns']['currency'],'USD')
        self.assertEqual(r['returns']['variant'],'TOTAL')
        self.assertEqual(r['returns']['source']['url'],c['returnSourceUrl'])
        with patch('collect_index_extensions.collect_amundi_composition',return_value={'asOf':'2026-08-31'}),patch('refresh_index_sources.pdf_text',side_effect=ValueError('bad return document')):
            r=refresh_index(c,NOW,lambda url:b'%PDF-proof')
        self.assertIn('facts',r)
        self.assertNotIn('returns',r)
        self.assertEqual(r['errors'][0]['field'],'returns')
    def test_derived_returns_and_composition_fail_independently(self):
        c=cfg('sp500-pea')
        with patch('derive_index_returns.collect_one',return_value={'id':c['id'],'errors':[{'field':'returns'}]}),patch('collect_index_extensions.collect_amundi_composition',return_value={'asOf':'2026-08-31'}) as composition:
            r=refresh_index(c,NOW)
            self.assertIn('facts',r)
            self.assertEqual(r['errors'],[{'field':'returns'}])
            composition.reset_mock()
            refresh_index({**c,'collectComposition':False},NOW)
            composition.assert_not_called()
    def test_ubs_canonical_host_fallback_keeps_source_and_failures_visible(self):
        c={'isin':'IE00BD4TXV59','parser':'ubs-document','currency':'USD'}
        def fetch(url,**kwargs):
            if 'https://swissfunddata.ch/' in url:raise TimeoutError('host unavailable')
            return b'%PDF-proof'
        with patch('collect_remaining_documents.download',side_effect=fetch),patch('collect_remaining_documents.pdf_text',return_value='text'),patch('collect_remaining_documents.ubs',side_effect=lambda t,s,n,h:s):
            r=ubs_collect(c,NOW);self.assertIn('www.swissfunddata.ch',r['sourceUrl'])
        with patch('collect_remaining_documents.download',side_effect=TimeoutError('host unavailable')):
            with self.assertRaisesRegex(ValueError,'host unavailable'):ubs_collect(c,NOW)
if __name__=='__main__':unittest.main()
