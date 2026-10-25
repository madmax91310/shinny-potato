"""Counterfactuals must not turn a payment date into an ex-date or mutate evidence."""
import copy,unittest
from reconcile_hsbc_distributions import investigate,candidate_without_factor
class HsbcInvestigation(unittest.TestCase):
 def test_two_candidates_and_residual_kept_separate(self):
  result=investigate()
  self.assertFalse(result['seriesRepaired']);self.assertFalse(result['runtimeQualificationChanged'])
  a,b=(result['candidateRemovals'][d]for d in ['2024-08-01','2024-08-08'])
  self.assertAlmostEqual(a['residualVsRoundedNavPp'],.121920317,places=8)
  self.assertAlmostEqual(b['residualVsRoundedNavPp'],-.000972874,places=8)
  for row in [a,b]:self.assertTrue(row['idempotent']);self.assertFalse(row['qualified']);self.assertFalse(row['appliedInProduction'])
  for doc in result['documents']:self.assertIn('ex-date not explicitly labelled',doc['dateKind'])
 def test_no_double_adjustment_and_no_mutation_of_raw_capture(self):
  rows={'2024-08-07':{'close':100,'adjusted':99},'2024-08-08':{'close':99,'adjusted':99}}
  original=copy.deepcopy(rows);once=candidate_without_factor(rows,'2024-08-08',1)
  self.assertEqual(rows,original);self.assertEqual(candidate_without_factor(once,'2024-08-08',1),once)
  rows['2024-08-08']['adjusted']=102
  with self.assertRaises(ValueError):candidate_without_factor(rows,'2024-08-08',1)
if __name__=='__main__':unittest.main()
