import datetime as dt,io,json,pathlib,tempfile,unittest,urllib.error,zipfile
from unittest.mock import patch
import collect_ai_security_classifications as c
class FundClassifications(unittest.TestCase):
 def setUp(self):
  class Clock(dt.datetime):
   @classmethod
   def now(cls,tz=None):return cls(2026,10,22,tzinfo=dt.timezone.utc)
  clock=patch.object(c.dt,'datetime',Clock);clock.start();self.addCleanup(clock.stop)

 def test_declared_contact_and_refusal_short_circuit(self):
  url='https://www.sec.gov/files/dera/data/form-n-cen-data-sets/2026q3_ncen.zip'
  error=urllib.error.HTTPError(url,403,'Forbidden',{},None)
  with patch.object(c.sec_transport,'before_request')as pace,patch.object(c.sec_transport,'refused')as refused,patch.object(c,'download',side_effect=error)as fetch:
   with self.assertRaises(urllib.error.HTTPError):c.fetch_archive(url)
   pace.assert_called_once_with(url);refused.assert_called_once_with(url)
   self.assertIn('@',fetch.call_args.kwargs['headers']['User-Agent'])
 def test_all_failed_checks_preserve_evidence_and_registered_funds(self):
  with tempfile.TemporaryDirectory()as folder:
   dest=pathlib.Path(folder);prior={'checkedAt':'2026-09-01','registrants':{'1':{'name':'Known fund'}},'sources':[{'period':'2026q3','retrievedAt':'2026-09-01','sha256':'a'*64}]}
   path=dest/'sec-fund-classifications.json';path.write_text(json.dumps(prior))
   with patch.object(c,'DEST',dest),patch('sys.argv',['collector','--cache-dir',str(dest/'cache'),'--refresh']),patch.object(c,'fetch_archive',side_effect=TimeoutError('offline')):
    self.assertEqual(c.main(),1)
   result=json.loads(path.read_text());self.assertEqual(result['checkedAt'],prior['checkedAt']);self.assertEqual(result['registrants'],prior['registrants']);self.assertEqual(len(result['sources']),4)
   self.assertTrue(all(r['status']=='blocked'for r in result['sources']))
   retained=next(r for r in result['sources']if r['period']=='2026q3');self.assertEqual(retained['lastSuccessAt'],'2026-09-01');self.assertEqual(retained['lastValidSha256'],'a'*64)
 def test_parsed_success_records_real_source_date_and_filing_date_separately(self):
  buf=io.BytesIO()
  with zipfile.ZipFile(buf,'w')as z:
   z.writestr('SUBMISSION.tsv','ACCESSION_NUMBER\tFILING_DATE\nA\t01-Sep-2026\n');z.writestr('REGISTRANT.tsv','CIK\tACCESSION_NUMBER\tREGISTRANT_NAME\tINVESTMENT_COMPANY_TYPE\tLEI\n1\tA\tFund\tN-1A\tLEI\n')
  with tempfile.TemporaryDirectory()as folder:
   dest=pathlib.Path(folder)
   with patch.object(c,'DEST',dest),patch('sys.argv',['collector','--cache-dir',str(dest/'cache')]),patch.object(c,'fetch_archive',return_value=buf.getvalue()):self.assertEqual(c.main(),0)
   result=json.loads((dest/'sec-fund-classifications.json').read_text());self.assertEqual(result['registrants']['1']['filingDate'],'2026-09-01');self.assertTrue(result['checkedAt']);self.assertTrue(all(r['status']=='success'for r in result['sources']))
if __name__=='__main__':unittest.main()
