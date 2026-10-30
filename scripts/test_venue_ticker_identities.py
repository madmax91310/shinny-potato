"""Real independent queries; venue, class, source binding and failure guards."""
import copy
import base64
import datetime as dt
import gzip
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import security_identifier_observations as ids

FIXTURE=json.loads(gzip.decompress((Path(__file__).parent/
    'fixtures/venue-ticker-identities/vaneck-real-proofs-20261030.json.gz').read_bytes()))
NOW=dt.datetime.fromisoformat(FIXTURE['checkedAt'])


class VenueTickerIdentities(unittest.TestCase):
    def test_five_real_cross_queries_agree_without_names(self):
        expected={'VVX US':'US92242T1016','USA CN':'CA03062D8035','MLX AU':'AU000000MLX7',
                  'SLS CN':'CA83419D2014','ARU AU':'AU000000ARU5'}
        for proof in FIXTURE['proofs'].values():
            binding=proof['issuerBinding']
            self.assertEqual(ids.venue_ticker_identity(proof,NOW,binding),expected[binding['ticker']])
            changed=copy.deepcopy(proof)
            for response in changed['response']:
                for row in response['data']:row['name']='Not used for identity'
            changed['sha256']=ids.digest(changed['response'])
            self.assertEqual(ids.venue_ticker_identity(changed,NOW,binding),expected[binding['ticker']])

    def test_wrong_venue_currency_class_type_figi_and_ambiguous_isin_rejected(self):
        original=next(iter(FIXTURE['proofs'].values()));binding=original['issuerBinding']
        for field,value in [('exchCode','GY'),('ticker','OTHER'),('shareClassFIGI','BBG000000001'),
                            ('figi','BBG000000001'),('compositeFIGI','BBG000000001'),
                            ('securityType','ADR'),('securityType2','Depositary Receipt')]:
            proof=copy.deepcopy(original);proof['response'][1]['data'][0][field]=value
            proof['sha256']=ids.digest(proof['response'])
            with self.subTest(field=field),self.assertRaises(ValueError):ids.venue_ticker_identity(proof,NOW,binding)
        proof=copy.deepcopy(original);proof['request'][0]['currency']='EUR'
        with self.assertRaises(ValueError):ids.venue_ticker_identity(proof,NOW,binding)
        proof=copy.deepcopy(original);proof['request'].append({**proof['request'][1],'idValue':'US0378331005'})
        proof['response'].append(proof['response'][1]);proof['sha256']=ids.digest(proof['response'])
        with self.assertRaises(ValueError):ids.venue_ticker_identity(proof,NOW,binding)

    def test_source_cannot_be_rebound_or_expired(self):
        proof=next(iter(FIXTURE['proofs'].values()));binding=proof['issuerBinding']
        for key,value in [('subjectIsin','IE00BKLF1R75'),('sourceSha256','0'*64),
                          ('sourceUrl','https://www.vaneck.com/Main/HoldingsBlock/GetContent/?ticker=WRONG')]:
            changed={**binding,key:value}
            with self.subTest(key=key),self.assertRaises(ValueError):ids.venue_ticker_identity(proof,NOW,changed)
            if key!='sourceSha256':
                rebound={**proof,'issuerBinding':changed}
                with self.assertRaises(ValueError):ids.venue_ticker_identity(rebound,NOW,changed)
        with self.assertRaises(ValueError):ids.venue_ticker_identity(proof,NOW+dt.timedelta(days=365),binding)

    def test_failed_renewal_retains_current_identity_proof_with_original_clock(self):
        subject='IE000YYE6WK5';book=FIXTURE['books'][subject]
        proof=next(p for p in FIXTURE['proofs'].values()if p['issuerBinding']['subjectIsin']==subject)
        binding=proof['issuerBinding'];share={'isin':subject}
        with tempfile.TemporaryDirectory()as tmp:
            path=Path(tmp)/'cache.json';initial={'schemaVersion':1,'observations':{},
                'venueTickerObservations':{subject+'|VVX US|USD':proof}}
            path.write_text(json.dumps(initial))
            with patch.object(ids,'PATH',path),patch('wisdomtree_api_holdings.mapping_request',side_effect=ConnectionError('Unavailable')):
                # A different financial book requires a new independent proof.
                mappings,used,failures=ids.resolve_venue_tickers(book['data']['Holdings'],share,
                    binding['sourceUrl'],'f'*64,binding['asOf'],NOW)
            self.assertEqual(mappings,{('VVX US','USD'):'US92242T1016'})
            self.assertEqual(used,[proof]);self.assertEqual(len(failures),1)
            after=json.loads(path.read_text())
            self.assertEqual(after['venueTickerObservations'],initial['venueTickerObservations'])
            self.assertTrue(any(r['Label']=='VVX US' and r['ISIN']==''for r in book['data']['Holdings']))

    def test_expired_proof_cannot_resolve_a_native_unknown_row_after_failed_renewal(self):
        subject='IE000YYE6WK5';book=FIXTURE['books'][subject]
        proof=next(p for p in FIXTURE['proofs'].values()if p['issuerBinding']['subjectIsin']==subject)
        binding=proof['issuerBinding']
        with tempfile.TemporaryDirectory()as tmp:
            path=Path(tmp)/'cache.json';path.write_text(json.dumps({'schemaVersion':1,'observations':{},
                'venueTickerObservations':{subject+'|VVX US|USD':proof}}))
            with patch.object(ids,'PATH',path),patch('wisdomtree_api_holdings.mapping_request',side_effect=ConnectionError('Unavailable')):
                mappings,used,failures=ids.resolve_venue_tickers(book['data']['Holdings'],{'isin':subject},
                    binding['sourceUrl'],'f'*64,binding['asOf'],NOW+dt.timedelta(days=365))
            self.assertEqual(mappings,{})
            self.assertEqual(used,[]);self.assertEqual(len(failures),1)
            self.assertEqual(json.loads(path.read_text())['venueTickerObservations'][subject+'|VVX US|USD'],proof)

    def test_existing_same_book_proof_needs_no_new_query(self):
        subject='IE000YYE6WK5';book=FIXTURE['books'][subject]
        proof=next(p for p in FIXTURE['proofs'].values()if p['issuerBinding']['subjectIsin']==subject)
        binding=proof['issuerBinding']
        with tempfile.TemporaryDirectory()as tmp:
            path=Path(tmp)/'cache.json';path.write_text(json.dumps({'schemaVersion':1,'observations':{},
                'venueTickerObservations':{subject+'|VVX US|USD':proof}}))
            with patch.object(ids,'PATH',path),patch('wisdomtree_api_holdings.mapping_request')as request:
                mappings,used,failures=ids.resolve_venue_tickers(book['data']['Holdings'],{'isin':subject},
                    binding['sourceUrl'],binding['sourceSha256'],binding['asOf'],NOW)
            request.assert_not_called();self.assertEqual(mappings,{('VVX US','USD'):'US92242T1016'})
            self.assertEqual(used,[proof]);self.assertEqual(failures,[])

    def test_shared_collector_preserves_all_native_weights_and_has_no_name_join(self):
        import collect_physical_holdings as physical
        configs=json.loads((ids.ROOT/'scripts/generated-holdings-sources.json').read_text())
        for subject,book in FIXTURE['books'].items():
            raw=base64.b64decode(FIXTURE['rawBase64'][subject]);share=configs[subject]
            native,stamp,excluded=physical.vaneck_composition(book,share,NOW)
            binding=next(p['issuerBinding']for p in FIXTURE['proofs'].values()if p['issuerBinding']['subjectIsin']==subject)
            self.assertEqual(physical.digest(raw),binding['sourceSha256'])
            with tempfile.TemporaryDirectory()as tmp:
                path=Path(tmp)/'cache.json';path.write_text(json.dumps({'schemaVersion':1,'observations':{},'venueTickerObservations':FIXTURE['proofs']}))
                with patch.object(ids,'PATH',path),patch.object(physical,'public_page',return_value='page'),\
                        patch.object(physical,'vaneck_url',return_value=binding['sourceUrl']),\
                        patch.object(physical,'download',return_value=raw),\
                        patch('wisdomtree_api_holdings.mapping_request')as request:
                    result=physical.collect_vaneck(share,NOW)
                request.assert_not_called()
                self.assertEqual(result['asOf'],stamp)
                self.assertEqual(result['excludedWeightPctByType'],excluded)
                self.assertEqual(result['unidentifiedSecurityCount'],0)
                self.assertEqual([(r['name'],r['weightPct'])for r in result['rows']],
                                 [(r['name'],r['weightPct'])for r in native])
                self.assertEqual(len(result['rows']),len(native))


if __name__=='__main__':unittest.main()
