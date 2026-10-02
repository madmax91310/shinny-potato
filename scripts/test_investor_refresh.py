"""Regression checks for automatic 13F snapshot refresh."""
import importlib.util
import json
import pathlib
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('refresh_13f', pathlib.Path(__file__).with_name('update-investor-13f.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def portfolio(period, weight=1):
    return {'as_of': 'checked-now', 'data': {'snapshot': {'periodEnd': period, 'holdings': [{'weight': weight}]}}}


class RefreshTests(unittest.TestCase):
    def test_unchanged_ignores_check_timestamp(self):
        with tempfile.TemporaryDirectory() as folder:
            path = pathlib.Path(folder) / 'li-lu.json'
            prior = portfolio('2026-06-30')
            prior['as_of'] = 'previous-check'
            path.write_text(json.dumps(prior))
            self.assertIsNone(module.prepare_update(path, portfolio('2026-06-30')))

    def test_older_report_cannot_overwrite(self):
        with tempfile.TemporaryDirectory() as folder:
            path = pathlib.Path(folder) / 'li-lu.json'
            path.write_text(json.dumps(portfolio('2026-06-30')))
            with self.assertRaisesRegex(ValueError, 'older report'):
                module.prepare_update(path, portfolio('2026-03-31'))

    def test_provider_failure_leaves_all_files_intact(self):
        with tempfile.TemporaryDirectory() as folder:
            directory = pathlib.Path(folder)
            for slug in module.MANAGERS:
                (directory / f'{slug}.json').write_text(json.dumps(portfolio('2026-06-30')))
            before = {p.name: p.read_bytes() for p in directory.iterdir()}
            def failing_fetch(slug, *args):
                if slug == 'gates-trust':
                    raise RuntimeError('provider unavailable')
                return portfolio('2026-09-30')
            with patch.object(module.time, 'sleep'), self.assertRaises(RuntimeError):
                module.refresh(directory, failing_fetch)
            self.assertEqual(before, {p.name: p.read_bytes() for p in directory.iterdir()})

    def test_new_quarter_and_amendment_are_saved(self):
        with tempfile.TemporaryDirectory() as folder:
            directory = pathlib.Path(folder)
            with patch.object(module.time, 'sleep'):
                module.refresh(directory, lambda *args: portfolio('2026-09-30'))
                module.refresh(directory, lambda *args: portfolio('2026-09-30', .9))
            for slug in module.MANAGERS:
                data = json.loads((directory / f'{slug}.json').read_text())
                self.assertEqual(data['data']['snapshot']['holdings'][0]['weight'], .9)
            self.assertFalse(list(directory.glob('*.tmp')))


if __name__ == '__main__':
    unittest.main()
