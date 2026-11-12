"""Real issuer books, with rejection of wrong scope and incomplete table proofs."""
import base64
import copy
import datetime as dt
import gzip
import hashlib
import json
from pathlib import Path
import unittest
from invesco_physical_holdings import parse_capture, qualify_metadata

NOW = dt.datetime(2026, 10, 30, tzinfo=dt.timezone.utc)
BOOKS = json.loads(gzip.decompress((Path(__file__).parent/
    'fixtures/invesco-physical/public-books-20261030.json.gz').read_bytes()))


class InvescoPhysical(unittest.TestCase):
    def test_historical_fund_book_and_public_table_same_date_scope_corroboration(self):
        historical=json.loads(gzip.decompress((Path(__file__).parent/
            'fixtures/invesco-physical/historical-scope-corroboration.json.gz').read_bytes()))
        raw=base64.b64decode(historical['publicTableRawBase64'])
        self.assertEqual(hashlib.sha256(raw).hexdigest(),historical['publicTableSha256'])
        old=historical['previousQualifiedBook'];table=json.loads(raw)
        self.assertEqual(old['asOf'],table['effectiveDate'])
        self.assertEqual(old['basis'],'fund')
        self.assertIn('/holdings/fund?',old['sourceUrl'])
        self.assertEqual(len(old['rows']),1076)
        by_isin={r['isin']:r['weight']for r in table['holdings']if r.get('isin')}
        for row in old['rows']:
            self.assertIn(row['isin'],by_isin)
            self.assertLessEqual(abs(row['weightPct']-by_isin[row['isin']]),.005001)
        original={r['isin']for r in old['rows']}
        extra=[weight for isin,weight in by_isin.items()if isin not in original]
        self.assertEqual(len(extra),1013)
        self.assertLessEqual(max(extra),.005)
        self.assertEqual(sum(r['name']=='Cash and/or Derivatives'for r in table['holdings']),1)

    def parse(self, book, isin='IE000716YHJ7', now=NOW):
        return parse_capture(book['capture'], book['metadataRaw'], isin, now)

    def test_real_two_share_books_original_nav_and_complete_census(self):
        for isin, book in BOOKS.items():
            with self.subTest(isin=isin):
                rows, stamp, raw, proof, meta = self.parse(book, isin)
                self.assertEqual(stamp, '2026-10-29')
                self.assertEqual(proof['sourceRowCount'], 2090)
                self.assertEqual(len(rows), 2063)
                self.assertEqual(len({r['isin'] for r in rows}), 2063)
                self.assertAlmostEqual(sum(r['weightPct'] for r in rows), 99.94)
                self.assertAlmostEqual(proof['publishedNetWeightPct'], 99.9989)
                self.assertEqual(proof['excludedRowCount'], 27)
                self.assertAlmostEqual(proof['excludedWeightPctByType']['Cash and/or Derivatives'], .0589)
                self.assertFalse(proof['normalizationApplied'])
                original = {p['isin']:p['weight'] for p in json.loads(raw)['holdings'] if p.get('isin')}
                self.assertTrue(all(original[r['isin']] == r['weightPct'] for r in rows))

    def test_exact_physical_unhedged_share_metadata_required(self):
        for path, value in [('aliases.isin','IE0000QLH0G6'),('replicationMethod','Synthetic'),
                ('hedgedIndicator',True),('shareClassCurrency','EUR'),
                ('shareClassFullName','Another fund'),('account.accountName','Other fund'),
                ('account.productType','Bond'),('distributionFrequency','Distributing')]:
            with self.subTest(path=path):
                book=copy.deepcopy(BOOKS['IE000716YHJ7'])
                metadata=json.loads(book['metadataRaw']); target=metadata
                keys=path.split('.')
                for key in keys[:-1]: target=target[key]
                target[keys[-1]]=value
                book['metadataRaw']=json.dumps(metadata)
                with self.assertRaises(ValueError):self.parse(book)
        book=copy.deepcopy(BOOKS['IE000716YHJ7'])
        m=json.loads(book['metadataRaw']);m['benchmarkRelationships'][0]['indexBloombergTicker']='OTHER'
        book['metadataRaw']=json.dumps(m)
        with self.assertRaises(ValueError):self.parse(book)
        with self.assertRaises(ValueError):qualify_metadata(book['metadataRaw'],'IE000L2SA8K5',NOW)

    def test_public_census_scope_hash_and_date_cannot_be_inferred(self):
        for key,value in [('publisherRowCount',10),('samplingMandateConfirmed',False),
                ('asOf','2026-10-28'),('pageTitle','FTSE All-World Index'),
                ('sourceSha256','0'*64),('tableTextSha256','0'*64),
                ('sourceUrl','https://dng-api.invesco.com/other'),('isin','IE0000QLH0G6')]:
            with self.subTest(key=key):
                book=copy.deepcopy(BOOKS['IE000716YHJ7']);book['capture'][key]=value
                with self.assertRaises(ValueError):self.parse(book)
        with self.assertRaises(ValueError):self.parse(BOOKS['IE000716YHJ7'],now=NOW+dt.timedelta(days=90))

    def change_payload(self, transform):
        book=copy.deepcopy(BOOKS['IE000716YHJ7']);c=book['capture']
        transform(c['payload'])
        raw=json.dumps(c['payload']).encode()
        c['bodyBase64']=base64.b64encode(raw).decode();c['sourceSha256']=hashlib.sha256(raw).hexdigest()
        return book

    def test_truncation_duplicate_short_unknown_residual_and_wrong_precision_rejected(self):
        def truncate(p):p['holdings']=p['holdings'][:10]
        def duplicate(p):p['holdings'][1]['isin']=p['holdings'][0]['isin']
        def short(p):p['holdings'][0]['weight']=-1
        def unknown(p):p['holdings'][0]['isin']=None
        def nan(p):p['holdings'][0]['weight']=float('nan')
        def inflate(p):p['holdings'][0]['weight']+=.2
        def mixed_date(p):p['effectiveDate']='2026-10-28'
        for transform in [truncate,duplicate,short,unknown,nan,inflate,mixed_date]:
            with self.subTest(case=transform.__name__):
                with self.assertRaises(ValueError):self.parse(self.change_payload(transform))



class EqualWeightPhysical(unittest.TestCase):
    def setUp(self):
        self.book=json.loads(gzip.decompress((Path(__file__).parent/'fixtures/invesco-physical/equal-weight-20261112.json.gz').read_bytes()))
        self.now=dt.datetime(2026,11,12,tzinfo=dt.timezone.utc)
    def parse(self):return parse_capture(self.book['capture'],self.book['metadataRaw'],'IE000L2SA8K5',self.now)
    def test_actual_exact_replicated_fund_book_preserves_nav_weights_and_classes(self):
        rows,date,raw,reconciliation,meta=self.parse()
        self.assertEqual(date,'2026-11-11');self.assertEqual(len(rows),101)
        self.assertAlmostEqual(sum(r['weightPct']for r in rows),99.9709)
        self.assertEqual(reconciliation['excludedWeightPctByType'],{'Cash and/or Derivatives':.0291})
        self.assertFalse(reconciliation['normalizationApplied'])
        self.assertEqual(len([r for r in rows if r['isin']in ['US02079K1079','US02079K3059']]),2)
        self.assertFalse(self.book['capture']['samplingMandateConfirmed'])
        self.assertTrue(self.book['capture']['physicalReplicationMandateConfirmed'])
    def test_replication_mandate_and_visible_table_census_required(self):
        for key,value in [('physicalReplicationMandateConfirmed',False),('publisherRowCount',10),('pageTitle','NASDAQ-100 Equal Weighted Index'),('asOf','2026-11-10'),('sourceSha256','0'*64)]:
            original=copy.deepcopy(self.book);self.book['capture'][key]=value
            with self.subTest(key=key),self.assertRaises(ValueError):self.parse()
            self.book=original
    def test_other_fund_benchmark_synthetic_or_hedged_metadata_rejected(self):
        for mutation in ['fund','benchmark','synthetic','hedged','share']:
            original=self.book['metadataRaw'];m=json.loads(original)
            if mutation=='fund':m['account']['accountName']='Invesco FTSE All-World UCITS ETF'
            if mutation=='benchmark':m['benchmarkRelationships'][0]['indexBloombergTicker']='NDX'
            if mutation=='synthetic':m['replicationMethod']='Synthetic'
            if mutation=='hedged':m['hedgedIndicator']=True
            if mutation=='share':m['aliases']['isin']='IE000716YHJ7'
            self.book['metadataRaw']=json.dumps(m)
            with self.subTest(mutation=mutation),self.assertRaises(ValueError):self.parse()
            self.book['metadataRaw']=original

    def test_qualified_book_company_overlap_and_partial_scope_consumers(self):
        import subprocess
        subprocess.run(['node',str(Path(__file__).parent/'test-invesco-equalweight-consumers.mjs')],check=True,capture_output=True)

if __name__ == '__main__':unittest.main()
