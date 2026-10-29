import datetime as dt,unittest
from unittest.mock import patch
from collect_wisdomtree_holdings import qualified_identity_books,IdentitySnapshot

class IdentityIsolation(unittest.TestCase):
 def test_one_failed_book_does_not_strand_successful_independent_identities(self):
  def fetch(url):
   if url=='https://issuer.example/down':raise ConnectionError('offline')
   return b'valid book'
  with patch('collect_wisdomtree_holdings.IDENTITIES',[('failed','https://issuer.example/down'),('valid','https://issuer.example/ok')]),patch('collect_wisdomtree_holdings.identity_document',side_effect=fetch),patch('collect_wisdomtree_holdings.identities',return_value=({'1234567':'US0378331005'},'2026-10-28')):
   m,dates,proofs,failures=qualified_identity_books(dt.datetime(2026,10,29,tzinfo=dt.timezone.utc))
  self.assertEqual(m,{'1234567':'US0378331005'});self.assertEqual(dates,['2026-10-28'])
  self.assertEqual(set(proofs),{'https://issuer.example/ok'});self.assertEqual(failures[0]['isin'],'failed')
  snapshot=IdentitySnapshot((m,dates,proofs),failures)
  self.assertEqual(tuple(snapshot),(m,dates,proofs));self.assertEqual(snapshot.source_failures,failures)
 def test_two_valid_but_conflicting_books_still_fail_closed(self):
  with patch('collect_wisdomtree_holdings.IDENTITIES',[('one','https://issuer.example/1'),('two','https://issuer.example/2')]),patch('collect_wisdomtree_holdings.identity_document',return_value=b'book'),patch('collect_wisdomtree_holdings.identities',side_effect=[({'1234567':'US0378331005'},'2026-10-28'),({'1234567':'US5949181045'},'2026-10-28')]):
   with self.assertRaisesRegex(ValueError,'Contradictory'):qualified_identity_books(None)

if __name__=='__main__':unittest.main()
