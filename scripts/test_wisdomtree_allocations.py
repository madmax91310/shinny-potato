"""Reject partial or ambiguous allocation tables instead of inventing residuals."""
from pathlib import Path
import unittest
from unittest.mock import patch
from collect_wisdomtree_allocations import allocations, sector_rows, table_rows
F=Path(__file__).parent/'fixtures/official-documents/wisdomtree-columns'
class WisdomTreeAllocations(unittest.TestCase):
    def parse(self,name):
        def text(body,crop):return (F/f'{name}-{crop[0]}.txt').read_text()
        with patch('collect_wisdomtree_allocations.pdf_text',side_effect=text):
            return allocations(b'fixture','2026-08-31','https://dataspanapi.wisdomtree.com','digest')
    def test_published_columns(self):
        for name in ['defence','div','quantum']:
            r=self.parse(name)
            self.assertEqual(len(r['holdings']['rows']),10)
            self.assertAlmostEqual(sum(x['weightPct'] for x in r['sectors']['rows']),100,delta=.1)
            self.assertEqual(r['sectors']['basis'],'fund')
            self.assertEqual(r['holdings']['asOf'],'2026-08-31')
        self.assertIn('countries',self.parse('defence'))
        self.assertNotIn('countries',self.parse('div'))
        self.assertNotIn('countries',self.parse('quantum'))
    def test_ambiguous_and_incomplete_labels(self):
        for text in ['Consumer… 100.00%','Industrials 30.00%','Unknown 100.00%','Industrials 50.00% Industrials 50.00%']:
            with self.assertRaises(ValueError):sector_rows(text)
        with self.assertRaises(ValueError):table_rows('An incomplete holding name')
        with patch('collect_wisdomtree_allocations.pdf_text',return_value='No allocation headings'):
            with self.assertRaises(ValueError):allocations(b'x','2026-08-31','url','hash')
if __name__=='__main__':unittest.main()
