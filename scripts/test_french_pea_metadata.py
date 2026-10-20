import copy,json,unittest
from pathlib import Path
from bs4 import BeautifulSoup
from collect_instrument_metadata import parse_json,parse_extraetf_pea
FIXTURES=Path(__file__).with_name('fixtures')/'metadata-connections'
EXTRA=(FIXTURES/'extraetf-pea.html').read_bytes()
DWS=json.loads((FIXTURES/'dws-french-pea.json').read_text())
ISIN='IE00BFMXXD54'
URL='https://extraetf.com/fr/etf-profile/'+ISIN
class FrenchPeaTests(unittest.TestCase):
 def extra(self,change):
  soup=BeautifulSoup(EXTRA,'html.parser');state=json.loads(soup.script.string);change(state);soup.script.string=json.dumps(state);return str(soup).encode()
 def test_real_negative_and_positive_boolean(self):
  self.assertEqual(parse_extraetf_pea(EXTRA,ISIN,URL),{'pea':False})
  body=self.extra(lambda s:s['2227822475']['b']['results'][0]['international_features']['fr'].update(PEA=True))
  self.assertEqual(parse_extraetf_pea(body,ISIN,URL),{'pea':True})
 def test_absence_null_or_string_is_not_negative(self):
  for value in [None,'false',0,'Non']:
   body=self.extra(lambda s:s['2227822475']['b']['results'][0]['international_features']['fr'].update(PEA=value))
   self.assertEqual(parse_extraetf_pea(body,ISIN,URL),{})
  body=self.extra(lambda s:s['2227822475']['b']['results'][0].pop('international_features'))
  self.assertEqual(parse_extraetf_pea(body,ISIN,URL),{})
 def test_related_or_wrong_share_is_not_profile(self):
  body=self.extra(lambda s:s['2227822475']['b']['results'][0].update(isin='IE000716YHJ7',holdings=[{'isin':ISIN,'international_features':{'fr':{'PEA':False}}}]))
  with self.assertRaises(ValueError):parse_extraetf_pea(body,ISIN,URL)
 def test_multiple_details_or_results_are_ambiguous(self):
  changes=[lambda s:s.update(another=copy.deepcopy(s['2227822475'])),lambda s:s['2227822475']['b']['results'].append(copy.deepcopy(s['2227822475']['b']['results'][0]))]
  for change in changes:
   with self.assertRaises(ValueError):parse_extraetf_pea(self.extra(change),ISIN,URL)
 def test_wrong_host_path_and_missing_state(self):
  for url in [URL.replace('extraetf.com','example.com'),URL.replace(ISIN,'IE000716YHJ7')]:
   with self.assertRaises(ValueError):parse_extraetf_pea(EXTRA,ISIN,url)
  with self.assertRaises(ValueError):parse_extraetf_pea(b'<html>PEA Non</html>',ISIN,URL)
 def test_duplicate_json_key_is_rejected(self):
  with self.assertRaises(ValueError):parse_extraetf_pea(EXTRA.replace(b'"PEA": false',b'"PEA": true,"PEA": false'),ISIN,URL)
 def test_dws_explicit_boolean_in_own_tax_panel(self):
  self.assertEqual(parse_json(json.dumps(DWS).encode(),'LU2903252349').get('pea'),False)
  doc=copy.deepcopy(DWS);panel=next(p for p in doc['pdpResult']['pageSections']['keyFacts']['accordionItems']if p['id']=='fundinformation-taxdata');panel['list']['items'][0]['value']=True
  self.assertEqual(parse_json(json.dumps(doc).encode(),'LU2903252349').get('pea'),True)
 def test_dws_absent_string_or_pme_are_not_pea(self):
  for key,value in [('Eligible au PEA',None),('Eligible au PEA','false'),('Eligible au PEA PME',False)]:
   doc=copy.deepcopy(DWS);panel=next(p for p in doc['pdpResult']['pageSections']['keyFacts']['accordionItems']if p['id']=='fundinformation-taxdata');panel['list']['items']=[{'key':key,'value':value,'type':'BOOL'}]
   self.assertNotIn('pea',parse_json(json.dumps(doc).encode(),'LU2903252349'))
 def test_dws_wrong_identity_or_duplicate_tax_statement(self):
  with self.assertRaises(ValueError):parse_json(json.dumps(DWS).encode(),ISIN)
  doc=copy.deepcopy(DWS);panel=next(p for p in doc['pdpResult']['pageSections']['keyFacts']['accordionItems']if p['id']=='fundinformation-taxdata');panel['list']['items']*=2
  with self.assertRaises(ValueError):parse_json(json.dumps(doc).encode(),'LU2903252349')
