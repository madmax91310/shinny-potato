"""Replay the official 2 November responses without relaxing financial windows."""
import copy
import datetime as dt
import gzip
import json
import pathlib
import tempfile
import unittest
import urllib.error
from unittest.mock import patch
from data_automation import UTC
from collect_etf_pilot import parse_share, collect as collect_etf
from update_bitcoin_monthly import collect, parse_chart, apply

ROOT = pathlib.Path(__file__).resolve().parents[1]
FIX = ROOT / 'scripts/fixtures/source-incidents-20261102'
NOW = dt.datetime(2026, 11, 2, 16, 45, tzinfo=UTC)

def fixture(name):
    return json.loads(gzip.decompress((FIX / (name + '.json.gz')).read_bytes()))

class SourceIncidents(unittest.TestCase):
    def test_official_bitcoin_boundary_null_is_outside_requested_window(self):
        raw = {k: fixture('bitcoin-' + v) for k,v in [('1mo','monthly'),('1d','daily')]}
        with self.assertRaisesRegex(ValueError, 'Invalid numeric'):
            parse_chart(raw['1mo'], '1mo')
        result = collect(NOW, lambda url: raw['1mo' if 'interval=1mo' in url else '1d'])
        self.assertEqual(result['periodEnd'], '2026-10')
        self.assertEqual(result['points'][-1], ['2026-10', 77434.75])
        self.assertEqual(result['lastDailyCloses'][-1]['date'], '2026-10-31')
        self.assertIsNone(result['rawResponse']['1mo']['chart']['result'][0]['indicators']['quote'][0]['close'][-1])
        with tempfile.TemporaryDirectory() as d:
            path = pathlib.Path(d)/'btc.json'
            self.assertTrue(apply(result,path)); before=path.read_bytes()
            self.assertFalse(apply({**result,'checkedAt':'2026-11-03'},path))
            self.assertEqual(path.read_bytes(),before)

    def test_bitcoin_invalid_used_observations_never_become_zero_or_erase_previous(self):
        for defect in ('null','nan','inf','bool','html','symbol','currency','timezone','interval','duplicate','missing-final-day','stale','disagreement','api-error'):
            with self.subTest(defect=defect):
                raw = {k:fixture('bitcoin-'+v) for k,v in [('1mo','monthly'),('1d','daily')]}
                r=raw['1mo']['chart']['result'][0]
                if defect in ('null','nan','inf','bool','html'):
                    r['indicators']['quote'][0]['close'][-2]={'null':None,'nan':float('nan'),'inf':float('inf'),'bool':True,'html':'<html>error</html>'}[defect]
                elif defect in ('symbol','currency','timezone','interval'):
                    r['meta'][{'timezone':'exchangeTimezoneName','interval':'dataGranularity'}.get(defect,defect)]='WRONG'
                elif defect=='duplicate':r['timestamp'][-2]=r['timestamp'][-3]
                elif defect=='missing-final-day':
                    daily=raw['1d']['chart']['result'][0];daily['timestamp'].pop(-2);daily['indicators']['quote'][0]['close'].pop(-2)
                elif defect=='stale':
                    r['timestamp'].pop(-2);r['indicators']['quote'][0]['close'].pop(-2)
                elif defect=='disagreement':r['indicators']['quote'][0]['close'][-2]+=1
                else:raw['1mo']['chart']['error']={'code':'Too Many Requests'}
                with tempfile.TemporaryDirectory() as d:
                    destination=pathlib.Path(d)/'btc.json';destination.write_text('{"checkedAt":"2026-10-02","points":[["2026-09",83553.85]]}')
                    before=destination.read_bytes()
                    with self.assertRaises((ValueError,KeyError,TypeError)):
                        report=collect(NOW,lambda url:raw['1mo' if 'interval=1mo' in url else '1d']);apply(report,destination)
                    self.assertEqual(destination.read_bytes(),before)

    def test_sp_official_replies_and_failed_refresh_keep_original_handoff(self):
        from collect_sp_composition import parse_public_data
        from sp_public_feed import refresh
        configs=[c for c in json.loads((ROOT/'scripts/index-automation.json').read_text())['indices'] if c.get('compositionDataUrl')]
        for config in configs:
            facts=parse_public_data(gzip.decompress((FIX/(config['id']+'.json.gz')).read_bytes()),config,NOW)
            self.assertEqual(facts['asOf'],'2026-10-30')
            self.assertEqual(len(facts['holdings']),10)
            self.assertAlmostEqual(sum(w for _,w in facts['countries']),100,delta=.03)
            self.assertAlmostEqual(sum(w for _,w in facts['sectors']),100,delta=.03)
        for config in configs:
            # Actual GitHub refusal is HTML even at the JSON/PDF URLs.
            denied=gzip.decompress((FIX/('github-'+config['id']+'-compositionDataUrl.response.gz')).read_bytes())
            self.assertIn(b'<html',denied.lower())
            with self.assertRaises(ValueError):parse_public_data(denied,config,NOW)
        for code in (403,429,500):
            with tempfile.TemporaryDirectory() as d:
                path=pathlib.Path(d)/'feed.json';original=(ROOT/'scripts/observations/sp-public-feed.json').read_bytes();path.write_bytes(original)
                def failed(config):raise urllib.error.HTTPError(config['compositionDataUrl'],code,'blocked',{},None)
                with self.assertRaises(urllib.error.HTTPError):refresh(configs,NOW,path,failed)
                self.assertEqual(path.read_bytes(),original)

    def test_http_failures_preserve_last_records_and_bound_retries(self):
        from data_automation import get_json
        from apply_etf_collection import merge_collection
        share=next(s for s in json.loads((ROOT/'scripts/etf-pilot.json').read_text())['instruments'] if s['isin']=='IE00B3FH7618')
        current=json.loads((ROOT/'src/data/automated-etf.json').read_text())
        for code in (403,429,500):
            calls=[]; waits=[]
            def opener(request,timeout):
                calls.append(request.full_url)
                raise urllib.error.HTTPError(request.full_url,code,'provider failure',{},None)
            with self.subTest(code=code):
                with self.assertRaises(urllib.error.HTTPError):
                    get_json('https://query2.finance.yahoo.com/v8/finance/chart/BTC-USD',opener=opener,sleep=waits.append)
                self.assertEqual(len(calls),1 if code==403 else 3)
                self.assertLessEqual(sum(waits),60)
                with patch('collect_etf_pilot.fetch_product',side_effect=urllib.error.HTTPError('https://www.blackrock.com/',code,'failed',{},None)):
                    report=collect_etf({'instruments':[share]},{share['isin']:{}},NOW)
                self.assertEqual(len(report['failures']),1)
                self.assertEqual(merge_collection(report,current,{}),current)

    def test_treasury_is_signed_sector_weight_reconciled_to_entire_portfolio(self):
        share=next(s for s in json.loads((ROOT/'scripts/etf-pilot.json').read_text())['instruments'] if s['isin']=='IE00B3FH7618')
        body=fixture('blackrock-251741')
        result=parse_share(body,share,NOW)
        self.assertEqual(result['sectors']['rows'],[{'name':'Treasury','weightPct':104.56},{'name':'Cash and/or Derivatives','weightPct':-4.56}])
        self.assertEqual(result['sectors']['asOf'],'2026-10-30')
        self.assertEqual(sum(r['weightPct'] for r in result['sectors']['rows']),100)
        strict=copy.deepcopy(share);strict.pop('sectorAllocationConvention')
        with self.assertRaisesRegex(ValueError,'Invalid allocation weight'):parse_share(body,strict,NOW)
        for defect in ('identity','currency','date','partial','wrong-sector','negative-bond','wrong-class','mismatch','nonfinite','missing-cash'):
            bad=copy.deepcopy(body)
            p=bad['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
            sector=bad['componentsByNameMap']['exposureBreakdowns']['containersByNameMap']['sector']['dataPointsByNameMap']
            if defect=='identity':bad['productId']=1
            elif defect=='currency':bad['currencyCode']='USD'
            elif defect=='date':p['asOfDate']['value']=20261029
            elif defect=='partial':p['holdingPercent']['value'].pop()
            elif defect=='wrong-sector':p['sectorName']['value'][0]='Other'
            elif defect=='negative-bond':p['holdingPercent']['value'][0]=-1
            elif defect=='wrong-class':p['assetClass']['value'][0]='Equity'
            elif defect=='mismatch':p['holdingPercent']['value'][0]+=1
            elif defect=='nonfinite':sector['fund']['value'][0]=float('nan')
            else:sector['fund']['value'][1]=0
            with self.subTest(defect=defect),self.assertRaises((ValueError,KeyError)):parse_share(bad,share,NOW)

    def test_three_treasury_contracts_require_same_date_complete_signed_holdings(self):
        configs = [s for name in ('additional-etf-sources.json', 'qualified-exposure-sources.json')
                   for s in json.loads((ROOT/'scripts'/name).read_text())['instruments']]
        now = dt.datetime(2026, 11, 3, tzinfo=UTC)
        for isin, gross in [('IE00B1FZS913', 100.36), ('IE00B14X4S71', 100.03), ('IE00B4WXJG34', 100.03)]:
            share = next(s for s in configs if s['isin'] == isin)
            share = {**share, 'distribution': 'Distributing', 'requireFullHistory': False}
            body = fixture('treasury-' + isin)
            with self.subTest(isin=isin):
                self.assertEqual(share['sectorAllocationConvention'], 'signed-net-assets-reconciled-holdings')
                result = parse_share(body, share, now)
                self.assertEqual(result['sectors']['asOf'], '2026-10-30')
                self.assertEqual(result['sectors']['rows'], [
                    {'name': 'Treasury', 'weightPct': gross},
                    {'name': 'Cash and/or Derivatives', 'weightPct': round(100-gross, 2)}])
                strict = dict(share); strict.pop('sectorAllocationConvention')
                with self.assertRaisesRegex(ValueError, 'Invalid allocation weight'):
                    parse_share(body, strict, now)
                for defect in ('date', 'partial', 'mismatch', 'identity'):
                    bad = copy.deepcopy(body)
                    points = bad['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
                    if defect == 'date': points['asOfDate']['value'] = 20261029
                    elif defect == 'partial': points['holdingPercent']['value'].pop()
                    elif defect == 'mismatch': points['holdingPercent']['value'][0] += 1
                    else: bad['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']['isin']['value'] = 'WRONG'
                    with self.subTest(defect=defect), self.assertRaises((ValueError, KeyError)):
                        parse_share(bad, share, now)

    def test_normal_positive_sectors_keep_independent_holdings_publication_date(self):
        share = next(s for s in json.loads((ROOT/'scripts/additional-etf-sources.json').read_text())['instruments']
                     if s['isin'] == 'IE00B14X4S71')
        body = json.loads(gzip.decompress((ROOT/'scripts/fixtures/new-instruments/IE00B14X4S71.json.gz').read_bytes()))
        sector = body['componentsByNameMap']['exposureBreakdowns']['containersByNameMap']['sector']['dataPointsByNameMap']
        holdings = body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
        self.assertEqual(sector['fund']['value'], [99.89, 0.11])
        self.assertNotEqual(sector['asOf']['value'], holdings['asOfDate']['value'])
        result = parse_share(body, share, NOW)
        self.assertEqual(result['sectors']['asOf'], '2026-10-29')
        self.assertNotIn('weightConvention', result['sectors'], 'No signed reconciliation was performed')
        # The signed exception still needs a matching complete holdings snapshot.
        sector['fund']['value'] = [100.03, -0.03]
        with self.assertRaisesRegex(ValueError, 'Signed allocation and holdings dates disagree'):
            parse_share(body, share, NOW)

if __name__=='__main__':unittest.main()
