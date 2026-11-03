import copy
import datetime as dt
import json
import pathlib
import unittest
from collect_presentation_actors import parse,refresh,SOURCES,platform_activity
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
    if record['id'] in ('tudigo','lendosphere'):
     self.assertEqual(set(offer['fields']), {'access','fees','duration','income','exit'})
     self.assertIn('distinct',offer['scope'])
    elif record['id'] in ('bricks','enerfip','matis'):
     self.assertEqual(offer['missing'],[])
    else:self.assertTrue(offer['missing'])
    self.assertEqual(set(offer['fields']),{'access','fees','duration','income','exit'})
 def test_platform_scope_keeps_general_fee_gap_and_project_boundaries(self):
  for id_ in ('bricks','enerfip','hectarea','matis'):
   o=parse(id_,self.fixtures()[id_],TODAY)['offers'][0]
   self.assertEqual(o['scopeType'],'platform')
   self.assertTrue(o['projectRequirements'])
   self.assertIn('échéance' if id_!='matis' else 'durée',o['projectRequirements'][0])
   self.assertEqual(bool(o['missing']),id_=='hectarea')
   if id_=='hectarea':self.assertIn('petits retraits',o['missing'][0])
  matis=parse('matis',self.fixtures()['matis'],TODAY)['offers'][0]
  self.assertTrue(matis['warnings'])
  self.assertIn('bases et montants propres',matis['fields']['fees']['value'])
 def test_wrong_page_disappearing_qualifier_and_unit_price_conflict(self):
  fixtures=self.fixtures()
  for id_,old,new in [('mymarguerit','2 316','2 999'),('enerfip','fonds n’ont pas été libérés','fonds ont été libérés'),('france-valley','0,018% TTC','variable'),('fundora','possibles extensions','sans extensions'),('hectarea','sur la plus-value lors du rachat','sur une autre base')]:
   docs=copy.deepcopy(fixtures[id_]);docs[0]=docs[0].replace(old,new)
   with self.assertRaises(ValueError,msg=id_):parse(id_,docs,TODAY)
  with self.assertRaises(ValueError):parse('matis',['<h1>Autre placement</h1>','Matis'],TODAY)
  with self.assertRaises(ValueError):parse('hectarea',fixtures['hectarea'][:1],TODAY)
 def test_offer_specific_fees_ownership_and_closed_status(self):
  docs=self.fixtures()
  anaxago=parse('anaxago',docs['anaxago'],TODAY)
  e,b=anaxago['offers']
  self.assertEqual(e['id'],'axclimat-i')
  self.assertIn('1,9 %/an',e['fields']['fees']['value'])
  self.assertNotIn('20 % à la souscription',e['fields']['access']['value'])
  self.assertIn('1,7 %/an',b['fields']['fees']['value'])
  self.assertIn('20 % à la souscription',b['fields']['access']['value'])
  self.assertEqual(e['availability']['asOf'],'2026-02-04')
  for changed in [docs['anaxago'][0].replace('Part E : 1,90%','Part E : inconnu'),docs['anaxago'][0].replace('part E qui','part A qui'),docs['anaxago'][0].replace('SLP','AUTRE')]:
   with self.assertRaises(ValueError):parse('anaxago',[changed,docs['anaxago'][1]],TODAY)
  with self.assertRaises(ValueError):parse('anaxago',[docs['anaxago'][0],docs['anaxago'][1].replace('Souscriptions terminées','Ouvert')],TODAY)
  with self.assertRaises(ValueError):parse('anaxago',[docs['anaxago'][0],docs['anaxago'][1].replace('04/02/2026','04/02/2027')],TODAY)
  valley=parse('france-valley',docs['france-valley'],TODAY)
  p,f,s=valley['offers']
  self.assertEqual([o['id'] for o in valley['offers']],['gfi-patrimoine','gfi-forets','fonciere-europe'])
  self.assertIn('10200 € TTC',f['fields']['fees']['value'])
  self.assertIn('6000 € TTC/an',s['fields']['fees']['value'])
  self.assertIn('Actions de la SAS',s['presentation']['vehicle'])
  self.assertIn('0,6 % TTC/an',s['fields']['fees']['value'])
  self.assertEqual(p['fields']['exit']['effectiveAt'],'2026-04-20')
  self.assertTrue(p['fields']['exit']['sourceUrl'].endswith('.pdf'))
  with self.assertRaises(ValueError):parse('france-valley',[docs['france-valley'][0],docs['france-valley'][2],docs['france-valley'][1],docs['france-valley'][3]],TODAY)
  bricks=parse('bricks',docs['bricks'],TODAY)['offers'][0]
  self.assertIn('1,2 € TTC',bricks['fields']['fees']['value'])
  self.assertIn('année glissante',bricks['fields']['fees']['value'])
  with self.assertRaises(ValueError):parse('bricks',[docs['bricks'][0],docs['bricks'][1].replace('offrons 2 retraits','offrons 3 retraits')],TODAY)
 def test_atomic_preservation_and_independent_recovery(self):
  # Stable fixture dates: production observations advance on each automatic refresh.
  previous={id_:parse(id_,docs,TODAY) for id_,docs in self.fixtures().items()}
  one=copy.deepcopy(previous['fundora']);one['offers'].pop()
  def failure(day):raise ValueError('Page indisponible')
  data,report=refresh(previous,{'fundora':lambda day:one,'matis':failure,'bricks':lambda day:copy.deepcopy(previous['bricks'])},TODAY)
  self.assertEqual(data,previous)
  self.assertEqual([o['status'] for o in report['observations']],['failure','failure','success'])
  self.assertIn('disappeared',report['observations'][0]['reason'])
  newer=copy.deepcopy(previous['mymarguerit']);newer['offers'][0]['fields']['fees']['effectiveAt']='2025-01-01'
  data,report=refresh(previous,{'mymarguerit':lambda day:newer},TODAY)
  self.assertEqual(data,previous);self.assertEqual(report['observations'][0]['status'],'failure')
class PlatformActivityTests(unittest.TestCase):
 def test_real_notice_identity_dates_and_consistent_routes(self):
  doc=(ROOT/'fixtures/presentation-actors/tudigo-cessation-20261023.html').read_text()
  day=dt.date(2026,10,23);a=platform_activity('tudigo',[doc,doc],day)
  self.assertEqual(a['status'],'ceased');self.assertEqual(a['judgmentAt'],'2026-10-12')
  self.assertEqual(a['checkedAt'],'2026-10-23')
  for changed in [doc.replace('Tudigo','Autre plateforme'),doc.replace('12 octobre 2026','12 octobre 2027')]:
   with self.assertRaises(ValueError):platform_activity('tudigo',[changed,changed],day)
  unknown=doc.replace('Vos accès ne sont pas encore ouverts','Accès ouverts')
  partial=platform_activity('tudigo',[unknown,unknown],day)
  self.assertEqual(partial['status'],'ceased');self.assertEqual(partial['runoffAccess'],'not-published')
  self.assertNotIn('accès ne sont pas encore ouverts',partial['notice'])
  with self.assertRaises(ValueError):platform_activity('tudigo',[doc,'Conditions Tudigo'],day)
 def test_activity_does_not_renew_archived_terms_or_silently_reopen(self):
  doc=(ROOT/'fixtures/presentation-actors/tudigo-cessation-20261023.html').read_text();day=dt.date(2026,10,23)
  old=parse('tudigo',ActorTermsTests().fixtures()['tudigo'],TODAY);previous={'tudigo':old}
  activity=platform_activity('tudigo',[doc,doc],day)
  merged,report=refresh(previous,{'tudigo':lambda d:{'id':'tudigo','activity':activity}},day)
  self.assertEqual(report['observations'][0]['scope'],'platform-activity')
  self.assertEqual(merged['tudigo']['offers'],old['offers']);self.assertEqual(merged['tudigo']['checkedAt'],old['checkedAt'])
  self.assertNotIn('activity',previous['tudigo'])
  reopened=parse('tudigo',ActorTermsTests().fixtures()['tudigo'],day)
  kept,report=refresh(merged,{'tudigo':lambda d:reopened},day)
  self.assertEqual(kept,merged);self.assertEqual(report['observations'][0]['status'],'failure')
if __name__=='__main__':unittest.main()
