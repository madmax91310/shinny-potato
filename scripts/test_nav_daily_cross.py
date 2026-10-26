import unittest, json, gzip, datetime as dt
from pathlib import Path
from collect_official_share_history import daily_nav_fx_factor

def xml(rows):
    return '<gesmes:Envelope xmlns:gesmes="http://www.gesmes.org/xml/2002-08-01" xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref"><Cube>'+''.join('<Cube time="'+d+'">'+''.join('<Cube currency="'+c+'" rate="'+str(v)+'"/>' for c,v in r.items())+'</Cube>'for d,r in rows)+'</Cube></gesmes:Envelope>'

class NavDailyCross(unittest.TestCase):
    def test_jpy_and_existing_usd_use_same_fixing_not_future_quote(self):
        body=xml([('2026-10-23',{'USD':1.2,'JPY':180}),('2026-10-26',{'USD':1.4,'JPY':200})])
        day,jpy=daily_nav_fx_factor('JPY','EUR','2026-10-25',body)
        self.assertEqual(day,'2026-10-23');self.assertAlmostEqual(18000*jpy,100)
        self.assertEqual(daily_nav_fx_factor('USD','EUR','2026-10-25',body),('2026-10-23',1/1.2))
    def test_partial_latest_currency_is_not_silently_replaced_by_older_fixing(self):
        body=xml([('2026-10-22',{'USD':1.2,'JPY':180}),('2026-10-23',{'USD':1.2})])
        with self.assertRaisesRegex(ValueError,'currency'):daily_nav_fx_factor('JPY','EUR','2026-10-23',body)
    def test_three_exact_official_captures_and_post_launch_bounds(self):
        from amundi_nav_history import parse
        root=Path(__file__).resolve().parents[1]
        captures=root/'reports/donnees-consolidees-2026-10-24/preuves/reprise-20261026/sources'
        sources={r['isin']:r for r in json.loads((root/'scripts/official-nav-remainder-sources.json').read_text())}
        seen=set()
        for path in captures.glob('*.json.gz'):
            body=json.loads(gzip.decompress(path.read_bytes()));isin=body['products'][0]['productId'];source=sources[isin]
            nav,years,proof=parse(body,source,dt.datetime(2026,10,26,tzinfo=dt.timezone.utc))
            self.assertEqual(nav[max(nav)],proof['scaleProof']['officialPerShareNav'])
            self.assertGreaterEqual(min(nav),proof['shareInception'])
            self.assertTrue(proof['officialIncomeReinvestedChartChecks'])
            with self.assertRaisesRegex(ValueError,'before exact-share launch'):
                parse(body,{**source,'periodStart':'2000-01'},dt.datetime(2026,10,26,tzinfo=dt.timezone.utc))
            seen.add(isin)
        self.assertEqual(seen,{'LU2089238385','FR0010342592','FR0007054358'})

    def test_stale_future_and_unqualified_pairs_fail(self):
        body=xml([('2026-10-23',{'USD':1.2,'JPY':180})])
        for date in ['2026-10-22','2026-10-28']:
            with self.assertRaises(ValueError):daily_nav_fx_factor('JPY','EUR',date,body)
        with self.assertRaisesRegex(ValueError,'Unqualified'):daily_nav_fx_factor('GBP','EUR','2026-10-23',body)

if __name__=='__main__':unittest.main()
