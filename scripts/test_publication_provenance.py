"""Source controls and local gold derivation have different clocks and outcomes."""
import datetime as dt,json,pathlib,tempfile,unittest
from unittest.mock import patch
from refresh_anniversary_levels import refresh
NOW=dt.datetime(2026,10,24,12,tzinfo=dt.timezone.utc)
class AnniversaryProvenance(unittest.TestCase):
 def test_real_unchanged_control_is_persisted_and_failure_freezes_it(self):
  old={'value':100,'asOf':'2026-10-23','currency':'EUR','parser':'yahoo','symbol':'EXAMPLE.PA','checkedAt':'2026-10-01T12:00:00+00:00','sha256':'a'*64}
  current={'example':old};selected=[{'id':'example'}]
  updated,report=refresh(current,NOW,lambda *_:dict(old),selected)
  self.assertEqual(updated['example'],{**old,'checkedAt':NOW.isoformat()});self.assertEqual(report['outcomes'][0]['status'],'unchanged-verified');self.assertEqual(current['example'],old)
  def fail(*_):raise TimeoutError('offline')
  retained,failed=refresh(updated,NOW+dt.timedelta(days=1),fail,selected)
  self.assertEqual(retained,updated);self.assertEqual(failed['successes'],[]);self.assertEqual(failed['outcomes'][0]['lastSuccessAt'],NOW.isoformat());self.assertEqual(failed['outcomes'][0]['status'],'failed')
 def fixture(self,checked='2026-10-10',sha='a'*64):
  temporary=tempfile.TemporaryDirectory();self.addCleanup(temporary.cleanup);root=pathlib.Path(temporary.name);data=root/'src/data';data.mkdir(parents=True)
  gold={'unit':'USD per troy ounce','column':'Gold','url':'https://thedocs.worldbank.org/exact.xlsx','workbookSha256':sha,'checkedAt':checked,'points':[['2026-09',4319.0]]}
  (data/'worldbank-gold-monthly.json').write_text(json.dumps(gold));(data/'freshness-policy.json').write_text(json.dumps({'fields':{'series.monthly':{'checkDays':40}}}))
  return root
 def test_cached_gold_is_a_dated_derivation_never_a_source_success(self):
  with patch('refresh_anniversary_levels.ROOT',self.fixture()),patch('refresh_anniversary_levels.configurations',return_value=[]):
   updated,report=refresh({},NOW)
  self.assertEqual(updated['or']['checkedAt'],'2026-10-10');self.assertEqual(updated['or']['derivedAt'],NOW.isoformat());self.assertEqual(updated['or']['asOf'],'2026-09');self.assertEqual(report['successes'],[])
  self.assertFalse(report['derived'][0]['sourceAttempted']);self.assertEqual(report['outcomes'][0]['status'],'not-attempted');self.assertEqual(report['scope']['requestedIds'],[]);self.assertEqual(report['scope']['derivedIds'],['anniversary-or'])
 def test_unqualified_cached_proof_preserves_the_previous_level_and_dates(self):
  prior={'or':{'value':4319,'asOf':'2026-09','checkedAt':'2026-10-03'}}
  for root in [self.fixture('2026-07-01'),self.fixture('2026-11-01'),self.fixture(sha='invalid')]:
   with self.subTest(root=root),patch('refresh_anniversary_levels.ROOT',root),patch('refresh_anniversary_levels.configurations',return_value=[]):
    retained,report=refresh(prior,NOW)
   self.assertEqual(retained,prior);self.assertEqual(report['successes'],[]);self.assertEqual(report['derived'],[]);self.assertEqual(report['errors'][0]['lastSuccessAt'],'2026-10-03')
if __name__=='__main__':unittest.main()
