import copy
import datetime as dt
import json
import pathlib
import tempfile
import unittest
import urllib.error
from unittest.mock import patch
from data_automation import UTC
from sp_public_feed import refresh, read_response, ROOT
from collect_sp_composition import collect
from refresh_index_sources import collect_one, merge_records
from publish_automation_status import _normalize_report
import collect_sp_composition as collector

NOW = dt.datetime(2026, 10, 9, 7, tzinfo=UTC)
CONFIGS = [c for c in json.loads((ROOT/'scripts/index-automation.json').read_text())['indices'] if c.get('compositionDataUrl')]


def fixture(config):
    name = 'euro' if config['id'].startswith('sp-euro') else 'global-quality'
    return (ROOT/f'scripts/fixtures/sp-composition/{name}-public-data-2026-09-30.json').read_bytes()


class FeedTests(unittest.TestCase):
    def test_fresh_response_and_transport_fallback(self):
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory)/'feed.json'
            refresh(CONFIGS, NOW, path, fixture)
            for config in CONFIGS:
                facts = read_response(config, NOW, path)
                self.assertEqual(facts['asOf'], '2026-09-30')
                self.assertEqual(len(facts['holdings']), 10)
                self.assertEqual(facts['source']['retrievedAt'], NOW.isoformat())
                with patch('collect_sp_composition.download', side_effect=urllib.error.HTTPError(config['compositionDataUrl'],403,'Forbidden',{},None)), patch('sp_public_feed.read_response', return_value=facts):
                    retained = collect(config,NOW,collector.download)
                    self.assertEqual(retained['asOf'], facts['asOf'])
                    self.assertIn('403', retained['source']['primaryAccessError'])

    def test_later_cache_validation_never_renews_source_control(self):
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory)/'feed.json'
            refresh(CONFIGS, NOW, path, fixture)
            later = NOW + dt.timedelta(hours=36)
            for config in CONFIGS:
                facts = read_response(config, later, path)
                self.assertEqual(facts['source']['checkedAt'], NOW.date().isoformat())
                self.assertEqual(facts['source']['retrievedAt'], NOW.isoformat())
                self.assertEqual(facts['asOf'], '2026-09-30')

    def test_retained_composition_does_not_certify_primary_source_or_hide_valid_returns(self):
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory)/'feed.json'
            refresh(CONFIGS, NOW, path, fixture)
            config = CONFIGS[0]
            facts = read_response(config, NOW + dt.timedelta(hours=36), path)
            facts['source']['primaryAccessError'] = 'HTTP Error 403: Forbidden'
            # Isolated return payload to check field isolation, never published.
            returns = {'asOf': '2026-09-30', 'currency': config['returnCurrency'], 'variant': 'NET', 'values': [[2025, 1]], 'source': {'checkedAt': '2026-10-10'}}
            observation = {'id': config['id'], 'name': config['name'], 'facts': facts, 'returns': returns, 'errors': [], 'unavailable': []}
            with patch('refresh_index_sources._collect_one', return_value=observation):
                result = collect_one(config, NOW + dt.timedelta(hours=36))
            self.assertEqual(result['facts'], facts)
            self.assertEqual(result['returns'], returns)
            self.assertIn('403', result['errors'][0]['reason'])
            self.assertEqual(result['errors'][0]['field'], 'composition')
            native = _normalize_report({'indices': [result]})
            self.assertEqual([r['id'] for r in native['errors']], ['index-'+config['id']+'-composition'])
            self.assertEqual([r['id'] for r in native['successes']], ['index-'+config['id']+'-returns'])
            merged = merge_records({}, [result])[config['id']]
            self.assertEqual(merged['facts']['source']['checkedAt'], NOW.date().isoformat())
            self.assertEqual(merged['facts']['asOf'], '2026-09-30')

    def test_rejects_expired_future_modified_or_wrong_response(self):
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory)/'feed.json'
            refresh(CONFIGS,NOW,path,fixture)
            original = json.loads(path.read_text()); key=CONFIGS[0]['id']
            mutations = [
                {'retrievedAt':(NOW-dt.timedelta(hours=49)).isoformat()},
                {'retrievedAt':(NOW+dt.timedelta(minutes=1)).isoformat()},
                {'retrievedAt':NOW.replace(tzinfo=None).isoformat()},
                {'sourceUrl':'https://example.com/not-official'},
                {'sha256':'wrong'}, {'bodyBase64':'!invalid!'}]
            for mutation in mutations:
                bad=copy.deepcopy(original); bad['observations'][key].update(mutation)
                path.write_text(json.dumps(bad))
                with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                    read_response(CONFIGS[0],NOW,path)

    def test_failed_pair_does_not_change_old_retrieval_time(self):
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory)/'feed.json';path.write_text('previous')
            def incomplete(config):
                if config==CONFIGS[1]: raise TimeoutError('unavailable')
                return fixture(config)
            with self.assertRaises(TimeoutError):refresh(CONFIGS,NOW,path,incomplete)
            self.assertEqual(path.read_text(),'previous')

    def test_wrong_successful_document_never_uses_handoff(self):
        with patch('collect_sp_composition.download',return_value=b'{"wrong":true}'), patch('sp_public_feed.read_response') as fallback:
            with self.assertRaises(KeyError):collect(CONFIGS[0],NOW,collector.download)
            fallback.assert_not_called()


if __name__ == '__main__':unittest.main()
