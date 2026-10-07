import copy
import pathlib
import unittest
from collect_regulatory_data import SOURCES, BASE, parse, collect
from collect_broker_tariffs import parse as tariff
from publish_automation_status import update_status
FIX = pathlib.Path(__file__).parent/'fixtures'
TODAY='2026-10-07'
class RegulatoryTests(unittest.TestCase):
 def raw(self,name):return (FIX/'regulatory'/f'{name}.xml').read_bytes()
 def test_real_documents_and_exact_envelopes(self):
  observations={name:parse(name,self.raw(name),TODAY) for name in SOURCES}
  self.assertEqual(observations['social']['values']['peaSocial'],18.6)
  self.assertEqual(observations['av']['values']['avSocial'],17.2)
  self.assertEqual(observations['av']['values']['avCoupleAllowance'],9200)
  self.assertEqual(observations['pea']['values']['peaCeiling'],150000)
  self.assertEqual(observations['cto']['publishedAt'],'2026-04-15')
 def test_identity_date_and_ambiguity_rejected(self):
  for raw in [self.raw('ldds'),self.raw('livret').replace(b'modified 2026-08-01',b'modified 2027-01-01'),self.raw('livret').replace(b'F2365',b'F0000')]:
   with self.assertRaises(ValueError):parse('livret',raw,TODAY)
  with self.assertRaises(ValueError):parse('livret',self.raw('livret'),TODAY,{'publishedAt':'2026-09-01'})
 def test_next_publication_and_changed_parameters(self):
  raw=self.raw('cto').replace(b'31,4',b'35,8').replace(b'18,6',b'23,0').replace(b'modified 2026-04-15',b'modified 2027-04-15')
  self.assertEqual(parse('cto',raw,'2027-04-16')['values']['ctoTotal'],35.8)
  with self.assertRaises(ValueError):parse('cto',raw.replace(b'35,8',b'36,8'),'2027-04-16')
 def test_failure_preserves_previous_source_others_update_and_recovery(self):
  urls={BASE+id_+'.xml':self.raw(name) for name,(id_,_,_) in SOURCES.items()}
  base,errors=collect({'schemaVersion':1,'sources':{}},lambda url:urls[url],TODAY);self.assertFalse(errors)
  broken=urls.copy();broken[BASE+'F22414.xml']=b'<invalid/>'
  changed,errors=collect(base,lambda url:broken[url],'2026-10-08')
  self.assertEqual(changed['sources']['av'],base['sources']['av']);self.assertIn('av',errors)
  self.assertEqual(changed['sources']['cto']['checkedAt'],'2026-10-08')
  fixed,errors=collect(changed,lambda url:urls[url],'2026-10-09');self.assertFalse(errors)
  self.assertEqual(fixed['sources']['av']['checkedAt'],'2026-10-09')
 def test_tariff_table_context_and_future_fee(self):
  for name in ['bourso','fortuneo']:
   content=(FIX/'broker-tariffs'/f'{name}.txt').read_text()
   observation=tariff(name,content,TODAY)
   self.assertEqual(observation['values']['threshold'],500)
   altered=content.replace('DÉCOUVERTE','OTHER') if name=='bourso' else content.replace('le 1er ordre inférieur ou égal','un ordre')
   with self.assertRaises(ValueError):tariff(name,altered,TODAY)
  content=(FIX/'broker-tariffs'/'fortuneo.txt').read_text().replace('sinon 0,35 %','sinon 0,45 %')
  self.assertEqual(tariff('fortuneo',content,TODAY)['values']['rate'],.45)
 def test_failure_alert_cleared_only_by_successful_full_run(self):
  run={'id':1,'path':'.github/workflows/update-regulatory-data.yml','head_branch':'master','event':'schedule','status':'completed','conclusion':'failure','updated_at':'2026-10-07T10:00:00Z','html_url':'https://github.com/test/run/1'}
  failed=update_status({},run,[]);self.assertEqual(failed['workflows']['update-regulatory-data.yml']['status'],'failure')
  run.update(id=2,conclusion='success',updated_at='2026-10-08T10:00:00Z')
  self.assertEqual(update_status(failed,run,[])['workflows']['update-regulatory-data.yml']['status'],'success')
if __name__=='__main__':unittest.main()
