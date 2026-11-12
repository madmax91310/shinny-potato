"""Independent complete-book allocations, never a repair of the primary tables."""
import copy
import hashlib
import math
from collect_etf_pilot import allocation, source_date
from ishares_sector_fallback import classified_position_allocation, SECTORS

MODE = 'exact-defence-physical-book'
ISIN = 'IE000U9ODG19'


def primary_id(isin, field):
    return f'qualified-primary:{isin}:{field}'


def prepare(body, share, now, url, raw, audit):
    """Check both primaries; qualify another complete photograph independently.

    The caller freezes both primary IDs before acquisition. Failed primaries
    keep attemptedAt, never checkedAt. All fallback weights retain their NAV
    denominator; this does not certify a benchmark or a company overlap.
    """
    if share.get('allocationFallback') != MODE:
        return body, None
    if (share.get('isin') != ISIN or str(share.get('productId')) != '334464'
            or share.get('currency') != 'USD' or str(body.get('productId')) != '334464'
            or body.get('currencyCode') != 'USD'):
        raise ValueError('Unqualified exact physical-allocation fallback share')
    facts = body['componentsByNameMap']['keyFundFacts']['containersByNameMap']['default']['dataPointsByNameMap']
    if (facts['isin']['value'] != ISIN or facts['productStructure']['value'] != 'Physical'
            or facts['assetClass']['value'] != 'Equity' or facts['ucitsCompliantFlag']['value'] != 'Yes'):
        raise ValueError('Physical-allocation fallback identity or mandate changed')
    digest = hashlib.sha256(raw.encode()).hexdigest()
    exposure = body['componentsByNameMap'].get('exposureBreakdowns', {})
    def node_at(value, keys):
        for key in keys:
            if not isinstance(value, dict): return None
            value = value.get(key)
        return value
    nodes = {'countries': node_at(exposure, ['containersByNameMap','geography','subContainersByNameMap','countries']),
             'sectors': node_at(exposure, ['containersByNameMap','sector'])}
    checks = []
    audit['primaryAllocationChecks'] = checks
    for field, node in nodes.items():
        check = {'id': primary_id(ISIN, field), 'instrument': ISIN, 'field': field + '-primary',
                 'sourceAttempted': True, 'sourceUrl': url, 'sha256': digest,
                 'attemptedAt': now.isoformat(), 'phase': 'validation'}
        try:
            if not isinstance(node, dict):
                raise ValueError('Primary allocation table missing or malformed')
            points = node.get('dataPointsByNameMap', {})
            values = points.get('fund', {}).get('value')
            if isinstance(values, list) and all(type(w) in (int, float) and math.isfinite(w) for w in values):
                check['publishedWeightPct'] = math.fsum(values)
            if points.get('asOf', {}).get('value') is not None:
                check['asOf'] = source_date(points['asOf']['value'], now)
            parsed = allocation(node, now)
            check.update(status='succeeded', checkedAt=now.isoformat(), asOf=parsed['asOf'])
        except (ValueError, KeyError, TypeError, AttributeError, OverflowError) as error:
            check.update(status='failed', error=str(error))
        checks.append(check)
    if all(check['status'] == 'succeeded' for check in checks):
        return body, {'primaryAllocationChecks': checks}

    holdings, geography, coverage = classified_position_allocation(body, share, now)
    if coverage['unidentifiedSecurityCount']:
        raise ValueError('Independent allocation has unqualified security identities')
    p = body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap']
    sectors, weights, classes = (p[k]['value'] for k in ('sectorName', 'holdingPercent', 'assetClass'))
    if not isinstance(sectors, list) or len(sectors) != len(weights):
        raise ValueError('Independent classified sectors are incomplete')
    groups = {}
    for sector, weight, kind in zip(sectors, weights, classes):
        if (sector not in SECTORS or (kind == 'Equity' and sector == 'Cash and/or Derivatives')
                or (kind != 'Equity' and sector != 'Cash and/or Derivatives')):
            raise ValueError('Independent sector classification is unqualified')
        groups.setdefault(sector, []).append(weight)
    proof = {'kind': 'independently-qualified-complete-physical-fund-allocation', 'isin': ISIN,
             'asOf': holdings['asOf'], 'checkedAt': now.isoformat(), 'sourceUrl': url, 'sha256': digest,
             'sourceComponent': 'holdings.all', **coverage, 'normalizationApplied': False,
             'primaryRepaired': False, 'indexCompositionCertified': False,
             'note': 'Another qualified field source; the primary allocation discrepancy remains unexplained.'}
    common = {'basis': 'fund', 'sourceUrl': url, 'sha256': digest, 'sourceComponent': 'holdings.all',
              'coverageProof': proof}
    geography = {**geography, **common}
    sectors = {**common, 'asOf': holdings['asOf'],
               'method': 'GICS sectors of every published physical-fund position, signed cash/derivatives included; original NAV weights, no renormalisation',
               'rows': [{'name': key, 'weightPct': math.fsum(values)} for key, values in groups.items()]}
    for check in checks:
        if check['status'] == 'failed':
            check.update(qualifiedFallbackAvailable=True, fallbackAsOf=holdings['asOf'])
    parsed_body = copy.deepcopy(body)
    parsed_body['componentsByNameMap'].pop('exposureBreakdowns', None)
    return parsed_body, {'primaryAllocationChecks': checks, 'compositionQualification': proof,
                         'countries': geography, 'countriesRisk': geography, 'sectors': sectors,
                         'holdings': {**holdings, **common},
                         'collectionErrors': [{'field': c['field'], 'url': url, 'reason': c['error'],
                                               'qualifiedFallbackAvailable': True,
                                               'qualifiedFields': ['countries', 'countriesRisk', 'sectors', 'holdings']}
                                              for c in checks if c['status'] == 'failed']}


def contract_results(configs, report):
    """Use the existing report protocol; each new primary has its own identity."""
    from publish_automation_status import _normalize_report
    legacy = _normalize_report({'records': report['records'], 'excluded': report['excluded']})
    successes, errors, inactive = (list(legacy.get(key, [])) for key in ('successes', 'errors', 'inactive'))
    observed = {r['isin']: r for r in [*report['records'], *report['excluded']]}
    for config in configs:
        if config.get('allocationFallback') != MODE:
            continue
        row = observed.get(config['isin'], {})
        checks = {r['field']: r for r in row.get('primaryAllocationChecks', [])}
        for field in ('countries', 'sectors'):
            check = checks.get(field + '-primary')
            if not check:
                inactive.append({'id': primary_id(config['isin'], field), 'sourceAttempted': False,
                                 'reason': 'Primary allocation validation not reached: ' + row.get('error', 'No individual result; parent remains independently checked')})
            elif check['status'] == 'failed':
                errors.append({**check, 'name': config['isin'] + ' · ' + check['field']})
            else:
                successes.append(check)
    return {'successes': successes, 'errors': errors, 'inactive': inactive}
