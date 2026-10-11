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

if __name__=='__main__': unittest.main()
