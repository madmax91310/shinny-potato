"""Stable published FAQ evidence, exact article identity and restricted endpoint."""
import json
import unittest
from broker_public_faq import PREFIX, render_answer, read_answer

class Response:
    def __init__(self,payload,url):self.payload=payload;self.url=url
    def __enter__(self):return self
    def __exit__(self,*args):pass
    def geturl(self):return self.url
    def read(self,limit):return json.dumps(self.payload).encode()[:limit]

class PublicFAQTests(unittest.TestCase):
    def test_stable_evidence_ignores_telemetry_and_escapes_html(self):
        payload={'id':123,'question':'Q <script>','answer':'First & second\n\nThird','feedback':1}
        expected=render_answer(payload,'123')
        payload['feedback']=7
        self.assertEqual(render_answer(payload,'123'),expected)
        self.assertIn('&lt;script&gt;',expected)
        self.assertIn('<p>First &amp; second</p><p>Third</p>',expected)
    def test_missing_or_wrong_article_never_qualifies(self):
        for payload in [{'id':321,'question':'Q','answer':'A'}, {'id':123,'question':'Q'}, {'id':123,'question':'Q','answer':''}]:
            with self.assertRaises(ValueError):render_answer(payload,'123')
    def test_reads_only_known_public_endpoint_and_article(self):
        def opener(request,timeout):
            self.assertEqual(request.get_method(),'POST')
            self.assertEqual(json.loads(request.data),{'question_id':'123'})
            self.assertEqual(timeout,25)
            return Response({'id':123,'question':'Q','answer':'A'},request.full_url)
        self.assertIn('<p>A</p>',read_answer(PREFIX+'123',opener))
        for url in [PREFIX+'123?other=1','https://example.org/123',PREFIX+'../123']:
            with self.assertRaises(ValueError):read_answer(url,opener)
    def test_redirect_rejected(self):
        with self.assertRaises(ValueError):
            read_answer(PREFIX+'123',lambda *a,**k:Response({},'https://example.org/'))

if __name__=='__main__':unittest.main()
