"""Source qualification, fee scopes and last-good retention regression tests."""
import copy
import json
import pathlib
import unittest
from collect_broker_tariffs import collect, SOURCES
from broker_tariff_extensions import parse, parse_supplement, SUPPLEMENT_SOURCES
FIXTURES=pathlib.Path(__file__).parent/'fixtures/broker-tariffs'
TODAY='2026-10-08'
def fixture(name):return (FIXTURES/name).read_text()
class BrokerTariffTests(unittest.TestCase):
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
 def test_changed_rate_propagates_to_copy(self):
  s=fixture('saxo.txt').replace('0,08%','0,09%')
  o=parse('saxo',s,TODAY)
  self.assertEqual(o['values']['rate'],.09);self.assertIn('0,09 %',o['copy']['full'])
 def test_supplement_scope_and_period(self):
  results={key:parse_supplement(key,fixture('ibkr_pea.txt' if key.startswith('ibkr_pea_') else key+'.txt'),TODAY)[2] for key in SUPPLEMENT_SOURCES}
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
if __name__=='__main__':unittest.main()
