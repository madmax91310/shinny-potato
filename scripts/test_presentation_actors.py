import copy
import datetime as dt
import json
import pathlib
import unittest
from collect_presentation_actors import parse,refresh,SOURCES,PATH
ROOT=pathlib.Path(__file__).parent
TODAY=dt.date(2026,10,9)
class ActorTermsTests(unittest.TestCase):
 def fixtures(self):return json.loads((ROOT/'fixtures/presentation-actors/public-terms.json').read_text())
 def test_scoped_terms_and_fee_exceptions(self):
  parsed={id_:parse(id_,['<article>'+t+'</article>' for t in docs],TODAY) for id_,docs in self.fixtures().items()}
  self.assertEqual(set(parsed),set(SOURCES))
  self.assertEqual([o['id'] for o in parsed['fundora']['offers']],['classique','horizon'])
  self.assertIn('2 à 3 %',parsed['fundora']['offers'][0]['fields']['fees']['value'])
  self.assertIn('0,3 à 0,5 %',parsed['fundora']['offers'][1]['fields']['fees']['value'])
  self.assertIn('2316 €/UC',parsed['mymarguerit']['offers'][0]['fields']['access']['value'])
  self.assertIn('2500 € non libéré',parsed['enerfip']['offers'][0]['fields']['fees']['value'].replace('2 500','2500'))
  self.assertIn('n’est pas une durée de blocage',parsed['bacchus']['offers'][0]['fields']['duration']['value'])
  self.assertIn('sur les fermages',parsed['hectarea']['offers'][0]['fields']['fees']['value'])
  self.assertIn('au-delà',parsed['france-valley']['offers'][0]['fields']['fees']['value'])
  self.assertEqual(len(parsed['matis']['offers'][0]['warnings']),1)
  for record in parsed.values():
   for offer in record['offers']:
    self.assertTrue(offer['missing'])
    self.assertEqual(set(offer['fields']),{'access','fees','duration','income','exit'})
 def test_wrong_page_disappearing_qualifier_and_unit_price_conflict(self):
  fixtures=self.fixtures()
  for id_,old,new in [('mymarguerit','2 316','2 999'),('enerfip','fonds n’ont pas été libérés','fonds ont été libérés'),('france-valley','0,018% TTC','variable'),('fundora','possibles extensions','sans extensions'),('hectarea','sur la plus-value lors du rachat','sur une autre base')]:
   docs=copy.deepcopy(fixtures[id_]);docs[0]=docs[0].replace(old,new)
   with self.assertRaises(ValueError,msg=id_):parse(id_,docs,TODAY)
  with self.assertRaises(ValueError):parse('matis',['<h1>Autre placement</h1>','Matis'],TODAY)
  with self.assertRaises(ValueError):parse('hectarea',fixtures['hectarea'][:1],TODAY)
 def test_atomic_preservation_and_independent_recovery(self):
  previous=json.loads(PATH.read_text());one=copy.deepcopy(previous['fundora']);one['offers'].pop()
  def failure(day):raise ValueError('Page indisponible')
  data,report=refresh(previous,{'fundora':lambda day:one,'matis':failure,'bricks':lambda day:copy.deepcopy(previous['bricks'])},TODAY)
  self.assertEqual(data,previous)
  self.assertEqual([o['status'] for o in report['observations']],['failure','failure','success'])
  self.assertIn('disappeared',report['observations'][0]['reason'])
  newer=copy.deepcopy(previous['mymarguerit']);newer['offers'][0]['fields']['fees']['effectiveAt']='2025-01-01'
  data,report=refresh(previous,{'mymarguerit':lambda day:newer},TODAY)
  self.assertEqual(data,previous);self.assertEqual(report['observations'][0]['status'],'failure')
if __name__=='__main__':unittest.main()
