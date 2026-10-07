import datetime as dt
import json
from pathlib import Path
import unittest
from collect_bnp_etf import discover, parse, collect_one
from apply_etf_collection import merge_collection

ROOT = Path(__file__).resolve().parents[1]
NOW = dt.datetime(2026, 10, 7, tzinfo=dt.timezone.utc)
SHARES = [s for s in json.loads((ROOT / 'scripts/additional-etf-sources.json').read_text())['instruments'] if s.get('parser') == 'bnp-document-mirror']
FILES = ['easy-sp500', 'easy-stoxx', 'easy-ii-nasdaq']


class BnpDocuments(unittest.TestCase):
    def text(self, i=0):
        return (ROOT / f'scripts/fixtures/official-documents/bnp-{FILES[i]}.txt').read_text()

    def page(self, share, dates=('2026-08-31',)):
        return (share['isin'] + ' id_' + share['mirrorCode'] + ''.join(
            f'<a href="https://dokumenty.analizy.pl/pobierz/etf/{share["mirrorCode"]}/KA/{d}">PDF</a>' for d in dates)).encode()

    def test_exact_fund_rows_not_benchmark_or_rolling(self):
        expected = [(0.14, 8377540000, 3.3), (0.19, 1366990000, 20.48), (0.14, 3134760000, 20.72)]
        for i, (fee, aum, value) in enumerate(expected):
            with self.subTest(isin=SHARES[i]['isin']):
                r = parse(self.text(i), SHARES[i], NOW, '2026-08-31')
                self.assertEqual(r['characteristics']['terPct'], fee)
                self.assertAlmostEqual(r['aum']['amount'], aum, places=3)
                self.assertEqual(r['performance']['years']['2025'], value)
                self.assertNotIn('2026', r['performance']['years'])
                self.assertEqual(r['aum']['scope'], 'fund')
                self.assertNotIn('countries', r)
        r = parse(self.text(2), SHARES[2], NOW, '2026-08-31')
        self.assertEqual(list(r['performance']['years']), ['2023', '2024', '2025'])

    def test_discovery_renews_without_hardcoded_pdf(self):
        url, stamp = discover(self.page(SHARES[0], ('2026-08-31', '2026-09-30')), SHARES[0], NOW)
        self.assertTrue(url.endswith('/2026-09-30')); self.assertEqual(stamp, '2026-09-30')

    def test_discovery_rejects_wrong_share_and_host(self):
        for page in [self.page(SHARES[1]), self.page(SHARES[0]).replace(b'dokumenty.analizy.pl', b'example.com')]:
            with self.assertRaises(ValueError): discover(page, SHARES[0], NOW)

    def test_latest_advertised_file_must_not_be_stale_or_future(self):
        for stamp in ['2026-01-31', '2026-10-31']:
            with self.assertRaises(ValueError): discover(self.page(SHARES[0], (stamp,)), SHARES[0], NOW)

    def test_wrong_isin_currency_identity_and_date_rejected(self):
        for old, new in [('FR0011550185','FR0011550177'), ('Fund Factsheet EUR C','Fund Factsheet USD C'),
                         ('BNP PARIBAS EASY S&P 500 UCITS ETF','ANOTHER FUND'), ('DASHBOARD AS AT 31.08.2026','DASHBOARD AS AT 30.09.2026')]:
            with self.subTest(old=old), self.assertRaises(ValueError):
                parse(self.text().replace(old,new), SHARES[0], NOW, '2026-08-31')

    def test_wrong_nasdaq_benchmark_and_distribution_rejected(self):
        for old, new in [('NASDAQ-100 Notional Net Total','NASDAQ-100 Price'), ('Accumulation','Distribution')]:
            with self.assertRaises(ValueError): parse(self.text(2).replace(old,new), SHARES[2], NOW, '2026-08-31')

    def test_missing_duplicate_unfinished_and_invalid_calendars_rejected(self):
        for old, new in [('Calendar Performance at','Rolling Performance at'), ('2025          2024','2026          2024'),
                         ('2025          2024','2025          2025'), ('3.30','-100.00')]:
            with self.subTest(old=old), self.assertRaises(ValueError): parse(self.text().replace(old,new), SHARES[0], NOW, '2026-08-31')

    def test_mirror_provenance_and_checksum_on_every_field(self):
        import collect_bnp_etf
        from unittest.mock import patch
        share=SHARES[0]
        def fetch(url): return self.page(share) if url == share['discoveryUrl'] else b'%PDF-fake-test'
        with patch.object(collect_bnp_etf, 'pdf_text', return_value=self.text()):
            r=collect_one(share,NOW,fetch)
        for field in ['characteristics','aum','performance']:
            self.assertEqual(r[field]['documentHost'],'Analizy')
            self.assertEqual(r[field]['publisher'],'BNP Paribas Asset Management')
            self.assertEqual(len(r[field]['sha256']),64)
            self.assertTrue(r[field]['sourceUrl'].startswith('https://dokumenty.analizy.pl/'))

    def test_invalid_collection_preserves_previous_and_newer_aum(self):
        from refresh_additional_etf import refresh
        old={'FR0011550185':{'currency':'EUR','productId':'FR0011550185','sourceUrl':'old','aum':{'asOf':'2026-09-30','amount':42}}}
        def failed(share, now): raise ValueError('wrong ISIN')
        new,report=refresh({'instruments':[SHARES[0]]},old,{},NOW,failed)
        self.assertEqual(new,old); self.assertEqual(report['shares'][0]['status'],'failed')
        r=parse(self.text(),SHARES[0],NOW,'2026-08-31');r['sourceUrl']='mirror'
        new=merge_collection({'checkedAt':NOW.isoformat(),'shares':[r]},old,{})
        self.assertEqual(new['FR0011550185']['aum'],old['FR0011550185']['aum'])


if __name__ == '__main__': unittest.main()
