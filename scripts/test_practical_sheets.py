import io
import os
import urllib.error
import json
import unittest
from unittest.mock import patch
import collect_practical_sheets as c

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
