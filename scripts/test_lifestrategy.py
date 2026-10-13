import copy
import datetime as dt
import json
import unittest
from unittest.mock import patch
from collect_lifestrategy import parse_sources
from data_automation import UTC

class LifeStrategySources(unittest.TestCase):
    def setUp(self):
        self.now = dt.datetime(2026, 10, 13, tzinfo=UTC)
        self.identity = {'identifier': [{'name':'ISIN','value':'IE00BMVB5P51'}, {'name':'PortId','value':'9494'}],
                         'additionalProperty':[{'name':'Currency','value':'EUR'}],
                         'feesAndCommissionsSpecification':'0.25%', 'url':'https://www.fr.vanguard/example'}
        self.text = """Fiche d'information | 31 août 2026
Vanguard LifeStrategy® 60% Equity UCITS ETF (EUR) Accumulating IE00BMVB5P51
Encours total (million) 1 200 € | Encours classe d'actifs (million) 966 € au 31 août 2026
Le Montant des frais courants (MFC)† 0,25 %
EUR V60A V60A.DE
Allocation aux fonds Vanguard sous-jacents
 Vanguard Example Equity UCITS ETF   60,0%
 Vanguard Example Bond UCITS ETF     40,0%
Total 100%
"""
        self.api = {'data': {'funds': [{'profile': {'portId':'9494','fundCurrency':'EUR',
            'identifiers':[{'altId':'ISIN','altIdValue':'IE00BMVB5P51'}]},
            'performanceDetails':{'items':{'quarterlyReturns':{'totalReturns':{'items':[
                {'returnPeriod':'1YR','percent':5,'effectiveDate':'2025-12-31'},
                {'returnPeriod':'1YR','percent':6,'effectiveDate':'2026-08-31'}]}}}}}]}}
    def parse(self, identity=None, text=None, api=None, allocation_date='31 août 2026'):
        html = f'''<script id="financial-product-json-ld">{json.dumps(identity or self.identity)}</script>
<a href="https://fund-docs.vanguard.com/LifeStrategy_60_Equity_UCITS_ETF_EUR_Accumulating_9494_FR_INT_FR.pdf">Factsheet</a>
<europe-core-asset-allocations>Au {allocation_date}<table>
<tr><td>Action</td><td>60,00 %</td></tr><tr><td>Obligation</td><td>40,00 %</td></tr>
</table></europe-core-asset-allocations>'''
        with patch('collect_lifestrategy.pdf_text', return_value=text or self.text):
            return parse_sources(html, b'%PDF-synthetic-regression', api or self.api, (60,'9494','IE00BMVB5P51'),self.now)
    def test_exact_share_not_fund_total(self):
        r=self.parse();self.assertEqual(r['aum']['amount'],966e6)
        self.assertEqual(r['aum']['asOf'],'2026-08-31');self.assertIn('arrondi',r['aum']['precisionNote'])
        self.assertEqual(r['assetAllocation']['rows'][0]['name'],'Actions')
        self.assertNotIn('sectors',r);self.assertNotIn('countries',r)
    def test_absent_share_assets_rejected(self):
        with self.assertRaises(ValueError):self.parse(text=self.text.replace("Encours classe d'actifs",'Other assets'))
    def test_wrong_isin_rejected(self):
        identity=copy.deepcopy(self.identity);identity['identifier'][0]['value']='IE00BMVB5Q68'
        with self.assertRaises(ValueError):self.parse(identity=identity)
    def test_stale_or_future_allocation_rejected(self):
        for date in ['31 mai 2026','31 octobre 2026']:
            with self.subTest(date=date),self.assertRaises(ValueError):self.parse(allocation_date=date)
    def test_truncated_underlying_holdings_rejected(self):
        with self.assertRaises(ValueError):self.parse(text=self.text.replace('40,0%','20,0%'))
    def test_pdf_page_fee_disagreement_rejected(self):
        with self.assertRaises(ValueError):self.parse(text=self.text.replace('0,25 %','0,35 %'))
    def test_api_other_share_rejected(self):
        api=copy.deepcopy(self.api);api['data']['funds'][0]['profile']['fundCurrency']='USD'
        with self.assertRaises(ValueError):self.parse(api=api)

if __name__=='__main__':unittest.main()
