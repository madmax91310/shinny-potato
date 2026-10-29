"""Bounded fresh-master dispatches; never replay an obsolete workflow snapshot."""
from automation_status_storage import encode_status
from automation_status_git import write_status
import copy
import datetime as dt
import base64
import json
import re

UTC = dt.timezone.utc
DELAYS = (900, 3600, 14400)
WINDOW = 86400
MAX_DISPATCHES = 2
# Only unattended, input-free collectors. Never onboarding, rehearsals or deployment.
EXCLUDED = {'onboard-assets.yml', 'rehearse-refresh.yml', 'deploy-pages.yml'}
TRANSIENT = re.compile(r'timed?\s*out|timeout|temporar|connection|incomplete.?read|remote.*changed|HTTP(?: Error)?[ :]+(?:408|429|500|502|503|504)\b', re.I)
REVIEW = re.compile(r'conflict|contradic|mismatch|do not reconcile|qualification|wrong.*identity|Suspicious|differs|clause officielle', re.I)


def stamp(value):
    try:
        parsed = dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
        return parsed.astimezone(UTC) if parsed.tzinfo else None
    except (AttributeError, TypeError, ValueError):
        return None


def recovery_reason(row, config, now):
    completed = stamp(row.get('completedAt'))
    if completed and completed > now:
        return None
    failures = row.get('failures', [])
    # A refused recording includes the concurrent-master guard and push transport.
    # A new dispatch re-collects AND revalidates; it does not rebase old output.
    if row.get('recordingStatus') == 'failure' and any(f.get('step') == 'Commit validated observations' for f in failures):
        return 'recording-failed'
    for failure in row.get('dataFailures', {}).values():
        cause = str(failure.get('cause', ''))
        if TRANSIENT.search(cause) and not REVIEW.search(cause):
            return 'transient-source'
    if row.get('status') == 'failure' and any(TRANSIENT.search(str(f)) and not REVIEW.search(str(f)) for f in failures):
        return 'transient-run'
    if completed and (now - completed).total_seconds() > config['maxAgeHours'] * 3600:
        return 'silent-collector'
    # No automatic first-ever runs: on-demand/inactive configuration stays explicit.
    return None


def plan_recovery(state, registry, now, active_runs):
    """Reserve before POST so crashes cannot dispatch twice on the next monitor tick.

    Rolling per-workflow budget survives changing incidents and run IDs. A running
    collector or a newer run not yet observed by monitoring prevents duplication.
    """
    ledger = copy.deepcopy(state.get('recovery', {}))
    plans = []
    for workflow, config in registry.items():
        if workflow in EXCLUDED or config.get('publishes') is False:
            continue
        row = state.get('workflows', {}).get(workflow, {})
        reason = recovery_reason(row, config, now)
        previous = ledger.get(workflow, {})
        # A clock ahead of this monitor must not erase a durable reservation and
        # permit a duplicate dispatch. Keep it until its own rolling window ends.
        attempts = [a for a in previous.get('attempts', []) if (at := stamp(a.get('at'))) and (now-at).total_seconds() < WINDOW]
        entry = {**previous, 'attempts': attempts, 'reason': reason,
                 'lastSuccessAt': row.get('lastCollectionSuccessAt'), 'observedRunId': row.get('runId')}
        ledger[workflow] = entry
        if not reason:
            entry.update(status='idle', nextAttemptAt=None)
            continue
        if len(attempts) >= len(DELAYS):
            eligible = stamp(attempts[0]['at']) + dt.timedelta(seconds=WINDOW)
            entry.update(status='budget-exhausted', nextAttemptAt=eligible.isoformat())
            continue
        # First wait is measured from actual failure completion, later waits from
        # the latest dispatch. Silent collectors get one opportunity immediately.
        baseline = stamp(attempts[-1]['at']) if attempts else stamp(row.get('completedAt'))
        eligible = baseline + dt.timedelta(seconds=DELAYS[len(attempts)]) if baseline else now
        if reason == 'silent-collector' and not attempts:
            eligible = now
        entry['nextAttemptAt'] = eligible.isoformat()
        runs = active_runs.get(workflow, [])
        observed=(row.get('runId',0),row.get('attempt',1))
        if any(r.get('status') != 'completed' or ((r.get('id',0),r.get('run_attempt',1)) > observed and r.get('conclusion')not in ('cancelled','skipped','neutral')) for r in runs):
            entry['status'] = 'awaiting-current-run'
            continue
        if now < eligible or len(plans) >= MAX_DISPATCHES:
            entry['status'] = 'waiting'
            continue
        attempt = {'at': now.isoformat(), 'reason': reason, 'sourceRunId': row.get('runId'), 'status': 'reserved', 'ref': 'master'}
        entry['attempts'].append(attempt)
        entry.update(status='reserved', nextAttemptAt=(now + dt.timedelta(seconds=DELAYS[min(len(attempts), 2)])).isoformat())
        plans.append(workflow)
    return ledger, plans


def dispatch_recovery(api, ledger, plans):
    """An uncertain POST is not immediately retried; its reservation is durable."""
    for workflow in plans:
        entry = ledger[workflow]
        try:
            api(f'/actions/workflows/{workflow}/dispatches', 'POST', {'ref': 'master'})
            status, error = 'dispatched', None
        except Exception as exception:
            status, error = 'dispatch-failed', f'{type(exception).__name__}: {exception}'[:300]
        entry['status'] = status
        entry['attempts'][-1].update(status=status, error=error)


def persist_and_dispatch(api, path, payload, state, plans, compressed=False):
    """The conditional status write is the transaction boundary before dispatch."""
    saved = write_status(api, path, payload)
    if plans:
        dispatch_recovery(api, state['recovery'], plans)
        payload = {**payload, 'sha': saved['content']['sha'],
                   'content': encode_status(state, compressed=compressed)}
        write_status(api, path, payload)
