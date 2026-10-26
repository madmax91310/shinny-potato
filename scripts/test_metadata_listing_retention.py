import copy,datetime as dt,json,tempfile,unittest,sys
from pathlib import Path
from unittest.mock import patch
from collect_instrument_metadata import merge_field_observation,main
ROOT=Path(__file__).resolve().parents[1];ISIN='IE00BYZK4776'
class Clock(dt.datetime):
 @classmethod
 def now(cls,tz=None):return cls(2026,10,27,12,tzinfo=dt.timezone.utc)
class ListingRetention(unittest.TestCase):
 def setUp(self):
  self.previous=copy.deepcopy(json.loads((ROOT/'src/data/automated-instrument-metadata.json').read_text())[ISIN]['listings'])
  self.paris=next(x for x in self.previous['value']if x['mic']=='XPAR')
  self.london=next(x for x in self.previous['value']if x['mic']=='XLON')
  self.observed={**self.previous,'checkedAt':'2026-10-27','value':[{**self.paris,'checkedAt':'2026-10-27','sha256':'a'*64}]}
 def test_partial_paris_success_retains_the_exact_london_source_and_date(self):
  before=copy.deepcopy(self.previous);result=merge_field_observation('listings',self.previous,self.observed)
  london=next(x for x in result['value']if x['mic']=='XLON');self.assertEqual(london,self.london)
  self.assertEqual(london['checkedAt'],'2026-10-26');self.assertEqual(result['checkedAt'],'2026-10-27');self.assertEqual(self.previous,before)
 def test_out_of_order_rows_and_field_do_not_regress_the_latest_receipts(self):
  stale={**self.observed,'value':[{**self.london,'checkedAt':'2026-10-25','sha256':'b'*64}]}
  self.assertEqual(next(x for x in merge_field_observation('listings',self.previous,stale)['value']if x['mic']=='XLON'),self.london)
  self.assertEqual(merge_field_observation('listings',self.previous,{**stale,'checkedAt':'2026-10-25'}),self.previous)
 def test_order_does_not_change_the_merged_list_and_other_fields_keep_existing_semantics(self):
  observed={**self.observed,'value':[self.london,*self.observed['value']]}
  reversed_old={**self.previous,'value':list(reversed(self.previous['value']))};reversed_new={**observed,'value':list(reversed(observed['value']))}
  self.assertEqual(merge_field_observation('listings',self.previous,observed),merge_field_observation('listings',reversed_old,reversed_new))
  self.assertEqual(merge_field_observation('domicile',{'checkedAt':'2026-10-26','value':'IE'},{'checkedAt':'2026-10-27','value':'IE'}),{'checkedAt':'2026-10-27','value':'IE'})
 def test_ordinary_entrypoint_keeps_london_after_partial_observation_and_subsequent_failure(self):
  with tempfile.TemporaryDirectory()as temp:
   root=Path(temp);(root/'scripts').mkdir();(root/'src/data').mkdir(parents=True)
   (root/'scripts/instrument-metadata-sources.json').write_text(json.dumps({'instruments':[{'isin':ISIN,'urls':['https://example.test']}] }))
   records=root/'src/data/automated-instrument-metadata.json';records.write_text(json.dumps({ISIN:{'listings':self.previous}}));(root/'src/data/instrument-metadata-status.json').write_text('{}')
   for suffix,values in [('partial',{'listings':self.observed}),('failed',{})]:
    args=['collector','--only',ISIN,'--apply','--output',str(root/(suffix+'.json'))]
    with patch('collect_instrument_metadata.dt.datetime',Clock),patch('collect_instrument_metadata.ROOT',root),patch.object(sys,'argv',args),patch('collect_instrument_metadata.collect',return_value=(values,[{'sourceUrl':'https://apidata.londonstockexchange.com/nrdp/v1?tidm=HEAL','error':'HTTP 503'}])):
     main()
    stored=json.loads(records.read_text())[ISIN]['listings'];self.assertEqual(next(x for x in stored['value']if x['mic']=='XLON'),self.london)
    status=json.loads((root/'src/data/instrument-metadata-status.json').read_text())[ISIN];self.assertTrue(status['errors'])
   report=json.loads((root/'failed.json').read_text());self.assertFalse(report['successes'],'A failed source must not become an unchanged-verified success')
 def test_probe_and_archive_projection_preserve_the_same_individual_receipts(self):
  import importlib
  for module_name in ['probe_instrument_metadata','replay_metadata_evidence']:
   module=importlib.import_module(module_name)
   for stale in [False,True]:
    with self.subTest(module=module_name,stale=stale),tempfile.TemporaryDirectory()as temp:
     root=Path(temp);(root/'scripts').mkdir();(root/'src/data').mkdir(parents=True)
     (root/'scripts/instrument-metadata-sources.json').write_text(json.dumps({'instruments':[{'isin':ISIN,'urls':['https://example.test']}]}))
     (root/'scripts/metadata-qualification-holds.json').write_text('{"instruments":[]}')
     (root/'src/data/automated-instrument-metadata.json').write_text(json.dumps({ISIN:{'listings':self.previous}}))
     observed={**self.observed,'checkedAt':'2026-10-25'}if stale else self.observed
     output=root/'records.json'
     if module_name=='probe_instrument_metadata':
      args=['probe','--only',ISIN,'--output',str(root/'probe'),'--records-output',str(output)]
      row={'isin':ISIN,'values':{'listings':observed},'documents':[]}
      with patch.object(module,'ROOT',root),patch.object(sys,'argv',args),patch.object(module,'probe',return_value=row):module.main()
     else:
      args=['replay','--archives',str(root/'archive'),'--output',str(root/'replay.json'),'--records-output',str(output)]
      with patch.object(module,'ROOT',root),patch.object(sys,'argv',args),patch.object(module,'load_documents',return_value={}),patch.object(module,'replay',return_value=({'listings':observed},[])):module.main()
     stored=json.loads(output.read_text())[ISIN]['listings']
     self.assertEqual(next(x for x in stored['value']if x['mic']=='XLON'),self.london)
     if stale:self.assertEqual(stored,self.previous,'Replay cannot renew or regress the original source proof')
if __name__=='__main__':unittest.main()
