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
if __name__=='__main__':unittest.main()
