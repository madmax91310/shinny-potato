import copy,datetime as dt,gzip,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from collect_wisdomtree_holdings import parse,known_shares,rankings
from security_identifier_observations import qualified,digest,refresh
ROOT=Path(__file__).resolve().parents[1]
PROOFS=ROOT/'reports/donnees-consolidees-2026-10-24/preuves/reprise-20261026'
NOW=dt.datetime(2026,10,26,12,tzinfo=dt.timezone.utc)
class IndependentPortfolioIdentities(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.page=gzip.decompress((PROOFS/'wisdomtree-defence-qualified.html.gz').read_bytes()).decode()
  cls.share=next(s for s in known_shares()if s['isin']=='IE0002Y8CX98')
  cls.evidence=json.loads(gzip.decompress((PROOFS/'defence-qualified-record.json.gz').read_bytes()))['identityObservations']
  cls.mapping={k:qualified(v,NOW)[1]for k,v in cls.evidence.items()}
 def test_complete_independent_proofs_preserve_original_portfolio_date_and_weights(self):
  rows,stamp=parse(self.page,self.share,NOW,self.mapping,[],identity_observations=self.evidence)
  self.assertEqual(len(rows),42);self.assertEqual(stamp,'2026-10-15')
  self.assertAlmostEqual(sum(r['weightPct']for r in rows),100.0001)
  with self.assertRaisesRegex(ValueError,'Identity dates'):
   parse(self.page,self.share,NOW,self.mapping,['2026-10-23'])
 def test_incomplete_expired_wrong_hash_and_wrong_identity_stay_refused(self):
  for mutation in ['missing','expired','hash','identity']:
   proofs=copy.deepcopy(self.evidence);key=next(iter(proofs));mapping=dict(self.mapping)
   if mutation=='missing':proofs.pop(key)
   elif mutation=='expired':proofs[key]['checkedAt']='2020-01-01T00:00:00+00:00'
   elif mutation=='hash':proofs[key]['sha256']='0'*64
   else:mapping[key]='US0000000001'
   with self.subTest(mutation=mutation),self.assertRaises(ValueError):
    parse(self.page,self.share,NOW,mapping,[],identity_observations=proofs)
 def test_receipt_must_be_equity_depositary_and_match_the_exact_target(self):
  row=copy.deepcopy(self.evidence['B00ZQQ2']);self.assertEqual(qualified(row,NOW),('B00ZQQ2','LU0088087324'))
  for item in row['response'][1]['data']:item['securityType']='Common Stock'
  row['sha256']=digest(row['response'])
  with self.assertRaises(ValueError):qualified(row,NOW)
 def _assert_ordinary_renewal(self,future,cache_evidence):
  import io
  def request(req,**kwargs):
   jobs=json.loads(req.data);key=jobs[0]['idValue'];return io.BytesIO(json.dumps(self.evidence[key]['response']).encode())
  with tempfile.TemporaryDirectory()as temp:
   path=Path(temp)/'identities.json';path.write_text(json.dumps({'schemaVersion':1,'observations':cache_evidence}))
   with patch('security_identifier_observations.PATH',path),patch('security_identifier_observations.configured_candidates',return_value={}),patch('security_identifier_observations.candidate_isins',return_value=set()),patch('collect_wisdomtree_holdings.IDENTITIES',[('fund','https://example.test/book')]),patch('collect_wisdomtree_holdings.identity_document',return_value=b'book'),patch('collect_wisdomtree_holdings.identities',return_value=(self.mapping,'2028-10-26')),patch('collect_wisdomtree_holdings.known_shares',return_value=[self.share]),patch('collect_wisdomtree_holdings.public_identity_candidates',return_value=rankings(self.page)['ranking']),patch('collect_wisdomtree_holdings.product_page',return_value=(self.page,self.share['sourceUrl'],[])),patch('security_identifier_observations.urllib.request.urlopen',side_effect=request)as fetch:
    refresh(future,max_requests=1)
   self.assertEqual(fetch.call_count,1,'Current workbook cannot suppress an expired independent qualification')
   renewed=[r for r in json.loads(path.read_text())['observations'].values()if r['checkedAt']==future.isoformat()]
   self.assertEqual(len(renewed),1);self.assertEqual(renewed[0]['status'],'qualified')
 def test_ordinary_renewal_does_not_confuse_workbook_identity_with_independent_proof(self):
  self._assert_ordinary_renewal(NOW.replace(year=2028),self.evidence)
 def test_renewal_starts_before_expiration_without_invalidating_current_proof(self):
  policy=json.loads((ROOT/'src/data/freshness-policy.json').read_text())['fields']
  age=policy['etf.staticCharacteristic']['checkDays']-1
  evidence=copy.deepcopy(self.evidence)
  for row in evidence.values():row['checkedAt']=(NOW-dt.timedelta(days=age)).isoformat();qualified(row,NOW)
  self._assert_ordinary_renewal(NOW,evidence)
 def test_official_alias_recovers_exact_html_fields_and_keeps_pdf_failure_visible(self):
  import urllib.error
  from collect_public_issuer import collect_one
  primary=self.share['sourceUrl'];error=urllib.error.URLError('HTTP 403')
  legacy='https://www.wisdomtree.eu/en-ie/etfs/thematic/wdef---wisdomtree-europe-defence-ucits-etf---eur-acc'
  with patch('collect_public_issuer.get_text',side_effect=[error,error,error,self.page])as fetch,patch('collect_public_issuer.download',side_effect=urllib.error.URLError('PDF offline')):
   result=collect_one(self.share,NOW)
  self.assertEqual(fetch.call_count,4);self.assertEqual(result['sourceUrl'],legacy)
  self.assertTrue(any(e['field']=='performance'for e in result['collectionErrors']))
  self.assertTrue(any(e['field']=='countries'for e in result['collectionErrors']))
  self.assertTrue(result['holdings']['rows']);self.assertTrue(result['sourceAttempts'])
 def test_financial_identity_failure_never_tries_another_route_or_pdf(self):
  from collect_public_issuer import collect_one
  with patch('collect_public_issuer.get_text',return_value=self.page.replace(self.share['isin'],'IE000W8WMSL2'))as fetch,patch('collect_public_issuer.download')as pdf:
   with self.assertRaises(ValueError):collect_one(self.share,NOW)
  self.assertEqual(fetch.call_count,1);pdf.assert_not_called()
 def test_transport_failure_is_explicit_and_preserves_original_proof_dates(self):
  import urllib.error
  future=NOW.replace(year=2028)
  with tempfile.TemporaryDirectory()as temp:
   path=Path(temp)/'identities.json';initial={'schemaVersion':1,'observations':self.evidence};path.write_text(json.dumps(initial))
   with patch('security_identifier_observations.PATH',path),patch('security_identifier_observations.configured_candidates',return_value={}),patch('security_identifier_observations.candidate_isins',return_value=set()),patch('collect_wisdomtree_holdings.IDENTITIES',[('fund','https://example.test/book')]),patch('collect_wisdomtree_holdings.identity_document',return_value=b'book'),patch('collect_wisdomtree_holdings.identities',return_value=(self.mapping,'2028-10-26')),patch('collect_wisdomtree_holdings.known_shares',return_value=[self.share]),patch('collect_wisdomtree_holdings.public_identity_candidates',return_value=rankings(self.page)['ranking']),patch('collect_wisdomtree_holdings.product_page',return_value=(self.page,self.share['sourceUrl'],[])),patch('security_identifier_observations.urllib.request.urlopen',side_effect=urllib.error.URLError('offline')):
    with self.assertRaises(SystemExit)as failure:refresh(future,max_requests=1)
   self.assertEqual(failure.exception.code,1)
   self.assertEqual(json.loads(path.read_text()),initial)
if __name__=='__main__':unittest.main()
