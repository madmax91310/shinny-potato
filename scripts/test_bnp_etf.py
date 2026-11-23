import datetime as dt
import json
from pathlib import Path
import unittest
from unittest.mock import patch
from collect_bnp_etf import discover, parse, collect_one
from apply_etf_collection import merge_collection

ROOT = Path(__file__).resolve().parents[1]
NOW = dt.datetime(2026, 10, 7, tzinfo=dt.timezone.utc)
SHARES = [s for s in json.loads((ROOT / 'scripts/additional-etf-sources.json').read_text())['instruments'] if s.get('parser') == 'bnp-document']
FILES = ['easy-sp500', 'easy-stoxx', 'easy-ii-nasdaq']


class BnpDocuments(unittest.TestCase):
    def text(self, i=0):
        return (ROOT / f'scripts/fixtures/official-documents/bnp-{FILES[i]}.txt').read_text()

    def country(self, share):
        return share['discoveryUrl'].split('/')[-2]

    def document_url(self, version):
        return f'https://docfinder.bnpparibas-am.com/api/files/11111111-2222-3333-4444-555555555555/{version}'

    def page(self, share, dates=(('2026-08-31', '2026-09-04'),), *, product_date=None, **overrides):
        country = self.country(share)
        doc_type = 'DOC_FACTSHEET_B2B' if share['layout'] == 'easy-ii' else 'DOC_FACTSHEET'
        docs = [
            {'doc_type': doc_type, 'language': 'ENG', 'country': country, 'format': 'pdf',
             'reference_date': reference, 'publication_date': publication,
             'url': self.document_url(version), **overrides}
            for version, (reference, publication) in enumerate(dates, start=1)
        ]
        return json.dumps({'fundshare_selection': {'isin': share['isin'], 'currency': share['currency']},
                           'reference_date': product_date,
                           'publications': {'ENG': {'documents': docs}}}).encode()

    def test_exact_fund_rows_not_benchmark_or_rolling(self):
        expected = [(0.14, 8377540000, 3.3), (0.19, 1366990000, 20.48), (0.14, 3134760000, 20.72)]
        for i, (fee, aum, value) in enumerate(expected):
            with self.subTest(isin=SHARES[i]['isin']):
                r = parse(self.text(i), SHARES[i], NOW, '2026-08-31')
                self.assertEqual(r['characteristics']['terPct'], fee)
                self.assertEqual(r['characteristics']['index'],SHARES[i]['expectedIndex'])
                self.assertEqual(r['characteristics']['distribution'],'Capitalisation')
                self.assertAlmostEqual(r['aum']['amount'], aum, places=3)
                self.assertEqual(r['performance']['years']['2025'], value)
                self.assertNotIn('2026', r['performance']['years'])
                self.assertEqual(r['aum']['scope'], 'fund')
                self.assertEqual('countries' in r, i == 1)
        r = parse(self.text(2), SHARES[2], NOW, '2026-08-31')
        self.assertEqual(list(r['performance']['years']), ['2023', '2024', '2025'])

    def test_discovery_renews_without_hardcoded_pdf(self):
        share = SHARES[0]
        page = self.page(share, (('2026-08-31', '2026-09-04'), ('2026-09-30', '2026-10-06')))
        url, reference, publication, expected = discover(page, share, NOW, self.country(share))
        self.assertEqual((url, reference, publication, expected),
                         (self.document_url(2), '2026-09-30', '2026-10-06', '2026-09-30'))

    def test_discovery_rejects_wrong_share_document_or_host(self):
        share = SHARES[0]
        for page in (self.page(SHARES[1]), self.page(share, doc_type='DOC_KID_PRIIPS'),
                     self.page(share, url=self.document_url(1).replace('docfinder.bnpparibas-am.com', 'example.com'))):
            with self.subTest(page=page), self.assertRaises(ValueError):
                discover(page, share, NOW, self.country(share))

    def test_latest_advertised_file_must_not_be_stale_future_or_ambiguous(self):
        share = SHARES[0]
        valid = ('2026-09-30', '2026-10-06')
        for dates in ((('2026-01-31', '2026-02-05'),), (valid, ('2026-10-31', '2026-11-04')),
                      (valid, ('2026-09-30', '2026-10-08')), (valid, valid)):
            with self.subTest(dates=dates), self.assertRaises(ValueError):
                discover(self.page(share, dates), share, NOW, self.country(share))

    def test_october_official_factsheets_use_the_observation_date(self):
        now = dt.datetime(2026, 11, 22, tzinfo=dt.timezone.utc)
        expected = [
            ('2026-10-30', '2026-11-07', 9_092_430_000, 0.14, '2025-12-31', 'index', 37.45),
            ('2026-10-30', '2026-11-07', 1_407_910_000, 0.19, '2025-12-31', 'index', 24.63),
            ('2026-10-31', '2026-10-31', 2_826_390_000, 0.14, None, 'fund', 57.36),
        ]
        for i, (share, values) in enumerate(zip(SHARES, expected)):
            reference, publication, aum, fee, fees_date, basis, leading_sector = values
            with self.subTest(isin=share['isin']):
                page = self.page(share, ((reference, publication),), product_date='2026-10-30')
                text = (ROOT / f'scripts/fixtures/official-documents/bnp-{FILES[i]}-october-2026.txt').read_text()
                older_countries = {'asOf': '2026-10-30', 'basis': 'index', 'sourceUrl': 'https://example.com/older',
                                   'rows': [{'name': 'United States', 'weightPct': 100}]}
                fetch = {share['discoveryUrl']: page, self.document_url(1): b'%PDF-test'}.__getitem__
                with (
                    patch('collect_bnp_etf.pdf_text', return_value=text),
                    patch('collect_tracked_exposure.collect_one', return_value={'countries': older_countries}),
                ):
                    result = collect_one(share, now, fetch)
                for field in ('aum', 'characteristics', 'performance', 'holdings', 'sectors'):
                    self.assertEqual(result[field]['asOf'], '2026-10-30')
                    self.assertEqual(result[field]['documentAdvertisedAsOf'], reference)
                    self.assertEqual(result[field]['documentPublicationDate'], publication)
                self.assertEqual(result['aum']['amount'], aum)
                self.assertEqual(result['aum']['scope'], 'fund')
                self.assertEqual(result['characteristics']['terPct'], fee)
                self.assertEqual(result['characteristics']['feesAsOf'], fees_date)
                self.assertEqual(result['performance']['years'], parse(self.text(i), share, NOW, '2026-08-31')['performance']['years'])
                self.assertEqual(result['holdings']['basis'], basis)
                self.assertEqual(result['sectors']['basis'], basis)
                self.assertEqual(result['sectors']['rows'][0]['weightPct'], leading_sector)
                if i == 1:
                    self.assertEqual(result['countries']['basis'], 'index')
                    self.assertEqual(result['countries']['rows'][0], {'name': 'United Kingdom', 'weightPct': 18.90})
                else:
                    published_countries = {**older_countries, 'asOf': '2026-10-31',
                                           'sourceUrl': 'https://example.com/qualified'}
                    old = {share['isin']: {'currency': share['currency'], 'productId': share['isin'],
                                           'countries': published_countries}}
                    merged = merge_collection({'checkedAt': now.isoformat(), 'shares': [result]}, old, {})
                    self.assertEqual(merged[share['isin']]['countries'], published_countries)

    def test_nasdaq_month_end_adjustment_requires_matching_product_date(self):
        share = SHARES[2]
        now = dt.datetime(2026, 11, 22, tzinfo=dt.timezone.utc)
        text = (ROOT / 'scripts/fixtures/official-documents/bnp-easy-ii-nasdaq-october-2026.txt').read_text()
        for reference, corroboration in [('2026-10-31', None), ('2026-10-31', '2026-10-29'),
                                         ('2026-10-25', '2026-10-23'), ('2026-10-29', '2026-10-30')]:
            with self.subTest(reference=reference, corroboration=corroboration), self.assertRaisesRegex(ValueError, 'observation date'):
                page = self.page(share, ((reference, '2026-11-04'),), product_date=corroboration)
                with patch('collect_bnp_etf.pdf_text', return_value=text):
                    collect_one(share, now, {share['discoveryUrl']: page, self.document_url(1): b'%PDF-test'}.__getitem__)

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

    def test_official_provenance_and_checksum_on_every_field(self):
        import collect_bnp_etf
        share=SHARES[0]
        def fetch(url): return self.page(share) if url == share['discoveryUrl'] else b'%PDF-fake-test'
        with patch.object(collect_bnp_etf, 'pdf_text', return_value=self.text()):
            r=collect_one(share,NOW,fetch)
        for field in ['characteristics','aum','performance']:
            self.assertEqual(r[field]['documentHost'],'BNP Paribas Asset Management')
            self.assertEqual(r[field]['publisher'],'BNP Paribas Asset Management')
            self.assertEqual(len(r[field]['sha256']),64)
            self.assertTrue(r[field]['sourceUrl'].startswith('https://docfinder.bnpparibas-am.com/'))

    def test_nasdaq_country_complement_keeps_fund_and_index_provenance_separate(self):
        fixture = json.loads((ROOT / 'scripts/fixtures/official-documents/index-extensions/nasdaq-pea.json').read_text())
        share = SHARES[2]
        def fetch(url):
            return self.page(share) if url == share['discoveryUrl'] else b'%PDF-proof'
        def extract(body, crop=None):
            return fixture['left'] if crop == (0, 300) else fixture['right'] if crop == (300, 300) else fixture['full']
        with patch('collect_bnp_etf.pdf_text', return_value=self.text(2)), \
                patch('collect_index_extensions.pdf_text', side_effect=extract), \
                patch('collect_amundi_index_exposure.pdf_text', side_effect=extract):
            r = collect_one(share, NOW.replace(month=9), fetch)
        self.assertEqual(r['countries']['basis'], 'index')
        self.assertEqual(r['countries']['indexId'], 'nasdaq-pea')
        self.assertAlmostEqual(sum(row['weightPct'] for row in r['countries']['rows']), 100, delta=.2)
        self.assertIn('amundietf.fr', r['countries']['sourceUrl'])
        self.assertNotIn('documentHost', r['countries'])
        for field in ['holdings', 'sectors', 'performance']:
            self.assertEqual(r[field]['basis'], 'fund')
            self.assertEqual(r[field]['documentHost'], 'BNP Paribas Asset Management')
        self.assertEqual(r['performance']['years']['2025'], 20.72)
        self.assertFalse(any(item.startswith('countries:') for item in r['unavailable']))

    def test_failed_nasdaq_complement_preserves_previous_country_date(self):
        share = SHARES[2]
        def fetch(url):
            if 'amundietf.fr' in url: raise TimeoutError('official document unavailable')
            return self.page(share) if url == share['discoveryUrl'] else b'%PDF-proof'
        with patch('collect_bnp_etf.pdf_text', return_value=self.text(2)):
            incoming = collect_one(share, NOW, fetch)
        self.assertNotIn('countries', incoming)
        self.assertEqual(incoming['collectionErrors'][0]['field'], 'countries')
        old = {share['isin']: {'currency': 'USD', 'productId': share['isin'], 'countries':
            {'asOf': '2026-07-31', 'checkedAt': '2026-08-01', 'basis': 'index', 'rows': [{'name': 'US', 'weightPct': 100}]}}}
        merged = merge_collection({'checkedAt': NOW.isoformat(), 'shares': [incoming]}, old, {})
        self.assertEqual(merged[share['isin']]['countries'], old[share['isin']]['countries'])

    def test_invalid_collection_preserves_previous_and_newer_aum(self):
        from refresh_additional_etf import refresh
        old={'FR0011550185':{'currency':'EUR','productId':'FR0011550185','sourceUrl':'old','aum':{'asOf':'2026-09-30','amount':42}}}
        share = SHARES[0]
        page = self.page(share, (('2026-08-31', '2026-09-04'), ('2026-09-30', '2026-10-06')))
        fetch = {share['discoveryUrl']: page, self.document_url(2): b'%PDF-test'}.__getitem__
        with patch('collect_bnp_etf.pdf_text', return_value=self.text()):
            new,report=refresh({'instruments':[share]},old,{},NOW,lambda s, now: collect_one(s, now, fetch))
        self.assertIn('observation date', report['shares'][0]['reason'])
        self.assertEqual(new,old); self.assertEqual(report['shares'][0]['status'],'failed')
        r=parse(self.text(),SHARES[0],NOW,'2026-08-31');r['sourceUrl']=self.document_url(1)
        new=merge_collection({'checkedAt':NOW.isoformat(),'shares':[r]},old,{})
        self.assertEqual(new['FR0011550185']['aum'],old['FR0011550185']['aum'])


if __name__ == '__main__': unittest.main()
