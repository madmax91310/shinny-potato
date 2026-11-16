"""Record 13F observations; recollect on a newer master without bypassing its guard."""
import argparse
import json
import os
import shlex
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
WRITER = ['bash','scripts/commit-validated-data.sh','Update SEC 13F portfolios and preserve prior quarters','public/data/investors']


def run(args, root, **kwargs):
    return subprocess.run(args, cwd=root, check=True, **kwargs)


def record(root, report, output, command):
    env = {**os.environ, 'GITHUB_OUTPUT': str(output),
           'VALIDATED_DATA_CHECK': 'python3 scripts/validate-investor-publication.py check --report '
           + shlex.quote(str(report))}
    return subprocess.run(command, cwd=root, env=env).returncode


def publish(root, report, attempts=3, command=None):
    command = command or WRITER
    if command != WRITER:
        raise ValueError('Only the existing isolated 13F writer and owned path are allowed')
    report = report.resolve()
    report.with_name(report.stem+'-attempt-1.json').write_bytes(report.read_bytes())
    # Each retry gets its own checkout. The caller's files/index and all other
    # writers remain untouched, and the original financial guard still runs.
    with tempfile.TemporaryDirectory(prefix='investor-recollect-') as temp:
        temp = Path(temp)
        current, current_report = root, report
        for attempt in range(1, attempts + 1):
            base = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=current, text=True).strip()
            output = temp / f'outputs-{attempt}'
            status = record(current, current_report, output, command)
            if status == 0:
                result = dict(line.split('=', 1) for line in output.read_text().splitlines())
                data = json.loads(current_report.read_text())
                result['collection_failed'] = str(any(r['status'] == 'failed' for r in data['managers'])).lower()
                if current_report != report:
                    report.write_bytes(current_report.read_bytes())
                return result
            run(['git', 'fetch', 'origin', 'master'], root)
            latest = subprocess.check_output(['git', 'rev-parse', 'FETCH_HEAD'], cwd=root, text=True).strip()
            if latest == base or attempt == attempts:
                raise RuntimeError('13F recording refused; no unsafe retry or forced write.')
            checkout = temp / f'checkout-{attempt}'
            run(['git', 'worktree', 'add', '--detach', str(checkout), latest], root)
            try:
                current_report = report.with_name(f'{report.stem}-attempt-{attempt+1}.json')
                current_report.unlink(missing_ok=True)
                # Reuse the existing acquisition and validator, including explicit
                # partial-source results and byte-for-byte failed-file retention.
                acquired = subprocess.run(['python3', 'scripts/update-investor-13f.py', '--output', str(current_report)], cwd=checkout)
                if acquired.returncode not in (0, 1) or not current_report.exists():
                    raise RuntimeError('Recollection produced no auditable observations.')
                run(['python3', 'scripts/refresh-investor-media.py'], checkout)
                run(['python3', 'scripts/validate-investor-publication.py', 'validate', '--report', str(current_report)], checkout)
                # Keep this checkout alive through recording; the next iteration
                # can only publish its own freshly revalidated observations.
                current = checkout
            except BaseException:
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
        text = ''.join(f'{key}={result[key]}\n' for key in ('changed', 'commit_sha', 'collection_failed'))
        if os.environ.get('GITHUB_OUTPUT'):
            with open(os.environ['GITHUB_OUTPUT'], 'a') as out:
                out.write(text)
        print(text, end='')
    finally:
        # Remove administrative entries left by temporary, successful checkouts.
        run(['git', 'worktree', 'prune'], ROOT)


if __name__ == '__main__':
    main()
