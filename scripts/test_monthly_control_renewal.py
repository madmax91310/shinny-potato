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
if __name__=='__main__':unittest.main()
