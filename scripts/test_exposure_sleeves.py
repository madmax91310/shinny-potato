import datetime as dt,unittest,copy,json
from collect_exposure_sleeves import equity_rows,parse_avantis,joined,issuer_classifications,silver_sector_report,classification_coverage,retain_previous_classification
NOW=dt.datetime(2026,10,16,tzinfo=dt.timezone.utc)
class EquitySleeves(unittest.TestCase):
 def body(self):
  p={'asOfDate':{'value':20261015}}
  p.update({k:{'value':v} for k,v in dict(isin=['US0000000001','FR0000000001','-'],issueName=['A','B','cash'],holdingPercent=[60,41,-1],assetClass=['Equity','Equity','FX'],countryOfRisk=['United States','France','European Union'],sectorName=['Technology','Financials','Cash']).items()})
  return {'componentsByNameMap':{'keyFundFacts':{'containersByNameMap':{'default':{'dataPointsByNameMap':{'isin':{'value':'EXACT'},'productStructure':{'value':'Physical'}}}}},'holdings':{'containersByNameMap':{'all':{'dataPointsByNameMap':p}}}}}
 def test_hedge_excluded_without_changing_source(self):
  body=self.body();original=copy.deepcopy(body);r,rows,_=equity_rows(body,'EXACT','https://official',NOW)
  self.assertEqual(body,original);self.assertEqual(r['equityNavPct'],101)
  self.assertAlmostEqual(sum(v['weightPct'] for v in r['countries']['rows']),100)
  self.assertEqual(len(rows),2);self.assertEqual(r['excludedClasses'],['FX'])
 def test_identity_truncation_shorts_and_invalid_totals(self):
  with self.assertRaises(ValueError):equity_rows(self.body(),'WRONG','url',NOW)
  for weights in [[60,-1,41],[60,20,-1],[60,float('nan'),41]]:
   b=self.body();b['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']['holdingPercent']['value']=weights
   with self.assertRaises(ValueError):equity_rows(b,'EXACT','url',NOW)
 def test_missing_classification_stays_missing(self):
  rows=[{'isin':'A','weightPct':80},{'isin':'B','weightPct':20}]
  r=joined(rows,'2026-10-15','https://holdings',{'A':{'countryOfRisk':'Taiwan','asOf':'2026-10-14','sourceUrl':'https://classification'}},NOW,'countries')
  self.assertEqual(sum(x['weightPct'] for x in r['rows']),80);self.assertEqual(r['unclassified'][0]['weightPct'],20)
  self.assertEqual(r['asOf'],'2026-10-14')
 def test_avantis_does_not_execute_javascript(self):
  prefix='productName:"Avantis Global Small Cap Value UCITS ETF",ticker:"AVWS",etfHoldingsAsOfDate:"2026/10/15",etfHoldings:'
  row={'name':'A','isin':'ISIN','weight':'100%','securityType':'FOREIGN COMMON STOCK'}
  self.assertEqual(parse_avantis(prefix+json.dumps([row]),NOW)[0][0]['weightPct'],100)
  with self.assertRaises((ValueError,json.JSONDecodeError)):parse_avantis(prefix+'[evil()]',NOW)
 def test_same_issuer_classification_uses_security_not_listing_country(self):
  prefix='productName:"Avantis International Small Cap Value ETF",ticker:"AVDV",etfHoldingsAsOfDate:"10/15/2026",etfHoldings:'
  rows=[{'isin':str(i),'securityType':'FOREIGN COMMON STOCK','country':'JAPAN','sector':'INFORMATION TECHNOLOGY'} for i in range(100)]
  got=issuer_classifications(prefix+json.dumps(rows),'Avantis International Small Cap Value ETF','AVDV',NOW)
  self.assertEqual(got[0]['countryOfRisk'],'Japan');self.assertEqual(got[0]['asOf'],'2026-10-15')
  with self.assertRaises(ValueError):issuer_classifications(prefix+json.dumps(rows),'WRONG','AVDV',NOW)
 def test_dated_complete_silver_sector_report_and_identity(self):
  from unittest.mock import patch
  header='Report as of 16 Oct 2026\nGlobal X Silver Miners UCITS ETF USD Acc\nISIN IE000UL6CLP7\nPortfolio 15 Oct 2026\nStocks 99.96 0.00 99.96'
  labels=['Basic Materials','Consumer Cyclical','Financial Services','Real Estate','Communication Services','Energy','Industrials','Technology','Consumer Defensive','Healthcare','Utilities']
  column='Sector Weightings % Equity\n'+'\n'.join(label+' '+('99.89' if i==0 else '0.11' if label=='Consumer Defensive' else '-') for i,label in enumerate(labels))
  with patch('collect_exposure_sleeves.pdf_text',side_effect=[header,column]):
   r=silver_sector_report(b'pdf fixture',NOW)
   self.assertEqual(r['asOf'],'2026-10-15');self.assertAlmostEqual(sum(x['weightPct'] for x in r['rows']),99.96);self.assertEqual(r['equityNavPct'],99.96);self.assertFalse(r['normalizationApplied'])
  for bad in [header.replace('IE000UL6CLP7','WRONG'),header.replace('15 Oct 2026','15 Jan 2026'),header.replace('0.00','1.00')]:
   with patch('collect_exposure_sleeves.pdf_text',return_value=bad):
    with self.assertRaises(ValueError):silver_sector_report(b'pdf fixture',NOW)
  for bad in [column.replace('% Equity','% Net'),column.replace('99.89','89.89'),column.replace('Utilities -','')]:
   with patch('collect_exposure_sleeves.pdf_text',side_effect=[header,bad]):
    with self.assertRaises(ValueError):silver_sector_report(b'pdf fixture',NOW)


 def test_original_nav_weights_preserve_non_equity_and_unclassified_remainders(self):
  rows=[{'isin':'A','weightPct':60},{'isin':'B','weightPct':20}]
  original=copy.deepcopy(rows)
  r=joined(rows,'2026-10-15','https://holdings',{'A':{'countryOfRisk':'Taiwan','asOf':'2026-10-14','sourceUrl':'https://classification'}},NOW,'countries')
  self.assertEqual(r['rows'],[{'name':'Taiwan','weightPct':60}]);self.assertEqual(r['unclassified'],[{'isin':'B','weightPct':20}])
  self.assertEqual(r['equityNavPct'],80);self.assertEqual(rows,original);self.assertFalse(r['normalizationApplied'])
  self.assertEqual(classification_coverage(r),75,'Quality ratio is separate from unchanged NAV exposure60')
 def test_nav_conversion_is_not_retained_as_a_false_coverage_drop(self):
  old={'rows':[{'name':'Taiwan','weightPct':99.94974369283291}],'checkedAt':'2026-11-12'}
  new={'rows':[{'name':'Taiwan','weightPct':99.44}],'unclassified':[{'isin':'B','weightPct':.05}],
       'weightBasis':'original-fund-nav-percentage','equityNavPct':99.49,'normalizationApplied':False}
  original=copy.deepcopy((old,new))
  self.assertAlmostEqual(classification_coverage(old),classification_coverage(new))
  self.assertFalse(retain_previous_classification(old,new,[{'error':'Unrelated supplier failure'}]))
  self.assertEqual((old,new),original)
 def test_real_classification_loss_and_unchanged_prior_clock_still_protected(self):
  old={'rows':[{'name':'Taiwan','weightPct':99.44}],'weightBasis':'original-fund-nav-percentage','equityNavPct':99.49,'checkedAt':'2026-11-12'}
  new={**old,'rows':[{'name':'Taiwan','weightPct':90}],'checkedAt':'2026-11-13'}
  self.assertTrue(retain_previous_classification(old,new,[{'error':'Classification source unavailable'}]))
  self.assertEqual(old['checkedAt'],'2026-11-12')
  self.assertFalse(retain_previous_classification(old,new,[]))
  self.assertFalse(retain_previous_classification(None,new,[{'error':'source'}]))
 def test_missing_or_invalid_nav_denominator_never_becomes_zero(self):
  for value in [None,0,float('nan'),-1,True]:
   with self.subTest(value=value),self.assertRaises(ValueError):
    classification_coverage({'rows':[],'weightBasis':'original-fund-nav-percentage','equityNavPct':value})
 def test_joined_invalid_raw_weights_or_empty_perimeter_are_refused(self):
  for value in [float('nan'),float('inf'),-1,True,101]:
   with self.subTest(value=value),self.assertRaises(ValueError):
    joined([{'isin':'A','weightPct':value}],'2026-10-15','https://holdings',{},NOW,'countries')
  with self.assertRaises(ValueError):joined([],'2026-10-15','https://holdings',{},NOW,'countries')

if __name__=='__main__':unittest.main()
