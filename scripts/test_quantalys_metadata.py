import datetime as dt
import unittest
from pathlib import Path
from unittest.mock import patch
from collect_instrument_metadata import collect,parse_quantalys_pea

BODY=(Path(__file__).with_name('fixtures')/'metadata-connections'/'quantalys-pea.html').read_bytes()
ISIN='IE00B0M62S72'
URL='https://www.quantalys.com/Fonds/17300'
class QuantalysTests(unittest.TestCase):
 def test_explicit_own_pea_cell(self):
  self.assertEqual(parse_quantalys_pea(BODY,ISIN,URL),{'pea':False})
  from bs4 import BeautifulSoup
  soup=BeautifulSoup(BODY,'html.parser')
  row=next(r for r in soup.select('tr') if r.find('td').get_text(' ',strip=True)=='Eligible PEA')
  row.find_all('td')[1].string='Oui'
  self.assertEqual(parse_quantalys_pea(str(soup).encode(),ISIN,URL),{'pea':True})
 def test_unknown_is_not_negative(self):
  from bs4 import BeautifulSoup
  soup=BeautifulSoup(BODY,'html.parser')
  row=next(r for r in soup.select('tr') if r.find('td').get_text(' ',strip=True)=='Eligible PEA')
  row.find_all('td')[1].string='-'
  self.assertEqual(parse_quantalys_pea(str(soup).encode(),ISIN,URL),{})
 def test_wrong_or_multiple_share_identity(self):
  for body in [BODY.replace(ISIN.encode(),b'IE000716YHJ7'),BODY+b'<h1><small>IE000716YHJ7</small></h1>']:
   with self.assertRaises(ValueError):parse_quantalys_pea(body,ISIN,URL)
 def test_search_page_or_foreign_host_is_not_proof(self):
  for url in ['https://www.quantalys.com/Recherche?search='+ISIN,URL.replace('quantalys.com','example.com')]:
   with self.assertRaises(ValueError):parse_quantalys_pea(BODY,ISIN,url)
 def test_no_pea_pme_or_unrelated_panel_substitution(self):
  for body in [BODY.replace(b'Eligible PEA <',b'Eligible OTHER <'),BODY.replace('Caractéristiques générales'.encode(),b'Other panel')]:
   with self.assertRaises(ValueError):parse_quantalys_pea(body,ISIN,URL)
 def test_current_conflict_keeps_the_field_unqualified(self):
  now=dt.datetime(2026,10,19,tzinfo=dt.timezone.utc)
  other='https://issuer.test/facts'
  with patch('collect_instrument_metadata.fetch_document',side_effect=lambda url,*a,**k:(BODY,URL) if url==URL else ((ISIN+'\nEligible PEA: Yes').encode(),other)):
   values,errors=collect({'isin':ISIN,'urls':[URL,other]},now)
  self.assertNotIn('pea',values)
  self.assertTrue(any(e.get('qualificationRequired')for e in errors))
 def test_duplicate_tax_cells_are_ambiguous(self):
  from bs4 import BeautifulSoup
  soup=BeautifulSoup(BODY,'html.parser')
  row=next(r for r in soup.select('tr') if r.find('td').get_text(' ',strip=True)=='Eligible PEA')
  row.insert_after(BeautifulSoup(str(row),'html.parser'))
  with self.assertRaises(ValueError):parse_quantalys_pea(str(soup).encode(),ISIN,URL)
 def test_browser_refusal_reaches_the_shared_backoff(self):
  import json,urllib.error
  from types import SimpleNamespace
  from collect_instrument_metadata import fetch_quantalys_document
  refused=SimpleNamespace(returncode=1,stdout=json.dumps({'status':403,'error':'Refused'}).encode())
  with patch('collect_instrument_metadata.subprocess.run',return_value=refused):
   with self.assertRaises(urllib.error.HTTPError)as caught:fetch_quantalys_document(URL)
  self.assertEqual(caught.exception.code,403)
 def test_effective_fund_url_is_the_evidence(self):
  search='https://www.quantalys.com/Recherche/RechercheRapide?inputSearch='+ISIN
  with patch('collect_instrument_metadata.fetch_document',return_value=(BODY,URL)):
   values,_=collect({'isin':ISIN,'urls':[search]},dt.datetime(2026,10,19,tzinfo=dt.timezone.utc))
  self.assertEqual(values['pea']['sourceUrl'],URL)
  self.assertIs(values['pea']['value'],False)

