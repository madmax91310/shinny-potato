"""Removing a tool must not remove shared financial data or claim a recovery."""
import hashlib,json,pathlib,unittest
from automation_monitoring import evaluate_monitoring
from publish_automation_status import include_configured_workflows
from build_consolidated_data_followup import consolidate
ROOT=pathlib.Path(__file__).resolve().parents[1]
class RemovedScope(unittest.TestCase):
    def test_exclusive_page_data_and_writers_are_gone(self):
        for path in ['src/pages/ai-portfolios','data/ai-portfolios','public/data/ai-portfolios','.github/workflows/ai-owner-requests.yml','.github/workflows/update-ai-portfolios.yml','scripts/collect_ai_portfolios.py','scripts/ai-portfolios.mjs']:
            self.assertFalse((ROOT/path).exists(),path)
    def test_shared_financial_sources_remain_available(self):
        # Values may legitimately refresh later. This guards deletion scope,
        # while shared calculation tests and the delivery proof check values.
        required=json.loads((ROOT/'scripts/removed-tool-scopes.json').read_text())['sharedSources']
        for path in required:
            self.assertTrue((ROOT/path).is_file(),path)
            self.assertTrue(json.loads((ROOT/path).read_text()),path)
    def test_scope_removal_retires_and_does_not_repair_a_source(self):
        key='collection:update-ai-portfolios.yml:quote'
        old={'monitoring':{'active':{key:{'id':key,'workflow':'update-ai-portfolios.yml','tools':['Portefeuilles IA'],'firstSeenAt':'2026-10-20','lastSuccessAt':'2026-10-21','cause':'missing close'}}},'workflows':{'update-ai-portfolios.yml':{'dataFailures':{'quote':{'cause':'missing close'}}}}}
        result=evaluate_monitoring(old,{'schemaVersion':1,'alerts':[],'entities':[]},{},'2026-10-24T12:00:00Z')
        self.assertNotIn(key,result['active']);self.assertIn('monitor:radar',result['active']);self.assertFalse(result['resolved'])
        self.assertEqual(result['retired'][0]['retirementStatus'],'scope-removed')
        self.assertEqual(result['retired'][0]['lastSuccessAt'],'2026-10-21')
        self.assertIn('Périmètre supprimé',result['retired'][0]['retirementReason'])
        self.assertNotIn('update-ai-portfolios.yml',include_configured_workflows(old)['workflows'])
    def test_common_source_incident_loses_only_its_ia_attribution(self):
        cfg={'common.yml':{'name':'Common quotes','tools':['Performance depuis','Portefeuilles IA'],'maxAgeHours':48}}
        state={'workflows':{'common.yml':{'completedAt':'2026-10-24T10:00:00Z','dataFailures':{'quote':{'cause':'source unavailable'}}}}}
        r=evaluate_monitoring(state,{'schemaVersion':1,'alerts':[],'entities':[]},cfg,'2026-10-24T12:00:00Z')
        self.assertEqual(r['active']['collection:common.yml:quote']['tools'],['Performance depuis'])
        self.assertEqual(r['active']['collection:common.yml:quote']['cause'],'source unavailable')
    def test_future_report_does_not_reintroduce_removed_module_requirements(self):
        legacy=[{'dimension':'reliquat historique initial','cle':'x','id':'scripts/collect_ai_portfolios.py','champ':'','avant':'blocked','apres':'old','motif':'old failure','preuve':'historic.json'}]
        r=consolidate(legacy,{'connections':[],'consumerUsage':{'tools':[]}},{'rows':[]},[],[],[],{'monitoring':{'active':{}}},{'schedule':[],'items':[]})[0]
        self.assertEqual(r['statut_donnees'],'périmètre supprimé');self.assertFalse(r['reliquat_actif']);self.assertFalse(r['verification_en_attente']);self.assertEqual(len(r['origines']),1)
if __name__=='__main__':unittest.main()
