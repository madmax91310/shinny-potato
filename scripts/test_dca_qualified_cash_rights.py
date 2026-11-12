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


if __name__ == '__main__':
    unittest.main()
