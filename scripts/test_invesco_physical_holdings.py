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


if __name__ == '__main__':unittest.main()
