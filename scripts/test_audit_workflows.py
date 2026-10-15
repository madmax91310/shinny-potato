"""Prevent production collectors escaping supervision or partial-publication gates."""
import json
from pathlib import Path
import re
import unittest
from publish_automation_status import REGISTRY
ROOT = Path(__file__).resolve().parents[1]

class WorkflowContracts(unittest.TestCase):
    def test_scheduled_data_publishers_are_all_registered(self):
        publishers = {p.name for p in (ROOT/'.github/workflows').glob('*.yml')
                      if '  schedule:' in p.read_text() and 'uses: ./.github/workflows/deploy-pages.yml' in p.read_text()}
        self.assertEqual(publishers - REGISTRY.keys(), set())
        status = (ROOT/'.github/workflows/automation-status.yml').read_text()
        for filename, config in REGISTRY.items():
            workflow = (ROOT/'.github/workflows'/filename).read_text()
            self.assertIn('name: '+config['workflowName'], workflow)
            self.assertIn('      - '+config['workflowName'], status)
            self.assertIn('  '+config['collectionJob']+':', workflow)
            if config.get('artifact'): self.assertIn('name: '+config['artifact'], workflow)

    def test_partial_failure_signal_cannot_block_validated_publication(self):
        for filename in ['update-lifestrategy.yml','update-non-bond-expansion.yml','update-qualified-exposures.yml']:
            workflow = (ROOT/'.github/workflows'/filename).read_text()
            refresh = workflow.split('  refresh:\n')[1].split('  deploy:\n')[0]
            self.assertNotIn('run: exit 1', refresh)
            failures = "steps.collect.outcome == 'failure'"
            if filename == 'update-qualified-exposures.yml':
                failures += " || steps.equities.outcome == 'failure'"
                self.assertIn("- id: equities\n        continue-on-error: ${{ github.event_name != 'pull_request' }}", refresh)
            self.assertIn("collection_failed: ${{ " + failures + " }}", refresh)
            self.assertIn('needs: [refresh, deploy]', workflow)
            self.assertIn("if: always() && needs.refresh.outputs.collection_failed == 'true'", workflow)
            self.assertLess(refresh.index('npm run build'), refresh.index('git push'))

    def test_deploy_requires_every_validation_job_and_same_built_commit(self):
        workflow = (ROOT/'.github/workflows/deploy-pages.yml').read_text()
        deploy = workflow.split('\n  deploy:\n')[1]
        self.assertIn('needs: [build, python-checks, browser-checks]', deploy)
        self.assertIn('ref: ${{ needs.build.outputs.commit_sha }}', deploy)
        self.assertIn('ref: ${{ needs.build.outputs.commit_sha }}', workflow.split('  browser-checks:\n')[1])
        commands = json.loads((ROOT/'scripts/ci-browser-checks.json').read_text())
        self.assertEqual(len(commands),len(set(commands)))
        for command in commands:
            if command.startswith('node '): self.assertTrue((ROOT/command.split()[1]).is_file())
        for critical in ['node scripts/test-route-loading.mjs','node scripts/playwright-tools.mjs','node scripts/test-automation-failures-ui.mjs']:
            self.assertIn(critical, commands)

if __name__ == '__main__': unittest.main()
