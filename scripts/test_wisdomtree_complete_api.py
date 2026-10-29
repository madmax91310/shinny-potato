"""Real issuer files: full API, share proof, currencies and exact identifiers."""
import copy,datetime as dt,gzip,hashlib,json,pathlib,tempfile,unittest
from unittest.mock import patch
from wisdomtree_api_holdings import CLASSES,parse,collect,identity_map
from security_identifier_observations import digest,API
from issuer_documents import pdf_text
FIX=pathlib.Path(__file__).with_name('fixtures')/'wisdomtree-complete'
NOW=dt.datetime(2026,10,29,15,tzinfo=dt.timezone.utc)

class CompleteApi(unittest.TestCase):
 def test_real_precise_books_all_identities_and_original_cash_reconcile(self):
  from wisdomtree_identity_cache import expand_observation
  snapshot=json.loads(gzip.decompress((FIX/'precise-qualified-books.json.gz').read_bytes()))
  now=NOW.replace(hour=23)
  for isin,count in [('IE00BKLF1R75',111),('IE00BZ56SW52',439)]:
   h=snapshot['books'][isin]
   raw=gzip.decompress((FIX/(isin+'.json.gz')).read_bytes())
   self.assertEqual(hashlib.sha256(raw).hexdigest(),h['sha256'])
   receipts=[expand_observation(o)for o in h['identityObservations']]
   # The shared registry was used too. Its receipt hashes are checked against
   # the immutable acquisition fixture, never against a refreshed live cache.
   shared=snapshot['sharedIdentityObservations']
   for key,expected in h.get('identitySourceHashes',{}).items():
    self.assertEqual(shared[key]['sha256'],expected)
    receipts.append(shared[key])
   mapping=identity_map(receipts,now)
   rows,stamp,cash=parse(json.loads(raw),{'isin':isin},now,mapping,
                       pending_observations=[o for o in receipts if o.get('issuerPendingIdentity')])
   self.assertEqual(rows,h['rows']);self.assertEqual(len(rows),count)
   self.assertTrue(all(r['isin']for r in rows));self.assertEqual(stamp,h['asOf'])
   self.assertEqual(len({r['isin']for r in rows}),count)
   self.assertAlmostEqual(sum(r['weightPct']for r in rows)+cash,100)
   self.assertEqual(h['navReconciliation']['unidentifiedPositions'],[])
   self.assertEqual(h['navReconciliation']['excludedWeightPctByType'],{'Cash':cash})

 def test_all_six_actual_complete_files_and_separate_cash(self):
  manifest=json.loads((FIX/'manifest.json').read_text())
  for isin in CLASSES:
   with self.subTest(isin=isin):
    raw=gzip.decompress((FIX/(isin+'.json.gz')).read_bytes())
    doc=gzip.decompress((FIX/(isin+'.pdf.gz')).read_bytes())
    self.assertEqual(hashlib.sha256(raw).hexdigest(),manifest['observations'][isin]['json']['sha256'])
    self.assertEqual(hashlib.sha256(doc).hexdigest(),manifest['observations'][isin]['pdf']['sha256'])
    self.assertIn(isin,pdf_text(doc))
    body=json.loads(raw);figi=next(r['figi']for r in body if r['figi'])
    rows,stamp,cash=parse(body,{'isin':isin},NOW,{figi:'US0378331005'})
    self.assertEqual(stamp,'2026-10-28')
    self.assertGreater(len(rows),10)
    self.assertAlmostEqual(sum(r['weightPct']for r in rows)+cash,100)
    self.assertEqual(sum(r['isin'] is not None for r in rows),1,'Names and other FIGIs never acquire the test ISIN')
    self.assertTrue(all(r['weightPct']>=0 for r in rows))
    self.assertFalse(any(r['figi'] is None for r in rows),'Cash is not an equity position')
    with self.assertRaises(ValueError):parse(body[1:],{'isin':isin},NOW,{figi:'US0378331005'})

 def test_identity_cash_short_unknown_and_checksum_guards(self):
  original=json.loads(gzip.decompress((FIX/'IE00BKLF1R75.json.gz').read_bytes()))
  known={original[0]['figi']:'US0378331005'}
  for change in ['wrong-fund','mixed-date','short-stock','unknown-cash','fake-cash-ticker','duplicate','checksum','nan','future']:
   body=copy.deepcopy(original)
   if change=='wrong-fund':body[0]['wtClassID']=3104137
   if change=='mixed-date':body[0]['dt']='2026-10-27T00:00:00Z'
   if change=='short-stock':body[0]['wgt']=-.01
   if change=='unknown-cash':body[-1]['securityName']='Unknown instrument'
   if change=='fake-cash-ticker':body[-1]['securityTicker']='STOCK US'
   if change=='duplicate':body[1]['figi']=body[0]['figi']
   if change=='checksum':body[0]['checkSumWgtEntity']=.95
   if change=='nan':body[0]['wgt']=float('nan')
   if change=='future':body[0]['dt']='2026-10-30T00:00:00Z'
   with self.subTest(change=change),self.assertRaises(ValueError):parse(body,{'isin':'IE00BKLF1R75'},NOW,known)

 def test_exact_six_share_documents_bind_api_class_listing_and_currency(self):
  # Exercise the actual acquisition function; financial fixture assertions above
  # remain independent of this minimal identifier response.
  import test_wisdomtree_api_holdings as fixtures
  for isin,(class_id,ticker,title) in CLASSES.items():
   currency='EUR' if isin=='IE0002Y8CX98' else 'USD'
   body=fixtures.portfolio()
   for row in body:row.update(wtClassID=class_id,fundTicker=ticker)
   evidence={'sourceUrl':API,'checkedAt':NOW.isoformat(),
    'request':[{'idType':'ID_ISIN','idValue':f'US{i:010d}'}for i,r in enumerate(body)],
    'response':[{'data':[{'figi':r['figi'],'marketSector':'Equity'}]}for r in body]}
   evidence['sha256']=digest(evidence['response'])
   with tempfile.TemporaryDirectory() as folder:
    root=pathlib.Path(folder);(root/'src/data').mkdir(parents=True)
    (root/'scripts').mkdir()
    (root/'scripts/security-identifier-candidates.json').write_bytes(pathlib.Path('scripts/security-identifier-candidates.json').read_bytes())
    (root/'src/data/dca-complete-holdings.json').write_text(json.dumps({isin:{'identityObservations':[evidence]}}))
    (root/'src/data/freshness-policy.json').write_bytes(pathlib.Path('src/data/freshness-policy.json').read_bytes())
    doc=gzip.decompress((FIX/(isin+'.pdf.gz')).read_bytes())
    def fetch(url,**kwargs):return doc if '/pdr/'in url else json.dumps(body).encode()
    with patch('wisdomtree_api_holdings.ROOT',root),patch('security_identifier_observations.qualified_observations',return_value={}):
     with self.subTest(isin=isin):
      value=collect({'isin':isin,'currency':currency},NOW,fetch=fetch,post=lambda _:self.fail('No unproved network lookups in document fixture'))
      self.assertEqual(value['basis'],'fund');self.assertTrue(value['complete'])
      self.assertEqual(value['asOf'],'2026-10-19')
      with self.assertRaises(ValueError):collect({'isin':isin,'currency':'EUR' if currency=='USD' else 'USD'},NOW,fetch=fetch)

 def test_shared_identifier_proof_is_not_a_name_match(self):
  body=[{'data':[{'figi':'BBG000000000','marketSector':'Equity','name':'Different label'}]},
        {'data':[{'figi':'BBG000000000','marketSector':'Equity','name':'Different label'}]}]
  record={'sourceUrl':API,'checkedAt':NOW.isoformat(),'request':[{'idType':'ID_SEDOL','idValue':'0000000'},
   {'idType':'ID_ISIN','idValue':'US0378331005'}],'response':body,'sha256':digest(body)}
  self.assertEqual(identity_map([record],NOW),{'BBG000000000':'US0378331005'})
  old=copy.deepcopy(record);old['checkedAt']='2020-01-01T00:00:00+00:00'
  self.assertEqual(identity_map([old],NOW),{})
  wrong=copy.deepcopy(record);wrong['response'][1]['data'][0]['figi']='BBG000000001'
  with self.assertRaises(ValueError):identity_map([wrong],NOW)
