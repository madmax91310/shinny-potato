"""Revalidate an exposure transaction; never promote a cache or an old run."""
import argparse
import datetime as dt
import hashlib
import json
import os
import re
from pathlib import Path
import subprocess
from urllib.parse import urlsplit

import observation_rebase_guard as guard
from producer_report_contract import validate_contract

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = 'src/data/exposure-etf-expansion-records.json'
# Actual refusal 42668435788: the publication producer changed just these two
# outputs. The shared ETF guard already qualifies them for the common issuer
# collectors. The custom expansion adapter reads neither; seal that additional
# reviewed code on both trees, without inheriting the ETF guard's wider scope.
INDEPENDENT = {'src/data/anniversary-levels.json',
               'src/data/purchasing-power-observations.json'}
CUSTOM_COLLECTOR = 'scripts/collect_exposure_expansion.py'
CUSTOM_SHA256 = '1a3340e6a862a47d536bf8f3d520ce55da46a6c85797e26a97386571fb62954f'


def git_bytes(root, ref, path):
    return subprocess.check_output(['git', '-C', str(root), 'show', ref + ':' + path],
                                   stderr=subprocess.DEVNULL)


def inputs(root, base, upstream):
    previous = Path.cwd()
    try:
        os.chdir(root)
        changed = guard.check('etf', base, upstream)
        if set(changed) - INDEPENDENT:
            raise ValueError('Unqualified exposure input changed; recollect from master')
        if changed:
            for ref in (base, upstream):
                if hashlib.sha256(git_bytes(root, ref, CUSTOM_COLLECTOR)).hexdigest() != CUSTOM_SHA256:
                    raise ValueError('Custom exposure acquisition changed; requalify its independence')
        return changed
    finally:
        os.chdir(previous)


def load(data):
    def invalid(value):
        raise ValueError('Non-finite JSON value: ' + value)
    return json.loads(data, parse_constant=invalid)


def instant(value):
    if not isinstance(value, str):
        raise ValueError('Missing source-control timestamp')
    stamp = dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
    if stamp.tzinfo is None:
        raise ValueError('Ambiguous source-control timezone')
    return stamp


def qualified_transport_fallback(row, outcome, configured, checked):
    """A failed primary transport stays failed; only fresh qualified fields may write.

    The ordinary issuer collector already validates this exact-share response.
    Its transport evidence must independently cover every field that accounts
    for the failed composite outcome. This is not a source-success outcome.
    """
    if (configured.get('parser') != 'wisdomtree-html'
            or outcome.get('status') != 'failed'
            or outcome.get('operationAttempted') is not True
            or outcome.get('sourceAttempted') is False):
        return False
    errors = row.get('collectionErrors', [])
    if not errors or any(e.get('field') not in {'rankings-primary-http', 'aum-primary-http'}
                         or e.get('phase') != 'acquisition'
                         or e.get('qualifiedFallbackAvailable') is not True for e in errors):
        return False
    if len({e['field'] for e in errors}) != len(errors):
        return False
    if outcome.get('field') != ', '.join(sorted(e['field'] for e in errors)):
        return False
    attempts = row.get('sourceAttempts', [])
    record = row.get('record', {})
    for error in errors:
        url = error.get('url', '')
        parsed = urlsplit(url)
        if parsed.scheme != 'https' or parsed.netloc != 'dataspanapi.wisdomtree.com':
            return False
        if error['field'] == 'aum-primary-http':
            from issuer_routes import ROUTES
            if url != ROUTES['wisdomtree']['fundDirectory']:
                return False
            fields = {'aum'}
        else:
            if parsed.path != '/funddetails/rankings/':
                return False
            fields = set(error.get('qualifiedFields', []))
            retained = {f['field'] for f in row.get('retainedFields', [])}
            if not fields or not fields <= {'countries', 'sectors', 'holdings'}:
                return False
            if {'countries', 'sectors', 'holdings'} - fields - (retained & {'countries'}):
                return False
        validated = [a for a in attempts if (a.get('url') or a.get('sourceUrl')) == url
                     and a.get('status') == 'validated' and set(a.get('fields', [])) == fields]
        if len(validated) != 1:
            return False
        transports = attempts + validated[0].get('transportAttempts', [])
        if not any((a.get('url') or a.get('sourceUrl')) == url
                   and a.get('status') == 'downloaded'
                   and a.get('transport') in {'browser', 'ordinary-public-browser'} for a in transports):
            return False
        for name in fields:
            field = record.get(name, {})
            if (field.get('sourceUrl') != url
                    or field.get('checkedAt') != checked.date().isoformat()
                    or not re.fullmatch(r'[0-9a-f]{64}', str(field.get('sha256', '')))):
                return False
    return True


def audit(root, report, started, base, *, only=None, run_id=None, attempt=None, now=None):
    # Determine the requested instruments from inputs before examining results.
    config = load((root / 'scripts/exposure-etf-expansion.json').read_bytes())['instruments']
    configured = {s['isin']: s for s in config}
    requested = list(configured) if only is None else only
    if len(requested) != len(set(requested)) or set(requested) - set(configured):
        raise ValueError('Unknown or duplicated requested exposure instrument')
    wanted = set(requested)
    contract = validate_contract(report['resultContract'])
    plan_contract = validate_contract(started['resultContract'])
    plan = contract.get('inputPlan')
    if not plan or plan != plan_contract.get('inputPlan'):
        raise ValueError('Observation and pre-acquisition plan disagree')
    if plan.get('producer') != 'collect_exposure_expansion' or plan.get('reportStem') != 'exposure-expansion':
        raise ValueError('Wrong producer plan')
    if plan.get('codeSha') != base:
        raise ValueError('Report belongs to another acquisition revision')
    if not run_id or not attempt or str(plan.get('runId')) != str(run_id) or str(plan.get('attempt')) != str(attempt):
        raise ValueError('Report belongs to another GitHub run or attempt')
    scope = contract['scope']
    prefix = 'etf-exposure-expansion-'
    if set(scope['expectedIds']) != {prefix + isin for isin in configured}:
        raise ValueError('Expected instrument universe differs from configured inputs')
    if set(scope['requestedIds']) != {prefix + isin for isin in wanted}:
        raise ValueError('Report selection differs from requested instruments')
    now = now or dt.datetime.now(dt.timezone.utc)
    checked = instant(report['checkedAt'])
    if not instant(plan['declaredAt']) <= checked <= now:
        raise ValueError('Invalid acquisition/control chronology')
    rows = report['shares']
    ids = [r['isin'] for r in rows]
    if len(ids) != len(set(ids)) or set(ids) != wanted:
        raise ValueError('Missing, duplicate or unselected native exposure result')
    current = load((root / REGISTRY).read_bytes())
    previous = load(git_bytes(root, base, REGISTRY))
    if set(current) != set(previous):
        raise ValueError('Exposure publication cannot add or remove instruments')
    outcomes = {r['instrument']: r for r in contract['outcomes']}
    from collect_exposure_expansion import qualify, qualify_refresh
    for row in rows:
        isin = row['isin']
        old, value = previous[isin], current[isin]
        if row.get('status') == 'failed':
            if value != old or outcomes[isin]['status'] != 'failed':
                raise ValueError('Failed source changed its last valid record: ' + isin)
            continue
        outcome = outcomes[isin]
        source_success = (outcome['status'] in ('succeeded', 'unchanged-verified')
                          and outcome.get('sourceAttempted') is True)
        fallback = qualified_transport_fallback(row, outcome, configured[isin], checked)
        if row.get('status') != 'validated' or not (source_success or fallback):
            raise ValueError('A missing result or cache cannot certify source success: ' + isin)
        if value != row['record']:
            raise ValueError('Registry differs from validated source record: ' + isin)
        if any(value.get(k) != old.get(k) for k in ('currency', 'productId')):
            raise ValueError('Exact instrument identity changed: ' + isin)
        # Reuse the actual producer's qualification on the normalized observation.
        # The operation's exact ISIN is bound above to the declared input plan.
        qualify({**value, 'isin': isin}, configured[isin])
        retained = row.get('retainedFields', [])
        for field in retained:
            name = field['field']
            if name != 'countries' or value.get(name) != old.get(name):
                raise ValueError('Retained field changed value, date or proof: ' + isin)
            candidate = {**value, 'isin': isin, 'unavailable': row.get('unavailable', [])}
            candidate.pop(name, None)
            if not qualify_refresh(candidate, configured[isin], old, now):
                raise ValueError('Retained country scope is no longer qualified: ' + isin)
        for name in ('countries', 'sectors', 'holdings', 'performance'):
            field = value.get(name)
            if not isinstance(field, dict):
                continue
            for key in ('asOf', 'checkedAt'):
                stamp = field.get(key)
                prior_field = old.get(name)
                old_stamp = prior_field.get(key) if isinstance(prior_field, dict) else None
                if stamp and (dt.date.fromisoformat(stamp[:10]) > now.date() or old_stamp and stamp < old_stamp):
                    raise ValueError('Financial/control date regressed or is future: ' + isin + ' ' + name)
    for isin in set(previous) - wanted:
        if current[isin] != previous[isin]:
            raise ValueError('Targeted collection changed an unselected instrument: ' + isin)
    return len(rows)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=('inputs', 'validate'))
    parser.add_argument('--base', required=True)
    parser.add_argument('--upstream', default='HEAD^')
    parser.add_argument('--report', type=Path)
    parser.add_argument('--plan', type=Path)
    parser.add_argument('--only', nargs='*')
    args = parser.parse_args()
    if args.mode == 'inputs':
        print('Independent publication outputs:', inputs(ROOT, args.base, args.upstream))
    else:
        if not args.report or not args.plan:
            parser.error('--report and --plan are required')
        count = audit(ROOT, load(args.report.read_bytes()), load(args.plan.read_bytes()), args.base,
                      only=args.only, run_id=os.environ.get('GITHUB_RUN_ID'),
                      attempt=os.environ.get('GITHUB_RUN_ATTEMPT'))
        print('Exposure source results and unchanged/retained records verified:', count)


if __name__ == '__main__':
    main()
