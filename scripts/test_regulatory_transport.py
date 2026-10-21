import http.client
import unittest
from unittest.mock import patch
from collect_regulatory_data import fetch_publication, BASE, collect, SOURCES
import test_regulatory_data as fixtures_module


class RegulatoryTransport(unittest.TestCase):
    def test_reset_retries_with_bounded_download_then_keeps_xml_validation(self):
        with patch('issuer_documents.urllib.request.build_opener') as make, patch('issuer_documents.time.sleep') as sleep:
            response = make.return_value.open.return_value.__enter__.return_value
            response.read.return_value = fixtures_module.RegulatoryTests().raw('livret')
            make.return_value.open.side_effect = [http.client.RemoteDisconnected('closed'), make.return_value.open.return_value]
            raw = fetch_publication(BASE+'F2365.xml')
            self.assertEqual(raw, fixtures_module.RegulatoryTests().raw('livret'))
            self.assertEqual(make.return_value.open.call_count, 2)
            self.assertEqual(sleep.call_count, 1)
        with self.assertRaises(ValueError): fetch_publication('https://example.org/F2365.xml')

    def test_exhaustion_preserves_dates_and_does_not_block_other_parameters(self):
        fixtures = fixtures_module.RegulatoryTests()
        urls = {BASE+i+'.xml':fixtures.raw(name) for name,(i,_,_) in SOURCES.items()}
        baseline, errors = collect({'sources':{}}, urls.__getitem__, fixtures_module.TODAY)
        self.assertFalse(errors)
        def fetch(url):
            if url == BASE+'F2365.xml': raise http.client.RemoteDisconnected('offline')
            return urls[url]
        updated, errors = collect(baseline, fetch, '2026-10-21')
        self.assertEqual(updated['sources']['livret'], baseline['sources']['livret'])
        self.assertIn('livret', errors)
        self.assertEqual(updated['sources']['pea']['checkedAt'], '2026-10-21')


if __name__ == '__main__': unittest.main()
