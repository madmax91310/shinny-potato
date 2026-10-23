import copy
import datetime as dt
import json
import unittest
from pathlib import Path
from qualified_distributions import reconcile_adjustments
from refresh_monthly_history import yahoo_chart
ROOT=Path(__file__).resolve().parents[1]
NOW=dt.datetime(2026,10,23,tzinfo=dt.timezone.utc)
class OfficialDistribution(unittest.TestCase):
    def setUp(self):
        self.source=next(s for s in json.loads((ROOT/'scripts/monthly-automation.json').read_text())['series']if s['id']=='etf_financials')
        full=json.loads((ROOT/'reports/wfns-dividend-2026-10-23/qualification-locale.json').read_text())
        self.data={k:v for k,v in full.items()if k!='distributionAdjustmentProof'}
        for point,row in zip(self.data['points'],self.data['proofRows']):
            row['value']=row.pop('providerAdjustedValue');row.pop('officialDividendFactor');point[1]=round(row['value'],self.source['precision'])
        self.daily,_=yahoo_chart(self.data['rawResponse']['1d'],self.source,'1d')
    def test_missing_dividend_is_repaired_without_changing_other_annual_returns_or_raw_quotes(self):
        original=copy.deepcopy(self.data);result=reconcile_adjustments(self.source,self.data,self.daily,NOW)
        self.assertEqual(self.data,original)
        self.assertEqual(result['anniversaryPoints'],original['anniversaryPoints'])
        old,new=dict(original['points']),dict(result['points'])
        annual=lambda p,y:(p[f'{y}-12']/p[f'{y-1}-12']-1)*100
        self.assertAlmostEqual(annual(old,2023),14.604798,places=4)
        self.assertAlmostEqual(annual(new,2023),17.2979525,places=4)
        for y in [2022,2024,2025]:self.assertAlmostEqual(annual(old,y),annual(new,y),places=4)
        proof=result['distributionAdjustmentProof'][0]
        self.assertEqual(proof['status'],'missing-adjustment');self.assertEqual(proof['amount'],.1077)
        self.assertEqual(proof['evidenceCheckedAt'],'2026-10-23T04:39:21.635047+00:00')
        with self.assertRaisesRegex(ValueError,'already applied'):reconcile_adjustments(self.source,result,self.daily,NOW)
    def test_a_future_vendor_fix_is_not_counted_twice_even_if_its_event_table_still_omits_the_cash(self):
        fixed=copy.deepcopy(self.data);raw=fixed['rawResponse']['1d']['chart']['result'][0]
        factor=1-.1077/next(q for d,q,a in self.daily if d.isoformat()=='2023-06-14')
        for i,t in enumerate(raw['timestamp']):
            if raw['indicators']['adjclose'][0]['adjclose'][i] is not None and dt.datetime.fromtimestamp(t,dt.timezone.utc).date().isoformat()<'2023-06-15':
                raw['indicators']['adjclose'][0]['adjclose'][i]*=factor
        for point,row in zip(fixed['points'],fixed['proofRows']):
            if row['date']<'2023-06-15':row['value']*=factor;point[1]=round(row['value'],6)
        daily,_=yahoo_chart(fixed['rawResponse']['1d'],self.source,'1d')
        result=reconcile_adjustments(self.source,fixed,daily,NOW)
        self.assertEqual(result['points'],fixed['points']);self.assertEqual(result['distributionAdjustmentProof'][0]['status'],'already-adjusted')
    def test_currency_evidence_tampering_ambiguous_factors_and_later_split_fail_closed(self):
        bad=copy.deepcopy(self.source);bad['currency']='EUR'
        with self.assertRaisesRegex(ValueError,'currency'):reconcile_adjustments(bad,self.data,self.daily,NOW)
        bad=copy.deepcopy(self.source);bad['distributionEvidence']['sha256']='0'*64
        with self.assertRaisesRegex(ValueError,'hash'):reconcile_adjustments(bad,self.data,self.daily,NOW)
        bad=copy.deepcopy(self.data);bad['rawResponse']['1d']['chart']['result'][0].setdefault('events',{})['splits']={'x':{'date':1704196800,'splitRatio':'2:1'}}
        with self.assertRaisesRegex(ValueError,'split'):reconcile_adjustments(self.source,bad,self.daily,NOW)
        changed=[(d,q/2,a/2)for d,q,a in self.daily]
        with self.assertRaisesRegex(ValueError,'share units changed'):reconcile_adjustments(self.source,self.data,changed,NOW)
        daily=[(d,q,a*.99 if d.isoformat()=='2023-06-15'else a)for d,q,a in self.daily]
        with self.assertRaisesRegex(ValueError,'Ambiguous'):reconcile_adjustments(self.source,self.data,daily,NOW)
if __name__=='__main__':unittest.main()
