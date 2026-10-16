import copy
import datetime as dt
import unittest
from refresh_monthly_history import collect_fred, refresh, UTC

CONFIG = dict(id='nasdaq100', parser='fred', seriesId='NASDAQXNDX', symbol='XNDX', currency='USD', variant='TOTAL', periodStart='2026-01', precision=2, method='total return')
NOW = dt.datetime(2026, 2, 5, tzinfo=UTC)
CSV = 'observation_date,NASDAQXNDX\n2026-01-01,\n2026-01-29,100\n2026-01-30,103.25\n2026-02-02,200\n'

class NasdaqMonthly(unittest.TestCase):
    def test_last_session_not_average_and_open_month_excluded(self):
        calls=[]
        def fetch(url): calls.append(url); return CSV
        r=collect_fred(CONFIG,NOW,fetch)
        self.assertEqual(r['points'],[['2026-01',103.25]])
        self.assertEqual(len(set(calls)),2)

    def test_identity_and_incomplete_history(self):
        for key,value in [('symbol','NDX'),('currency','EUR'),('variant','PRICE'),('seriesId','NASDAQ100')]:
            with self.assertRaises(ValueError):collect_fred({**CONFIG,key:value},NOW,lambda _:CSV)
        for bad in [CSV.replace('NASDAQXNDX','NASDAQ100'), CSV.replace('2026-01-30','2026-01-20'), CSV.replace('103.25','NaN'), CSV+ '2026-01-30,103.25\n']:
            with self.assertRaises(ValueError):collect_fred(CONFIG,NOW,lambda _:bad)
        with self.assertRaises(ValueError):collect_fred({**CONFIG,'periodStart':'2025-12'},NOW,lambda _:CSV)

    def test_disagreement_and_failed_refresh_preserve_last_good(self):
        with self.assertRaises(ValueError):
            collect_fred(CONFIG,NOW,lambda url:CSV.replace('103.25','104') if 'cosd=' in url else CSV)
        old={**CONFIG,'points':[['2026-01',103.25]],'periodEnd':'2026-01'}
        current={'nasdaq100':old}
        def failed(*args):raise ValueError('stale')
        merged,report=refresh({'series':[CONFIG]},current,{},NOW,failed)
        self.assertEqual(merged,current)
        self.assertEqual(report['series'][0]['status'],'failed')

if __name__=='__main__':unittest.main()
