import copy,datetime as dt,gzip,json,unittest
from pathlib import Path
from collect_instrument_metadata import parse_listings,collect
ROOT=Path(__file__).resolve().parents[1];URL='https://apidata.londonstockexchange.com/nrdp/v1?tidm=HEAL'
class LseListingReference(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.body=json.loads(gzip.decompress((ROOT/'reports/donnees-consolidees-2026-10-24/preuves/reprise-20261026/heal-lse-nrdp.json.gz').read_bytes()))
  cls.source=next(s for s in json.loads((ROOT/'scripts/instrument-metadata-sources.json').read_text())['instruments']if s['isin']=='IE00BYZK4776')
 def test_exact_london_usd_is_renewed_independently_of_paris_and_no_price_is_imported(self):
  rows=parse_listings(json.dumps(self.body).encode(),self.source,URL,'2026-10-26');self.assertEqual(len(rows),1)
  self.assertEqual(rows[0]['evidenceId'],'IE00BYZK4776-XLON-HEAL-USD');self.assertEqual(rows[0]['symbol'],'HEAL.L')
  self.assertEqual(rows[0]['asOf'],'2026-10-26');self.assertNotIn('price',rows[0])
  values,errors=collect({**self.source,'urls':[URL]},dt.datetime(2026,10,26,tzinfo=dt.timezone.utc),fetch=lambda u:json.dumps(self.body).encode())
  self.assertEqual(set(values),{'listings'});self.assertEqual(errors,[])
 def test_other_share_venue_currency_unit_or_ticker_cannot_renew_this_listing(self):
  for field,value in [('isinCode','IE00B4L5Y983'),('mic','XPAR'),('currency','GBX'),('tidm','DRDR'),('unitOfQuotation','100'),('typology','Bonds'),('tradingAllowed','0'),('calendarDate','27/10/2026')]:
   body=copy.deepcopy(self.body);body['data'][field]=value
   with self.subTest(field=field),self.assertRaises(ValueError):parse_listings(json.dumps(body).encode(),self.source,URL,'2026-10-26')
 def test_missing_result_wrong_url_and_transport_failure_never_become_a_source_success(self):
  for body in [{},{'statusCode':200,'data':None},{'statusCode':500,'data':self.body['data']}]:
   with self.assertRaises(ValueError):parse_listings(json.dumps(body).encode(),self.source,URL,'2026-10-26')
  with self.assertRaises(ValueError):parse_listings(json.dumps(self.body).encode(),self.source,URL+'&other=1','2026-10-26')
  def offline(u):raise ConnectionError('offline')
  values,errors=collect({**self.source,'urls':[URL]},dt.datetime(2026,10,26,tzinfo=dt.timezone.utc),fetch=offline)
  self.assertEqual(values,{});self.assertTrue(errors)
if __name__=='__main__':unittest.main()
