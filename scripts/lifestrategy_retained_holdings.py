"""Reuse exact, dated, previously qualified books; never renew source clocks.

Only the eight equity shares actually held by LifeStrategy are retained. Latest
observations stay latest. Historical dependencies are private producer inputs,
not extra browser positions or a second provider. Missing/expired dates fail.
"""
import copy
import datetime as dt
import hashlib
import json
import re
import subprocess
import urllib.request
from functools import lru_cache
from pathlib import Path

SHARES = frozenset(['IE00BFMXXD54', 'IE00BFMXYX26', 'IE00BK5BQT80', 'IE00BK5BQV03',
                    'IE00BK5BQW10', 'IE00BK5BQX27', 'IE00BK5BQZ41', 'IE00BK5BR733'])
BOOTSTRAP_COMMIT = '41311ee98d707f38b876517a1ea64c4b260b7fc8'
BOOTSTRAP_SHA256 = 'df418058850eac7870e8df7d476b9abbe2f40b4a0d2860775756b3aa2d8c7703'
BOOTSTRAP_DATE = '2026-09-30'
CANONICAL = 'src/data/dca-complete-holdings.json'
API = 'https://www.vanguard.co.uk/gpx/graphql'
HISTORY = 'retainedSnapshots'


def valid_book(record, now, *, consume=True):
    from collect_physical_holdings import checked_rows
    from lifestrategy_holdings import fresh
    if (record.get('complete') is not True or record.get('basis') != 'fund'
            or record.get('sourcePartial') or record.get('approximation')
            or record.get('sourceUrl') != API or not re.fullmatch('[a-f0-9]{64}', record.get('sha256', ''))):
        raise ValueError('Unqualified retained Vanguard book')
    if consume:
        fresh(record, now)  # Same 93-day publication and 35-day source-control limits.
    checked_rows(record['rows'], minimum=11)
    return record


def snapshot(record):
    return copy.deepcopy({k:v for k,v in record.items() if k != HISTORY})


def carry_snapshots(isin, previous, candidate, now):
    if isin not in SHARES:
        return candidate
    history = copy.deepcopy(previous.get(HISTORY, {}))
    cutoff = (now.date() - dt.timedelta(days=93)).isoformat()
    if previous.get('asOf') and cutoff <= previous['asOf'] < candidate['asOf']:
        valid_book(previous, now, consume=False)
        history[previous['asOf']] = snapshot(previous)
    # Expiry does not renew or qualify an observation. Keep at most four dated
    # monthly snapshots within the existing publication horizon; source control
    # freshness is still checked whenever one is consumed.
    cutoff = (now.date() - dt.timedelta(days=93)).isoformat()
    history = {date:history[date] for date in sorted(history)[-4:]
               if cutoff <= date < candidate['asOf']}
    return {**candidate, **({HISTORY:history} if history else {})}


def compatible_book(isin, record, wanted, now):
    if record.get('asOf') == wanted:
        return record
    if isin not in SHARES:
        raise ValueError('Unqualified retained LifeStrategy share: ' + isin)
    retained = record.get(HISTORY, {}).get(wanted)
    if not retained or retained.get('asOf') != wanted:
        raise ValueError('LifeStrategy and underlying portfolio dates differ; missing exact-date retained dependency: ' + isin + '/' + wanted)
    valid_book(retained, now)
    return retained


@lru_cache(maxsize=1)
def bootstrap_books(root):
    """One bounded cold-start recovery from an immutable, merged data commit.

    This reads existing evidence, not the financial source. Original dates and
    source hashes are preserved. The exact bytes are pinned; no branch/latest URL.
    """
    local = subprocess.run(['git', 'show', BOOTSTRAP_COMMIT + ':' + CANONICAL],
                           cwd=root, capture_output=True)
    if local.returncode == 0:
        raw = local.stdout
    else:
        url = ('https://raw.githubusercontent.com/madmax91310/shinny-potato/'
               + BOOTSTRAP_COMMIT + '/' + CANONICAL)
        with urllib.request.urlopen(urllib.request.Request(url, headers={
                'User-Agent':'EpargnantLibre-Data/1.0'}), timeout=30) as response:
            raw = response.read(35_000_001)
    if len(raw) > 35_000_000 or hashlib.sha256(raw).hexdigest() != BOOTSTRAP_SHA256:
        raise ValueError('Retained snapshot Git evidence differs from pinned bytes')
    return json.loads(raw)


def restore_dependencies(previous, parents, selected, now, root):
    """Seed only required missing dated dependencies; return changes and proof.

    Future month transitions use carry_snapshots. This immutable recovery only
    restores September observations already collected before this fix existed.
    """
    from lifestrategy_portfolio import qualified_stored_portfolio
    from lifestrategy_holdings import FUNDS, fresh
    updated, proofs, failures = {}, [], {}
    books, recovery_error = None, None
    for fund in sorted(set(selected) & FUNDS):
        record = parents[fund]
        try:
            parent = qualified_stored_portfolio(record, now)
            if parent and fresh(parent, now) != fresh(record['assetAllocation'], now):
                raise ValueError('Parent and allocation dates differ before retained dependency recovery')
        except Exception as error:
            failures[fund] = str(error)
            continue
        if not parent:
            continue  # Legacy parent admission still belongs to the existing derivation.
        date = parent['asOf']
        for row in parent['rows']:
            if row['assetCategory'] != 'Actions' or not row['weightPct']:
                continue
            isin = row['isin']
            current = updated.get(isin, previous.get(isin, {}))
            if isin not in SHARES or current.get('asOf') == date or date in current.get(HISTORY, {}):
                continue
            if date != BOOTSTRAP_DATE:
                continue  # No invented recovery for dates absent from retained evidence.
            if books is None and recovery_error is None:
                try:books = bootstrap_books(str(Path(root)))
                except Exception as error:recovery_error = str(error)
            if recovery_error:
                failures[fund] = recovery_error
                continue
            try:
                source = books[isin]
                if source.get('asOf') != date:
                    raise ValueError('Retained Git observation has the wrong date: ' + isin)
                valid_book(source, now)
            except Exception as error:
                failures[fund] = str(error)
                continue
            if not current or current['asOf'] < date:
                continue  # Never replace the current book or manufacture one here.
            proof = {'kind':'restored-prior-qualified-observation', 'isin':isin,
                     'sourceCommit':BOOTSTRAP_COMMIT, 'canonicalPath':CANONICAL,
                     'canonicalSha256':BOOTSTRAP_SHA256, 'asOf':source['asOf'],
                     'originalCheckedAt':source['checkedAt'], 'originalSourceSha256':source['sha256'],
                     'sourceControlRenewed':False, 'financialSourceAttempted':False}
            old = snapshot(source)
            old['retentionEvidence'] = proof
            history = {**current.get(HISTORY, {}), date:old}
            updated[isin] = {**current, HISTORY:history}
            proofs.append(proof)
    return updated, proofs, failures
