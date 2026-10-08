"""Catalogue rotation, official host bounds and last-good recovery."""
import copy
import pathlib
import unittest
from broker_document_sources import CATALOGUES, DocumentResolver, official_link
from collect_broker_tariffs import collect, SOURCES
from broker_profiles import parse

FIXTURES = pathlib.Path(__file__).parent / 'fixtures/broker-tariffs'
TODAY = '2026-10-08'

class DocumentSourcesTests(unittest.TestCase):
    def test_live_catalogue_links(self):
        expected = {'fortuneo': '/files/tarifs_fortuneo.pdf', 'saxo': '?revision=', 'xtb': 'table-des-frais-et-commissions', 'caidf': '04_2026.pdf'}
        for broker, fragment in expected.items():
            config = CATALOGUES[SOURCES[broker]]
            actual = official_link((FIXTURES / (broker + '-catalogue.html')).read_text(), config, TODAY)
            self.assertIn(fragment, actual)

    def test_regional_future_brochure_not_used_and_current_rotation(self):
        config = CATALOGUES[SOURCES['caidf']]
        html = (FIXTURES / 'caidf-catalogue.html').read_text()
        self.assertEqual(official_link(html, config, TODAY), SOURCES['caidf'])
        future = SOURCES['caidf'].replace('2026', '2027')
        html += f'<a href="{future}">télécharger en pdf</a>'
        self.assertEqual(official_link(html, config, TODAY), SOURCES['caidf'])
        self.assertEqual(official_link(html, config, '2027-04-01'), future)

    def test_rotating_pdf_and_actual_proof_url(self):
        old = SOURCES['saxo']; config = CATALOGUES[old]
        latest = old.replace('2026', '2027')
        calls = []
        def fetch(url):
            calls.append(url)
            if url == config['page']: return f'<a href="{latest}">Brochure tarifaire</a>'
            if url == latest: return (FIXTURES / 'saxo.txt').read_text()
            raise ValueError('old URL should not be downloaded')
        baseline, failures, valid = collect({'brokers': {}}, TODAY, fetch)
        self.assertIn('saxo', valid)
        self.assertEqual(baseline['brokers']['saxo']['sourceUrl'], latest)
        self.assertEqual(baseline['brokers']['saxo']['fields']['change']['sourceUrl'], latest)
        self.assertEqual(baseline['brokers']['saxo']['discoveryUrl'], config['page'])
        self.assertNotIn(old, calls)

    def test_no_old_pdf_after_changed_clause_or_unavailable_current_pdf(self):
        old = SOURCES['saxo']; config = CATALOGUES[old]; latest = old.replace('2026', '2027')
        for content in ['Unrelated product brochure', ValueError('503')]:
            calls = []
            def fetch(url):
                calls.append(url)
                if url == config['page']: return f'<a href="{latest}">Brochure tarifaire</a>'
                if url == latest:
                    if isinstance(content, Exception): raise content
                    return content
                if url == old: return (FIXTURES / 'saxo.txt').read_text()
                raise ValueError('offline')
            previous = {'brokers': {'saxo': {'asOf': '2026-05-05', 'copy': {'full': 'last good'}}}}
            result, failures, valid = collect(copy.deepcopy(previous), TODAY, fetch)
            self.assertNotIn('saxo', valid); self.assertIn('saxo', failures)
            self.assertEqual(result['brokers'], previous['brokers'])
            self.assertNotIn(old, calls)

    def test_download_outage_fallback_and_recovery(self):
        url = SOURCES['fortuneo']; config = CATALOGUES[url]
        def fetch(target):
            if target == config['page']: raise ValueError('502')
            if target == url: raise ValueError('503')
            if target == 'https://www.fortuneo.fr/files/tarifs_fortuneo.pdf': return 'current official brochure'
            raise ValueError('unexpected')
        resolver = DocumentResolver(fetch)
        result = resolver(url)
        self.assertEqual(result.source_url, 'https://www.fortuneo.fr/files/tarifs_fortuneo.pdf')
        self.assertEqual(resolver.report[url]['mode'], 'fallback')
        def recovered(target):
            if target == config['page']: return (FIXTURES / 'fortuneo-catalogue.html').read_text()
            return 'current official brochure'
        resolver = DocumentResolver(recovered); resolver(url)
        self.assertEqual(resolver.report[url]['mode'], 'catalogue')

    def test_catalogue_outage_prefers_last_qualified_rotating_document(self):
        old=SOURCES['saxo']; latest=old.replace('2026','2027'); calls=[]
        def fetch(url):
            calls.append(url)
            if url==latest:return 'last qualified official brochure'
            raise ValueError('502')
        resolver=DocumentResolver(fetch,TODAY,{old:latest})
        self.assertEqual(resolver(old).source_url,latest)
        self.assertNotIn(old,calls)
        resolver=DocumentResolver(fetch,TODAY,{old:latest.replace('www.home.saxo','example.com')})
        with self.assertRaises(ValueError):resolver(old)

    def test_ambiguous_foreign_or_wrong_scope_links_rejected(self):
        config = CATALOGUES[SOURCES['saxo']]
        good = SOURCES['saxo']
        for target in [good.replace('www.home.saxo', 'example.com'), good.replace('fr-fr', 'en-us'), good.replace('https:', 'http:'), good.replace('www.home.saxo', 'user:password@www.home.saxo')]:
            with self.assertRaises(ValueError): official_link(f'<a href="{target}">Brochure tarifaire</a>', config)
        with self.assertRaises(ValueError): official_link(f'<a href="{good}">Brochure tarifaire</a><a href="{good}?new=1">Brochure tarifaire</a>', config)
        with self.assertRaises(ValueError): official_link('<a href="/fund.pdf">Fonds euros</a>', config)

if __name__ == '__main__': unittest.main()
