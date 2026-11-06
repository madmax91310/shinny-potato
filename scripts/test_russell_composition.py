import base64,copy,datetime as dt,io,json,pathlib,shutil,tempfile,unittest
from unittest.mock import patch
from PIL import Image
from collect_russell_composition import read_chart,collect,quarterly_holdings,collect_quarterly_holdings,WEIGHTS_URL,sector_disk,qualify_chart
from refresh_index_sources import merge_records,collect_one as refresh_index
ROOT=pathlib.Path(__file__).resolve().parents[1]
FIX=ROOT/'scripts/fixtures/russell-composition'
class RussellTests(unittest.TestCase):
 def test_exact_quarterly_membership_top_ten_and_dates(self):
  text=(FIX/'membership-2026-06-30.txt').read_text();now=dt.datetime(2026,10,10,tzinfo=dt.timezone.utc)
  result=quarterly_holdings(text,now)
  self.assertEqual(result['asOf'],'2026-06-30');self.assertEqual(result['membershipCount'],1023)
  self.assertEqual(result['rows'][0],['Nvidia Corp',6.732]);self.assertEqual(len(result['rows']),10)
  self.assertIn(['Alphabet Inc Cl A',3.003],result['rows']);self.assertIn(['Alphabet Inc Cl C',2.423],result['rows'])
  bads=[text.replace('Russell 1000®','Russell 1000® Growth'),text.replace('June 30, 2026','September 30, 2026',1),
        text.replace('6.732 United States','6.7320 United States'),text.replace('6.732 United States','96.732 United States'),
        text.replace('Apple Inc\n6.034','Nvidia Corp\n6.034'),text.replace('June 30, 2026','June 29, 2026')]
  for bad in bads:
   with self.subTest(mutant=bad[:30]),self.assertRaises(ValueError):quarterly_holdings(bad,now)
  for date in [dt.datetime(2026,6,29,tzinfo=dt.timezone.utc),dt.datetime(2027,1,1,tzinfo=dt.timezone.utc)]:
   with self.assertRaises(ValueError):quarterly_holdings(text,date)
  with self.assertRaises(ValueError):quarterly_holdings(text.split('\f')[0],now)
 def test_quarterly_collection_provenance_and_independent_merge(self):
  now=dt.datetime(2026,10,10,tzinfo=dt.timezone.utc);config={'id':'russell-1000','holdingsSourceUrl':WEIGHTS_URL}
  text=(FIX/'membership-2026-06-30.txt').read_text()
  with patch('collect_russell_composition.pdf_text',return_value=text):
   result=collect_quarterly_holdings(config,now,lambda _:b'official-quarterly-source')
  self.assertEqual(result['source']['url'],WEIGHTS_URL);self.assertEqual(result['source']['checkedAt'],'2026-10-10')
  prior={'russell-1000':{'facts':{'asOf':'2026-09-30','holdings':[]},'returns':{'asOf':'2026-09-30'}}}
  updated=merge_records(prior,[{'id':'russell-1000','holdings':result}])
  self.assertEqual(updated['russell-1000']['facts'],prior['russell-1000']['facts'])
  self.assertEqual(updated['russell-1000']['holdingsHistory']['2026-06-30'],result)
  rechecked=copy.deepcopy(result);rechecked['source']['checkedAt']='2026-10-11'
  again=merge_records(updated,[{'id':'russell-1000','holdings':rechecked}])
  self.assertEqual(again['russell-1000']['holdings']['source']['checkedAt'],'2026-10-11')
  self.assertEqual(again['russell-1000']['holdings']['asOf'],'2026-06-30')
  self.assertEqual(again['russell-1000']['holdingsHistory'],updated['russell-1000']['holdingsHistory'])
  self.assertEqual(merge_records(updated,[{'id':'russell-1000','errors':[{'field':'holdings','reason':'offline'}]}]),updated)
  older=copy.deepcopy(result);older['asOf']='2026-03-31'
  self.assertEqual(merge_records(updated,[{'id':'russell-1000','holdings':older}]),updated)
  with self.assertRaises(ValueError):collect_quarterly_holdings({**config,'holdingsSourceUrl':WEIGHTS_URL+'wrong'},now,lambda _:b'wrong')
 def test_monthly_and_quarterly_fail_independently(self):
  config={'id':'russell-1000','name':'Russell 1000','parser':'ftse','sourceUrl':'official-monthly','compositionParser':'russell-printed-composition','holdingsSourceUrl':WEIGHTS_URL}
  now=dt.datetime(2026,10,10,tzinfo=dt.timezone.utc)
  with patch('collect_russell_composition.collect_quarterly_holdings',return_value={'asOf':'2026-06-30'}),patch('collect_russell_composition.collect',side_effect=ValueError('monthly offline')):
   result=refresh_index(config,now)
  self.assertIn('holdings',result);self.assertNotIn('facts',result);self.assertEqual(result['errors'][0]['field'],'composition')
  with patch('collect_russell_composition.collect_quarterly_holdings',side_effect=ValueError('quarterly offline')),patch('collect_russell_composition.collect',return_value=json.loads((FIX/'facts-2026-09-30.json').read_text())):
   result=refresh_index(config,now)
  self.assertIn('facts',result);self.assertNotIn('holdings',result);self.assertEqual(result['errors'][0]['field'],'holdings')
 def test_circle_boundary_is_not_a_collinear_or_distorted_shape(self):
  import math
  points=[(round(380+160*math.cos(t/100)),round(410+160*math.sin(t/100)))for t in range(629)]
  cx,cy,r=sector_disk(points)
  self.assertAlmostEqual(cx,380,delta=1);self.assertAlmostEqual(cy,410,delta=1);self.assertAlmostEqual(r,160,delta=1)
  with self.assertRaises(ValueError):sector_disk([(x,10)for x in range(100)])
  with self.assertRaises(ValueError):sector_disk([(x,y*1.4)for x,y in points])
 @unittest.skipUnless(shutil.which('tesseract'),'Live OCR exercised in dedicated workflow')
 def test_current_chart_grey_extremum_preserves_printed_weights_and_threshold(self):
  image=Image.open(FIX/'chart-2026-10-31.png')
  with image,tempfile.TemporaryDirectory()as directory:
   # Reproduce the old non-grey bounding-box center, not a changed financial value.
   with patch('collect_russell_composition.sector_disk',return_value=(383.0,413.0,160.0)):
    with self.assertRaisesRegex(ValueError,'printed weight disagrees'):read_chart(image,2,directory)
   a,proof=qualify_chart(image,directory)
  self.assertEqual(proof['qualifiedScales'],[2,1]);self.assertEqual(proof['attempts'][1]['status'],'unreadable')
  self.assertEqual(len(a),11)
  self.assertEqual(dict(a)['💻 Technologie'],40.51)
  self.assertAlmostEqual(sum(v for _,v in a),100,delta=.1)
 def test_unreadable_retry_is_bounded_and_never_votes_away_financial_conflicts(self):
  values=[['Technology',40.51]]
  with patch('collect_russell_composition.read_chart',side_effect=[values,ValueError('Russell printed weight ambiguous'),values])as reader:
   rows,p=qualify_chart(None,'unused');self.assertEqual(rows,values);self.assertEqual(reader.call_count,3)
  for error in ['Russell printed weight disagrees with sector geometry','Russell sector total invalid']:
   with patch('collect_russell_composition.read_chart',side_effect=[values,ValueError(error)])as reader:
    with self.assertRaisesRegex(ValueError,error):qualify_chart(None,'unused')
    self.assertEqual(reader.call_count,2)
  with patch('collect_russell_composition.read_chart',side_effect=[values,ValueError('Russell printed weight ambiguous'),[['Technology',40.52]]]):
   with self.assertRaisesRegex(ValueError,'readings disagree'):qualify_chart(None,'unused')
 def fixture(self):
  data=json.loads((FIX/'chart-2026-09-30.json').read_text())
  return Image.open(io.BytesIO(base64.b64decode(data['png'])))
 @unittest.skipUnless(shutil.which('tesseract'),'Live OCR exercised in dedicated workflow')
 def test_printed_values_and_resolutions(self):
  with self.fixture()as image,tempfile.TemporaryDirectory()as directory:
   a=read_chart(image,2,directory);b=read_chart(image,3,directory)
  self.assertEqual(a,b);self.assertEqual(len(a),11);self.assertAlmostEqual(sum(v for _,v in a),100)
  self.assertEqual(dict(a)['💻 Technologie'],44.02);self.assertEqual(dict(a)['🪨 Matériaux'],1.53)
 @unittest.skipUnless(shutil.which('tesseract'),'Live OCR exercised in dedicated workflow')
 def test_changed_legend_or_missing_label_rejected(self):
  with self.fixture()as image,tempfile.TemporaryDirectory()as directory:
   bad=image.copy();bad.paste('white',(870,120,1400,170))
   with self.assertRaises(ValueError):read_chart(bad,2,directory)
   bad=image.copy();bad.paste('white',(170,165,280,205))
   with self.assertRaises(ValueError):read_chart(bad,2,directory)
 def test_exact_metadata_and_unweighted_holdings(self):
  config=next(c for c in json.loads((ROOT/'scripts/index-automation.json').read_text())['indices']if c['id']=='russell-1000')
  text=(FIX/'factsheet-2026-09-30.txt').read_text();now=dt.datetime(2026,10,9,tzinfo=dt.timezone.utc)
  with patch('collect_russell_composition.pdf_text',return_value=text),patch('collect_russell_composition.printed_sectors',return_value=([['Technology',100]],{})):
   facts=collect(config,now,fetch=lambda _:b'source')
  self.assertEqual(facts['constituents'],1022);self.assertEqual(facts['holdings'],[]);self.assertEqual(facts['asOf'],'2026-09-30')
  for bad in [text.replace('Russell 1000 Index','Russell 1000 Equal Weight'),text.replace('1,022','2,996'),text.replace('(As of 9/30/2026)','(As of 8/31/2026)',1)]:
   with patch('collect_russell_composition.pdf_text',return_value=bad),self.assertRaises(ValueError):collect(config,now,fetch=lambda _:b'source')
  with patch('collect_russell_composition.pdf_text',return_value=text),self.assertRaises(ValueError):collect(config,dt.datetime(2027,1,1,tzinfo=dt.timezone.utc),fetch=lambda _:b'source')
 def test_rejected_snapshot_does_not_replace_previous(self):
  prior={'russell-1000':{'facts':{'asOf':'2026-08-31','holdings':[['Legacy',1]]}}}
  self.assertEqual(merge_records(prior,[{'id':'russell-1000','errors':[{'field':'composition','reason':'Unreadable label'}]}]),prior)
if __name__=='__main__':unittest.main()
