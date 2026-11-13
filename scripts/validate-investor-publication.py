"""Revalidate current 13F observations before a bounded, financially checked write."""
import argparse
import datetime as dt
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess

import observation_rebase_guard as guard

ROOT = Path(__file__).resolve().parents[1]
# Exact independent paths reviewed for collisions d451cd6 -> c955674,
# 43496138701 (exposure outputs) and 43504937474 (ETF metadata outputs).
# None is read by the reviewed 13F acquisition/plan. A changed acquisition must
# explicitly requalify this evidence, rather than inherit an obsolete exemption.
INDEPENDENT = {
    'docs/automation-gaps.json',
    'src/data/automated-etf.json',
    'src/data/automated-indices.json',
    # Neither the pinned acquisition nor its 28-manager plan reads these.
    # These are financial inputs for other tools, not for 13F. Preserve the
    # upstream versions and rerun the full 13F audit on the combined tree.
    'src/data/exposure-etf-expansion-records.json',
    'src/pages/dca-profiles/exposures-extra-0.json',
    'src/pages/dca-profiles/exposures-extra-1.json',
    'src/pages/dca-profiles/exposures-extra-2.json',
    'public/data/asset-field-coverage.json',
    'scripts/instrument-metadata-sources.json',
}
# 12 Nov: LifeStrategy/Vanguard-only plan additions reviewed; actual 13F plans
# before/after are identical for every manager. Acquisition and independent-input
# exemptions are unchanged; all fingerprints remain mandatory.
# Defence-only primary-result additions also preserve every original 13F plan;
# frozen before/after proof: fixtures/defence-physical-allocation/13f-plan-before-after.json.
# 13 Nov: targeted anniversary/gold selection leaves all 28 13F plans intact;
# proof: fixtures/publication/xndx-official-20261113/13f-plan-before-after.json.
ACQUISITION_SHA256 = {
    'scripts/update-investor-13f.py': '84fe43e831b8c73a44a38546614ebec46f063c740579a992b238c4abfb70e792',
    'scripts/producer_report_contract.py': '54ee3ffe6e80be3d6ba2529172928063c3c1706f85c9973fe485db266778b463',
    'scripts/producer_report_plans.py': '50b52581836c7e6eb08e45e84fe4ae956fcc774c90aa5f2b8e340b2125cb7fa3',
}
JOB_WINDOW = dt.timedelta(minutes=30)  # Existing producer job timeout, not data age.


def git_bytes(root, ref, path):
    return subprocess.check_output(['git', '-C', str(root), 'show', ref + ':' + path],
                                   stderr=subprocess.DEVNULL)


def qualify_race(root, base, upstream):
    for ref in (base, upstream):
        for path, expected in ACQUISITION_SHA256.items():
            if hashlib.sha256(git_bytes(root, ref, path)).hexdigest() != expected:
                raise ValueError('13F acquisition changed; recollect and requalify independent inputs: ' + path)
    kind = 'investor-publication'
    if kind in guard.ALLOWED:
        raise ValueError('Unexpected shared guard kind')
    guard.ALLOWED[kind] = INDEPENDENT
    previous_cwd = Path.cwd()
    try:
        os.chdir(root)
        return guard.check(kind, base, upstream)
    finally:
        os.chdir(previous_cwd)
        del guard.ALLOWED[kind]


def timestamp(value):
    if not isinstance(value, str):
        raise ValueError('Missing source check timestamp')
    value = dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
    if value.tzinfo is None:
        raise ValueError('Ambiguous source check timezone')
    return value


def load_collector(root):
    spec = importlib.util.spec_from_file_location('investor_acquisition',
                                                root / 'scripts/update-investor-13f.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def audit(root, report, base, now=None):
    module = load_collector(root)
    now = now or dt.datetime.now(dt.timezone.utc)
    checked = timestamp(report['checkedAt'])
    if not dt.timedelta() <= now - checked <= JOB_WINDOW:
        raise ValueError('13F observation report is future or outside its collection job window')
    rows = report['managers']
    ids = [r['slug'] for r in rows]
    if len(ids) != len(set(ids)) or set(ids) != set(module.MANAGERS):
        raise ValueError('13F report has missing, duplicate or unexpected manager results')
    if any(r.get('status') not in ('validated', 'failed') for r in rows):
        raise ValueError('13F result has no explicit validated/failed status')
    successful = sum(r['status'] == 'validated' for r in rows)
    if type(report.get('readyToApply')) is not bool or report['readyToApply'] != bool(successful):
        raise ValueError('13F readyToApply disagrees with individual results')
    expected = 'validated' if successful == len(rows) else 'partial' if successful else 'failed'
    if report.get('status') != expected:
        raise ValueError('13F aggregate status disagrees with individual results')
    directory = root / 'public/data/investors'
    reviews = json.loads((directory / 'review-metadata.json').read_text())
    review_ids = [r['data']['identity']['slug'] for r in reviews]
    if len(review_ids) != len(set(review_ids)) or set(review_ids) != set(ids):
        raise ValueError('13F review metadata has missing, duplicate or unexpected managers')
    reviews = dict(zip(review_ids, reviews))
    prior_reviews = json.loads(git_bytes(root, base, 'public/data/investors/review-metadata.json'))
    prior_reviews = {r['data']['identity']['slug']: r for r in prior_reviews}
    for row in rows:
        slug = row['slug']
        path = 'public/data/investors/' + slug + '.json'
        current_bytes = (root / path).read_bytes()
        current = json.loads(current_bytes)
        try:
            old_bytes = git_bytes(root, base, path)
            old = json.loads(old_bytes)
        except subprocess.CalledProcessError:
            old_bytes, old = None, None
        review = reviews[slug]
        if (review['data']['snapshot']['periodEnd'] != current['data']['snapshot']['periodEnd']
                or review.get('as_of') != current.get('as_of')):
            raise ValueError('13F review identity/position date disagrees with snapshot: ' + slug)
        if row['status'] == 'failed':
            if not row.get('reason') or old_bytes is None or current_bytes != old_bytes:
                raise ValueError('Failed 13F source changed its retained holdings: ' + slug)
            for field in ('as_of', 'lastSuccessfulPollAt', 'positionsCollectedAt'):
                if review.get(field) != prior_reviews.get(slug, {}).get(field):
                    raise ValueError('Failed 13F source renewed a retained date: ' + slug)
            continue
        module.validate_portfolio(current, slug)
        period = current['data']['snapshot']['periodEnd']
        if row.get('periodEnd') != period or (old and period < old['data']['snapshot']['periodEnd']):
            raise ValueError('13F source period disagrees or regresses: ' + slug)
        if review.get('positionsCollectedAt') != current.get('as_of'):
            raise ValueError('13F position collection clock was replaced by the poll clock: ' + slug)
        poll = timestamp(review.get('lastSuccessfulPollAt'))
        if not dt.timedelta() <= checked - poll <= JOB_WINDOW:
            raise ValueError('Successful 13F source has no current successful poll: ' + slug)
        previous_poll = prior_reviews.get(slug, {}).get('lastSuccessfulPollAt')
        if previous_poll and poll < timestamp(previous_poll):
            raise ValueError('13F successful poll moved backwards: ' + slug)
    return {'validated': successful, 'retainedFailed': len(rows) - successful,
            'sourceCheckedAt': report['checkedAt']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=('validate', 'check'))
    parser.add_argument('--report', type=Path, required=True)
    args = parser.parse_args()
    base = (os.environ.get('VALIDATED_DATA_ORIGINAL_BASE') if args.mode == 'check'
            else subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip())
    if not base:
        raise ValueError('Missing original 13F collection base')
    if args.mode == 'check':
        upstream = subprocess.check_output(['git', 'rev-parse', 'HEAD^'], text=True).strip()
        print('Qualified 13F upstream changes:', qualify_race(ROOT, base, upstream))
    print(json.dumps(audit(ROOT, json.loads(args.report.read_text()), base)))
    # Validate the real combined consumer, including class consolidation and text.
    subprocess.run(['node', 'scripts/audit-investor-profiles.mjs'], check=True, cwd=ROOT)


if __name__ == '__main__':
    main()
