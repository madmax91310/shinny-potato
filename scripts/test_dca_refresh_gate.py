import unittest
from validate_holdings_refresh import validate
class RefreshGate(unittest.TestCase):
 def test_known_failure_remains_visible(self):
  result=validate({'updated':['a'],'errors':[{'id':'dca-holdings:b','error':'Scope unqualified'}]},{'b':{'status':'failed','error':'Scope unqualified'}},{'a':{},'b':{}})
  self.assertEqual(result,{'updated':1,'knownFailures':1})
 def test_new_failure_and_omitted_target_block(self):
  for previous in ({},{'b':{'status':'validated'}},{'b':{'status':'failed','error':'Different failure'}}):
   with self.assertRaises(ValueError):validate({'updated':['a'],'errors':[{'id':'dca-holdings:b','error':'Scope unqualified'}]},previous,{'a':{},'b':{}})
  with self.assertRaises(ValueError):validate({'updated':['a'],'errors':[]},{},{'a':{},'b':{}})
  with self.assertRaises(ValueError):validate({'updated':['a','a'],'errors':[]},{},{'a':{}})
