"""Real issuer tables: fund/index scope, bond identities and widget renewal."""
import copy
import datetime as dt
import json
import pathlib
import unittest
from unittest.mock import patch
from data_automation import UTC
from collect_bnp_etf import parse as bnp
from collect_etf_holdings import parse_holdings
from collect_vaneck_allocations import discover, parse as sectors
from collect_vaneck_etf import parse_document, complement

ROOT = pathlib.Path(__file__).resolve().parents[1]
FIX = ROOT / 'scripts/fixtures/official-documents'
NOW = dt.datetime(2026, 10, 7, tzinfo=UTC)
CONFIG = json.loads((ROOT/'scripts/additional-etf-sources.json').read_text())['instruments']


class FieldCompletion(unittest.TestCase):
    def test_bnp_portfolio_and_benchmark_remain_distinct(self):
        for isin, filename, basis, first in [
            ('FR0011550185','bnp-easy-sp500','index',8.09),
            ('FR0011550193','bnp-easy-stoxx','index',4.18),
            ('IE000QDFFK00','bnp-easy-ii-nasdaq','fund',8.52)]:
            share=next(s for s in CONFIG if s['isin']==isin)
            result=bnp((FIX/(filename+'.txt')).read_text(),share,NOW,'2026-08-31')
            self.assertEqual(result['holdings']['basis'],basis)
            self.assertEqual(result['sectors']['basis'],basis)
            self.assertEqual(result['holdings']['rows'][0]['weightPct'],first)
            self.assertEqual('countries' in result,isin=='FR0011550193')

    def test_bad_bnp_exposures_preserve_independent_fields_and_signal_failure(self):
        share=next(s for s in CONFIG if s['isin']=='IE000QDFFK00')
        text=(FIX/'bnp-easy-ii-nasdaq.txt').read_text().replace('58.52','18.52')
        result=bnp(text,share,NOW,'2026-08-31')
        self.assertIn('performance',result);self.assertIn('aum',result)
        self.assertNotIn('sectors',result);self.assertTrue(result['collectionErrors'])

    def test_bond_positions_are_individual_issues_and_weights_not_normalised(self):
        body=json.loads((FIX/'blackrock-em-bond-holdings.json').read_text())
        share={'productId':251824,'currency':'USD','holdingsAssetClass':'Fixed Income'}
        holdings,countries=parse_holdings(body,share,NOW)
        self.assertEqual(len(holdings['rows']),10)
        argentina=[r for r in holdings['rows'] if 'ARGENTINA' in r['name']]
        self.assertGreater(len(argentina),1)
        self.assertEqual(len({r['name'] for r in argentina}),len(argentina))
        self.assertEqual(holdings['rows'][0]['weightPct'],1.15515)
        self.assertAlmostEqual(sum(r['weightPct'] for r in countries['rows']),100,places=3)

    def test_unidentified_bond_pool_requires_coupon_and_maturity(self):
        body=json.loads((FIX/'blackrock-em-bond-holdings.json').read_text())
        points=body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
        n=len(points['isin']['value']);points['isin']['value'][0]=None
        points['couponRate']={'value':[2.0]*n};points['maturityDate']={'value':[20510701]*n}
        share={'productId':251824,'currency':'USD','holdingsAssetClass':'Fixed Income'}
        h,_=parse_holdings(body,share,NOW)
        self.assertNotIn('isin',h['rows'][0]);self.assertEqual(h['rows'][0]['maturityDate'],'2051-07-01')
        points['maturityDate']['value'][0]=None
        with self.assertRaises(ValueError):parse_holdings(body,share,NOW)

    def test_vaneck_widget_identity_dates_complete_weights_and_index_exclusion(self):
        share=next(s for s in CONFIG if s.get('ticker') == 'TDIV')
        body=json.loads((FIX/'vaneck-tdiv-sectors.json').read_text())
        r=sectors(json.dumps(body).encode(),share,'official-api',NOW)
        self.assertEqual(r['basis'],'fund');self.assertEqual(r['asOf'],'2026-09-30')
        for defect in ['ticker','date','weight']:
            bad=copy.deepcopy(body)
            if defect=='ticker':bad['data']['Ticker']='OTHER'
            if defect=='date':bad['data']['Holdings'][0]['AsOfDate']='09/29/26'
            if defect=='weight':bad['data']['Holdings'].pop(0)
            with self.subTest(defect=defect),self.assertRaises(ValueError):
                sectors(json.dumps(bad).encode(),share,'official-api',NOW)
        body['data']['Title']='Index Sector Weightings (%)'
        self.assertIsNone(sectors(json.dumps(body).encode(),share,'official-api',NOW))

    def test_discovery_renews_widget_ids_and_excludes_index_section(self):
        share=next(s for s in CONFIG if s.get('ticker') == 'TDIV')
        def page(block):return f'''<span data-value="NL0011683594"></span>
            <ve-fundticker>TDIV</ve-fundticker><ve-country>uk</ve-country><ve-language>en</ve-language>
            <section id="portfolio"><ve-holdingsweightingschartblock data-blockid="{block}" data-pageid="123"></ve-holdingsweightingschartblock></section>
            <section id="index"><ve-holdingsweightingschartblock data-blockid="999" data-pageid="123"></ve-holdingsweightingschartblock></section>'''.encode()
        self.assertIn('blockid=456',discover(page(456),share)[0])
        self.assertIn('blockid=789',discover(page(789),share)[0])
        self.assertEqual(len(discover(page(456),share)),1)
        with self.assertRaises(ValueError):discover(page(456).replace(b'NL0011683594',b'NL0009690239'),share)

    def test_vaneck_calendar_integer_returns_and_dutch_tax_convention(self):
        for code,isin,year,value in [('tdiv','NL0011683594','2024',16.0),('tret','NL0009690239','2023',9.0)]:
            share=next(s for s in CONFIG if s['isin']==isin)
            def text(body,crop=None):
                if crop and crop[0]!=0:return ''  # Right crop omits the heading; use the qualified full table.
                suffix='facts' if crop is None else 'country'
                return (FIX/f'vaneck-{code}-{suffix}.txt').read_text()
            with patch('collect_vaneck_etf.pdf_text',side_effect=text):result=parse_document(b'fixture',share,NOW)
            self.assertEqual(result['performance']['years'][year],value)
            self.assertIn('gross of Dutch withholding tax',result['performance']['method'])
            if code=='tdiv':self.assertNotIn('2016',result['performance']['years'])

    def test_failed_vaneck_complement_does_not_discard_pdf_fields(self):
        share=next(s for s in CONFIG if s.get('ticker') == 'TDIV')
        def fail(url):raise TimeoutError('unavailable')
        result=complement({'aum':{'amount':42},'unavailable':[]},share,NOW,fail)
        self.assertEqual(result['aum']['amount'],42);self.assertTrue(result['collectionErrors'])


if __name__=='__main__':unittest.main()
