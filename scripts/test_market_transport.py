import urllib.error
import unittest
from market_transport import chart_response
from refresh_monthly_history import collect_yahoo
from test_monthly_automation import CONFIG, NOW, chart

URL = 'https://query2.finance.yahoo.com/v8/finance/chart/TEST?interval=1d'


class MarketTransport(unittest.TestCase):
    def test_fallback_keeps_request_and_financial_checks(self):
        calls = []
        def fetch(url):
            calls.append(url)
            if 'query2.' in url: raise urllib.error.HTTPError(url, 403, 'denied', None, None)
            return chart('1mo' if 'interval=1mo' in url else '1d')
        result = collect_yahoo(CONFIG, NOW, fetch)
        self.assertEqual(result['points'], [['2026-01', 10]])
        self.assertEqual(len(calls), 4)
        self.assertTrue(all('query1.finance.yahoo.com' in url for url in result['sourceUrls']))
        def wrong(url):
            value = fetch(url)
            value['chart']['result'][0]['meta']['currency'] = 'EUR'
            return value
        with self.assertRaisesRegex(ValueError, 'identity/currency'): collect_yahoo(CONFIG, NOW, wrong)

    def test_financial_error_and_permanent_not_found_do_not_switch_source(self):
        for failure in [ValueError('wrong share'), urllib.error.HTTPError(URL,404,'missing',None,None)]:
            calls = []
            def fetch(url): calls.append(url); raise failure
            with self.assertRaises(type(failure)): chart_response(URL, fetch)
            self.assertEqual(calls, [URL])

    def test_exhaustion_remains_a_failure_and_other_hosts_are_rejected(self):
        calls = []
        def fetch(url): calls.append(url); raise TimeoutError('offline')
        with self.assertRaises(TimeoutError): chart_response(URL, fetch)
        self.assertEqual(len(calls), 2)
        for url in [URL.replace('query2.finance.yahoo.com','example.org'), URL+'#fragment']:
            with self.assertRaises(ValueError): chart_response(url, fetch)


if __name__ == '__main__': unittest.main()
