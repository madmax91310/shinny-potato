import csv,datetime as dt,io,json,unittest
from collect_topix_holdings import jpx_rows,identity_rows,combine,HEADERS,qualify_share
NOW=dt.datetime(2026,10,20,tzinfo=dt.timezone.utc)
def fixture():
 out=io.StringIO();writer=csv.writer(out);writer.writerow(HEADERS)
 for i in range(1000,2000):writer.writerow(['20260831','企業 '+str(i),str(i),'機械','0.1000%','TOPIX Small 1'])
 writer.writerow(['（注1）説明','','','','',''])
 return out.getvalue().encode('cp932')
def identities():
 return {'aaData':[[str(i),'Name '+str(i),'Machinery','Equity',{}, {'raw':20}, {}, {}, '-', 'JP'+str(i).zfill(9)+'0','-',{},'Japan','Tokyo Stock Exchange','JPY','1.00','JPY']for i in range(1000,2000)]}
class Topix(unittest.TestCase):
 def test_index_weights_never_come_from_identity_fund(self):
  rows,stamp=jpx_rows(fixture(),NOW);data=identities();ids=identity_rows(json.dumps(data).encode());a=combine(rows,ids,stamp)
  for row in data['aaData']:row[5]['raw']=0.001
  b=combine(rows,identity_rows(json.dumps(data).encode()),stamp)
  self.assertEqual(a,b);self.assertEqual(len(a['rows']),1000);self.assertEqual(a['rows'][0]['weightPct'],0.1)
  self.assertEqual(a['basis'],'index');self.assertEqual(a['asOf'],'2026-08-31')
 def test_unidentified_member_weight_is_retained_without_scaling(self):
  rows,stamp=jpx_rows(fixture(),NOW);data=identities();data['aaData'][0][13]='-'
  result=combine(rows,identity_rows(json.dumps(data).encode()),stamp)
  self.assertEqual(result['unidentifiedWeightPct'],0.1);self.assertEqual(result['unidentifiedSecurityCount'],1)
  self.assertIsNone(result['rows'][0]['isin']);self.assertEqual(result['rows'][0]['weightPct'],0.1)
 def test_truncation_mixed_dates_bad_totals_and_schema_are_rejected(self):
  for bad in [fixture().replace(b'20260831',b'20260830',1),fixture().replace(b'0.1000%',b'5.0000%',1),fixture().replace(b'1001',b'1000'),fixture().splitlines()[0]+b'\n',fixture().replace(b'0.1000%',b'nan%',1)]:
   with self.assertRaises(ValueError):jpx_rows(bad,NOW)
 def test_exact_share_benchmark_and_date_are_required(self):
  text="Amundi PEA Japon (TOPIX) UCITS ETF EUR Acc REPORTING 30/09/2026 Objectif d'investissement performance de l’indice TOPIX (« l’Indice ») (.TOPXDV) (TPXDDVD) FR0013411980"
  self.assertEqual(qualify_share(text,'FR0013411980',NOW),'2026-09-30')
  for wrong in [text.replace('TOPIX («','TOPIX 100 («'),text.replace('TPXDDVD','OTHER'),text.replace('30/09/2026','30/11/2026')]:
   with self.assertRaises(ValueError):qualify_share(wrong,'FR0013411980',NOW)
  with self.assertRaises(ValueError):qualify_share(text,'FR0013411998',NOW)

 def test_duplicate_identity_and_wrong_row_shape_rejected(self):
  data=identities();data['aaData'].append([*data['aaData'][0][:9],'JP0000000990',*data['aaData'][0][10:]])
  with self.assertRaises(ValueError):identity_rows(json.dumps(data).encode())
  data=identities();data['aaData'][0].pop()
  with self.assertRaises(ValueError):identity_rows(json.dumps(data).encode())
if __name__=='__main__':unittest.main()
