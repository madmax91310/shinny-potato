"""A real unchanged observation renews its control, a cache/error cannot."""
import copy,datetime as dt,unittest,json,pathlib,tempfile,sys
from unittest.mock import patch
import refresh_monthly_history as monthly
from refresh_monthly_history import refresh
class MonthlyControlRenewal(unittest.TestCase):
 def test_unchanged_prices_renew_control_only_after_validated_response(self):
  source={'id':'exact','parser':'yahoo','currency':'USD','method':'adjusted','periodStart':'2025-12','symbol':'EXACT','field':'adjclose'}
  previous={**source,'points':[['2025-12',100],['2026-01',101]],'periodEnd':'2026-01','checkedAt':'2026-02-02','responseSha256':'a'*64}
  incoming={**previous,'checkedAt':'2026-02-06','responseSha256':'b'*64,'proofRows':[],'rawResponse':{}}
  baseline={'exact':{'currency':'USD','points':[{'date':'2025-12','price':100}]}}
  merged,r=refresh({'series':[source]},{'exact':previous},baseline,dt.datetime(2026,2,6,tzinfo=dt.timezone.utc),lambda *a:incoming)
  self.assertEqual(r['series'][0]['status'],'validated');self.assertEqual(r['series'][0]['sourceState'],'unchanged-verified')
  self.assertEqual(merged['exact'],{**previous,'checkedAt':'2026-02-06','responseSha256':'b'*64});self.assertEqual(previous['checkedAt'],'2026-02-02')
  def down(*a):raise OSError('Network unavailable')
  failed,r=refresh({'series':[source]},merged,baseline,dt.datetime(2026,2,7,tzinfo=dt.timezone.utc),down)
  self.assertEqual(failed,merged);self.assertEqual(r['series'][0]['status'],'failed')
 def test_unchanged_months_keep_new_daily_nav_and_reject_regression(self):
  source={'id':'exact','parser':'official-nav','currency':'EUR','method':'NAV','periodStart':'2025-12','isin':'FR0011871110','field':'nav-total-return'}
  previous={**source,'points':[['2025-12',100],['2026-01',101]],'periodEnd':'2026-01','checkedAt':'2026-02-02','responseSha256':'a'*64,'latestLevel':{'value':102,'asOf':'2026-02-02'}}
  incoming={**previous,'checkedAt':'2026-02-06','responseSha256':'b'*64,'proofRows':[],'rawResponse':{},'latestLevel':{'value':103,'asOf':'2026-02-05'}}
  baseline={'exact':{'currency':'EUR','points':[{'date':'2025-12','price':100}]}}
  merged,report=refresh({'series':[source]},{'exact':previous},baseline,dt.datetime(2026,2,6,tzinfo=dt.timezone.utc),lambda *a:incoming)
  self.assertEqual(merged['exact']['points'],previous['points']);self.assertEqual(merged['exact']['latestLevel'],incoming['latestLevel'])
  self.assertEqual(report['series'][0]['sourceState'],'unchanged-verified')
  stale={**incoming,'latestLevel':previous['latestLevel']}
  kept,failed=refresh({'series':[source]},merged,baseline,dt.datetime(2026,2,7,tzinfo=dt.timezone.utc),lambda *a:stale)
  self.assertEqual(kept,merged);self.assertEqual(failed['series'][0]['status'],'failed')
  # A newly validated empty limit set supersedes a previous restriction.
  old_limit={**merged['exact'],'historyExcludedMonths':['2025-12']}
  cleared={**incoming,'historyExcludedMonths':[]}
  renewed,ok=refresh({'series':[source]},{'exact':old_limit},baseline,dt.datetime(2026,2,7,tzinfo=dt.timezone.utc),lambda *a:cleared)
  self.assertEqual(renewed['exact']['historyExcludedMonths'],[])
  self.assertEqual(ok['series'][0]['sourceState'],'unchanged-verified')
  changed=copy.deepcopy(stale);changed['points'][0][1]=99
  kept,failed=refresh({'series':[source]},merged,baseline,dt.datetime(2026,2,7,tzinfo=dt.timezone.utc),lambda *a:changed)
  self.assertEqual(kept,merged);self.assertEqual(failed['series'][0]['status'],'failed')

class SourceScopeIsolation(unittest.TestCase):
 def test_incomplete_scope_is_one_explicit_failure_and_cli_persists_other_source(self):
  now=dt.datetime(2026,2,6,tzinfo=dt.timezone.utc)
  sources=[{'id':id,'parser':'yahoo','currency':'USD','method':'adjusted','periodStart':'2025-12','symbol':id,'field':'adjclose'}for id in ['good','incomplete']]
  previous={s['id']:{**s,'points':[['2025-12',100],['2026-01',101]],'periodEnd':'2026-01','checkedAt':'2026-02-02','responseSha256':'a'*64}for s in sources}
  incoming={id:{**r,'checkedAt':'2026-02-06','responseSha256':'b'*64,'proofRows':[],'calendarProof':{'controlledInstrument':id,'controlledFields':['NAV','Date'],'requestedStart':'2025-12-01','controlledCalendarYears':[]}}for id,r in previous.items()}
  del incoming['incomplete']['calendarProof']['requestedStart']
  previous['good'].update(checkedAt='2026-02-06',responseSha256='b'*64,calendarProof={'controlledFields':['NAV']})
  baseline={id:{'currency':'USD','points':[{'date':'2025-12','price':100}]}for id in previous}
  merged,report=refresh({'series':sources},previous,baseline,now,lambda s,n:incoming[s['id']])
  self.assertEqual(merged['incomplete'],previous['incomplete']);self.assertEqual(merged['good']['checkedAt'],'2026-02-06')
  self.assertEqual(report['series'][0]['status'],'validated');self.assertEqual(report['series'][1]['status'],'failed');self.assertIn('requestedStart',report['series'][1]['reason'])
  thin=monthly.monitoring_report(report);self.assertEqual(thin['series'][0]['controlScope']['requestedStart'],'2025-12-01');self.assertNotIn('controlScope',thin['series'][1])
  with tempfile.TemporaryDirectory()as folder:
   root=pathlib.Path(folder);(root/'src/data').mkdir(parents=True);(root/'scripts/source-snapshots').mkdir(parents=True)
   (root/'src/data/automated-monthly.json').write_text(json.dumps(previous));(root/'src/data/automated-etf-monthly.json').write_text('{}');(root/'scripts/monthly-automation.json').write_text(json.dumps({'series':sources}));(root/'baseline.json').write_text(json.dumps(baseline))
   (root/'scripts/source-snapshots/monthly-automated.json').write_text(json.dumps({'good':{'checkedAt':'2026-02-06','responseSha256':'b'*64,'calendarProof':previous['good']['calendarProof']}}))
   with patch.object(monthly,'ROOT',root),patch.object(monthly,'refresh',return_value=(merged,report)),patch.object(sys,'argv',['refresh_monthly_history','--baseline',str(root/'baseline.json'),'--output',str(root/'report.json'),'--apply']):
    with self.assertRaises(SystemExit)as exit:monthly.main()
   self.assertEqual(exit.exception.code,1);saved=json.loads((root/'src/data/automated-monthly.json').read_text());self.assertEqual(saved['incomplete'],previous['incomplete']);self.assertEqual(saved['good']['checkedAt'],'2026-02-06');self.assertEqual(len(json.loads((root/'report.json').read_text())['series']),2);self.assertEqual(json.loads((root/'scripts/source-snapshots/monthly-automated.json').read_text())['good']['calendarProof'],incoming['good']['calendarProof'])

if __name__=='__main__':unittest.main()
