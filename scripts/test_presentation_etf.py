"""Guards for exact shares, cumulative versus calendar returns, and issuer layouts."""
import copy
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

if __name__ == '__main__': unittest.main()
