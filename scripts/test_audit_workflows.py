"""Prevent production collectors escaping supervision or partial-publication gates."""
import json
from pathlib import Path
import re
import unittest
from publish_automation_status import REGISTRY
ROOT = Path(__file__).resolve().parents[1]
# Owner-triggered writes are not scheduled collectors: absence of a decision
# must never be reported as a stale daily source.
MANUAL_WRITERS = set()

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
                      if '  schedule:' in p.read_text() and any('uses: ./.github/workflows/'+lane in p.read_text() for lane in ('deploy-pages.yml','publish-validated-data.yml'))}
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
            if config.get('controlOnly'):
                self.assertEqual(filename, 'deploy-pages.yml')
                self.assertTrue(config['publishes'])
                self.assertFalse(config['collectionSteps'])
                continue  # Deployment validates/publishes existing data; it is not a source writer.
            if config.get('publishes') is False:
                workflow=(ROOT/'.github/workflows'/filename).read_text()
                self.assertNotIn('commit-validated-data.sh',workflow)
                self.assertNotIn('actions/deploy-pages@',workflow)
                continue  # Rehearsal is monitored, but must never publish synthetic data.
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
                failures += " || steps.equities.outcome == 'failure' || steps.holdings.outcome == 'failure' || steps.sleeves.outcome == 'failure' || steps.underliers.outcome == 'failure' || steps.identifiers.outcome == 'failure'"
                for phase in ['sleeves','underliers']:
                    self.assertIn("id: "+phase+"\n        continue-on-error: ${{ github.event_name != 'pull_request' }}", refresh)
                self.assertIn("id: holdings\n        continue-on-error: ${{ github.event_name != 'pull_request' }}", refresh)
                self.assertIn("id: equities\n        continue-on-error: ${{ github.event_name != 'pull_request' }}", refresh)
                self.assertIn("id: identifiers\n        continue-on-error: true", refresh)
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
        self.assertIn('code_sha: ${{ steps.compose.outputs.code_sha }}', fallback)
        self.assertIn('PAGES_CODE_SHA: ${{ needs.fallback-build.outputs.code_sha }}', deploy)
        self.assertIn("PAGES_FALLBACK: 'true'", deploy)
        self.assertNotIn('needs.scope.', deploy)

    def test_validated_data_lane_keeps_compatibility_and_publication_guards(self):
        workflow=(ROOT/'.github/workflows/publish-validated-data.yml').read_text()
        for required in ['group: pages-production','prepare-validated-data.mjs','compose-fallback-snapshot.mjs --published','REQUIRED_DATA_BLOB','Required data was held back or changed','smoke-data-routes.mjs','bash scripts/check-pages-head.sh','verify-pages-publication.mjs','name: data-publication-receipt']:
            self.assertIn(required,workflow)
        self.assertLess(workflow.index('npm run build'),workflow.index('hash-object'))
        self.assertLess(workflow.index('hash-object'),workflow.index('smoke-data-routes.mjs'))
        self.assertLess(workflow.index('smoke-data-routes.mjs'),workflow.index('uses: actions/deploy-pages@'))
        self.assertIn("if: steps.order.outputs.current == 'true'",workflow)
        self.assertIn("steps.producer.outcome == 'failure'",workflow)
        self.assertIn("if: needs.publish.outputs.needs_code == 'true'",workflow)
        self.assertIn("if: steps.plan.outputs.current == 'true' && steps.producer.outcome == 'success'",workflow)
        for name,path in [('update-scpi.yml','src/data/automated-scpi.json'),('update-presentation-actors.yml','src/data/automated-presentation-actors.json')]:
            caller=(ROOT/'.github/workflows'/name).read_text()
            self.assertIn('uses: ./.github/workflows/publish-validated-data.yml',caller)
            self.assertIn('producer: '+name,caller)

    def test_all_producers_require_every_primary_output(self):
        registry=json.loads((ROOT/'scripts/validated-data-producers.json').read_text())
        for filename,paths in registry.items():
            workflow=(ROOT/'.github/workflows'/filename).read_text()
            self.assertIn('producer: '+filename,workflow)
            self.assertIn('uses: ./.github/workflows/publish-validated-data.yml',workflow)
            self.assertTrue(paths,filename)
            committed=re.findall(r'src/data/[a-z0-9-]+\.json',next((line for line in workflow.splitlines() if 'bash scripts/commit-validated-data.sh' in line),''))
            self.assertTrue(set(committed)<=set(paths),(filename,set(committed)-set(paths)))
            for path in paths:self.assertTrue(path in workflow or ('VALIDATED_PATHS: src/data ' in workflow and path.startswith('src/data/')), (filename,path))
        self.assertEqual(set(registry),{name for name,c in REGISTRY.items() if c.get('publishes') is not False and not c.get('controlOnly') and name!='update-editorial-radar.yml'} | MANUAL_WRITERS)

    def test_full_gate_can_adopt_newer_data_without_a_code_or_data_rollback(self):
        workflow=(ROOT/'.github/workflows/deploy-pages.yml').read_text()
        deploy=workflow.split('\n  deploy:\n')[1].split('\n  # Fallback lane:')[0]
        for required in ['group: pages-production','prepare-code-data-refresh.mjs','Require every primary producer file','git hash-object','smoke-data-routes.mjs','github-pages-current-data','steps.data.outputs.code_sha','steps.data.outputs.data_sha']:
            self.assertIn(required.replace('git hash-object',"['hash-object',path]"),deploy)
        self.assertLess(deploy.index('prepare-code-data-refresh.mjs'),deploy.index('smoke-data-routes.mjs'))
        self.assertLess(deploy.index('smoke-data-routes.mjs'),deploy.index('uses: actions/deploy-pages@'))
        self.assertIn("steps.data.outputs.refresh != 'true'",deploy,'The original artifact must never overwrite the rebuilt one')

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

    def test_dependent_market_producers_share_the_production_lock(self):
        # Real refusal41056366335: non-bond publication changed five inputs
        # while the ETF collector was acquiring. Admission must start before
        # checkout, rather than exempting those inputs from financial checks.
        groups = []
        for filename in ('collect-etf-pilot.yml', 'update-exposure-expansion.yml',
                         'update-non-bond-expansion.yml'):
            workflow = (ROOT/'.github/workflows'/filename).read_text()
            job = workflow.split('  refresh:\n', 1)[1]
            before_steps = job.split('    steps:', 1)[0]
            group = re.search(r'(?m)^      group: (.+)$', before_steps).group(1)
            groups.append(group)
            self.assertIn("github.event_name == 'pull_request'", group)
            self.assertIn('github.workflow', group)
            self.assertIn('github.ref', group)
            self.assertTrue(group.endswith("|| 'production' }}"))
            self.assertIn('cancel-in-progress: false', before_steps)
            self.assertIn('queue: max', before_steps)
            self.assertIn("ref: ${{ github.event_name == 'pull_request' && github.ref || 'master' }}", job)
        self.assertEqual(len(set(groups)), 1, 'Dependent production writes must serialize; PR checks remain independent')

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

