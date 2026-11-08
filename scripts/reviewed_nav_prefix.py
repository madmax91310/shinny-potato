"""One reviewed earlier NAV prefix; never a quote migration or a changed suffix."""
import copy
import json
import math
from pathlib import Path


def qualified_prefix_extension(source, incoming, previous, baseline):
    policy = source.get('reviewedHistoryPrefix')
    if not policy or not previous or not baseline:
        return False
    before, after, year = policy.get('previousStart'), policy.get('newStart'), policy.get('qualifiedYear')
    if (not isinstance(year, int) or isinstance(year, bool)
            or before != f'{year}-12' or after != f'{year-1}-12'
            or source.get('periodStart') != after
            or previous.get('periodStart') != before
            or incoming.get('periodStart') != after):
        return False
    if any(r.get('parser') != 'official-nav' or r.get('navProvider') != 'wisdomtree'
           or r.get('navHistoryTransport') != 'official-dataspan-nav-tr'
           or r.get('valuationBasis') != 'fund-nav-total-return'
           or r.get('field') != 'nav-total-return' for r in (source, incoming, previous)):
        return False
    isin = source.get('isin')
    if (not isin or incoming.get('isin') != isin or previous.get('isin') != isin
            or any(r.get('currency') != source.get('currency') for r in (incoming, previous, baseline))
            or source.get('currency') != source.get('navCurrency')
            or year not in source.get('requiredQualifiedCalendarYears', [])):
        return False
    proof = incoming.get('calendarProof') or {}
    if (proof.get('controlledInstrument') != isin or proof.get('requestedStart') != after+'-01'
            or str(year) not in proof.get('controlledCalendarYears', [])
            or year not in proof.get('qualifiedCalendarYears', [])
            or not any(c.get('year') == year and str(c.get('start','')).startswith(after)
                       and str(c.get('end','')).startswith(before) for c in proof.get('checks', []))):
        return False
    if any(w.get('start','') < before and w.get('end','') > after
           for w in incoming.get('historyUnqualifiedReturnWindows', [])):
        return False
    pairs = incoming.get('points') or []
    if ([month for month,value in pairs] != sorted({month for month,value in pairs})
            or any(not isinstance(value,(int,float)) or isinstance(value,bool) or not math.isfinite(value) or value <= 0 for month,value in pairs)):
        return False
    points = dict(pairs)
    old = previous.get('points') or []
    base = baseline.get('points') or []
    if (not old or not base or old[0][0] != before or base[0].get('date') != before
            or not incoming.get('responseSha256') or not previous.get('responseSha256')
            or min(points, default='') != after
            or any(points.get(month) != value for month, value in old)
            or any(points.get(row['date']) != row['price'] for row in base)):
        return False
    # Every new month must be actually observed; no interpolation or suffix loss.
    expected = [f'{year-1}-12'] + [f'{year}-{month:02d}' for month in range(1,12)]
    if sorted(month for month in points if month < before) != expected:
        return False
    return True


def planned_prefix_sources(config):
    """Plan reviewed acquisition before results; leave registered consumers untouched."""
    canonical = {s['id']:s for s in json.loads(Path(__file__).with_name('official-nav-remainder-sources.json').read_text()) if s.get('reviewedHistoryPrefix')}
    rows = []
    for source in config['series']:
        declared = canonical.get(source['id'])
        if not declared:
            rows.append(source)
            continue
        policy = declared['reviewedHistoryPrefix']
        identity = ['isin','currency','parser','navProvider','navHistoryTransport','valuationBasis','field','method']
        if (any(source.get(k) != declared.get(k) for k in identity)
                or source['periodStart'] not in [policy['previousStart'],policy['newStart']]):
            raise ValueError('Reviewed NAV prefix does not match its registered source')
        rows.append({**source, **{k:declared[k] for k in ['periodStart','requiredQualifiedCalendarYears','reviewedHistoryPrefix']}})
    return {**config, 'series':rows}


def recorded_prefix_config(registered, selected, observations):
    """The ordinary producer records a configuration only with its valid data."""
    selected = {s['id']:s for s in selected['series'] if s.get('reviewedHistoryPrefix')}
    accepted = {}
    for observation in observations:
        if observation['status'] != 'validated' or observation['id'] not in selected:
            continue
        source = selected[observation['id']]
        if any(observation['record'].get(k) != v for k,v in source.items()):
            raise ValueError('Validated prefix record does not match its planned configuration')
        accepted[observation['id']] = source
    return {**registered, 'series':[copy.deepcopy(accepted.get(s['id'],s)) for s in registered['series']]}
