import datetime as dt
import json
from pathlib import Path
import unittest
from collect_instrument_metadata import collect,fortuneo_reference_urls,invesco_listing_rows,borsa_listing_rows,euronext_listing_rows

FIX=Path(__file__).with_name('fixtures')/'metadata-connections'
class ConnectionsTests(unittest.TestCase):
 def test_discovery_is_exact_and_never_a_tax_statement(self):
  isin='IE00BK5BQT80';url='https://bourse.fortuneo.fr/api/search?term='+isin
  body=(FIX/'fortuneo-discovery.json').read_bytes()
  self.assertEqual(fortuneo_reference_urls(body,isin,url),['https://bourse.fortuneo.fr/trackers/cours-etf-VWCE-IE00BK5BQT80-46'])
  self.assertEqual(fortuneo_reference_urls(body,'IE0003XJA0J9',url.replace(isin,'IE0003XJA0J9')),[])
  with self.assertRaises(ValueError):fortuneo_reference_urls(body,isin,url.replace(isin,'WRONG'))
  empty=json.dumps({'market':{'fortuneo':{'items':[]}}}).encode()
  values,_=collect({'isin':isin,'urls':[url]},dt.datetime(2026,10,19,tzinfo=dt.timezone.utc),lambda _:empty)
  self.assertEqual(values,{})
 def test_discovery_cannot_inject_a_route(self):
  body=json.loads((FIX/'fortuneo-discovery.json').read_text());item=body['market']['fortuneo']['items'][0]
  for key,value in [('codeRef','OTHER'),('mnemo','../VWCE'),('codePlace',True),('type','Action')]:
   with self.subTest(key=key):
    old=item[key];item[key]=value
    self.assertEqual(fortuneo_reference_urls(json.dumps(body).encode(),'IE00BK5BQT80','https://bourse.fortuneo.fr/api/search?term=IE00BK5BQT80'),[]);item[key]=old
 def test_discovered_page_is_fetched_and_qualified_separately(self):
  isin='IE00BK5BQT80';url='https://bourse.fortuneo.fr/api/search?term='+isin
  discovery=(FIX/'fortuneo-discovery.json').read_bytes();body=f'<table><tr><td>ISIN</td><td>{isin}</td></tr><tr><td>PEA</td><td>Non</td></tr></table>'.encode();calls=[]
  def fetch(u):calls.append(u);return discovery if u==url else body
  values,errors=collect({'isin':isin,'urls':[url]},dt.datetime(2026,10,19,tzinfo=dt.timezone.utc),fetch)
  self.assertEqual(len(calls),2);self.assertIs(values['pea']['value'],False);self.assertEqual(errors,[])
  self.assertEqual(values['pea']['sourceUrl'],calls[1]);self.assertNotIn('listings',values)
 def test_invesco_preserves_pence_and_issuer_ticker(self):
  url='https://dng-api.invesco.com/cache/v1/accounts/en_GB/shareclasses/IE000716YHJ7?expand=marketdata&idType=isin&variationType=exchangeTradingInformationWithMarketData'
  body=(FIX/'invesco-listings.json').read_bytes();rows=invesco_listing_rows(body,'IE000716YHJ7',url)
  self.assertIn(('XETR','FWIA','FWIA.DE'),[(r['mic'],r['ticker'],r['symbol'])for r in rows])
  self.assertIn('GBX',[r['currency']for r in rows])
  with self.assertRaises(ValueError):invesco_listing_rows(body,'IE0000QLH0G6',url)
  broken=json.loads(body);broken[0]['listingCurrency']=None
  with self.assertRaises(ValueError):invesco_listing_rows(json.dumps(broken).encode(),'IE000716YHJ7',url)
 def test_exchange_rows_require_currency_and_exact_instrument(self):
  body=(FIX/'borsa-listing.html').read_bytes()
  self.assertEqual(borsa_listing_rows(body,'IE00B4K6B022')[0]['currency'],'EUR')
  self.assertEqual(borsa_listing_rows(body,'FR0011550185'),[])
  self.assertEqual(borsa_listing_rows(body.replace(b'>EUR<',b'><'),'IE00B4K6B022'),[])
 def test_rendered_exchange_identity_is_scoped_and_currency_is_explicit(self):
  body=(FIX/'euronext-listing.html').read_bytes();isin='FR0011550185';url='https://live.euronext.com/en/product/etfs/'+isin+'-XPAR'
  self.assertEqual(euronext_listing_rows(body,isin,url)[0]['ticker'],'ESE')
  with self.assertRaises(ValueError):euronext_listing_rows(body,'FR0011550193',url)
  with self.assertRaises(ValueError):euronext_listing_rows(body.replace(b'>EUR<',b'><'),isin,url)
  with self.assertRaises(ValueError):euronext_listing_rows(body,isin,url.replace('XPAR','XAMS'))
 def test_one_broker_cannot_flip_an_existing_documented_review(self):
  isin='IE00BK5BQT80';body=f'<table><tr><td>ISIN</td><td>{isin}</td></tr><tr><td>PEA</td><td>Oui</td></tr></table>'.encode()
  values,errors=collect({'isin':isin,'urls':['https://bourse.fortuneo.fr/a','https://bourse.fortuneo.fr/b'],'peaExpectation':{'value':False,'sourceUrl':'https://issuer.test/old'}},dt.datetime(2026,10,19,tzinfo=dt.timezone.utc),lambda _:body)
  self.assertNotIn('pea',values);self.assertTrue(any(e.get('qualificationRequired')for e in errors))
 def test_independent_current_agreement_can_update_an_old_review(self):
  isin='IE00BK5BQT80';broker=f'<table><tr><td>ISIN</td><td>{isin}</td></tr><tr><td>PEA</td><td>Oui</td></tr></table>'.encode();issuer=f'{isin}\nEligible PEA: Yes'.encode()
  values,_=collect({'isin':isin,'urls':['https://bourse.fortuneo.fr/a','https://issuer.test/facts'],'peaExpectation':{'value':False}},dt.datetime(2026,10,19,tzinfo=dt.timezone.utc),lambda u:broker if 'fortuneo' in u else issuer)
  self.assertIs(values['pea']['value'],True)
 def test_current_conflict_is_an_immediate_qualification_failure(self):
  isin='IE00BK5BQT80';values,errors=collect({'isin':isin,'urls':['https://a.test','https://b.test']},dt.datetime(2026,10,19,tzinfo=dt.timezone.utc),lambda u:(f'{isin}\nEligible PEA: '+('Yes' if u.endswith('a.test') else 'No')).encode())
  self.assertNotIn('pea',values)
  self.assertTrue(any(e.get('qualificationRequired')for e in errors))
  self.assertEqual(len(next(e['sources']for e in errors if e.get('qualificationRequired'))),2)

 def test_hold_can_follow_a_public_source_redirect(self):
  isin='IE00BK5BQT80';old='https://issuer.test/old';new='https://issuer.test/current';other='https://other.test/facts';body=f'{isin}\nEligible PEA: No'.encode()
  source={'isin':isin,'urls':[old,other],'qualificationHolds':[{'field':'pea','sources':[{'sourceUrl':old,'value':True},{'sourceUrl':other,'value':False}]}]}
  values,errors=collect(source,dt.datetime(2026,10,19,tzinfo=dt.timezone.utc),lambda url:(body,new if url==old else other))
  self.assertIs(values['pea']['value'],False)
  self.assertFalse(any(e.get('qualificationRequired')for e in errors))
