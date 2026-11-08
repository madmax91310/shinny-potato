"""Real two-date issuer captures plus isolated failures; no live network claims."""
import copy
import datetime as dt
import gzip
import json
from pathlib import Path
import unittest
from unittest.mock import patch
from collect_public_issuer import Page, wisdomtree
from collect_wisdomtree_holdings import known_shares, flight_values
from wisdomtree_country_allocation import primary_country, api_country
from wisdomtree_api_holdings import CLASS_CONFIG

FIX = Path(__file__).with_name('fixtures')
NOW = dt.datetime(2026,10,30,tzinfo=dt.timezone.utc)

class CountryAllocation(unittest.TestCase):
    def setUp(self):
        self.share=next(s for s in known_shares() if s['isin']=='IE00BJGWQN72')
        self.page=gzip.decompress((FIX/'official-documents/wisdomtree-cloud-country-20261029.html.gz').read_bytes()).decode()
        self.display=next(t['rows'][1:] for t in Page(self.page).tables if t['context'].endswith('Country Allocation') and t['rows'][0]==['Country','Weight (%)'])
        self.payload=json.loads(gzip.decompress((FIX/'wisdomtree-complete/IE00BJGWQN72.rankings.json.gz').read_bytes()))
    def test_real_nav_clock_is_not_country_clock_on_two_captures(self):
        old=gzip.decompress((FIX/'official-documents/wisdomtree-ie-usd-eur-20261023.html.gz').read_bytes()).decode()
        for page,stamp in [(old,'2026-10-15'),(self.page,'2026-10-23')]:
            result=wisdomtree(page,self.share,NOW)
            self.assertEqual(result['countries']['asOf'],stamp)
            self.assertEqual(result['countries']['rankClassificationID'],6)
            self.assertNotEqual(result['countries']['asOf'],result['aum']['asOf'])
            self.assertIn('aum',result);self.assertIn('sectors',result)
    def test_current_primary_and_api_are_exactly_the_same_country_definition(self):
        primary=primary_country(self.page,self.share,self.display,NOW)
        api=api_country(self.payload,self.share,NOW)
        for key in ('rows','asOf','rankClassificationID'):self.assertEqual(primary[key],api[key])
        self.assertEqual(primary['rows'][0],{'name':'United States','weightPct':92.5013})
        self.assertEqual(sum(r['weightPct'] for r in primary['rows']),100)
        # Aggregate Country is independently published with different weights.
        aggregate=next(r for r in self.payload if r['rankClassificationID']==16 and r['name']=='United States')
        self.assertNotEqual(primary['rows'][0]['weightPct'],aggregate['pct']*100)
    def test_unqualified_share_never_borrows_the_country_policy(self):
        config={k:v for k,v in CLASS_CONFIG[self.share['isin']].items() if k!='countryAllocationDefinition'}
        with patch.dict(CLASS_CONFIG,{self.share['isin']:config}):
            self.assertIsNone(api_country(self.payload,self.share,NOW))
    def test_five_other_shares_each_reconcile_their_own_primary_and_api_rows(self):
        for share in known_shares():
            if share['isin']==self.share['isin']:continue
            with self.subTest(isin=share['isin']):
                page=gzip.decompress((FIX/'wisdomtree-complete'/(share['isin']+'.country-primary-20261030.html.gz')).read_bytes()).decode()
                display=next(t['rows'][1:]for t in Page(page).tables if t['context'].endswith('Country Allocation') and t['rows'][0]==['Country','Weight (%)'])
                payload=json.loads(gzip.decompress((FIX/'wisdomtree-complete'/(share['isin']+'.rankings.json.gz')).read_bytes()))
                primary=primary_country(page,share,display,NOW);api=api_country(payload,share,NOW)
                for key in ('rows','asOf','rankClassificationID'):self.assertEqual(primary[key],api[key])
                self.assertEqual(primary['asOf'],'2026-10-23')
                config={**CLASS_CONFIG[share['isin']],'countryAllocationDefinition':{'classificationId':16,'classificationName':'Aggregate Country'}}
                with patch.dict(CLASS_CONFIG,{share['isin']:config}):
                    with self.assertRaises(ValueError):primary_country(page,share,display,NOW)

    def test_bad_api_country_preserves_the_other_qualified_fields(self):
        from wisdomtree_ranked_fields import parse_fields
        for change in ({'pct':True},{'pct':float('nan')},{'pct':1.2},{'dt':'2026-11-01T00:00:00Z'},{'dt':'2026-10-22T00:00:00Z'},{'name':''},{'rankClassification':'Aggregate Country'}):
            data=copy.deepcopy(self.payload);next(r for r in data if r['rankClassificationID']==6).update(change)
            values,errors=parse_fields(data,self.share,NOW,'WCLD LN')
            self.assertEqual(set(values),{'sectors','holdings'})
            self.assertEqual([e['field'] for e in errors],['countries'])
    def test_published_unknown_country_is_preserved_without_redistribution(self):
        from collect_wisdomtree_holdings import known_shares
        for isin,label in [('IE0002Y8CX98','defence'),('IE00BZ56SW52','quality-dividend')]:
            with self.subTest(isin=isin):
                share=next(s for s in known_shares() if s['isin']==isin)
                page=gzip.decompress((FIX/'official-documents'/('wisdomtree-'+label+'-country-20261108.html.gz')).read_bytes()).decode()
                rows=next(t['rows'][1:] for t in Page(page).tables if t['context'].endswith('Country Allocation') and t['rows'][0]==['Country','Weight (%)'])
                result=primary_country(page,share,rows,dt.datetime(2026,11,8,tzinfo=dt.timezone.utc))
                unknown=next(r for r in result['rows'] if r['name']=='Unknown')
                self.assertGreater(unknown['weightPct'],0)
                self.assertEqual(result['unclassifiedWeightPct'],unknown['weightPct'])
                self.assertEqual(result['asOf'],'2026-11-05')
                fixture=json.loads((FIX/'wisdomtree-country-consumers-20261108.json').read_text())[isin]
                for key in ('rows','asOf','unclassifiedWeightPct'):
                    self.assertEqual(result[key],fixture[key])
                self.assertAlmostEqual(sum(r['weightPct'] for r in result['rows']),100,places=3)
                if label=='defence':
                    self.assertEqual(unknown['weightPct'],.2491)
                    self.assertEqual(result['rows'][0],{'name':'France','weightPct':33.4966})

    def test_api_unknown_and_cash_do_not_turn_into_countries_or_renormalisation(self):
        data=copy.deepcopy(self.payload)
        selected=next(r for r in data if r['rankClassificationID']==6)
        residual=copy.deepcopy(selected);residual.update(name='Unknown',pct=.002491)
        selected['pct']-=.002491
        data.append(residual)
        result=api_country(data,self.share,NOW)
        self.assertEqual(result['unclassifiedWeightPct'],.2491)
        self.assertEqual(next(r for r in result['rows'] if r['name']=='Unknown')['weightPct'],.2491)
        residual['name']='Cash'
        result=api_country(data,self.share,NOW)
        self.assertNotIn('unclassifiedWeightPct',result)
        self.assertEqual(next(r for r in result['rows'] if r['name']=='Cash')['weightPct'],.2491)

    def test_missing_primary_stream_does_not_borrow_nav_or_other_dates(self):
        with patch('wisdomtree_country_allocation.flight_values',return_value=iter([])):
            result=wisdomtree(self.page,self.share,NOW)
        self.assertNotIn('countries',result)
        self.assertEqual([e['field'] for e in result['collectionErrors']],['countries'])
        self.assertIn('aum',result);self.assertIn('sectors',result);self.assertIn('holdings',result)
    def test_malformed_display_and_wrong_currency_are_rejected(self):
        for rows in ([],[['United States','NaN%']],[['United States','broken']],[['United States','101%']]):
            with self.assertRaises(ValueError):primary_country(self.page,self.share,rows,NOW)
        with self.assertRaises(ValueError):api_country(self.payload,{**self.share,'currency':'EUR'},NOW)
    def test_api_row_order_is_irrelevant_and_no_rounding_or_normalisation(self):
        a=api_country(self.payload,self.share,NOW);b=api_country(list(reversed(self.payload)),self.share,NOW)
        self.assertEqual(sorted(a['rows'],key=lambda r:r['name']),sorted(b['rows'],key=lambda r:r['name']))
        data=copy.deepcopy(self.payload);next(r for r in data if r['rankClassificationID']==6)['pct']-=.000001
        result=api_country(data,self.share,NOW)
        self.assertAlmostEqual(sum(r['weightPct'] for r in result['rows']),99.9999)
        self.assertNotEqual(sum(r['weightPct'] for r in result['rows']),100)


    def _undated_overview(self, isin=None, currency=None, dates='As of '):
        return ('<table><tr><th>Product Overview</th><th>'+dates+'</th></tr>'
                '<tr><td>ISIN</td><td>'+(isin or self.share['isin'])+'</td></tr>'
                '<tr><td>Base Currency</td><td>'+(currency or self.share['currency'])+'</td></tr></table>')

    def test_missing_or_ambiguous_overview_reacquires_independent_pdf_and_api(self):
        from collect_public_issuer import collect_one
        share={**self.share,'parser':'wisdomtree-html'}
        for dates in ('As of ', 'As of 28/10/2026 As of 29/10/2026'):
            with self.subTest(dates=dates):
                result={'isin':share['isin'],'unavailable':[],'characteristics':{'asOf':'2026-09-30'}}
                api={'rows':[{'name':'United States','weightPct':92.5013}], 'asOf':'2026-10-23','basis':'fund'}
                def augment(r,*args,**kwargs):
                    r['countries']=copy.deepcopy(api);return r
                with patch('collect_public_issuer.get_text',return_value=self._undated_overview(dates=dates)),patch('collect_public_issuer.download',return_value=b'new PDF acquired')as download,patch('collect_public_issuer.wisdomtree_factsheet',return_value=result)as pdf,patch('wisdomtree_ranked_fields.augment_document',side_effect=augment)as ranks,patch('wisdomtree_directory_aum.augment_aum',side_effect=lambda r,*a,**kw:r):
                    actual=collect_one(share,NOW)
                download.assert_called_once();pdf.assert_called_once();ranks.assert_called_once()
                self.assertEqual(actual['countries'],api)
                self.assertEqual(actual['characteristics']['asOf'],'2026-09-30')
                issue=actual['collectionErrors'][0]
                self.assertEqual(issue['field'],'overview-date');self.assertTrue(issue['qualifiedFallbackAvailable'])
                self.assertEqual(issue['qualifiedFields'],['countries'])
                self.assertIn('Missing or ambiguous',issue['reason'])
                self.assertTrue(any(a['status']=='failed' for a in actual['sourceAttempts']))

    def test_wrong_identity_currency_and_unrelated_schema_never_select_the_route(self):
        from collect_public_issuer import collect_one
        share={**self.share,'parser':'wisdomtree-html'}
        for page in (self._undated_overview(isin='IE0000000000'),self._undated_overview(currency='EUR'),'<html>Temporarily unavailable</html>'):
            with self.subTest(page=page),patch('collect_public_issuer.get_text',return_value=page),patch('collect_public_issuer.download')as fetch:
                with self.assertRaises(ValueError):collect_one(share,NOW)
                fetch.assert_not_called()

    def test_failed_independent_pdf_cannot_renew_previous_fields(self):
        from collect_public_issuer import collect_one
        share={**self.share,'parser':'wisdomtree-html'}
        with patch('collect_public_issuer.get_text',return_value=self._undated_overview()),patch('collect_public_issuer.download',side_effect=ConnectionError('PDF unavailable')),patch('wisdomtree_ranked_fields.augment_document')as ranks:
            with self.assertRaisesRegex(ConnectionError,'PDF unavailable'):collect_one(share,NOW)
            ranks.assert_not_called()

if __name__=='__main__':unittest.main()
