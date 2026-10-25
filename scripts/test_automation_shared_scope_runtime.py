"""Shared source scopes stay shared in memory and isolated from the caller."""
import copy
import unittest
from automation_status_storage import pack_report_scopes,expand_report_scopes
from publish_automation_status import include_configured_workflows
from automation_monitoring import restore_history

class SharedScopeRuntime(unittest.TestCase):
    def state(self):
        scope={'kind':'metadata','expectedIds':[f'ISIN-{i}:field'for i in range(1000)],'items':[{'id':f'ISIN-{i}:field','fields':['field']}for i in range(1000)]}
        records={key:{'checkedAt':'2026-10-25T12:00:00Z','evidence':{'file':'metadata.json','sha256':'a'*64,'scope':scope}}for key in ('first','second')}
        state={'schemaVersion':1,'workflows':{'update-instrument-metadata.yml':{'name':'Metadata','sourceChecks':records}}}
        return expand_report_scopes(pack_report_scopes(state))
    def assert_shared_isolated(self,original,copied):
        old=original['workflows']['update-instrument-metadata.yml']['sourceChecks'];new=copied['workflows']['update-instrument-metadata.yml']['sourceChecks']
        self.assertEqual(new,old)
        self.assertIs(new['first']['evidence']['scope'],new['second']['evidence']['scope'])
        self.assertIsNot(new['first']['evidence']['scope'],old['first']['evidence']['scope'])
        new['first']['evidence']['scope']['items'][0]['fields'].append('isolated test mutation')
        self.assertEqual(old['first']['evidence']['scope']['items'][0]['fields'],['field'])
    def test_registry_initialisation_preserves_shared_proof_scopes(self):
        state=self.state();self.assert_shared_isolated(state,include_configured_workflows(state))
    def test_history_restoration_preserves_shared_proof_scopes(self):
        state=self.state();seed={'schemaVersion':1,'tip':'test','events':[],'resolved':[],'retired':[]}
        self.assert_shared_isolated(state,restore_history(state,seed))

if __name__=='__main__':unittest.main()
