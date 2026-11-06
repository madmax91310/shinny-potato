import copy
import datetime as dt
import gzip
import json
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch
from activimmo_scpi_geography import collect_geography, legend_url, parse_legend, read_legend

FIXTURES = Path(__file__).parent / 'fixtures/activimmo-geography'
HTML = gzip.open(FIXTURES / 'product.html.gz', 'rb').read()
IMAGE = (FIXTURES / 'geography.webp').read_bytes()
DATE = '2026-09-30'
EXPECTED = [('France',73.3),('Espagne',14.6),('Italie',3.8),('Allemagne',3.2),('Pays-Bas',2.7),('Irlande',1.5),('Portugal',.9)]
TEXT = '\n'.join(f'{label} : {value}%' for label,value in EXPECTED)

class ActivimmoGeographyTests(unittest.TestCase):
    def test_real_dated_issuer_legend_two_ocr_layouts(self):
        url=legend_url(HTML,DATE)
        self.assertIn('/2026/11/',url)  # upload date never becomes observation date
        rows=read_legend(IMAGE)
        self.assertEqual([(r['label'],r['value']) for r in rows],EXPECTED)
        self.assertEqual(sum(r['value'] for r in rows),100)
    def test_real_t3_parse_and_validation_with_fallback(self):
        from collect_extended_scpi import parse_activimmo
        from collect_scpi import validate
        docs=json.load(gzip.open(FIXTURES/'documents.json.gz','rt'))
        b,a,n,p=(docs[k] for k in ('bulletin','annual','note','annex'))
        calls=[]
        def geography(date):
            calls.append(date)
            return parse_legend(TEXT),{'asOf':date,'sourceUrls':['https://alderan.fr/scpi-activimmo/',legend_url(HTML,date)]}
        r=parse_activimmo(b['text'],b['pages'],a['text'],n['text'],p['text'],b['url'],a['url'],n['url'],p['url'],dt.date(2026,11,6),geography)
        validate(r,dt.date(2026,11,6))
        self.assertEqual(calls,[DATE]);self.assertEqual(r['snapshot']['asOf'],DATE)
        self.assertEqual(r['portfolio']['occupancy']['value'],91.5)
        self.assertEqual(r['portfolio']['tenants']['value'],366)
        self.assertEqual(r['portfolio']['buildings']['asOf'],'2025-12-31')
        self.assertEqual(r['snapshot']['sourceUrls'][0],b['url'])
        self.assertEqual(r['snapshot']['geographyEvidence']['asOf'],DATE)
        self.assertEqual(r['snapshot']['countries'],parse_legend(TEXT))
        with self.assertRaises(ValueError):
            parse_activimmo(b['text'],b['pages'],a['text'],n['text'],p['text'],b['url'],a['url'],n['url'],p['url'],dt.date(2026,11,6))
    def test_different_identity_date_period_scope_or_host_fails(self):
        for old,new in [(b'FOCUS SUR LE PATRIMOINE AU 30.09.2026',b'FOCUS SUR LE PATRIMOINE AU 30.06.2026'),
                        (b'Repartition_Geographique_T3_2026',b'Repartition_Geographique_T2_2026'),
                        (b'https://alderan.fr/wp-content/uploads/2026/11/Repartition_Geographique_',b'https://other.fr/wp-content/uploads/2026/11/Repartition_Geographique_'),
                        ('Répartition géographique'.encode(),'Répartition physique'.encode())]:
            with self.subTest(old=old):
                self.assertIn(old,HTML)
                with self.assertRaises(ValueError):legend_url(HTML.replace(old,new),DATE)
        with self.assertRaises(ValueError):legend_url(HTML.replace(b'<h1',b'<h3').replace(b'</h1>',b'</h3>'),DATE)
    def test_missing_duplicate_unknown_invalid_weights_fail(self):
        for text in [TEXT.split('\n',1)[1], TEXT+'\nFrance : 73.3%',TEXT.replace('France','Autriche'),TEXT.replace('73.3','173.3'),TEXT.replace('73.3','72.3'),TEXT.replace('73.3','nan'),'']:
            with self.subTest(text=text[:35]):
                with self.assertRaises(ValueError):parse_legend(text)
    def test_two_ocr_readings_must_agree(self):
        changed=TEXT.replace('73.3','73.2').replace('14.6','14.7')
        with patch('activimmo_scpi_geography.subprocess.check_output',side_effect=[TEXT.encode(),changed.encode()]):
            with self.assertRaisesRegex(ValueError,'disagree'):read_legend(IMAGE)
        with patch('activimmo_scpi_geography.subprocess.check_output',side_effect=subprocess.TimeoutExpired('tesseract',40)):
            with self.assertRaises(subprocess.TimeoutExpired):read_legend(IMAGE)
    def test_current_unchanged_source_is_really_requested_and_dated(self):
        requests=[]
        def fetch(url):
            requests.append(url)
            return HTML if len(requests)%2 else IMAGE
        with patch('activimmo_scpi_geography.read_legend',return_value=parse_legend(TEXT)):
            first=collect_geography(DATE,fetch);second=collect_geography(DATE,fetch)
        self.assertEqual(len(requests),4)
        self.assertEqual(first,second)
        self.assertEqual(first[1]['asOf'],DATE)
        self.assertEqual(first[1]['sourceUrls'],requests[:2])
    def test_network_or_empty_response_is_not_a_success(self):
        for error in [TimeoutError('offline'),ValueError('empty')]:
            def fetch(url):raise error
            with self.assertRaises(type(error)):collect_geography(DATE,fetch)
    def test_failed_legend_retains_prior_record_dates(self):
        from collect_scpi import refresh
        root=Path(__file__).resolve().parents[1]
        row=copy.deepcopy(next(r for r in json.loads((root/'src/data/automated-scpi.json').read_text())['records'] if r['id']=='activimmo'))
        def offline(today):raise ValueError('Incomplete geography legend')
        result,observations=refresh({'records':[row]},{'activimmo':offline},dt.date(2026,11,6))
        kept=result['records'][0]
        for key in ('snapshot','price','annual','portfolio','checkedAt'):self.assertEqual(kept[key],row[key])
        self.assertEqual(observations[0]['status'],'failure')
        self.assertEqual(kept['collectionStatus'].get('lastAccessSuccessAt'),row.get('collectionStatus',{}).get('lastAccessSuccessAt'))

if __name__=='__main__':unittest.main()
