import unittest
from unittest.mock import patch
import urllib.error
from issuer_documents import download


class Response:
    def __init__(self, body=b'official CSV'):
        self.body = body
    def __enter__(self):
        return self
    def __exit__(self, *args):
        return False
    def read(self, limit):
        return self.body


class DownloadRecoveryTests(unittest.TestCase):
    def test_slow_source_recovers_with_bounded_attempts_and_timeout(self):
        with patch('issuer_documents.urllib.request.build_opener') as make, patch('issuer_documents.time.sleep') as sleep:
            make.return_value.open.side_effect = [TimeoutError('read timed out'), TimeoutError('read timed out'), Response()]
            result = download('https://fred.stlouisfed.org/graph/fredgraph.csv?id=DEXTAUS', timeout=60, max_attempts=4)
            self.assertEqual(result, b'official CSV')
            self.assertEqual([c.kwargs['timeout'] for c in make.return_value.open.call_args_list], [60]*3)
            self.assertEqual([c.args[0] for c in sleep.call_args_list], [1, 2])

    def test_exhaustion_and_permanent_access_errors_are_not_silenced(self):
        for failure, attempts in [(TimeoutError('timeout'), 4), (urllib.error.HTTPError('https://example.org', 403, 'Forbidden', None, None), 1)]:
            with patch('issuer_documents.urllib.request.build_opener') as make, patch('issuer_documents.time.sleep'):
                make.return_value.open.side_effect = failure
                with self.assertRaises(type(failure)):
                    download('https://example.org', timeout=60, max_attempts=4)
                self.assertEqual(make.return_value.open.call_count, attempts)

    def test_download_policy_cannot_create_unbounded_retries(self):
        for settings in [{'max_attempts': 6}, {'max_attempts': True}, {'timeout': 1000}]:
            with self.assertRaises(ValueError):
                download('https://example.org', **settings)


if __name__ == '__main__':
    unittest.main()
