import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from replay_metadata_evidence import load_documents,replay
from collect_instrument_metadata import collect
import datetime as dt


class MetadataEvidenceReplayTests(unittest.TestCase):
    ISIN='IE00B4L5Y983'

    def test_replay_preserves_the_original_success_date(self):
        body=(self.ISIN+'\nCurrency Hedged: No').encode();url='https://issuer.test/doc'
        doc={'isin':self.ISIN,'sourceUrl':url,'requestedUrl':url,'checkedAt':'2026-09-01T10:00:00+00:00','body':body,'sha256':hashlib.sha256(body).hexdigest()}
        values,_=replay({'isin':self.ISIN,'listings':[]},{(self.ISIN,url):doc})
        self.assertEqual(values['currencyHedge']['checkedAt'],'2026-09-01')
        self.assertEqual(values['currencyHedge']['sha256'],doc['sha256'])
        self.assertIs(values['currencyHedge']['value'],False)

    def test_modified_archive_never_supplies_evidence(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);(root/'body').write_bytes(b'changed')
            (root/'manifest.json').write_text(json.dumps({'instruments':[{'isin':self.ISIN,'documents':[{'file':'body','sha256':hashlib.sha256(b'original').hexdigest(),'checkedAt':'2026-09-01T10:00:00+00:00','sourceUrl':'https://issuer.test/doc','requestedUrl':'https://issuer.test/doc'}]}]}))
            with self.assertRaisesRegex(ValueError,'digest'):load_documents([root])

    def test_another_share_is_not_qualified_from_cache(self):
        body=b'IE00BDBRDM35\nCurrency Hedged: No';url='https://issuer.test/doc'
        doc={'isin':self.ISIN,'sourceUrl':url,'requestedUrl':url,'checkedAt':'2026-09-01T10:00:00+00:00','body':body,'sha256':hashlib.sha256(body).hexdigest()}
        values,errors=replay({'isin':self.ISIN,'listings':[]},{(self.ISIN,url):doc})
        self.assertEqual(values,{});self.assertTrue(errors)

    def test_a_known_contradiction_requires_both_sources_to_agree(self):
        source={'isin':self.ISIN,'urls':['https://one.test/doc','https://two.test/doc'],'qualificationHolds':[{'field':'pea','sources':[{'sourceUrl':'https://one.test/doc'},{'sourceUrl':'https://two.test/doc'}]}]}
        def one_unavailable(url):
            if 'two.test' in url:raise ValueError('HTTP 403')
            return (self.ISIN+'\nEligible PEA: No').encode()
        values,errors=collect(source,dt.datetime.now(dt.timezone.utc),fetch=one_unavailable)
        self.assertNotIn('pea',values);self.assertTrue(any(e.get('qualificationRequired') for e in errors))
        values,errors=collect(source,dt.datetime.now(dt.timezone.utc),fetch=lambda _:(self.ISIN+'\nEligible PEA: Yes').encode())
        self.assertIs(values['pea']['value'],True);self.assertFalse(any(e.get('qualificationRequired') for e in errors))


if __name__=='__main__':unittest.main()
