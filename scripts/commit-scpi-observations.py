"""Recollect SCPI after a stale-input refusal; keep the isolated financial writer."""
import argparse
import json
import os
from pathlib import Path
import re
import secrets
import shlex
import subprocess
import sys
import tempfile
import time

from producer_report_contract import validate_contract

ROOT = Path(__file__).resolve().parents[1]
WRITER = ['bash', 'scripts/commit-validated-data.sh',
          'Refresh validated official SCPI presentations', 'src/data/automated-scpi.json']
CHECK = 'bash scripts/validate-producer-publication.sh scpi'
# Fail closed for executable validation/acquisition code, helper modules, fixture
# contracts and runtime definitions. New helpers are protected without maintaining
# an incomplete list of current imports. Independent JSON observations and prose
# can still be recollected against a fresh checkout.
DEPENDENCIES = ['package.json', 'package-lock.json', 'vite.config.js',
                'scripts', '.github', 'src/lib', 'src/design-system',
                ':(glob)src/**/*.js', 'src/data/freshness-policy.json']
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


def runtime_changes(root, base, upstream):
    return subprocess.check_output(
        ['git', 'diff', '--name-only', base, upstream, '--', *DEPENDENCIES],
        cwd=root, text=True).strip()


def validate_publication(root):
    # This entry point lives in the ORIGINAL checkout: concurrently edited
    # guards and validators cannot approve their own changed contract.
    base = os.environ['VALIDATED_DATA_ORIGINAL_BASE']
    changed = runtime_changes(root, base, revision(root, 'HEAD^'))
    if changed:
        raise RuntimeError('SCPI runtime dependencies changed; a fresh ordinary workflow is required: ' + changed)
    raise SystemExit(subprocess.run(shlex.split(CHECK), cwd=root).returncode)


def record(root, output):
    refusal = output.with_suffix('.refusal.json')
    refusal.unlink(missing_ok=True)
    nonce = secrets.token_hex(32)
    result = subprocess.run(WRITER, cwd=root, text=True, stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT, env={**os.environ,
                            'GITHUB_OUTPUT': str(output), 'VALIDATED_DATA_CHECK': shlex.join(
                                [sys.executable, str(ROOT / 'scripts/commit-scpi-observations.py'), '--validate-publication']),
                            'VALIDATED_DATA_REFUSAL_FILE': str(refusal),
                            'VALIDATED_DATA_REFUSAL_NONCE': nonce})
    print(result.stdout, end='', flush=True)
    result.stale_refusal = None
    if result.returncode == 75 and refusal.exists():
        try:
            data = json.loads(refusal.read_text())
            if (data.get('schemaVersion') == 1 and data.get('reason') == 'stale-collection-inputs'
                    and data.get('kind') == 'scpi' and data.get('nonce') == nonce
                    and data.get('base') == revision(root)
                    and re.fullmatch('[a-f0-9]{40}', data.get('upstream', ''))
                    and isinstance(data.get('paths'), list) and data['paths']
                    and all(isinstance(p, str) and p for p in data['paths'])):
                result.stale_refusal = data
        except (ValueError, TypeError, AttributeError):
            pass  # Invalid evidence cannot authorize recovery.
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
    evidence = report.parent / 'scpi-recording-attempts'
    original = evidence / 'attempt-1' / report.name
    original.parent.mkdir(parents=True, exist_ok=True)
    original.write_bytes(report.read_bytes())
    plan_path = report.with_name(report.stem + '.contract-plan.json')
    if plan_path.exists():
        original.with_name(original.stem + '.contract-plan.json').write_bytes(plan_path.read_bytes())
    history, checkouts = [], []
    current, current_report = root, original
    with tempfile.TemporaryDirectory(prefix='scpi-recollect-') as temp:
        temp = Path(temp)
        try:
            for attempt in range(1, attempts + 1):
                state = {'attempt': attempt, 'collectionBase': revision(current),
                         'report': current_report.relative_to(report.parent).as_posix(),
                         'phase': 'source-plan-validation', 'status': 'attempted'}
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
                refusal = getattr(result, 'stale_refusal', None)
                if refusal:
                    state['refusal'] = refusal
                if source_failed(read_report(current_report)):
                    raise RuntimeError('SCPI source, financial or provenance failure; recollection is forbidden')
                if not refusal or attempt == attempts:
                    raise RuntimeError('SCPI recording refused; no unsafe retry or forced write')
                run(['git', 'fetch', 'origin', 'master'], root)
                latest = revision(root, 'FETCH_HEAD')
                if latest == state['collectionBase']:
                    raise RuntimeError('SCPI recording refused without a newer master')
                changed = runtime_changes(root, state['collectionBase'], latest)
                if changed:
                    raise RuntimeError('SCPI runtime dependencies changed (including the validation contract); a fresh ordinary workflow is required: ' + changed)
                time.sleep(2 ** attempt)
                checkout = temp / f'checkout-{attempt + 1}'
                run(['git', 'worktree', 'add', '--detach', str(checkout), latest], root)
                checkouts.append(checkout)
                current_report = evidence / f'attempt-{attempt + 1}' / report.name
                current_report.parent.mkdir(parents=True, exist_ok=True)
                state.update(recoveryBase=latest, recoveryPhase='acquisition',
                             recoveryReport=current_report.relative_to(report.parent).as_posix())
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
        except BaseException as error:
            if history:
                if history[-1]['status'] == 'attempted':
                    history[-1]['status'] = 'failed'
                history[-1]['recoveryError'] = f'{type(error).__name__}: {error}'
            raise
        finally:
            # The registered report must represent the latest actual attempt,
            # including an interrupted/invalid report. Older successes cannot
            # mask its omissions. The original attempts stay in a separate
            # support artifact, never among the monitor's current reports.
            try:
                (evidence / 'recording-status.json').write_text(json.dumps(
                    {'operation': 'SCPI recording', 'attempts': history}, ensure_ascii=False, indent=2) + '\n')
                current_plan = current_report.with_name(current_report.stem + '.contract-plan.json')
                if current_report.exists():
                    try:
                        latest = json.loads(current_report.read_text())
                        if not isinstance(latest, dict): raise ValueError('Invalid source report shape')
                        latest['recordingAttempts'] = history
                        report.write_text(json.dumps(latest, ensure_ascii=False, indent=2) + '\n')
                    except (TypeError, ValueError):
                        report.write_bytes(current_report.read_bytes())
                    if current_plan.exists():
                        plan_path.write_bytes(current_plan.read_bytes())
                    else:
                        plan_path.unlink(missing_ok=True)
                elif current_plan.exists():
                    report.unlink(missing_ok=True)
                    plan_path.write_bytes(current_plan.read_bytes())
                else:
                    # No current scope was declared: expose the missing report
                    # instead of certifying the previous attempt's old scope.
                    report.unlink(missing_ok=True)
                    plan_path.unlink(missing_ok=True)
            finally:
                cleanup_errors = []
                for checkout in reversed(checkouts):
                    try:
                        run(['git', 'worktree', 'remove', '--force', str(checkout)], root)
                    except Exception as error:
                        cleanup_errors.append(str(error))
                if cleanup_errors:
                    (evidence / 'cleanup-errors.json').write_text(json.dumps(cleanup_errors) + '\n')
                    # Attempt every removal; retain the primary failure, if any.
                    if sys.exc_info()[0] is None:
                        raise RuntimeError('SCPI worktree cleanup failed: ' + '; '.join(cleanup_errors))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--report', type=Path)
    mode.add_argument('--validate-publication', action='store_true')
    parser.add_argument('command', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    if args.validate_publication:
        validate_publication(Path.cwd())
        return
    command = args.command[1:] if args.command[:1] == ['--'] else args.command
    result = publish(ROOT, args.report, command=command)
    text = ''.join(f'{key}={result[key]}\n' for key in ('changed', 'commit_sha', 'collection_failed'))
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
            output.write(text)
    print(text, end='')


if __name__ == '__main__':
    main()
