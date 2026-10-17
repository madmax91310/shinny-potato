import unittest
from unittest.mock import patch
from refresh_qualified_listings import parse
class QualifiedListings(unittest.TestCase):
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
