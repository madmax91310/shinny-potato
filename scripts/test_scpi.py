import copy
import datetime as dt
import json
import pathlib
import unittest
import http.client
import io
import urllib.error
from unittest.mock import patch
from collect_scpi import MAX_PUBLICATION_BYTES, fetch, parse_remake, parse_iroko_conditions, split_chart, annual_iroko, refresh, validate, remake_price_history

FIXTURES = pathlib.Path(__file__).parent / 'fixtures/scpi'
TODAY = dt.date(2026, 10, 8)

class ScpiTests(unittest.TestCase):
    def assert_retained_financial(self,result,previous):
        clean=copy.deepcopy(result)
        for record in clean['records']:record.pop('collectionStatus',None)
        baseline=copy.deepcopy(previous)
        for record in baseline['records']:record.pop('collectionStatus',None)
        self.assertEqual(clean,baseline)

    def test_remake_explicit_years_from_official_2025_capital_table(self):
        # Tableau du rapport officiel lié sur remake.fr/documentation/ le 11/10/2026.
        url='https://www.remake.fr/wp-content/uploads/2026/08/Rapport-Annuel-Remake-Live-2025-1.pdf'
        annual=(FIXTURES/'remake-annual-2025-capital.txt').read_text()
        current={'asOf':'2026-06-30','value':204,'sourceUrl':'https://www.remake.fr/remake-live'}
        result=remake_price_history(annual,url,current,TODAY)
        self.assertEqual(result['years'],[{'asOf':f'{y}-12-31','value':204} for y in [2023,2024,2025]]+[{'asOf':'2026-06-30','value':204}])
        for bad in [annual.replace('2024      475', '2022      475'),annual.replace('2025     622', '2026     622')]:
            with self.assertRaises(ValueError):remake_price_history(bad,url,current,TODAY)

    def test_temporary_network_failure_retries_then_recovers(self):
        for error in [http.client.IncompleteRead(b'partial'), TimeoutError('timeout'), urllib.error.URLError('reset'), urllib.error.HTTPError('https://official.test',503,'Unavailable',{},None)]:
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

    def test_current_large_annual_report_still_fits_the_bounded_reader(self):
        # Observed Content-Length of the official 2025 ActivImmo report, 21/10/2026.
        body=b'%PDF-'+b'x'*(17_423_444-5)
        with patch('collect_scpi.urllib.request.urlopen',return_value=io.BytesIO(body)):
            self.assertEqual(len(fetch('https://official.test/annual.pdf')),17_423_444)

    def test_oversized_publication_is_rejected_without_retry(self):
        with patch('collect_scpi.urllib.request.urlopen',return_value=io.BytesIO(b'x'*(MAX_PUBLICATION_BYTES+1))) as request:
            with self.assertRaisesRegex(ValueError,'size limit'):fetch('https://official.test')
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
            self.assert_retained_financial(result,previous); self.assertEqual(report[0]['status'],'failure')

    def test_source_failure_and_regression_keeps_previous(self):
        previous={'records':[self.remake()]}
        def failed(today): raise RuntimeError('Source unavailable')
        self.assert_retained_financial(refresh(previous,{'remake-live':failed},TODAY)[0],previous)
        old=copy.deepcopy(previous['records'][0]);old['price']['asOf']='2026-03-31'
        self.assert_retained_financial(refresh(previous,{'remake-live':lambda today:old},TODAY)[0],previous)

    def test_current_bulletin_discovery_and_identity_failure_are_distinct(self):
        from collect_scpi import remake_bulletin,AwaitingPublication
        shell='<title>SCPI Remake Live</title><script data-repartition-data>[]</script>'*1+'<script data-repartition-data>[]</script><script data-scpi-perf-data>{}</script>'
        url='https://www.remake.fr/wp-content/uploads/2026/08/REMAKELIVE_BT2_2026.pdf'
        html=shell+'<a href="'+url+'">Télécharger le bulletin d’information</a>'
        self.assertEqual(remake_bulletin(html,TODAY),(url,'2026-06-30'))
        old='https://www.remake.fr/remake-live-bulletin-information-30-06-2026.pdf'
        self.assertEqual(remake_bulletin(shell+'<a href="'+old+'">Bulletin</a>',TODAY),(old,None))
        with self.assertRaises(AwaitingPublication):remake_bulletin(shell,TODAY)
        with self.assertRaisesRegex(ValueError,'identity'):remake_bulletin('<title>Access denied</title>',TODAY)
        with self.assertRaisesRegex(ValueError,'structure'):remake_bulletin(shell+'<a href="/new-bulletin.pdf">Bulletin</a>',TODAY)
        with self.assertRaises(AwaitingPublication):remake_bulletin(shell+'<a href="https://other.test/REMAKELIVE_BT2_2026.pdf">PDF</a>',TODAY)

    def test_missing_bulletin_waits_until_next_edition_is_due(self):
        from collect_scpi import AwaitingPublication, next_bulletin_due
        self.assertEqual(next_bulletin_due('2026-06-30'),dt.date(2026,11,14))
        self.assertEqual(next_bulletin_due('2026-12-31'),dt.date(2027,5,15))
        previous={'records':[self.remake()]};previous['records'][0]['snapshot']['asOf']='2026-06-30'
        def missing(today): raise AwaitingPublication('Missing current official bulletin')
        result,report=refresh(previous,{'remake-live':missing},dt.date(2026,10,17))
        self.assertEqual(result['records'][0]['checkedAt'],previous['records'][0]['checkedAt']);self.assertEqual(result['records'][0]['collectionStatus']['status'],'waiting-publication');self.assertEqual(report[0]['status'],'waiting');self.assertIn('2026-11-14',report[0]['reason'])
        status=result['records'][0]['collectionStatus']
        self.assertEqual(status['internalReviewDue'],'2026-11-14')
        self.assertIsNone(status['issuerPublicationDeadline'])
        self.assertNotIn('nextPublicationDue',status)
        self.assertEqual(refresh(previous,{'remake-live':missing},dt.date(2026,11,15))[1][0]['status'],'failure')
        def offline(today):raise TimeoutError('offline')
        failed,_=refresh(result,{'remake-live':offline},dt.date(2026,10,18))
        self.assertEqual(failed['records'][0]['collectionStatus']['status'],'failed')
        self.assertEqual(failed['records'][0]['collectionStatus']['lastAccessSuccessAt'],'2026-10-17')
        self.assert_retained_financial(failed,previous)
        self.assertEqual(refresh({'records':[]},{'remake-live':missing},dt.date(2026,10,17))[1][0]['status'],'failure')

    def test_successful_read_of_retained_quarter_is_not_an_issuer_deadline(self):
        previous={'records':[self.remake()]}
        record=self.remake();record['snapshot']['asOf']='2026-06-30';previous['records'][0]['snapshot']['asOf']='2026-06-30'
        record['checkedAt']='2026-10-23'
        result,report=refresh(previous,{'remake-live':lambda _:copy.deepcopy(record)},dt.date(2026,10,23))
        observed=result['records'][0]
        self.assertEqual(report[0]['status'],'success')
        self.assertEqual(observed['snapshot']['asOf'],'2026-06-30')
        self.assertEqual(observed['collectionStatus']['status'],'waiting-publication')
        self.assertEqual(observed['collectionStatus']['accessStatus'],'success')
        self.assertIsNone(observed['collectionStatus']['issuerPublicationDeadline'])

    def test_changed_conditions_fail_closed(self):
        text=(FIXTURES/'iroko-conditions.txt').read_text().replace('six (6) ans','sept (7) ans')
        with self.assertRaises(ValueError): parse_iroko_conditions(text,'Ticket d’entrée Dès 5 000 € Versement des revenus potentiels Mensuel')
        with self.assertRaises(ValueError): split_chart('const chartLabels = ["France"]; const chartValues = [50,50];')

"""Regression against the two newly published official T3 2026 layouts."""
import copy,datetime as dt,gzip,json,pathlib,unittest
from collect_iroko_snapshot import parse_snapshot
from collect_scpi import remake_bulletin,parse_remake,remake_portfolio,validate
F=pathlib.Path(__file__).with_name('fixtures')/'scpi';NOW=dt.date(2026,10,28)
def read(name):return gzip.decompress((F/(name+'.gz')).read_bytes()).decode()
class QuarterlyLayouts(unittest.TestCase):
 def iroko(self,text=None,pages=None):return parse_snapshot(text or read('iroko-t3-2026.txt'),pages or json.loads(read('iroko-t3-2026-bbox.json')),NOW)
 def test_iroko_exact_portfolio_date_not_document_validity(self):
  r=self.iroko();self.assertEqual(r['asOf'],'2026-09-30');self.assertEqual(len(r['countries']),8);self.assertEqual(len(r['sectors']),5);self.assertEqual(next(v['value']for v in r['countries']if v['label']=='France'),27.7);self.assertEqual(next(v['value']for v in r['sectors']if v['label']=='Entrepôts et Logistique'),8.7);self.assertAlmostEqual(sum(v['value']for v in r['sectors']),100)
 def test_iroko_missing_conflicting_future_or_wrong_period_refused(self):
  text=read('iroko-t3-2026.txt')
  for bad in [text.replace('Données du portefeuille Iroko Zen au','Validité du document au'),text+' Données du portefeuille Iroko Zen au 30/06/2026',text.replace('30/09/2026','30/09/2027'),text.replace('troisième trimestre 2026','quatrième trimestre 2026'),text.replace('30/09/2026','01/10/2026')]:
   with self.assertRaises(ValueError):self.iroko(text=bad)
 def test_iroko_unknown_labels_and_unbalanced_weights_do_not_get_normalised(self):
  original=json.loads(read('iroko-t3-2026-bbox.json'))
  for before,after in [('Italie','Autriche'),('27,7','37,7'),('Logistique','Autre')]:
   pages=copy.deepcopy(original);changed=False
   for p in pages:
    for w in p['words']:
     if w['text']==before:w['text']=after;changed=True
   self.assertTrue(changed)
   with self.assertRaises(ValueError):self.iroko(pages=pages)
 def remake(self):
  html,text=read('remake-t3-2026.html'),read('remake-t3-2026.txt');url,expected=remake_bulletin(html,NOW);r=validate(parse_remake(html,text,url,NOW),NOW);self.assertEqual(r['snapshot']['asOf'],expected);return r,text,json.loads(read('remake-t3-2026-bbox.json'))
 def test_remake_current_link_fee_and_dated_property_table(self):
  r,text,pages=self.remake();self.assertEqual(r['snapshot']['asOf'],'2026-09-30');self.assertIn('REMAKE_LIVE_BT_T3-2026.pdf',r['price']['sourceUrl']);self.assertIn('5 % TTC',r['conditions']['exit']);p=remake_portfolio(text,r['snapshot']['asOf'],r['price']['sourceUrl'],pages);self.assertEqual(p['buildings']['value'],78);self.assertEqual(p['occupancy']['value'],98.81);self.assertIn('franchise',p['occupancy']['basis'])
 def test_remake_property_count_cannot_borrow_another_snapshot(self):
  r,text,pages=self.remake()
  with self.assertRaisesRegex(ValueError,'date disagree'):remake_portfolio(text,'2026-06-30',r['price']['sourceUrl'],pages)
 def test_remake_wrapped_rent_free_basis_remains_required(self):
  r,text,pages=self.remake()
  for p in pages:
   for w in p['words']:
    if w['text']=='franchise':w['text']='other'
  with self.assertRaisesRegex(ValueError,'rent-free'):remake_portfolio(text,r['snapshot']['asOf'],r['price']['sourceUrl'],pages)


if __name__ == '__main__': unittest.main()
