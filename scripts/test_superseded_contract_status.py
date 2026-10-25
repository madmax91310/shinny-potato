"""A superseded insurance contract retires its identity alert without a recovery claim."""
import unittest

from publish_automation_status import normalize_report, update_status

WORKFLOW = 'update-insurance.yml'


def run(id, conclusion='success'):
    return {'id': id, 'path': '.github/workflows/' + WORKFLOW, 'head_branch': 'master', 'event': 'schedule',
            'status': 'completed', 'conclusion': conclusion, 'updated_at': f'2026-10-{id:02d}T10:00:00Z',
            'html_url': f'https://github.com/test/repo/actions/runs/{id}'}


class SupersededContractTests(unittest.TestCase):
    def test_superseded_contract_retires_identity_alert(self):
        report = {'observations': [
            {'id': 'linxea-avenir-2', 'name': 'Linxea Avenir 2', 'status': 'superseded',
             'reason': 'Contract explicitly superseded: Linxea Avenir 2+', 'successorName': 'Linxea Avenir 2+'},
            {'id': 'linxea-avenir-2-plus', 'name': 'Linxea Avenir 2+', 'status': 'success'}]}
        normalized = normalize_report(report)
        self.assertEqual([r['id']for r in normalized['inactive']], ['linxea-avenir-2'])
        self.assertEqual(normalized['inactive'][0]['retirementStatus'], 'superseded')
        self.assertTrue(normalized['inactive'][0]['reason'])
        self.assertNotIn({'id': 'linxea-avenir-2'}, normalized['successes'])
        stale = {'workflows': {WORKFLOW: {'completedAt': '2026-10-01T10:00:00Z', 'runId': 1, 'dataFailures': {
            'linxea-avenir-2': {'cause': 'Wrong contract identity'}, 'other': {'cause': 'HTTP 500'}}}}}
        state = update_status(stale, run(2), [], [report])
        self.assertEqual(set(state['workflows'][WORKFLOW]['dataFailures']), {'other'})


if __name__ == '__main__':
    unittest.main()
