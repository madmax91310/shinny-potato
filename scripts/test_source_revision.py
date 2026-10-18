import base64
import json
import unittest
import urllib.error
from propose_source_revision import proposal, apply, run
from accepted_wording import accepted_clause_match, literal_pattern

PATTERN = r'le compte du Client enregistrera la contre-valeur en euros'
CLAUSE = {'kind': 'review', 'id': 'collection:x.yml:broker-observation:caidf:profile:change', 'name': 'CA IDF', 'dataId': 'broker-observation:caidf:profile:change',
          'cause': f'Clause officielle absente ou modifiée : {PATTERN} | Passage actuel le plus proche : « le compte du Client sera débité de la contre-valeur en euros »'}
TITLE = {'kind': 'review', 'id': 'collection:i.yml:linxea-avenir-2', 'name': 'Linxea Avenir 2', 'dataId': 'linxea-avenir-2',
         'cause': 'Wrong contract identity | attendu : « Linxea Avenir 2 » ; titre actuel : « Linxea Avenir 2 (fermé) » ; canonique : x'}

class Api:
    def __init__(self, existing=()):
        self.calls, self.existing = [], set(existing)
        self.file = {'sha': 'f1', 'content': base64.b64encode(json.dumps({'schemaVersion': 1, 'clauses': {}, 'titles': {}}).encode()).decode()}
    def __call__(self, path, method='GET', data=None):
        self.calls.append((method, path, data))
        if path == '/git/ref/heads/master': return {'object': {'sha': 'm1'}}
        if path.startswith('/contents/') and method == 'GET': return self.file
        if path.startswith('/git/ref/heads/source-revision/'):
            if path.rsplit('/', 1)[1] in self.existing: return {}
            raise urllib.error.HTTPError(path, 404, 'nf', {}, None)
        if path == '/pulls': return {'html_url': 'https://github.com/x/pull/1'}
        return {}

class SourceRevisionTests(unittest.TestCase):
    def test_proposals_need_complete_evidence(self):
        self.assertEqual(proposal(CLAUSE)[:3], ('clauses', PATTERN, 'le compte du Client sera débité de la contre-valeur en euros'))
        self.assertEqual(proposal(TITLE)[:3], ('titles', 'linxea-avenir-2', 'Linxea Avenir 2 (fermé)'))
        truncated = {**CLAUSE, 'cause': CLAUSE['cause'][:-3]}
        self.assertIsNone(proposal(truncated))
        self.assertIsNone(proposal({**CLAUSE, 'cause': 'Clause officielle absente ou modifiée : X | Aucun passage proche dans le document actuel'}))
        self.assertIsNone(proposal({**TITLE, 'cause': 'Wrong contract identity | attendu : « A » ; titre actuel : « absent »'}))

    def test_one_pull_request_per_change_and_no_duplicate(self):
        api = Api()
        self.assertEqual(run({'monitoring': {'active': {'a': CLAUSE, 'b': TITLE, 'c': {'kind': 'collection', 'cause': 'HTTP 403'}}}}, api, '2026-10-18'), ['https://github.com/x/pull/1'] * 2)
        puts = [data for method, path, data in api.calls if method == 'PUT']
        added = json.loads(base64.b64decode(puts[0]['content']))
        self.assertEqual(added['clauses'][PATTERN][0]['text'], 'le compte du Client sera débité de la contre-valeur en euros')
        branches = [data['ref'].rsplit('/', 1)[1] for method, path, data in api.calls if path == '/git/refs']
        again = Api(existing=branches)
        self.assertEqual(run({'monitoring': {'active': {'a': CLAUSE, 'b': TITLE}}}, again, '2026-10-18'), [])
        self.assertFalse([c for c in again.calls if c[0] != 'GET'])

    def test_merged_wording_is_accepted_by_the_collectors(self):
        self.assertIsNone(apply({'clauses': {PATTERN: [{'text': 'abc def'}]}}, 'clauses', PATTERN, 'abc def', 'x'))
        text = 'Préambule. Le compte du Client sera  débité de la contre-valeur en euros. Fin.'
        import accepted_wording
        original = accepted_wording.ACCEPTED
        accepted_wording.ACCEPTED = {'clauses': {PATTERN: [{'text': 'le compte du Client sera débité de la contre-valeur en euros'}]}, 'titles': {'linxea-avenir-2': ['Linxea Avenir 2 (fermé)']}}
        try:
            self.assertTrue(accepted_clause_match(PATTERN, text))
            self.assertIsNone(accepted_clause_match('autre clause', text))
            self.assertTrue(accepted_wording.accepted_title('linxea-avenir-2', 'Linxea Avenir 2 (fermé)'))
            self.assertFalse(accepted_wording.accepted_title('linxea-avenir-2', 'Autre'))
        finally:
            accepted_wording.ACCEPTED = original
        self.assertEqual(literal_pattern('a.b  c'), r'a\.b\s+c')

if __name__ == '__main__': unittest.main()
