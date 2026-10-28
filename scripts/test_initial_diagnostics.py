import unittest
from reconcile_initial_diagnostics import reconcile
class Reconciliation(unittest.TestCase):
 def run_case(self,kind='qualification',evidence=None):
  r={'id':'workflow:test','workflow':'test','runId':1,'completedAt':'2026-10-26T10:00:00Z','failedSteps':[{'job':'refresh','step':'Commit validated observations'}]};resolved=[r|{'resolvedAt':'2026-10-27T10:00:00Z','resolutionEvidence':evidence}]if evidence is not None else[];m={'updatedAt':'2026-10-28T10:00:00Z','monitoring':{'active':{r['id']:{'proofStatus':'resolution-unproven'}},'resolved':resolved},'workflows':{'test':{'runId':2,'completedAt':'2026-10-27T11:00:00Z','recordingStatus':'success'}}};row={'id':r['id'],'kind':kind};return reconcile([{'id':r['id'],'statut':'toujours visible'}],[r],[row],[row]if kind!='history'else[],m)[0]
 def test_green_stage_does_not_close_unknown_old_scope(self):
  x=self.run_case();self.assertTrue(x['etape_technique_retablie']);self.assertFalse(x['panne_actuelle_demontree']);self.assertTrue(x['qualification_manquante']);self.assertFalse(x['resolution_episode_initial_prouvee']);self.assertTrue(x['presence_boite_active'])
 def test_history_not_active_and_no_resolution_without_evidence(self):
  x=self.run_case('history');self.assertFalse(x['presence_boite_active']);self.assertFalse(x['resolution_episode_initial_prouvee'])
 def test_named_steps_and_newer_bound_evidence_required(self):
  good={'completedAt':'2026-10-27T10:00:00Z','runUrl':'run2','checks':[{'job':'refresh','step':'Commit validated observations'}]};self.assertTrue(self.run_case(evidence=good)['resolution_episode_initial_prouvee']);self.assertFalse(self.run_case(evidence=good|{'checks':[]})['resolution_episode_initial_prouvee']);self.assertFalse(self.run_case(evidence=good|{'completedAt':'2026-10-25T10:00:00Z'})['resolution_episode_initial_prouvee'])
 def test_empty_export_never_means_repaired(self):
  x=reconcile([{'id':'missing'}],[{'id':'missing'}],[],[],{})[0];self.assertFalse(x['resolution_episode_initial_prouvee']);self.assertIn('non démontrée',x['statut'])
 def test_group_members_preserve_initial_identity(self):
  r={'id':'a'};parent={'id':'group','kind':'connection','signals':[{'members':[r]}]};x=reconcile([r],[r],[parent],[parent],{})[0];self.assertTrue(x['presence_boite_active']);self.assertIn('group',x['ids_groupes_actuels'])
if __name__=='__main__':unittest.main()
