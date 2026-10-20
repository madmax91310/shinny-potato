import datetime as dt
import unittest
from check_pending_sources import check, public_url

NOW=dt.datetime(2026,10,20,tzinfo=dt.timezone.utc)
class PendingSources(unittest.TestCase):
    def test_public_access_never_qualifies_or_renews_financial_observations(self):
        original={'id':'actor:bricks','field':'catalog:Projet','sourceUrl':'https://www.bricks.co/',
                  'checkedAt':'2026-08-01','lastSuccessAt':'2026-08-01','actionState':'connector-needed'}
        report=check([original],{},NOW,lambda url,**kwargs:(b'public page',url))
        row=report['observations']['actor:bricks:catalog:Projet']
        self.assertFalse(row['financialDataQualified'])
        self.assertEqual(row['prerequisite'],'published-general-platform-condition-required')
        self.assertEqual(row['status'],'accessible-unqualified')
        self.assertNotIn('checkedAt',row);self.assertNotIn('lastSuccessAt',row);self.assertNotIn('asOf',row)
        self.assertEqual(original['actionState'],'connector-needed')
        changed=check([original],report,NOW,lambda url,**kwargs:(b'changed page',url))
        self.assertEqual(changed['observations']['actor:bricks:catalog:Projet']['status'],'changed-unqualified')

    def test_transport_failure_preserves_only_the_previous_access_proof(self):
        rows=[{'id':'fund','field':'holdings','sourceUrl':'https://example.com/data'}]
        previous=check(rows,{},NOW,lambda url,**kwargs:(b'file',url))
        def fail(*args,**kwargs):raise TimeoutError('timeout')
        result=check(rows,previous,NOW,fail)['observations']['fund:holdings']
        self.assertEqual(result['status'],'unavailable')
        self.assertEqual(result['lastAccessibleAt'],NOW.isoformat())
        self.assertFalse(result['financialDataQualified'])
        for url in ['http://example.com','https://127.0.0.1','https://169.254.169.254','https://localhost/x','https://user:pass@example.com']:
            self.assertFalse(public_url(url),url)

if __name__=='__main__':unittest.main()
