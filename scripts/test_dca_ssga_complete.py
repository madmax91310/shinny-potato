import datetime as dt
import unittest
from unittest.mock import patch
from collect_ssga_etf import parse_holdings
class CompleteStateStreet(unittest.TestCase):
 def rows(self):
  return [['ISIN:','IE00B3YLTY66'],['Holdings As Of:','15-Oct-2026'],[],[],[],['ISIN','Security Name','Percent of Fund'],['US0378331005','APPLE','60'],['US5949181045','MICROSOFT','40']]
 def parse(self,rows):
  with patch('collect_ssga_etf.xlsx_rows',return_value=rows):return parse_holdings(b'',{'isin':'IE00B3YLTY66'},dt.datetime(2026,10,16,tzinfo=dt.timezone.utc),complete=True)
 def test_complete_and_exact_share(self):
  r=self.parse(self.rows());self.assertTrue(r['complete']);self.assertEqual(len(r['rows']),2)
  rows=self.rows();rows[0][1]='WRONG'
  with self.assertRaises(ValueError):self.parse(rows)
 def test_partial_and_short_rejected(self):
  for weight in ['10','-10','NaN']:
   rows=self.rows();rows[-1][-1]=weight
   with self.assertRaises(ValueError):self.parse(rows)
 def test_published_lots_not_dropped(self):
  rows=self.rows();rows[-1][-1]='20';rows.append(['US5949181045','MICROSOFT','20'])
  r=self.parse(rows);self.assertEqual(sum(x['weightPct'] for x in r['rows']),100);self.assertEqual(len(r['rows']),3)
