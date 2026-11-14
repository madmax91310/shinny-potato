"""Publication proofs cover 13F, generated page data and exact working bytes."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import data_publication as publication


class PublicationProofs(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.previous = Path.cwd()
        os.chdir(self.root)
        self.addCleanup(os.chdir, self.previous)
        self.git('init', '-q')
        self.git('config', 'user.email', 'publication@example.invalid')
        self.git('config', 'user.name', 'Publication test')
        for name in ['src/data/active.json', 'public/data/investors/example.json',
                     'src/pages/dca-profiles/holdings-1.json', 'src/pages/dca-profiles/App.jsx',
                     'scripts/source-snapshots/proof.json', 'public/data/publication-manifest.json',
                     'docs/asset-tool-routing.json']:
            self.write(name, '{"value":1}\n')
        self.write('.github/workflows/collect.yml', "run: bash scripts/commit-validated-data.sh 'Refresh validated data' src/data/active.json public/data/investors src/pages/dca-profiles/holdings*.json docs/asset-tool-routing.json\n")
        self.git('add', '.')
        self.git('commit', '-qm', 'initial')

    def git(self, *args):
        return subprocess.check_output(['git', *args], stderr=subprocess.PIPE, text=True).strip()

    def write(self, name, content):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)

    def test_exact_13f_receipt_is_not_empty(self):
        receipt = publication.tracked('HEAD', ['public/data/investors'])
        self.assertEqual(list(receipt), ['public/data/investors/example.json'])
        self.assertEqual(receipt['public/data/investors/example.json'],
                         self.git('rev-parse', 'HEAD:public/data/investors/example.json'))

    def test_manifest_covers_generated_paths_but_excludes_page_code_and_itself(self):
        with patch.object(publication, 'publication_paths', return_value=publication.publication_paths(self.root)):
            files = publication.manifest()['files']
        self.assertIn('src/data/active.json', files)
        self.assertIn('scripts/source-snapshots/proof.json', files)
        self.assertIn('public/data/investors/example.json', files)
        self.assertIn('src/pages/dca-profiles/holdings-1.json', files)
        self.assertNotIn('src/pages/dca-profiles/App.jsx', files)
        self.assertNotIn(publication.MANIFEST, files)
        self.assertNotIn('docs/asset-tool-routing.json', files)

    def test_manifest_hashes_composed_bytes_instead_of_head(self):
        path = 'public/data/investors/example.json'
        old = publication.tracked('HEAD', [path])[path]
        self.write(path, '{"value":2}\n')
        new = publication.manifest()['files'][path]
        self.assertNotEqual(old, new)
        self.assertEqual(new, self.git('hash-object', path))

    def composed_new_archive(self):
        code = self.git('rev-parse', 'HEAD')
        archive = 'public/data/investors/archive/example/2026-06-30.json'
        self.write(archive, '{"quarter":"2026-06-30"}\n')
        self.write('public/data/withheld.json', '{"heldBack":true}\n')
        self.git('add', '.')
        self.git('commit', '-qm', 'New validated data files')
        data = self.git('rev-parse', 'HEAD')
        self.git('checkout', '-q', code)
        # Same copy-based composition as the publisher: this is not a Git add.
        self.write(archive, '{"quarter":"2026-06-30"}\n')
        self.write('public/data/unexpected.json', '{"notValidated":true}\n')
        return archive, data

    def test_composite_archive_missing_from_code_tree_is_sealed_from_actual_bytes(self):
        archive, data = self.composed_new_archive()
        self.assertNotIn(archive, publication.manifest()['files'], 'Reproduce the old missing fingerprint')
        files = publication.manifest(data)['files']
        self.assertEqual(files[archive], self.git('hash-object', archive))
        self.assertNotIn('public/data/withheld.json', files, 'A file absent from the served tree is not certified')
        self.assertNotIn('public/data/unexpected.json', files, 'Untracked files outside both snapshots stay excluded')
        self.write(archive, '{"quarter":"2026-06-30","rebuilt":true}\n')
        self.assertEqual(publication.manifest(data)['files'][archive], self.git('hash-object', archive))
        self.assertNotEqual(publication.manifest(data)['files'][archive], self.git('rev-parse', data + ':' + archive))

    def test_source_file_missing_after_composition_is_never_certified(self):
        archive, data = self.composed_new_archive()
        Path(archive).unlink()
        self.assertNotIn(archive, publication.manifest(data)['files'])

    def test_frozen_sealer_outside_checkout_uses_current_worktree_policy(self):
        import shutil
        archive, data = self.composed_new_archive()
        frozen = self.root.parent / (self.root.name + '-frozen-sealer.py')
        self.addCleanup(frozen.unlink, missing_ok=True)
        shutil.copyfile(Path(publication.__file__), frozen)
        output = self.root / 'sealed.json'
        subprocess.run(['python3', str(frozen), 'manifest', '--data-commit', data,
                        '--output', str(output)], check=True, capture_output=True)
        self.assertEqual(json.loads(output.read_text())['files'][archive], self.git('hash-object', archive))

    def test_manifest_snapshot_is_explicit_and_workflow_keeps_current_sealer(self):
        for ref in ['HEAD', '--all', '../other', 'not-a-commit']:
            with self.subTest(ref=ref), self.assertRaises(ValueError):
                publication.manifest(ref)
        workflow = (publication.ROOT / '.github/workflows/publish-validated-data.yml').read_text()
        frozen = 'cp scripts/data_publication.py "$RUNNER_TEMP/seal-data-publication.py"'
        self.assertLess(workflow.index(frozen), workflow.index('node scripts/compose-fallback-snapshot.mjs'))
        self.assertIn('python3 "$RUNNER_TEMP/seal-data-publication.py" manifest --data-commit "${{ steps.compose.outputs.data_sha }}"', workflow)

    def test_all_receipt_includes_workflow_paths(self):
        output = self.root / 'receipt.json'
        paths = publication.publication_paths(self.root)
        with patch('sys.argv', ['data_publication.py', 'receipt', '--all', '--commit', 'HEAD', '--output', str(output)]), \
             patch.object(publication, 'publication_paths', return_value=paths):
            publication.main()
        files = json.loads(output.read_text())['files']
        self.assertIn('src/pages/dca-profiles/holdings-1.json', files)
        self.assertIn('public/data/investors/example.json', files)


class CompositeWorkflowContracts(unittest.TestCase):
    def test_every_composite_pages_builder_seals_the_actual_data_commit(self):
        import re
        root = Path(__file__).resolve().parents[1]
        checked = set()
        for path in (root / '.github/workflows').glob('*.yml'):
            # Match the repository's existing workflow contract reader: job-level
            # indentation is fixed, and no optional YAML dependency is required.
            parts = re.split(r'(?m)^  ([a-zA-Z0-9_-]+):\n', path.read_text().split('\njobs:', 1)[1])
            for index in range(1, len(parts), 2):
                name, commands = parts[index:index + 2]
                composers = [command for command in ('node scripts/compose-fallback-snapshot.mjs', 'node scripts/prepare-code-data-refresh.mjs') if command in commands]
                if not composers or 'actions/upload-pages-artifact@' not in commands:
                    continue
                with self.subTest(workflow=path.name, job=name):
                    self.assertEqual(len(composers), 1)
                    capture = re.search(r'cp scripts/data_publication\.py\s+("[^"\n]+"|\S+)', commands)
                    self.assertIsNotNone(capture, 'Freeze the current sealer before a checkout can restore older code')
                    compose_at = commands.index(composers[0])
                    build_at = commands.index('npm run build', compose_at)
                    sealer = 'python3 ' + capture.group(1) + ' manifest --data-commit '
                    seal_at = commands.find(sealer, build_at)
                    self.assertGreater(seal_at, build_at, 'Seal actual generated bytes, using the frozen helper and the data commit')
                    data_output = 'data' if 'prepare-code-data-refresh.mjs' in composers[0] else 'compose'
                    expression = '${{ steps.' + data_output + '.outputs.data_sha }}'
                    self.assertIn(expression, commands[seal_at:].split('\n', 1)[0])
                    self.assertLess(capture.start(), compose_at)
                    self.assertLess(seal_at, commands.index('actions/upload-pages-artifact@', seal_at))
                    checked.add((path.name, name))
        self.assertEqual(checked, {('publish-validated-data.yml', 'publish'), ('deploy-pages.yml', 'deploy'), ('deploy-pages.yml', 'fallback-build')})


if __name__ == '__main__':
    unittest.main()
