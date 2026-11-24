"""Real issuer snapshots: exact held classes, raw NAV weights and safe partial scope."""
import copy
import datetime as dt
import gzip
import json
from pathlib import Path
import unittest
from lifestrategy_portfolio import paired_allocation, parse_portfolio, qualified_stored_portfolio
from data_automation import UTC

FIX = Path(__file__).parent/'fixtures/lifestrategy-nav'
NOW = dt.datetime(2026,11,12,tzinfo=UTC)
CONFIG = [(20,'9490','IE00BMVB5K07'),(40,'9492','IE00BMVB5M21'),(60,'9494','IE00BMVB5P51'),(80,'9496','IE00BMVB5R75')]

def load(name):
    return json.loads(gzip.decompress((FIX/(name+'.json.gz')).read_bytes()))

class ExactLifeStrategyPortfolio(unittest.TestCase):
    def setUp(self):
        self.records=load('parent-records')
    def parse(self, config=CONFIG[2], body=None):
        return parse_portfolio(body or load(config[1]),config,self.records[config[2]],NOW)
    def test_four_actual_portfolios_and_cash_are_not_rescaled(self):
        for config in CONFIG:
            with self.subTest(isin=config[2]):
                body=load(config[1]);h=self.parse(config,body)
                self.assertEqual(h['sourceRowCount'],len(body['data']['borHoldings'][0]['holdings']['items']))
                self.assertFalse(h['normalizationApplied'])
                self.assertAlmostEqual(sum(x['weightPct']for x in h['rows'])+sum(x['marketValuePercentage']for x in h['nonFundPositions']),h['publishedNetWeightPct'],places=10)
                if config[0]>=60:self.assertIn('IE00BK5BQW10',{r['isin']for r in h['rows']})
                self.assertNotIn('IE00BKX55R35',{r['isin']for r in h['rows']})
                self.assertEqual(h['asOf'],'2026-09-30')
        self.assertEqual(self.parse(CONFIG[3])['publishedNetWeightPct'],100.00002)
        self.assertEqual(self.parse(CONFIG[1])['assetAllocationChecks']['Obligations']['publishedDisplayPct'],59.71)
    def test_precise_lookthrough_preserves_fund_nav_and_exact_classes(self):
        from lifestrategy_holdings import derive
        for config in CONFIG:
            r=copy.deepcopy(self.records[config[2]]);r['underlyingHoldings']=self.parse(config)
            source={'asOf':'2026-09-30','checkedAt':'2026-11-11','sourceUrl':'https://www.vanguard.co.uk/gpx/graphql','sha256':'a'*64,'complete':True,
                    'rows':[{'isin':f'US{i:010d}','name':f'Unit security {i}','weightPct':99/12}for i in range(12)]}
            underliers={h['isin']:copy.deepcopy(source)for h in r['underlyingHoldings']['rows']if h['assetCategory']=='Actions'}
            result=derive(config[2],r,underliers,{},NOW)
            self.assertEqual(result['scope'],'equity-lookthrough')
            self.assertAlmostEqual(sum(x['weightPct']for x in result['rows']),result['equitySleeveWeightPct']*.99)
            self.assertEqual(result['checkedAt'],'2026-11-11')
            self.assertLess(sum(x['weightPct']for x in result['rows']),80)
            if config[0]>=60:
                del underliers['IE00BK5BQW10'];underliers['IE00BKX55R35']=source
                with self.assertRaises(ValueError):derive(config[2],r,underliers,{},NOW)

    def test_changed_identity_partial_mixed_dates_and_unknown_class_are_rejected(self):
        for mutation in ('identity','partial','date','class','weight','duplicate'):
            body=load('9494');p=body['data']['funds'][0]['profile'];h=body['data']['borHoldings'][0]['holdings']
            if mutation=='identity':p['fundCurrency']='USD'
            if mutation=='partial':h['lastItemKey']='next-page'
            if mutation=='date':h['items'][0]['effectiveDate']='2026-08-31'
            if mutation=='class':h['items'][0]['isin']='IE00BKX55R35'
            if mutation=='weight':h['items'][0]['marketValuePercentage']+=1
            if mutation=='duplicate':h['items'][1]=copy.deepcopy(h['items'][0])
            with self.subTest(mutation=mutation),self.assertRaises(ValueError):self.parse(body=body)
    def test_stored_validation_is_idempotent_and_never_renews_source_control(self):
        c=CONFIG[2];r=copy.deepcopy(self.records[c[2]]);r['underlyingHoldings']=self.parse(c)
        original=copy.deepcopy(r)
        for _ in range(2):self.assertEqual(qualified_stored_portfolio(r,NOW+dt.timedelta(days=1)),original['underlyingHoldings'])
        self.assertEqual(r,original)
        r['underlyingHoldings']['rows'][0]['weightPct']+=.01
        with self.assertRaises(ValueError):qualified_stored_portfolio(r,NOW)
    def test_actual_partial_run_keeps_the_september_companion_with_original_dates(self):
        records = load('retained-parent-october-allocation-20261122')
        now = dt.datetime(2026, 11, 22, tzinfo=UTC)
        for isin, record in records.items():
            with self.subTest(isin=isin):
                old = copy.deepcopy(record)
                parent = qualified_stored_portfolio(record, now)
                allocation, old_pdf_hash = paired_allocation(record, parent)
                self.assertEqual(allocation['asOf'], '2026-09-30')
                self.assertEqual(allocation['checkedAt'], '2026-11-16')
                self.assertEqual(parent['checkedAt'], '2026-11-16T19:24:45.991150+00:00')
                self.assertNotEqual(old_pdf_hash, record['documentSha256'])
                self.assertEqual(record, old)
                record['underlyingHoldingsAllocation'] = {
                    'holdingsSha256': 'a' * 64, 'allocation': allocation, 'documentSha256': old_pdf_hash}
                with self.assertRaisesRegex(ValueError, 'same-date'):
                    qualified_stored_portfolio(record, now)

    def test_lagged_book_is_rechecked_only_against_its_own_allocation(self):
        from collect_lifestrategy import collect_exact_portfolio
        records = load('retained-parent-october-allocation-20261122')
        now = dt.datetime(2026, 11, 24, tzinfo=UTC)
        for config in CONFIG:
            isin = config[2]
            with self.subTest(isin=isin):
                previous = records[isin]
                latest = copy.deepcopy(previous)
                old_book = previous['underlyingHoldings']
                collect_exact_portfolio(old_book['sourceResponse'], config, latest, previous, now)
                self.assertEqual(latest['underlyingHoldingsQualification']['status'], 'qualified-previous-period')
                self.assertEqual(latest['underlyingHoldingsQualification']['expectedAsOf'], '2026-10-31')
                self.assertEqual(latest['underlyingHoldings']['asOf'], '2026-09-30')
                self.assertEqual(latest['underlyingHoldings']['checkedAt'], now.isoformat())
                self.assertEqual(latest['underlyingHoldingsAllocation']['allocation']['checkedAt'], '2026-11-16')
                self.assertEqual(latest['assetAllocation'], previous['assetAllocation'])
                self.assertEqual(latest['underlyingHoldings']['rows'], old_book['rows'])
                self.assertEqual(latest['underlyingHoldings'], qualified_stored_portfolio(latest, now))

                changed = copy.deepcopy(old_book['sourceResponse'])
                items = changed['data']['borHoldings'][0]['holdings']['items']
                items[0]['securityLongDescription'] += ' changed'
                with self.assertRaisesRegex(ValueError, 'different positions'):
                    collect_exact_portfolio(changed, config, copy.deepcopy(previous), previous, now)
                with self.assertRaisesRegex(ValueError, 'no qualified matching allocation'):
                    collect_exact_portfolio(old_book['sourceResponse'], config, copy.deepcopy(previous), None, now)

    def test_source_format_change_and_wrong_published_allocation_rejected(self):
        body=load('9494');body['data']['borHoldings'][0]['holdings']['items'][0]['securityType']='NEW_TYPE'
        with self.assertRaises(ValueError):self.parse(body=body)
        self.records[CONFIG[2][2]]['assetAllocation']['rows'][0]['weightPct']+=.01
        with self.assertRaises(ValueError):self.parse()

if __name__=='__main__':unittest.main()
