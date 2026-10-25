"""A real unchanged observation renews its control, a cache/error cannot."""
import copy,datetime as dt,unittest
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

if __name__=='__main__':unittest.main()
