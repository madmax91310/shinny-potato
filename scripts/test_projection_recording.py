"""Isolated real Git races: recompute owned derivatives, never bless stale outputs."""
import json,pathlib,shlex,sys,unittest
import test_validated_data_commit as harness
class ProjectionRecording(unittest.TestCase):
 def setUp(self):
  self.f=harness.CommitValidatedData();self.f.setUp();self.addCleanup(self.f.doCleanups)
  (self.f.local/'validated.json').write_text('old source\n')
  self.f.advance_remote('other.txt')
 def publish(self,prepare,check='test "$(cat validated.json)" = regenerated',declared=None):
  return self.f.publish({'VALIDATED_DATA_PREPARE':prepare,'VALIDATED_DATA_DERIVED_PATHS':json.dumps(declared or ['validated.json']),'VALIDATED_DATA_CHECK':check})
 def test_recomputed_output_is_revalidated_and_receipt_matches_committed_bytes(self):
  r=self.publish("printf 'regenerated\\n' > validated.json");self.assertEqual(r.returncode,0,r.stdout+r.stderr);self.assertEqual(self.f.git(self.f.remote,'show','master:validated.json'),'regenerated');self.assertEqual((self.f.local/'validated.json').read_text(),'old source\n')
 def test_bad_regenerated_value_fails_validation_and_preserves_remote(self):
  r=self.publish("printf 'invalid\\n' > validated.json");self.assertNotEqual(r.returncode,0);self.assertEqual(self.f.git(self.f.remote,'show','master:validated.json'),'original')
 def test_unowned_projection_or_source_write_is_refused(self):
  for prepare,paths in [("printf changed > other.txt",['validated.json']),('true',['other.txt'])]:
   r=self.publish(prepare,check='true',declared=paths);self.assertNotEqual(r.returncode,0);self.assertEqual(self.f.git(self.f.remote,'show','master:validated.json'),'original')
 def test_prepare_failure_cannot_be_published(self):
  r=self.publish('exit 47');self.assertEqual(r.returncode,47);self.assertFalse((self.f.root/'output').exists())
 def worldbank_projection(self,unit):
  self.f.git(self.f.local,'pull','--ff-only')
  path=self.f.other/'src/data/worldbank-gold-monthly.json';path.parent.mkdir(parents=True,exist_ok=True)
  source={'unit':unit,'checkedAt':'2026-10-24','points':[['2026-09',4319.0]]};path.write_text(json.dumps(source))
  self.f.git(self.f.other,'add','.');self.f.git(self.f.other,'commit','-m','independent gold producer');self.f.git(self.f.other,'push','origin','master')
  guard=pathlib.Path(__file__).with_name('observation_rebase_guard.py')
  code="import json,pathlib;g=json.loads(pathlib.Path('src/data/worldbank-gold-monthly.json').read_text());assert g['unit']=='USD per troy ounce';pathlib.Path('validated.json').write_text(json.dumps({'period':g['points'][-1][0],'value':g['points'][-1][1],'sourceCheckedAt':g['checkedAt']}))"
  prepare=f'{shlex.quote(sys.executable)} {shlex.quote(str(guard))} --kind market --base "$VALIDATED_DATA_ORIGINAL_BASE" && '+shlex.quote(sys.executable)+' -c '+shlex.quote(code)
  check=shlex.quote(sys.executable)+' -c '+shlex.quote("import json;g=json.load(open('validated.json'));assert g=={'period':'2026-09','value':4319.0,'sourceCheckedAt':'2026-10-24'}")
  return self.publish(prepare,check),source
 def test_changed_gold_projection_is_rebuilt_qualified_and_recorded_with_true_source_date(self):
  result,source=self.worldbank_projection('USD per troy ounce');self.assertEqual(result.returncode,0,result.stdout+result.stderr)
  self.assertEqual(json.loads(self.f.git(self.f.remote,'show','master:validated.json')),{'period':'2026-09','value':4319.0,'sourceCheckedAt':'2026-10-24'})
  self.assertEqual(json.loads(self.f.git(self.f.remote,'show','master:src/data/worldbank-gold-monthly.json')),source)
 def test_projection_of_gold_with_changed_unit_is_never_recorded(self):
  result,source=self.worldbank_projection('EUR per ounce');self.assertNotEqual(result.returncode,0)
  self.assertEqual(self.f.git(self.f.remote,'show','master:validated.json'),'original')
if __name__=='__main__':unittest.main()
