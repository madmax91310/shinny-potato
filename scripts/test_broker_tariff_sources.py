"""Catalogue rotation, official host bounds and last-good recovery."""
import copy
import pathlib
import unittest
from unittest.mock import patch
from broker_document_sources import (CATALOGUES, DocumentResolver, SourceDocument,
                                     XTB_TARIFF, XTB_CATALOGUE, official_link, xtb_tariff_url)
from collect_broker_tariffs import collect, fetch_content, SOURCES
from broker_profiles import parse

FIXTURES = pathlib.Path(__file__).parent / 'fixtures/broker-tariffs'
TODAY = '2026-10-08'

XTB_CDN = ('https://xas-new-cdn.xtb.com/file/0104/60/'
           '9eed09f6-8ad0-4895-bb8f-93dc9d02029f/table-des-frais-et-commissions-052026.pdf')


class XtbDocumentTests(unittest.TestCase):
    def test_icon_accessible_name_and_legacy_text_both_find_exact_tariff(self):
        config = CATALOGUES[XTB_TARIFF]
        actual = (FIXTURES/'xtb-catalogue.html').read_text()
        self.assertEqual(official_link(actual, config, TODAY), XTB_TARIFF)
        self.assertEqual(official_link(f'<a href="{XTB_TARIFF}">TABLE DES FRAIS ET COMMISSIONS</a>', config), XTB_TARIFF)
        self.assertEqual(official_link(actual + actual, config), XTB_TARIFF)
        # A nearby heading is not enough to qualify an unnamed download link.
        with self.assertRaises(ValueError):
            official_link(actual.replace('aria-label=', 'data-label='), config)
        # Accessible-name discovery is deliberately scoped to XTB.
        with self.assertRaises(ValueError):
            official_link('<a href="/files/tarifs_fortuneo.pdf" aria-label="Conditions tarifaires en vigueur"></a>', CATALOGUES[SOURCES['fortuneo']])

    def test_contradictory_names_and_distinct_documents_are_rejected(self):
        config = CATALOGUES[XTB_TARIFF]
        for text, label in [('Table des frais et commissions', 'Archives'),
                            ('Archives', 'Table des frais et commissions')]:
            with self.subTest(text=text), self.assertRaisesRegex(ValueError, 'contradictoires'):
                official_link(f'<a href="{XTB_TARIFF}" aria-label="{label}">{text}</a>', config)
        with self.assertRaisesRegex(ValueError, 'ambiguë'):
            official_link(f'<a href="{XTB_TARIFF}">Table des frais et commissions</a>'
                          f'<a href="{XTB_CDN}">Table des frais et commissions</a>', config)

    def test_french_tariff_url_boundaries(self):
        for good in (XTB_TARIFF, XTB_CDN, XTB_CDN.replace('052026', '112026'),
                     XTB_TARIFF.replace('www.xtb.com', 'xtb.com:443')):
            with self.subTest(url=good): self.assertTrue(xtb_tariff_url(good))
        bad = [XTB_CDN.replace('https:', 'http:'), XTB_CDN.replace('xtb.com', 'xtb.com.evil.test'),
               XTB_CDN.replace('xas-new-cdn.xtb.com', 'user@xas-new-cdn.xtb.com'),
               XTB_CDN.replace('xas-new-cdn.xtb.com', 'xas-new-cdn.xtb.com:8443'),
               XTB_CDN.replace('xas-new-cdn.xtb.com', 'xas-new-cdn.xtb.com:bad'),
               XTB_CDN.replace('table-des-frais-et-commissions', 'informations-generales'),
               XTB_TARIFF.replace('/fr/', '/en/'), XTB_CDN+'?login=1', XTB_CDN+'#archive',
               XTB_CDN.replace('/file/', '/file/../file/'), XTB_CDN.replace('/file/', '/%66ile/'),
               'https://[invalid/']
        for url in bad:
            with self.subTest(url=url):
                self.assertFalse(xtb_tariff_url(url))
                with self.assertRaises(ValueError):
                    official_link(f'<a href="{url}" aria-label="Table des frais et commissions"></a>', CATALOGUES[XTB_TARIFF])

    def test_download_receives_guard_for_each_redirect_and_final_url(self):
        def download(url, **kwargs):
            guard = kwargs['url_validator']
            self.assertTrue(guard(XTB_TARIFF))
            self.assertTrue(guard(XTB_CDN))
            self.assertFalse(guard('https://example.com/table-des-frais-et-commissions-052026.pdf'))
            self.assertFalse(guard(XTB_CDN.replace('table-des-frais-et-commissions', 'other')))
            return b'%PDF-proof', XTB_CDN
        with patch('collect_broker_tariffs.download', side_effect=download), patch('collect_broker_tariffs.pdf_text', return_value='proof'):
            self.assertEqual(fetch_content(XTB_TARIFF).source_url, XTB_CDN)
        with patch('collect_broker_tariffs.download', return_value=(b'<html></html>', XTB_CATALOGUE)) as fetch:
            fetch_content(XTB_CATALOGUE)
            guard = fetch.call_args.kwargs['url_validator']
            self.assertTrue(guard(XTB_CATALOGUE))
            self.assertFalse(guard('https://example.com/fr/informations-legales'))

    def test_resolver_records_actual_source_and_rejects_wrong_final_source(self):
        html = (FIXTURES/'xtb-catalogue.html').read_text()
        for final in (XTB_CDN, 'https://example.com/tariff.pdf'):
            def fetch(url):
                return html if url == XTB_CATALOGUE else SourceDocument('proof', final)
            resolver = DocumentResolver(fetch, TODAY)
            if final == XTB_CDN:
                result = resolver(XTB_TARIFF)
                self.assertEqual((result.source_url, result.discovery_url), (XTB_CDN, XTB_CATALOGUE))
                self.assertEqual(resolver.report[XTB_TARIFF]['mode'], 'catalogue')
            else:
                with self.assertRaisesRegex(ValueError, 'Source finale'): resolver(XTB_TARIFF)

    def test_unique_valid_date_and_no_regression(self):
        from broker_tariff_extensions import parse as tariff
        text = (FIXTURES/'xtb.txt').read_text()
        previous = {'asOf': '2026-09-30'}
        self.assertEqual(tariff('xtb', text, '2026-11-17', previous)['asOf'], '2026-09-30')
        for altered in [text.replace('En date du', 'Date'),
                        text.replace('30/09/2026', '31/09/2026'),
                        text.replace('30/09/2026', '30/09/2025'),
                        text.replace('30/09/2026', '30/09/2027'),
                        text+'\nEn date du 30/09/2026', text+'\nEn date du 01/10/2026']:
            with self.subTest(text=altered[-60:]), self.assertRaises(ValueError):
                tariff('xtb', altered, '2026-11-17', previous)

    def test_catalogue_outage_does_not_allow_bad_previous_or_final_provenance(self):
        from data_automation import ResponseFormatError
        calls = []
        def fetch(url):
            calls.append(url)
            if url == XTB_CATALOGUE: raise ConnectionResetError('offline catalogue')
            return SourceDocument('proof', 'https://example.com/tariff.pdf')
        for previous in (XTB_CDN, XTB_CDN+'?login=1'):
            calls.clear()
            with self.subTest(previous=previous), self.assertRaises(ValueError):
                DocumentResolver(fetch, TODAY, {XTB_TARIFF: previous})(XTB_TARIFF)
            self.assertNotIn(XTB_TARIFF, calls)
        def rejected_redirect(url):
            calls.append(url)
            if url == XTB_CATALOGUE: raise ConnectionResetError('offline catalogue')
            raise ResponseFormatError('Redirect outside official broker scope')
        calls.clear()
        with self.assertRaises(ResponseFormatError):
            DocumentResolver(rejected_redirect, TODAY, {XTB_TARIFF: XTB_CDN})(XTB_TARIFF)
        self.assertNotIn(XTB_TARIFF, calls)

    def test_current_document_failure_never_uses_previous_pdf(self):
        from broker_tariff_extensions import parse as tariff
        previous = tariff('xtb', (FIXTURES/'xtb.txt').read_text(), TODAY)
        previous['sourceUrl'] = XTB_CDN
        current = XTB_TARIFF.replace('052026', '112026')
        html = f'<a href="{current}" aria-label="Table des frais et commissions"></a>'
        for mode in ('offline', 'changed', 'missing', 'ambiguous', 'older'):
            calls = []
            def fetch(url):
                calls.append(url)
                if url == XTB_CATALOGUE:
                    if mode == 'missing': return '<html></html>'
                    if mode == 'ambiguous': return html + f'<a href="{XTB_TARIFF}">Table des frais et commissions</a>'
                    return html
                if url == current:
                    if mode == 'changed': return SourceDocument('Unrelated product', XTB_CDN)
                    if mode == 'older': return SourceDocument((FIXTURES/'xtb.txt').read_text().replace('30/09/2026', '30/09/2025'), XTB_CDN)
                    raise ValueError('HTTP 503')
                raise ValueError('Unrelated source')
            result, failures, valid = collect({'brokers': {'xtb': copy.deepcopy(previous)}}, '2026-11-17', fetch)
            with self.subTest(mode=mode):
                self.assertNotIn('xtb', valid)
                self.assertIn('xtb', failures)
                self.assertEqual(result['brokers']['xtb'], previous)
                self.assertNotIn(XTB_CDN, calls)
                self.assertNotIn(XTB_TARIFF, calls)

    def test_xtb_success_does_not_hide_bourso_network_or_bd_cash_failure(self):
        from broker_profiles import SOURCES as profiles
        previous_cash = {'checkedAt': '2026-11-09', 'copy': {'full': 'Previous qualified cash observation'}}
        previous_bourso = {'checkedAt': '2026-11-09', 'copy': {'full': 'Previous qualified tariff'}}
        baseline = {'brokers': {'bourso': copy.deepcopy(previous_bourso),
                                'bd': {'profile': {'cash': copy.deepcopy(previous_cash)}}}}
        def fetch(url):
            if url == XTB_CATALOGUE: return (FIXTURES/'xtb-catalogue.html').read_text()
            if url == XTB_TARIFF: return SourceDocument((FIXTURES/'xtb.txt').read_text(), XTB_CDN)
            if url == SOURCES['bd']: return (FIXTURES/'bd-synthetic.txt').read_text()
            if url == CATALOGUES[profiles['bdContract']['url']]['page']:
                return (f'<a href="{profiles["bdContract"]["url"]}">Conditions Générales courantes</a>'
                        f'<a href="{SOURCES["bd"]}">Tarification 0,99 €</a>')
            if url in (profiles['bdPea']['url'], profiles['bdCto']['url'],
                       profiles['bdTariffPage']['url'], profiles['bdContract']['url']):
                return '<html><body>PEA et compte titres. Aucune clause relative aux espèces.</body></html>'
            raise ConnectionResetError('Connection reset by peer')
        result, failures, valid = collect(baseline, '2026-11-17', fetch)
        self.assertIn('xtb', valid)
        self.assertNotIn('xtb', failures)
        self.assertEqual(result['brokers']['xtb']['checkedAt'], '2026-11-17')
        self.assertEqual(result['brokers']['xtb']['sourceUrl'], XTB_CDN)
        for field in ('change', 'garde', 'sortant'):
            self.assertEqual(result['brokers']['xtb']['fields'][field]['discoveryUrl'], XTB_CATALOGUE)
        self.assertIn('Connection reset', failures['bourso'])
        self.assertIn('Clause officielle absente', failures['bd:profile:cash'])
        self.assertEqual(result['brokers']['bourso'], previous_bourso)
        self.assertEqual(result['brokers']['bd']['profile']['cash'], previous_cash)


class DocumentSourcesTests(unittest.TestCase):
    def test_cto_column_continuation_preserves_physical_page(self):
        from broker_profiles import SOURCES as profile_sources, clean
        url=profile_sources['caCtoContract']['url']
        clause='Pour les opérations donnant lieu à des règlements en devises'
        with patch('collect_broker_tariffs.download',return_value=(b'%PDF-test',url)), patch('collect_broker_tariffs.pdf_text',side_effect=[
                'Legacy contract, three columns',
                'Page un colonne un\f'+clause+'\f',
                'Page un colonne deux\f suite de la clause\f',
                'Page un colonne trois\fArticle suivant\f']) as extract:
            document=fetch_content(url)
        self.assertIn(clause+' suite de la clause',clean(document.split('\f')[1]))
        self.assertNotIn(clause,document.split('\f')[0])
        self.assertEqual(document.source_url,url)
        self.assertEqual([call.kwargs.get('crop') for call in extract.call_args_list],[None,(17,70,181,666),(199,70,181,666),(381,70,181,666)])

    def test_current_cto_single_column_layout_is_not_cropped(self):
        from broker_profiles import SOURCES as profile_sources
        url=profile_sources['caCtoContract']['url']
        text='CONVENTION DE COMPTE-TITRES ORDINAIRE\f6.2 Les règlements en devises étrangères\nCurrent clause'
        with patch('collect_broker_tariffs.download',return_value=(b'%PDF-test',url)), patch('collect_broker_tariffs.pdf_text',return_value=text) as extract:
            document=fetch_content(url)
        self.assertEqual(document,text)
        extract.assert_called_once_with(b'%PDF-test')

    def test_ibkr_retired_french_route_is_not_reused_as_us_market(self):
        import gzip
        from broker_tariff_extensions import parse as tariff
        raw=gzip.decompress((pathlib.Path(__file__).resolve().parents[1]/'reports/data-review-2026-10-23/preuves/ibkr-unified-en.html.gz').read_bytes()).decode()
        current=SOURCES['ibkr'];old='https://www.interactivebrokers.ie/fr/pricing/commissions-stocks-europe.php'
        calls=[]
        def fetch(url):
            calls.append(url)
            if url==current:return raw
            if url==old:raise AssertionError('Retired route serves a different region')
            raise ValueError('Unrelated source outside this regression')
        result,failures,valid=collect({'brokers':{'ibkr':{'sourceUrl':old,'values':{'rate':.05}}}},TODAY,fetch)
        self.assertIn('ibkr',valid)
        self.assertNotIn(old,calls)
        self.assertNotIn('ibkr',failures)
        self.assertEqual(result['brokers']['ibkr']['sourceUrl'],current)
        self.assertEqual(result['brokers']['ibkr']['values'],{'rate':.05,'fixedRate':.05,'directRate':.1,'minimum':1.25,'fixedMinimum':3.,'directMinimum':4.})
        for wrong in [raw.replace('<h3>France</h3>','<h3>Wrong market</h3>'),raw.replace('Monthly Trade Value (EUR)','Monthly Trade Value (USD)'),raw.replace('Minimum per order (shares)','Minimum per order (fractional shares)')]:
            with self.assertRaises(ValueError):tariff('ibkr',wrong,TODAY)

    def test_live_catalogue_links(self):
        expected = {'fortuneo': '/files/tarifs_fortuneo.pdf', 'saxo': '?revision=', 'xtb': 'table-des-frais-et-commissions', 'caidf': '04_2026.pdf'}
        for broker, fragment in expected.items():
            config = CATALOGUES[SOURCES[broker]]
            actual = official_link((FIXTURES / (broker + '-catalogue.html')).read_text(), config, TODAY)
            self.assertIn(fragment, actual)

    def test_regional_cto_contract_follows_current_inventory(self):
        from broker_profiles import SOURCES as profile_sources
        old=profile_sources['caCtoContract']['url']
        config=CATALOGUES[old]
        html=(pathlib.Path(__file__).parent/'fixtures/broker-profiles/caSavingsDocs.txt').read_text()
        self.assertEqual(official_link(html,config,TODAY),old)
        rotated=old.replace('1773337045911','1888888888888')
        self.assertEqual(official_link(html.replace(old,rotated),config,TODAY),rotated)

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
