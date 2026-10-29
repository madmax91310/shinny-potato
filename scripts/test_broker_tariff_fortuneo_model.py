import copy,gzip,json,pathlib,unittest
from unittest.mock import patch
from broker_tariff_extensions import parse_supplement,SUPPLEMENT_SOURCES
from broker_document_sources import SourceDocument
from fortuneo_amundi_offer import parse,SOURCE,PAGE
from collect_broker_tariffs import collect,fetch_content
ROOT=pathlib.Path(__file__).resolve().parent/'fixtures/broker-tariffs'
RAW=gzip.decompress((ROOT/'fortuneo-amundi-page-data-20261029.json.gz').read_bytes()).decode()
BODY=json.loads(RAW)
def card(body):return body['result']['data']['content']['sections'][9]['contents'][3]
def change_legal(body,old,new):
 c=card(body)['bentoCardDescription']['references'][0]['content'];c['rich']=c['rich'].replace(old,new)
class OfficialFortuneoOffer(unittest.TestCase):
 def test_current_official_model_preserves_exact_values_and_legal_dates(self):
  broker,field,r=parse_supplement('fortuneo_amundi',SourceDocument(RAW,SOURCE),'2026-10-29')
  self.assertEqual((broker,field),('fortuneo','offerAmundi'))
  self.assertEqual(r['values'],{'purchaseFee':0,'minimumOrder':500,'maximumOrder':100000})
  self.assertEqual((r['start'],r['until']),('2026-09-01','2026-12-31'))
  self.assertEqual(r['sourceUrl'],SOURCE);self.assertEqual(r['referenceUrl'],PAGE)
  self.assertIsNone(r['asOf']);self.assertEqual(r['checkedAt'],'2026-10-29')
  self.assertEqual(r['dateStatus'],'not-published')
  self.assertIn('chaque achat',r['copy']['full']);self.assertNotIn('31.12',r['copy']['full'])
  self.assertEqual(r['offerFootnoteId'],'5UziVhSlPm6u0Hqd0GjCh4')
 def test_changed_bounds_propagate_only_when_card_and_legal_text_agree(self):
  d=copy.deepcopy(BODY);c=card(d);c['bentoCardDescription']['rich']=c['bentoCardDescription']['rich'].replace('500 € et 100 000 €','750 € et 50 000 €');change_legal(d,'500 € et 100 000 €','750 € et 50 000 €')
  r=parse(json.dumps(d),'2026-10-29')[2];self.assertEqual(r['values']['minimumOrder'],750);self.assertEqual(r['values']['maximumOrder'],50000);self.assertIn('750 à 50 000',r['copy']['full'])
 def test_legal_reference_missing_wrong_or_duplicate_fails(self):
  for mode in ['missing','wrong','duplicate','unknown-type']:
   d=copy.deepcopy(BODY);refs=card(d)['bentoCardDescription']['references']
   if mode=='missing':refs.clear()
   elif mode=='wrong':refs[0]['contentful_id']='OTHER'
   elif mode=='duplicate':refs.append(copy.deepcopy(refs[0]))
   else:refs[0]['__typename']='UnqualifiedContent'
   with self.subTest(mode=mode),self.assertRaises(ValueError):parse(json.dumps(d),'2026-10-29')
 def test_wrong_page_or_account_scope_is_not_rescued_by_matching_numbers(self):
  for mode in ['path','slug','scope']:
   d=copy.deepcopy(BODY)
   if mode=='path':d['path']='/assurance-vie'
   elif mode=='slug':d['result']['data']['content']['slug']='/assurance-vie'
   else:d['result']['data']['content']['seoRef']['title']='Compte assurance-vie'
   with self.subTest(mode=mode),self.assertRaises(ValueError):parse(json.dumps(d),'2026-10-29')
 def test_undated_inverse_and_changed_purchase_conditions_are_refused(self):
  changes=[('1er septembre 2026','septembre 2026'),('1er septembre 2026','1er septembre 2027'),('31 décembre 2026','32 décembre 2026'),("tous les ordres d'achats exécutés","le premier ordre d'achat exécuté"),('500 € et 100 000 €','750 € et 100 000 €'),('https://www.fortuneo.fr/bourse/freetrade-amundi/etf','https://unrelated.example/etf'),("L'offre peut être arrêtée à tout moment","texte de conditions remplacé")]
  for old,new in changes:
   d=copy.deepcopy(BODY);change_legal(d,old,new)
   with self.subTest(old=old),self.assertRaises((ValueError,KeyError)):parse(json.dumps(d),'2026-10-29')
 def test_unqualified_legacy_html_from_the_json_endpoint_is_not_success(self):
  text=(ROOT/'fortuneo_amundi.txt').read_text()
  with self.assertRaises(ValueError):parse_supplement('fortuneo_amundi',SourceDocument(text,SOURCE),'2026-10-29')
  with self.assertRaises(ValueError):parse_supplement('fortuneo_amundi',SourceDocument('<html>Access Denied</html>',SOURCE),'2026-10-29')
 def test_no_other_broker_values_or_old_success_dates_change_when_source_fails(self):
  baseline={'schemaVersion':1,'brokers':{'fortuneo':{'fields':{'offerAmundi':{'checkedAt':'2026-10-22','until':'2026-12-31','copy':{'full':'last qualified offer'}}}},'bd':{'values':{'fee':.99},'checkedAt':'2026-10-28'}}};original=copy.deepcopy(baseline)
  def offline(url):raise TimeoutError('isolated unavailable source')
  result,failures,_=collect(baseline,'2026-10-29',offline)
  self.assertEqual(result['brokers'],original['brokers']);self.assertIn('fortuneo_amundi',failures)
 def test_real_entry_point_applies_only_the_qualified_field_in_an_isolated_run(self):
  baseline={'schemaVersion':1,'brokers':{'fortuneo':{'fields':{},'profile':{}}}};calls=[]
  def fetch(url):
   calls.append(url)
   if url==SOURCE:return RAW
   raise TimeoutError('Other sources deliberately unavailable in isolated test')
  result,failures,_=collect(baseline,'2026-10-29',fetch)
  self.assertNotIn('fortuneo_amundi',failures);self.assertEqual(calls.count(SOURCE),1)
  field=result['brokers']['fortuneo']['fields']['offerAmundi']
  self.assertEqual(field['sourceUrl'],SOURCE);self.assertEqual(field['until'],'2026-12-31')
 def test_actual_download_is_bound_to_the_exact_public_json_endpoint(self):
  with patch('collect_broker_tariffs.download',return_value=(RAW.encode(),SOURCE))as fetch:
   result=fetch_content(SOURCE)
  self.assertEqual(result.source_url,SOURCE)
  validator=fetch.call_args.kwargs['url_validator']
  self.assertTrue(validator(SOURCE));self.assertFalse(validator('https://unrelated.example/page-data.json'));self.assertFalse(validator(SOURCE+'?other=1'))
if __name__=='__main__':unittest.main()
