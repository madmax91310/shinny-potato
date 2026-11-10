import unittest
from unittest.mock import patch
from refresh_qualified_listings import parse
class QualifiedListings(unittest.TestCase):
 def test_bitwise_binds_share_venue_currency_and_listing_date(self):
  import gzip,json
  from pathlib import Path
  root=Path(__file__).resolve().parents[1]
  source=next(s for s in json.loads((root/'scripts/qualified-listing-sources.json').read_text())['sources'] if s['isin']=='DE000A27Z304')
  body=gzip.decompress((root/'scripts/fixtures/bitwise-paris-20261110/issuer.html.gz').read_bytes())
  rows=parse(source,body,'2026-11-10')
  self.assertEqual([(r['mic'],r['symbol'],r['currency'])for r in rows],[('XETR','BTCE.DE','EUR'),('XPAR','BTCE.PA','EUR')])
  for mutation in ['currency','identity','date','duplicate','missing']:
   changed=body
   if mutation=='currency':changed=body.replace(b'data-exchange-currency="EUR"',b'data-exchange-currency="USD"')
   elif mutation=='identity':changed=body.replace(b'DE000A27Z304',b'DE0000000000')
   elif mutation=='date':changed=body.replace(b'01.06.21',b'01.06.20')
   elif mutation=='duplicate':changed=body+body
   else:changed=body.replace(b'BTCE.PA',b'OTHER.PA')
   with self.subTest(mutation=mutation),self.assertRaises(ValueError):
    parse(source,changed,'2026-11-10')
 def test_paris_daily_and_monthly_coverage_without_extending_xetra(self):
  import copy,datetime,gzip,json
  from pathlib import Path
  from refresh_monthly_history import collect_yahoo
  root=Path(__file__).resolve().parents[1]
  captured=json.loads(gzip.decompress((root/'scripts/fixtures/bitwise-paris-20261110/collected.json.gz').read_bytes()))
  source=next(s for s in json.loads((root/'scripts/monthly-automation.json').read_text())['series']if s['id']==captured['id'])
  def fetch(url):return copy.deepcopy(captured['rawResponse']['1d'if 'interval=1d&'in url else'1mo'])
  result=collect_yahoo(source,datetime.datetime(2026,11,10,tzinfo=datetime.timezone.utc),fetch)
  self.assertEqual(result['points'],captured['points'])
  self.assertEqual(result['points'][0][0],'2021-06')
  self.assertEqual(result['points'][-1][0],'2026-10')
  self.assertEqual(len(result['points']),65)
  for change in [{'currency':'USD'},{'symbol':'BTCE.DE'},{'periodStart':'2020-07'}]:
   with self.subTest(change=change),self.assertRaises(ValueError):
    collect_yahoo({**source,**change},datetime.datetime(2026,11,10,tzinfo=datetime.timezone.utc),fetch)
 def test_palladium_exact_london_listing_and_monthly_market_windows(self):
  import copy,datetime,gzip,json
  from pathlib import Path
  from refresh_monthly_history import collect_yahoo
  root=Path(__file__).resolve().parents[1];fix=root/'scripts/fixtures/palladium-london-market-20261110'
  source=next(s for s in json.loads((root/'scripts/qualified-listing-sources.json').read_text())['sources']if s['isin']=='IE00B4556L06')
  body=gzip.decompress((fix/'issuer.html.gz').read_bytes());rows=parse(source,body,'2026-11-10')
  self.assertEqual([(r['mic'],r['symbol'],r['currency'])for r in rows],[('XLON','IPDM.L','USD')])
  for original,replacement in [(b'IE00B4556L06',b'IE00B4LHWP62'),(b'IPDM',b'SPDM'),(b'USD',b'GBP'),(b'11/Apr/2011',b'11/Apr/2021')]:
   with self.subTest(replacement=replacement),self.assertRaises(ValueError):parse(source,body.replace(original,replacement),'2026-11-10')
  with self.assertRaises(ValueError):parse(source,body+body,'2026-11-10')
  # Other ISIN occurrences remain: they cannot substitute for the primary cell.
  import re
  wrong=re.sub(rb'(data-id="keyFundFacts-isin-data">)IE00B4556L06',rb'\g<1>IE00B4LHWP62',body)
  self.assertNotEqual(wrong,body);self.assertIn(b'IE00B4556L06',wrong)
  with self.assertRaisesRegex(ValueError,'primary'):parse(source,wrong,'2026-11-10')
  with self.assertRaisesRegex(ValueError,'primary'):parse(source,body.replace(b'keyFundFacts-isin-data',b'related-share-isin-data'),'2026-11-10')
  captured=json.loads(gzip.decompress((fix/'collected.json.gz').read_bytes()))
  config=next(s for s in json.loads((root/'scripts/monthly-automation.json').read_text())['series']if s['id']==captured['id'])
  def fetch(url):
   if 'period1=1304208000&'in url:return copy.deepcopy(captured['rawResponse']['1d'if'interval=1d&'in url else'1mo'])
   for r in captured['proofRows']:
    if r.get('windowUrl')==url:return copy.deepcopy(captured['rawResponse']['monthEndWindows'][r['date'][:7]])
   raise AssertionError('Unexpected captured source request')
  result=collect_yahoo(config,datetime.datetime(2026,11,10,tzinfo=datetime.timezone.utc),fetch)
  self.assertEqual(result['points'],captured['points']);self.assertEqual(len(result['points']),186)
  self.assertEqual(result['points'][0][0],'2011-05');self.assertEqual(result['points'][-1][0],'2026-10')
  self.assertEqual(dict(result['points'])['2014-12'],23.799999)
  self.assertEqual(result['verifiedDailyWindowMonths'],['2015-08'],'The differing monthly candle still requires the independent month-end daily window')
  self.assertEqual(result['anniversaryPoints'],[],'Unsupported current anniversary use does not introduce a daily quote obligation')
  for change in [{'currency':'GBP'},{'symbol':'SPDM.L'},{'timezone':'Europe/Paris'},{'periodStart':'2011-04'}]:
   with self.subTest(change=change),self.assertRaises((ValueError,AssertionError)):
    collect_yahoo({**config,**change},datetime.datetime(2026,11,10,tzinfo=datetime.timezone.utc),fetch)
 def test_html_row_has_exact_identity_exchange_and_currency(self):
  source={'isin':'FR0013416716','format':'html','url':'https://www.amundietf.com/exact','rows':[{'pattern':r'^LSE GLDD LN USD - 02/02/2021 Capitalisation$','ticker':'GLDD','mic':'XLON','exchange':'London Stock Exchange','currency':'USD','symbol':'GLDD.L'}]}
  body=b'FR0013416716<table><tr><td>LSE</td><td>GLDD LN</td><td>USD</td><td>-</td><td>02/02/2021</td><td>Capitalisation</td></tr></table>'
  rows=parse(source,body,'2026-10-17')
  self.assertEqual(rows[0]['symbol'],'GLDD.L')
  self.assertEqual(rows[0]['currency'],'USD')
  for invalid in [body.replace(b'FR0013416716',b'FR0000000000'),body.replace(b'USD',b'EUR'),body+body]:
   with self.assertRaises(ValueError):parse(source,invalid,'2026-10-17')
 def test_amundi_api_share_and_symbol_are_exact(self):
  import json
  source={'isin':'FR0013416716','format':'amundi-api','url':'https://www.amundietf.fr/mapi/ProductAPI/getProductsData','rows':[{'pattern':r'^LSE USD GLDD LN (GLDD\.L) FR0013416716$','ticker':'GLDD','mic':'XLON','exchange':'London Stock Exchange','currency':'USD'}]}
  payload={'products':[{'productId':source['isin'],'characteristics':{'ISIN':source['isin'],'LISTINGS':[{'exchangePlace':'LSE','tradingCurrency':'USD','ticker':'GLDD LN','ric':'GLDD.L'}]}}]}
  self.assertEqual(parse(source,json.dumps(payload).encode(),'2026-10-17')[0]['symbol'],'GLDD.L')
  payload['products'][0]['characteristics']['ISIN']='OTHER'
  with self.assertRaises(ValueError):parse(source,json.dumps(payload).encode(),'2026-10-17')
 def test_pdf_row_and_document_identity_required(self):
  source={'isin':'IE000TEST000','url':'https://issuer/document','rows':[{'pattern':r'^LSE USD TEST (TEST\.L) IE000TEST000$','ticker':'TEST','mic':'XLON','exchange':'London Stock Exchange','currency':'USD'}]}
  with patch('refresh_qualified_listings.pdf_text',return_value='LSE USD TEST TEST.L IE000TEST000'):
   self.assertEqual(parse(source,b'pdf-proof','2026-10-17')[0]['symbol'],'TEST.L')
  with patch('refresh_qualified_listings.pdf_text',return_value='LSE USD TEST TEST.L OTHER'):
   with self.assertRaises(ValueError):parse(source,b'wrong','2026-10-17')
if __name__=='__main__':unittest.main()
