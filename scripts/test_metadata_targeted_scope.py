"""A targeted retry cannot become a zero-row success or erase unrelated incidents."""
import unittest
from collect_instrument_metadata import select_sources

class TargetedScope(unittest.TestCase):
    def setUp(self):self.sources=[{'isin':'FR0007054358'},{'isin':'IE00B0M62S72'}]
    def test_default_preserves_full_scope(self):self.assertEqual(select_sources(self.sources,None),self.sources)
    def test_spaces_commas_case_and_duplicates(self):self.assertEqual(select_sources(self.sources,[' fr0007054358,FR0007054358 ']),self.sources[:1])
    def test_empty_explicit_scope_fails(self):
        for values in [[],[' '],[',,']]:
            with self.assertRaisesRegex(ValueError,'vide'):select_sources(self.sources,values)
    def test_one_unknown_rejects_the_entire_request(self):
        with self.assertRaisesRegex(ValueError,'UNKNOWN'):select_sources(self.sources,['FR0007054358,UNKNOWN'])
    def test_unknown_is_not_silently_dropped(self):
        with self.assertRaises(ValueError):select_sources(self.sources,['FR0007054359'])

class MetadataOwnership(unittest.TestCase):
    def test_unrelated_field_is_retired_without_recovering_the_data(self):
        from publish_automation_status import update_status,REGISTRY
        from automation_monitoring import evaluate_monitoring
        wf='update-instrument-metadata.yml';at='2026-10-24T10:00:00Z';foreign='IE00B0M62S72:aum';owned='IE00B0M62S72:pea:qualification'
        old={'workflows':{wf:{'runId':1,'completedAt':'2026-10-23T00:00:00Z','dataFailures':{foreign:{'cause':'Ancien encours','completedAt':'2026-10-23T00:00:00Z'},owned:{'cause':'PEA en conflit'}}}},'monitoring':{'active':{'collection:'+wf+':'+foreign:{'id':'collection:'+wf+':'+foreign,'workflow':wf,'dataId':foreign,'kind':'collection','firstSeenAt':'2026-10-23T00:00:00Z'}}}}
        run={'id':2,'path':'.github/workflows/'+wf,'head_branch':'master','event':'workflow_dispatch','status':'completed','conclusion':'success','updated_at':at,'created_at':at,'html_url':'https://github.com/test/repo/actions/runs/2'}
        new=update_status(old,run,[],[{'successes':[{'id':'FR0007054358:distribution'}],'errors':[]}]);row=new['workflows'][wf]
        self.assertEqual(set(row['dataFailures']),{owned});self.assertEqual(row['retiredDataFailures'][foreign]['completedAt'],'2026-10-23T00:00:00Z')
        context={'schemaVersion':1,'alerts':[],'entities':[],'fieldAlerts':[{'id':'instrument:IE00B0M62S72:aum','kind':'freshness','cause':'Encours encore ancien','tools':['Présentation ETF']}]}
        monitor=evaluate_monitoring(new,context,{wf:REGISTRY[wf]},at,{'errors':[]})
        self.assertIn('field:instrument:IE00B0M62S72:aum',monitor['active']);self.assertEqual(len(monitor['retired']),1);self.assertFalse(monitor['resolved']);self.assertIn('aucune réparation',monitor['retired'][0]['retirementReason'])
    def test_unregistered_entity_does_not_belong_to_the_collector(self):
        from automation_contracts import owns_failure
        cfg={"dataFailureFieldContract":"instrument-metadata-fields.json","dataFailureEntityContract":"instrument-metadata-sources.json"}
        self.assertFalse(owns_failure(cfg,"ZZ0000000000:pea"))
        self.assertTrue(owns_failure(cfg,"FR0007054358:pea"))

    def test_unknown_non_field_incidents_are_not_hidden(self):
        from automation_contracts import owns_failure
        cfg={'dataFailureFieldContract':'instrument-metadata-fields.json'}
        self.assertTrue(owns_failure(cfg,'transport-failure'));self.assertTrue(owns_failure(cfg,'IE00B0M62S72:transport-failure')); self.assertTrue(owns_failure(cfg,'IE00B0M62S72:pea:qualification'));self.assertFalse(owns_failure(cfg,'IE00B0M62S72:countries'))

if __name__ == "__main__":
    unittest.main()
