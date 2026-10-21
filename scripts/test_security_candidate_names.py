import unittest
from security_identifier_observations import candidate_name, candidate_isins, refresh, configured_candidates


class CandidateNames(unittest.TestCase):
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
        self.assertEqual(candidate_name('Société Example Ltd'), candidate_name('Societe Example'))
        self.assertNotEqual(candidate_name('Alphabet Class A'), candidate_name('Alphabet Class C'))
        self.assertNotEqual(candidate_name('Samsung Electronics'), candidate_name('Samsung Life Insurance'))


if __name__ == '__main__': unittest.main()
