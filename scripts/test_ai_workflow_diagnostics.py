"""An engine failure must not prevent the independent retained-series diagnosis."""
import pathlib
import unittest
import yaml


class DailyWorkflowDiagnostics(unittest.TestCase):
    def test_audit_runs_independently_even_after_engine_failure(self):
        root = pathlib.Path(__file__).resolve().parents[1]
        steps = yaml.safe_load((root / '.github/workflows/update-ai-portfolios.yml').read_text())['jobs']['refresh']['steps']
        engine = next(s for s in steps if s.get('name') == 'Validate every selectable equity against the accounting engine')
        audit = next(s for s in steps if s.get('name') == 'Audit retained source identities')
        gate = next(s for s in steps if s.get('name') == 'Validate collected observations')
        self.assertIn('test-ai-equity-coverage.mjs', engine['run'])
        self.assertNotIn('audit-ai-runtime.mjs', engine['run'])
        self.assertEqual(audit['if'], 'always()')
        self.assertEqual(audit['run'], 'node scripts/audit-ai-runtime.mjs')
        self.assertFalse(audit.get('continue-on-error', False))
        self.assertLess(steps.index(engine), steps.index(audit))
        self.assertLess(steps.index(audit), steps.index(gate))
        self.assertEqual(gate['run'], 'npm run build')


if __name__ == '__main__':
    unittest.main()
