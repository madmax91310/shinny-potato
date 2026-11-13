"""Publication boundaries from the actual 36-instrument source transaction."""
import copy
import datetime as dt
import gzip
import importlib.util
import json
import os
from pathlib import Path
import shlex
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import validate_exposure_publication as publication
from producer_report_contract import finish

ROOT=Path(__file__).resolve().parents[1]
FIXTURE=ROOT/'scripts/fixtures/exposure-publication-20261109'
BASE='1686fd10645dadca251e6787a64cc14e08519b70'
NOW=dt.datetime(2026,11,9,18,tzinfo=dt.timezone.utc)
def read(name):return json.loads(gzip.decompress((FIXTURE/(name+'.gz')).read_bytes()))
def write(path,data):
 path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(data,allow_nan=True))

def transaction(base=BASE,only=None):
 report=read('exposure-expansion.json');plan=copy.deepcopy(report['resultContract']['inputPlan'])
 # The fixture's original source receipts stay immutable. A synthetic Git unit
 # gets its own declared transaction identity before its results are assembled.
 if base!=BASE or only is not None:
  plan.pop('sha256');plan['codeSha']=base
  if only is not None:
   for item in plan['items']:
    item['selected']=item['instrument']in only
    if not item['selected']:item['reason']='Outside the explicitly requested test selection'
   plan['mode']='targeted'
  import hashlib
  plan['sha256']=hashlib.sha256(json.dumps(plan,sort_keys=True).encode()).hexdigest()
  report=finish({'checkedAt':report['checkedAt'],'shares':[r for r in report['shares']if only is None or r['isin']in only]},plan)
 return report,finish({},plan,completed=False)

class ExposurePublication(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)
  self.baseline=read('baseline.json');self.report,self.started=transaction()
  self.config=read('config.json');write(self.root/'scripts/exposure-etf-expansion.json',self.config)
  self.current=copy.deepcopy(self.baseline)
  for row in self.report['shares']:
   if row['status']=='validated':self.current[row['isin']]=copy.deepcopy(row['record'])
  self.flush()
 def flush(self):write(self.root/publication.REGISTRY,self.current)
 def audit(self,only=None,**kwargs):
  self.flush()
  with patch.object(publication,'git_bytes',return_value=json.dumps(self.baseline).encode()):
   return publication.audit(self.root,self.report,self.started,BASE,only=only,run_id=kwargs.get('run_id','42668435788'),attempt=kwargs.get('attempt','1'),now=kwargs.get('now',NOW))
 def test_original_real_scope_has_all_36_results_and_preserves_financial_bytes(self):
  before=copy.deepcopy(self.current);self.assertEqual(self.audit(),36);self.assertEqual(self.current,before)
 def test_failed_source_preserves_last_valid_value_and_clocks(self):
  row=self.report['shares'][0];isin=row['isin'];row.clear();row.update(isin=isin,status='failed',reason='Isolated network failure')
  outcome=next(r for r in self.report['resultContract']['outcomes']if r['instrument']==isin);outcome.update(status='failed',error='Isolated network failure')
  self.current[isin]=copy.deepcopy(self.baseline[isin]);self.assertEqual(self.audit(),36)
  self.current[isin]['sourceUrl']='https://example.org/not-a-success'
  with self.assertRaisesRegex(ValueError,'Failed source changed'):self.audit()
 def test_omitted_duplicated_or_unexpected_native_result_cannot_publish(self):
  original=copy.deepcopy(self.report['shares'])
  for rows in [original[:-1],original+[original[0]],original+[{'isin':'UNKNOWN','status':'failed'}]]:
   self.report['shares']=rows
   with self.assertRaisesRegex(ValueError,'Missing, duplicate or unselected'):self.audit()
 def test_source_success_cannot_be_replaced_by_cache_or_missing_result(self):
  for value in ['cached',None]:
   self.report['shares'][0]['status']=value
   with self.assertRaisesRegex(ValueError,'cache cannot certify'):self.audit()
 def test_contract_omission_or_cache_does_not_certify_a_native_success(self):
  outcome=self.report['resultContract']['outcomes'][0]
  outcome.update(status='cached',reason='Retained cache',sourceAttempted=False)
  with self.assertRaisesRegex(ValueError,'cache cannot certify'):self.audit()
 def test_wrong_run_attempt_revision_or_pre_acquisition_plan_is_rejected(self):
  with self.assertRaisesRegex(ValueError,'another GitHub run'):self.audit(run_id='1')
  with self.assertRaisesRegex(ValueError,'another GitHub run'):self.audit(attempt='2')
  self.started['resultContract']['inputPlan']['nonce']='another-transaction'
  with self.assertRaises(ValueError):self.audit()
 def test_an_old_revision_cannot_be_replayed_in_the_current_transaction(self):
  self.report,self.started=transaction(base='f'*40)
  with self.assertRaisesRegex(ValueError,'another acquisition revision'):self.audit()
 def test_targeted_attempt_leaves_other_instruments_unmodified(self):
  wanted=[self.report['shares'][0]['isin']];self.report,self.started=transaction(only=wanted)
  self.current=copy.deepcopy(self.baseline);self.current[wanted[0]]=copy.deepcopy(self.report['shares'][0]['record'])
  self.assertEqual(self.audit(only=wanted),1)
  other=next(i for i in self.baseline if i not in wanted);self.current[other]['sourceUrl']='https://example.org/unselected'
  with self.assertRaisesRegex(ValueError,'unselected instrument'):self.audit(only=wanted)
 def test_empty_or_different_selection_cannot_certify_the_catalogue(self):
  for selection in [[],['UNKNOWN'],[self.report['shares'][0]['isin']]]:
   with self.assertRaises(ValueError):self.audit(only=selection)
 def test_wrong_identity_and_divergent_observation_are_rejected(self):
  row=self.report['shares'][0];isin=row['isin'];self.current[isin]['currency']='JPY'
  with self.assertRaisesRegex(ValueError,'differs from validated'):self.audit()
  row['record']['currency']='JPY'
  with self.assertRaisesRegex(ValueError,'identity changed'):self.audit()
 def test_invalid_weights_future_dates_and_regressing_controls_are_rejected(self):
  original=copy.deepcopy(self.report);current=copy.deepcopy(self.current)
  for mutation in [lambda v:v['countries']['rows'][0].update(weightPct=-1),lambda v:v['countries'].update(asOf='2027-01-01'),lambda v:v['countries'].update(checkedAt='2000-01-01')]:
   self.report=copy.deepcopy(original);self.current=copy.deepcopy(current);row=self.report['shares'][0];mutation(row['record']);self.current[row['isin']]=copy.deepcopy(row['record'])
   with self.assertRaises(ValueError):self.audit()
 def test_nonfinite_json_is_never_an_observation(self):
  with self.assertRaisesRegex(ValueError,'Non-finite'):publication.load('{"weight":NaN}')
 def test_retained_country_is_not_redated_or_certified_from_the_new_pdf(self):
  share=next(s for s in self.config['instruments']if s.get('parser')=='wisdomtree-html');isin=share['isin'];row=next(r for r in self.report['shares']if r['isin']==isin)
  row['record']['countries']=copy.deepcopy(self.baseline[isin]['countries']);self.current[isin]=copy.deepcopy(row['record'])
  row['retainedFields']=[{'field':'countries','asOf':row['record']['countries']['asOf']}];row['unavailable']=['countries: PDF publishes only ten countries; retained independently sourced full allocation']
  self.assertEqual(self.audit(),36)
  self.current[isin]['countries']['checkedAt']='2026-11-09';row['record']=copy.deepcopy(self.current[isin])
  with self.assertRaisesRegex(ValueError,'Retained field changed'):self.audit()

class ExposureFallbackPublication(unittest.TestCase):
 """Current real cron: preserve two primary failures and their qualified fallbacks."""
 flush=ExposurePublication.flush
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)
  fixture=ROOT/'scripts/fixtures/exposure-fallback-publication-20261110'
  read_new=lambda n:json.loads(gzip.decompress((fixture/(n+'.gz')).read_bytes()))
  self.baseline=read_new('baseline.json');self.report=read_new('exposure-expansion.json')
  self.config=read_new('config.json');write(self.root/'scripts/exposure-etf-expansion.json',self.config)
  self.started=finish({},copy.deepcopy(self.report['resultContract']['inputPlan']),completed=False)
  self.current=copy.deepcopy(self.baseline)
  for row in self.report['shares']:
   if row['status']=='validated':self.current[row['isin']]=copy.deepcopy(row['record'])
  self.flush()
 def audit(self,only=None,**kwargs):
  self.flush();plan=self.report['resultContract']['inputPlan']
  with patch.object(publication,'git_bytes',return_value=json.dumps(self.baseline).encode()):
   return publication.audit(self.root,self.report,self.started,plan['codeSha'],only=only,
    run_id=kwargs.get('run_id','42848056797'),attempt=kwargs.get('attempt','1'),
    now=kwargs.get('now',dt.datetime(2026,11,10,16,tzinfo=dt.timezone.utc)))
 def test_real_qualified_fallback_does_not_rewrite_primary_failures(self):
  contract=copy.deepcopy(self.report['resultContract']);self.assertEqual(self.audit(),36)
  self.assertEqual(self.report['resultContract'],contract)
  self.assertEqual({o['instrument']for o in contract['outcomes']if o['status']=='failed'},
                   {'IE00BDVPNG13','IE00BKLF1R75'})
 def test_the_original_guard_refusal_is_reproduced(self):
  with patch.object(publication,'qualified_transport_fallback',return_value=False):
   with self.assertRaisesRegex(ValueError,'cache cannot certify.*IE00BDVPNG13'):self.audit()
 def test_fallback_without_fresh_network_field_proof_is_refused(self):
  original=copy.deepcopy(self.report)
  mutations=[
   lambda r:r.update(sourceAttempts=[]),
   lambda r:r['record']['sectors'].update(checkedAt='2026-11-09'),
   lambda r:r['record']['sectors'].update(sha256=None),
   lambda r:r['collectionErrors'][0].update(qualifiedFallbackAvailable=False),
   lambda r:r['collectionErrors'][0].update(phase='validation'),
   lambda r:r['collectionErrors'][0].update(field='financial-contradiction'),
   lambda r:r.update(sourceAttempts=[a for a in r['sourceAttempts']if a.get('status')!='downloaded']),
  ]
  for mutate in mutations:
   with self.subTest(mutation=mutate):
    self.report=copy.deepcopy(original);row=next(r for r in self.report['shares']if r['isin']=='IE00BDVPNG13')
    mutate(row);self.current[row['isin']]=copy.deepcopy(row['record'])
    with self.assertRaises(ValueError):self.audit()
 def test_partial_transport_evidence_cannot_certify_cache(self):
  row=next(r for r in self.report['shares']if r['isin']=='IE00BDVPNG13')
  outcome=next(o for o in self.report['resultContract']['outcomes']if o['instrument']==row['isin'])
  outcome['sourceAttempted']=False
  with self.assertRaisesRegex(ValueError,'cache cannot certify'):self.audit()


class ExposurePublicationGit(unittest.TestCase):
 def git(self,root,*args):return subprocess.check_output(['git','-C',str(root),*args],stderr=subprocess.DEVNULL).decode().strip()
 def setup_repository(self):
  temp=tempfile.TemporaryDirectory();self.addCleanup(temp.cleanup);root=Path(temp.name)/'checkout';root.mkdir();remote=Path(temp.name)/'remote.git'
  self.git(root,'init','-b','master');self.git(root,'config','user.name','Isolated test');self.git(root,'config','user.email','test@example.invalid')
  subprocess.run(['git','init','--bare','--initial-branch=master',str(remote)],check=True,capture_output=True)
  for path in [publication.CUSTOM_COLLECTOR,'scripts/commit-validated-data.sh','scripts/stage_validated_projections.py','scripts/data_publication.py']:
   target=root/path;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes((ROOT/path).read_bytes())
  write(root/'scripts/exposure-etf-expansion.json',read('config.json'));write(root/publication.REGISTRY,read('baseline.json'))
  write(root/'src/pages/dca-profiles/catalog.json',{'prepared':False})
  for path in publication.INDEPENDENT:write(root/path,{'value':'before'})
  self.git(root,'add','.');self.git(root,'commit','-m','Isolated base');self.git(root,'remote','add','origin',str(remote));self.git(root,'push','-u','origin','master');base=self.git(root,'rev-parse','HEAD')
  writer=Path(temp.name)/'writer';subprocess.run(['git','clone',str(remote),str(writer)],check=True,capture_output=True)
  self.git(writer,'config','user.name','Independent test');self.git(writer,'config','user.email','writer@example.invalid');return root,writer,base
 def test_two_independent_writers_survive_validated_recording(self):
  root,writer,base=self.setup_repository();report,started=transaction(base)
  current=read('baseline.json')
  for row in report['shares']:current[row['isin']]=row['record']
  write(root/publication.REGISTRY,current);write(root/'report.json',report);write(root/'plan.json',started)
  for path in publication.INDEPENDENT:write(writer/path,{'value':'new-independent-publication'})
  self.git(writer,'add','.');self.git(writer,'commit','-m','Two independent observations');self.git(writer,'push','origin','master')
  code="import sys,os,json;from pathlib import Path;sys.path.insert(0,"+repr(str(ROOT/'scripts'))+");import validate_exposure_publication as p;r=Path.cwd();base=os.environ['VALIDATED_DATA_ORIGINAL_BASE'];p.inputs(r,base,'HEAD^');p.audit(r,json.loads(Path("+repr(str(root/'report.json'))+").read_text()),json.loads(Path("+repr(str(root/'plan.json'))+").read_text()),base,run_id='42668435788',attempt='1',now=__import__('datetime').datetime(2026,11,9,18,tzinfo=__import__('datetime').timezone.utc))"
  projection="import json;from pathlib import Path;r=json.loads(Path("+repr(publication.REGISTRY)+").read_text());Path('src/pages/dca-profiles/catalog.json').write_text(json.dumps({k:(v.get('countries')or{}).get('asOf')for k,v in r.items()}))"
  code+=";records=json.loads((r/p.REGISTRY).read_text());assert json.loads((r/'src/pages/dca-profiles/catalog.json').read_text())=={k:(v.get('countries')or{}).get('asOf')for k,v in records.items()}"
  env={**os.environ,'VALIDATED_DATA_CHECK':'python -c '+shlex.quote(code),'VALIDATED_DATA_PREPARE':'python -c '+shlex.quote(projection),'VALIDATED_DATA_DERIVED_PATHS':json.dumps(['src/pages/dca-profiles/catalog.json']),'GITHUB_OUTPUT':str(root/'output')}
  result=subprocess.run(['bash','scripts/commit-validated-data.sh','Validated exposure transaction',publication.REGISTRY,'src/pages/dca-profiles/catalog.json'],cwd=root,env=env,capture_output=True,text=True)
  self.assertEqual(result.returncode,0,result.stdout+result.stderr);self.git(writer,'pull','--ff-only')
  self.assertEqual(json.loads((writer/publication.REGISTRY).read_text()),current)
  self.assertEqual(json.loads((writer/'src/pages/dca-profiles/catalog.json').read_text()),{k:(v.get('countries')or{}).get('asOf')for k,v in current.items()})
  for path in publication.INDEPENDENT:self.assertEqual(json.loads((writer/path).read_text())['value'],'new-independent-publication')
 def test_workflow_declares_concrete_owned_projections_instead_of_literal_globs(self):
  root,writer,base=self.setup_repository()
  for path in ['src/pages/dca-profiles/exposures.json','src/pages/dca-profiles/exposures-extra-0.json','src/pages/dca-profiles/holdings.json','src/pages/dca-profiles/holdings-0.json','src/pages/dca-profiles/holdings-manifest.json']:
   write(root/path,{'prepared':False})
  write(root/'src/data/unowned.json',{'protected':True});self.git(root,'add','.');self.git(root,'commit','-m','Tracked projection partition')
  text=(ROOT/'.github/workflows/update-exposure-expansion.yml').read_text()
  line=next(x.strip()for x in text.splitlines()if x.strip().startswith('export VALIDATED_DATA_DERIVED_PATHS='))
  out=subprocess.check_output(['bash','-e','-c',line+'; printf "%s" "$VALIDATED_DATA_DERIVED_PATHS"'],cwd=root,text=True)
  paths=json.loads(out)
  self.assertEqual(len(paths),6)
  self.assertTrue(all('*'not in p and '?'not in p for p in paths))
  self.assertNotIn('src/data/unowned.json',paths)
  # Exercise the actual private staging helper with that exact producer list.
  import stage_validated_projections as projection
  previous=Path.cwd();self.addCleanup(os.chdir,previous);os.chdir(root)
  write(root/'src/pages/dca-profiles/exposures-extra-0.json',{'prepared':True})
  self.assertTrue(projection.stage(paths,paths));self.assertFalse(projection.stage(paths,paths))
  write(root/'src/data/unowned.json',{'protected':False})
  with self.assertRaisesRegex(ValueError,'non-projection'):
   projection.stage(paths,paths)
  self.assertNotEqual(self.git(root,'diff','--','src/data/unowned.json'),'')

 def test_unknown_input_or_custom_acquisition_change_requires_new_collection(self):
  for path in ['scripts/exposure-etf-expansion.json',publication.REGISTRY,publication.CUSTOM_COLLECTOR,'src/data/monthly-fx.json']:
   with self.subTest(path=path):
    root,writer,base=self.setup_repository();target=writer/path;target.parent.mkdir(parents=True,exist_ok=True);target.write_text('{}\n');self.git(writer,'add','.');self.git(writer,'commit','-m','Changed acquisition input');upstream=self.git(writer,'rev-parse','HEAD');self.git(writer,'push','origin','master');self.git(root,'fetch','origin','master')
    with self.assertRaises(ValueError):publication.inputs(root,base,upstream)
 def test_changed_custom_adapter_cannot_inherit_an_old_independence_proof(self):
  root,writer,base=self.setup_repository()
  with (root/publication.CUSTOM_COLLECTOR).open('a')as h:h.write('\n# New acquisition dependency requires explicit review.\n')
  self.git(root,'add',publication.CUSTOM_COLLECTOR);self.git(root,'commit','-m','New custom adapter before acquisition');self.git(root,'push','origin','master');base=self.git(root,'rev-parse','HEAD');self.git(writer,'pull','--ff-only')
  for path in publication.INDEPENDENT:write(writer/path,{'value':'new-independent'})
  self.git(writer,'add','.');self.git(writer,'commit','-m','Independent output after new acquisition');self.git(writer,'push','origin','master');upstream=self.git(writer,'rev-parse','HEAD');self.git(root,'fetch','origin','master')
  with self.assertRaisesRegex(ValueError,'Custom exposure acquisition changed'):publication.inputs(root,base,upstream)
 def test_financial_check_failure_never_pushes_observations(self):
  root,writer,base=self.setup_repository();current=read('baseline.json');first=next(iter(current));current[first]['sourceUrl']='https://example.org/unvalidated';write(root/publication.REGISTRY,current)
  for path in publication.INDEPENDENT:write(writer/path,{'value':'new-valid-independent'})
  self.git(writer,'add','.');self.git(writer,'commit','-m','Independent writer');self.git(writer,'push','origin','master');remote_before=self.git(writer,'rev-parse','HEAD')
  env={**os.environ,'VALIDATED_DATA_CHECK':'echo "Financial merged-tree validation failed" >&2; exit 1'}
  result=subprocess.run(['bash','scripts/commit-validated-data.sh','Must not publish',publication.REGISTRY],cwd=root,env=env,capture_output=True,text=True)
  self.assertNotEqual(result.returncode,0);self.assertEqual(self.git(root,'ls-remote','origin','refs/heads/master').split()[0],remote_before)

if __name__=='__main__':unittest.main()
