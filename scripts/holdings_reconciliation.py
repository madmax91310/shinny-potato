"""Reconcile a published NAV perimeter without rescaling selected securities.

This is evidence of the source's accounting perimeter, never permission to
admit excess equity weights, infer an ISIN, or upgrade an incomplete list.
"""
import math
import re


class HoldingsPerimeterError(ValueError):
    """A reconciled native book is evidence, but not an admitted net allocation."""
    def __init__(self, message, diagnostic):
        super().__init__(message)
        self.diagnostic = diagnostic


def reconcile_positions(positions, selected, as_of):
    if not positions or not selected or len(set(selected)) != len(selected):
        raise ValueError('Missing or duplicate reconciliation perimeter')
    if any(type(i) is not int or not 0 <= i < len(positions) for i in selected):
        raise ValueError('Invalid selected reconciliation row')
    selected_set=set(selected)
    classes, excluded, unknown = {}, {}, []
    for index, position in enumerate(positions):
        kind, weight = position['assetClass'], position['weightPct']
        if not isinstance(kind, str) or not kind or type(weight) not in (int, float) or not math.isfinite(weight):
            raise ValueError('Unqualified source accounting class or weight')
        classes[kind] = classes.get(kind, 0) + weight
        if index not in selected_set:
            excluded[kind] = excluded.get(kind, 0) + weight
        elif not re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}\d',position.get('isin')or''):
            unknown.append({key:position[key] for key in ['name','weightPct','ticker','exchange','currency'] if key in position})
    total = sum(classes.values())
    if not 99 <= total <= 101:
        raise ValueError('Published NAV perimeter does not reconcile')
    return {'schemaVersion':1,'asOf':as_of,'sourceRowCount':len(positions),
            'selectedRowCount':len(selected),'excludedRowCount':len(positions)-len(selected),
            'publishedNetWeightPct':total,
            'selectedWeightPct':sum(positions[i]['weightPct'] for i in selected),
            'sourceWeightPctByType':classes,'excludedWeightPctByType':excluded,
            'unidentifiedPositions':unknown,'normalizationApplied':False,
            'method':'Same dated complete issuer securities table; original fund NAV weights; signed excluded classes retained separately; no normalization or identity inference'}
