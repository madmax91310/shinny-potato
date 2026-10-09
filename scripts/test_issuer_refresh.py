"""Regression checks for unattended issuer extensions: dates, identity, basis, partial history and atomic writes."""
import copy
import html
import datetime as dt
import json
import pathlib
import tempfile
import unittest
from collect_amundi_etf import parse_product, collect, request_payload
from collect_ssga_etf import parse_page
from collect_etf_holdings import parse_holdings, holdings_url
from apply_etf_collection import apply, merge_collection
from data_automation import UTC

ROOT = pathlib.Path(__file__).resolve().parents[1]
NOW = dt.datetime(2026, 10, 5, tzinfo=UTC)


def amundi(physical=True):
    product = {'productId': 'TESTSHARE', 'currencies': {'CURRENCY': 'EUR'},
        'characteristics': {'ISIN': 'TESTSHARE', 'CURRENCY': 'EUR', 'TER': 0.2,
            'FUND_REPLICATION_METHODOLOGY': 'Direct(Physical)' if physical else 'Indirect(Swap Based)',
            'DISTRIBUTION_POLICY': 'Capitalisation', 'POSITION_AS_OF_DATE': '2026-10-01',
            'FUND_BREAKDOWNS_AS_OF_DATE': '2026-09-30'},
        'historics': [{'indicator': 'shareAumInMCcy', 'historicalData': [
            {'date': 1790899200000, 'data': 123456789}]}],
        'breakDowns': [{'aggregationField': field, 'breakDownData': [
            {'aggregationName': name, 'weight': 0, 'adjustedWeight': weight,
             'additionalProperties': {'isin': 'US67066G1040'}}]}
            for field, name, weight in [('FUND_TOP10','NVIDIA',0.08),('FUND_SECTORS','Information Technology',1),('FUND_COUNTRIES','United States',1)]],
        'metrics': [{'indicator': 'shareCalendarPerformance', 'period': str(y), 'value': 0.10}for y in range(2020,2026)]}
    share = {'isin': 'TESTSHARE', 'currency': 'EUR', 'replication': product['characteristics']['FUND_REPLICATION_METHODOLOGY'], 'provider': 'Amundi'}
    return product, share


class IssuerRefreshTests(unittest.TestCase):
    def test_state_street_excludes_the_partial_inception_year(self):
        attrs = {k: {'value': v} for k, v in {'isin': 'TESTSHARE', 'base-fund-currency': 'USD',
            'benchmark': 'S&P 500', 'fund-income-treatment': 'Accumulating', 'inception-date': '31 Oct 2023'}.items()}
        attrs['total-expense-ratio'] = {'originalValue': '0.03'}
        attrs['aum'] = {'originalValue': '1000000', 'asOfDateSimple': '01 Oct 2026'}
        components = {'fund-quick-info': {'attrs': attrs}, 'data-point-cal': {'fund-perf-cal-net-total-mon': {
            'attrs': {str(y): {'label': str(y), 'originalValue': '10'} for y in range(2022, 2026)}}}}
        body = ''.join(f'<input id="{k}" value="{html.escape(json.dumps(v), quote=True)}">' for k, v in components.items())
        result, _ = parse_page(body, {'isin': 'TESTSHARE', 'currency': 'USD'}, NOW)
        self.assertEqual(result['performance']['years'], {'2024': 10, '2025': 10})

    def test_amundi_adjusted_weights_and_separate_dates(self):
        p,s=amundi();r=parse_product(p,s,NOW)
        self.assertEqual(r['holdings']['rows'][0]['weightPct'],8)
        self.assertEqual(r['sectors']['asOf'],'2026-09-30')
        self.assertEqual(r['holdings']['asOf'],'2026-10-01')
        self.assertEqual(r['aum']['amount'],123456789) # API amounts are units, despite historic indicator name.
        self.assertEqual(r['performance']['years']['2025'],10)

    def test_synthetic_basket_never_becomes_tracked_exposure(self):
        p,s=amundi(False);r=parse_product(p,s,NOW)
        self.assertFalse(any(k in r for k in ('sectors','countries','holdings')))
        self.assertIn('aum',r)

    def test_recent_share_refreshes_without_overwriting_proxy(self):
        p,s=amundi();p['metrics'][0]['value']=None
        r=parse_product(p,s,NOW)
        result=merge_collection({'checkedAt':NOW.isoformat(),'shares':[r]}, {}, {'TESTSHARE':{'currency':'EUR'}})
        self.assertIn('aum',result['TESTSHARE'])
        self.assertNotIn('2020',result['TESTSHARE']['performance']['years'])
        self.assertEqual(result['TESTSHARE']['performance']['years']['2025'],10)

    def test_first_calendar_is_promoted_for_all_eleven_recent_shares(self):
        ids=['FR0014017NX3','FR001400U5Q4','IE0000N55FP4','IE0002Y8CX98','IE0007Y8Y157','IE000C6ITGC8','IE000DQLYVB9','IE000L6ZMMC4','IE000W8WMSL2','LU2970735911','LU3038520774']
        for isin in ids:
            with self.subTest(isin=isin):
                share={'isin':isin,'currency':'EUR','productId':isin,'sourceUrl':'https://issuer.test/exact-share','characteristics':{'terPct':.2}}
                baseline={isin:{'currency':'EUR','values':[1,2,3,4,5,6],'proxy':'UNCHANGED'}}
                report={'checkedAt':'2028-02-01','shares':[share]}
                pending=merge_collection(report,{},baseline)
                self.assertNotIn('performance',pending[isin])
                share['performance']={'currency':'EUR','basis':'fund','method':'calendar-year exact-share NAV total return','years':{'2027':6.61}}
                active=merge_collection(report,pending,baseline)
                self.assertEqual(active[isin]['performance']['years'],{'2027':6.61})
                share.pop('performance')
                report['checkedAt']='2028-02-02'
                self.assertEqual(merge_collection(report,active,baseline)[isin]['performance'],active[isin]['performance'])
                share['performance']={'currency':'EUR','basis':'fund','method':'calendar-year exact-share NAV total return','years':{'2028':7}}
                with self.assertRaises(ValueError):merge_collection(report,active,baseline)
                self.assertEqual(baseline[isin]['proxy'],'UNCHANGED')

    def test_amundi_accepts_one_completed_year_and_requests_next_year(self):
        p,s=amundi();p['metrics']=[{'indicator':'shareCalendarPerformance','period':'2025','value':.12}]
        self.assertEqual(parse_product(p,s,NOW)['performance']['years'],{'2025':12})
        next_year=NOW.replace(year=2027)
        self.assertIn('2026',[m['period']for m in request_payload([s],next_year)['metrics']])
        self.assertNotIn('2027',[m['period']for m in request_payload([s],next_year)['metrics']])

    def test_amundi_rejects_identity_method_dates_truncation(self):
        p,s=amundi()
        for defect in ('isin','currency','replication','date','truncated','incomplete-year'):
            bad=copy.deepcopy(p)
            if defect=='isin':bad['characteristics']['ISIN']='WRONG'
            if defect=='currency':bad['currencies']['CURRENCY']='USD'
            if defect=='replication':bad['characteristics']['FUND_REPLICATION_METHODOLOGY']='Indirect(Swap Based)'
            if defect=='date':bad['characteristics']['POSITION_AS_OF_DATE']='2026-07-01'
            if defect=='truncated':bad['breakDowns'][1]['breakDownData'][0]['adjustedWeight']=0.5
            if defect=='incomplete-year':bad['metrics'][0]['period']='2026'
            with self.subTest(defect=defect), self.assertRaises(ValueError):parse_product(bad,s,NOW)

    def test_duplicate_products_block_entire_collection(self):
        p,s=amundi()
        with self.assertRaises(ValueError):collect({'instruments':[s]},NOW,lambda _: {'products':[p,p]})

    def test_holdings_absent_or_older_does_not_redate(self):
        p,s=amundi();r=parse_product(p,s,NOW);report={'checkedAt':NOW.isoformat(),'shares':[r]};base={'TESTSHARE':{'currency':'EUR'}}
        first=merge_collection(report,{},base)
        r['holdings']['asOf']='2026-09-01'
        self.assertEqual(merge_collection(report,first,base)['TESTSHARE']['holdings'],first['TESTSHARE']['holdings'])
        r.pop('holdings')
        self.assertEqual(merge_collection(report,first,base)['TESTSHARE']['holdings'],first['TESTSHARE']['holdings'])

    def test_unknown_sector_cannot_partially_write(self):
        p,s=amundi();r=parse_product(p,s,NOW);bad=copy.deepcopy(r);bad['isin']='OTHER';bad['sectors']['rows'][0]['name']='UNREVIEWED'
        with tempfile.TemporaryDirectory() as folder:
            target=pathlib.Path(folder)/'active.json';target.write_text('{}\n')
            with self.assertRaises(ValueError):apply({'checkedAt':NOW.isoformat(),'shares':[r,bad]},target,{'TESTSHARE':{'currency':'EUR'},'OTHER':{'currency':'EUR'}})
            self.assertEqual(target.read_text(),'{}\n')

    def test_blackrock_holdings_identity_complete_weights_and_geography(self):
        columns={'asOfDate':20261002,'issueName':['APPLE','TSMC','USD CASH'],'holdingPercent':[60,39.9,0.1],
            'isin':['US0378331005','US8740391003',''],'countryOfRisk':['United States','Taiwan','-'],'assetClass':['Equity','Equity','Cash']}
        body={'productId':1,'currencyCode':'USD','componentsByNameMap':{'holdings':{'containersByNameMap':{'all':{'dataPointsByNameMap':{k:{'value':v}for k,v in columns.items()}}}}}}
        share={'productId':1,'currency':'USD'};h,g=parse_holdings(body,share,NOW)
        self.assertEqual(len(h['rows']),2);self.assertEqual(g['rows'][-1],{'name':'Other','weightPct':0.1})
        for bad in ('identity','weights','columns'):
            b=copy.deepcopy(body)
            if bad=='identity':b['productId']=2
            if bad=='weights':b['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']['holdingPercent']['value'][0]=50
            if bad=='columns':b['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']['isin']['value'].pop()
            with self.subTest(defect=bad),self.assertRaises(ValueError):parse_holdings(b,share,NOW)

    def test_signed_settlement_cash_does_not_hide_equity_holdings(self):
        columns={'asOfDate':20261002,'issueName':['APPLE','TSMC','JPY CASH','USD CASH'],
            'holdingPercent':[60,39.07187,2.29492,-1.36679],
            'isin':['US0378331005','US8740391003','',''],
            'countryOfRisk':['United States','Taiwan','Japan','-'],
            'assetClass':['Equity','Equity','Cash','Cash']}
        points={k:{'value':v}for k,v in columns.items()}
        body={'productId':1,'currencyCode':'USD','componentsByNameMap':{'holdings':{
            'containersByNameMap':{'all':{'dataPointsByNameMap':points}}}}}
        share={'productId':1,'currency':'USD'}
        h,g=parse_holdings(body,share,NOW)
        self.assertEqual([r['weightPct']for r in h['rows']],[60,39.07187])
        self.assertAlmostEqual(sum(r['weightPct']for r in g['rows']),100)
        self.assertIn({'name':'Other','weightPct':-1.36679},g['rows'])
        for kind in ['Equity','Fixed Income','Unknown']:
            points['assetClass']['value'][-1]=kind
            with self.subTest(kind=kind),self.assertRaises(ValueError):parse_holdings(body,share,NOW)
        points['assetClass']['value'][-1]='Cash'
        for weight in [True,float('nan'),float('inf'),-101]:
            points['holdingPercent']['value'][-1]=weight
            with self.subTest(weight=weight),self.assertRaises(ValueError):parse_holdings(body,share,NOW)

    def test_signed_currency_forwards_in_bond_fund(self):
        columns={'asOfDate':20261002,'issueName':['GOVERNMENT BOND','CNY/USD','IDR/USD'],
            'holdingPercent':[100.00050,-0.00023,-0.00027],
            'isin':['XS1234567890','',''], 'countryOfRisk':['China','-','-'],
            'assetClass':['Fixed Income','Forwards','Forwards']}
        # Use real fund totals while keeping the largest security within bounds.
        columns['issueName'].insert(1,'SECOND BOND')
        columns['holdingPercent']=[60,40.00050,-0.00023,-0.00027]
        columns['isin'].insert(1,'XS1234567891')
        columns['countryOfRisk'].insert(1,'Indonesia')
        columns['assetClass'].insert(1,'Fixed Income')
        points={k:{'value':v}for k,v in columns.items()}
        body={'productId':297676,'currencyCode':'USD','componentsByNameMap':{'holdings':{
            'containersByNameMap':{'all':{'dataPointsByNameMap':points}}}}}
        share={'productId':297676,'currency':'USD','holdingsAssetClass':'Fixed Income'}
        h,g=parse_holdings(body,share,NOW)
        self.assertEqual(len(h['rows']),2)
        self.assertAlmostEqual(sum(r['weightPct']for r in g['rows']),100)
        for kind in ['Fixed Income','Unqualified derivative']:
            points['assetClass']['value'][-1]=kind
            with self.assertRaises(ValueError):parse_holdings(body,share,NOW)

    def test_request_excludes_current_year_and_bounds_aum_download(self):
        p,s=amundi();payload=request_payload([s],NOW)
        self.assertNotIn('2026',[m['period']for m in payload['metrics']])
        self.assertEqual(payload['historics'][0]['indicator'],'shareAumInMCcy')

if __name__=='__main__':unittest.main()
