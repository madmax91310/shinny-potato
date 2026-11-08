import datetime as dt
import copy
import gzip
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

class DatedKoreaBasketTests(unittest.TestCase):
    def setUp(self):
        self.now=dt.datetime(2026,11,8,tzinfo=dt.timezone.utc)
        self.fixture=ROOT/'scripts/fixtures/korea-dated-basket'
        self.config=next(r['physicalComposition'] for r in json.loads((ROOT/'scripts/index-company-sources.json').read_text())['additionalIndices'] if r['id']=='msci-korea')
        self.attributes=gzip.decompress((self.fixture/'classification.json.gz').read_bytes())
        self.latest=gzip.decompress((self.fixture/'latest.html.gz').read_bytes())
        self.fragment=gzip.decompress((self.fixture/'2026-11-05.html.gz').read_bytes())
        self.book=(self.fixture/'2026-11-05.xlsx').read_bytes()
        self.calls=[]
    def fetch(self,url):
        self.calls.append(url)
        if url==self.config['url']:return self.latest
        if url==self.config['classificationUrl']:return self.attributes
        if url==self.config['prospectusUrl']:return b'fixture prospectus'
        self.assertTrue(url.endswith('/get-fund-holdings-list?baseDate=2026.11.05'))
        return self.fragment
    def export(self,url):
        self.calls.append(url)
        self.assertTrue(url.endswith('/pdfExcelDownload/CEBA1E927AC1478B/2026.11.05'))
        return self.book,{'url':url,'headers':{'Content-Disposition':'attachment;filename=HANARO+MSCI+KOREA+TR_PDF_2026.11.05.xlsx'}}
    def run_collect(self,export=None):
        with patch('collect_korea_companies.pdf_text',return_value='NH-Amundi HANARO MSCI KOREA Total Return MSCI KOREA Gross TR 지수를 완전복제'):
            return collect(self.config,self.now,self.fetch,export or self.export)
    def test_real_date_selected_basket_with_server_date_and_all_rows(self):
        value=self.run_collect()
        self.assertEqual(value['asOf'],'2026-11-05')
        self.assertEqual(value['classificationAsOf'],value['asOf'])
        self.assertEqual(value['datedBasketProof']['latestPublisherAsOf'],'2026-11-06')
        self.assertEqual(value['rows'][0]['weightPct'],34.41)
        self.assertEqual(value['cashWeightPct'],.23)
        self.assertEqual(len(value['rows']),74)
        self.assertAlmostEqual(sum(r['weightPct']for r in value['rows']),99.75)
        self.assertEqual(value['basis'],'physical-creation-basket')
        self.assertIn('Approximation',value['method'])
        self.assertEqual(len(self.calls),5)
    def test_ignored_request_date_cannot_mix_sixth_with_fifth(self):
        self.fragment=gzip.decompress((self.fixture/'2026-11-06.html.gz').read_bytes())
        with self.assertRaisesRegex(ValueError,'values differ'):self.run_collect()
    def test_download_must_confirm_exact_date_and_fund(self):
        for name in ['HANARO+MSCI+KOREA+TR_PDF_2026.11.06.xlsx','ANOTHER+FUND_PDF_2026.11.05.xlsx','']:
            with self.subTest(name=name):
                def export(url):return self.book,{'url':url,'headers':{'Content-Disposition':'attachment;filename='+name}}
                with self.assertRaisesRegex(ValueError,'confirm exact fund'):self.run_collect(export)
    def test_no_forward_filling_when_classification_is_newer(self):
        data=json.loads(self.attributes)
        data['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']['asOfDate']['value']='20261107'
        self.attributes=json.dumps(data).encode()
        with self.assertRaisesRegex(ValueError,'date-aligned'):self.run_collect()
        self.assertEqual(len(self.calls),3)
    def test_truncated_workbook_and_html_cannot_pass_as_partial_success(self):
        self.fragment=self.fragment.replace(b'value="75"',b'value="74"')
        with self.assertRaisesRegex(ValueError,'Incomplete'):self.run_collect()
    def test_individual_failure_preserves_last_observation_and_clock(self):
        previous={'msci-korea':{'companyFund':{'asOf':'2026-11-05','checkedAt':'2026-11-06T12:00:00+00:00','rows':[{'isin':'KR7005930003','weightPct':34.41}]}}}
        def offline(url):raise TimeoutError('isolated export outage')
        with patch('collect_korea_companies.collect',side_effect=lambda c,n:self.run_collect(offline)):
            merged,report=refresh(previous,[{'id':'msci-korea','physicalComposition':self.config}],self.now,lambda c,n:{'id':c['id'],'errors':[]})
        self.assertEqual(merged['msci-korea']['companyFund'],previous['msci-korea']['companyFund'])
        self.assertEqual(merged['msci-korea']['companyStatus']['status'],'failed')
        self.assertIn('isolated export outage',str(report))

if __name__ == '__main__': unittest.main()
