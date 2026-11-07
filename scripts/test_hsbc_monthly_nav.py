"""Real financial fixtures; isolated parser/coverage/failure tests, never provider certification."""
import base64
import copy
import datetime as dt
import hashlib
import io
import json
import pathlib
import unittest
import zipfile
from unittest.mock import patch
import hsbc_nav_history as h

F=pathlib.Path(__file__).parent/'fixtures/hsbc-cash-20261107'
NOW=dt.datetime(2026,11,7,14,tzinfo=dt.timezone.utc)
SOURCE=next(s for s in json.loads((F.parents[1]/'monthly-automation.json').read_text())['series']if s['id']=='etfIE00B4K6B022Nav')

def packet():
    p=json.loads((F/'browser-financial-fixture.json').read_text());stamp=dt.datetime.now(dt.timezone.utc)
    p['checkedAt']=(stamp-dt.timedelta(seconds=15)).isoformat();p['completedAt']=stamp.isoformat()
    b=(F/'native-nav-history.xlsx').read_bytes();p['observations'].append({'kind':'nav-workbook','url':h.PAGE.split('/en/')[0]+'/api/v1/detail/fund-history','status':200,'sha256':hashlib.sha256(b).hexdigest(),'bodyBase64':base64.b64encode(b).decode()})
    return p


def inputs():
    nav,_=h.nav_workbook((F/'native-nav-history.xlsx').read_bytes(),SOURCE,NOW);p=packet();periods=[];declared=[]
    for title,asof in [('annual-report','2025-12-31'),('semi-annual-report','2026-06-30')]:periods+=h.report_cash((F/(title+'-cash-excerpt.txt')).read_text(),asof,'https://www.assetmanagement.hsbc.co.uk/'+title)
    for r in p['observations']:
        if r['kind']=='cash-announcement':declared.append(h.announcement(base64.b64decode(r['bodyBase64']),r['url']))
    current=h.current_cash(json.loads(base64.b64decode(next(r for r in p['observations']if r['kind']=='dividend-table')['bodyBase64'])),'https://www.assetmanagement.hsbc.co.uk/api/v1/detail/dividend-table')
    return nav,periods,declared,current


class HsbcMonthlyNav(unittest.TestCase):
    def test_real_cash_and_nav_annual_oracle(self):
        nav,periods,declared,current=inputs();levels,proof=h.qualify(nav,periods,declared,current,SOURCE,NOW)
        self.assertEqual(len(nav),738);self.assertEqual(len(proof['cashChecks']),6)
        self.assertEqual([e['exDate']for e in declared],['2024-02-01','2024-08-08','2025-02-06','2025-08-07'])
        self.assertAlmostEqual(100*(levels['2024-12-31']/levels['2023-12-29']-1),11.571110862628764)
        self.assertAlmostEqual(100*(levels['2025-12-31']/levels['2024-12-31']-1),21.760279017250973)
        self.assertEqual(levels[max(levels)],nav[max(nav)])
        from issuer_nav_history import monthly,calendar_checks
        checks=calendar_checks(levels,{'2024':11.6,'2025':21.8},1,NOW)
        self.assertEqual([r['year']for r in checks],[2024,2025]);self.assertEqual(len(monthly(levels,'EUR','EUR','2023-12',NOW)[0]),35)
        self.assertNotAlmostEqual(100*(nav['2024-12-31']/nav['2023-12-29']-1),11.5711)

    def test_idempotence_and_retained_history_are_not_double_income(self):
        args=inputs();first,proof=h.qualify(*args,SOURCE,NOW);second,p2=h.qualify(*args,SOURCE,NOW,proof)
        self.assertEqual(first,second);self.assertEqual(len(p2['cashChecks']),6)
        self.assertEqual(len(p2['hsbcCashQualification']['events']),6)
        self.assertTrue(p2['hsbcCashQualification']['retainedHistoricalReferenceUsed'])
        self.assertEqual(args[0]['2023-12-29'],47.4548)

    def test_complete_cash_period_not_just_matching_amount(self):
        nav,p,d,c=inputs()
        for changed in [[],[x for x in p if x['end']!='2025-12-31']]:
            with self.assertRaisesRegex(ValueError,'coverage'):h.qualify(nav,changed,d,c,SOURCE,NOW)
        p[0]['events'].pop()
        with self.assertRaisesRegex(ValueError,'contradict|Conflicting complete'):h.qualify(nav,p,d,c,SOURCE,NOW)

    def test_missing_cash_ex_nav_and_late_month_end(self):
        nav,p,d,c=inputs();nav.pop('2024-08-08')
        with self.assertRaisesRegex(ValueError,'ex-date NAV absent'):h.qualify(nav,p,d,c,SOURCE,NOW)
        nav,p,d,c=inputs()
        for day in list(nav):
            if '2024-03-20'<day<'2024-04-01':del nav[day]
        with self.assertRaisesRegex(ValueError,'month-end'):h.qualify(nav,p,d,c,SOURCE,NOW)

    def test_cash_contradiction_or_duplicate_payment_not_added(self):
        nav,p,d,c=inputs();bad=copy.deepcopy(d);bad[0]['amount']+=.01
        with self.assertRaisesRegex(ValueError,'Conflicting gross'):h.qualify(nav,p,d+bad,c,SOURCE,NOW)
        bad=copy.deepcopy(d[1]);bad['exDate']='2024-08-01'
        with self.assertRaisesRegex(ValueError,'Conflicting ex-dates'):h.qualify(nav,p,d+[bad],c,SOURCE,NOW)

    def test_out_of_order_observation_and_coverage_gap(self):
        nav,p,d,c=inputs();_,proof=h.qualify(nav,p,d,c,SOURCE,NOW)
        nav.pop(max(nav))
        with self.assertRaisesRegex(ValueError,'Out-of-order'):h.qualify(nav,p,d,c,SOURCE,NOW,proof)
        nav,p,d,c=inputs();c[1]['exDate']='2026-08-01';c[1]['recordDate']='2026-08-02';c[1]['payDate']='2026-08-03'
        with self.assertRaisesRegex(ValueError,'coverage gap'):h.qualify(nav,p[:-1],d,c,SOURCE,NOW)

    def test_report_heading_and_class_not_inferred(self):
        text=(F/'annual-report-cash-excerpt.txt').read_text()
        for modified in [text.replace('Dividend Ex-Date','Payment Date'),text.replace('EUR (DIST)','USD (DIST)'),text.replace('The Company paid','Examples paid')]:
            with self.assertRaises(ValueError):h.report_cash(modified,'2025-12-31','official')

    def test_nav_schema_currency_formula_and_identity(self):
        raw=(F/'native-nav-history.xlsx').read_bytes()
        def change(old,new):
            out=io.BytesIO()
            with zipfile.ZipFile(io.BytesIO(raw))as source,zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED)as dest:
                for n in source.namelist():dest.writestr(n,source.read(n).replace(old,new)if n=='xl/worksheets/sheet1.xml'else source.read(n))
            return out.getvalue()
        for body in [change(b'IE00B4K6B022',b'IE00B4K6B023'),change(b'Share Class : EUR',b'Share Class : USD'),change(b'<x:v>EUR</x:v>',b'<x:v>USD</x:v>'),change(b'<x:v>NAV</x:v>',b'<x:f>1+1</x:f><x:v>NAV</x:v>')]:
            with self.assertRaises(ValueError):h.nav_workbook(body,SOURCE,NOW)
        _,proof=h.nav_workbook(raw,SOURCE,NOW)
        self.assertEqual(proof['auxiliaryUnitsNotPublished'],['2025-10-14','2025-10-01','2024-02-29'])
        self.assertIn('2024-03-31',proof['explicitMissingNavDates'])

    def test_source_packet_omission_cache_failure_and_wrong_scope(self):
        p=packet();p['completedAt']=p['checkedAt']='2026-01-01T00:00:00Z'
        variants=[p,{**packet(),'status':'failed'},{**packet(),'requestedCashUrls':[]},{**packet(),'attempts':[]}]
        for p in variants:
            with self.assertRaises(ValueError):h.collect(SOURCE,NOW,lambda u,**k:k.get('supplied'),lambda u:b'',transport=p,prior={})
        p=packet();p['observations']=[r for r in p['observations']if r['kind']!='dividend-table']
        with self.assertRaisesRegex(ValueError,'omitted'):h.collect(SOURCE,NOW,lambda u,**k:k.get('supplied'),lambda u:b'',transport=p,prior={})

    def test_complete_transport_to_existing_common_producer(self):
        texts={'annual%20report':(F/'annual-report-cash-excerpt.txt').read_bytes(),'semi%20annual%20report':(F/'semi-annual-report-cash-excerpt.txt').read_bytes()}
        with patch.object(h,'financial_cash_text',lambda b:b.decode()):
            levels,nav,years,proof=h.collect(SOURCE,NOW,lambda u,**k:k['supplied'],lambda u:texts[u.rsplit('/',1)[1]],transport=packet(),prior={})
        self.assertEqual(proof['controlledInstrument'],h.ISIN);self.assertFalse(proof['calendarSourceConsultedByThisCollector'])
        self.assertTrue(proof['constructedIncomeIndex']);self.assertNotEqual(levels['2024-12-31'],nav['2024-12-31'])

    def test_ordinary_refresh_bootstrap_and_failed_retry_keep_old_values(self):
        from collect_official_share_history import collect_one
        from refresh_monthly_history import refresh
        original=h.collect
        texts={'annual%20report':(F/'annual-report-cash-excerpt.txt').read_bytes(),'semi%20annual%20report':(F/'semi-annual-report-cash-excerpt.txt').read_bytes()}
        with patch.object(h,'collect',lambda source,now,document,large:original(source,now,document,large,transport=packet(),prior={})),patch.object(h,'financial_cash_text',lambda b:b.decode()):
            record=collect_one(SOURCE,NOW,document_fetch=lambda u:texts[u.rsplit('/',1)[1]])
        self.assertEqual(record['latestLevel']['valuationBasis'],'fund-nav-price')
        self.assertFalse(record['anniversaryAvailable']);self.assertNotIn('anniversaryPoints',record)
        self.assertIn('internally computed',record['financialConvention'])
        config={'series':[SOURCE]};current,report=refresh(config,{}, {},NOW,lambda *_:record)
        self.assertEqual(report['series'][0]['status'],'validated')
        self.assertEqual(current[SOURCE['id']]['periodStart'],'2023-12')
        before=copy.deepcopy(current)
        def offline(*_):raise TimeoutError('source unavailable')
        preserved,failed=refresh(config,current,{},NOW+dt.timedelta(days=1),offline)
        self.assertEqual(preserved,before);self.assertEqual(failed['series'][0]['status'],'failed')
        self.assertEqual(preserved[SOURCE['id']]['checkedAt'],'2026-11-07')
        invalid=copy.deepcopy(record);invalid['calendarProof']['checks']=[]
        _,bad=refresh(config,{}, {},NOW,lambda *_:invalid)
        self.assertEqual(bad['series'][0]['status'],'failed','Missing required annual qualification cannot bootstrap')
