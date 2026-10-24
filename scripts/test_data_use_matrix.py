"""Proof joins must fail closed; catalogue declarations alone never qualify a source."""
import copy,datetime as dt,hashlib,json,pathlib,tempfile,unittest
from build_data_use_matrix import matrix,day
class DataUseMatrix(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=pathlib.Path(self.tmp.name)
  p=self.root/'src/data';p.mkdir(parents=True)
  (p/'freshness-policy.json').write_text(json.dumps({'fields':{'etf.default':{'checkDays':7,'dataDays':65}}}))
  self.path='src/data/source.json';body=json.dumps({'A':{'checkedAt':'2026-10-24','asOf':'2026-10-23','sourceUrl':'https://issuer.test/exact','aum':{'amount':10,'currency':'USD'}}}).encode();(self.root/self.path).write_bytes(body)
  self.manifest={'files':{self.path:hashlib.sha1(b'blob '+str(len(body)).encode()+b'\0'+body).hexdigest()},'codeSha':'code','dataSha':'data'}
  self.field={'key':'aum','label':'Encours','currency':'USD','kind':'live','state':'connected','sourceUrls':['https://issuer.test/exact'],'checkedAt':'2026-10-24','asOf':'2026-10-23','workflows':[{'path':'.github/workflows/collect.yml','crons':['0 1 * * *']}]}
  self.inventory={'registries':[{'path':self.path,'writers':['.github/workflows/collect.yml']}],'fields':[],'assets':[{'id':'A','name':'Exact part','type':'instrument','fields':[self.field]}],'consumerUsage':{'externalAssets':[],'summary':{'usages':1},'tools':[{'path':'/tool','name':'Tool','rows':[{'id':'A','key':'aum','required':True}]}]}}
  self.monitor={'workflows':{'collect.yml':{'collectionStatus':'success','validationStatus':'success','recordingStatus':'success','publicationStatus':'success','publicationReceipt':{'files':self.manifest['files']},'sourceChecks':{'A|aum':{'checkedAt':'2026-10-24','evidence':{'file':'source-observations.json'}}},'lastCollectionSuccessAt':'2026-10-24','runUrl':'https://github.test/run'}}}
 def row(self):return matrix(self.inventory,self.monitor,self.manifest,dt.date(2026,10,24),self.root,producer_contracts={'collect.yml':[self.path]})[0]
 def test_matching_published_source_real_execution_and_dates(self):
  row=self.row();self.assertEqual(row['etat'],'A');self.assertEqual(row['publication_code'],'code');self.assertEqual(row['publication_donnees'],'data')
 def test_cache_or_catalogue_without_execution_is_not_source_success(self):
  self.monitor['workflows']={};self.assertEqual(self.row()['etat'],'B')
 def test_failed_latest_run_and_prior_global_success_are_not_specific_proof(self):
  self.monitor['workflows']['collect.yml']['recordingStatus']='failure';self.assertEqual(self.row()['etat'],'B')
  self.monitor['workflows']['collect.yml']['recordingStatus']='success';self.monitor['workflows']['collect.yml']['lastCollectionSuccessAt']='2026-10-25';self.assertEqual(self.row()['etat'],'B')
 def test_targeted_receipt_cannot_certify_an_unattempted_registry(self):
  self.monitor['workflows']['collect.yml']['publicationReceipt']={'files':{'other.json':'a'*40}};self.assertEqual(self.row()['etat'],'B')
 def test_later_matching_publication_does_not_rewrite_the_failed_attempt(self):
  self.monitor['workflows']['collect.yml']['publicationStatus']='failure'
  row=self.row();self.assertEqual(row['etat'],'A');self.assertIn('adoptées',row['publication_mecanisme']);self.assertEqual(self.monitor['workflows']['collect.yml']['publicationStatus'],'failure')
 def test_current_local_file_is_not_proof_of_publication(self):
  (self.root/self.path).write_text('{}');self.assertEqual(self.row()['etat'],'B')
 def test_future_and_expired_checks_are_not_qualified(self):
  for date in ['2026-11-01','2025-01-01']:
   self.field['checkedAt']=date;self.assertEqual(self.row()['etat'],'B')
 def test_hypothesis_not_required_is_not_failure(self):
  self.field['kind']='simulation';self.monitor={};self.assertEqual(self.row()['etat'],'non applicable')
 def test_period_parsing_uses_real_period_ends(self):
  self.assertEqual(day('2026-Q3'),dt.date(2026,9,30));self.assertEqual(day('2024-02'),dt.date(2024,2,29));self.assertIsNone(day(None))
 def test_producer_attempt_is_not_fabricated_as_a_field_attempt(self):
  self.monitor['workflows']['collect.yml']['createdAt']='2026-10-24T16:00:00Z'
  row=self.row();self.assertIn('non démontrée',row['derniere_tentative_champ']);self.assertIn('producteur entier',row['tentatives_producteur_observees'])
  self.field['attemptedAt']='2026-10-24T15:55:00Z';self.assertEqual(self.row()['derniere_tentative_champ'],'2026-10-24T15:55:00Z')

 def test_broad_publication_receipt_never_proves_another_producers_source(self):
  row=matrix(self.inventory,self.monitor,self.manifest,dt.date(2026,10,24),self.root,producer_contracts={'collect.yml':['src/data/gold-only.json']})[0]
  self.assertEqual(row['etat'],'B');self.assertIn('non démontré',row['blocage'])
 def test_declared_field_without_actual_financial_value_is_not_qualified(self):
  record={'A':{'checkedAt':'2026-10-24','asOf':'2026-10-23','sourceUrl':'https://issuer.test/exact'}}
  body=json.dumps(record).encode();(self.root/self.path).write_bytes(body);digest=hashlib.sha1(b'blob '+str(len(body)).encode()+b'\0'+body).hexdigest();self.manifest['files'][self.path]=digest
  row=self.row();self.assertEqual(row['etat'],'B');self.assertIn('Valeur du champ',row['blocage'])

 def test_labels_without_weights_do_not_prove_a_composition(self):
  from build_data_use_matrix import field_value_present
  self.assertFalse(field_value_present({'countries':[['France',None]]},'countries','live'))
  self.assertTrue(field_value_present({'countries':[['France',25.0],['Inconnu',None]]},'countries','live'))

 def test_owned_broad_receipt_and_listing_only_success_do_not_certify_prices(self):
  self.monitor['workflows']['collect.yml']['sourceChecks']={'A|listing':{'checkedAt':'2026-10-24'}}
  row=self.row();self.assertEqual(row['etat'],'B');self.assertIn('Contrôle source ciblé',row['blocage'])
 def test_local_qualification_is_not_a_financial_source_check(self):
  self.monitor['workflows']['collect.yml']['sourceChecks']['A|aum']['evidence']['file']='index-company-qualification-observations.json'
  self.assertEqual(self.row()['etat'],'B')

 def test_malformed_legacy_check_does_not_drop_the_inventory(self):
  for proof in [None,[],{'A|aum':None},{'A|aum':'2026-10-24'}]:
   self.monitor['workflows']['collect.yml']['sourceChecks']=proof
   row=self.row();self.assertEqual(row['etat'],'B');self.assertEqual(row['statut_consommateur_declare'],'connected')

if __name__=='__main__':unittest.main()
