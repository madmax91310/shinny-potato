"""Prevent production collectors escaping supervision or partial-publication gates."""
import json
from pathlib import Path
import re
import unittest
from publish_automation_status import REGISTRY
ROOT = Path(__file__).resolve().parents[1]

class WorkflowContracts(unittest.TestCase):
    def test_tweet_midi_partitions_preserve_the_publication_gate(self):
        workflow = (ROOT/'.github/workflows/deploy-pages.yml').read_text()
        build = workflow.split('\n  build:\n')[1].split('\n  tweet-midi-checks:\n')[0]
        shards = workflow.split('\n  tweet-midi-checks:\n')[1].split('\n  python-checks:\n')[0]
        self.assertIn('node scripts/build-tweet-midi-verifier.mjs', build)
        self.assertNotIn('run: npm run verify:tweet-midi', build)
        self.assertIn('node scripts/test-tweet-midi-shards.mjs', build)
        self.assertIn('path: test-artifacts/tweet-midi-verifier.mjs', build)
        self.assertIn('if-no-files-found: error', build)
        self.assertIn('needs: build', shards)
        self.assertIn('fail-fast: false', shards)
        self.assertIn('shard: [0, 1, 2, 3]', shards)
        self.assertIn('TWEET_MIDI_SHARD_INDEX: ${{ matrix.shard }}', shards)
        self.assertIn('TWEET_MIDI_SHARD_COUNT: 4', shards)
        self.assertIn('name: tweet-midi-verifier', shards)
        self.assertIn('run: node test-artifacts/tweet-midi-verifier.mjs', shards)
        self.assertNotIn('continue-on-error', shards)
        self.assertNotIn('npm ci', shards)  # No mutable reinstall or source rebuild.
        browser = workflow.split('\n  browser-checks:\n')[1].split('\n  exposure-browser-check:\n')[0]
        self.assertIn('needs: build', browser)
        self.assertNotIn('needs: tweet-midi-checks', browser)
        for name in ['deploy', 'fallback-build']:
            job = re.split(r'(?m)^  [a-zA-Z0-9_-]+:\n', workflow.split('\n  '+name+':\n')[1])[0]
            self.assertIn('build, tweet-midi-checks,', job)
            self.assertIn("needs.tweet-midi-checks.result == 'success'", job)

    def test_reusable_pages_callers_can_read_deployment_metadata(self):
        for path in (ROOT/'.github/workflows').glob('*.yml'):
            text = path.read_text()
            if 'uses: ./.github/workflows/deploy-pages.yml' not in text: continue
            root_permissions = text.split('\njobs:')[0]
            for job in re.split(r'(?m)^  [a-zA-Z0-9_-]+:\n', text.split('\njobs:')[1]):
                if 'uses: ./.github/workflows/deploy-pages.yml' not in job: continue
                scope = job if '    permissions:' in job else root_permissions
                self.assertRegex(scope, r'deployments: read', str(path))

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

    def test_publishers_use_isolated_recording_and_known_phase_steps(self):
        for filename, config in REGISTRY.items():
            if filename == 'update-editorial-radar.yml':
                continue  # Dedicated status branch, no data commit to master.
            workflow = (ROOT/'.github/workflows'/filename).read_text()
            job = workflow.split('  '+config['collectionJob']+':\n')[1].split('\n  deploy:')[0]
            self.assertIn('bash scripts/commit-validated-data.sh ', job, filename)
            self.assertNotRegex(job, r'git (?:add|commit|pull|push) ')
            self.assertTrue(config['collectionSteps'], filename)
            for name in config['collectionSteps'] + config['validationSteps']:
                self.assertTrue('name: '+name+'\n' in job or 'name: '+json.dumps(name)+'\n' in job, (filename,name))
            self.assertLess(job.index('name: Validate collected observations'),job.index('bash scripts/commit-validated-data.sh'))
            self.assertIn('steps.commit.outputs.commit_sha', job)

    def test_partial_failure_signal_cannot_block_validated_publication(self):
        for filename in ['update-lifestrategy.yml','update-non-bond-expansion.yml','update-qualified-exposures.yml']:
            workflow = (ROOT/'.github/workflows'/filename).read_text()
            refresh = workflow.split('  refresh:\n')[1].split('  deploy:\n')[0]
            self.assertNotIn('run: exit 1', refresh)
            failures = "steps.collect.outcome == 'failure'"
            if filename == 'update-qualified-exposures.yml':
                failures += " || steps.equities.outcome == 'failure' || steps.holdings.outcome == 'failure' || steps.sleeves.outcome == 'failure' || steps.underliers.outcome == 'failure'"
                for phase in ['sleeves','underliers']:
                    self.assertIn("id: "+phase+"\n        continue-on-error: ${{ github.event_name != 'pull_request' }}", refresh)
                self.assertIn("id: holdings\n        continue-on-error: ${{ github.event_name != 'pull_request' }}", refresh)
                self.assertIn("id: equities\n        continue-on-error: ${{ github.event_name != 'pull_request' }}", refresh)
            self.assertIn("collection_failed: ${{ " + failures + " }}", refresh)
            self.assertIn('needs: [refresh, deploy]', workflow)
            self.assertIn("if: always() && needs.refresh.outputs.collection_failed == 'true'", workflow)
            self.assertLess(refresh.index('npm run build'), refresh.index('bash scripts/commit-validated-data.sh'))

    def test_fallback_lane_publishes_fresh_data_only_with_published_code(self):
        workflow = (ROOT/'.github/workflows/deploy-pages.yml').read_text()
        fallback = workflow.split('\n  fallback-build:\n')[1].split('\n  deploy-fallback:\n')[0]
        condition = fallback.split('if: >-\n')[1].split('\n    runs-on:')[0]
        # Only when the full gate failed on a code change, never for PRs or the data-only lane.
        for required in ["github.event_name != 'pull_request'", "needs.scope.outputs.data_only != 'true'",
                         "needs.scope.outputs.published != ''", "!(needs.build.result == 'success'"]:
            self.assertIn(required, condition)
        steps = fallback.split('steps:')[1]
        order = [steps.index(x) for x in ['compose-fallback-snapshot.mjs --published', 'npm run build', 'dist/build-info.json', 'smoke-data-routes.mjs', 'upload-pages-artifact']]
        self.assertEqual(order, sorted(order))
        deploy = workflow.split('\n  deploy-fallback:\n')[1]
        self.assertIn('group: pages-production', deploy)
        self.assertIn('bash scripts/check-pages-head.sh', deploy)
        self.assertIn('artifact_name: github-pages-fallback', deploy)

    def test_deploy_requires_every_validation_job_and_same_built_commit(self):
        workflow = (ROOT/'.github/workflows/deploy-pages.yml').read_text()
        deploy = workflow.split('\n  deploy:\n')[1]
        self.assertIn('needs: [scope, build, tweet-midi-checks, python-checks, browser-checks, exposure-browser-check, smoke]', deploy)
        condition = deploy.split('if: >-\n')[1].split('\n    runs-on:')[0]
        # Build, Python and smoke checks block every publication; editorial browser
        # checks may only be bypassed for an automation data-only snapshot.
        for blocking in ["needs.tweet-midi-checks.result == 'success'", "needs.build.result == 'success'", "needs.python-checks.result == 'success'", "needs.smoke.result == 'success'",
                         "github.event_name != 'pull_request'"]:
            self.assertIn(blocking, condition)
        self.assertIn("((needs.browser-checks.result == 'success' && needs.exposure-browser-check.result == 'success')\n          || needs.scope.outputs.data_only == 'true')", condition)
        scope = workflow.split('\n  scope:\n')[1].split('\n  build:\n')[0]
        self.assertIn("if: github.event_name != 'pull_request'", scope)
        self.assertIn('fetch-depth: 0', scope)
        self.assertIn('scripts/classify-deploy-scope.mjs', scope)
        self.assertIn('run: node scripts/smoke-data-routes.mjs', workflow.split('\n  smoke:\n')[1])
        self.assertIn('dist/build-info.json', workflow.split('\n  build:\n')[1].split('\n  python-checks:\n')[0])
        self.assertIn('exit 1', workflow.split('\n  advisory-checks:\n')[1])
        self.assertIn('ref: ${{ needs.build.outputs.commit_sha }}', deploy)
        self.assertIn('  exposure-browser-check:', workflow)
        self.assertIn('run: node scripts/playwright-exposure-scope.mjs', workflow.split('  exposure-browser-check:')[1])
        self.assertIn('ref: ${{ needs.build.outputs.commit_sha }}', workflow.split('  browser-checks:\n')[1])
        commands = json.loads((ROOT/'scripts/ci-browser-checks.json').read_text())
        self.assertEqual(len(commands),len(set(commands)))
        for command in commands:
            if command.startswith('node '): self.assertTrue((ROOT/command.split()[1]).is_file())
        for critical in ['node scripts/test-route-loading.mjs','node scripts/playwright-tools.mjs','node scripts/test-automation-failures-ui.mjs']:
            self.assertIn(critical, commands)

    def test_production_collectors_queue_instead_of_replacing_pending_runs(self):
        # GitHub keeps one pending job per concurrency group: without a queue, each new
        # arrival cancels the waiting one. Three ETF collectors cancelled each other on
        # 2026-10-17 in active-market-data-production for that reason.
        for path in sorted((ROOT/'.github/workflows').glob('*.yml')):
            for block in re.findall(r'^( *)concurrency:\n((?:\1 +.*\n|\s*#.*\n)+)', path.read_text(), re.M):
                body = block[1]
                if not re.search(r'cancel-in-progress:\s*false\s*$', body, re.M):
                    continue
                self.assertRegex(body, r'(?m)^\s*queue:\s*max\s*$', (path.name, body))

if __name__ == '__main__': unittest.main()
