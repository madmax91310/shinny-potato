import io
import unittest
import urllib.error
from github_automation_transport import request_json,unseen_completed_runs


class Reply(io.BytesIO):
    def __init__(self,body=b'{"jobs":[]}',status=200):
        super().__init__(body)
        self.status=status


class GitHubRecovery(unittest.TestCase):
    def test_502_and_timeout_retry_safe_read_then_decode(self):
        attempts=[];waits=[]
        responses=[urllib.error.HTTPError('https://api.github.com',502,'Bad Gateway',{'Retry-After':'3'},None),TimeoutError('timeout'),Reply()]
        def open_request(request,**kwargs):
            attempts.append(request.get_method())
            item=responses.pop(0)
            if isinstance(item,Exception):raise item
            return item
        self.assertEqual(request_json('https://api.github.com','test-token',opener=open_request,sleep=waits.append),{'jobs':[]})
        self.assertEqual(attempts,['GET']*3)
        self.assertEqual(waits,[3,2])

    def test_uncertain_writes_and_permanent_reads_are_never_replayed(self):
        for method,code in [('POST',502),('PUT',503),('PATCH',429),('GET',403)]:
            calls=[]
            def fail(*args,**kwargs):
                calls.append(1)
                raise urllib.error.HTTPError('https://api.github.com',code,'failure',{},None)
            with self.assertRaises(urllib.error.HTTPError):
                request_json('https://api.github.com','test-token',method,{},opener=fail,sleep=lambda _:self.fail('No retry'))
            self.assertEqual(len(calls),1)
        self.assertIsNone(request_json('https://api.github.com','test-token','POST',{},opener=lambda *a,**k:Reply(b'',204)))
        rejected=urllib.error.HTTPError('https://api.github.com',422,'failure',{},io.BytesIO(b'{"message":"Validation failed","errors":[{"field":"sha","code":"missing"}]}'))
        def reject(*args,**kwargs):raise rejected
        with self.assertRaises(urllib.error.HTTPError)as caught:
            request_json('https://api.github.com','secret-token','PUT',{'private':'not logged'},opener=reject,sleep=lambda _:self.fail('No write retry'))
        notes=' '.join(caught.exception.__notes__)
        self.assertIn('Validation failed',notes);self.assertIn('sha',notes)
        self.assertNotIn('secret-token',notes);self.assertNotIn('not logged',notes)


    def test_exhaustion_is_visible_and_invalid_data_is_not_a_transport_retry(self):
        calls=[]
        def fail(*args,**kwargs):
            calls.append(1)
            raise TimeoutError('read operation timed out')
        with self.assertRaises(TimeoutError):
            request_json('https://api.github.com','test-token',opener=fail,sleep=lambda _:None)
        self.assertEqual(len(calls),3)
        with self.assertRaises(ValueError):
            request_json('https://api.github.com','test-token',opener=lambda *a,**k:Reply(b'<html>not data</html>'),sleep=lambda _:self.fail('No retry'))

    def test_missed_events_catch_up_once_and_keep_newer_attempts(self):
        def run(id,**extra):
            return {'id':id,'head_branch':'master','status':'completed','event':'schedule','conclusion':'failure',**extra}
        previous={'runId':10,'attempt':1}
        rows=[run(9),run(10),run(11),run(12,event='pull_request'),run(13,head_branch='feature'),run(14,status='in_progress'),run(15,conclusion='cancelled'),run(16,conclusion='success')]
        self.assertEqual([r['id'] for r in unseen_completed_runs(rows,previous)],[11,16])
        self.assertEqual([r['id']for r in unseen_completed_runs(rows,{'runId':11,'attempt':1})],[16])
        self.assertEqual(unseen_completed_runs(rows,{'runId':16,'attempt':1}),[])
        self.assertEqual(unseen_completed_runs([run(10,run_attempt=2)],previous)[0]['run_attempt'],2)


if __name__=='__main__':unittest.main()
