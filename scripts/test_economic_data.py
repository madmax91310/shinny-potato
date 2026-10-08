import copy
import pathlib
import unittest
import urllib.error
import types
from unittest.mock import patch
import collect_economic_data as c

FIXTURES=pathlib.Path(__file__).parent/'fixtures/economic'
class EconomicDataTests(unittest.TestCase):
 def test_official_household_snapshots(self):
  records={}
  for key in c.SOURCES:
   records.update(c.parse_households(key,(FIXTURES/f'{key}.html').read_bytes(),f'https://www.insee.fr/fr/statistiques/{c.SOURCES[key][0]}','2026-10-07'))
  self.assertEqual(len(records),29)
  for id_,expected in {'wealth-share':7,'wealth-top10':750400,'wealth-median':148100,'homeowners':57.2,'debt':45.6,'salary-top10':4334,'salary-median':2190,'young-wealth':26100,'inheritance':41,'donation':20}.items():
   self.assertEqual(records[id_]['value'],expected,id_)
  self.assertEqual(records['livret-assurance']['secondValue'],41.7)
  self.assertEqual(records['unexpected-expense']['referencePeriod'],'Début 2025')
 def test_period_rollover_and_provisional_flag(self):
  body=(FIXTURES/'living.html').read_bytes().replace(b'2025',b'2026').replace('provisoires'.encode(),b'definitives')
  result=c.parse_households('living',body,'https://www.insee.fr/fr/statistiques/1','2027-01-01')
  self.assertEqual(result['heating']['referencePeriod'],'Début 2026')
  self.assertFalse(result['heating']['provisional'])
 def test_missing_or_ambiguous_table_fails(self):
  body=(FIXTURES/'wealth.html').read_bytes()
  with self.assertRaises(ValueError): c.parse_households('wealth',body.replace(b'Figure 1',b'Other figure'),'url','2026-10-07')
  with self.assertRaises(ValueError): c.parse_households('wealth',body+body,'url','2026-10-07')
 def test_changed_table_scope_is_rejected(self):
  body=(FIXTURES/'living.html').read_bytes().replace('France métropolitaine'.encode(),b'France hors Mayotte')
  with self.assertRaises(ValueError):c.parse_households('living',body,'url','2026-10-07')
 def test_legal_rate_date_and_future_guard(self):
  body='<title>Livret A | Banque de France</title><p>Elle est de 1,7 % depuis le 1er août 2026</p>'.encode()
  self.assertEqual(c.parse_savings(body,'2026-10-07')['rate'],1.7)
  with self.assertRaises(ValueError): c.parse_savings(body,'2026-07-01')
 def test_ministry_fallback_and_scope(self):
  body='<h2>Le livret A</h2><p>Taux de rémunération : depuis le 1 er août 2026, le taux est fixé à 1,7 %.</p><h2>Le LEP</h2><p>Taux de rémunération : depuis le 1 er août 2026, le taux est fixé à 2,5 %.</p>'.encode()
  self.assertEqual(c.parse_ministry_savings(body,'2026-10-07')['rate'],1.7)
  with patch.object(c,'official_download',side_effect=[ValueError('HTTP 403'),body]):
   self.assertEqual(c.collect_savings('2026-10-07')['sourceUrl'],c.SAVINGS_ALTERNATIVE)
  with self.assertRaises(ValueError):c.parse_ministry_savings(body,'2026-07-01')
 def test_service_public_fallback(self):
  body='<title>Livret A et LEP | Service Public</title><p>À compter du 1er août 2026, le taux d’intérêt annuel du livret A est fixé à 1,7 %.</p>'.encode()
  with patch.object(c,'official_download',side_effect=ValueError('HTTP 403')),patch.object(c,'download',return_value=body):
   self.assertEqual(c.collect_savings('2026-10-07')['rate'],1.7)
  with self.assertRaises(ValueError):c.parse_public_savings(body,'2026-07-01')
 def test_scpi_conventions(self):
  body='<p>Des SCPI : rendement global immobilier 2025 : +3,1 %. Taux de distribution et variation de la valeur de réalisation.</p>'.encode()
  self.assertEqual(c.parse_scpi(body,'url','2026-10-07')['value'],3.1)
  with self.assertRaises(ValueError):c.parse_scpi(body.replace(b'global immobilier',b'global immobilier trimestriel'),'url','2026-10-07')
 def test_funds_population(self):
  text='Contrats individuels : nets de prélèvements sur encours, avant prélèvements sociaux. Taux de revalorisation en 2025 : 2,63 %. Contrats collectifs : taux de revalorisation en 2025 : 2,64 %.'
  with patch.object(c,'pdf_text',return_value=text): self.assertEqual(c.parse_funds_euros(b'pdf','url','2026-10-07')['value'],2.63)
 def test_acpr_publication_catalogue_fallback(self):
  landing=c.ACPR+'/fr/publications-et-statistiques/publications/ndeg-182-revalorisation-2026-des-contrats-dassurance-vie'
  pdf=c.ACPR+'/system/files/2027-06/20270630_AS182_revalorisation_2026.pdf'
  def fetch(url):
   if url.endswith('/fr/publications-et-statistiques/etudes-et-recherche'):raise ValueError('catalogue inaccessible')
   if url.endswith('/fr/publications-acpr'):return f'<a href="{landing}">Rapport</a>'.encode()
   if url==landing:return f'<a href="{pdf}">PDF</a>'.encode()
   raise AssertionError(url)
  with patch.object(c,'official_download',side_effect=fetch):self.assertEqual(c.discover_acpr(),pdf)
  with patch.object(c,'pdf_text',return_value='Contrats individuels : nets de prélèvements sur encours, avant prélèvements sociaux. Taux de revalorisation en 2026 : 2,7 %.'):
   with self.assertRaises(ValueError):c.parse_funds_euros(b'pdf',pdf,'2026-10-08')
 def test_merge_is_atomic_and_rejects_regression(self):
  state={'households':{'one':{'year':2025,'value':10}}};before=copy.deepcopy(state)
  with self.assertRaises(ValueError): c.merge(state,'households',{'two':{'year':2025,'value':20},'one':{'year':2024,'value':5}})
  self.assertEqual(state,before)
  self.assertEqual(c.merge(state,'households',{'one':{'year':2026,'value':11}})['households']['one']['value'],11)
 def test_acpr_pagination_route_survives_catalogue_403(self):
  landing=c.ACPR+'/fr/publications-et-statistiques/publications/ndeg-180-revalorisation-2025-des-contrats-dassurance-vie-et-de-capitalisation'
  pdf=c.ACPR+'/system/files/2026-06/20260630_AS180_revalorisation_2025.pdf'
  def fetch(url):
   if url.endswith('etudes-et-recherche'):raise ValueError('HTTP 403')
   if url.endswith('etudes-et-recherche?page=0'):return f'<a href="{landing}">Rapport annuel</a>'.encode()
   if url==landing:return f'<a href="{pdf}">Rapport PDF</a>'.encode()
   raise AssertionError(url)
  with patch.object(c,'official_download',side_effect=fetch):self.assertEqual(c.discover_acpr(),pdf)
  # An unrelated official report or a third-party PDF cannot recertify this series.
  with patch.object(c,'official_download',return_value=b'<a href="https://example.com/AS180_revalorisation_2025.pdf">PDF</a>'):
   with self.assertRaises(ValueError):c.discover_acpr()
 def test_public_403_uses_bounded_system_client(self):
  url=c.ACPR+'/fr/publications-et-statistiques/etudes-et-recherche'
  def client(args,**kwargs):
   self.assertIn('--fail',args);self.assertIn('--max-filesize',args)
   self.assertEqual(args[args.index('--proto-redir')+1],'=https')
   self.assertNotIn('--insecure',args);self.assertEqual(args[-1],url)
   pathlib.Path(args[args.index('--output')+1]).write_bytes(b'<html>Official catalogue</html>')
   return types.SimpleNamespace(returncode=0,stderr=b'')
  with patch.object(c,'download',side_effect=urllib.error.HTTPError(url,403,'Forbidden',{},None)),patch.object(c.subprocess,'run',side_effect=client):
   self.assertEqual(c.official_download(url),b'<html>Official catalogue</html>')
  with patch.object(c,'download',side_effect=urllib.error.HTTPError(url,403,'Forbidden',{},None)),patch.object(c.subprocess,'run',side_effect=client):
   with self.assertRaises(ValueError):c.official_download(url,max_bytes=1)
 def test_system_client_failure_and_other_domains_remain_failures(self):
  url=c.ACPR+'/sitemap.xml'
  with patch.object(c,'download',side_effect=urllib.error.HTTPError(url,403,'Forbidden',{},None)),patch.object(c.subprocess,'run',return_value=types.SimpleNamespace(returncode=22,stderr=b'HTTP 403')):
   with self.assertRaises(ValueError):c.official_download(url)
  with patch.object(c,'download',side_effect=urllib.error.HTTPError(url,403,'Forbidden',{},None)),patch.object(c.subprocess,'run') as client:
   with self.assertRaises(ValueError):c.official_download('https://example.com/catalogue')
   client.assert_not_called()
if __name__=='__main__':unittest.main()
