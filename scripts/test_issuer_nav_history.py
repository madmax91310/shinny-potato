import copy
import datetime as dt
import io
import json
import unittest
import zipfile
from unittest.mock import patch
from issuer_nav_history import (blackrock_nav, calendar_checks, dated, dws_nav,
    monthly, positive, wisdomtree_identity, wisdomtree_nav, xlsx_rows)
NOW=dt.datetime(2026,2,6,tzinfo=dt.timezone.utc)
class OfficialNav(unittest.TestCase):
    def test_prices_dates_and_structure(self):
        for value in [True,None,0,-1,float('nan'),float('inf')]:
            with self.assertRaises((ValueError,TypeError)):positive(value)
        for rows in [[('2026-02-07',1),('2026-02-06',2)],[('2025-12-31',1)]*2]:
            with self.assertRaises(ValueError):dated(rows,NOW)
        raw=[dict(dt=d,nav=v,closePrice=None,premiumDiscountToNav=None,pdIndicator=None)for d,v in [('2025-12-31',100),('2026-01-30',102)]]
        self.assertEqual(wisdomtree_nav(raw,NOW)['2026-01-30'],102)
        raw[0]['unexpected']=1
        with self.assertRaises(ValueError):wisdomtree_nav(raw,NOW)
    def test_calendar_precision_is_actual_published_precision(self):
        points={'2021-12-31':30.378,'2022-12-30':30.969}
        r=calendar_checks(points,{'2022':2},{'2022':0},NOW)
        self.assertAlmostEqual(r[0]['dailyDerived'],1.94548686549)
        with self.assertRaisesRegex(ValueError,'disagreement'):calendar_checks(points,{'2022':2},1,NOW)
        with self.assertRaisesRegex(ValueError,'disagreement'):calendar_checks(points,{'2022':54.55},0,NOW)
    def test_monthly_missing_month_late_boundary_and_fx(self):
        points={'2025-12-31':100,'2026-01-30':110}
        fx={'months':{'2025-12':{'asOf':'2025-12-31','rates':{'EUR':1,'USD':1.2}},'2026-01':{'asOf':'2026-01-30','rates':{'EUR':1,'USD':1.1}}}}
        result,proof=monthly(points,'USD','EUR','2025-12',NOW,fx)
        self.assertAlmostEqual(result[1][1],100)
        self.assertEqual(proof[1]['fxAsOf'],'2026-01-30')
        with self.assertRaisesRegex(ValueError,'coverage'):monthly({'2026-01-30':110},'USD','EUR','2025-12',NOW,fx)
        with self.assertRaisesRegex(ValueError,'too early'):monthly({'2026-01-03':110},'USD','USD','2026-01',NOW)
        self.assertEqual(monthly(points,'USD','USD','2026-01',NOW)[0],[['2026-01',110]])
    def test_share_identity_from_official_flight(self):
        def html(rows):return '<script>self.__next_f.push('+json.dumps([1,'1:'+json.dumps(rows)+'\n'])+')</script>'
        row={'ISIN':'GB00B15KXQ89','wtClassID':123,'fundCurrency':'USD'}
        self.assertEqual(wisdomtree_identity(html(row),row['ISIN'])['wtClassID'],123)
        with self.assertRaises(ValueError):wisdomtree_identity(html(row),'GB00B15KXV33')
        with self.assertRaises(ValueError):wisdomtree_identity(html([row,{**row,'fundCurrency':'EUR'}]),row['ISIN'])
    def test_workbook_does_not_execute_formulas(self):
        body=io.BytesIO()
        with zipfile.ZipFile(body,'w')as z:z.writestr('xl/worksheets/sheet1.xml','<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row><c r="A1"><f>1+1</f><v>2</v></c></row></sheetData></worksheet>')
        with self.assertRaisesRegex(ValueError,'Formula'):xlsx_rows(body.getvalue())
    def test_dws_exact_identity_currency_and_nav_column(self):
        rows=[{'A':'ISIN','B':'TEST'},{'A':'Currency','B':'USD'},{'A':'Date','C':'NAV'},{'A':'31.12.2025','C':'100'},{'A':'30.01.2026','C':'110'}]
        with patch('issuer_nav_history.xlsx_rows',return_value=rows):
            self.assertEqual(dws_nav(b'','TEST','USD',NOW)['2026-01-30'],110)
            with self.assertRaises(ValueError):dws_nav(b'','OTHER','USD',NOW)
            with self.assertRaises(ValueError):dws_nav(b'','TEST','EUR',NOW)
    def test_blackrock_empty_preinception_calendar_does_not_create_returns(self):
        facts={'isin':{'value':'TEST'},'inceptionDate':{'value':20240101},'useOfProfitsCode':{'value':'Accumulating'}}
        chart={'currencySymbol':{'value':'USD'},**{k:{'asOfDate':[20231229,20241231,20251231],'value':[9,10,15]}for k in ['navData','performanceData']}}
        cal={'returnTypes':{'value':['annualNav','benchmarkAnnual']},'returnsByCurrency':{'value':{'annualNav':'USD'}},'oneYear':{'active':True,'asOfDate':20251231,'value':['50',51]},'twoYear':{'active':True,'asOfDate':20241231,'value':[None,None]}}
        body={'componentsByNameMap':{'keyFundFacts':{'containersByNameMap':{'default':{'dataPointsByNameMap':facts}}},'performance':{'containersByNameMap':{'chart':{'dataPointsByNameMap':chart},'returns':{'subContainersByNameMap':{'calendar':{'dataPointsByNameMap':cal}}}}}}}
        result=blackrock_nav(body,'TEST','USD',NOW)
        self.assertEqual(result['years'],{'2025':50});self.assertNotIn('2023-12-29',result['nav'])
        cal['returnsByCurrency']['value']['annualNav']='EUR'
        with self.assertRaises(ValueError):blackrock_nav(body,'TEST','USD',NOW)
class NavRefreshSafety(unittest.TestCase):
    def test_failed_collection_and_changed_native_currency_preserve_all_evidence(self):
        from refresh_monthly_history import refresh
        old={'id':'example','parser':'official-nav','currency':'EUR','navCurrency':'USD','navProvider':'dws',
             'valuationBasis':'fund-nav-total-return','method':'NAV','periodStart':'2026-01','periodEnd':'2026-01',
             'points':[['2026-01',100]],'checkedAt':'2026-02-01'}
        baseline={'example':{'currency':'EUR','points':[{'date':'2026-01','price':100}]}}
        for collector in [lambda *_:(_ for _ in ()).throw(TimeoutError('offline')),lambda *_:{**old,'navCurrency':'EUR','proofRows':[]}]:
            result,report=refresh({'series':[old]},{'example':old},baseline,NOW,collector)
            self.assertEqual(result['example'],old)
            self.assertEqual(report['series'][0]['status'],'failed')
        fresh={**old,'proofRows':[]}
        result,report=refresh({'series':[old]},{'example':old},baseline,NOW,lambda *_:fresh)
        self.assertEqual(report['series'][0]['status'],'validated')
        self.assertEqual(result['example']['checkedAt'],'2026-02-01','An unchanged successful poll does not renew the financial evidence date')
if __name__=='__main__':unittest.main()
