import datetime as dt
import json
import pathlib
import types
import unittest
from unittest.mock import patch
import collect_non_bond_expansion as funds
import company_round4_publications as companies

FIXTURES=pathlib.Path(__file__).parent/'fixtures/non-bond'
TODAY=dt.date(2026,10,13)
class NonBondSources(unittest.TestCase):
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
 def test_nike_actual_fiscal_dates_and_percent_columns(self):
  raw=(FIXTURES/'nike-income.html').read_bytes()
  row=companies.parse(raw,'nike','https://investors.nike.com/release',TODAY)[0]
  self.assertEqual(row['end'],'2026-08-31');self.assertEqual(row['revenue'],11_213_000_000)
  self.assertEqual(row['dilutedEPS'],.48)
  self.assertRaises(ValueError,companies.parse,raw.replace(b'NIKE, Inc.',b'Another issuer'), 'nike','https://issuer.example',TODAY)
 def test_disney_parent_income_matches_eps_not_consolidated_income(self):
  text=(FIXTURES/'disney-income.txt').read_text()
  pdf=types.SimpleNamespace(pages=[types.SimpleNamespace(extract_text=lambda **kw:text)])
  with patch.object(companies.pdfplumber,'open')as opened:
   opened.return_value.__enter__.return_value=pdf
   quarters=companies.parse(b'%PDF fixture','disney','https://s206.q4cdn.com/release',TODAY)
  q=next(r for r in quarters if r['durationMonths']==3)
  self.assertEqual(q['netIncome'],1_313_000_000);self.assertEqual(q['incomeBasis'],'part du groupe')
  self.assertRaises(ValueError,companies.parse,b'Not a PDF','disney','https://issuer.example',TODAY)
if __name__=='__main__':unittest.main()
