import json
import unittest
from pathlib import Path
from company_share_notes import schneider_shares,lvmh_shares,lvmh_investments
FIX=json.loads((Path(__file__).parent/'source-snapshots/company-share-notes.json').read_text())
class ShareNotes(unittest.TestCase):
    def test_reported_counts(self):
        self.assertEqual(schneider_shares(FIX['schneider']),{'2025-12-31':570516000,'2024-12-31':569085000})
        self.assertEqual(lvmh_shares(FIX['lvmh'],[2025,2024,2023])['2025-12-31'],497976118)
    def test_wrong_units_duplicate_and_inconsistent_dilution(self):
        for text in [FIX['schneider'].replace('thousands','millions'),FIX['schneider']*2,FIX['schneider'].replace('570,516','571,516'),FIX['schneider'].replace('2024','2022')]:
            with self.assertRaises(ValueError):schneider_shares(text)
        with self.assertRaises(ValueError):lvmh_shares(FIX['lvmh'],[2025,2024])
    def test_cash_investments_exclude_disposals(self):
        text='Operating investments comprise the following elements for the fiscal years presented:\n(EUR millions) Notes 2025 2024 2023\nPurchase of intangible assets 3 (819) (837) (1,000)\nNet cash used in purchases of fixed assets (4,595) (5,519) (7,536)\nNet cash from fixed asset disposals 38 21 136\n15.4 Interim and final dividends'
        self.assertEqual(lvmh_investments(text,[2025,2024,2023])['2025-12-31'],4595000000)
        with self.assertRaises(ValueError):lvmh_investments(text,[2024,2023,2022])
        with self.assertRaises(ValueError):lvmh_investments(text.replace('(4,595)','4,595'),[2025,2024,2023])
