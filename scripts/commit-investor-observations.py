"""Record 13F observations; recollect on a newer master without bypassing its guard."""
import argparse
import json
import os
import shlex
from pathlib import Path
import subprocess
import tempfile
from contextlib import contextmanager

ROOT = Path(__file__).resolve().parents[1]
WRITER = ['bash','scripts/commit-validated-data.sh','Update SEC 13F portfolios and preserve prior quarters','public/data/investors']


def run(args, root, **kwargs):
    return subprocess.run(args, cwd=root, check=True, **kwargs)


def record(root, report, output, command):
    env = {**os.environ, 'GITHUB_OUTPUT': str(output),
           'VALIDATED_DATA_CHECK': 'python3 scripts/validate-investor-publication.py check --report '
           + shlex.quote(str(report))}
    return subprocess.run(command, cwd=root, env=env).returncode


def copy_report_evidence(source, target):
    """Preserve the actual last attempt, including a missing/invalid report.

    A retry keeps the canonical basename: the declared plan must still match
    the registered report. Its immutable originals live in a support artifact.
    """
    if source == target:
        return
    if source.exists():
        target.write_bytes(source.read_bytes())
    else:
        target.unlink(missing_ok=True)
    plan = source.with_name(source.stem + '.contract-plan.json')
    destination = target.with_name(target.stem + '.contract-plan.json')
    if plan.exists():
        destination.write_bytes(plan.read_bytes())
    else:
        destination.unlink(missing_ok=True)


@contextmanager
def preserve_latest_report(target):
    state = {'path': target}
    try:
        yield state
    finally:
        copy_report_evidence(state['path'], target)


def collection_summary(root, report):
    baseline = subprocess.check_output(
        ['git', 'show', 'HEAD:public/data/investors/review-metadata.json'], cwd=root, text=True)
    previous = {row['data']['identity']['slug']: row for row in json.loads(baseline)}
    rows = []
    for check in report['managers']:
        slug = check['slug']
        prior = previous.get(slug, {})
        data = json.loads((root / 'public/data/investors' / f'{slug}.json').read_text())['data']
        snapshot = data['snapshot']
        failed = check['status'] == 'failed'
        previous_period = prior.get('data', {}).get('snapshot', {}).get('periodEnd')
        rows.append({
            **check, 'availablePeriod': snapshot['periodEnd'] if snapshot.get('primaryVerified') else None,
            'newQuarter': bool(not failed and previous_period and snapshot['periodEnd'] > previous_period),
            'newFailure': failed and (prior.get('lastAttemptStatus') != 'failed' or prior.get('lastError') != check['reason']),
        })
    return rows


def write_collection_summary(rows):
    if not os.environ.get('GITHUB_STEP_SUMMARY'):
        return
    validated = [row for row in rows if row['status'] == 'validated']
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a', encoding='utf-8') as summary:
        summary.write('\n## Bilan des observations enregistrées\n\n')
        summary.write(f"{len(rows)} profils examinés · {len(validated)} relevés validés · "
                      f"{sum(not row['changed'] for row in validated)} inchangés · "
                      f"{sum(row['newQuarter'] for row in rows)} nouveaux trimestres · "
                      f"{len(rows) - len(validated)} échecs.\n\n")
        for row in rows:
            status = ('échec nouveau ou modifié' if row['newFailure'] else 'échec déjà signalé') if row['status'] == 'failed' else (
                'nouveau trimestre' if row['newQuarter'] else 'relevé mis à jour' if row['changed'] else 'relevé inchangé')
            available = row['availablePeriod'] or 'aucun relevé SEC qualifié'
            reason = ' · ' + ' '.join(row['reason'].splitlines()) if row.get('reason') else ''
            summary.write(f"- `{row['slug']}` · {status} · {available}{reason}\n")


def publish(root, report, attempts=3, command=None):
    command = command or WRITER
    if command != WRITER:
        raise ValueError('Only the existing isolated 13F writer and owned path are allowed')
    cache = Path(os.environ.get('INVESTOR_HTTP_CACHE', '.cache/investor-http'))
    if not cache.is_absolute(): cache = (root/cache).resolve()
    network_env = {**os.environ, 'INVESTOR_HTTP_CACHE': str(cache)}
    report = report.resolve()
    evidence = report.parent / 'investor-recording-attempts'
    original = evidence / 'attempt-1' / report.name
    original.parent.mkdir(parents=True, exist_ok=True)
    original.write_bytes(report.read_bytes())
    plan = report.with_name(report.stem + '.contract-plan.json')
    if plan.exists():
        original.with_name(original.stem + '.contract-plan.json').write_bytes(plan.read_bytes())
    # Each retry gets its own checkout. The caller's files/index and all other
    # writers remain untouched, and the original financial guard still runs.
    with tempfile.TemporaryDirectory(prefix='investor-recollect-') as temp, preserve_latest_report(report) as evidence_state:
        temp = Path(temp)
        current, current_report = root, report
        for attempt in range(1, attempts + 1):
            base = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=current, text=True).strip()
            output = temp / f'outputs-{attempt}'
            status = record(current, current_report, output, command)
            if status == 0:
                result = dict(line.split('=', 1) for line in output.read_text().splitlines())
                data = json.loads(current_report.read_text())
                rows = collection_summary(current, data)
                write_collection_summary(rows)
                result['collection_failed'] = str(any(r['status'] == 'failed' for r in rows)).lower()
                result['new_collection_failure'] = str(any(r['newFailure'] for r in rows)).lower()
                copy_report_evidence(current_report, report)
                return result
            run(['git', 'fetch', 'origin', 'master'], root)
            latest = subprocess.check_output(['git', 'rev-parse', 'FETCH_HEAD'], cwd=root, text=True).strip()
            if latest == base or attempt == attempts:
                raise RuntimeError('13F recording refused; no unsafe retry or forced write.')
            checkout = temp / f'checkout-{attempt}'
            run(['git', 'worktree', 'add', '--detach', str(checkout), latest], root)
            try:
                current_report = evidence / f'attempt-{attempt+1}' / report.name
                current_report.parent.mkdir(parents=True, exist_ok=True)
                evidence_state['path'] = current_report
                current_report.unlink(missing_ok=True)
                # Reuse the existing acquisition and validator, including explicit
                # partial-source results and byte-for-byte failed-file retention.
                acquired = subprocess.run(['python3', 'scripts/update-investor-13f.py', '--output', str(current_report)], cwd=checkout, env=network_env)
                if acquired.returncode not in (0, 1) or not current_report.exists():
                    raise RuntimeError('Recollection produced no auditable observations.')
                run(['python3', 'scripts/refresh-investor-media.py'], checkout, env=network_env)
                run(['python3', 'scripts/validate-investor-publication.py', 'validate', '--report', str(current_report)], checkout)
                # Keep this checkout alive through recording; the next iteration
                # can only publish its own freshly revalidated observations.
                current = checkout
            except BaseException:
                copy_report_evidence(current_report, report)
                run(['git', 'worktree', 'remove', '--force', str(checkout)], root)
                raise
        raise RuntimeError('13F retry budget exhausted')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', required=True, type=Path)
    parser.add_argument('command', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    try:
        result = publish(ROOT, args.report, command=[v for i,v in enumerate(args.command) if not (i==0 and v=='--')])
        text = ''.join(f'{key}={result[key]}\n' for key in ('changed', 'commit_sha', 'collection_failed', 'new_collection_failure'))
        if os.environ.get('GITHUB_OUTPUT'):
            with open(os.environ['GITHUB_OUTPUT'], 'a') as out:
                out.write(text)
        print(text, end='')
    finally:
        # Remove administrative entries left by temporary, successful checkouts.
        run(['git', 'worktree', 'prune'], ROOT)


if __name__ == '__main__':
    main()
