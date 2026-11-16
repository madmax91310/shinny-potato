"""Recollect SCPI after a stale-input refusal; keep the isolated financial writer."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import time

from producer_report_contract import validate_contract

ROOT = Path(__file__).resolve().parents[1]
WRITER = ['bash', 'scripts/commit-validated-data.sh',
          'Refresh validated official SCPI presentations', 'src/data/automated-scpi.json']
CHECK = 'bash scripts/validate-producer-publication.sh scpi'
INPUT_REFUSAL = 'Collection inputs may have changed; recollect from master:'
DEPENDENCIES = ['package.json', 'package-lock.json',
                'scripts/python-installer-requirements.txt', 'scripts/python-constraints.txt',
                '.github/workflows/update-scpi.yml', 'scripts/commit-scpi-observations.py',
                'scripts/validate-producer-publication.sh', 'scripts/commit-validated-data.sh',
                'scripts/observation_rebase_guard.py', 'scripts/producer_report_contract.py',
                'scripts/producer_report_plans.py']
PYTHON_TESTS = ['test_scpi.py', 'test_scpi_recording.py', 'test_iroko_snapshot.py',
                'test_corum.py', 'test_corum_vector.py', 'test_extended_scpi.py',
                'test_scpi_current_bulletins.py', 'test_presentation_expansion.py',
                'test_publication_periods.py']


def run(command, root, **kwargs):
    return subprocess.run(command, cwd=root, check=True, **kwargs)


def revision(root, name='HEAD'):
    return subprocess.check_output(['git', 'rev-parse', name], cwd=root, text=True).strip()


def read_report(path):
    data = json.loads(path.read_text())
    if not isinstance(data, dict) or not isinstance(data.get('resultContract'), dict):
        raise ValueError('Missing SCPI producer result contract')
    try:
        validate_contract(data['resultContract'])
    except (KeyError, TypeError, AttributeError) as error:
        raise ValueError('Invalid SCPI producer result contract') from error
    if data['resultContract']['scope'].get('kind') != 'collect_scpi':
        raise ValueError('The recording report does not belong to the SCPI producer')
    if data.get('producerStarted') or not isinstance(data.get('observations'), list) or not data['observations']:
        raise ValueError('SCPI acquisition did not finish with explicit individual observations')
    if any(not isinstance(r, dict) or not isinstance(r.get('id'), str) or not r['id']
           or r.get('status') not in ('success', 'failure', 'waiting') for r in data['observations']):
        raise ValueError('Invalid individual SCPI observation')
    return data


def source_failed(data):
    contract = data['resultContract']
    return bool(contract.get('issues') or contract.get('unscopedFailures')) or any(
        r.get('status') == 'failure' for r in data['observations']) or any(
        r['status'] == 'failed' for r in contract['outcomes'])


def record(root, output):
    result = subprocess.run(WRITER, cwd=root, text=True, stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT, env={**os.environ,
                            'GITHUB_OUTPUT': str(output), 'VALIDATED_DATA_CHECK': CHECK})
    print(result.stdout, end='', flush=True)
    return result


def validate(root):
    # Same checks as the ordinary producer, on the new code and observations.
    # Dependencies must be unchanged; install the existing locked Node tree in
    # this private checkout rather than borrowing another worktree's modules.
    run(['npm', 'ci', '--ignore-scripts'], root)
    for pattern in PYTHON_TESTS:
        run(['python3', '-m', 'unittest', 'discover', '-s', 'scripts', '-p', pattern], root)
    for command in [['node', 'scripts/test-scpi.mjs'], ['npm', 'run', 'audit:data-catalog'],
                    ['npm', 'run', 'build'], ['node', 'scripts/test-consumer-usage.mjs'],
                    ['npm', 'run', 'audit:data-provenance']]:
        run(command, root)


def save_report(source, target, history):
    data = read_report(source)
    data['recordingAttempts'] = history
    target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    plan = source.with_name(source.stem + '.contract-plan.json')
    if source != target and plan.exists():
        target.with_name(target.stem + '.contract-plan.json').write_bytes(plan.read_bytes())


def publish(root, report, attempts=3, command=None):
    if command is not None and command != WRITER:
        raise ValueError('Only the existing isolated SCPI writer and owned path are allowed')
    if type(attempts) is not int or not 1 <= attempts <= 3:
        raise ValueError('SCPI recording is limited to three attempts')
    root, report = Path(root).resolve(), Path(report).resolve()
    read_report(report)
    original = report.with_name(report.stem + '-attempt-1.json')
    original.write_bytes(report.read_bytes())
    plan = report.with_name(report.stem + '.contract-plan.json')
    if plan.exists():
        original.with_name(original.stem + '.contract-plan.json').write_bytes(plan.read_bytes())
    history, checkouts = [], []
    current, current_report = root, original
    with tempfile.TemporaryDirectory(prefix='scpi-recollect-') as temp:
        temp = Path(temp)
        try:
            for attempt in range(1, attempts + 1):
                state = {'attempt': attempt, 'collectionBase': revision(current),
                         'report': current_report.name, 'phase': 'source-plan-validation', 'status': 'attempted'}
                history.append(state)
                plan = read_report(current_report)['resultContract'].get('inputPlan', {})
                if not plan.get('durablePlan') or plan.get('codeSha') != state['collectionBase']:
                    raise ValueError('SCPI source plan does not match the collection checkout')
                state['phase'] = 'recording'
                output = temp / f'outputs-{attempt}'
                result = record(current, output)
                if result.returncode == 0:
                    values = dict(line.split('=', 1) for line in output.read_text().splitlines())
                    if not re.fullmatch('[a-f0-9]{40}', values.get('commit_sha', '')) or values.get('changed') not in ('true', 'false'):
                        raise ValueError('SCPI writer returned no valid recording receipt')
                    data = read_report(current_report)
                    values['collection_failed'] = str(source_failed(data)).lower()
                    state.update(status='succeeded', commit=values['commit_sha'])
                    save_report(current_report, report, history)
                    return values
                state.update(status='failed', reason='Financial writer refused the candidate')
                # Never reinterpret a failed financial check, push/auth error or
                # conflicting observation as permission to write the same output.
                last_line = result.stdout.rstrip().splitlines()[-1:]
                stale_inputs = bool(last_line and last_line[0].startswith('ValueError: ' + INPUT_REFUSAL)
                                    and 'observation_rebase_guard.py' in result.stdout)
                if not stale_inputs or attempt == attempts:
                    raise RuntimeError('SCPI recording refused; no unsafe retry or forced write')
                run(['git', 'fetch', 'origin', 'master'], root)
                latest = revision(root, 'FETCH_HEAD')
                if latest == state['collectionBase']:
                    raise RuntimeError('SCPI recording refused without a newer master')
                changed = subprocess.check_output(
                    ['git', 'diff', '--name-only', state['collectionBase'], latest, '--', *DEPENDENCIES],
                    cwd=root, text=True).strip()
                if changed:
                    raise RuntimeError('SCPI runtime dependencies changed (including the validation contract); a fresh ordinary workflow is required: ' + changed)
                time.sleep(2 ** attempt)
                checkout = temp / f'checkout-{attempt + 1}'
                run(['git', 'worktree', 'add', '--detach', str(checkout), latest], root)
                checkouts.append(checkout)
                current_report = report.with_name(f'{report.stem}-attempt-{attempt + 1}.json')
                state.update(recoveryBase=latest, recoveryPhase='acquisition', recoveryReport=current_report.name)
                acquired = subprocess.run(['python3', 'scripts/collect_scpi.py', '--apply',
                                           '--output', str(current_report)], cwd=checkout)
                if acquired.returncode not in (0, 1) or not current_report.exists():
                    raise RuntimeError('SCPI recollection produced no complete auditable report')
                read_report(current_report)
                save_report(current_report, report, history)
                state['recoveryPhase'] = 'validation'
                observation = checkout / 'src/data/automated-scpi.json'
                before = observation.read_bytes()
                validate(checkout)
                if observation.read_bytes() != before:
                    raise ValueError('SCPI validation modified the acquired financial observations')
                state['recoveryPhase'] = 'validated'
                current = checkout
            raise RuntimeError('SCPI recording retry budget exhausted')
        except Exception as error:
            if history:
                if history[-1]['status'] == 'attempted':
                    history[-1]['status'] = 'failed'
                history[-1]['recoveryError'] = f'{type(error).__name__}: {error}'
            raise
        finally:
            # Financial source clocks and native results stay untouched; each
            # original attempt and its predeclared plan remain separate evidence.
            try:
                if current_report.exists():
                    try:
                        save_report(current_report, report, history)
                    except (KeyError, TypeError, ValueError):
                        # Keep the last valid report and invalid raw attempt
                        # separately, with the phase and exact file identity.
                        retained = json.loads(report.read_text())
                        retained['recordingAttempts'] = history
                        report.write_text(json.dumps(retained, ensure_ascii=False, indent=2) + '\n')
                else:
                    retained = json.loads(report.read_text())
                    retained['recordingAttempts'] = history
                    report.write_text(json.dumps(retained, ensure_ascii=False, indent=2) + '\n')
            finally:
                for checkout in reversed(checkouts):
                    run(['git', 'worktree', 'remove', '--force', str(checkout)], root)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', required=True, type=Path)
    parser.add_argument('command', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    command = args.command[1:] if args.command[:1] == ['--'] else args.command
    result = publish(ROOT, args.report, command=command)
    text = ''.join(f'{key}={result[key]}\n' for key in ('changed', 'commit_sha', 'collection_failed'))
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
            output.write(text)
    print(text, end='')


if __name__ == '__main__':
    main()
