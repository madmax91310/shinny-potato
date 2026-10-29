"""Real streamed issuer responses: financial scope must not depend on wire order."""
import datetime as dt
import gzip
import json
from pathlib import Path
import unittest
from bs4 import BeautifulSoup
from collect_public_issuer import Page, globalx
from collect_priority_issuer_etf import silver
from globalx_sections import fact_sections
from issuer_documents import proof

FIX = Path(__file__).parent / 'fixtures/official-documents/globalx-streamed'
CONFIG = json.loads((Path(__file__).parent/'additional-etf-sources.json').read_text())['instruments']
NOW = dt.datetime(2026, 10, 28, tzinfo=dt.timezone.utc)

class StreamedFacts(unittest.TestCase):
    def response(self, name):
        return gzip.open(FIX/(name+'.html.gz'), 'rt').read()

    def test_actual_responses_and_raw_provenance(self):
        for name, isin, parser, fee, aum in [
            ('qyld','IE00BM8R0J59',globalx,.45,945759479.10),
            ('silv','IE000UL6CLP7',silver,.65,1209472724.27)]:
            with self.subTest(isin=isin):
                text = self.response(name)
                result = parser(text, next(s for s in CONFIG if s['isin']==isin), NOW)
                self.assertEqual(result['characteristics']['terPct'], fee)
                self.assertEqual(result['aum']['amount'], aum)
                self.assertEqual(result['aum']['asOf'], '2026-10-27')
                self.assertEqual(result['aum']['sha256'], proof(text.encode()))
                if name == 'silv':
                    self.assertEqual(len(result['holdings']['rows']),10)
                    self.assertLess(sum(r['weightPct'] for r in result['holdings']['rows']),100)
                    self.assertEqual(result['countries']['asOf'],'2026-09-30')
                    self.assertFalse(result['performance']['years'])
                else:
                    self.assertNotIn('holdings', result)

    def test_independent_sections_not_transport_order_or_trading_date(self):
        facts, trading = fact_sections(self.response('qyld'), Page)
        def section(tokens):
            return '<div><h2>'+tokens[0]+'</h2>'+''.join('<p>'+t+'</p>' for t in tokens[1:])+'</div>'
        a, b = section(facts), section(trading + ['As of 28 Oct 2026'])
        share = next(s for s in CONFIG if s['isin']=='IE00BM8R0J59')
        for text in (a+b,b+a):
            result = globalx(text, share, NOW)
            self.assertEqual(result['aum']['asOf'],'2026-10-27')
        self.assertEqual(fact_sections(a+b,Page),fact_sections(b+a,Page))

    def test_truncated_section_cannot_borrow_footer_or_other_fund(self):
        text=self.response('qyld')
        for old in ('Total Expense Ratio','Primary ISIN','Fund AUM'):
            with self.subTest(old=old), self.assertRaises(ValueError):
                fact_sections(text.replace(old,'Missing field')+'<footer>'+old+'</footer>',Page)

    def test_conflicting_sections_rejected_before_expected_isin_filter(self):
        text=self.response('qyld')
        _, trading=fact_sections(text,Page)
        other='<div><h2>Trading Details</h2>'+''.join('<p>'+t.replace('IE00BM8R0J59','IE000UL6CLP7')+'</p>' for t in trading[1:])+'</div>'
        with self.assertRaises(ValueError): fact_sections(text+other,Page)

    def test_old_flat_reader_and_structured_empty_response_distinct(self):
        self.assertIsNone(fact_sections('<p>Key Information</p>',Page))
        with self.assertRaises(ValueError):
            fact_sections('<div><h2>Key Information</h2></div>',Page)

if __name__ == '__main__': unittest.main()
