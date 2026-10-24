"""The report-failures signal reads collector reports with the status rules."""
import json
import os
import pathlib
import tempfile
import unittest
from unittest.mock import patch

from report_partial_failures import main, partial_failures


class PartialFailureTests(unittest.TestCase):
    def write(self, directory, name, content):
        path = pathlib.Path(directory) / name
        path.write_text(json.dumps(content))
        return str(path)

    def test_index_errors_and_radar_source_failures_are_partial_failures(self):
        with tempfile.TemporaryDirectory() as directory:
            indices = self.write(directory, 'derived-index-observation.json', {'indices': [
                {'id': 'world', 'name': 'MSCI World', 'errors': [{'field': 'returns', 'reason': 'HTTP 403'}], 'facts': {}},
                {'id': 'em', 'name': 'MSCI EM', 'errors': [], 'facts': {}, 'returns': {}}]})
            feed = self.write(directory, 'feed.json', {'schemaVersion': 1, 'coverage': {'etf': 3, 'investisseurs': 0}, 'events': [],
                                                       'errors': [{'family': 'investisseurs', 'reason': 'Déclarations 13F indisponibles.'}]})
            errors = partial_failures([indices, feed])
            self.assertEqual(errors, ['index-world-returns : HTTP 403', 'radar:investisseurs : Déclarations 13F indisponibles.'])

    def test_contradictions_are_not_failures_but_missing_reports_are_visible(self):
        with tempfile.TemporaryDirectory() as directory:
            feed = self.write(directory, 'feed.json', {'schemaVersion': 1, 'coverage': {'indices': 2}, 'events': [],
                                                       'errors': [{'family': 'indices', 'reason': 'Valeur contradictoire pour la même période (2026-09) : Secteurs.'}]})
            self.assertEqual(partial_failures([feed]), [])
            self.assertIn('attendu absent',partial_failures([str(pathlib.Path(directory) / 'absent.json')])[0])

    def test_malformed_or_unknown_report_cannot_be_silently_ignored(self):
        with tempfile.TemporaryDirectory() as directory:
            for data in [[], {'unknown':1}]:
                self.assertIn('invalide',partial_failures([self.write(directory,'bad.json',data)])[0])

    def test_output_and_summary_follow_github_conventions(self):
        with tempfile.TemporaryDirectory() as directory:
            feed = self.write(directory, 'feed.json', {'schemaVersion': 1, 'coverage': {'etf': 1}, 'events': [],
                                                       'errors': [{'family': 'etf', 'reason': 'Registre illisible'}]})
            output, summary = pathlib.Path(directory) / 'out', pathlib.Path(directory) / 'summary'
            with patch.dict(os.environ, {'GITHUB_OUTPUT': str(output), 'GITHUB_STEP_SUMMARY': str(summary)}):
                self.assertEqual(main([feed]), 0)
            self.assertEqual(output.read_text(), 'failed=true\n')
            self.assertIn('radar:etf : Registre illisible', summary.read_text())
            with patch.dict(os.environ, {'GITHUB_OUTPUT': str(output), 'GITHUB_STEP_SUMMARY': str(summary)}):
                self.assertEqual(main([self.write(directory, 'ok.json', {'schemaVersion': 1, 'coverage': {'etf': 1}, 'events': [], 'errors': []})]), 0)
            self.assertEqual(output.read_text(), 'failed=true\nfailed=false\n')


if __name__ == '__main__':
    unittest.main()
