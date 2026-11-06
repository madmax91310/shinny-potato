"""Guards for exact shares, cumulative versus calendar returns, and issuer layouts."""
import copy
import gzip
import datetime as dt
import json
from pathlib import Path
import unittest
from unittest.mock import patch
from collect_presentation_etf import globalx_physical, jpm_document
from collect_vaneck_etf import parse_document
from apply_etf_collection import merge_collection
from data_automation import UTC

ROOT = Path(__file__).resolve().parents[1]
FIX = ROOT / 'scripts/fixtures/official-documents/presentation-six'
NOW = dt.datetime(2026, 10, 11, tzinfo=UTC)
CONFIG = json.loads((ROOT / 'scripts/additional-etf-sources.json').read_text())
def share(isin): return next(s for s in CONFIG['instruments'] if s['isin'] == isin)

def parse_jpm(replace=None):
    texts = {None: (FIX/'jpm-full.txt').read_text(), (290,310): (FIX/'jpm-right.txt').read_text(),
             (100,190): (FIX/'jpm-facts.txt').read_text(), (0,145): (FIX/'jpm-names.txt').read_text(), (240,50): (FIX/'jpm-weights.txt').read_text()}
    if replace: texts = {k:v.replace(*replace) for k,v in texts.items()}
    with patch('collect_presentation_etf.pdf_text', side_effect=lambda body,crop=None: texts[crop]):
        return jpm_document(b'%PDF-fixture', share('IE0003UVYC20'), NOW)

class PresentationSources(unittest.TestCase):
    def test_current_cybersecurity_top_equities_use_full_book_not_visible_cash_table(self):
        folder=ROOT/'scripts/fixtures/physical-holdings'
        text=gzip.decompress((folder/'globalx-bug-20261106.html.gz').read_bytes()).decode()
        raw=(folder/'globalx-bug-20261105.csv').read_bytes()
        now=dt.datetime(2026,11,6,tzinfo=UTC);s=next(x for x in json.loads((ROOT/'scripts/exposure-etf-expansion.json').read_text())['instruments']if x['isin']=='IE00BMH5Y871')
        r=globalx_physical(text,s,now,holdings_fetch=lambda url:raw)
        self.assertEqual(r['holdings']['asOf'],'2026-11-05')
        self.assertEqual(len(r['holdings']['rows']),10)
        self.assertTrue(all(x['name']!='CASH'and x['isin']for x in r['holdings']['rows']))
        self.assertAlmostEqual(r['holdings']['rows'][0]['weightPct'],8.547)
        self.assertEqual(r['countries']['asOf'],'2026-10-31')
        self.assertEqual(r['sectors']['asOf'],'2026-10-31')
        self.assertFalse(r['holdings']['settlementCashProof']['normalizationApplied'])
        for altered in [text.replace('8.55','9.55'),text.replace('USD Accumulating','USD Distributing')]:
            with self.assertRaises(ValueError):globalx_physical(altered,s,now,holdings_fetch=lambda url:raw)
        with self.assertRaisesRegex(ValueError,'offline'):
            globalx_physical(text,s,now,holdings_fetch=lambda url:(_ for _ in ()).throw(ValueError('offline')))

    def test_small_unidentified_position_does_not_disqualify_identified_top_ten(self):
        import csv,io
        from decimal import Decimal
        folder=ROOT/'scripts/fixtures/physical-holdings'
        text=gzip.decompress((folder/'globalx-bug-20261106.html.gz').read_bytes()).decode()
        reader=csv.DictReader(io.StringIO((folder/'globalx-bug-20261105.csv').read_text()))
        fields=reader.fieldnames;rows=list(reader)
        known=min((r for r in rows if r.get('ISIN')),key=lambda r:Decimal(r['NET_ASSETS']))
        split=copy.deepcopy(known);split.update(ISIN='',SEDOL='',TICKER='',NET_ASSETS='0.004',MARKET_VALUE='3223.07')
        known['NET_ASSETS']=str(Decimal(known['NET_ASSETS'])-Decimal('.004'))
        known['MARKET_VALUE']=str(Decimal(known['MARKET_VALUE'])-Decimal('3223.07'))
        rows.append(split);stream=io.StringIO();writer=csv.DictWriter(stream,fieldnames=fields);writer.writeheader();writer.writerows(rows)
        source=next(x for x in json.loads((ROOT/'scripts/exposure-etf-expansion.json').read_text())['instruments']if x['isin']=='IE00BMH5Y871')
        result=globalx_physical(text,source,dt.datetime(2026,11,6,tzinfo=UTC),holdings_fetch=lambda url:stream.getvalue().encode())
        self.assertEqual(len(result['holdings']['rows']),10)
        self.assertEqual(result['holdings']['unidentifiedOutsideTopTen'],{'count':1,'weightPct':.004})
        self.assertTrue(all(r['isin']for r in result['holdings']['rows']))

    def test_copper_management_style_after_distributions(self):
        text = (FIX/'copx.html').read_text()
        # A section may move without changing the explicitly labelled strategy.
        text = text.replace('Management Style', 'Distributions</div><div>Management Style')
        self.assertEqual(globalx_physical(text, share('IE0003Z9E2Y3'), NOW)['characteristics']['terPct'], .55)
        with self.assertRaises(ValueError):
            globalx_physical(text.replace('Physical - Full Replication - Passively Managed Index Tracking', 'Synthetic'), share('IE0003Z9E2Y3'), NOW)

    def test_copper_periods_are_cumulative_exact_share_nav(self):
        r = globalx_physical((FIX/'copx.html').read_text(), share('IE0003Z9E2Y3'), NOW)
        self.assertEqual(r['performance']['years'], {})
        self.assertEqual([o['value'] for o in r['performance']['observations']], [-11.1,10.38,45.94,18.14,163.01])
        self.assertEqual(r['performance']['asOf'], '2026-09-30')
        self.assertEqual(r['aum']['asOf'], '2026-10-09')
        self.assertAlmostEqual(sum(x['weightPct'] for x in r['countries']['rows']),100,delta=.2)
        self.assertEqual(len(r['holdings']['rows']),10)
        self.assertEqual(r['characteristics']['terPct'],.55)
        self.assertEqual(r['sectors']['asOf'],'2026-09-30')

    def test_copper_rejects_wrong_share_currency_stale_or_incomplete_exposure(self):
        text = (FIX/'copx.html').read_text();s=share('IE0003Z9E2Y3')
        for a,b in [('IE0003Z9E2Y3','IE00BM8R0J59'),('09 Oct 2026','09 Jan 2026'),('USD Accumulating','USD Distributing'),('97.6','17.6')]:
            with self.assertRaises(ValueError):globalx_physical(text.replace(a,b),s,NOW)
        with self.assertRaises(ValueError):globalx_physical(text,{**s,'currency':'EUR'},NOW)

    def test_jpm_uses_first_calendar_row_and_excludes_pre_launch_years(self):
        r=parse_jpm()
        self.assertEqual(r['performance']['years'],{'2024':8.08,'2025':12.35})
        self.assertEqual(r['aum']['amount'],1595900000)
        self.assertEqual(r['characteristics']['terPct'],.35)
        self.assertEqual(len(r['holdings']['rows']),10)
        self.assertAlmostEqual(sum(x['weightPct']for x in r['sectors']['rows']),100,delta=.2)
        self.assertNotIn('2023',r['performance']['years'])

    def test_jpm_rejects_changed_identity_currency_date_and_unfinished_calendar(self):
        for replacement in [('IE0003UVYC20','IE00OTHER001'),('currency USD','currency EUR'),('31 August 2026','31 January 2026'),('2025','2026'),('1 Class:', '2 Class:')]:
            with self.assertRaises(ValueError):parse_jpm(replacement)

    def test_vaneck_benchmark_change_footnote_does_not_hide_annual_fund_row(self):
        texts = {None:(FIX/'gdx-full.txt').read_text(),(0,185):(FIX/'gdx-left.txt').read_text(),(190,410):(FIX/'gdx-right.txt').read_text()}
        with patch('collect_vaneck_etf.pdf_text',side_effect=lambda b,crop=None:texts[crop]):
            r=parse_document(b'%PDF-fixture',share('IE00BQQP9F84'),NOW)
        self.assertEqual(r['performance']['years']['2025'],155.7)
        self.assertEqual(r['performance']['years']['2020'],23.1)
        self.assertNotEqual(r['performance']['years']['2025'],157.4) # benchmark

    def test_cumulative_refresh_is_validated_and_replaces_previous_periods(self):
        r=globalx_physical((FIX/'copx.html').read_text(),share('IE0003Z9E2Y3'),NOW)
        report={'checkedAt':NOW.isoformat(),'shares':[r]}
        first=merge_collection(report,{},{});s=copy.deepcopy(r)
        s['performance']['observations'][0]['value']=-10.5
        newer=merge_collection({**report,'shares':[s]},first,{})
        self.assertEqual(newer[s['isin']]['performance']['observations'][0]['value'],-10.5)
        self.assertEqual(newer[s['isin']]['performance']['months']['2026-09'],-10.5)
        s['performance']['observations'][0]['value']=-10
        with self.assertRaisesRegex(ValueError,'Monthly NAV correction'):
            merge_collection({**report,'shares':[s]},first,{})
        self.assertEqual(first[s['isin']]['performance']['months']['2026-09'],-11.1)
        for bad in [dict(value=float('nan')),dict(asOf='2027-01-01'),dict(label='')]:
            s=copy.deepcopy(r);s['performance']['observations'][0].update(bad)
            with self.assertRaises(ValueError):merge_collection({**report,'shares':[s]},first,{})
        s=copy.deepcopy(r);s['performance']['observations'].append(s['performance']['observations'][0])
        with self.assertRaises(ValueError):merge_collection({**report,'shares':[s]},first,{})

class JpmLivePresentation(unittest.TestCase):
    now = dt.datetime(2026, 11, 6, tzinfo=UTC)

    def raw(self, change=None):
        import gzip
        value = json.loads(gzip.decompress((FIX/'jpm-live-api.json.gz').read_bytes()))
        if change:
            change(value['fundData'])
        return json.dumps(value).encode()

    def live(self, raw=None):
        from jpm_live_presentation import parse_live
        return parse_live(self.raw() if raw is None else raw, share('IE0003UVYC20'), self.now)

    def collect(self, document=None, fetch=None):
        from jpm_live_presentation import collect
        return collect(share('IE0003UVYC20'), self.now,
                       document=document or parse_jpm,
                       fetch=fetch or (lambda *a, **kw: self.raw()))

    def test_fund_aum_is_not_share_class_assets_or_the_position_market_value_total(self):
        result = self.live()
        self.assertEqual(result['aum']['amount'], 1717570208)
        self.assertEqual(result['aum']['scope'], 'fund')
        self.assertEqual(result['aum']['currency'], 'USD')
        self.assertEqual(result['aum']['asOf'], '2026-11-05')
        self.assertEqual(result['aum']['sourceComponent'], 'fundData.aum.value')

    def test_top_ten_preserves_weights_identities_and_its_own_date(self):
        result = self.live()
        fund = json.loads(self.raw())['fundData']
        rows = result['holdings']['rows']
        self.assertEqual(len(rows), 10)
        self.assertFalse(result['holdings']['complete'])
        self.assertEqual(result['holdings']['asOf'], '2026-11-05')
        self.assertLess(sum(r['weightPct'] for r in rows), 20)
        for row, native in zip(rows, fund['dailyHoldings']['data']):
            self.assertEqual(row['isin'], native['securityIsin'])
            self.assertEqual(row['weightPct'], native['marketValuePercent'])
        result = self.live(self.raw(lambda f: f['aum'].update(date='2026-11-06')))
        self.assertEqual(result['aum']['asOf'], '2026-11-06')
        self.assertEqual(result['holdings']['asOf'], '2026-11-05')

    def test_rejects_wrong_share_class_currency_and_fund_state(self):
        for change in [
            lambda f: f['shareClass'].update(cusip='IE0000000000'),
            lambda f: f['shareClass'].update(distributingCode='ACC'),
            lambda f: f['shareClass'].update(currencyCode='EUR'),
            lambda f: f.update(isLiquidatedOrMergedAway=True),
        ]:
            with self.subTest(change=change), self.assertRaises(ValueError):
                self.live(self.raw(change))

    def test_top_ten_and_aum_do_not_require_a_complete_book(self):
        result = self.live(self.raw(lambda f: f.update(dailyHoldingsAll=None)))
        self.assertEqual(len(result['holdings']['rows']), 10)
        self.assertIn('aum', result)
        self.assertNotIn('collectionErrors', result)

    def test_bad_top_ten_preserves_it_and_still_renews_the_healthy_aum(self):
        old = merge_collection({'checkedAt':self.now.isoformat(),'shares':[self.collect()]}, {}, {})
        raw = self.raw(lambda f: f['dailyHoldings']['data'].pop())
        result = self.collect(fetch=lambda *a, **kw: raw)
        self.assertEqual(result['collectionErrors'][0]['field'], 'holdings-current-source')
        new = merge_collection({'checkedAt':'2026-11-07','shares':[result]}, old, {})
        self.assertEqual(new['IE0003UVYC20']['holdings'], old['IE0003UVYC20']['holdings'])
        self.assertEqual(new['IE0003UVYC20']['aum']['checkedAt'], '2026-11-07')
        duplicate = self.live(self.raw(lambda f: f['dailyHoldings']['data'].__setitem__(1, f['dailyHoldings']['data'][0])))
        self.assertNotIn('holdings', duplicate)
        self.assertIn('aum', duplicate)

    def test_rejects_invalid_aum_currency_numbers_and_future_observation(self):
        for change in [
            lambda f: f['aum'].update(value=True),
            lambda f: f['aum'].update(value=float('nan')),
            lambda f: f['aum'].update(value=0),
            lambda f: f['aum'].update(currencyCode='EUR'),
            lambda f: f.update(isDisplayAumInUsd=False),
            lambda f: f['aum'].update(date='2027-01-01'),
        ]:
            with self.subTest(change=change):
                result = self.live(self.raw(change))
                self.assertNotIn('aum', result)
                self.assertEqual(len(result['holdings']['rows']), 10)
                self.assertEqual(result['collectionErrors'][0]['field'], 'aum-current-source')

    def test_keeps_pdf_conventions_dates_and_proprietary_api_classifications_separate(self):
        result = self.collect()
        pdf = parse_jpm()
        for field in ['characteristics', 'performance', 'countries', 'sectors']:
            self.assertEqual(result[field], pdf[field])
        self.assertEqual(result['aum']['asOf'], '2026-11-05')
        self.assertEqual(result['sectors']['asOf'], '2026-08-31')
        self.assertEqual([a['fields'] for a in result['sourceAttempts'][-2:]], [['aum'], ['holdings']])

    def test_pdf_failure_does_not_renew_retained_pdf_financial_fields(self):
        def unavailable():
            raise OSError('document unavailable')
        old = merge_collection({'checkedAt':'2026-10-11','shares':[parse_jpm()]}, {}, {})
        result = self.collect(document=unavailable)
        self.assertTrue(result['exposureOnly'])
        self.assertEqual(len(result['collectionErrors']), 4)
        new = merge_collection({'checkedAt':self.now.isoformat(),'shares':[result]}, old, {})
        for field in ['characteristics', 'performance', 'countries', 'sectors']:
            self.assertEqual(new['IE0003UVYC20'][field], old['IE0003UVYC20'][field])
        self.assertEqual(new['IE0003UVYC20']['aum']['checkedAt'], '2026-11-06')

    def test_api_failure_retains_newer_values_and_their_original_proof_dates(self):
        old = merge_collection({'checkedAt':self.now.isoformat(),'shares':[self.collect()]}, {}, {})
        def unavailable(*args, **kwargs):
            raise OSError('API unavailable')
        result = self.collect(fetch=unavailable)
        self.assertEqual(len(result['collectionErrors']), 2)
        new = merge_collection({'checkedAt':'2026-11-07','shares':[result]}, old, {})
        for field in ['aum', 'holdings']:
            self.assertEqual(new['IE0003UVYC20'][field], old['IE0003UVYC20'][field])

    def test_real_source_check_without_change_never_moves_the_observation_period(self):
        old = merge_collection({'checkedAt':self.now.isoformat(),'shares':[self.collect()]}, {}, {})
        new = merge_collection({'checkedAt':'2026-11-07','shares':[self.collect()]}, old, {})
        for field in ['aum', 'holdings']:
            self.assertEqual(new['IE0003UVYC20'][field]['checkedAt'], '2026-11-07')
            self.assertEqual(new['IE0003UVYC20'][field]['asOf'], '2026-11-05')

    def test_out_of_order_aum_does_not_refresh_the_newer_value(self):
        old = merge_collection({'checkedAt':self.now.isoformat(),'shares':[self.collect()]}, {}, {})
        raw = self.raw(lambda f: f['aum'].update(date='2026-11-04'))
        result = self.collect(fetch=lambda *a, **kw: raw)
        new = merge_collection({'checkedAt':'2026-11-07','shares':[result]}, old, {})
        self.assertEqual(new['IE0003UVYC20']['aum'], old['IE0003UVYC20']['aum'])

    def test_empty_response_and_both_sources_unavailable_are_not_success(self):
        with self.assertRaises(ValueError):
            self.live(b'')
        def unavailable(*args, **kwargs):
            raise OSError('network failure')
        with self.assertRaisesRegex(ValueError, 'JPM document:.*current API:'):
            self.collect(document=unavailable, fetch=unavailable)


if __name__ == '__main__': unittest.main()
