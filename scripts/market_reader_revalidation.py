"""Qualify exact publication readers without weakening acquisition-input guards.

Only the monthly writer uses this adapter. The shared guard and its financial
calendar comparison remain authoritative; all accepted changes still require
regeneration and the unchanged complete financial validation on the rebased tree.
"""
import argparse
import json
from pathlib import Path
import posixpath
import re
import subprocess
import observation_rebase_guard as guard

BUDGET_READERS = {
    'docs/budget-ten-additional-2026-10-30.md',
    'src/pages/budget-profiles/additional-profiles-2026-10-30.json',
    'src/pages/budget-profiles/image.js',
    'docs/budget-text-publication-2026-10-30.md',
    'scripts/playwright-budget-profiles.mjs',
    'scripts/test-budget-profiles.mjs',
    'src/pages/budget-profiles/App.jsx',
    'src/pages/budget-profiles/data.js',
    'src/pages/budget-profiles/lib.js',
    'src/pages/budget-profiles/storage.js',
}
AUDIT_READER = 'scripts/test_audit_workflows.py'
WORKFLOW = '.github/workflows/update-non-bond-expansion.yml'
OLD_GROUP = "      group: non-bond-data-${{ github.event_name == 'pull_request' && github.ref || 'production' }}"
NEW_GROUP = "      # The ordinary ETF writer validates against these same non-bond outputs.\n      # Serialize before checkout; do not weaken the rebase/input guard.\n      group: active-market-data-${{ github.event_name == 'pull_request' && format('{0}-{1}', github.workflow, github.ref) || 'production' }}"
PREPARE = 'scripts/prepare-market-projections.sh'
OLD_PREPARE = '''#!/usr/bin/env bash
# Recompute from the combined canonical sources. No network and no source edits.
set -euo pipefail
python3 scripts/observation_rebase_guard.py --kind market --base "${VALIDATED_DATA_ORIGINAL_BASE:?Missing collection base}"
node scripts/build-equity-history-links.mjs
node scripts/build-monthly-duel-returns.mjs
node scripts/build-equity-duel-returns.mjs
node scripts/build-ranking-annual.mjs
node scripts/build-performance-links.mjs
'''
NEW_PREPARE = OLD_PREPARE.replace(
    'python3 scripts/observation_rebase_guard.py --kind market',
    'python3 scripts/market_reader_revalidation.py').replace(
    '\nnode scripts/build-equity-history-links.mjs',
    "\npython3 -m unittest discover -s scripts -p 'test_market_reader_revalidation.py'"
    "\npython3 -m unittest discover -s scripts -p 'test_audit_workflows.py'"
    '\nnode scripts/build-equity-history-links.mjs')
ROLLOUT_FILES = {'scripts/market_reader_revalidation.py',
                 'scripts/test_market_reader_revalidation.py'}
BASELINE = 'scripts/export-monthly-baseline.mjs'


def at(ref, path):
    proc = subprocess.run(['git', 'show', f'{ref}:{path}'], capture_output=True)
    return proc.stdout.decode('utf-8') if proc.returncode == 0 else None


def baseline_dependencies(ref):
    """Fail closed if the baseline starts reading one of these supposed readers."""
    seen, todo = set(), [BASELINE]
    while todo:
        path = todo.pop()
        if path in seen:
            continue
        text = at(ref, path)
        if text is None:
            raise ValueError('Unknown monthly baseline dependency: ' + path)
        seen.add(path)
        if path.endswith('.json'):
            continue
        if re.search(r'\bimport\s*\((?!\s*[\'"])', text):
            raise ValueError('Unresolved dynamic baseline import: ' + path)
        for child in re.findall(r'\b(?:from\s*|import\s*\(\s*|import\s*)[\'"](\.[^\'"]+)[\'"]', text):
            target = posixpath.normpath(posixpath.join(posixpath.dirname(path), child))
            if target.startswith('../'):
                raise ValueError('Baseline dependency outside repository')
            if not posixpath.splitext(target)[1]:
                candidates = [target + s for s in ('.js', '.mjs', '.json', '/index.js')]
                target = next((p for p in candidates if at(ref, p) is not None), target)
            todo.append(target)
    return seen


def check(base, upstream='HEAD^'):
    paths = set(filter(None, subprocess.check_output(
        ['git', 'diff', '--name-only', '--no-renames', '-z', base, upstream],
        text=True).split('\0')))
    permitted = paths & (BUDGET_READERS | {AUDIT_READER})
    if paths & BUDGET_READERS:
        for ref in (base, upstream):
            if baseline_dependencies(ref) & BUDGET_READERS:
                raise ValueError('A supposed publication reader is an acquisition dependency')
    if WORKFLOW in paths:
        before, after = at(base, WORKFLOW), at(upstream, WORKFLOW)
        if before is not None and before.count(OLD_GROUP) == 1 and before.replace(OLD_GROUP, NEW_GROUP, 1) == after:
            permitted.add(WORKFLOW)
    if PREPARE in paths and at(base, PREPARE) == OLD_PREPARE and at(upstream, PREPARE) == NEW_PREPARE:
        permitted.add(PREPARE)
    for path in paths & ROLLOUT_FILES:
        # First introduction only: these files did not exist during acquisition.
        # A future change to the adapter itself still requires recollection.
        runtime = Path(__file__).parent / Path(path).name
        if at(base, path) is None and runtime.is_file() and at(upstream, path) == runtime.read_text():
            permitted.add(path)
    original = guard.ALLOWED['market']
    try:
        guard.ALLOWED['market'] = original | permitted
        changed = guard.check('market', base, upstream)
    finally:
        guard.ALLOWED['market'] = original
    return {'changedPaths': changed, 'qualifiedPublicationReaders': sorted(permitted),
            'financialRevalidationRequired': True,
            'sourceControlsRenewedByThisAdapter': False}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', required=True)
    parser.add_argument('--upstream', default='HEAD^')
    args = parser.parse_args()
    print(json.dumps(check(args.base, args.upstream), sort_keys=True))
