"""Export validated full portfolios from the daily collection, plus PEA coverage.

Full files are fetched on demand by the future scanner; they are never imported
into a route's JavaScript bundle. Known missing PEA sources are coverage gaps,
whereas a failed qualified physical source makes the collection fail visibly.
"""
import argparse
import hashlib
import datetime as dt
import json
import os
import pathlib

from data_automation import UTC, reject, write_json_atomic
from scanner_holdings import (freshness, merge_snapshot, observed_coverage,
                             parse_complete_ishares)

ROOT = pathlib.Path(__file__).resolve().parents[1]


def refresh(report, config, source_config, automated, destination, now=None):
    now = now or dt.datetime.now(UTC)
    checked = dt.datetime.fromisoformat(report['checkedAt'])
    if checked.tzinfo is None or not 0 <= (now - checked).total_seconds() <= 86400:
        reject('Scanner requires a current, timezone-aware source collection')
    check_day = checked.astimezone(UTC).date().isoformat()
    expected = [s for s in source_config['instruments']
                if s.get('collectHoldings') and s.get('holdingsAssetClass', 'Equity') == 'Equity']
    destination = pathlib.Path(destination)
    entries, failures = {}, []
    report_shares = report.get('shares', [])
    for source in expected:
        isin = source['isin']
        path = destination / (isin + '.json')
        previous = json.loads(path.read_text()) if path.exists() else None
        current, error = previous, None
        try:
            matches = [s for s in report_shares if s['isin'] == isin]
            if len(matches) != 1:
                reject('Missing or duplicate share in daily source report')
            share = matches[0]
            if share['productId'] != source['productId'] or share['currency'] != source['currency']:
                reject('Scanner source configuration identity mismatch')
            incoming = parse_complete_ishares(share, now)
            current = merge_snapshot(incoming, previous, check_day, now, config)
            write_json_atomic(path, current)
        except (ValueError, KeyError, TypeError) as exc:
            error = str(exc)
            failures.append({'isin': isin, 'reason': error})
        entry = {'name': source['name'], 'provider': source.get('provider', 'iShares'),
                 'available': False, 'status': 'collection-failed' if error else 'missing',
                 'lastAttemptAt': check_day, 'error': error}
        if current:
            state = freshness(current, now, config)
            entry.update({k: current[k] for k in ('basis', 'scope', 'asOf', 'checkedAt',
                          'modifiedAt', 'sha256', 'index', 'positionCount',
                          'equityPositionCount', 'uniqueEquityIsinCount',
                          'unidentifiedEquityPositionCount', 'unidentifiedEquityWeightPct',
                          'equityWeightPct', 'portfolioWeightPct')})
            entry.update(fileSha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                         freshness=state, available=state['fresh'], file=isin + '.json',
                         status=('retained-after-failure' if error else 'ready') if state['fresh'] else 'stale')
        entries[isin] = entry
    pea = {isin: observed_coverage(automated.get(isin), now, config) for isin in config['peaWatch']}
    manifest = {'schemaVersion': 1, 'generatedAt': now.isoformat(),
                'policy': {'maxSnapshotAgeDays': config['maxSnapshotAgeDays'],
                           'maxCheckAgeDays': config['maxCheckAgeDays']},
                'instruments': entries, 'peaCoverage': pea,
                'summary': {'qualifiedPhysicalCount': len(entries),
                            'availablePhysicalCount': sum(e['available'] for e in entries.values()),
                            'failedPhysicalCount': len(failures),
                            'completePeaCount': 0, 'watchedPeaCount': len(pea)}}
    write_json_atomic(destination / 'manifest.json', manifest)
    return manifest, failures


def audit(destination, now=None):
    """Recompute freshness on read, including when the scheduled job stops."""
    now = now or dt.datetime.now(UTC)
    destination = pathlib.Path(destination)
    manifest = json.loads((destination / 'manifest.json').read_text())
    issues = []
    for isin, entry in manifest['instruments'].items():
        if not entry.get('file'):
            issues.append(isin + ': no complete snapshot')
            continue
        if entry['file'] != isin + '.json':
            reject('Unexpected scanner snapshot path')
        snapshot = json.loads((destination / entry['file']).read_text())
        digest_payload = {k: v for k, v in snapshot.items() if k not in ('sha256', 'checkedAt', 'modifiedAt')}
        digest = hashlib.sha256(json.dumps(digest_payload, sort_keys=True, allow_nan=False).encode()).hexdigest()
        if snapshot['isin'] != isin or digest != snapshot['sha256'] or digest != entry['sha256']:
            reject('Scanner snapshot identity/hash mismatch: ' + isin)
        if entry.get('fileSha256') and hashlib.sha256((destination / entry['file']).read_bytes()).hexdigest() != entry['fileSha256']:
            reject('Scanner file hash mismatch: ' + isin)
        if not freshness(snapshot, now, manifest['policy'])['fresh']:
            issues.append(isin + ': stale scanner evidence')
    return issues


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', type=pathlib.Path)
    parser.add_argument('--output', type=pathlib.Path)
    parser.add_argument('--destination', type=pathlib.Path, default=ROOT / 'public/data/scanner-holdings')
    parser.add_argument('--audit', action='store_true')
    args = parser.parse_args()
    if args.audit:
        issues = audit(args.destination)
        for issue in issues:
            print(issue)
        raise SystemExit(bool(issues))
    if not args.report:
        parser.error('--report is required unless --audit is used')
    config = json.loads((ROOT / 'scripts/scanner-holdings.json').read_text())
    source_config = json.loads((ROOT / 'scripts' / config['physicalSourceConfig']).read_text())
    automated = json.loads((ROOT / 'src/data/automated-etf.json').read_text())
    manifest, failures = refresh(json.loads(args.report.read_text()), config, source_config,
                                 automated, args.destination)
    if args.output:
        # Same observation contract as the existing automation-failure publisher.
        write_json_atomic(args.output, {'checkedAt': manifest['generatedAt'],
            'observations': [{'id': 'scanner-' + isin, 'name': 'Composition complète ' + isin,
                              'status': 'failure' if entry['error'] else 'success',
                              'reason': entry['error']}
                             for isin, entry in manifest['instruments'].items()]})
    summary = manifest['summary']
    lines = ['## Scanner — compositions complètes', '',
             f"{summary['availablePhysicalCount']}/{summary['qualifiedPhysicalCount']} compositions physiques complètes et fraîches.",
             f"{summary['watchedPeaCount']} ETF PEA suivis : aucune source complète qualifiée, aucune substitution par un ETF physique ou un panier synthétique.", '',
             '| ISIN | Statut | Photographie | Dernier contrôle réussi | Positions |',
             '|---|---|---|---|---:|']
    for isin, entry in manifest['instruments'].items():
        lines.append(f"| {isin} | {entry['status']} | {entry.get('asOf', '—')} | {entry.get('checkedAt', '—')} | {entry.get('positionCount', '—')} |")
    for failure in failures:
        lines.append(f"\nÉchec {failure['isin']} : {failure['reason']}")
    print('\n'.join(lines))
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as handle:
            handle.write('\n'.join(lines) + '\n')
    raise SystemExit(bool(failures))


if __name__ == '__main__':
    main()
