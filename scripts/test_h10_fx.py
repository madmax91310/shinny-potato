import csv,datetime as dt,gzip,io,pathlib,unittest
from test_h10_xml import H10XmlTests
from h10_fx import parse,source_url,SERIES
from collect_ranking_sources import parse_fred_series,parse_cross_fx
from data_automation import UTC
ROOT=pathlib.Path(__file__).resolve().parents[1]
PROOF=ROOT/'reports/data-review-2026-10-23/preuves'
NOW=dt.datetime(2026,10,23,tzinfo=UTC)
class H10Tests(unittest.TestCase):
    def body(self):return gzip.decompress((PROOF/'h10-daily-rates.csv.gz').read_bytes())
    def test_primary_and_fred_are_the_same_daily_series(self):
        primary=parse(self.body(),NOW)
        fred=parse_fred_series(gzip.decompress((PROOF/'fred-dextaus.csv.gz').read_bytes()),'DEXTAUS')
        common=set(primary)&set(fred)
        self.assertGreater(len(common),6000)
        self.assertTrue(all(primary[d]==fred[d] for d in common))
        self.assertIn(dt.date(1999,1,4),primary)
        self.assertIn('rel=H10',source_url(NOW))
    def test_wrong_identity_units_duplicate_future_or_missing_data_rejected(self):
        for wrong in [self.body().replace(SERIES.encode(),b'H10/H10/RXI_N.B.JA'),
                      self.body().replace(b'"Taiwanese N.T. Dollar"',b'"Japanese Yen"'),
                      self.body().replace(b'"TWD"',b'"JPY"'),
                      self.body()+b'1999-01-04,'+b'1,'*22+b'1\r\n',
                      self.body().replace(b'1999-01-01,',b'2099-01-01,')]:
            with self.subTest(wrong=wrong[:35]),self.assertRaises(ValueError):parse(wrong,NOW)
    def test_monthly_cross_uses_same_day_and_retains_primary_source(self):
        from test_ranking_sources import document
        # Real full H10 + synthetic ECB dates allow explicit month-end coverage assertions.
        ecb=document([('1999-01-29',1.2),('1999-02-26',1.35)])
        now=dt.datetime(1999,3,12,tzinfo=UTC)
        # Restrict the primary document to the requested time instead of accepting future rows.
        rows=list(csv.reader(io.StringIO(self.body().decode())))
        rows=rows[:6]+[r for r in rows[6:]if r[0]<='1999-03-12']
        out=io.StringIO();csv.writer(out).writerows(rows)
        result=parse_cross_fx(out.getvalue().encode(),ecb,now,source_url=source_url(now))
        self.assertEqual(result['observations']['1999-02']['asOf'],'1999-02-26')
        self.assertEqual(result['sourceSeries'],SERIES)
        self.assertIn('secondarySha256',result)
if __name__=='__main__':unittest.main()
