"""Source qualification, fee scopes and last-good retention regression tests."""
import copy
import json
import pathlib
import unittest
from unittest.mock import patch
from types import SimpleNamespace
from collect_broker_tariffs import collect, SOURCES, SOURCE_ALTERNATIVES
from broker_tariff_extensions import parse, parse_supplement, SUPPLEMENT_SOURCES
FIXTURES=pathlib.Path(__file__).parent/'fixtures/broker-tariffs'
TODAY='2026-10-08'
def fixture(name):return (FIXTURES/name).read_text()
class BrokerTariffTests(unittest.TestCase):
 def test_long_contract_extraction_keeps_bounded_default(self):
  from issuer_documents import pdf_text
  with patch('issuer_documents.subprocess.run',return_value=SimpleNamespace(stdout=b'x'*2_000_001)):
   with self.assertRaises(ValueError):pdf_text(b'%PDF-')
   self.assertEqual(len(pdf_text(b'%PDF-',max_text_bytes=4_000_000)),2_000_001)
  with patch('issuer_documents.subprocess.run',return_value=SimpleNamespace(stdout=b'x'*4_000_001)):
   with self.assertRaises(ValueError):pdf_text(b'%PDF-',max_text_bytes=4_000_000)
 def test_exact_markets_and_account_columns(self):
  expected={'saxo':{'rate':.08,'minimum':2},'xtb':{'threshold':100000,'rate':.2},'caidf':{'initial':.5,'small':.48,'middle':.18,'large':.12,'annual':96,'orders':12},'ibkr':{'rate':.05,'minimum':1.25,'fixedMinimum':3,'directRate':.10},'tr':{'minimum':1},'bd':{'fee0':.99,'fee1':1.9,'fee2':2.9,'fee3':3.8,'rate':.09}}
  for name,values in expected.items():
   path={'ibkr':'ibkr.html','tr':'tr_fee.txt','bd':'bd-synthetic.txt'}.get(name,name+'.txt')
   with self.subTest(broker=name):
    actual=parse(name,fixture(path),TODAY)
    for key,value in values.items():self.assertEqual(actual['values'][key],value)
  xtb=parse('xtb',fixture('xtb.txt'),TODAY)
  self.assertEqual(xtb['fields']['garde']['values'],{'rate':.02,'threshold':250000})
  self.assertEqual(xtb['fields']['sortant']['values'],{'perLine':15,'maximum':150})
  self.assertEqual(xtb['asOf'],'2026-09-30') # URL still contains 052026.
 def test_reject_missing_market_exemption_and_wrong_columns(self):
  for name,path,old,new in [('ibkr','ibkr.html','France','Allemagne'),('xtb','xtb.txt',"La commission minimale pour les transactions sur OMI n'est pas facturée pour le PEA",'Exemption supprimée'),('caidf','caidf.txt','0,99€','colonne supprimée')]:
   with self.subTest(broker=name),self.assertRaises((ValueError,IndexError)):
    parse(name,fixture(path).replace(old,new),TODAY)
 def test_reject_reordered_tariff_columns(self):
  with self.assertRaises(ValueError):parse('saxo',fixture('saxo.txt').replace('Classic','TEMP').replace('VIP','Classic').replace('TEMP','VIP'),TODAY)
  text=fixture('ibkr.html').replace('Fixe - IB SmartRouting','TEMP').replace('Fixe - Routage direct','Fixe - IB SmartRouting').replace('TEMP','Fixe - Routage direct')
  with self.assertRaises(ValueError):parse('ibkr',text,TODAY)
 def test_dates_future_and_regression(self):
  s=fixture('xtb.txt')
  with self.assertRaises(ValueError):parse('xtb',s,'2026-09-01')
  with self.assertRaises(ValueError):parse('xtb',s,TODAY,{'asOf':'2026-10-01'})
  self.assertIsNone(parse('ibkr',fixture('ibkr.html'),TODAY)['asOf'])
  self.assertEqual(parse('tr',fixture('tr_fee.txt'),TODAY)['dateStatus'],'not-published')
 def test_live_bourse_direct_pea_and_foreign_exceptions(self):
  o=parse('bd',fixture('bd.txt'),TODAY)
  self.assertEqual(o['asOf'],'2026-01-06')
  self.assertEqual(o['fields']['change']['values'],{'rate':.08})
  self.assertEqual(o['fields']['garde']['values'],{'fee':0,'foreignAnnualRate':.036})
  self.assertEqual(o['fields']['sortant']['values'],{'perLine':15,'unlistedPerLine':50,'maximum':150})
  self.assertEqual(o['fields']['sortant']['page'],4)
  self.assertIn('autres marchés',o['fields']['change']['copy']['full'])
  self.assertNotIn('500.0',o['copy']['full'])
  with self.assertRaises(ValueError):parse('bd',fixture('bd.txt').replace('PEA, PEA-PME, PEA JEUNES','Compte titres ordinaire'),TODAY)
  changed=fixture('bd.txt').replace('0,08% par opération','0,10% par opération')
  self.assertEqual(parse('bd',changed,TODAY)['fields']['change']['values']['rate'],.1)
 def test_changed_rate_propagates_to_copy(self):
  s=fixture('saxo.txt').replace('0,08%','0,09%')
  o=parse('saxo',s,TODAY)
  self.assertEqual(o['values']['rate'],.09);self.assertIn('0,09 %',o['copy']['full'])
 def test_supplement_scope_and_period(self):
  results={key:parse_supplement(key,fixture('ibkr_pea.txt' if key.startswith('ibkr_pea_') else 'tr_pea_contract.txt' if key.startswith('tr_pea_transfer') else key+'.txt'),TODAY)[2] for key in SUPPLEMENT_SOURCES}
  self.assertEqual(results['ibkr_pea_garde']['values'],{'fee':0})
  self.assertEqual(results['ibkr_pea_transfer']['values'],{'fee':0})
  with self.assertRaises(ValueError):parse_supplement('ibkr_pea_garde',fixture('ibkr_pea.txt').replace('Pas de droits de garde','Droits de garde payants'),TODAY)
  self.assertEqual(results['ibkr_fx']['values'],{'manualRate':.002,'minimumUsd':2,'automaticRate':.03})
  self.assertIn('Disponibilité à confirmer sur PEA',results['ibkr_fx']['copy']['full'])
  self.assertEqual(results['bourso_transfer']['values']['maximum'],3000)
  self.assertEqual(results['fortuneo_transfer']['values']['maximum'],2000)
  self.assertEqual(results['saxo_offer']['until'],'2026-12-31')
  self.assertEqual(results['saxo_offer']['start'],'2026-02-23')
  self.assertEqual(results['saxo_amundi']['values']['transferLockMonths'],6)
  self.assertEqual(results['saxo_transfer']['values']['maximum'],150)
  self.assertEqual(results['saxo_transfer']['until'],'2026-12-31')
  self.assertEqual(results['tr_garde_cto']['values']['fee'],0)
  self.assertEqual(results['tr_direct']['values'],{'fee':2,'standardFee':1,'venueFee':1})
  self.assertEqual(results['xtb_pea_transfer']['values'],{'available':0})
  self.assertIn('pas encore disponible',results['xtb_pea_transfer']['copy']['full'])
  with self.assertRaises(ValueError):parse_supplement('xtb_pea_transfer',fixture('xtb_pea_transfer.txt').replace('ne propose pas encore','propose désormais'),TODAY)
  with self.assertRaises(ValueError):parse_supplement('tr_direct',fixture('tr_direct.txt').replace('2 €','3 €'),TODAY)
  self.assertIn('ne qualifie pas',results['tr_transfer_cto']['copy']['full'])
  with self.assertRaises(ValueError):parse_supplement('saxo_transfer',fixture('saxo_transfer.txt').replace('facturation','inconnu'),TODAY)
 def test_source_failure_retains_independent_fields_and_recovers(self):
  baseline={'schemaVersion':1,'brokers':{'saxo':{'asOf':'2026-05-05','checkedAt':'2026-10-01','fields':{'offerPea':{'copy':{'full':'previous qualified offer'}}}}}}
  original=copy.deepcopy(baseline)
  def fail(url):raise RuntimeError('Source unavailable')
  result,failures,validated=collect(baseline,TODAY,fail)
  self.assertEqual(result,original);self.assertEqual(validated,[]);self.assertIn('saxo',failures)
  def partly(url):
   if url==SOURCES['saxo']:return fixture('saxo.txt')
   raise RuntimeError('Source unavailable')
  result,failures,validated=collect(baseline,TODAY,partly)
  self.assertEqual(validated,['saxo']);self.assertEqual(result['brokers']['saxo']['fields']['offerPea'],original['brokers']['saxo']['fields']['offerPea'])
  self.assertEqual(result['brokers']['saxo']['fields']['change']['values']['rate'],.25)
  self.assertIn('saxo_offer',failures)
 def test_pea_transfer_clauses_never_infer_fees(self):
  for key in ('tr_pea_transfer','tr_pea_transfer_out'):
   o=parse_supplement(key,fixture('tr_pea_contract.txt'),TODAY)[2]
   self.assertEqual(o['page'],189);self.assertEqual(o['values']['available'],1)
   self.assertEqual(o['publicationMonth'],'2026-09')
   with self.assertRaises(ValueError):parse_supplement(key,fixture('tr_pea_contract.txt'),'2026-08-01')
   self.assertNotIn('fee',o['values']);self.assertIn('Frais' if key=='tr_pea_transfer' else 'frais',o['copy']['full'])
   with self.assertRaises(ValueError):parse_supplement(key,fixture('tr_pea_contract.txt').replace('reject','accept'),TODAY)
   with self.assertRaises(ValueError):parse_supplement(key,fixture('tr_pea_contract.txt').replace('Country Conditions France','Country Conditions Germany'),TODAY)
  o=parse_supplement('caidf_pea_transfer',fixture('caidf_pea_transfer.txt'),TODAY)[2]
  self.assertEqual(o['values'],{'available':1,'taxAgePreserved':1})
  self.assertNotIn('fee',o['values']);self.assertIn('à confirmer',o['copy']['full'])
  with self.assertRaises(ValueError):parse_supplement('caidf_pea_transfer',fixture('caidf_pea_transfer.txt').replace('n’entraine pas','entraine'),TODAY)
  previous={'publicationMonth':'2026-10','copy':{'full':'Previously validated contract'}}
  baseline={'brokers':{'tr':{'fields':{'entrant':copy.deepcopy(previous)}}}}
  def fetch(url):
   if url==SUPPLEMENT_SOURCES['tr_pea_transfer'][2]:return fixture('tr_pea_contract.txt')
   raise ValueError('unavailable')
  state,failures,_=collect(baseline,TODAY,fetch)
  self.assertEqual(state['brokers']['tr']['fields']['entrant'],previous)
  self.assertIn('tr_pea_transfer',failures)
 def test_official_alternative_requires_valid_pea_table(self):
  alternate=SOURCE_ALTERNATIVES['bd'][0]
  def fetch(url):
   if url==alternate:return fixture('bd-synthetic.txt')
   raise ValueError('HTTP 502')
  state,failures,validated=collect({'schemaVersion':1,'brokers':{}},TODAY,fetch)
  self.assertEqual(validated,['bd']);self.assertNotIn('bd',failures)
  self.assertEqual(state['brokers']['bd']['sourceUrl'],alternate)
  previous=copy.deepcopy(state)
  def invalid(url):
   if url==alternate:return fixture('bd-synthetic.txt').replace('PEA','CTO')
   raise ValueError('HTTP 502')
  state,failures,validated=collect(state,TODAY,invalid)
  self.assertEqual(state,previous);self.assertEqual(validated,[])
  self.assertIn(SOURCES['bd'],failures['bd']);self.assertIn(alternate,failures['bd'])
if __name__=='__main__':unittest.main()
