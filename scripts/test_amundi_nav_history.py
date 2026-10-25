"""Real captured responses, with mutations isolated from production."""
import copy, datetime as dt, gzip, json, pathlib, unittest
from amundi_nav_history import parse
ROOT=pathlib.Path(__file__).resolve().parents[1]
FOLDER=ROOT/'reports/donnees-consolidees-2026-10-24/preuves/amundi-reprise-20261025/sources'
NOW=dt.datetime(2026,10,25,tzinfo=dt.timezone.utc)
class AmundiNav(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.captures={}
        for path in sorted(FOLDER.glob('*.json.gz')):
            body=json.loads(gzip.decompress(path.read_bytes()))
            cls.captures[body['products'][0]['productId']]=body
    def setUp(self):
        self.body=copy.deepcopy(self.captures['FR0011871110'])
        self.source={'isin':'FR0011871110','navCurrency':'EUR','periodStart':'2015-01'}
    def test_exact_shares_all_six_annual_returns(self):
        for isin in ['FR0011871110','FR0011871128']:
            nav,years,proof=parse(self.captures[isin],self.source|{'isin':isin},NOW)
            self.assertEqual(len(proof['officialIncomeReinvestedChartChecks']),6)
            self.assertEqual(set(years),{str(y)for y in range(2020,2026)})
            self.assertEqual(proof['incomeTreatment'],'Capitalisation')
            self.assertLessEqual(max(nav),proof['latestRawNav'])
    def test_wrong_identity_currency_and_distribution(self):
        for field,value in [('ISIN','FR0011871128'),('CURRENCY','USD'),('DISTRIBUTION_POLICY','Distribution')]:
            body=copy.deepcopy(self.body);body['products'][0]['characteristics'][field]=value
            with self.assertRaises(ValueError):parse(body,self.source,NOW)
    def test_historical_currency_change_and_duplicate(self):
        for key in ['navCurrency','officialNav']:
            body=copy.deepcopy(self.body);rows=next(h['historicalData']for h in body['products'][0]['historics']if h['indicator']==key)
            if key=='navCurrency':rows[-5]['data']='USD'
            else:rows.append(rows[-5])
            with self.assertRaises(ValueError):parse(body,self.source,NOW)
    def test_annual_disagreement_not_hidden_by_other_valid_years(self):
        self.body['products'][0]['metrics'][1]['value']=.01
        with self.assertRaisesRegex(ValueError,'disagreement'):parse(self.body,self.source,NOW)
    def test_future_and_non_positive_nav(self):
        for value in [0,-1,float('nan')]:
            body=copy.deepcopy(self.body);next(h['historicalData']for h in body['products'][0]['historics']if h['indicator']=='countervalorisedAdjustedNAV')[-2]['data']=value
            with self.assertRaises(ValueError):parse(body,self.source,NOW)
        with self.assertRaises(ValueError):parse(self.body,self.source,NOW.replace(year=2025))
    def test_no_pre_launch_history_even_when_official_endpoint_returns_it(self):
        with self.assertRaisesRegex(ValueError,'before exact-share launch'):
            parse(self.captures['FR0010342592'],self.source|{'isin':'FR0010342592'},NOW)
    def test_missing_product_or_series(self):
        with self.assertRaises(ValueError):parse({'products':[]},self.source,NOW)
        self.body['products'].append(copy.deepcopy(self.body['products'][0]))
        with self.assertRaises(ValueError):parse(self.body,self.source,NOW)
if __name__=='__main__':unittest.main()
