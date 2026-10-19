import datetime as dt
import unittest
from observation_status import holdings_status


class HoldingsRecovery(unittest.TestCase):
    def test_failed_attempts_preserve_original_success_and_period(self):
        now=dt.datetime(2026,10,19,tzinfo=dt.timezone.utc)
        old={'status':'validated','checkedAt':'2026-10-15T06:00:00Z'}
        retained={'asOf':'2026-10-14'}
        first=holdings_status(old,retained,None,'source timeout',now)
        self.assertEqual(first['lastSuccessAt'],old['checkedAt'])
        self.assertEqual(first['checkedAt'],now.isoformat())
        self.assertEqual(first['asOf'],'2026-10-14')
        second=holdings_status(first,retained,None,'source timeout',now+dt.timedelta(days=1))
        self.assertEqual(second['lastSuccessAt'],old['checkedAt'])
        self.assertEqual(second['status'],'failed')
        recovered=holdings_status(second,retained,{'asOf':'2026-10-20'},None,now+dt.timedelta(days=2))
        self.assertEqual(recovered['lastSuccessAt'],recovered['checkedAt'])
        self.assertEqual(recovered['asOf'],'2026-10-20')
        self.assertNotIn('error',recovered)

    def test_missing_historical_check_stays_unknown(self):
        now=dt.datetime(2026,10,19,tzinfo=dt.timezone.utc)
        row=holdings_status({'status':'failed','checkedAt':'2026-10-18'}, {'asOf':'2026-10-15'},None,'source unavailable',now)
        self.assertIsNone(row['lastSuccessAt'])
        row=holdings_status({}, {'asOf':'2026-10-15','checkedAt':'2026-10-16'},None,'source unavailable',now)
        self.assertEqual(row['lastSuccessAt'],'2026-10-16')


if __name__=='__main__':
    unittest.main()
