import datetime as dt
import json
from pathlib import Path
import unittest
from unittest.mock import patch
from collect_korea_companies import parse_portfolio, classify, collect
from refresh_index_companies import refresh

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / 'scripts/fixtures/index-companies'
NOW = dt.datetime(2026, 10, 21, tzinfo=dt.timezone.utc)

class KoreaCompaniesTests(unittest.TestCase):
    def setUp(self):
        self.page = (FIXTURES / 'hanaro-2026-10-20.html').read_bytes()
        self.attributes = (FIXTURES / 'korea-security-attributes-2026-10-20.json').read_bytes()

    def test_complete_physical_portfolio_after_samsung_grouping(self):
        stamp, rows = parse_portfolio(self.page, NOW)
        self.assertEqual(stamp, '2026-10-20')
        self.assertEqual(len(rows), 74)
        self.assertEqual(len({row['isin'] for row in rows}), 74)
        self.assertAlmostEqual(sum(row['weightPct'] for row in rows), 99.78)
        named, countries, sectors = classify(self.attributes, rows, stamp)
        self.assertEqual(named[0]['name'], 'SAMSUNG ELECTRONICS LTD')
        samsung = sum(row['weightPct'] for row in named if row['isin'] in ['KR7005930003', 'KR7005931001'])
        self.assertAlmostEqual(samsung, 39.86)
        self.assertAlmostEqual(sum(weight for _, weight in sectors), 99.78)
        self.assertAlmostEqual(countries[0][1], 99.78)

    def test_capped_etf_weights_are_never_used(self):
        stamp, rows = parse_portfolio(self.page, NOW)
        modified = json.loads(self.attributes)
        points = modified['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
        points['holdingPercent'] = {'value': [999999] * len(rows)}
        named, _, _ = classify(json.dumps(modified).encode(), rows, stamp)
        self.assertEqual(named[0]['weightPct'], rows[0]['weightPct'])
        self.assertEqual([r['weightPct'] for r in named], [r['weightPct'] for r in rows])

    def test_dates_and_security_identity_fail_closed(self):
        stamp, rows = parse_portfolio(self.page, NOW)
        with self.assertRaisesRegex(ValueError, 'dates differ'):
            classify(self.attributes, rows, '2026-10-19')
        with self.assertRaisesRegex(ValueError, 'Unknown exact security'):
            classify(self.attributes, [{**rows[0], 'isin': 'KR7000000000'}], stamp)

    def test_incomplete_wrong_benchmark_and_wrong_weights_rejected(self):
        for old, new in [(b'pdfTotalCount">75', b'pdfTotalCount">74'),
                         (b'MSCI KOREA Gross TR ', b'MSCI KOREA 20/35 '),
                         (b'<td>35.13</td>', b'<td>95.13</td>')]:
            with self.assertRaises(ValueError): parse_portfolio(self.page.replace(old, new), NOW)

    def test_exact_benchmark_and_physical_prospectus_required(self):
        config = {'url': 'https://www.hanaroetf.com/fund/test', 'prospectusUrl': 'https://www.hanaroetf.com/test.pdf',
                  'classificationUrl': 'https://www.blackrock.com/attributes', 'indexIdentitySourceUrl': 'https://www.msci.com/indexes/index/941000/msci-korea-index'}
        responses = {config['url']: self.page, config['prospectusUrl']: b'PDF fixture', config['classificationUrl']: self.attributes}
        wording = 'NH-Amundi HANARO MSCI KOREA Total Return\nMSCI KOREA Gross TR 지수를 완전복제'
        with patch('collect_korea_companies.pdf_text', return_value=wording):
            result = collect(config, NOW, lambda url: responses[url])
        self.assertEqual(result['classificationAsOf'], result['asOf'])
        self.assertEqual(result['sourceProductCode'], 'KRX 332940')
        with patch('collect_korea_companies.pdf_text', return_value='Wrong benchmark or synthetic replication'):
            with self.assertRaisesRegex(ValueError, 'physical replication'):
                collect(config, NOW, lambda url: responses[url])

    def test_failed_native_refresh_retains_prior_portfolio(self):
        previous = {'msci-korea': {'companyFund': {'asOf': '2026-10-20', 'checkedAt': '2026-10-21', 'rows': [{'isin': 'KR7005930003', 'weightPct': 35.13}]}}}
        config = {'id': 'msci-korea', 'physicalComposition': {'url': 'https://www.hanaroetf.com/'}}
        with patch('collect_korea_companies.collect', side_effect=ValueError('offline')):
            merged, _ = refresh(previous, [config], NOW, lambda c, n: {'id': c['id'], 'errors': []})
        self.assertEqual(merged['msci-korea']['companyFund'], previous['msci-korea']['companyFund'])
        self.assertEqual(merged['msci-korea']['companyStatus']['status'], 'failed')
        self.assertEqual(merged['msci-korea']['companyStatus']['lastSuccessAt'], '2026-10-21')

if __name__ == '__main__': unittest.main()
