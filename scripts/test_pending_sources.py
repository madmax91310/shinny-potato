import datetime as dt
import unittest
from check_pending_sources import check, public_url

NOW=dt.datetime(2026,10,20,tzinfo=dt.timezone.utc)
class PendingSources(unittest.TestCase):
    def test_http_200_error_page_is_not_successful_access_and_keeps_last_proof(self):
        url='https://issuer.example/components'
        row={'id':'fund','field':'completeHoldings','sourceUrl':url}
        previous=check([row],{},NOW,lambda url,**kwargs:(b'original',url))
        current=check([row],previous,NOW,lambda url,**kwargs:(b'<html><title>429 Too Many Requests</title></html>',url))
        source=current['sources'][url]
        self.assertEqual(source['status'],'unavailable');self.assertFalse(source['financialDataQualified'])
        self.assertEqual(source['sha256'],previous['sources'][url]['sha256'])
        self.assertIn('error document',source['error'])
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

    def test_primary_failure_checks_every_configured_alternative_without_financial_success(self):
        urls=['https://example.com/down','https://example.com/backup','https://example.com/second']
        row={'id':'fund','field':'holdings','sourceUrl':urls[0],'configuredSourceUrls':urls}
        seen=[]
        def fetch(url,**kwargs):
            seen.append(url)
            if url==urls[0]:raise TimeoutError('Primary down')
            return b'public alternative',url
        report=check([row],{},NOW,fetch)
        observation=report['observations']['fund:holdings']
        self.assertEqual(set(seen),set(urls));self.assertEqual(len(seen),3)
        self.assertEqual(observation['sourceUrl'],urls[1])
        self.assertEqual(observation['primarySourceUrl'],urls[0])
        self.assertEqual(report['sources'][urls[0]]['status'],'unavailable')
        self.assertFalse(observation['financialDataQualified'])
        self.assertEqual(len(observation['sourceChecks']),3)
        self.assertNotIn('lastSuccessAt',observation)

    def test_source_budget_retains_unchecked_routes_and_deduplicates_shared_urls(self):
        urls=[f'https://example.com/{n}' for n in range(12)]
        rows=[{'id':key,'field':'countries','configuredSourceUrls':urls} for key in ['a','b']]
        seen=[]
        def fetch(url,**kwargs):seen.append(url);return b'file',url
        report=check(rows,{},NOW,fetch)
        self.assertEqual(len(seen),8)
        for row in report['observations'].values():
            self.assertEqual(row['notCheckedSourceUrls'],urls[8:])
            self.assertFalse(row['financialDataQualified'])

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
