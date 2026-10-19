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

    def test_all_receipt_includes_workflow_paths(self):
        output = self.root / 'receipt.json'
        paths = publication.publication_paths(self.root)
        with patch('sys.argv', ['data_publication.py', 'receipt', '--all', '--commit', 'HEAD', '--output', str(output)]), \
             patch.object(publication, 'publication_paths', return_value=paths):
            publication.main()
        files = json.loads(output.read_text())['files']
        self.assertIn('src/pages/dca-profiles/holdings-1.json', files)
        self.assertIn('public/data/investors/example.json', files)


if __name__ == '__main__':
    unittest.main()
