"""Guards for the remaining ETF fee/AUM sources and their exact return conventions."""
import datetime as dt
import json
from pathlib import Path
import unittest
from unittest.mock import patch
from collect_priority_issuer_etf import silver, avantis
from collect_public_issuer import collect_one
from data_automation import UTC

FIX = Path(__file__).parent / 'fixtures/official-documents/priority-issuers'
CONFIG = json.loads((Path(__file__).parent / 'additional-etf-sources.json').read_text())['instruments']
NOW = dt.datetime(2026, 10, 13, tzinfo=UTC)
def share(isin): return next(s for s in CONFIG if s['isin'] == isin)

class RemainingIssuerSources(unittest.TestCase):
    def test_silver_sector_publication_and_invalid_table_preserve_other_fields(self):
        text = (FIX / 'silv.html').read_text(); config = share('IE000UL6CLP7')
        table = '<h2>Sector Breakdown</h2><p>As of 30 Sep 2026</p><table><tr><th></th><th>Sector</th><th>Weight (%)</th></tr><tr><td></td><td>Materials</td><td>100</td></tr></table>'
        absent = silver(text, config, NOW)
        self.assertEqual(absent['fieldQualification']['sectors']['status'], 'not-published')
        result = silver(text+table, config, NOW)
        self.assertEqual(result['sectors']['rows'], [{'name':'Materials','weightPct':100}])
        self.assertEqual(result['fieldQualification']['sectors']['status'], 'qualified')
        for invalid in [table.replace('100','70'), table.replace('2026','2027'), table+table]:
            with self.subTest(invalid=invalid):
                result = silver(text+invalid, config, NOW)
                self.assertNotIn('sectors', result)
                self.assertIn('countries', result)
                self.assertEqual(result['fieldQualification']['sectors']['status'], 'unqualified')
                self.assertEqual(result['collectionErrors'][0]['field'], 'sectors')
        result = silver(text+table.replace('Sector Breakdown','Reference Index Sector Breakdown'), config, NOW)
        self.assertNotIn('sectors', result)

    def test_avantis_partial_country_evidence_is_never_a_complete_allocation(self):
        from collect_priority_issuer_etf import avantis_country_qualification
        text = (FIX / 'avantis.txt').read_text()
        result = avantis_country_qualification(text, '2026-09-30', 'https://issuer.example/facts.pdf', 'digest', NOW)
        self.assertEqual(result['status'], 'not-published')
        self.assertEqual(result['evidence']['coveragePct'], 88.72)
        self.assertEqual(len(result['evidence']['rows']), 5)
        for altered in [text.replace('Top 5 Countries %','Country Allocation %'), text.replace('67.44','167.44'), text.replace('Australia','Japan')]:
            self.assertEqual(avantis_country_qualification(altered, '2026-09-30', 'url', 'digest', NOW)['status'], 'unqualified')

    def test_silver_exact_identity_currency_and_rolling_returns(self):
        text = (FIX / 'silv.html').read_text(); config = share('IE000UL6CLP7')
        result = silver(text, config, NOW)
        self.assertEqual(result['characteristics']['terPct'], .65)
        self.assertEqual(result['aum']['scope'], 'fund')
        self.assertEqual(result['aum']['amount'], 1436170893.22)
        self.assertEqual(result['aum']['asOf'], '2026-10-12')
        self.assertEqual(result['performance']['years'], {})
        self.assertEqual(result['performance']['observations'][0]['asOf'], '2026-09-30')
        self.assertEqual(result['performance']['observations'][-1]['value'], 163.02)
        for old,new in [('IE000UL6CLP7','IE000OTHER00'),('USD Accumulating','USD Distributing'),
                        ('SILV','COPX'),('$1,436,170,893.22','€1,436,170,893.22'),
                        ('12 Oct 2026','12 Oct 2027'),('2026-09-30','2026-01-31')]:
            with self.subTest(old=old), self.assertRaises(ValueError): silver(text.replace(old,new),config,NOW)
        self.assertEqual(result['countries']['asOf'], '2026-09-30')
        self.assertEqual(result['holdings']['rows'][0]['name'], 'WHEATON PRECIOUS METALS CORP')
        self.assertFalse(any('TREAS' in row['name'] for row in result['holdings']['rows']))

    def test_avantis_rounded_fund_assets_and_no_annualised_inception_substitution(self):
        text = (FIX / 'avantis.txt').read_text(); facts = (FIX / 'avantis-facts.txt').read_text()
        def parse(full=text, right=facts):
            with patch('collect_priority_issuer_etf.pdf_text', side_effect=[full, right]):
                return avantis(b'%PDF-fixture', share('IE0003R87OG3'), NOW)
        result = parse()
        self.assertEqual(result['characteristics']['terPct'], .39)
        self.assertEqual(result['aum']['amount'], 1700000000)
        self.assertIn('Rounded', result['aum']['note'])
        self.assertEqual(result['performance']['years'], {})
        self.assertEqual([o['label'] for o in result['performance']['observations']], ['Trimestre','Depuis janvier','1 an'])
        self.assertEqual([o['value'] for o in result['performance']['observations']], [-.88,18.31,23.05])
        for old,new in [('IE0003R87OG3','IE000OTHER00'),('USD - Accumulating','USD - Distributing'),
                        ('30/09/2026','30/09/2027'),('reinvestment of dividends and capital gains','price only')]:
            with self.subTest(old=old), self.assertRaises(ValueError): parse(text.replace(old,new),facts.replace(old,new))
        with self.assertRaises(ValueError): parse(text,facts.replace('$1.7B','€1.7B'))
        with self.assertRaises(ValueError): parse(text,facts.replace('USD','EUR'))
        with self.assertRaises(ValueError): parse(text,facts.replace('0.39%','9.39%'))

    def test_avantis_year_end_flows_into_calendar(self):
        text = (FIX / 'avantis.txt').read_text().replace('30/09/2026', '31/12/2026').replace('23.05', '18.31')
        facts = (FIX / 'avantis-facts.txt').read_text().replace('30/09/2026', '31/12/2026')
        with patch('collect_priority_issuer_etf.pdf_text', side_effect=[text, facts]):
            result = avantis(b'%PDF-year-end-fixture', share('IE0003R87OG3'), dt.datetime(2027,1,15,tzinfo=UTC))
        self.assertEqual(result['performance']['years'], {'2026':18.31})
        self.assertEqual(result['performance']['yearEvidence']['2026']['asOf'], '2026-12-31')

    def test_qyld_incomplete_stream_retries_but_wrong_identity_does_not(self):
        text = (FIX.parent / 'new-issuers/globalx.html').read_text()
        config = share('IE00BM8R0J59')
        duplicate = text.replace('<p>Primary ISIN</p>', '<p>Primary ISIN</p><p>IE00BM8R0J59</p><p>Primary ISIN</p>')
        with patch('collect_public_issuer.public_page',return_value=duplicate):
            self.assertEqual(collect_one(config,NOW)['characteristics']['terPct'],.45)
        conflicting = duplicate.replace('<p>IE00BM8R0J59</p><p>Primary ISIN</p>', '<p>IE000OTHER00</p><p>Primary ISIN</p>',1)
        with patch('collect_public_issuer.public_page',return_value=conflicting):
            with self.assertRaises(ValueError): collect_one(config,NOW)
        with patch('collect_public_issuer.public_page', side_effect=[text.replace('Primary ISIN','Missing ISIN'),text]) as fetch:
            result = collect_one(config, NOW)
            self.assertEqual(fetch.call_count,2)
            self.assertEqual(result['sourceAttempts'][0]['reason'],'Incomplete Global X public HTML: primary ISIN missing')
            self.assertNotIn('performance',result)
        with patch('collect_public_issuer.public_page',return_value=text.replace(config['isin'],'IE000OTHER00')) as fetch:
            with self.assertRaises(ValueError): collect_one(config,NOW)
            self.assertEqual(fetch.call_count,1)
        with patch('collect_public_issuer.public_page',return_value=text.replace('Primary ISIN','Missing ISIN')):
            with self.assertRaises(ValueError): collect_one(config,NOW)


class SilverResilience(unittest.TestCase):
    def test_decorative_heading_is_not_a_required_data_boundary(self):
        text = (FIX / 'silv.html').read_text()
        original = silver(text, share('IE000UL6CLP7'), NOW)
        changed = silver(text.replace('Regulatory', 'Documents'), share('IE000UL6CLP7'), NOW)
        self.assertEqual(original['aum']['amount'], changed['aum']['amount'])
        self.assertEqual(original['aum']['asOf'], changed['aum']['asOf'])
        self.assertEqual(original['performance']['observations'], changed['performance']['observations'])

    def test_incomplete_html_retries_once_but_wrong_identity_does_not(self):
        from collect_priority_issuer_etf import collect_one as priority
        text = (FIX / 'silv.html').read_text(); config = share('IE000UL6CLP7')
        with patch('collect_priority_issuer_etf.public_page', side_effect=[text.replace('Primary ISIN', 'Missing'), text]) as fetch:
            self.assertEqual(priority(config, NOW)['aum']['amount'], 1436170893.22)
            self.assertEqual(fetch.call_count, 2)
        with patch('collect_priority_issuer_etf.public_page', return_value=text.replace('Primary ISIN', 'Missing')) as fetch:
            with self.assertRaises(ValueError): priority(config, NOW)
            self.assertEqual(fetch.call_count, 2)
        with patch('collect_priority_issuer_etf.public_page', return_value=text.replace(config['isin'], 'IE000OTHER00')) as fetch:
            with self.assertRaises(ValueError): priority(config, NOW)
            self.assertEqual(fetch.call_count, 1)


class TargetedCompositions(unittest.TestCase):
    def test_silver_rejects_missing_country_table_and_future_holdings(self):
        text = (FIX / 'silv.html').read_text(); config = share('IE000UL6CLP7')
        for old,new in [('Country Breakdown', 'No countries'), ('As of 13 Oct 2026', 'As of 13 Oct 2027'), ('<td>59.3</td>', '<td>20.0</td>')]:
            with self.subTest(old=old), self.assertRaises(ValueError):
                silver(text.replace(old,new),config,NOW)

    def test_avantis_fund_column_and_truncation(self):
        from collect_priority_issuer_etf import avantis_composition
        text = (FIX / 'avantis.txt').read_text()
        def parse(value): return avantis_composition(value, '2026-09-30', 'official', 'sha')
        result = parse(text)
        self.assertEqual(len(result['sectors']['rows']),11)
        self.assertEqual(result['sectors']['rows'][0]['weightPct'],18.85)
        self.assertEqual(len(result['holdings']['rows']),10)
        self.assertEqual(result['holdings']['rows'][0]['name'],"Macy's Inc")
        self.assertNotIn('countries',result) # Only five countries are published.
        for old,new in [('Consumer Discretionary','Missing sector'),("Macy's Inc",'Top Ten Holdings Total'),('5.76','9.99'),('18.85','8.83')]:
            with self.subTest(old=old), self.assertRaises(ValueError): parse(text.replace(old,new))

if __name__ == '__main__': unittest.main()
