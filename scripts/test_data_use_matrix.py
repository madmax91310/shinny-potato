"""Proof joins must fail closed; catalogue declarations alone never qualify a source."""
import copy,datetime as dt,hashlib,json,pathlib,tempfile,unittest
from build_data_use_matrix import matrix,day
class DataUseMatrix(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=pathlib.Path(self.tmp.name)
  p=self.root/'src/data';p.mkdir(parents=True)
  (p/'freshness-policy.json').write_text(json.dumps({'fields':{'etf.default':{'checkDays':7,'dataDays':65}}}))
  self.path='src/data/source.json';body=json.dumps({'A':{'checkedAt':'2026-10-24','asOf':'2026-10-23','sourceUrl':'https://issuer.test/exact'}}).encode();(self.root/self.path).write_bytes(body)
  self.manifest={'files':{self.path:hashlib.sha1(b'blob '+str(len(body)).encode()+b'\0'+body).hexdigest()},'codeSha':'code','dataSha':'data'}
  self.field={'key':'aum','label':'Encours','kind':'live','state':'connected','sourceUrls':['https://issuer.test/exact'],'checkedAt':'2026-10-24','asOf':'2026-10-23','workflows':[{'path':'.github/workflows/collect.yml','crons':['0 1 * * *']}]}
  self.inventory={'registries':[{'path':self.path,'writers':['.github/workflows/collect.yml']}],'fields':[],'assets':[{'id':'A','name':'Exact part','type':'instrument','fields':[self.field]}],'consumerUsage':{'externalAssets':[],'summary':{'usages':1},'tools':[{'path':'/tool','name':'Tool','rows':[{'id':'A','key':'aum','required':True}]}]}}
  self.monitor={'workflows':{'collect.yml':{'lastCollectionSuccessAt':'2026-10-24','runUrl':'https://github.test/run'}}}
 def row(self):return matrix(self.inventory,self.monitor,self.manifest,dt.date(2026,10,24),self.root)[0]
 def test_matching_published_source_real_execution_and_dates(self):
  row=self.row();self.assertEqual(row['etat'],'A');self.assertEqual(row['publication_code'],'code');self.assertEqual(row['publication_donnees'],'data')
 def test_cache_or_catalogue_without_execution_is_not_source_success(self):
  self.monitor['workflows']={};self.assertEqual(self.row()['etat'],'B')
 def test_current_local_file_is_not_proof_of_publication(self):
  (self.root/self.path).write_text('{}');self.assertEqual(self.row()['etat'],'B')
 def test_future_and_expired_checks_are_not_qualified(self):
  for date in ['2026-11-01','2025-01-01']:
   self.field['checkedAt']=date;self.assertEqual(self.row()['etat'],'B')
 def test_hypothesis_not_required_is_not_failure(self):
  self.field['kind']='simulation';self.monitor={};self.assertEqual(self.row()['etat'],'non applicable')
 def test_period_parsing_uses_real_period_ends(self):
  self.assertEqual(day('2026-Q3'),dt.date(2026,9,30));self.assertEqual(day('2024-02'),dt.date(2024,2,29));self.assertIsNone(day(None))
if __name__=='__main__':unittest.main()
