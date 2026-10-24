import unittest
from build_consolidated_data_followup import consolidate,apply_use_contracts,write_views

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
        rows=self.run_case([old('incident actif initial',key),old('incident actif au contrôle final',key)],monitor={'monitoring':{'active':{key:{'cause':'Missing2026-10-23','tools':['Outil de recette']}}}})
        self.assertEqual(len(rows),1);self.assertEqual(rows[0]['axe'],'supervision');self.assertEqual(len(rows[0]['origines']),2);self.assertEqual(rows[0]['probleme'],'Missing2026-10-23')
    def test_unobserved_contract_is_not_marked_resolved(self):
        rows=self.run_case([old('usage requis initial','/outil|part|champ')])
        self.assertIn('absent',rows[0]['statut_donnees']);self.assertIn('ne vaut pas résolution',rows[0]['niveau_preuve'])
    def test_module_verification_and_old_remainder_share_one_record(self):
        rows=self.run_case([old('reliquat historique initial','0:scripts/helper.py','scripts/helper.py'),old('module qualifié','scripts/helper.py','scripts/helper.py')],modules=[{'module':'scripts/helper.py','statut':'scénario local uniquement','reliquat_initial_81':'True','reliquat':'transport non vérifié'}])
        self.assertEqual(len(rows),1);self.assertTrue(rows[0]['verification_en_attente']);self.assertEqual(len(rows[0]['origines']),2)
    def test_documented_resolved_signal_is_not_reintroduced_as_an_unverified_financial_case(self):
        row=old('incident historique résolu','0:collection:daily:world');row['apres']='resolved'
        result=self.run_case([row])[0]
        self.assertFalse(result['verification_en_attente']);self.assertFalse(result['reliquat_actif'])
        self.assertIn('pas nouvelle certification financière',result['niveau_preuve'])
    def test_legacy_daily_gap_joins_the_current_source_incident(self):
        daily=old('incident actif initial','collection:fixture-daily.yml:quote')
        rows=self.run_case([daily],monitor={'monitoring':{'active':{'collection:fixture-daily.yml:quote':{'cause':'Missing close'}}}})
        self.assertEqual(len(rows),1);self.assertEqual(len(rows[0]['origines']),1);self.assertTrue(rows[0]['reliquat_actif'])
    def test_retired_attribution_is_not_a_recovery_even_on_a_later_cycle(self):
        key='collection:update-instrument-metadata.yml:'+ISIN+':aum'
        state={'monitoring':{'active':{},'retired':[]},'workflows':{'update-instrument-metadata.yml':{'retiredDataFailures':{ISIN+':aum':{'retirementReason':'Autre collecteur','completedAt':'2026-10-23'}}}}}
        result=self.run_case([old('incident actif initial',key)],monitor=state)[0]
        self.assertIn('retrait documenté',result['statut_supervision'])
        self.assertNotIn('résolution documentée',result['statut_supervision'])
        self.assertFalse(result['verification_en_attente'])
        self.assertEqual(result['details']['cycle_actuel']['completedAt'],'2026-10-23')

    def test_episode_found_after_the_initial_audit_does_not_disappear(self):
        key='collection:daily:new-episode'
        previous=self.run_case([],monitor={'monitoring':{'active':{key:{'cause':'Missing close'}}}})
        later=self.run_case([],previous=previous)
        self.assertEqual([r['id_suivi']for r in later],['incident:'+key])
        self.assertTrue(later[0]['verification_en_attente'])
        self.assertIn('clôture financière non déduite',later[0]['statut_supervision'])
        self.assertFalse(previous[0].get('verification_en_attente',False))

    def test_previous_capture_does_not_duplicate_immutable_origins(self):
        source=[old('incident actif initial','collection:daily:world')]
        previous=self.run_case(source)
        later=self.run_case(source,previous=previous)
        self.assertEqual(sum(len(r['origines'])for r in later),1)

    def test_evidence_view_joins_the_single_followup_and_keeps_origins(self):
        rows=self.run_case([],inventory={'connections':[],'consumerUsage':{'tools':[{'path':'/tool','rows':[{'id':'A','key':'history','state':'connected','required':True}]}]}})
        proof={'id_suivi':'usage:/tool|A|history','etat':'B','chaine':'one','blocage':'Publication non démontrée'}
        apply_use_contracts(rows,[proof]);self.assertTrue(rows[0]['reliquat_actif']);self.assertEqual(rows[0]['statut_donnees'],'B');self.assertEqual(rows[0]['origines'],[])
        with self.assertRaises(AssertionError):apply_use_contracts(rows,[proof,proof])
        with self.assertRaises(AssertionError):apply_use_contracts(rows,[{**proof,'id_suivi':'unknown'}])

    def test_global_validation_does_not_close_unverified_new_correction(self):
        rows=self.run_case([],validated=True,repairs=[{'id':'correction:source','axe':'collecte','type':'producteur','probleme':'Échec','preuves':['local.log'],'productionValidated':False}])
        self.assertTrue(rows[0]['reliquat_actif']);self.assertIn('GitHub et publication requis',rows[0]['niveau_preuve'])

    def test_retired_action_view_is_not_counted_as_repaired(self):
        import csv,pathlib,tempfile
        rows=self.run_case([],actions=[{'action':'P2-04','statut':'partiellement corrigée','limitation':'Ancienne limite IA'}])
        self.assertEqual(rows[0]['statut_donnees'],'périmètre supprimé')
        with tempfile.TemporaryDirectory()as tmp:
            write_views(rows,pathlib.Path(tmp))
            with(pathlib.Path(tmp)/'statut-19-actions.csv').open(encoding='utf-8-sig')as f:written=list(csv.DictReader(f,delimiter=';'))
            self.assertEqual(written[0]['statut'],'périmètre supprimé');self.assertIn('aucune donnée financière déclarée réparée',written[0]['limitation'])

    def test_published_receipt_survives_csv_replay_above_default_field_limit(self):
        import csv,json,pathlib,tempfile
        from build_consolidated_data_followup import read_csv
        receipt={'files':{'src/data/proof-'+str(i)+'.json':'a'*40 for i in range(2500)}}
        value=json.dumps(receipt);self.assertGreater(len(value),131072)
        before=csv.field_size_limit()
        with tempfile.TemporaryDirectory()as tmp:
            path=pathlib.Path(tmp)/'suivi.csv'
            with path.open('w',encoding='utf-8-sig',newline='')as f:
                w=csv.DictWriter(f,['id_suivi','details'],delimiter=';');w.writeheader();w.writerow({'id_suivi':'incident:recording:fixture','details':value})
            rows=read_csv(path)
        self.assertEqual(json.loads(rows[0]['details']),receipt);self.assertEqual(csv.field_size_limit(),before)

if __name__=='__main__':unittest.main()
