"""Official dated XNDX route; no comparison tolerance or legacy value is changed."""
import copy
import datetime as dt
import gzip
import json
import pathlib
import unittest
from unittest.mock import patch
from bs4 import BeautifulSoup
from zoneinfo import ZoneInfo
import refresh_anniversary_levels as m
from producer_report_plans import build_plan
from producer_report_contract import finish, validate_contract

ROOT=pathlib.Path(__file__).resolve().parents[1]
RAW=gzip.decompress((ROOT/'scripts/fixtures/publication/xndx-official-20261113/fred-table.html.gz').read_bytes())
NOW=dt.datetime(2026,11,13,6,10,tzinfo=dt.timezone.utc)


def source(day,value='200.01'):
    """Synthetic one-session table retaining the official source identity schema."""
    s=BeautifulSoup(RAW,'html.parser')
    for tr in s.select('table[aria-label="metadata - NASDAQ-100 Total Return"] tr'):
        key=tr.th.get_text(strip=True)
        if key=='Date Range':tr.td.string=day+' to '+day
        if key=='Last Updated':
            date=dt.datetime.fromisoformat(day+'T19:00:00').replace(tzinfo=ZoneInfo('America/Chicago'))
            tr.td.string=date.strftime('%Y-%m-%d %I:%M %p %Z')
    tbody=s.select_one('#data-table-observations tbody');tbody.clear()
    tbody.append(BeautifulSoup('<tr><th>'+day+'</th><td>'+value+'</td></tr>','html.parser').tr)
    s.select_one('#extra-rows').clear()
    return str(s).encode()


class OfficialXndxDocumentTests(unittest.TestCase):
    def config(self):return next(c for c in m.configurations()if c['id']=='nasdaq100')
    def collect(self,body=RAW,now=NOW):return m.collect_one(self.config(),now,fred_fetch=lambda u:body)
    def test_real_document_exact_source_and_completed_session(self):
        calls=[]
        def fetch(url):calls.append(url);return RAW
        r=m.collect_one(self.config(),NOW,fred_fetch=fetch,json_fetch=lambda _:self.fail('No Yahoo source control inferred'))
        self.assertEqual(calls,[m.FRED_XNDX_URL]);self.assertEqual(r['value'],34587.76)
        self.assertEqual(r['asOf'],'2026-11-12');self.assertEqual(r['parser'],'fred-document')
        self.assertEqual(r['symbol'],'XNDX');self.assertEqual(r['variant'],'TOTAL');self.assertEqual(r['currency'],'USD')
        self.assertEqual(r['sourceEvidence']['expectedCompletedSession'],r['asOf'])
        self.assertEqual(r['sourceHashes'],{m.FRED_XNDX_URL:r['sha256']})
        self.assertNotIn('previousCloseDateEvidence',r,'The official level is not attributed to Yahoo')
    def test_only_exact_index_and_usd_total_return(self):
        for mutation in [{'id':'other'},{'symbol':'NDX'},{'currency':'EUR'},{'variant':'PRICE'},{'seriesId':'NASDAQ100'}]:
            with self.subTest(mutation=mutation),self.assertRaises(ValueError):m.collect_xndx_document({**self.config(),**mutation},NOW,lambda _:RAW)
    def test_source_format_identity_and_publication_are_required(self):
        for body in [b'',b'<html>login required</html>',RAW.replace(b'NASDAQXNDX',b'NASDAQ100'),RAW.replace(b'/Index/Overview/XNDX',b'/Index/Overview/NDX'),RAW.replace(b'>Nasdaq, Inc.<',b'>Other Provider<'),RAW.replace(b'>Daily<',b'>Monthly<')]:
            with self.subTest(body=body[-40:]),self.assertRaises(ValueError):self.collect(body)
        with self.assertRaisesRegex(ValueError,'Future'):self.collect(RAW,dt.datetime(2026,11,12,23,tzinfo=dt.timezone.utc))
    def test_holiday_half_day_and_year_boundary(self):
        for now,day in [('2026-11-26T20:00:00+00:00','2026-11-25'),('2026-11-27T19:00:00+00:00','2026-11-27'),('2027-01-01T12:00:00+00:00','2026-12-31')]:
            # The synthetic official update must already have occurred at the check.
            body=source(day).replace((day+' 07:00 PM EST').encode(),(day+' 11:00 AM EST').encode())
            body=body.replace((day+' 07:00 PM CST').encode(),(day+' 11:00 AM CST').encode())
            with self.subTest(now=now):self.assertEqual(self.collect(body,dt.datetime.fromisoformat(now))['asOf'],day)
    def test_unfinished_session_is_never_an_official_close(self):
        body=source('2026-11-13').replace(b'2026-11-13 07:00 PM CST',b'2026-11-13 10:00 AM CST')
        with self.assertRaisesRegex(ValueError,'not a completed'):self.collect(body,dt.datetime(2026,11,13,17,tzinfo=dt.timezone.utc))
    def test_delayed_publication_is_waiting_not_a_source_success(self):
        old={'value':34587.76,'asOf':'2026-11-12','checkedAt':NOW.isoformat()}
        later=dt.datetime(2026,11,13,22,tzinfo=dt.timezone.utc)
        updated,report=m.refresh({'nasdaq100':old},later,collect=lambda c,n:self.collect(RAW,n),selected=[self.config()])
        self.assertEqual(updated,{'nasdaq100':old});self.assertFalse(report['successes']);self.assertFalse(report['errors'])
        self.assertEqual(report['outcomes'][0]['status'],'waiting');self.assertEqual(report['waiting'][0]['evidence']['expectedSession'],'2026-11-13')
    def test_network_failure_preserves_last_success_and_other_sources(self):
        old={'value':34587.76,'asOf':'2026-11-12','checkedAt':NOW.isoformat()}
        def collect(c,n):
            if c['id']=='nasdaq100':raise OSError('isolated network failure')
            return {'value':100,'asOf':'2026-11-12','currency':'EUR','parser':'test'}
        updated,report=m.refresh({'nasdaq100':old},NOW,collect=collect,selected=[self.config(),{'id':'other'}])
        self.assertEqual(updated['nasdaq100'],old);self.assertEqual(updated['other']['value'],100)
        self.assertEqual(report['errors'][0]['lastSuccessAt'],old['checkedAt'])
    def test_explicit_migration_no_dividend_or_precision_patch(self):
        old={'value':35781.52734375,'asOf':'2026-10-26','checkedAt':'2026-10-27T11:44:28.010154+00:00','parser':'yahoo','symbol':'^XNDX','currency':'USD','variant':'TOTAL','quoteMethod':'supported-xndx-ranges','sourceHashes':{url:'a'*64 for url in m.XNDX_URLS}}
        record=self.collect();updated,report=m.refresh({'nasdaq100':old},NOW,collect=lambda *_:record,selected=[self.config()])
        self.assertFalse(report['errors']);self.assertEqual(updated['nasdaq100']['value'],34587.76)
        self.assertEqual(old['value'],35781.52734375,'Original evidence is not rewritten')
        again,checked=m.refresh(updated,NOW,collect=lambda *_:record,selected=[self.config()])
        self.assertEqual(again,updated);self.assertEqual(checked['outcomes'][0]['status'],'unchanged-verified')
        for key,value in [('variant','PRICE'),('currency','EUR'),('symbol','NDX'),('parser','unqualified')]:
            retained,failed=m.refresh({'nasdaq100':{**old,key:value}},NOW,collect=lambda *_:record,selected=[self.config()])
            self.assertTrue(failed['errors']);self.assertEqual(retained['nasdaq100'][key],value)
    def test_migration_requires_bound_source_proof_and_preserves_identifiers(self):
        record=self.collect();old={'parser':'yahoo','symbol':'^XNDX','currency':'USD','variant':'TOTAL'}
        self.assertTrue(m.xndx_source_upgrade('nasdaq100',old,record))
        for mutation in [{'seriesId':'NASDAQ100'},{'sourceUrl':'https://example.org'},{'sourceHashes':{}},{'sourceEvidence':{}},{'value':0},{'isin':'IE0000000000'}]:
            with self.subTest(mutation=mutation):self.assertFalse(m.xndx_source_upgrade('nasdaq100',old,{**record,**mutation}))
    def test_targeted_plan_does_not_claim_gold_derivation(self):
        plan=build_plan('refresh_anniversary_levels',['--only','nasdaq100','--output','report.json'],module=m)
        selected={x['id']for x in plan['items']if x['selected']}
        self.assertEqual(selected,{'anniversary-nasdaq100'})
        gold=next(x for x in plan['items']if x['id']=='anniversary-or')
        self.assertFalse(gold['selected']);self.assertIn('outside explicit',gold['reason'])
    def test_ordinary_scope_keeps_all_previous_instruments(self):
        plan=build_plan('refresh_anniversary_levels',[],module=m)
        self.assertTrue(all(x['selected']for x in plan['items']))
        self.assertIn('anniversary-or',{x['id']for x in plan['items']})
        self.assertGreater(len(plan['items']),100)

if __name__=='__main__':unittest.main()
