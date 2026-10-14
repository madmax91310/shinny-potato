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
