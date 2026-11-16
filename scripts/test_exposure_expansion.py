import copy
import datetime as dt
import json
import unittest
from pathlib import Path
from collect_exposure_expansion import qualify, qualify_refresh
from collect_dws_etf import parse_holdings
from collect_invesco_allocations import parse_allocations

class Expansion(unittest.TestCase):
    def test_explicit_recovery_selects_only_requested_existing_instruments(self):
        from collect_exposure_expansion import selected_instruments
        config=json.loads((Path(__file__).parent/'exposure-etf-expansion.json').read_text())['instruments']
        before=copy.deepcopy(config)
        self.assertEqual(selected_instruments(config,None),config)
        selected=selected_instruments(config,['LU0328475792'])
        self.assertEqual([s['isin']for s in selected],['LU0328475792'])
        self.assertEqual(config,before)
        for request in [[],['UNKNOWN'],['LU0328475792','UNKNOWN'],['LU0328475792','LU0328475792']]:
            with self.subTest(request=request),self.assertRaises(ValueError):
                selected_instruments(config,request)

    def test_missing_exposure_retains_actual_source_failure_reason(self):
        share={'isin':'LU0328475792'}
        value={**share,'unavailable':['composition: HTTP Error 403: Forbidden']}
        with self.assertRaisesRegex(ValueError,'Missing dated exposure: countries ; composition: HTTP Error 403'):
            qualify(value,share)
        value['unavailable']=['composition: Future DWS portfolio date']
        with self.assertRaisesRegex(ValueError,'Future DWS portfolio date'):
            qualify(value,share)

    def test_targeted_contract_preserves_other_items_and_detects_omitted_target(self):
        import hashlib
        import producer_report_plans as plans
        import producer_report_contract as contract
        p=plans.build_plan('collect_exposure_expansion',['--only','LU0328475792'],report_stem='exposure-expansion')
        self.assertEqual([r['instrument']for r in p['items']if r['selected']],['LU0328475792'])
        p.update(producer='collect_exposure_expansion',reportStem='exposure-expansion',declaredAt='2026-11-14T18:00:00Z',nonce='isolated-test')
        p['sha256']=hashlib.sha256(json.dumps(p,sort_keys=True).encode()).hexdigest()
        result=contract.finish({'shares':[]},p)['resultContract']
        errors=contract.normalize_contract(result)['errors']
        self.assertEqual([e['expectedId']for e in errors],['etf-exposure-expansion-LU0328475792'])
        self.assertTrue(all(x['status']=='not-attempted'and x['reason']for x in result['outcomes']if x['instrument']!='LU0328475792'))
        for request in [['--only','UNKNOWN'],['--only','LU0328475792','UNKNOWN']]:
            with self.assertRaisesRegex(ValueError,'Unknown producer target'):
                plans.build_plan('collect_exposure_expansion',request)

    def test_workflow_executes_exact_target_arguments_and_rejects_malformed_scope(self):
        import os, re, subprocess, tempfile, textwrap
        workflow=(Path(__file__).parents[1]/'.github/workflows/update-exposure-expansion.yml').read_text()
        block=workflow.split('name: Collect exact-share observations',1)[1].split('      - name:',1)[0]
        command=textwrap.dedent(block.split('        run: |\n',1)[1])
        with tempfile.TemporaryDirectory()as folder:
            root=Path(folder);binary=root/'python';output=root/'argv.json'
            binary.write_text('#!/usr/bin/env python3\nimport os,sys,json\nopen(os.environ["PROBE_ARGS"],"w").write(json.dumps(sys.argv[1:]))\n')
            binary.chmod(0o755)
            for value,targets in [('',[]),('LU0328475792',['LU0328475792']),('LU0328475792,LU0380865021',['LU0328475792','LU0380865021'])]:
                env={**os.environ,'PATH':str(root)+os.pathsep+os.environ['PATH'],'PROBE_ARGS':str(output),'RUNNER_TEMP':folder,'EXPOSURE_ISINS':value}
                result=subprocess.run(['bash','-c',command],env=env,capture_output=True,text=True)
                self.assertEqual(result.returncode,0,result.stderr)
                argv=json.loads(output.read_text())
                if targets:self.assertEqual(argv[argv.index('--only')+1:argv.index('--apply')],targets)
                else:self.assertNotIn('--only',argv)
                output.unlink()
            for value in [' ', 'LU0328475792,', ',LU0328475792', 'LU0328475792,,LU0380865021', 'LU0328475792;echo test']:
                env={**os.environ,'PATH':str(root)+os.pathsep+os.environ['PATH'],'PROBE_ARGS':str(output),'RUNNER_TEMP':folder,'EXPOSURE_ISINS':value}
                result=subprocess.run(['bash','-c',command],env=env,capture_output=True,text=True)
                self.assertEqual(result.returncode,2)
                self.assertFalse(output.exists(),'No collector started on malformed scope')

    def test_panx_exact_index_not_collateral_or_nasdaq(self):
        from collect_amundi_index_exposure import parse_product
        config=json.loads((Path(__file__).parent/'exposure-etf-expansion.json').read_text())
        share=next(s for s in config['instruments'] if s['isin']=='FR0013412269')
        product=json.loads((Path(__file__).parent/'fixtures/official-documents/amundi-panx-index.json').read_text())['products'][0]
        now=dt.datetime(2026,10,29,tzinfo=dt.timezone.utc)
        result=parse_product(product,share,now)
        self.assertEqual(result['holdings']['basis'],'index')
        self.assertFalse(result['holdings'].get('complete',False))
        self.assertEqual(len(result['holdings']['rows']),10)
        self.assertTrue(all(r['isin'] for r in result['holdings']['rows']))
        for field in ('countries','sectors','holdings'):
            self.assertEqual(result[field]['asOf'],'2026-10-27')
        for key,value in [('ISIN','FR0011871110'),('BENCHMARK_NAME','NASDAQ 100'),('FUND_REPLICATION_METHODOLOGY','Direct(Physical)')]:
            changed=copy.deepcopy(product);changed['characteristics'][key]=value
            with self.assertRaises(ValueError):parse_product(changed,share,now)

    def test_german_other_is_explicit_and_keeps_raw_weights_and_dates(self):
        from collect_ishares_german import normalize
        body={'productId':251931,'currencyCode':'EUR','componentsByNameMap':{
            'keyFundFacts':{'containersByNameMap':{'default':{'dataPointsByNameMap':{
                'isin':{'value':'DE0002635307'},'useOfProfitsCode':{'value':'ausschüttend'}}}}},
            'exposureBreakdowns':{'containersByNameMap':{
                'sector':{'asOfDate':20261028,'dataPointsByNameMap':{
                    'type':{'value':['Industrie','Sonstige']},'weight':{'value':[17.23,0.01]}}},
                'geography':{'subContainersByNameMap':{'countries':{'dataPointsByNameMap':{
                    'type':{'value':['Deutschland']},'weight':{'value':[12.34]}}}}}}},
            'holdings':{'containersByNameMap':{'all':{'dataPointsByNameMap':{
                'countryOfRisk':{'value':['Deutschland']},'assetClass':{'value':['Aktien']}}}}}}}
        original=copy.deepcopy(body)
        result=normalize(body)
        sector=result['componentsByNameMap']['exposureBreakdowns']['containersByNameMap']['sector']
        self.assertEqual(sector['dataPointsByNameMap']['type']['value'],['Industrials','Other'])
        self.assertEqual(sector['dataPointsByNameMap']['weight']['value'],[17.23,0.01])
        self.assertEqual(sector['asOfDate'],20261028)
        self.assertEqual(body,original,'Issuer proof is never rewritten')
        body['componentsByNameMap']['exposureBreakdowns']['containersByNameMap']['sector']['dataPointsByNameMap']['type']['value']=['New unknown sector']
        with self.assertRaises(KeyError):normalize(body)
        body=copy.deepcopy(original);body['productId']=123
        with self.assertRaises(ValueError):normalize(body)

    def test_real_german_jersey_label_preserves_every_published_row_and_weight(self):
        import gzip, hashlib
        from unittest.mock import patch
        import collect_ishares_german as german
        raw_bytes=gzip.decompress((Path(__file__).parent/'fixtures/ishares-german-20261116/official.json.gz').read_bytes())
        provenance=json.loads((Path(__file__).parent/'fixtures/ishares-german-20261116/provenance.json').read_text())
        self.assertEqual(hashlib.sha256(raw_bytes).hexdigest(),provenance['sha256'])
        raw=json.loads(raw_bytes); before=copy.deepcopy(raw)
        original=raw['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
        self.assertIn('Jersey',original['countryOfRisk']['value'])
        unsupported={k:v for k,v in german.COUNTRIES.items() if k!='Jersey'}
        with patch.object(german,'COUNTRIES',unsupported),self.assertRaisesRegex(KeyError,'Jersey'):
            german.normalize(raw)
        normal=german.normalize(raw)
        after=normal['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
        for key in original:
            if key not in ('countryOfRisk','assetClass'):self.assertEqual(after[key],original[key],key)
        jersey=original['countryOfRisk']['value'].index('Jersey')
        self.assertEqual(after['countryOfRisk']['value'][jersey],'Jersey')
        self.assertEqual(after['holdingPercent']['value'][jersey],0.0)
        self.assertEqual(len(after['issueName']['value']),len(original['issueName']['value']))
        self.assertEqual(raw,before,'Source proof and its published zero line remain immutable')
        changed=copy.deepcopy(raw)
        changed['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']['countryOfRisk']['value'][jersey]='Unqualified new territory'
        with self.assertRaises(KeyError):german.normalize(changed)

    def test_real_german_recovery_reaches_existing_registry_idempotently(self):
        import gzip
        from unittest.mock import patch
        import collect_ishares_german as german
        from apply_etf_collection import merge_collection
        raw=json.loads(gzip.decompress((Path(__file__).parent/'fixtures/ishares-german-20261116/official.json.gz').read_bytes()))
        share=next(s for s in json.loads((Path(__file__).parent/'exposure-etf-expansion.json').read_text())['instruments']if s['isin']=='DE0002635307')
        now=dt.datetime(2026,11,16,tzinfo=dt.timezone.utc)
        with patch.object(german,'get_json',return_value=raw):result=german.collect(share,now)
        for key in ('countries','countriesRisk','sectors','holdings'):
            self.assertEqual(result[key]['asOf'],'2026-11-13');self.assertEqual(result[key]['basis'],'fund')
        self.assertIn({'name':'Jersey','weightPct':0.0},result['countriesRisk']['rows'])
        self.assertEqual(len(result['holdings']['rows']),10)
        self.assertIsNot(result['holdings'].get('complete'),True)
        prior={share['isin']:{'currency':'EUR','productId':251931},'unrelated':{'preserved':'exact'}};before=copy.deepcopy(prior)
        report={'checkedAt':now.isoformat(),'shares':[result]}
        first=merge_collection(report,prior,{})
        self.assertEqual(first,merge_collection(report,first,{}));self.assertEqual(prior,before)
        self.assertEqual(first['unrelated'],prior['unrelated'])
        self.assertEqual(first[share['isin']]['countriesRisk']['rows'],result['countriesRisk']['rows'])
        for key,value in [('productId',1),('currencyCode','USD')]:
            changed=copy.deepcopy(raw);changed[key]=value
            with self.assertRaises(ValueError):german.normalize(changed)

    def test_wrong_share_and_incomplete_exposure_rejected(self):
        s={'isin':'IE00B3RBWM25'}
        with self.assertRaises(ValueError):qualify({'isin':'IE00BK5BQT80'},s)
        with self.assertRaises(ValueError):qualify(s,s)
        value={**s,'countries':{'asOf':'2026-09-30','rows':[{'name':'France','weightPct':20}]},'sectors':{'asOf':'2026-09-30','rows':[{'name':'Technology','weightPct':100}]}}
        with self.assertRaises(ValueError):qualify(value,s)
    def test_partial_pdf_preserves_full_country_date_and_rejects_stale(self):
        now=dt.datetime(2026,10,16,tzinfo=dt.timezone.utc)
        share={'isin':'IE00BKLF1R75','parser':'wisdomtree-html'}
        result={'isin':share['isin'],'sectors':{'asOf':'2026-08-31','rows':[{'name':'Industrials','weightPct':100}]},
                'unavailable':['countries: PDF publishes only ten countries; complete previous allocation preserved']}
        previous={'countries':{'asOf':'2026-10-15','rows':[{'name':'France','weightPct':100}],
                              'sourceUrl':'https://www.wisdomtree.com/gb/products','sha256':'evidence'}}
        before=copy.deepcopy(previous)
        self.assertEqual(qualify_refresh(result,share,previous,now)[0]['asOf'],'2026-10-15')
        self.assertEqual(previous,before)
        self.assertNotIn('countries',result)
        previous['countries']['asOf']='2025-10-15'
        with self.assertRaises(ValueError):qualify_refresh(result,share,previous,now)
        with self.assertRaises(ValueError):qualify_refresh(result,share,{},now)

    def test_invesco_wrong_document_rejected(self):
        with self.assertRaises(ValueError):
            parse_allocations('IE000L2SA8K5 Replication method Physical',{'isin':'IE000716YHJ7'},dt.datetime.now(dt.timezone.utc))
    def test_warrants_not_relabelled_as_underlying_equity_sector(self):
        body=json.loads((Path(__file__).parent/'fixtures/official-documents/dws-physical-holdings.json').read_text())
        p=next(p for p in body['tables'][0]['values'] if p['column_1']['sortValue']>0)
        baseline=parse_holdings(body,{'isin':'IE00BM67HK77'},dt.datetime(2026,10,16,tzinfo=dt.timezone.utc),'https://etf.dws.com/holdings')
        old=sum(r['weightPct'] for r in baseline['sectors']['rows'] if r['name']=='Unassigned')
        p['column_5']['value']='Warrants'
        r=parse_holdings(body,{'isin':'IE00BM67HK77'},dt.datetime(2026,10,16,tzinfo=dt.timezone.utc),'https://etf.dws.com/holdings')
        self.assertTrue(any(x['name']=='Unassigned' and abs(x['weightPct']-old-p['column_1']['sortValue'])<1e-5 for x in r['sectors']['rows']))
        p['column_1']['sortValue']=-1
        with self.assertRaises(ValueError):parse_holdings(body,{'isin':'IE00BM67HK77'},dt.datetime(2026,10,16,tzinfo=dt.timezone.utc),'https://etf.dws.com/holdings')

if __name__=='__main__':unittest.main()

class InvescoHoldings(unittest.TestCase):
 def test_exact_physical_top_ten_retains_weight_and_wrapped_identity(self):
  from collect_invesco_allocations import parse_top_holdings
  share={'isin':'IE000716YHJ7','sourceUrl':'https://www.invesco.com/exact-share.pdf'}
  text=share['isin']+'\nReplication method Physical\n'+(Path(__file__).parent/'fixtures/official-documents/invesco-allworld-allocations.txt').read_text()
  result=parse_top_holdings(text,share,dt.datetime(2026,10,18,tzinfo=dt.timezone.utc))
  self.assertEqual(len(result['rows']),10)
  self.assertAlmostEqual(sum(r['weightPct'] for r in result['rows']),24.73)
  self.assertEqual(result['rows'][5]['name'],'TAIWAN SEMICONDUCTOR MANUFAC TWD10')
  for changed in [text.replace('Weight','Value'),text.replace('5.02','-5.02'),text.replace('30 Sep 2026','30 Sep 2027'),text.replace(share['isin'],'OTHER')]:
   with self.assertRaises(ValueError):parse_top_holdings(changed,share,dt.datetime(2026,10,18,tzinfo=dt.timezone.utc))
