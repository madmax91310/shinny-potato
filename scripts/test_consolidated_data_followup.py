import unittest
from build_consolidated_data_followup import consolidate

ISIN='IE00BJ5JP097'
def old(d,k,id='',field=''):
    return dict(dimension=d,cle=k,id=id,champ=field,avant='blocked',apres='ancienne capture',motif='preuve ancienne',preuve='old.json')
class ConsolidatedFollowup(unittest.TestCase):
    def run_case(self,legacy,**overrides):
        kwargs=dict(inventory={'connections':[],'consumerUsage':{'tools':[]}},financial={'rows':[]},forensics=[],actions=[],modules=[],monitor={'monitoring':{'active':{}}},review={'schedule':[],'items':[]})
        kwargs.update(overrides);return consolidate(legacy,**kwargs)
    def test_financial_overlap_keeps_both_original_rows_but_one_case(self):
        rows=self.run_case([old('comparaison financière',ISIN+'/2023',ISIN,'2023'),old('reliquat historique initial','0:'+ISIN+'/2023',ISIN+'/2023')],financial={'rows':[{'isin':ISIN,'year':2023,'status':'correction avec résidu','open':False,'residualOpen':True}]})
        self.assertEqual(len(rows),1);self.assertEqual(len(rows[0]['origines']),2);self.assertTrue(rows[0]['reliquat_actif'])
    def test_current_inapplicable_capability_is_not_a_missing_financial_value(self):
        rows=self.run_case([old('couverture','instrument:'+ISIN+':sectors',ISIN,'sectors')],inventory={'connections':[{'type':'instrument','id':ISIN,'field':'sectors','actionState':'not-applicable','requiresAction':False}],'consumerUsage':{'tools':[]}})
        self.assertEqual(rows[0]['type_defaut'],'non applicable');self.assertFalse(rows[0]['reliquat_actif'])
    def test_current_incident_replaces_stale_snapshot_without_losing_provenance(self):
        key='collection:daily:world'
        rows=self.run_case([old('incident actif initial',key),old('incident actif au contrôle final',key)],monitor={'monitoring':{'active':{key:{'cause':'Missing2026-10-23','tools':['Portefeuilles IA']}}}})
        self.assertEqual(len(rows),1);self.assertEqual(rows[0]['axe'],'supervision');self.assertEqual(len(rows[0]['origines']),2);self.assertEqual(rows[0]['probleme'],'Missing2026-10-23')
    def test_unobserved_contract_is_not_marked_resolved(self):
        rows=self.run_case([old('usage requis initial','/outil|part|champ')])
        self.assertIn('absent',rows[0]['statut_donnees']);self.assertIn('ne vaut pas résolution',rows[0]['niveau_preuve'])
    def test_module_verification_and_old_remainder_share_one_record(self):
        rows=self.run_case([old('reliquat historique initial','0:scripts/helper.py','scripts/helper.py'),old('module qualifié','scripts/helper.py','scripts/helper.py')],modules=[{'module':'scripts/helper.py','statut':'scénario local uniquement','reliquat_initial_81':'True','reliquat':'transport non vérifié'}])
        self.assertEqual(len(rows),1);self.assertTrue(rows[0]['verification_en_attente']);self.assertEqual(len(rows[0]['origines']),2)
if __name__=='__main__':unittest.main()
