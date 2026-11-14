"""Qualify exact publication readers without weakening acquisition-input guards.

Monthly and ETF writers qualify their own narrow sets of downstream readers.
The shared source guard and its financial calendar comparison stay authoritative;
all accepted changes require regeneration and full validation on the rebased tree.
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
# Observed refusal43234485008: navigation/editorial/comparison publication
# changed during acquisition. All nine paths are outside the real baseline
# dependency graph on both snapshots; never grant them a shared-source exemption.
PUBLICATION_READERS = {
    'scripts/build-app-inventory.mjs',
    'scripts/route-budgets.json',
    'scripts/test-weekly-publications.mjs',
    'src/App.jsx',
    'src/data/editorial-calendar.js',
    'src/pages/Home.jsx',
    'src/pages/index-comparator/App.jsx',
    'src/pages/index-comparator/index-comparator.css',
    'src/tools.js',
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
ETF_BASELINE = 'scripts/export-etf-pilot-baseline.mjs'
ETF_ACQUISITION_ENTRIES = (ETF_BASELINE, 'scripts/build-automation-targets.mjs')
# Refusal42488861255 after#1210. These are downstream qualification readers,
# not the issuer acquisition baseline. Prove that separation on both trees;
# retain the shared source guard and the complete merged-tree financial checks.
ETF_READERS = {'docs/data-operations-coordination.md',
               'scripts/lib/data-qualification.mjs',
               'scripts/test-data-qualification.mjs',
               # Cron43451234453: an independent INSEE receipt advanced during
               # ETF acquisition. Neither acquisition baseline/target generator
               # imports it. Check both trees below, preserve the newer receipt,
               # and rebuild/revalidate the complete financial publication.
               # Active inflation data, collector code and configs stay guarded.
               'scripts/source-snapshots/inflation-automated.json'}
# Actual late refusal43591714596 after #1275. These readers are qualified only
# after checking both original and upstream acquisition graphs below.
SUBSCRIBER_READERS = {
    'scripts/playwright-subscriber-profiles.mjs',
    'scripts/test-subscriber-profiles.mjs',
    'src/pages/dca-profiles/App.jsx',
    'src/pages/dca-profiles/DcaApp.jsx',
    'src/pages/dca-profiles/README.md',
    'src/pages/dca-profiles/SubscriberProfiles.jsx',
    'src/pages/dca-profiles/dca-profiles.css',
    'src/pages/dca-profiles/subscriber-profiles.js',
}
SUBSCRIBER_TEST_INPUTS = {'package.json', 'scripts/ci-browser-checks.json'}
MARKET_ACQUISITION_ENTRIES = (BASELINE, 'scripts/export-equity-candidates.mjs',
                              'scripts/export-monthly-candidates.mjs')


def at(ref, path):
    proc = subprocess.run(['git', 'show', f'{ref}:{path}'], capture_output=True)
    return proc.stdout.decode('utf-8') if proc.returncode == 0 else None


def baseline_dependencies(ref, entrypoint=BASELINE):
    """Fail closed if the baseline starts reading one of these supposed readers."""
    seen, todo = set(), [entrypoint]
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


def check_etf(base, upstream='HEAD^'):
    paths = set(filter(None, subprocess.check_output(
        ['git', 'diff', '--name-only', '--no-renames', '-z', base, upstream],
        text=True).split('\0')))
    permitted = paths & ETF_READERS
    if permitted:
        for ref in (base, upstream):
            for entry in ETF_ACQUISITION_ENTRIES:
                if baseline_dependencies(ref, entry) & ETF_READERS:
                    raise ValueError('An ETF qualification reader is an acquisition dependency: ' + entry)
    permitted |= subscriber_readers(base, upstream, paths, ETF_ACQUISITION_ENTRIES)
    return checked_readers('etf', base, upstream, permitted)


def subscriber_readers(base, upstream, paths, entries):
    requested = paths & (SUBSCRIBER_READERS | SUBSCRIBER_TEST_INPUTS)
    if not requested:
        return set()
    for ref in (base, upstream):
        for entry in entries:
            if baseline_dependencies(ref, entry) & (SUBSCRIBER_READERS | SUBSCRIBER_TEST_INPUTS):
                raise ValueError('A subscriber reader/test configuration is an acquisition dependency: ' + entry)
    for path in paths & SUBSCRIBER_TEST_INPUTS:
        if not guard.subscriber_test_addition_only(base, upstream, path):
            raise ValueError('Protected acquisition/validation configuration changed: ' + path)
    return requested


def checked_readers(kind, base, upstream, permitted):
    original = guard.ALLOWED[kind]
    try:
        guard.ALLOWED[kind] = original | permitted
        changed = guard.check(kind, base, upstream)
    finally:
        guard.ALLOWED[kind] = original
    return {'changedPaths': changed, 'qualifiedPublicationReaders': sorted(permitted),
            'financialRevalidationRequired': True,
            'sourceControlsRenewedByThisAdapter': False}


def check(base, upstream='HEAD^'):
    paths = set(filter(None, subprocess.check_output(
        ['git', 'diff', '--name-only', '--no-renames', '-z', base, upstream],
        text=True).split('\0')))
    readers = BUDGET_READERS | PUBLICATION_READERS
    permitted = paths & (readers | {AUDIT_READER})
    if paths & readers:
        for ref in (base, upstream):
            if baseline_dependencies(ref) & readers:
                raise ValueError('A supposed publication reader is an acquisition dependency')
    permitted |= subscriber_readers(base, upstream, paths, MARKET_ACQUISITION_ENTRIES)
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
    return checked_readers('market', base, upstream, permitted)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', required=True)
    parser.add_argument('--upstream', default='HEAD^')
    parser.add_argument('--kind', choices=['market', 'etf'], default='market')
    args = parser.parse_args()
    operation = check_etf if args.kind == 'etf' else check
    print(json.dumps(operation(args.base, args.upstream), sort_keys=True))
