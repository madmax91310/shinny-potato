"""Regression checks for unattended issuer extensions: dates, identity, basis, partial history and atomic writes."""
import copy
import gzip
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
        self.assertEqual(result['characteristics']['inceptionDate'], '2023-10-31')

    def test_merge_does_not_resurrect_the_partial_inception_year(self):
        share={'isin':'TESTSHARE','productId':'TESTSHARE','currency':'USD','sourceUrl':'https://issuer.test/share',
            'characteristics':{'inceptionDate':'2023-10-31'},
            'performance':{'currency':'USD','basis':'fund','method':'NAV total return','years':{'2025':10}}}
        old={'TESTSHARE':{'productId':'TESTSHARE','currency':'USD','sourceUrl':share['sourceUrl'],
            'performance':{'currency':'USD','basis':'fund','method':'NAV total return','years':{'2023':3,'2024':10},'checkedAt':'2026-10-01'}}}
        merged=merge_collection({'checkedAt':NOW.isoformat(),'shares':[share]},old,{})['TESTSHARE']['performance']
        self.assertEqual(merged['years'],{'2024':10,'2025':10})
        self.assertEqual(merged['excludedYears']['2023']['value'],3)
        self.assertEqual(merged['excludedYears']['2023']['checkedAt'],'2026-10-01')
        share['characteristics']['inceptionDate']='20231031'
        compact=merge_collection({'checkedAt':NOW.isoformat(),'shares':[share]},old,{})['TESTSHARE']['performance']
        self.assertEqual(compact['years'],{'2024':10,'2025':10})
        self.assertEqual(compact['excludedYears']['2023']['inceptionDate'],'2023-10-31')
        share['performance']['years']['2023']=3
        with self.assertRaisesRegex(ValueError,'partial launch year'):
            merge_collection({'checkedAt':NOW.isoformat(),'shares':[share]},old,{})

    def test_amundi_adjusted_weights_and_separate_dates(self):
        p,s=amundi();r=parse_product(p,s,NOW)
        self.assertEqual(r['holdings']['rows'][0]['weightPct'],8)
        self.assertEqual(r['sectors']['asOf'],'2026-09-30')
        self.assertEqual(r['countries']['sourceComponent'],'FUND_COUNTRIES')
        self.assertEqual(r['sectors']['sourceComponent'],'FUND_SECTORS')
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

    def test_duplicate_product_is_reported_without_publishing_it(self):
        p,s=amundi()
        report=collect({'instruments':[s]},NOW,lambda _: {'products':[p,p]})
        self.assertEqual(report['shares'],[])
        self.assertEqual(report['failures'][0]['isin'],s['isin'])

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

class IndividualFeeControls(unittest.TestCase):
    def setUp(self):
        from collect_public_issuer import wisdomtree_factsheet
        self.isin = 'IE00BJGWQN72'
        self.now = dt.datetime(2026, 10, 29, tzinfo=UTC)
        config = json.loads((ROOT/'scripts/additional-etf-sources.json').read_text())
        self.share = next(r for r in config['instruments'] if r['isin']==self.isin)
        self.body = gzip.decompress((ROOT/'scripts/fixtures/wisdomtree-complete'/f'{self.isin}.pdf.gz').read_bytes())
        self.incoming = wisdomtree_factsheet(self.body, self.share, self.now)
        self.old = json.loads(gzip.decompress((ROOT/'scripts/fixtures/characteristic-controls/wisdomtree-cloud-before-20261029.json.gz').read_bytes()))['record']

    def merge(self, incoming=None, old=None, checked='2026-10-29'):
        return merge_collection({'checkedAt': checked, 'shares':[self.incoming if incoming is None else incoming]},
                                {self.isin:self.old if old is None else old}, {})[self.isin]

    def test_real_official_fee_is_controlled_without_replacing_newer_bundle(self):
        self.assertEqual(self.incoming['characteristics']['asOf'], '2026-09-30')
        self.assertEqual(self.old['characteristics']['asOf'], '2026-10-19')
        self.assertEqual(self.incoming['characteristics']['terPct'], self.old['characteristics']['terPct'])
        self.assertNotEqual(self.incoming['characteristics']['listings'], self.old['characteristics']['listings'])
        result = self.merge()
        self.assertEqual(result['characteristics'], self.old['characteristics'])
        check = result['characteristicChecks']['terPct']
        self.assertEqual(check['checkedAt'], '2026-10-29')
        self.assertEqual(check['asOf'], '2026-10-19')
        self.assertEqual(check['sourceAsOf'], '2026-09-30')
        self.assertEqual(check['sourceUrl'], self.share['factsheetUrl'])
        self.assertEqual(check['sha256'], self.incoming['characteristics']['sha256'])
        self.assertEqual(check['observationEvidence'], self.old['characteristicChecks']['terPct'])
        self.assertEqual(result['characteristicChecks']['listings'], self.old['characteristicChecks']['listings'])
        for key in ['aum','countries','sectors','holdings']:
            self.assertEqual(result.get(key), self.old.get(key))

    def test_same_receipt_is_idempotent_and_later_control_preserves_original_observation(self):
        first = self.merge()
        self.assertEqual(self.merge(old=first), first)
        later = self.merge(old=first, checked='2026-10-30')
        self.assertEqual(later['characteristicChecks']['terPct']['checkedAt'], '2026-10-30')
        self.assertEqual(later['characteristicChecks']['terPct']['observationEvidence'], self.old['characteristicChecks']['terPct'])
        self.assertEqual(later['characteristics'], self.old['characteristics'])

    def test_out_of_order_control_never_replaces_a_newer_one(self):
        first = self.merge()
        older = self.merge(old=first, checked='2026-10-28')
        self.assertEqual(older['characteristicChecks'], first['characteristicChecks'])

    def test_different_fee_in_older_document_does_not_replace_or_renew(self):
        changed=copy.deepcopy(self.incoming);changed['characteristics']['terPct']=0.41
        result=self.merge(changed)
        self.assertEqual(result['characteristics'],self.old['characteristics'])
        self.assertEqual(result['characteristicChecks'],self.old['characteristicChecks'])

    def test_absent_fee_or_cache_does_not_become_a_source_control(self):
        for mode in ['absent','cached','unattempted']:
            with self.subTest(mode=mode):
                incoming=copy.deepcopy(self.incoming)
                if mode=='absent':incoming['characteristics'].pop('terPct')
                elif mode=='cached':incoming['sourceState']='cached'
                else:incoming['sourceAttempted']=False
                self.assertEqual(self.merge(incoming)['characteristicChecks'],self.old['characteristicChecks'])

    def test_incomplete_proof_or_invalid_date_does_not_renew(self):
        for key,value in [('sha256',None),('sha256','not-a-hash'),('sourceUrl',None),
                          ('asOf','2026-09-99')]:
            with self.subTest(key=key,value=value):
                incoming=copy.deepcopy(self.incoming);incoming['characteristics'][key]=value
                self.assertEqual(self.merge(incoming)['characteristicChecks'],self.old['characteristicChecks'])

    def test_only_existing_finite_numeric_fee_fields_are_corroborated(self):
        for value in [True,None,float('nan'),float('inf')]:
            with self.subTest(value=value):
                incoming=copy.deepcopy(self.incoming);incoming['characteristics']['terPct']=value
                try:result=self.merge(incoming)
                except ValueError:continue  # Earlier financial validation may reject it.
                self.assertEqual(result['characteristicChecks'],self.old['characteristicChecks'])
        incoming=copy.deepcopy(self.incoming);incoming['characteristics']['unqualifiedFee']=.4
        self.assertNotIn('unqualifiedFee',self.merge(incoming)['characteristicChecks'])

    def test_exposure_only_collection_and_wrong_identity_cannot_renew_fees(self):
        incoming=copy.deepcopy(self.incoming);incoming['exposureOnly']=True
        self.assertEqual(self.merge(incoming)['characteristicChecks'],self.old['characteristicChecks'])
        incoming=copy.deepcopy(self.incoming);incoming['currency']='EUR'
        with self.assertRaises(ValueError):self.merge(incoming)

    def test_wrong_official_pdf_identity_is_rejected_before_merge(self):
        from collect_public_issuer import wisdomtree_factsheet
        wrong={**self.share,'isin':'IE00WRONG0000'}
        with self.assertRaises(ValueError):wisdomtree_factsheet(self.body,wrong,self.now)
        with self.assertRaises(ValueError):wisdomtree_factsheet(self.body,self.share,dt.datetime(2026,9,29,tzinfo=UTC))

if __name__=='__main__':unittest.main()
