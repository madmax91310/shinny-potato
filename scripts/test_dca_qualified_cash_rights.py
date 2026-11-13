import copy
import datetime as dt
import gzip
import hashlib
import html
import json
from pathlib import Path
import re
import unittest

from collect_dca_complete_holdings import parse_complete
from qualified_cash_rights import ARCELLX, qualified_cash_right

FIXTURES = Path(__file__).parent / 'fixtures/qualified-cash-rights'
NOW = dt.datetime(2026, 11, 12, tzinfo=dt.timezone.utc)
SHARES = {'IE00BYZK4776': '284216', 'IE00BYZK4669': '284218'}


def parsed(isin, body=None):
    if body is None:
        body = json.loads(gzip.decompress((FIXTURES / (isin + '.json.gz')).read_bytes()))
    return parse_complete(body, isin, 'https://www.blackrock.com/?portfolioId=' + SHARES[isin], NOW)[0]


class QualifiedCashRights(unittest.TestCase):
    def test_two_completed_merger_filings_prove_cash_only_consideration(self):
        # Proposal alone is not completion. Both registrants independently
        # report the April closing and the same cash-only contingent payment.
        for source, name in zip(ARCELLX['sources'], ['arcellx-closing.htm', 'gilead-closing.htm']):
            raw = gzip.decompress((FIXTURES / (name + '.gz')).read_bytes())
            self.assertEqual(hashlib.sha256(raw).hexdigest(), source['sha256'])
            text = html.unescape(re.sub(r'\s+', ' ', re.sub('<[^>]+>', ' ', raw.decode())))
            text = re.sub(r'\s+', ' ', text)
            for phrase in ['April 28, 2026', 'contingent payment of $5.00 per CVR',
                           'in cash, without interest', 'March 31, 2030', 'Merger']:
                self.assertIn(phrase, text)
            self.assertIn('converted into the right to receive', text)

    def test_actual_two_funds_keep_every_company_weight_and_full_source_accounting(self):
        provenance = json.loads((FIXTURES / 'provenance.json').read_text())
        for isin in SHARES:
            with self.subTest(isin=isin):
                raw = gzip.decompress((FIXTURES / (isin + '.json.gz')).read_bytes())
                self.assertEqual(hashlib.sha256(raw).hexdigest(), provenance[isin + '.json']['sha256'])
                body = json.loads(raw)
                p = body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
                expected = [{'name': n, 'isin': i, 'weightPct': w}
                            for n, i, w, k in zip(*(p[x]['value'] for x in ['issueName', 'isin', 'holdingPercent', 'assetClass']))
                            if k == 'Equity' and w > 0 and n != 'ARCELLX INC CVR']
                h = parsed(isin, body)
                self.assertEqual(h['rows'], expected)
                self.assertTrue(all(r['isin'] for r in h['rows']))
                self.assertEqual(len(h['qualifiedExcludedPositions']), 1)
                excluded = h['qualifiedExcludedPositions'][0]
                self.assertIsNone(excluded['sourcePosition']['isin'])
                self.assertEqual(excluded['sourcePosition']['assetClass'], 'Equity')
                self.assertGreater(excluded['sourcePosition']['weightPct'], 0)
                proof = h['navReconciliation']
                self.assertEqual(proof['sourceRowCount'], len(p['isin']['value']))
                self.assertFalse(proof['normalizationApplied'])
                self.assertAlmostEqual(proof['sourceWeightPctByType']['Equity'],
                                       proof['selectedWeightPct'] + excluded['sourcePosition']['weightPct'])
                self.assertAlmostEqual(proof['excludedWeightPctByType']['Equity'], excluded['sourcePosition']['weightPct'])
                self.assertAlmostEqual(proof['selectedWeightPct'] + sum(proof['excludedWeightPctByType'].values()), proof['publishedNetWeightPct'])
                self.assertEqual(h['asOf'], '2026-11-10')
                self.assertEqual(excluded['qualification']['reviewedAt'], '2026-11-12')
                self.assertNotIn('checkedAt', excluded['qualification'], 'A reference review is not a new source control')

    def position(self):
        return parsed('IE00BYZK4776')['qualifiedExcludedPositions'][0]['sourcePosition']

    def test_only_exact_unlisted_usd_right_is_qualified(self):
        for key, value in [('name', 'AKERO THERAPEUTICS CVR'), ('name', 'ARCELLX INC'),
                           ('name', 'UNLISTED CVR'), ('isin', 'US0395871000'),
                           ('ticker', 'ACLX'), ('currency', 'EUR'), ('country', 'Canada'),
                           ('exchange', 'NASDAQ'), ('assetClass', 'Cash')]:
            p = self.position(); p[key] = value
            with self.subTest(key=key, value=value):
                self.assertIsNone(qualified_cash_right(p, '2026-11-10'))

    def test_no_future_action_or_indefinite_post_payment_assumption(self):
        p = self.position()
        self.assertIsNone(qualified_cash_right(p, '2026-04-27'))
        self.assertIsNone(qualified_cash_right(p, '2030-04-01'))
        self.assertIsNotNone(qualified_cash_right(p, '2026-04-28'))

    def test_invalid_and_zero_weights_do_not_gain_qualification(self):
        for weight in [True, float('nan'), float('inf'), -0.1, 0, 100.1]:
            p = self.position(); p['weightPct'] = weight
            with self.subTest(weight=weight):
                self.assertIsNone(qualified_cash_right(p, '2026-11-10'))

    def test_unknown_cvr_is_preserved_not_excluded(self):
        body = json.loads(gzip.decompress((FIXTURES / 'IE00BYZK4776.json.gz').read_bytes()))
        points = body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
        index = points['issueName']['value'].index('ARCELLX INC CVR')
        points['issueName']['value'][index] = 'UNQUALIFIED CVR'
        h = parsed('IE00BYZK4776', body)
        self.assertNotIn('qualifiedExcludedPositions', h)
        retained = [r for r in h['rows'] if r['name'] == 'UNQUALIFIED CVR']
        self.assertEqual(len(retained), 1)
        self.assertIsNone(retained[0]['isin'])
        self.assertEqual(len(h['navReconciliation']['unidentifiedPositions']), 1)

    def test_idempotent_and_input_immutable(self):
        body = json.loads(gzip.decompress((FIXTURES / 'IE00BYZK4776.json.gz').read_bytes()))
        old = copy.deepcopy(body)
        self.assertEqual(parsed('IE00BYZK4776', body), parsed('IE00BYZK4776', body))
        self.assertEqual(body, old)



class QualifiedAkeroCashRight(unittest.TestCase):
    def fixture(self):
        return json.loads(gzip.decompress((FIXTURES/'IE00BF4RFH31.json.gz').read_bytes()))
    def parsed(self,body=None):
        provenance=json.loads((FIXTURES/'provenance.json').read_text())
        return parse_complete(self.fixture()if body is None else body,'IE00BF4RFH31',provenance['IE00BF4RFH31.json']['sourceUrl'],dt.datetime(2026,11,13,tzinfo=dt.timezone.utc))[0]
    def position(self):
        return self.parsed()['qualifiedExcludedPositions'][0]['sourcePosition']
    def test_completed_merger_and_governing_contract_prove_no_equity_right(self):
        from qualified_cash_rights import AKERO
        for source,name in zip(AKERO['sources'],['akero-closing.htm','akero-merger-agreement.htm']):
            raw=gzip.decompress((FIXTURES/(name+'.gz')).read_bytes())
            self.assertEqual(hashlib.sha256(raw).hexdigest(),source['sha256'])
            text=html.unescape(re.sub(r'\s+',' ',re.sub('<[^>]+>',' ',raw.decode())))
            text=re.sub(r'\s+',' ',text)
            if 'closing' in name:
                for phrase in ['December 9, 2025','completed its Merger','automatically cancelled and converted','right to receive $6.00 in cash','suspended from trading on Nasdaq']:
                    self.assertIn(phrase,text)
            else:
                for phrase in ['June 30, 2031','The CVRs will not have any voting or dividend rights','The CVRs will not represent any equity or ownership interest','The CVRs may not be sold, assigned, transferred']:
                    self.assertIn(phrase,text)
    def test_real_fund_keeps_all_values_and_source_markers_and_nav_accounting(self):
        from qualified_cash_rights import AKERO
        raw=gzip.decompress((FIXTURES/'IE00BF4RFH31.json.gz').read_bytes())
        provenance=json.loads((FIXTURES/'provenance.json').read_text())
        self.assertEqual(hashlib.sha256(raw).hexdigest(),provenance['IE00BF4RFH31.json']['sha256'])
        body=json.loads(raw);h=self.parsed(body);p=body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
        expected=[{'isin':i,'name':n,'weightPct':w}for i,n,w,k in zip(*(p[key]['value']for key in ['isin','issueName','holdingPercent','assetClass']))if k=='Equity'and w>0 and n!='AKERO THERAPEUTICS CVR']
        self.assertEqual(h['rows'],expected);self.assertTrue(all(row['isin']for row in h['rows']))
        right=h['qualifiedExcludedPositions'][0]
        self.assertEqual(right['qualification'],AKERO);self.assertEqual(right['sourcePosition']['weightPct'],.0003)
        self.assertEqual(right['sourcePosition']['exchange'],'NASDAQ');self.assertEqual(right['sourcePosition']['ticker'],'AKE')
        self.assertEqual(right['sourcePosition']['assetClass'],'Equity');self.assertIsNone(right['sourcePosition']['isin'])
        self.assertNotIn('checkedAt',right['qualification']);self.assertEqual(h['asOf'],'2026-11-12')
        q=h['navReconciliation'];self.assertEqual(q['sourceRowCount'],len(p['isin']['value']));self.assertEqual(q['unidentifiedPositions'],[]);self.assertFalse(q['normalizationApplied'])
        self.assertAlmostEqual(q['sourceWeightPctByType']['Equity'],q['selectedWeightPct']+.0003)
        self.assertAlmostEqual(q['excludedWeightPctByType']['Equity'],.0003)
        self.assertAlmostEqual(q['selectedWeightPct']+sum(q['excludedWeightPctByType'].values()),q['publishedNetWeightPct'])
        # Actual source valuation is retained in its raw capture, never replaced
        # with zero or with the contractual maximum payment.
        ix=p['issueName']['value'].index('AKERO THERAPEUTICS CVR')
        self.assertEqual(p['marketValue']['value'][ix],27306.24)
    def test_different_or_missing_native_markers_are_not_qualified(self):
        for key,value in [('name','AKERO THERAPEUTICS'),('name','UNKNOWN CVR'),('isin','US00973Y1082'),('ticker','AKRO'),('ticker',None),('exchange','NO MARKET (E.G. UNLISTED)'),('currency','EUR'),('country','Denmark'),('assetClass','Cash')]:
            p=self.position();p[key]=value
            with self.subTest(key=key,value=value):self.assertIsNone(qualified_cash_right(p,'2026-11-12'))
    def test_actual_closing_and_contract_termination_bound_the_reference(self):
        p=self.position()
        self.assertIsNone(qualified_cash_right(p,'2025-12-08'))
        self.assertIsNotNone(qualified_cash_right(p,'2025-12-09'))
        self.assertIsNotNone(qualified_cash_right(p,'2031-06-30'))
        self.assertIsNone(qualified_cash_right(p,'2031-07-01'))
    def test_unknown_right_is_preserved_and_no_general_cvr_exclusion_is_added(self):
        body=self.fixture();p=body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap'];ix=p['issueName']['value'].index('AKERO THERAPEUTICS CVR');p['issueName']['value'][ix]='UNQUALIFIED CVR'
        h=self.parsed(body);retained=[row for row in h['rows']if row['name']=='UNQUALIFIED CVR']
        self.assertEqual(len(retained),1);self.assertIsNone(retained[0]['isin']);self.assertEqual(retained[0]['weightPct'],.0003)
        self.assertEqual(len(h['navReconciliation']['unidentifiedPositions']),1)
    def test_input_immutable_idempotent_and_consumer_fixture_matches(self):
        body=self.fixture();before=copy.deepcopy(body);one=self.parsed(body);self.assertEqual(one,self.parsed(body));self.assertEqual(body,before)
        fixture=json.loads(gzip.decompress((FIXTURES/'IE00BF4RFH31-qualified.json.gz').read_bytes()))
        self.assertEqual(one,fixture['record']);self.assertEqual(len(fixture['previous']['rows']),len(one['rows'])+1)
        old=[row for row in fixture['previous']['rows']if row['name']!='AKERO THERAPEUTICS CVR']
        self.assertEqual(old,one['rows'])
    def test_invalid_values_do_not_gain_cash_qualification(self):
        for weight in [True,float('nan'),float('inf'),-.1,0,100.1]:
            p=self.position();p['weightPct']=weight
            with self.subTest(weight=weight):self.assertIsNone(qualified_cash_right(p,'2026-11-12'))


class QualifiedEsperionAndBiotech(unittest.TestCase):
    def fixture(self):
        return json.loads(gzip.decompress((FIXTURES/'IE00BYXG2H39-qualified.json.gz').read_bytes()))
    def test_executed_contract_and_completed_merger_prove_cash_only_non_ownership(self):
        from qualified_cash_rights import ESPERION
        for source,name in zip(ESPERION['sources'],['esperion-closing.htm','esperion-cvr-agreement.htm']):
            raw=gzip.decompress((FIXTURES/(name+'.gz')).read_bytes())
            self.assertEqual(hashlib.sha256(raw).hexdigest(),source['sha256'])
            text=html.unescape(re.sub(r'\s+',' ',re.sub('<[^>]+>',' ',raw.decode())))
            text=re.sub(r'\s+',' ',text)
            phrases=(['July 13, 2026','the Merger was consummated','contingent cash payments','contractual right only'] if 'closing' in name else ['The CVRs shall not represent any equity or ownership interest','No Voting, Dividends or Interest','Section 6.1','December 31, 2030'])
            for phrase in phrases:self.assertIn(phrase,text)
        self.assertNotIn('terminationDate',ESPERION)
        self.assertNotIn('paymentDate',ESPERION)
    def test_actual_biotech_cash_rights_retain_identifiers_values_dates_and_nav(self):
        fixture=self.fixture();h=fixture['record'];old=fixture['previous']
        raw=gzip.decompress((FIXTURES/'IE00BYXG2H39.json.gz').read_bytes());prov=json.loads((FIXTURES/'provenance.json').read_text())
        self.assertEqual(hashlib.sha256(raw).hexdigest(),prov['IE00BYXG2H39.json']['sha256'])
        body=json.loads(raw);fresh=parse_complete(body,'IE00BYXG2H39',prov['IE00BYXG2H39.json']['sourceUrl'],dt.datetime(2026,11,13,tzinfo=dt.timezone.utc))[0]
        self.assertEqual(fresh,h);self.assertEqual(fresh,parse_complete(body,'IE00BYXG2H39',prov['IE00BYXG2H39.json']['sourceUrl'],dt.datetime(2026,11,13,tzinfo=dt.timezone.utc))[0])
        rights={x['sourcePosition']['name']:x for x in h['qualifiedExcludedPositions']}
        self.assertEqual(set(rights),{'AKERO THERAPEUTICS CVR','ESPERION THERAPEUTICS (CVR)'})
        expected=[x for x in old['rows'] if x['name']not in rights]
        self.assertEqual(h['rows'],expected)
        self.assertEqual(rights['ESPERION THERAPEUTICS (CVR)']['sourcePosition']['isin'],'US296CVR0207')
        self.assertEqual(rights['ESPERION THERAPEUTICS (CVR)']['sourcePosition']['weightPct'],.0003)
        self.assertEqual(rights['AKERO THERAPEUTICS CVR']['sourcePosition']['weightPct'],.00263)
        self.assertEqual(h['navReconciliation']['unidentifiedPositions'],[])
        self.assertFalse(h['navReconciliation']['normalizationApplied'])
        self.assertAlmostEqual(h['navReconciliation']['sourceWeightPctByType']['Equity'],h['navReconciliation']['selectedWeightPct']+.00293)
        self.assertEqual(h['asOf'],'2026-11-12')
    def test_exact_native_identity_required_and_real_cvr_named_companies_preserved(self):
        p=next(x['sourcePosition']for x in self.fixture()['record']['qualifiedExcludedPositions']if x['qualification']['id'].startswith('esperion'))
        for key,value in [('name','ESPERION THERAPEUTICS'),('isin','US29664W1053'),('isin',None),('ticker','ESPR'),('exchange','NO MARKET (E.G. UNLISTED)'),('country','Canada'),('currency','EUR'),('assetClass','Cash'),('weightPct',0),('weightPct',float('nan'))]:
            q=copy.deepcopy(p);q[key]=value
            with self.subTest(key=key,value=value):self.assertIsNone(qualified_cash_right(q,'2026-11-12'))
        for name,isin in [('CVR ENERGY INC','US12662P1084'),('CVRX INC','US1266381052')]:
            q=copy.deepcopy(p);q.update(name=name,isin=isin);self.assertIsNone(qualified_cash_right(q,'2026-11-12'))
        self.assertIsNone(qualified_cash_right(p,'2026-07-12'));self.assertIsNotNone(qualified_cash_right(p,'2026-07-13'))
        self.assertIsNotNone(qualified_cash_right(p,'2030-12-31'));self.assertIsNone(qualified_cash_right(p,'2031-01-01'))

if __name__ == '__main__':
    unittest.main()
