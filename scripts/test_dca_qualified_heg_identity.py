import copy
import datetime as dt
import gzip
import hashlib
import json
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch
from collect_dca_complete_holdings import parse_complete
from qualified_corporate_identities import HEG_GRAPHITE, qualified_corporate_identity

FIXTURES=Path(__file__).parent/'fixtures/qualified-heg-identity'
NOW=dt.datetime(2026,11,12,tzinfo=dt.timezone.utc)
SHARES={'IE00B3F81G20':'251859','IE00BKM4GZ66':'264659'}
def body(isin):return json.loads(gzip.decompress((FIXTURES/(isin+'.json.gz')).read_bytes()))
def parsed(isin, source=None, now=NOW):
    return parse_complete(source if source is not None else body(isin),isin,'https://www.blackrock.com/?portfolioId='+SHARES[isin],now)[0]

class HegIdentity(unittest.TestCase):
    def test_signed_issuer_tables_explicitly_bind_company_class_and_post_split_identifier(self):
        provenance=json.loads((FIXTURES/'provenance.json').read_text())
        self.assertEqual(provenance['issuer']['wholeDocumentSha256'],HEG_GRAPHITE['sha256'])
        for page in [18,22]:
            raw=(FIXTURES/f'issuer-page-{page}.pdf').read_bytes()
            self.assertEqual(hashlib.sha256(raw).hexdigest(),provenance['issuer']['pages'][str(page)])
            text=subprocess.check_output(['pdftotext','-layout','-','-'],input=raw).decode()
            self.assertIn('Equity Shares',text)
            self.assertIn('ISIN',text)
            self.assertIn('INEOY9JOI020' if page==18 else 'INEOY9J01020',text)
        # Text layer contains O/0 and I/1 OCR ambiguities. The identifier is
        # visually reviewed against the signed original, never OCR-guessed.
        self.assertEqual(HEG_GRAPHITE['isin'],'INE0Y9J01020')
        self.assertNotEqual(HEG_GRAPHITE['isin'],'INE545A01024')
    def test_actual_two_funds_keep_weights_dates_and_every_original_source_position(self):
        for isin in SHARES:
            with self.subTest(isin=isin):
                native=body(isin);before=copy.deepcopy(native);h=parsed(isin,native)
                self.assertEqual(native,before)
                self.assertEqual(len(h['qualifiedIdentityPositions']),1)
                proof=h['qualifiedIdentityPositions'][0]
                self.assertIsNone(proof['sourcePosition']['isin'])
                self.assertEqual(proof['qualifiedIsin'],HEG_GRAPHITE['isin'])
                self.assertEqual(proof['qualification']['reviewedAt'],'2026-11-12')
                self.assertNotIn('checkedAt',proof['qualification'])
                row=next(r for r in h['rows']if r['name']=='HEG GRAPHITE LTD')
                self.assertEqual(row['isin'],HEG_GRAPHITE['isin'])
                self.assertEqual(row['weightPct'],proof['sourcePosition']['weightPct'])
                self.assertEqual(h['navReconciliation']['unidentifiedPositions'],[])
                self.assertFalse(h['navReconciliation']['normalizationApplied'])
                p=native['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
                self.assertEqual([r['weightPct']for r in h['rows']],[w for w,k in zip(p['holdingPercent']['value'],p['assetClass']['value'])if k=='Equity'and w>0])
                self.assertEqual(h,parsed(isin,native))
    def test_other_entity_currency_class_venue_identifier_and_fund_are_not_assigned(self):
        position=parsed('IE00B3F81G20')['qualifiedIdentityPositions'][0]['sourcePosition']
        for key,value in [('name','HEG LIMITED'),('name','HEG ADVANCED MATERIALS LTD'),('name','GRAPHITE INDIA LTD'),('isin','INE545A01024'),('currency','USD'),('assetClass','Cash'),('ticker','HEGAM'),('country','United States'),('exchange','National Stock Exchange Of India'),('weightPct',True),('weightPct',float('nan'))]:
            p={**position,key:value}
            with self.subTest(key=key,value=value):self.assertIsNone(qualified_corporate_identity(p,'2026-11-11','IE00B3F81G20',NOW))
        self.assertIsNone(qualified_corporate_identity(position,'2026-11-11','IE00BF4RFH31',NOW))
    def test_pre_scheme_future_and_expired_reference_stay_unqualified(self):
        p=parsed('IE00B3F81G20')['qualifiedIdentityPositions'][0]['sourcePosition']
        for asof,now in [('2026-08-31',NOW),('2026-11-13',NOW),('2027-11-14',NOW+dt.timedelta(days=367))]:
            self.assertIsNone(qualified_corporate_identity(p,asof,'IE00B3F81G20',now))
        with patch('collect_dca_complete_holdings.qualified_corporate_identity',return_value=None):
            stale=parsed('IE00B3F81G20')
        self.assertNotIn('qualifiedIdentityPositions',stale)
        self.assertIsNone(next(r for r in stale['rows']if r['name']=='HEG GRAPHITE LTD')['isin'])
    def test_node_consumer_keeps_unknowns_and_existing_coverage_limits(self):
        subprocess.run(['node','scripts/test-qualified-heg-consumers.mjs'],check=True)

if __name__=='__main__':unittest.main()
