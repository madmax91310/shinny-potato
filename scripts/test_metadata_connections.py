import datetime as dt
import json
from pathlib import Path
import unittest
from collect_instrument_metadata import collect,fortuneo_reference_urls,invesco_listing_rows,borsa_listing_rows,euronext_listing_rows

FIX=Path(__file__).with_name('fixtures')/'metadata-connections'
class ConnectionsTests(unittest.TestCase):
 def test_french_invesco_listing_route_is_not_a_characteristics_document(self):
  from collect_instrument_metadata import parse_listings
  isin='IE000L2SA8K5'
  url=f'https://dng-api.invesco.com/cache/v1/accounts/fr_FR/shareclasses/{isin}?expand=marketdata&idType=isin&variationType=exchangeTradingInformationWithMarketData'
  body=(FIX/'invesco-IE000L2SA8K5-listings-fr.json').read_bytes()
  rows=parse_listings(body,{'isin':isin},url,'2026-10-29')
  self.assertEqual(len(rows),5)
  self.assertIn('GBX',[r['currency']for r in rows])
  values,errors=collect({'isin':isin,'urls':[url]},dt.datetime(2026,10,29,tzinfo=dt.timezone.utc),lambda _:body)
  self.assertEqual(errors,[]);self.assertEqual(set(values),{'listings'})
  self.assertEqual(values['listings']['sourceUrl'],url)
  self.assertEqual(parse_listings(b'{}',{'isin':isin},f'https://dng-api.invesco.com/cache/v1/accounts/fr_FR/shareclasses/{isin}?idType=isin','2026-10-29'),[])
  for wrong in [url.replace(isin,'IE000OTHER00'),url.replace('fr_FR','de_DE'),url.replace('https:','http:'),url+'#other',url.replace('exchangeTradingInformationWithMarketData','generalSecurityInformation')]:
   with self.subTest(wrong=wrong),self.assertRaises(ValueError):invesco_listing_rows(body,isin,wrong)
 def test_wisdomtree_paris_listings_use_exchange_identity_without_price_or_other_market_renewal(self):
  import copy
  from collect_instrument_metadata import merge_field_observation
  sources=json.loads((FIX.parents[1]/'instrument-metadata-sources.json').read_text())['instruments']
  for isin,ticker in [('JE00BN7KB334','NGASP'),('GB00B15KXV33','CRUDP'),('JE00BN7KB664','WEATP')]:
   url=f'https://live.euronext.com/en/product/etfs/{isin}-XPAR'
   source=next(s for s in sources if s['isin']==isin)
   self.assertIn(url,source['urls'],'The generator must retain the ordinary collection route')
   body=(FIX/f'euronext-{isin}.html').read_bytes()
   values,errors=collect({'isin':isin,'urls':[url]},dt.datetime(2026,10,29,tzinfo=dt.timezone.utc),lambda _:body)
   self.assertEqual(errors,[]);self.assertEqual(set(values),{'listings'})
   row=values['listings']['value'][0]
   self.assertEqual((row['ticker'],row['mic'],row['currency']),(ticker,'XPAR','EUR'))
   self.assertNotIn('price',row);self.assertNotIn('symbol',row,'Exchange ticker is not a newly certified vendor alias')
   previous={'checkedAt':'2026-10-21','value':[{'ticker':'OTHER','mic':'XLON','currency':'USD','checkedAt':'2026-10-21'}]}
   original=copy.deepcopy(previous);merged=merge_field_observation('listings',previous,values['listings'])
   self.assertEqual(previous,original)
   self.assertEqual(next(r for r in merged['value']if r['mic']=='XLON')['checkedAt'],'2026-10-21')
   self.assertEqual(next(r for r in merged['value']if r['mic']=='XPAR')['checkedAt'],'2026-10-29')
   with self.assertRaises(ValueError):euronext_listing_rows(body,'FR0011550185',url)
   with self.assertRaises(ValueError):euronext_listing_rows(body,isin,url.replace('XPAR','XAMS'))

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
  self.assertEqual(borsa_listing_rows(body,'IE00B4K6B022'),[],'Fund denomination is not evidence of trading currency')
  explicit=body.replace(b'Currency Denomination',b'Trading Currency')
  self.assertEqual(borsa_listing_rows(explicit,'IE00B4K6B022')[0]['currency'],'EUR')
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
  from unittest.mock import patch
  with patch('collect_instrument_metadata.fetch_document',side_effect=lambda url,*a,**k:(body,new if url==old else other)):
   values,errors=collect(source,dt.datetime(2026,10,19,tzinfo=dt.timezone.utc))
  self.assertIs(values['pea']['value'],False)
  self.assertFalse(any(e.get('qualificationRequired')for e in errors))

 def test_lg_wrapped_london_venue_requires_own_share_on_each_row(self):
  from collect_instrument_metadata import scoped_supplement_listings
  for isin,ticker,symbol in [('IE00BF0M2Z96','BATT','BATT.L'),('IE00BK5BCD43','AIAI','LGAIAI.L')]:
   text=(FIX/(isin+'-listing-section.txt')).read_text();rows=scoped_supplement_listings(text,isin)
   self.assertIn((ticker,'USD',symbol),[(r['ticker'],r['currency'],r['symbol'])for r in rows])
   self.assertEqual(scoped_supplement_listings(text,'IE00BK5BQT80'),[])
   self.assertEqual(scoped_supplement_listings(text.replace('London Stock','OTHER EXCHANGE'),isin),[])
 def test_dws_own_identity_is_separate_from_constituent_isins(self):
  from collect_instrument_metadata import dws_factsheet_listings
  isin='IE0006WW1TQ4';text=(FIX/(isin+'-listing-section.txt')).read_text();rows=dws_factsheet_listings(text,isin)
  self.assertIn(('XSWX','EXUS','CHF','EXUS.S'),[(r['mic'],r['ticker'],r['currency'],r['symbol'])for r in rows])
  self.assertEqual(dws_factsheet_listings(text,'CH0038863350'),[])
  self.assertEqual(dws_factsheet_listings(text.replace('ISIN','UNLABELLED',1),isin),[])
