"""TR redirect identity, live HTML replay and exact last-good preservation."""
import copy
import pathlib
import unittest
import urllib.request
from unittest.mock import patch
from broker_profile_tr import TITLES, article_id, same_article, validate_article
from broker_document_sources import SourceDocument
from broker_profiles import SOURCES as PROFILE_SOURCES
from broker_tariff_extensions import SOURCES, SUPPLEMENT_SOURCES
from broker_profile_discovery import allowed
from collect_broker_tariffs import fetch_content, collect
from data_automation import ResponseFormatError
from issuer_documents import download

FIXTURES = pathlib.Path(__file__).parent / 'fixtures'
ORDER = SOURCES['tr']


class TradeRepublicIdentityTests(unittest.TestCase):
    def test_same_id_slug_rotation_only(self):
        self.assertTrue(same_article(ORDER, 'https://support.traderepublic.com/fr-fr/784'))
        self.assertTrue(same_article(ORDER, ORDER.replace('Are-there-commissions-for-order-execution', 'nouveau-titre')))
        for target in ['https://traderepublic.com/support',
                       'https://traderepublic.com/fr-fr/support?articleId=784',
                       ORDER.replace('/fr-fr/', '/fr-be/'),
                       ORDER.replace('/784-', '/3459-'),
                       ORDER.replace('https:', 'http:'),
                       ORDER.replace('support.', 'evil.'),
                       ORDER.replace('support.', 'user@support.'),
                       ORDER.replace('.com/', '.com:444/'),
                       ORDER.replace('/fr-fr/', '/fr-fr/%2e%2e/'),
                       ORDER + '?redirect=1', 'https://[invalid/']:
            with self.subTest(target=target):
                self.assertFalse(same_article(ORDER, target))
        self.assertEqual(article_id(PROFILE_SOURCES['trFxRules']['url']), '319')

    def test_webview_scope_is_exact_and_never_allows_generic_support(self):
        for identity in TITLES:
            url = 'https://support.traderepublic.com/fr-fr/' + identity
            self.assertTrue(allowed('tr', url))
            self.assertTrue(allowed('tr', url + '?web_view=true'))
            for query in ['?web_view=false', '?web_view=true&redirect=1', '?foo=bar']:
                self.assertFalse(allowed('tr', url + query))
        self.assertFalse(allowed('tr', 'https://traderepublic.com/support'))
        self.assertFalse(allowed('tr', 'https://traderepublic.com/fr-fr/support?articleId=784'))
        self.assertFalse(allowed('tr', 'https://assets.traderepublic.com/assets/files/CA_FR-en-fr.pdf?web_view=true'))

    def test_redirect_handler_rejects_before_following(self):
        # Exercise download's real redirect handler without external requests.
        def build(*handlers):
            redirect = next(h for h in handlers if isinstance(h, urllib.request.HTTPRedirectHandler))
            class Opener:
                def open(self, request, **kwargs):
                    return redirect.redirect_request(request, None, 302, 'Found', {}, 'https://traderepublic.com/support')
            return Opener()
        with patch('issuer_documents.urllib.request.build_opener', side_effect=build):
            with self.assertRaisesRegex(ResponseFormatError, 'Redirect outside'):
                download(ORDER, url_validator=lambda target: same_article(ORDER, target), max_attempts=1)

    def test_known_live_html_identity_replay(self):
        for key, filename in [('tr_direct', 'tr_direct.txt'), ('tr_garde_cto', 'tr_garde_cto.txt'), ('tr_transfer_cto', 'tr_transfer_cto.txt')]:
            url = SUPPLEMENT_SOURCES[key][2]
            raw = (FIXTURES/'broker-tariffs'/filename).read_text()
            with self.subTest(key=key), patch('collect_broker_tariffs.download', return_value=(raw.encode(), url)):
                document = fetch_content(url)
                self.assertEqual(document.source_url, url)
                self.assertEqual(document, raw)
        url = PROFILE_SOURCES['trFxRules']['url']
        raw = (FIXTURES/'broker-profiles/trFxRules.txt').read_text()
        with patch('collect_broker_tariffs.download', return_value=(raw.encode(), url)) as mocked:
            self.assertEqual(fetch_content(url), raw)
            validator = mocked.call_args.kwargs['url_validator']
            self.assertTrue(validator(url))
            self.assertFalse(validator('https://traderepublic.com/support'))

    def test_generic_http_200_wrong_title_locale_and_canonical_cannot_qualify(self):
        clause = (FIXTURES/'broker-tariffs/tr_fee.txt').read_text()
        good = f'<html><body><h1>{TITLES["784"]}</h1><p>{clause}</p></body></html>'
        validate_article(ORDER, ORDER, good)
        invalid = [good.replace(TITLES['784'], 'Assistance'),
                   good.replace('<h1>', '<h2>').replace('</h1>', '</h2>'),
                   good.replace('</body>', f'<h1>{TITLES["784"]}</h1></body>'),
                   good.replace('</body>', '<link rel="canonical" href="https://traderepublic.com/support"></body>')]
        for raw in invalid:
            with self.subTest(raw=raw[:80]), patch('collect_broker_tariffs.download', return_value=(raw.encode(), ORDER)):
                with self.assertRaises(ResponseFormatError): fetch_content(ORDER)
        with patch('collect_broker_tariffs.download', return_value=(good.encode(), ORDER.replace('/fr-fr/', '/fr-be/'))):
            with self.assertRaises(ResponseFormatError): fetch_content(ORDER)

    def test_all_eight_failures_preserve_values_hashes_refs_and_source_clocks(self):
        previous = {'brokers': {'tr': {
            'values': {'minimum': 1}, 'checkedAt': '2026-11-01', 'sha256': 'old-tariff',
            'sourceUrl': ORDER,
            'fields': {field: {'values': {'fee': 0}, 'checkedAt': '2026-11-01', 'sha256': field}
                       for field in ('directPrice', 'gardeCto', 'sortantCto')},
            'profile': {field: {'status': 'confirmé', 'checkedAt': '2026-11-01', 'sha256': field,
                               'refs': [{'document': 'trContract', 'sourceUrl': PROFILE_SOURCES['trContract']['url'], 'sha256': 'old-ref'}]}
                        for field in ('dca', 'pme', 'change', 'garde')}
        }}}
        def unavailable(url):
            raise ResponseFormatError('Redirect outside official broker scope: https://traderepublic.com/support')
        result, failures, valid = collect(copy.deepcopy(previous), '2026-11-07', unavailable)
        expected = {'tr', 'tr_direct', 'tr_garde_cto', 'tr_transfer_cto',
                    'tr:profile:dca', 'tr:profile:pme', 'tr:profile:change', 'tr:profile:garde'}
        self.assertTrue(expected <= failures.keys())
        self.assertNotIn('tr', valid)
        self.assertEqual(result['brokers'], previous['brokers'])

    def test_recovery_uses_actual_url_without_changing_direct_price(self):
        from broker_tariff_extensions import parse
        url = 'https://support.traderepublic.com/fr-fr/784'
        raw = f'<html><body><h1>{TITLES["784"]}</h1><p>' + (FIXTURES/'broker-tariffs/tr_fee.txt').read_text() + '</p></body></html>'
        with patch('collect_broker_tariffs.download', return_value=(raw.encode(), url)):
            document = fetch_content(ORDER)
        observation = parse('tr', document, '2026-11-07')
        self.assertEqual(document.source_url, url)
        self.assertEqual(observation['values'], {'minimum': 1})
        self.assertNotIn('directPrice', observation['fields'])


if __name__ == '__main__':
    unittest.main()
