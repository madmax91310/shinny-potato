import copy
import gzip
import hashlib
import datetime as dt
import json
from pathlib import Path
import unittest
import xlrd
from hsbc_holdings import parse_workbook, parse_positions
from jpm_holdings import parse

NOW=dt.datetime(2026,10,20,tzinfo=dt.timezone.utc)
FIX=Path(__file__).parent/'fixtures/physical-holdings'

class FullSources(unittest.TestCase):
    def test_hsbc_keeps_50_equities_with_futures_and_accounts_separate(self):
        rows,stamp,excluded=parse_workbook((FIX/'hsbc-euro-stoxx.xls').read_bytes(),NOW)
        self.assertEqual(len(rows),50);self.assertEqual(stamp,'2026-10-15')
        self.assertAlmostEqual(sum(r['weightPct'] for r in rows),99.2208)
        self.assertTrue(any(r['kind']=='index-future' for r in excluded))
        self.assertAlmostEqual(sum(r['weightPct'] for r in rows+excluded),100)

    def test_hsbc_rejects_incomplete_unknown_or_changed_weights(self):
        book=xlrd.open_workbook(str(FIX/'hsbc-euro-stoxx.xls'))
        values=[book.sheet_by_index(0).row_values(i) for i in range(7,book.sheet_by_index(0).nrows)]
        cases=[]
        bad=copy.deepcopy(values);bad[0][7]+=1;cases.append(bad)
        bad=copy.deepcopy(values);bad[-1][2]='Unknown Account';cases.append(bad)
        bad=copy.deepcopy(values);bad[0][0]=bad[1][0];cases.append(bad)
        bad=copy.deepcopy(values);bad[0][4]=float('nan');cases.append(bad)
        cases.append(values[1:])
        for case in cases:
            with self.subTest(case=cases.index(case)),self.assertRaises(ValueError):parse_positions(case,'2026-10-15')
        with self.assertRaises(ValueError):parse_workbook(b'<html>Not a workbook</html>',NOW)

    def jpm(self):return json.loads((FIX/'jpm-daily.json').read_text())

    def test_jpm_full_list_excludes_option_overlay_without_renormalisation(self):
        rows,stamp,excluded=parse(self.jpm(),NOW)
        self.assertEqual(len(rows),234);self.assertEqual(stamp,'2026-10-19')
        self.assertAlmostEqual(sum(r['weightPct'] for r in rows),99.28569678861494)
        self.assertEqual(sum(r['kind']=='Option - Index' for r in excluded),8)
        self.assertTrue(all(r['weightPct']<0 for r in excluded if r['kind']=='Option - Index'))
        self.assertAlmostEqual(sum(r['weightPct'] for r in rows+excluded),100)

    def test_jpm_identity_counts_dates_and_security_types_are_blocking(self):
        cases=[]
        bad=self.jpm();bad['fundData']['shareClass']['currencyCode']='EUR';cases.append(bad)
        bad=self.jpm();bad['fundData']['dailyHoldingsAll']['data'].pop();cases.append(bad)
        bad=self.jpm();bad['fundData']['dailyHoldingsAll']['data'][0]['navDate']='2026-10-16';cases.append(bad)
        bad=self.jpm();bad['fundData']['dailyHoldingsAll']['data'][0]['securityType']='Unknown';cases.append(bad)
        bad=self.jpm();bad['fundData']['dailyHoldingsAll']['data'][0]['securityIsin']=None;cases.append(bad)
        bad=self.jpm();bad['fundData']['dailyHoldings']['data'][0]['marketValuePercent']=10;cases.append(bad)
        for i,bad in enumerate(cases):
            with self.subTest(case=i),self.assertRaises(ValueError):parse(bad,NOW)

class JpmIndependentSnapshots(unittest.TestCase):
    def source(self):
        body=gzip.decompress((FIX/'jpm-different-headline-20261029.json.gz').read_bytes())
        self.assertEqual(hashlib.sha256(body).hexdigest(),'248c16af9b086154904d16aeadbd7bb5a6685148ccda0f93837226c8f693c032')
        return json.loads(body)
    def test_actual_positions_do_not_borrow_the_headline_date(self):
        body=self.source();now=dt.datetime(2026,10,29,tzinfo=dt.timezone.utc)
        self.assertEqual(body['fundData']['fundValuationDate'],'2026-10-28')
        rows,stamp,excluded=parse(body,now)
        self.assertEqual(stamp,'2026-10-29')
        self.assertAlmostEqual(sum(r['weightPct']for r in rows+excluded),100,places=10)
        self.assertEqual(parse(body,now),(rows,stamp,excluded))
        self.assertEqual(body,self.source(),'No in-place date/value rewrite')
    def test_positions_top_and_weight_guards_remain_independent(self):
        now=dt.datetime(2026,10,29,tzinfo=dt.timezone.utc)
        for change in ['position-date','top-date','market-value','weight','future-position-date']:
            body=self.source();f=body['fundData']
            if change=='position-date':f['dailyHoldingsAll']['data'][0]['navDate']='2026-10-28'
            if change=='top-date':f['dailyHoldings']['effectiveDate']='2026-10-28'
            if change=='market-value':f['dailyHoldingsAll']['data'][0]['marketValue']+=100000
            if change=='weight':f['dailyHoldingsAll']['data'][0]['marketValuePercent']+=.01
            if change=='future-position-date':f['dailyHoldingsAll']['effectiveDate']='2027-01-01'
            with self.subTest(change=change),self.assertRaises(ValueError):parse(body,now)
    def test_collection_preserves_separate_raw_clock(self):
        from unittest.mock import patch
        from jpm_holdings import collect,ISIN
        raw=json.dumps(self.source()).encode()
        with patch('jpm_holdings.download',return_value=raw):
            result=collect({'isin':ISIN,'currency':'USD'},dt.datetime(2026,10,29,tzinfo=dt.timezone.utc))
        self.assertEqual(result['asOf'],'2026-10-29')
        self.assertEqual(result['snapshotDates'],{'holdings':'2026-10-29','headlineValuationRaw':'2026-10-28','headlineValuationUsedInCalculation':False})

if __name__=='__main__':unittest.main()
