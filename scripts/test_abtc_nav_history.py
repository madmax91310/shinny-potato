"""Exact issuer captures: reuse the existing ABTC monthly and split oracle."""
import copy,datetime as dt,gzip,json,pathlib,unittest
from collect_official_share_history import collect_one,configurations
from collect_product_calendars import issuer_json
from unittest.mock import patch
ROOT=pathlib.Path(__file__).resolve().parents[1]
FOLDER=ROOT/'scripts/fixtures/21shares-nav'
NOW=dt.datetime(2026,10,27,tzinfo=dt.timezone.utc)
class AbtcNav(unittest.TestCase):
    def setUp(self):
        self.fx=patch('collect_official_share_history.get_text',return_value=gzip.decompress((FOLDER/'fx.xml.gz').read_bytes()).decode());self.fx.start();self.addCleanup(self.fx.stop)
        self.source=next(s for s in configurations() if s['id']=='etfCH0454664001Nav')
        manifest=json.loads((FOLDER/'sources.json').read_text())
        self.bodies={url:gzip.decompress((FOLDER/name).read_bytes()) for url,name in manifest['files'].items()}
    def fetch(self,url):return self.bodies[url]
    def mutate(self,endpoint,change):
        key=next(url for url in self.bodies if endpoint in url)
        body=issuer_json(self.bodies[key]);change(body)
        self.bodies[key]=json.dumps(body).encode()
    def test_exact_share_all_months_split_and_calendar(self):
        record=collect_one(self.source,NOW,document_fetch=self.fetch)
        self.assertEqual(record['isin'],'CH0454664001');self.assertEqual(record['navCurrency'],'USD')
        self.assertEqual(record['currency'],'EUR');self.assertEqual(record['points'][0][0],'2019-03')
        self.assertEqual(record['points'][-1][0],'2026-09');self.assertEqual(len(record['points']),91)
        self.assertEqual({r['year'] for r in record['calendarProof']['checks']},set(range(2020,2026)))
        self.assertIn('already reflected',record['calendarProof']['splitAdjustment'])
        for point,proof in zip(record['points'],record['proofRows']):
            self.assertAlmostEqual(point[1],proof['value'],places=7)
        self.assertEqual(record['latestLevel']['asOf'],'2026-10-26')
    def test_wrong_instrument_currency_duplicate_and_unadjusted_split(self):
        mutations=[('product_details',lambda b:b['data']['details'].update(isin='DE000A27Z304')),
            ('product_valuation_history',lambda b:b['data'][0].update(fiat_denominator='EUR')),
            ('product_valuation_history',lambda b:b['data'].append(copy.deepcopy(b['data'][0]))),
            ('product_valuation_history',lambda b:next(r for r in b['data'] if r['valuation_date']=='2021-04-09').update(nav_per_share=999999))]
        for endpoint,change in mutations:
            with self.subTest(endpoint=endpoint):
                self.setUp();self.mutate(endpoint,change)
                with self.assertRaises(ValueError):collect_one(self.source,NOW,document_fetch=self.fetch)
    def test_monthly_omission_and_empty_reply_fail(self):
        self.mutate('product_performance_metrics',lambda b:b['data']['performance_monthly'][0].clear())
        with self.assertRaises((ValueError,KeyError)):collect_one(self.source,NOW,document_fetch=self.fetch)
        with self.assertRaises((ValueError,KeyError)):collect_one(self.source,NOW,document_fetch=lambda _:b'{}')
    def test_origin_and_future_observations_fail(self):
        with self.assertRaisesRegex(ValueError,'origin'):
            collect_one(self.source|{'sourceUrl':'https://example.com/api/product_valuation_history/ABTC'},NOW,document_fetch=self.fetch)
        self.mutate('product_valuation_history',lambda b:b['data'][0].update(valuation_date='2026-10-28'))
        with self.assertRaises(ValueError):collect_one(self.source,NOW,document_fetch=self.fetch)
if __name__=='__main__':unittest.main()
