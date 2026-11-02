import gzip,json,hashlib,unittest
from pathlib import Path
from bs4 import BeautifulSoup
from collect_instrument_metadata import parse_justetf
ROOT=Path(__file__).resolve().parents[1]
FIX=ROOT/'scripts/fixtures/metadata-hedging-20261102'
class ExactHedgingSource(unittest.TestCase):
 def setUp(self):self.raw=gzip.decompress((FIX/'IE00BZ048462-justetf.html.gz').read_bytes())
 def test_actual_profile_explicit_negative_hedge_is_not_a_pea_statement(self):
  receipt=json.loads((FIX/'provenance.json').read_text());self.assertEqual(hashlib.sha256(self.raw).hexdigest(),receipt['sha256'])
  fields=parse_justetf(self.raw,'IE00BZ048462');self.assertIs(fields['currencyHedge'],False);self.assertNotIn('pea',fields)
 def test_other_share_is_rejected(self):
  with self.assertRaises(ValueError):parse_justetf(self.raw,'IE00B4L5Y983')
 def test_missing_or_ambiguous_row_never_becomes_false(self):
  soup=BeautifulSoup(self.raw,'html.parser');row=soup.select_one('[data-testid="etf-basics_row_currency-hedge"]');self.assertIsNotNone(row);row.decompose();self.assertNotIn('currencyHedge',parse_justetf(str(soup).encode(),'IE00BZ048462'))
  soup=BeautifulSoup(self.raw,'html.parser');row=soup.select_one('[data-testid="etf-basics_row_currency-hedge"]');row.find_all('td',recursive=False)[1].string='—';self.assertNotIn('currencyHedge',parse_justetf(str(soup).encode(),'IE00BZ048462'))
 def test_duplicate_row_or_changed_structure_fails(self):
  soup=BeautifulSoup(self.raw,'html.parser');row=soup.select_one('[data-testid="etf-basics_row_currency-hedge"]');row.insert_after(BeautifulSoup(str(row),'html.parser'))
  with self.assertRaises(ValueError):parse_justetf(str(soup).encode(),'IE00BZ048462')
if __name__=='__main__':unittest.main()
