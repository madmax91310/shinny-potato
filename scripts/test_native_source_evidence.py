import datetime as dt
import unittest
import gzip,json,hashlib
from pathlib import Path
from check_pending_sources import check
from native_source_evidence import describe_native_source

NOW=dt.datetime(2026,10,30,tzinfo=dt.timezone.utc)
URL='https://indexes.nasdaqomx.com/Index/Weighting/NDX'

class NativeSourceEvidence(unittest.TestCase):
    def test_real_official_pdf_is_replayed_without_upgrading_to_financial_composition(self):
        folder=Path(__file__).resolve().parents[1]/'reports/dca-roadmap-2026-10-29/evidence'
        url='https://www.nasdaq.com/NDX';raw=gzip.decompress((folder/'nasdaq-native.pdf.gz').read_bytes())
        source=json.loads((folder/'native-source-probes.json').read_text())['sources'][url]
        self.assertEqual(hashlib.sha256(raw).hexdigest(),source['sha256'])
        result=describe_native_source(url,raw,NOW)
        self.assertEqual(result['contentType'],'pdf');self.assertEqual(result['documentDates'],['05/01/2026'])
        self.assertFalse(result['financialDataQualified']);self.assertNotIn('asOf',result)
    def test_weighted_table_is_only_a_research_clue_not_a_composition(self):
        raw=b'<p>Log in for Full Access</p><script><table><tr><td>fake</td></tr></table></script><table><tr><th>Name</th><th>Weight</th><th>ISIN</th></tr><tr><td>Apple</td><td>7.5%</td><td>US0378331005</td></tr></table><a href="/full.pdf">File</a>'
        result=describe_native_source(URL,raw,NOW)
        self.assertFalse(result['financialDataQualified']);self.assertEqual(result['tableDataRowCount'],1)
        self.assertEqual(result['percentBearingTableRowCount'],1);self.assertEqual(result['isinBearingTableRowCount'],1)
        self.assertTrue(result['accessRestrictionMentioned']);self.assertEqual(len(result['documentCandidates']),1)
        self.assertNotIn('asOf',result)

    def test_failed_access_keeps_content_evidence_with_its_original_clock(self):
        row={'id':'FR0011871110','field':'completeHoldings','configuredSourceUrls':[URL]}
        old=check([row],{},NOW,lambda url,**kwargs:(b'<table><tr><th>Name</th><th>Symbol</th></tr></table>',url))
        def fail(*args,**kwargs):raise TimeoutError('offline')
        later=check([row],old,NOW+dt.timedelta(days=1),fail)
        self.assertEqual(later['sources'][URL]['nativeCompositionProbe'],old['sources'][URL]['nativeCompositionProbe'])
        self.assertEqual(later['sources'][URL]['status'],'unavailable')
        self.assertFalse(later['observations']['FR0011871110:completeHoldings']['financialDataQualified'])

    def test_unconfigured_sources_do_not_gain_native_status(self):
        self.assertIsNone(describe_native_source('https://example.com',b'anything',NOW))

if __name__=='__main__':unittest.main()
