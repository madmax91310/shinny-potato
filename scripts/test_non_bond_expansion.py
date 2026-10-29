import datetime as dt
import json
import gzip
import pathlib
import types
import unittest
from unittest.mock import patch
import collect_non_bond_expansion as funds

ROOT=pathlib.Path(__file__).resolve().parents[1]
FIXTURES=pathlib.Path(__file__).parent/'fixtures/non-bond'
TODAY=dt.date(2026,10,13)
class InvescoAllocations(unittest.TestCase):
 def test_complete_dated_tables_and_wrapped_labels(self):
  from collect_invesco_allocations import parse_allocations
  text=(FIXTURES/'invesco-allocation.txt').read_text()
  config={'isin':'IE000L2SA8K5','sourceUrl':'https://issuer.example/factsheet.pdf'}
  rows=parse_allocations(text,config,dt.datetime(2026,10,14))
  self.assertEqual(len(rows['countries']['rows']),7)
  self.assertEqual(len(rows['sectors']['rows']),10)
  self.assertEqual(rows['countries']['asOf'],'2026-08-31')
  self.assertEqual(rows['sectors']['basis'],'fund')
  self.assertTrue(any(r['name']=='Consumer discretionary' for r in rows['sectors']['rows']))
  for old,new in [('IE000L2SA8K5','IE000OTHER00'),('Physical','Synthetic'),
                  ('Geographic allocation (%)','Missing allocation'),
                  ('91.6','1.6'),('31 Aug 2026','31 Aug 2027'),
                  ('Sector allocation (%)','Sector allocation (%) Sector allocation (%)')]:
   with self.subTest(old=old),self.assertRaises(ValueError):parse_allocations(text.replace(old,new),config,dt.datetime(2026,10,14))

class NonBondSources(unittest.TestCase):
 def test_official_french_listing_fallback_for_empty_english_response(self):
  body=(ROOT/'scripts/fixtures/metadata-connections/invesco-IE000L2SA8K5-listings-fr.json').read_bytes()
  urls=[]
  def fetch(url):
   urls.append(url)
   return b'{}' if '/en_GB/' in url else body
  rows,attempts=funds.collect_invesco_listings({'isin':'IE000L2SA8K5'},dt.datetime(2026,10,29),fetch)
  self.assertEqual(len(urls),2)
  self.assertEqual([a['status']for a in attempts],['failed','validated'])
  self.assertIn(('XLON','USD','IEWQ.L'),[(r['mic'],r['currency'],r['symbol'])for r in rows])
  self.assertTrue(all('/fr_FR/'in r['sourceUrl'] and r['checkedAt']=='2026-10-29'for r in rows))
  self.assertTrue(all('inav'not in r for r in rows),'An indicative NAV is not a collected close')
 def test_successful_primary_does_not_call_fallback(self):
  body=(ROOT/'scripts/fixtures/metadata-connections/invesco-IE000L2SA8K5-listings-fr.json').read_bytes()
  urls=[]
  def fetch(url):urls.append(url);return body
  rows,attempts=funds.collect_invesco_listings({'isin':'IE000L2SA8K5'},dt.datetime(2026,10,29),fetch)
  self.assertEqual(len(urls),1);self.assertEqual(attempts[0]['status'],'validated')
 def test_two_invalid_source_responses_remain_a_failure(self):
  for body in [b'{}',b'[]',b'{"error":"unavailable"}',b'[{"listingExchangeName":"London Stock Exchange"}]']:
   with self.subTest(body=body),self.assertRaisesRegex(ValueError,'Official Invesco listings unavailable'):
    funds.collect_invesco_listings({'isin':'IE000L2SA8K5'},dt.datetime(2026,10,29),lambda _:body)
 def holdings(self):
  return {'holdings':[{'isin':f'US{i:010d}','name':f'Security {i}','weight':i}for i in range(1,11)]+[{'name':'Cash and/or Derivatives','weight':45}]}
 def test_full_index_sorted_cash_is_not_a_security(self):
  rows=funds.index_holdings(self.holdings())
  self.assertEqual(len(rows),10);self.assertEqual(rows[0]['weightPct'],10)
  self.assertFalse(any(r['name']=='Cash and/or Derivatives'for r in rows))
 def test_incomplete_duplicate_and_unidentified_exports_rejected(self):
  for mode in ['incomplete','duplicate','unknown']:
   h=self.holdings()
   if mode=='incomplete':h['holdings'].pop()
   elif mode=='duplicate':h['holdings'][1]['isin']=h['holdings'][0]['isin']
   else:h['holdings'][-1]['name']='Unidentified stock'
   with self.subTest(mode=mode),self.assertRaises(ValueError):funds.index_holdings(h)
 def test_listing_not_inferred_from_ticker(self):
  share={'isin':'IE000L2SA8K5'}
  self.assertRaises(ValueError,funds.listings,[('London Stock Exchange','USD','QQQE','QQQE','row')],share,dt.datetime(2026,10,13),'https://issuer.example','a'*64)
  rows=funds.listings([('London Stock Exchange','USD','IEWQ','IEWQ.L','official')],share,dt.datetime(2026,10,13),'https://issuer.example','a'*64)
  self.assertEqual(rows[0]['mic'],'XLON');self.assertIn(share['isin'],rows[0]['excerpt'])
 def test_pdf_transport_fallback_preserves_missing_aum_and_rejects_wrong_structure(self):
  from refresh_additional_etf import refresh
  root=pathlib.Path(__file__).resolve().parents[1]
  share=json.loads((root/'scripts/non-bond-expansion-sources.json').read_text())['instruments'][2]
  old=json.loads((root/'src/data/non-bond-etf-records.json').read_text())[share['isin']]
  text=(FIXTURES/'brent-factsheet.txt').read_text()
  now=dt.datetime(2026,10,13,tzinfo=dt.timezone.utc)
  with patch.object(funds,'download',return_value=b'%PDF fixture'), patch.object(funds,'pdf_text',return_value=text), patch('issuer_documents.pdf_text',return_value=text):
   observation=funds.wisdomtree_pdf(share,now,Exception('HTTP 403'))
   self.assertNotIn('aum',observation)
   self.assertEqual(observation['commodityAllocation']['rows'][0]['label'],'Pétrole Brent')
   self.assertTrue(observation['characteristics']['listings'])
   updated,report=refresh({'instruments':[share]},{share['isin']:old},{},now,collect=lambda s,n:observation)
   self.assertEqual(report['shares'][0]['status'],'validated')
   self.assertEqual(updated[share['isin']]['aum'],old['aum'])
  bad=text.replace('Debt security / ETC','Unqualified structure')
  with patch.object(funds,'download',return_value=b'%PDF fixture'), patch.object(funds,'pdf_text',return_value=bad), patch('issuer_documents.pdf_text',return_value=bad):
   self.assertRaises(ValueError,funds.wisdomtree_pdf,share,now,Exception('HTTP 403'))
 def test_unchanged_monthly_prices_keep_proof_of_active_response(self):
  from refresh_non_bond_sources import merge_monthly_evidence
  previous={'asset':{'responseSha256':'old','proofRows':[{'value':100}]}}
  observation={'id':'asset','status':'validated','record':{'responseSha256':'old'},'evidence':{'responseSha256':'new','proofRows':[{'value':100}],'rawResponse':{}}}
  result=merge_monthly_evidence(previous,[observation])
  self.assertEqual(result['asset']['responseSha256'],'old')
  observation['record']['responseSha256']='new'
  result=merge_monthly_evidence(previous,[observation])
  self.assertEqual(result['asset']['responseSha256'],'new');self.assertNotIn('rawResponse',result['asset'])
class SpecializedFeeControls(unittest.TestCase):
    def setUp(self):
        self.now=dt.datetime(2026,10,29,tzinfo=dt.timezone.utc)

    def test_six_specialized_commodity_fee_controls_use_their_actual_registry(self):
        from apply_etf_collection import merge_collection
        import collect_non_bond_expansion as nonbond
        records=json.loads(gzip.decompress((ROOT/'scripts/fixtures/characteristic-controls/nonbond-fees-before-20261029.json.gz').read_bytes()))['records']
        configs=json.loads((ROOT/'scripts/non-bond-expansion-sources.json').read_text())['instruments']
        codes={'JE00B78CGV99':'BRNT','GB00B15KXV33':'CRUD','JE00BN7KB334':'NGAS','JE00BN7KB557':'COFF','JE00B2QXZK10':'COCO','JE00BN7KB664':'WEAT'}
        for isin,code in codes.items():
            with self.subTest(isin=isin):
                config=next(r for r in configs if r['isin']==isin)
                body=gzip.decompress((ROOT/f'scripts/fixtures/wisdomtree-performance/{code}-identity.gz').read_bytes())
                with patch.object(nonbond,'download',return_value=body):
                    incoming=nonbond.wisdomtree_pdf(config,self.now,OSError('Isolated transport failure; fixture replay, no provider test'))
                old=records[isin];result=merge_collection({'checkedAt':'2026-10-29','shares':[incoming]},{isin:old},{})[isin]
                self.assertEqual(result['characteristics'],old['characteristics'])
                for key in ['terPct','annualSwapRatePct']:
                    self.assertEqual(result['characteristicChecks'][key]['checkedAt'],'2026-10-29')
                    self.assertEqual(result['characteristicChecks'][key]['asOf'],old['characteristicChecks'][key]['asOf'])
                    self.assertEqual(result['characteristicChecks'][key]['sourceAsOf'],incoming['characteristics']['asOf'])
                    self.assertEqual(result['characteristicChecks'][key]['observationEvidence'],old['characteristicChecks'][key])
                self.assertEqual(result['characteristicChecks']['listings'],old['characteristicChecks']['listings'])
                for key in ['aum','countries','sectors','holdings']:
                    self.assertEqual(result.get(key),old.get(key))

    def test_nonbond_guard_changes_trigger_the_ordinary_producer_and_regression(self):
        workflow=(ROOT/'.github/workflows/update-non-bond-expansion.yml').read_text()
        self.assertEqual(workflow.count("      - 'scripts/apply_etf_collection.py'"),2)
        self.assertIn("run: python -m unittest discover -s scripts -p 'test_issuer_refresh.py'",workflow)

if __name__=='__main__':unittest.main()
