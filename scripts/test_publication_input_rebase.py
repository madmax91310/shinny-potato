"""Actual five-file issuer race: exact financial inputs, separate receipt renewal."""
import copy
import datetime as dt
import gzip
import json
import pathlib
import shlex
import sys
import unittest
from unittest.mock import patch
import observation_rebase_guard as guard
import test_validated_data_commit as harness

ROOT = pathlib.Path(__file__).resolve().parents[1]
FIXTURES = ROOT/'scripts/fixtures/publication-input-race-20261102'
PATHS = {'etf':'src/data/automated-etf.json', 'indices':'src/data/automated-indices.json',
         'metadata':'scripts/instrument-metadata-sources.json', 'gaps':'docs/automation-gaps.json',
         'coverage':'public/data/asset-field-coverage.json'}
def fixture(name):
    return json.loads(gzip.decompress((FIXTURES/(name+'.json.gz')).read_bytes()))

class IndexReceiptTests(unittest.TestCase):
    def eligible(self, before, after):
        with patch.object(guard, 'git_json', side_effect=[before, after]):
            return guard.index_price_inputs_unchanged('base', 'upstream')

    def test_real_index_control_renewal_keeps_all_financial_values_and_caller(self):
        before, after = fixture('before-indices'), fixture('after-indices')
        original = copy.deepcopy((before,after))
        self.assertTrue(self.eligible(before,after))
        self.assertEqual((before,after),original)

    def test_financial_dates_values_identity_scope_and_unknown_fields_stay_protected(self):
        before=fixture('before-indices')
        mutations=[lambda r:r['returns']['values'].__setitem__(0,False),
                   lambda r:r['returns'].__setitem__('currency','JPY'),
                   lambda r:r['returns'].__setitem__('variant','PRICE'),
                   lambda r:r['returns'].__setitem__('periodEnd','2024-12-31'),
                   lambda r:r['returns'].__setitem__('asOf','2026-10-31'),
                   lambda r:r['facts'].__setitem__('index','different-index'),
                   lambda r:r['facts']['source'].__setitem__('url','https://example.invalid/other'),
                   lambda r:r['returns'].__setitem__('unknownFinancialField',1),
                   lambda r:r.__setitem__('unknownIdentity','other')]
        for mutate in mutations:
            after=fixture('after-indices');mutate(after['sp-euro-dividend-aristocrats'])
            with self.subTest(mutation=mutate):self.assertFalse(self.eligible(before,after))
        after=fixture('after-indices');after['new-index']=copy.deepcopy(after['topix'])
        self.assertFalse(self.eligible(before,after))
        after=fixture('after-indices');after['topix']=[]
        self.assertFalse(self.eligible(before,after))

    def test_composition_updates_do_not_change_the_separate_price_acquisition(self):
        before,after=fixture('before-indices'),fixture('after-indices')
        facts=after['sp-euro-dividend-aristocrats']['facts']
        facts['asOf']='2026-11-02';facts['constituents']+=1
        facts['countries']=list(reversed(facts['countries']))
        self.assertTrue(self.eligible(before,after))

    def test_changed_receipts_must_be_valid_monotonic_and_not_future(self):
        for key,value in [('checkedAt','2026-10-01'),('checkedAt','2026-02-30'),
                          ('checkedAt',(dt.datetime.now(dt.timezone.utc).date()+dt.timedelta(days=1)).isoformat()),
                          ('retrievedAt','2026-10-01T00:00:00+00:00'),
                          ('retrievedAt','2026-11-02T00:00:00'),
                          ('retrievedAt',(dt.datetime.now(dt.timezone.utc)+dt.timedelta(days=1)).isoformat()),
                          ('sha256','not-a-source-digest')]:
            after=fixture('after-indices');after['sp-euro-dividend-aristocrats']['facts']['source'][key]=value
            with self.subTest(key=key,value=value):
                try:accepted=self.eligible(fixture('before-indices'),after)
                except ValueError:accepted=False
                self.assertFalse(accepted)

class ActualPublicationRaceTests(unittest.TestCase):
    def setUp(self):
        self.f=harness.CommitValidatedData();self.f.setUp();self.addCleanup(self.f.doCleanups)
        self.before={path:fixture('before-'+key)for key,path in PATHS.items()}
        self.before['scripts/monthly-automation.json']=fixture('monthly-config')
        for path,value in self.before.items():
            target=self.f.local/path;target.parent.mkdir(parents=True,exist_ok=True)
            target.write_text(json.dumps(value))
        self.f.git(self.f.local,'add','.');self.f.git(self.f.local,'commit','-m','actual collection input fixture')
        self.f.git(self.f.local,'push','origin','master');self.f.git(self.f.other,'pull','--ff-only')
        (self.f.local/'validated.json').write_text('validated update\n')

    def publish(self, mutate=None, validation='test -f validated.json', extra_path=None):
        after={path:fixture('after-'+key)for key,path in PATHS.items()}
        if mutate:mutate(after)
        for path,value in after.items():
            (self.f.other/path).write_text(json.dumps(value))
        if extra_path:
            target=self.f.other/extra_path;target.parent.mkdir(parents=True,exist_ok=True);target.write_text('changed input')
        self.f.git(self.f.other,'add','.');self.f.git(self.f.other,'commit','-m','actual concurrent issuer refresh')
        self.f.git(self.f.other,'push','origin','master')
        command=(f'{shlex.quote(sys.executable)} {shlex.quote(str(ROOT/"scripts/observation_rebase_guard.py"))}'
                 f' --kind publication --base "$VALIDATED_DATA_ORIGINAL_BASE" --upstream HEAD^ && {validation}')
        return self.f.publish({'VALIDATED_DATA_CHECK':command})

    def test_all_five_actual_updates_and_observations_survive_revalidation(self):
        script=self.f.root/'financial-validation.py'
        script.write_text('from pathlib import Path\nimport json\n'
                          f'assert json.loads(Path({PATHS["indices"]!r}).read_text())=={fixture("after-indices")!r}\n'
                          'Path("financial-validation-executed").write_text("checked")\n')
        result=self.publish(validation=f'{shlex.quote(sys.executable)} {shlex.quote(str(script))}')
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(self.f.git(self.f.remote,'show','master:validated.json'),'validated update')
        for key,path in PATHS.items():
            self.assertEqual(json.loads(self.f.git(self.f.remote,'show','master:'+path)),fixture('after-'+key))
        self.assertEqual(json.loads((self.f.local/PATHS['indices']).read_text()),self.before[PATHS['indices']])

    def test_compatible_inputs_do_not_bypass_failed_financial_validation(self):
        result=self.publish(validation='false');self.assertNotEqual(result.returncode,0)
        self.assertEqual(self.f.git(self.f.remote,'show','master:validated.json'),'original')

    def test_used_calendar_currency_identity_convention_and_share_attributes_require_recollection(self):
        mutations=[lambda r:r['performance']['years'].__setitem__('2024',False),
                   lambda r:r['performance'].__setitem__('currency','EUR'),
                   lambda r:r['performance'].__setitem__('method','price-only'),
                   lambda r:r.__setitem__('productId','another-share'),
                   lambda r:r['characteristics'].__setitem__('distribution','Distributing'),
                   lambda r:r['characteristics'].__setitem__('inceptionDate','2026-01-01'),
                   lambda r:r.__setitem__('unknownPriceField',1)]
        for mutate in mutations:
            before,after=fixture('before-etf'),fixture('after-etf');mutate(after['GB00B15KXQ89'])
            with patch.object(guard,'git_json',side_effect=[fixture('monthly-config'),before,after]):
                self.assertFalse(guard.calendar_inputs_unchanged('base','upstream',PATHS['etf'],exact_share_inputs=True))

    def test_real_recording_refuses_changed_used_return(self):
        result=self.publish(mutate=lambda d:d[PATHS['etf']]['GB00B15KXQ89']['performance']['years'].__setitem__('2024',99.9))
        self.assertNotEqual(result.returncode,0);self.assertIn('recollect from master',result.stderr)
        self.assertEqual(self.f.git(self.f.remote,'show','master:validated.json'),'original')

    def test_calendar_observation_date_and_bad_control_receipts_are_not_independent(self):
        changes=[('asOf','2026-10-01'),('checkedAt','2026-10-01'),
                 ('checkedAt',(dt.datetime.now(dt.timezone.utc).date()+dt.timedelta(days=1)).isoformat()),
                 ('sha256','not-a-source-digest')]
        for field,value in changes:
            before,after=fixture('before-etf'),fixture('after-etf')
            after['GB00B15KXQ89']['performance'][field]=value
            with self.subTest(field=field),patch.object(guard,'git_json',side_effect=[fixture('monthly-config'),before,after]):
                self.assertFalse(guard.calendar_inputs_unchanged('base','upstream',PATHS['etf'],exact_share_inputs=True))

    def test_new_calendar_control_is_not_copied_into_acquired_observations(self):
        before,after=fixture('before-etf'),fixture('after-etf')
        for record,day,digest in [(before,'2026-10-31','a'*64),(after,'2026-11-01','b'*64)]:
            record['GB00B15KXQ89']['performance'].update(checkedAt=day,sha256=digest)
        original=copy.deepcopy((before,after))
        with patch.object(guard,'git_json',side_effect=[fixture('monthly-config'),before,after]):
            self.assertTrue(guard.calendar_inputs_unchanged('base','upstream',PATHS['etf'],exact_share_inputs=True))
        self.assertEqual((before,after),original)

    def test_real_recording_refuses_changed_index_observation(self):
        result=self.publish(mutate=lambda d:d[PATHS['indices']]['sp-euro-dividend-aristocrats']['returns']['values'].__setitem__(0,99.9))
        self.assertNotEqual(result.returncode,0);self.assertIn('recollect from master',result.stderr)

    def test_adjacent_unqualified_configuration_is_still_refused(self):
        result=self.publish(extra_path='scripts/instrument-metadata-sources-other.json')
        self.assertNotEqual(result.returncode,0);self.assertIn('recollect from master',result.stderr)

if __name__=='__main__':unittest.main()
