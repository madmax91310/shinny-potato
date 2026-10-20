import unittest
from pr_validation_queue import superseded,BRANCH
class Queue(unittest.TestCase):
 def test_production_other_branches_forks_and_current_head_are_never_cancelled(self):
  row={'id':1,'head_branch':BRANCH,'head_sha':'old','event':'pull_request','status':'in_progress','head_repository':{'full_name':'owner/repo'}}
  self.assertEqual(superseded([row],'owner/repo','new'),[1])
  for change in [{'head_branch':'master'},{'head_branch':'other-feature'},{'head_sha':'new'},{'event':'schedule'},{'status':'completed'},{'head_repository':{'full_name':'fork/repo'}}]:
   self.assertEqual(superseded([{**row,**change}],'owner/repo','new'),[])
if __name__=='__main__':unittest.main()
