import unittest
import datetime as dt
import json,io,tempfile
from pathlib import Path
from unittest.mock import patch
from security_identifier_observations import qualified,digest,API,retain_identifier_proof
from security_identifier_observations import candidate_name, candidate_isins, refresh, configured_candidates, retained_identity_pairs


class CandidateNames(unittest.TestCase):
    def evidence(self,checked='2026-10-20T00:00:00+00:00'):
        body={'data':[{'figi':'BBG000B9XRY4','shareClassFIGI':'BBG001S5N8V8','securityType':'Common Stock','marketSector':'Equity'}]}
        response=[body,body]
        return {'sourceUrl':API,'checkedAt':checked,'request':[{'idType':'ID_SEDOL','idValue':'B59RGY2'},{'idType':'ID_ISIN','idValue':'US58933Y1055'}],'response':response,'sha256':digest(response),'status':'qualified'}

    def test_failed_identifier_renewal_retains_the_original_proof_and_clock(self):
        now=dt.datetime(2026,10,29,tzinfo=dt.timezone.utc);old=self.evidence()
        bad={**self.evidence('2026-10-29T00:00:00+00:00'),'response':[{},{}]};bad['sha256']=digest(bad['response'])
        self.assertEqual(retain_identifier_proof(old,bad,now),old)
        self.assertEqual(qualified(retain_identifier_proof(old,bad,now),now),('B59RGY2','US58933Y1055'))
        expired=self.evidence('2024-01-01T00:00:00+00:00')
        self.assertEqual(retain_identifier_proof(expired,bad,now),expired)
        with self.assertRaises(ValueError):qualified(retain_identifier_proof(expired,bad,now),now)
        invalid={**old,'sha256':'bad'}
        self.assertEqual(retain_identifier_proof(invalid,bad,now),bad)

    def test_refresh_uses_the_qualified_feed_when_product_html_is_blocked(self):
        now=dt.datetime(2026,10,29,tzinfo=dt.timezone.utc)
        with tempfile.TemporaryDirectory()as directory:
            root=Path(directory);(root/'src/data').mkdir(parents=True)
            (root/'src/data/freshness-policy.json').write_text(json.dumps({'fields':{'etf.default':{'checkDays':7},'etf.staticCharacteristic':{'checkDays':365}}}))
            (root/'src/data/dca-complete-holdings.json').write_text(json.dumps({'fund':{'complete':True,'sha256':'a'*64,'asOf':'2026-10-23','rows':[{'isin':'US58933Y1055','name':'MERCK & CO INC'}]}}))
            path=root/'src/data/security-identifier-observations.json'
            share={'isin':'IE00BZ56SW52','currency':'USD','documentType':'wisdomtree-ucits','sourceUrl':'https://www.wisdomtree.com/gb/products/equities/global-quality-dividend-growth'}
            pending=[{'descriptorB':'B59RGY2','constituentName':'Merck & Co Inc/NJ','weightPct':2.8565,'candidateSourceUrl':'https://dataspanapi.wisdomtree.com/funddetails/rankings/','candidateAsOf':'2026-10-23','candidateShareIsin':share['isin']}]
            with patch('security_identifier_observations.ROOT',root),patch('security_identifier_observations.PATH',path),patch('security_identifier_observations.configured_candidates',return_value={}),patch('security_identifier_observations.requires_independent_identity',return_value=False),patch('collect_wisdomtree_holdings.IDENTITIES',[]),patch('collect_wisdomtree_holdings.known_shares',return_value=[share]),patch('collect_wisdomtree_holdings.public_identity_candidates',return_value=pending)as feed,patch('collect_wisdomtree_holdings.product_page',side_effect=ConnectionError('HTML blocked'))as html,patch('security_identifier_observations.urllib.request.urlopen',return_value=io.BytesIO(json.dumps(self.evidence()['response']).encode())):
                refresh(now,max_requests=1)
                record=json.loads(path.read_text())['observations']['B59RGY2']
                self.assertEqual(qualified(record,now),('B59RGY2','US58933Y1055'))
                self.assertEqual(record['candidateSource']['shareIsin'],share['isin'])
                feed.assert_called_once();html.assert_not_called()

    def test_network_budget_is_bounded_before_any_request(self):
        for budget in [0, 25, True, -1]:
            with self.assertRaises(ValueError):refresh(None, max_requests=budget)

    def test_nearby_names_propose_bounded_hypotheses_only(self):
        candidates={candidate_name('SCHNEIDER ELECTRIC'):{'FR0000121972'},
                    candidate_name('Merck & CO INC'):{'US58933Y1055'}}
        self.assertEqual(candidate_isins('Schneider Electric SE',candidates),{'FR0000121972'})
        self.assertEqual(candidate_isins('Merck & Co Inc/NJ',candidates),{'US58933Y1055'})
        self.assertEqual(candidate_isins('Unknown entirely different security',candidates),set())
        self.assertEqual(candidate_isins('Ambiguous',{'AMBIGUOUS':{str(i) for i in range(4)}}),set())

    def test_stale_retained_positions_cannot_suppress_independent_identity_renewal(self):
        now=dt.datetime(2026,10,21,tzinfo=dt.timezone.utc)
        row={'isin':'GB0003362992','sedol':'0336299','name':'Filtronic'}
        record={'complete':True,'sha256':'a'*64,'asOf':'2026-10-20','rows':[row]}
        self.assertEqual(retained_identity_pairs(record,now),[row])
        for changed in [{'asOf':'2026-10-01'},{'asOf':'2026-10-22'},{'complete':False},{'sha256':'invalid'},{'asOf':'invalid'}]:
            self.assertEqual(retained_identity_pairs({**record,**changed},now),[])

    def test_sourced_seeds_are_candidates_only_and_adr_stays_distinct(self):
        rows=configured_candidates()
        self.assertEqual(rows['0336299'],{'GB0003362992'})
        self.assertEqual(rows['BTCLFZ3'],{'US4629211073'})
        self.assertNotEqual(candidate_name('IQM ADR'),candidate_name('IQM ordinary shares'))

    def test_nominal_currency_and_legal_labels_only_propose_queries(self):
        self.assertEqual(candidate_name('GOODWIN PLC GBP0.1'), candidate_name('Goodwin PLC'))
        self.assertEqual(candidate_name('NICE ADR REPRESENTING'), candidate_name('Nice Ltd - Spon ADR'))
        self.assertEqual(candidate_name('MERCK &amp; CO INC'), candidate_name('Merck & Co Inc'))
        self.assertEqual(candidate_name('JOHNSON CONTROLS INTERNATION USD NPV'), candidate_name('Johnson Controls Internation'))
        self.assertEqual(candidate_name('nCino Inc'), candidate_name('NCINO'))
        self.assertEqual(candidate_name('AMADA Holdings Co Ltd'),candidate_name('Amada Co Ltd'))
        self.assertEqual(candidate_name('Société Example Ltd'), candidate_name('Societe Example'))
        self.assertNotEqual(candidate_name('Alphabet Class A'), candidate_name('Alphabet Class C'))
        self.assertNotEqual(candidate_name('Samsung Electronics'), candidate_name('Samsung Life Insurance'))


if __name__ == '__main__': unittest.main()
