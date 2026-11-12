import unittest
from pathlib import Path
from blackrock_xetra_reference import blackrock_xetra_reference
class XetraReferenceTests(unittest.TestCase):
 URL='https://www.blackrock.com/gls-download/literature/fact-sheet/iues-ishares-s-p-500-energy-sector-ucits-etf-fund-fact-sheet-en-no.pdf'
 def setUp(self):self.text=Path(__file__).with_name('fixtures').joinpath('metadata-connections/blackrock-IUES-Xetra-20261111.txt').read_text()
 def parse(self,text=None,url=None,isin='IE00B42NKQ00'):return blackrock_xetra_reference(self.text if text is None else text,isin,url or self.URL,'2026-11-11')
 def test_actual_matrix_binds_xetra_currency_and_ric(self):
  rows=self.parse();self.assertEqual(len(rows),1);r=rows[0];self.assertEqual((r['mic'],r['ticker'],r['currency'],r['symbol']),('XETR','QDVF','EUR','QDVF.DE'));self.assertEqual(r['referenceDate'],'2026-11-06');self.assertEqual(r['priceScale'],1)
 def test_wrong_share_or_ambiguous_identity(self):
  for text in [self.text.replace('IE00B42NKQ00','IE00B4L5Y983'),self.text+'\nISIN : IE00B4L5Y983']:
   with self.assertRaises(ValueError):self.parse(text)
 def test_wrong_currency_never_borrowed_from_neighbour(self):self.assertEqual(self.parse(self.text.replace('COP                EUR','COP                USD')),[])
 def test_misaligned_or_truncated_matrix_rejected(self):
  with self.assertRaises(ValueError):self.parse(self.text.replace('QDVF.DE','IUES.L'))
  with self.assertRaises(ValueError):self.parse(self.text.replace('RIC               IUES.L                  -                  QDVF.DE','RIC               IUES.L'))
 def test_reference_date_not_source_attempt_or_nav_date(self):
  self.assertEqual(self.parse()[0]['referenceDate'],'2026-11-06')
  with self.assertRaises(ValueError):self.parse(self.text.replace('06-Nov-2026','12-Nov-2026'))
  with self.assertRaises(ValueError):self.parse(self.text.replace('All other data as at 06-Nov-2026','No other-data date'))
 def test_unqualified_authority_and_route_do_not_admit(self):
  for url in [self.URL.replace('www.blackrock.com','mirror.example'),self.URL+'?other=1',self.URL.replace('-en-no.pdf','-de-de.pdf')]:self.assertEqual(self.parse(url=url),[])
 def test_collector_keeps_other_venues_and_repeated_collection_is_idempotent(self):
  from collect_instrument_metadata import parse_listings,merge_field_observation
  from unittest.mock import patch
  import copy
  source={'isin':'IE00B42NKQ00','listings':[]}
  with patch('collect_instrument_metadata.text_of',return_value=self.text):
   rows=parse_listings(b'%PDF-fixture',source,self.URL,'2026-11-11')
  self.assertEqual([r['evidenceId']for r in rows],['IE00B42NKQ00-XETR-QDVF-EUR'])
  old={'checkedAt':'2026-11-03','value':[dict(rows[0],checkedAt='2026-11-03'),dict(rows[0],mic='XLON',ticker='IUES',currency='USD',evidenceId='IE00B42NKQ00-XLON-IUES-USD',checkedAt='2026-11-11',referenceDate='2026-11-11')]}
  before=copy.deepcopy(old);observation={'checkedAt':'2026-11-11','value':rows}
  merged=merge_field_observation('listings',old,observation)
  self.assertEqual(old,before);self.assertEqual(next(r for r in merged['value']if r['mic']=='XLON'),old['value'][1])
  self.assertEqual(merge_field_observation('listings',merged,observation),merged)
  self.assertEqual(next(r for r in merged['value']if r['mic']=='XETR')['referenceDate'],'2026-11-06')
 def test_other_factsheet_does_not_change_existing_generic_parser(self):
  self.assertEqual(self.parse(url=self.URL.replace('iues-ishares','other-ishares')),[])
if __name__=='__main__':unittest.main()
