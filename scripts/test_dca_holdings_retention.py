"""Exercise the ordinary producer writer, including mixed successes and failures."""
import contextlib,copy,datetime as dt,io,json,pathlib,tempfile,unittest
from unittest.mock import patch
import collect_dca_complete_holdings as producer
import collect_physical_holdings
NOW=dt.datetime(2026,10,29,tzinfo=dt.timezone.utc)

class Retention(unittest.TestCase):
 def test_failure_and_regression_preserve_other_observations_and_success_dates(self):
  for failure in ['transport','date-regression','gross-perimeter','missing-published-field']:
   with self.subTest(failure=failure),tempfile.TemporaryDirectory() as folder:
    root=pathlib.Path(folder);(root/'scripts').mkdir();(root/'src/data').mkdir(parents=True)
    previous={i:{'asOf':'2026-10-27','checkedAt':'2026-10-28T07:00:00+00:00','basis':'fund','complete':True,
     'sourceUrl':'https://issuer.example/'+i,'rows':[{'isin':'US0378331005','name':'Apple','weightPct':100}]}for i in ['failed','ok','untouched']}
    for name,value in [('dca-complete-holdings-sources.json',{'failed':{'parser':'fixture','isin':'failed'},'ok':{'parser':'fixture','isin':'ok'}}),
     ('generated-holdings-sources.json',{}),('dca-equity-identities.json',{}),('dca-equity-extra-identities.json',{})]:
     (root/'scripts'/name).write_text(json.dumps(value))
    (root/'src/data/dca-complete-holdings.json').write_text(json.dumps(previous))
    diagnostic={'kind':'unsupported-gross-net-perimeter','asOf':'2026-10-28','checkedAt':'2026-10-29T00:00:00+00:00','financialDataQualified':False}
    (root/'src/data/dca-holdings-status.json').write_text(json.dumps({'failed':{'lastRejectedObservation':diagnostic}}))
    def acquire(config,now):
     if config['isin']=='failed' and failure=='transport':raise ConnectionError('Official source unavailable')
     if config['isin']=='failed' and failure=='gross-perimeter':raise producer.HoldingsPerimeterError('Unsupported gross/net perimeter',diagnostic)
     if config['isin']=='failed' and failure=='missing-published-field':raise producer.HoldingsSourceError('Missing published weight',{**diagnostic,'kind':'missing-published-nav-weight'})
     return {**previous[config['isin']],'asOf':'2026-10-26'if config['isin']=='failed'else'2026-10-28'}
    argv=['producer','--apply','--output',str(root/'report.json')]
    with patch.object(producer,'ROOT',root),patch.dict(collect_physical_holdings.COLLECTORS,{'fixture':acquire}),patch('sys.argv',argv),contextlib.redirect_stdout(io.StringIO()):
     with self.assertRaises(SystemExit):producer.main()
    after=json.loads((root/'src/data/dca-complete-holdings.json').read_text())
    status=json.loads((root/'src/data/dca-holdings-status.json').read_text())
    self.assertEqual(after['failed'],previous['failed'])
    self.assertEqual(after['untouched'],previous['untouched'])
    self.assertEqual(after['ok']['asOf'],'2026-10-28')
    self.assertEqual(status['failed']['status'],'failed')
    self.assertEqual(status['failed']['lastSuccessAt'],previous['failed']['checkedAt'])
    self.assertEqual(status['failed']['asOf'],previous['failed']['asOf'])
    rejected=status['failed']['lastRejectedObservation']
    if failure=='date-regression':
     self.assertEqual(rejected['kind'],'older-source-observation')
     self.assertEqual(rejected['asOf'],'2026-10-26')
     self.assertEqual(rejected['retainedAsOf'],'2026-10-27')
     self.assertEqual(rejected['checkedAt'],status['failed']['checkedAt'])
     self.assertFalse(rejected['financialDataQualified'])
    elif failure=='missing-published-field':self.assertEqual(rejected,{**diagnostic,'kind':'missing-published-nav-weight'})
    else:self.assertEqual(rejected,diagnostic,'Rejected evidence keeps its original clock even on a later transport failure')
    self.assertEqual(status['ok']['status'],'validated')
    report=json.loads((root/'report.json').read_text())
    self.assertEqual(report['updated'],['ok'])
    self.assertEqual(report['errors'][0]['id'],'dca-holdings:failed')
    self.assertEqual(bool(report['rejectedObservations']),failure!='transport')
