import io
import pathlib
import os
import sys
import urllib.error
import json
import unittest
from contextlib import redirect_stderr, redirect_stdout
from tempfile import TemporaryDirectory
from unittest.mock import patch
import collect_practical_sheets as c

AMF_ARTICLES = {
    'etf': ("Ce qu'il faut savoir sur les ETF avant d'investir", 'Un ETF suit un indice boursier.'),
    'transfer': ("Réussir le transfert de votre plan d'épargne en actions (PEA)", 'Le transfert du PEA peut prendre du temps.'),
    'bonds': ('Investir dans les obligations', "Le prix des obligations peut baisser quand les taux d'intérêt montent."),
}
AMF_NOTICE = b'''<html lang="fr"><body><main>
<h1>Acc&egrave;s temporairement suspendu</h1>
<p>Un composant logiciel utilis&eacute; par notre site a annonc&eacute; une mise &agrave; jour de s&eacute;curit&eacute; hautement critique.</p>
<p>Seules certaines bases de donn&eacute;es restent accessibles pendant les travaux.</p>
<h1>Access temporarily unavailable</h1>
<p>A software component used on our website has announced a highly critical security update.</p>
<p>Our teams are working to secure the website and restore access.</p>
</main></body></html>'''
AMF_MAINTENANCE = 'AMF : accès temporairement suspendu (avis de maintenance)'

class CollectionTests(unittest.TestCase):
    def test_pdf_policy_ignores_daily_scenarios_but_requires_exact_identity(self):
        config={'kind':'pdf-policy','label':'iBonds','title':'DIC iBonds','markers':['IE000SIZJ2B2','EUR Dist'],'policyPatterns':[r'Objectifs .*?Dépositaire',r'Il n’y a pas de rendement minimum garanti\.']}
        text='IE000SIZJ2B2 EUR Dist document est daté du 09 octobre 2026 Objectifs '+('Obligations euros '*25)+'Dépositaire Il n’y a pas de rendement minimum garanti. Scénario 100 €'
        with patch('collect_scpi.pdf_text',return_value=text):a=c.parse(b'%PDF'+b' '*600,config)
        with patch('collect_scpi.pdf_text',return_value=text.replace('100 €','101 €')):b=c.parse(b'%PDF'+b' '*600,config)
        self.assertEqual(a['contentHash'],b['contentHash'])
        self.assertEqual(a['publishedAt'],'2026-10-09')
        with patch('collect_scpi.pdf_text',return_value=text.replace('Obligations euros','Obligations dollars')):
            changed=c.parse(b'%PDF'+b' '*600,config)
        self.assertNotEqual(a['contentHash'],changed['contentHash'])
        with patch('collect_scpi.pdf_text',return_value=text.replace('IE000SIZJ2B2','IE000WRONG00')):
            with self.assertRaises(ValueError):c.parse(b'%PDF'+b' '*600,config)
        for invalid in [text.replace('Dépositaire','Section manquante'),text.replace('09 octobre 2026','09 octobre 2099')]:
            with patch('collect_scpi.pdf_text',return_value=invalid):
                with self.assertRaises(ValueError):c.parse(b'%PDF'+b' '*600,config)
        with self.assertRaises(ValueError):c.parse(b'<html>'+b' '*600,config)
    def config(self):
        return {'label':'Source test','url':'https://example.org','markers':['ETF','indice']}
    def document(self,extra=''):
        return ('<html><body><main><h1>ETF</h1><p>'+('ETF indice officiel '*40)+extra+'</p></main></body></html>').encode()
    def test_blocking_page_rejected(self):
        with self.assertRaises(ValueError): c.parse(b'access denied'*100,self.config())

    def test_amf_maintenance_requires_both_signatures_on_the_amf_host(self):
        config = json.loads(c.CONFIG.read_text())['etf']
        with self.assertRaisesRegex(ValueError, 'avis de maintenance'):
            c.parse(AMF_NOTICE, config)
        incomplete_notice = (AMF_NOTICE
                             .replace(b'mise &agrave; jour de s&eacute;curit&eacute; hautement critique', b'intervention')
                             .replace(b'highly critical security update', b'maintenance window'))
        for raw, source in [(incomplete_notice + b' ' * 500, config),
                            (AMF_NOTICE, {**config, 'url': 'https://www.amf-france.org.example.com/etf'})]:
            with self.assertRaisesRegex(ValueError, 'Identité du document non confirmée'):
                c.parse(raw, source)

    def test_amf_http_403_preserves_http_diagnostic(self):
        config = json.loads(c.CONFIG.read_text())['bonds']
        refusal = urllib.error.HTTPError(config['url'], 403, 'Forbidden', {}, io.BytesIO(AMF_NOTICE))
        with patch('urllib.request.urlopen', side_effect=refusal) as fetch:
            _, record, error = c.collect('bonds', config, {'contentHash': 'prior'}, '2026-11-19')
        self.assertEqual(error, 'HTTP Error 403: Forbidden')
        self.assertEqual(record['contentHash'], 'prior')
        self.assertEqual(record['status'], 'error')
        fetch.assert_called_once()

    def test_amf_articles_qualify_with_the_original_selectors_and_markers(self):
        configs = json.loads(c.CONFIG.read_text())
        for key, (title, paragraph) in AMF_ARTICLES.items():
            with self.subTest(key=key):
                article = (f'<html><body><article><h1>{title}</h1><p>{paragraph * 20}</p>'
                           '<blockquote>Accès temporairement suspendu. Une mise à jour de sécurité '
                           'hautement critique est annoncée.</blockquote></article></body></html>').encode()
                self.assertEqual(c.parse(article, configs[key])['title'], title)
                neighbour = ('<html><body><article><h1>Présentation de l’AMF</h1><p>'
                             + 'Les missions du régulateur français. ' * 20 + '</p></article></body></html>').encode()
                with self.assertRaisesRegex(ValueError, 'Identité du document non confirmée'):
                    c.parse(neighbour, configs[key])

    def test_partial_refresh_retains_qualified_evidence_for_amf_failures(self):
        configs = {key: config for key, config in json.loads(c.CONFIG.read_text()).items() if key in AMF_ARTICLES}
        previous = {}
        for key, config in configs.items():
            title, paragraph = AMF_ARTICLES[key]
            article = f'<html><body><article><h1>{title}</h1><p>{paragraph * 25}</p></article></body></html>'.encode()
            previous[key] = {**c.parse(article, config), 'label': config['label'], 'sourceUrl': config['url'],
                             'status': 'ok', 'checkedAt': '2026-01-01', 'lastSuccessfulCheckAt': '2026-01-01'}
        responses = {config['url']: AMF_NOTICE for config in configs.values()}
        for index in range(8):
            key = f'valid-{index}'
            configs[key] = {**self.config(), 'url': f'https://example.org/{key}'}
            responses[configs[key]['url']] = self.document(key)

        with TemporaryDirectory() as folder:
            config_path = pathlib.Path(folder) / 'sources.json'
            dest = pathlib.Path(folder) / 'snapshot.json'
            output = pathlib.Path(folder) / 'report.json'
            config_path.write_text(json.dumps(configs))
            dest.write_text(json.dumps({'schemaVersion': 1, 'sources': previous}))
            with (patch.object(c, 'CONFIG', config_path), patch.object(c, 'DEST', dest),
                  patch.object(c, 'REVIEWS', pathlib.Path(folder) / 'reviews.json'),
                  patch.object(c, 'fetch_document', side_effect=responses.__getitem__),
                  patch.object(sys, 'argv', ['collector', '--apply', '--output', str(output)]),
                  redirect_stdout(io.StringIO()) as stdout, redirect_stderr(io.StringIO())):
                self.assertEqual(c.main(), 1)
            snapshot = json.loads(dest.read_text())['sources']
            report = json.loads(output.read_text())

        self.assertEqual(report['sources'], snapshot)
        self.assertEqual(json.loads(stdout.getvalue()), {'collected': 8, 'failed': list(AMF_ARTICLES), 'changed': []})
        for key, prior in previous.items():
            retained = dict(snapshot[key])
            self.assertEqual(retained.pop('status'), 'error')
            self.assertEqual(retained.pop('error'), AMF_MAINTENANCE)
            self.assertGreater(retained.pop('lastAttemptAt'), prior['checkedAt'])
            self.assertEqual(retained, {field: value for field, value in prior.items() if field != 'status'})
        for key in snapshot.keys() - previous.keys():
            self.assertEqual(snapshot[key]['status'], 'ok')
            self.assertEqual(snapshot[key]['contentHash'], c.parse(responses[configs[key]['url']], configs[key])['contentHash'])

    def test_preserve_last_success_on_failure(self):
        previous={'checkedAt':'2026-01-01','contentHash':'abc','title':'Dernière source validée'}
        with patch('urllib.request.urlopen',side_effect=TimeoutError('timeout')):
            _,record,error=c.collect('test',self.config(),previous,'2026-10-10')
        self.assertEqual(record['checkedAt'],'2026-01-01')
        self.assertEqual(record['contentHash'],'abc')
        self.assertEqual(record['lastAttemptAt'],'2026-10-10')
        self.assertEqual(record['status'],'error')
        self.assertTrue(error)
    def test_changed_document_requires_review(self):
        previous={'contentHash':c.parse(self.document(),self.config())['contentHash']}
        with patch('urllib.request.urlopen') as fetch:
            fetch.return_value.__enter__.return_value.read.return_value=self.document('Changement de règles')
            _,record,error=c.collect('test',self.config(),previous,'2026-10-10')
        self.assertIsNone(error)
        self.assertTrue(record['reviewRequired'])
    def test_unchanged_source_keeps_unresolved_review(self):
        previous={'contentHash':c.parse(self.document(),self.config())['contentHash'],'reviewRequired':True}
        with patch('urllib.request.urlopen') as fetch:
            fetch.return_value.__enter__.return_value.read.return_value=self.document()
            _,record,_=c.collect('test',self.config(),previous,'2026-10-10')
        self.assertTrue(record['reviewRequired'])
    def test_review_is_bound_to_exact_content_url_and_date(self):
        with TemporaryDirectory() as folder:
            review=pathlib.Path(folder)/'reviews.json'
            parsed=c.parse(self.document(),self.config())
            approval={'contentHash':parsed['contentHash'],'sourceUrl':self.config()['url'],
                      'reviewedAt':'2026-10-23','evidence':'versioned-review.md'}
            previous={**parsed,'reviewRequired':True,'checkedAt':'2026-10-22'}
            for mutation, expected in [({},False),({'contentHash':'old'},True),
                                       ({'sourceUrl':'https://other.example'},True),
                                       ({'reviewedAt':'2026-10-24'},True)]:
                review.write_text(json.dumps({'test':{**approval,**mutation}}))
                with patch.object(c,'REVIEWS',review),patch.object(c,'fetch_document',return_value=self.document()):
                    _,record,error=c.collect('test',self.config(),previous,'2026-10-23')
                self.assertIsNone(error)
                self.assertEqual(record['reviewRequired'],expected)
            review.write_text(json.dumps({'test':approval}))
            with patch.object(c,'REVIEWS',review),patch.object(c,'fetch_document',return_value=self.document('New policy')):
                _,record,error=c.collect('test',self.config(),previous,'2026-10-23')
            self.assertIsNone(error)
            self.assertTrue(record['reviewRequired'])

    def test_regressing_publication_preserves_last_valid_evidence(self):
        previous={'publishedAt':'2026-10-22','checkedAt':'2026-10-22','contentHash':'valid'}
        with patch.object(c,'fetch_document',return_value=self.document()),patch.object(c,'parse',return_value={'publishedAt':'2026-10-21','contentHash':'old'}):
            _,record,error=c.collect('test',self.config(),previous,'2026-10-23')
        self.assertIn('regression',error)
        self.assertEqual(record['contentHash'],'valid')
        self.assertEqual(record['checkedAt'],'2026-10-22')
        self.assertEqual(record['lastAttemptAt'],'2026-10-23')

    def test_retry_is_bounded_and_does_not_retry_permanent_refusal(self):
        with patch('urllib.request.urlopen',side_effect=TimeoutError('timeout')) as fetch,patch.object(c.time,'sleep') as sleep:
            with self.assertRaises(TimeoutError):c.fetch_document('https://example.org')
        self.assertEqual(fetch.call_count,3)
        self.assertEqual([call.args[0] for call in sleep.call_args_list],[1,2])
        refusal=urllib.error.HTTPError('https://example.org',403,'Forbidden',{},None)
        with patch('urllib.request.urlopen',side_effect=refusal) as fetch,patch.object(c.time,'sleep') as sleep:
            with self.assertRaises(urllib.error.HTTPError):c.fetch_document('https://example.org')
        self.assertEqual(fetch.call_count,1)
        sleep.assert_not_called()

    def test_daily_market_metrics_do_not_change_editorial_hash(self):
        config={**self.config(),'editorialSelector':'.policy','editorialMarkers':['ETF indice']}
        html='<html><body><main><h1>ETF</h1><div class=policy>'+('ETF indice description '*20)+'</div><div class=policy>'+('ETF indice risques '*20)+'</div><div class=nav>{}</div></main></body></html>'
        self.assertEqual(c.parse(html.format('100').encode(),config)['contentHash'],c.parse(html.format('101').encode(),config)['contentHash'])
        with self.assertRaises(ValueError): c.parse(html.replace('class=policy','class=missing').format('100').encode(),config)
    def test_untrusted_forum_author_rejected(self):
        config={**self.config(),'kind':'discourse','author':'Official'}
        raw=json.dumps({'post_stream':{'posts':[{'username':'Someone','admin':False,'cooked':'ETF indice '*100}]}}).encode()
        with self.assertRaises(ValueError): c.parse(raw,config)
    def test_sec_requests_declare_a_contact_user_agent(self):
        agent='Patrimoine et Compagnie contact@example.fr'
        with patch.dict(os.environ,{'SEC_USER_AGENT':agent}):
            self.assertEqual(c.user_agent('https://www.sec.gov/divisions/investment/13ffaq'),agent)
            self.assertEqual(c.user_agent('https://data.sec.gov/x'),agent)
            self.assertIn('Mozilla',c.user_agent('https://www.amf-france.org/x'))
            self.assertIn('Mozilla',c.user_agent('https://notsec.gov.example/x'))
            with patch('urllib.request.urlopen') as fetch:
                fetch.return_value.__enter__.return_value.read.return_value=self.document()
                c.collect('test',{**self.config(),'url':'https://www.sec.gov/x'},{},'2026-10-17')
            self.assertEqual(fetch.call_args[0][0].get_header('User-agent'),agent)
    def test_sec_refuses_missing_or_noreply_contact_before_any_request(self):
        self.assertRegex(c.SEC_CONTACT_USER_AGENT,r'\S+@\S+\.\w+');self.assertNotIn('noreply',c.SEC_CONTACT_USER_AGENT)
        with patch.dict(os.environ,{'SEC_USER_AGENT':''}):
            self.assertEqual(c.user_agent('https://www.sec.gov/x'),c.SEC_CONTACT_USER_AGENT)
        for value in ('EpargnantLibre/1.0 https://github.com/x','EpargnantLibre-Data madmax91310@users.noreply.github.com'):
            with patch.dict(os.environ,{'SEC_USER_AGENT':value}), patch('urllib.request.urlopen') as fetch:
                key,record,error=c.collect('13f',{**self.config(),'url':'https://www.sec.gov/x'},{'checkedAt':'2026-10-14'},'2026-10-18')
                fetch.assert_not_called()
                self.assertIn('SEC_USER_AGENT',error)
                self.assertEqual((record['status'],record['checkedAt']),('error','2026-10-14'))
    def test_http_refusal_keeps_page_title_in_error(self):
        page=b'<html><head><title>SEC.gov | Request Rate Threshold Exceeded</title></head></html>'
        refusal=urllib.error.HTTPError('https://www.sec.gov/x',403,'Forbidden',{},io.BytesIO(page))
        with patch.dict(os.environ,{'SEC_USER_AGENT':'Projet contact@example.fr'}), patch('urllib.request.urlopen',side_effect=refusal):
            _,record,error=c.collect('13f',{**self.config(),'url':'https://www.sec.gov/x'},{},'2026-10-18')
        self.assertEqual(error,'HTTP Error 403: Forbidden (SEC.gov | Request Rate Threshold Exceeded)')
        self.assertEqual(record['error'],error)

if __name__=='__main__': unittest.main()
