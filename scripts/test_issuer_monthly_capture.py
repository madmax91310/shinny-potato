import unittest
from issuer_monthly_capture import merge_monthly_returns
from apply_etf_collection import merge_collection

class MonthlyCapture(unittest.TestCase):
    def observation(self, date='2026-09-30', value=2):
        return dict(sourceUrl='https://issuer.test/share', sha256='a'*64, observations=[dict(label='1 mois', asOf=date, value=value)])
    def test_archive_and_gaps(self):
        first=merge_monthly_returns({},self.observation(),'2026-10-16')
        later=merge_monthly_returns(first,self.observation('2026-11-30',3),'2026-12-02')
        self.assertEqual(later['months'],{'2026-09':2,'2026-11':3})
        self.assertEqual(later['monthEvidence']['2026-09']['asOf'],'2026-09-30')
    def test_rolling_partial_and_corrections(self):
        self.assertEqual(merge_monthly_returns({},self.observation('2026-09-29'),'2026-10-16'),{})
        self.assertEqual(merge_monthly_returns({},self.observation('2026-10-31'),'2026-10-31'),{})
        with self.assertRaises(ValueError):merge_monthly_returns({'months':{'2026-09':5}},self.observation(),'2026-10-16')
        bad=self.observation();bad.pop('sha256')
        with self.assertRaises(ValueError):merge_monthly_returns({},bad,'2026-10-16')
    def test_unchanged_fee_new_document_hash_refreshes_check_only(self):
        old={'X':dict(currency='USD',productId='X',characteristics=dict(terPct=.3,asOf='2026-08-31',checkedAt='2026-10-06',sha256='a'*64))}
        share=dict(isin='X',currency='USD',productId='X',sourceUrl='https://issuer.test',characteristics=dict(terPct=.3,asOf='2026-08-31',sha256='b'*64))
        result=merge_collection(dict(checkedAt='2026-10-16',shares=[share]),old,{})['X']['characteristics']
        self.assertEqual(result['checkedAt'],'2026-10-16');self.assertEqual(result['asOf'],'2026-08-31')
    def test_document_publication_not_check_date_controls_fee_update(self):
        old={'X':dict(currency='USD',productId='X',characteristics=dict(terPct=.3,asOf='2026-08-31',checkedAt='2026-10-10'))}
        share=dict(isin='X',currency='USD',productId='X',sourceUrl='https://issuer.test',characteristics=dict(terPct=.2,asOf='2026-09-30'))
        result=merge_collection(dict(checkedAt='2026-10-16',shares=[share]),old,{})
        self.assertEqual(result['X']['characteristics']['terPct'],.2)
        share['characteristics']['asOf']='2026-07-31'
        self.assertEqual(merge_collection(dict(checkedAt='2026-10-16',shares=[share]),old,{})['X']['characteristics'],old['X']['characteristics'])
if __name__=='__main__':unittest.main()
