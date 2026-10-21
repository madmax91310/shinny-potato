import unittest
from security_identifier_observations import candidate_name, refresh


class CandidateNames(unittest.TestCase):
    def test_network_budget_is_bounded_before_any_request(self):
        for budget in [0, 25, True, -1]:
            with self.assertRaises(ValueError):refresh(None, max_requests=budget)

    def test_nominal_currency_and_legal_labels_only_propose_queries(self):
        self.assertEqual(candidate_name('GOODWIN PLC GBP0.1'), candidate_name('Goodwin PLC'))
        self.assertEqual(candidate_name('nCino Inc'), candidate_name('NCINO'))
        self.assertEqual(candidate_name('Société Example Ltd'), candidate_name('Societe Example'))
        self.assertNotEqual(candidate_name('Alphabet Class A'), candidate_name('Alphabet Class C'))
        self.assertNotEqual(candidate_name('Samsung Electronics'), candidate_name('Samsung Life Insurance'))


if __name__ == '__main__': unittest.main()
