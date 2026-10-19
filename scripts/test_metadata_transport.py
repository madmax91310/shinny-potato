import unittest
from urllib.error import HTTPError
from metadata_transport import MetadataTransport


class MetadataTransportTests(unittest.TestCase):
    def setUp(self):
        self.now=0;self.calls=[]
        self.transport=MetadataTransport(interval=1,cooldown=300,clock=lambda:self.now,wait=self.advance)

    def advance(self,seconds):self.now+=seconds

    def fetch(self,url,**kwargs):self.calls.append((url,self.now));return b'response'

    def test_one_host_has_a_request_cadence(self):
        self.transport.read('https://issuer.test/one',self.fetch)
        self.transport.read('https://issuer.test/two',self.fetch)
        self.assertEqual([time for _,time in self.calls],[0,1])

    def test_source_refusal_does_not_repeat_for_each_share(self):
        for code in [403,429]:
            with self.subTest(code=code):
                host=f'https://issuer{code}.test/'
                def refuse(url):raise HTTPError(url,code,'refused',{},None)
                with self.assertRaises(HTTPError):self.transport.read(host+'one',refuse)
                with self.assertRaisesRegex(ValueError,'cooldown'):self.transport.read(host+'two',self.fetch)
                self.transport.read('https://other.test/one',self.fetch)
                self.advance(301)
                self.assertEqual(self.transport.read(host+'three',self.fetch),b'response')

    def test_missing_document_does_not_block_other_shares(self):
        def absent(url):raise HTTPError(url,404,'missing',{},None)
        with self.assertRaises(HTTPError):self.transport.read('https://issuer.test/one',absent)
        self.assertEqual(self.transport.read('https://issuer.test/two',self.fetch),b'response')

    def test_unresponsive_host_does_not_delay_every_instrument(self):
        def timeout(url):raise TimeoutError('timed out')
        for i in range(3):
            with self.assertRaises(TimeoutError):self.transport.read(f'https://issuer.test/{i}',timeout)
        with self.assertRaisesRegex(ValueError,'cooldown'):self.transport.read('https://issuer.test/four',self.fetch)
        self.assertEqual(self.transport.read('https://other.test/one',self.fetch),b'response')
        self.advance(301)
        self.assertEqual(self.transport.read('https://issuer.test/recovered',self.fetch),b'response')
        self.assertEqual(self.transport.hosts['issuer.test']['failures'],0)


if __name__=='__main__':unittest.main()
