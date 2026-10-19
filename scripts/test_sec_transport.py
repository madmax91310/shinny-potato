import os
import unittest
from unittest.mock import patch
import urllib.error
import sec_transport as sec


class SecTransportTests(unittest.TestCase):
    def setUp(self):
        sec._next_request = sec._blocked_until = 0
        self.url = 'https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json'

    def test_shared_pacing_and_no_throttling_of_other_sources(self):
        waits = []
        for _ in range(3):
            sec.before_request(self.url, clock=lambda: 100, sleep=waits.append)
        self.assertEqual(waits, [.25, .5])
        sec.before_request('https://example.org', clock=lambda: 100, sleep=waits.append)
        self.assertEqual(waits, [.25, .5])

    def test_refusal_opens_circuit_then_allows_later_probe(self):
        sec.refused(self.url, clock=lambda: 100)
        with self.assertRaises(urllib.error.HTTPError) as caught:
            sec.before_request(self.url, clock=lambda: 101)
        self.assertEqual(caught.exception.code, 403)
        self.assertIn('SEC_USER_AGENT', str(caught.exception))
        sec.before_request(self.url, clock=lambda: 401)

    def test_real_configured_identity_and_no_header_injection(self):
        with patch.dict(os.environ, {'SEC_USER_AGENT': ''}):
            self.assertEqual(sec.user_agent(), 'EpargnantLibre/1.0 lepargnantlibre@gmail.com')
        with patch.dict(os.environ, {'SEC_USER_AGENT': 'Test operator contact@example.org'}):
            self.assertEqual(sec.user_agent(), 'Test operator contact@example.org')
        with patch.dict(os.environ, {'SEC_USER_AGENT': 'invalid\nheader'}):
            with self.assertRaises(ValueError):
                sec.user_agent()
        self.assertFalse(sec.is_sec('https://data.sec.gov.example.org'))


if __name__ == '__main__':
    unittest.main()
