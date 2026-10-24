"""Reports inside multi-path artifacts (kept apart from test_automation_status.py)."""
import json
import pathlib
import tempfile
import unittest

from publish_automation_status import read_report, report_files, update_status

WORKFLOW = 'update-instrument-metadata.yml'


def run(id, conclusion):
    return {'id': id, 'path': '.github/workflows/' + WORKFLOW, 'head_branch': 'master', 'event': 'schedule',
            'status': 'completed', 'conclusion': conclusion, 'updated_at': f'2026-10-{id:02d}T10:00:00Z',
            'html_url': f'https://github.com/test/repo/actions/runs/{id}'}


class ReportFilesTests(unittest.TestCase):
    def test_metadata_report_is_found_beside_repository_snapshots(self):
        # upload-artifact roots temp + checkout paths at their common ancestor.
        with tempfile.TemporaryDirectory() as d:
            root = pathlib.Path(d)
            (root / '_temp').mkdir()
            (root / '_temp/instrument-metadata.json').write_text(json.dumps(
                {'successes': [{'id': 'IE0002Y8CX98:distribution'}], 'errors': []}))
            data = root / 'shinny-potato/shinny-potato/src/data'
            data.mkdir(parents=True)
            (data / 'automated-instrument-metadata.json').write_text('{}')
            (data / 'instrument-metadata-status.json').write_text('{}')
            self.assertEqual([p.name for p in report_files(d)], ['instrument-metadata.json'])
            undated = [read_report(p, WORKFLOW) for p in report_files(d)]
            (root / '_temp/instrument-metadata.json').write_text(json.dumps({'checkedAt':'2026-10-02T09:00:00Z','successes':[{'id':'IE0002Y8CX98:distribution'}],'errors':[]}))
            reports = [read_report(p, WORKFLOW) for p in report_files(d)]
        stale = {'workflows': {WORKFLOW: {'completedAt': '2026-10-01T10:00:00Z', 'runId': 1, 'dataFailures': {
            'IE0002Y8CX98:distribution': {'cause': 'Previously automated metadata was not observed'}}}}}
        self.assertIn('IE0002Y8CX98:distribution',update_status(stale,run(2,'success'),[],undated)['workflows'][WORKFLOW]['dataFailures'],'A readable but undated report does not prove source recovery')
        recovered = update_status(stale, run(2, 'success'), [], reports)
        self.assertEqual(recovered['workflows'][WORKFLOW]['dataFailures'], {})

    def test_single_path_artifact_reads_root_reports(self):
        with tempfile.TemporaryDirectory() as d:
            (pathlib.Path(d) / 'report.json').write_text('{}')
            self.assertEqual([p.name for p in report_files(d)], ['report.json'])


if __name__ == '__main__':
    unittest.main()
