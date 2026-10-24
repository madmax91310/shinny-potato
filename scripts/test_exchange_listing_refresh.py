import copy,datetime as dt,unittest
from exchange_listing_refresh import refresh
NOW=dt.datetime(2026,10,24,tzinfo=dt.timezone.utc)
URL='https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt'
def body(name='Issuer - Class A Ordinary Shares',date='10232026',etf='N'):
 return f'Symbol|Security Name|Test Issue|ETF\nAAA|{name}|N|{etf}\nFile Creation Time: {date}\n'.encode()
def document():return {'listings':[{'id':'exact','name':'Issuer - Class A Ordinary Shares','shareClass':'A','shareType':'ordinary','instrumentType':'EQUITY','ticker':'AAA','symbol':'AAA','mic':'XNAS','currency':'USD','sourceId':'nasdaq','sourceUrl':URL,'sourceAsOf':'2026-10-22','checkedAt':'2026-10-22','companyId':'original-company'}]}
class CommonDirectory(unittest.TestCase):
 def test_exact_renewal_keeps_identity_and_has_no_prices(self):
  old=document();new,report=refresh(old,NOW,lambda *a,**k:body());self.assertEqual(old,document());self.assertEqual(len(report['successes']),1);self.assertFalse(report['errors']);self.assertEqual(len(new['listings']),1)
  for field in ['id','symbol','mic','currency','companyId','shareClass']:self.assertEqual(new['listings'][0][field],old['listings'][0][field])
  self.assertEqual(new['listings'][0]['listingObservation']['asOf'],'2026-10-23');self.assertNotIn('points',new['listings'][0])
 def test_failure_or_identity_change_keeps_every_original_field(self):
  for payload in [body('Issuer - ADS'),body(date='10212026'),body(etf='Y'),b'new HTML structure']:
   old=document();new,report=refresh(old,NOW,lambda *a,**k:payload);self.assertEqual(new,old);self.assertFalse(report['successes']);self.assertEqual(len(report['errors']),1)
  def offline(*a,**k):raise OSError('source unavailable')
  old=document();new,r=refresh(old,NOW,offline);self.assertEqual(new,old);self.assertEqual(r['errors'][0]['lastSuccessAt'],'2026-10-22')
 def test_common_source_is_fetched_once_without_universe_discovery(self):
  old=document();old['listings'].append({**old['listings'][0],'id':'other','ticker':'OTHER','symbol':'OTHER'});calls=[]
  def fetch(*a,**k):calls.append(a[0]);return body()
  new,r=refresh(old,NOW,fetch);self.assertEqual(calls,[URL]);self.assertEqual(len(new['listings']),2);self.assertEqual(len(r['successes']),1);self.assertEqual(len(r['errors']),1)
if __name__=='__main__':unittest.main()
