import copy,datetime as dt,gzip,json,unittest,urllib.error
from pathlib import Path
from unittest.mock import patch
from collect_public_issuer import wisdomtree
from collect_wisdomtree_holdings import known_shares,collect_rankings
from issuer_routes import wisdomtree_product_candidates
NOW=dt.datetime(2026,10,23,tzinfo=dt.timezone.utc)
class RegionalRoutes(unittest.TestCase):
 def setUp(self):
  self.share=next(s for s in known_shares()if s['isin']=='IE00BJGWQN72')
  self.page=gzip.decompress((Path(__file__).parent/'fixtures/official-documents/wisdomtree-ie-usd-eur-20261023.html.gz').read_bytes()).decode()
 def test_native_currency_is_distinct_from_selected_listing(self):
  r=wisdomtree(self.page,self.share,NOW)
  self.assertEqual(r['holdings']['asOf'],'2026-10-15');self.assertEqual(r['holdings']['rows'][0]['weightPct'],2.21)
  for page,share in [(self.page,{**self.share,'currency':'EUR'}),(self.page.replace('USD / EUR','EUR / USD'),self.share),(self.page,{**self.share,'isin':'IE00BDVPNG13'})]:
   with self.assertRaises(ValueError):wisdomtree(page,share,NOW)
 def test_bounded_exact_routes_and_no_financial_retry(self):
  urls=wisdomtree_product_candidates(self.share['sourceUrl'])
  self.assertEqual(len(urls),4);self.assertIn('/se/products/',urls[3]);self.assertIn('/ie/products/',urls[1]);self.assertIn('/nl/products/',urls[2])
  for url in ['https://evil.test/gb/products/equities/fund','https://www.wisdomtree.com/gb/products/equities/fund?other=1']:
   self.assertEqual(wisdomtree_product_candidates(url),[url])
  bad=urllib.error.HTTPError(urls[0],403,'Forbidden',{},None)
  with patch('collect_wisdomtree_holdings.public_page',side_effect=[bad,'wrong identity']),patch('collect_public_issuer.wisdomtree',side_effect=ValueError('Wrong fund')),patch('collect_wisdomtree_holdings.IDENTITIES',[]):
   with self.assertRaisesRegex(ValueError,'Wrong fund'):collect_rankings(self.share,NOW)
if __name__=='__main__':unittest.main()
