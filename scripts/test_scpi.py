import copy
import datetime as dt
import json
import pathlib
import unittest
import io
import urllib.error
from unittest.mock import patch
from collect_scpi import fetch, parse_remake, parse_iroko_conditions, split_chart, annual_iroko, refresh, validate

FIXTURES = pathlib.Path(__file__).parent / 'fixtures/scpi'
TODAY = dt.date(2026, 10, 8)

class ScpiTests(unittest.TestCase):
    def test_temporary_network_failure_retries_then_recovers(self):
        for error in [TimeoutError('timeout'), urllib.error.URLError('reset'), urllib.error.HTTPError('https://official.test',503,'Unavailable',{},None)]:
            with patch('collect_scpi.urllib.request.urlopen',side_effect=[error,io.BytesIO(b'%PDF-verified')]) as request, patch('collect_scpi.time.sleep'):
                self.assertEqual(fetch('https://official.test'),b'%PDF-verified')
                self.assertEqual(request.call_count,2)

    def test_retry_is_bounded_and_404_or_empty_is_not_retried(self):
        for error,count in [(TimeoutError('timeout'),3),(urllib.error.HTTPError('https://official.test',404,'Missing',{},None),1)]:
            with patch('collect_scpi.urllib.request.urlopen',side_effect=error) as request, patch('collect_scpi.time.sleep'):
                with self.assertRaises(type(error)):fetch('https://official.test')
                self.assertEqual(request.call_count,count)
        with patch('collect_scpi.urllib.request.urlopen',return_value=io.BytesIO(b'')) as request:
            with self.assertRaises(ValueError):fetch('https://official.test')
            self.assertEqual(request.call_count,1)

    def remake(self):
        return parse_remake((FIXTURES/'remake.html').read_text(), (FIXTURES/'remake-conditions.txt').read_text(), 'https://www.remake.fr/bulletin.pdf', TODAY)

    def test_observed_rates_not_targets_or_global_return(self):
        r = validate(self.remake(), TODAY)
        self.assertEqual(r['annual']['years'], [{'year':2023,'distribution':7.79},{'year':2024,'distribution':7.5},{'year':2025,'distribution':7.05}])
        self.assertEqual(r['conditions']['managementFee'], 18)
        self.assertEqual(r['conditions']['minimum'], 204)
        self.assertEqual(r['snapshot']['asOf'], '2026-06-30')

    def test_iroko_commission_does_not_capture_exit_fee(self):
        r = parse_iroko_conditions((FIXTURES/'iroko-conditions.txt').read_text(), 'Ticket d’entrée Dès 5 000 € Versement des revenus potentiels Mensuel')
        self.assertEqual(r['managementFee'], 14.4)
        self.assertEqual(r['minimum'], 5000)
        self.assertIn('avant 3 ans', r['exit'])
        self.assertIn('avant 6 ans', r['exit'])

    def test_iroko_completed_years_only_and_null_ignored(self):
        rows = [{'name':'distribution_yield','period':f'y-{year}','value':7,'update_date':f'{year}-12-31'} for year in range(2022,2027)]
        rows.append({'name':'target_distrib_yield','period':'y-2025','value':12,'update_date':'2025-12-31'})
        self.assertEqual([r['year'] for r in annual_iroko(rows,TODAY)], [2023,2024,2025])

    def test_missing_or_invalid_data_keeps_previous_row(self):
        previous={'records':[self.remake()]}
        for mutation in [lambda r:r['snapshot']['countries'].pop(), lambda r:r['annual']['years'].pop(), lambda r:r['snapshot']['sectors'][0].update(value=float('nan'))]:
            bad=copy.deepcopy(previous['records'][0]); mutation(bad)
            result, report=refresh(previous,{'remake-live':lambda today:bad},TODAY)
            self.assertEqual(result,previous); self.assertEqual(report[0]['status'],'failure')

    def test_source_failure_and_regression_keeps_previous(self):
        previous={'records':[self.remake()]}
        def failed(today): raise RuntimeError('Source unavailable')
        self.assertEqual(refresh(previous,{'remake-live':failed},TODAY)[0],previous)
        old=copy.deepcopy(previous['records'][0]);old['price']['asOf']='2026-03-31'
        self.assertEqual(refresh(previous,{'remake-live':lambda today:old},TODAY)[0],previous)

    def test_changed_conditions_fail_closed(self):
        text=(FIXTURES/'iroko-conditions.txt').read_text().replace('six (6) ans','sept (7) ans')
        with self.assertRaises(ValueError): parse_iroko_conditions(text,'Ticket d’entrée Dès 5 000 € Versement des revenus potentiels Mensuel')
        with self.assertRaises(ValueError): split_chart('const chartLabels = ["France"]; const chartValues = [50,50];')

if __name__ == '__main__': unittest.main()
