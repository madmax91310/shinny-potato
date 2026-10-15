"""Complete missing annual history without replacing primary issuer accounts.

Only matching annual revenue/profit and overlapping fiscal years are accepted.
Whole secondary rows keep their provenance; a disagreement rejects the block.
"""
from copy import deepcopy
from company_standard_financials import collect
from company_decision import validate_decision
from refresh_company_analysis import validate_history

SUPPORTED = {'adobe', 'booking', 'nike'}


def supplement(profile, company, today, load=collect):
    if profile['id'] not in SUPPORTED:
        raise ValueError('No qualified history supplement for this company')
    source = load(profile, today)
    rows = source['history']
    annual = company['annual']
    if rows[-1]['end'] != annual['end']:
        raise ValueError('Supplement annual period differs from issuer')
    # No rounded replacements of primary accounts: they must agree exactly at
    # the primary source's stored precision before the model can use the block.
    for key in ('revenue', 'netIncome', *(['freeCashFlow'] if 'freeCashFlow' in annual else [])):
        if abs(rows[-1][key] - annual[key]) > 1:
            raise ValueError('Supplement annual figures disagree with issuer')
    existing = {r['end']: r for r in company.get('history', {}).get('years', [])}
    for row in rows:
        prior = existing.get(row['end'])
        if prior and any(abs(row[k] - prior[k]) > 1 for k in ('revenue', 'netIncome')):
            raise ValueError('Supplement comparative figures disagree with issuer')
    result = deepcopy(company)
    decision = deepcopy(source['decision'])
    if profile['id'] in ('booking', 'nike'):
        decision['publicationCoverageVersion'] = 1
    decision['accountsEndAtCollection'] = max((result.get(k) or {}).get('end', '') for k in ('annual', 'quarter', 'halfYear'))
    result['decision'] = validate_decision(decision, result, today)
    result['history'] = {'years': validate_history(rows, today), 'observedAt': today.isoformat(),
                         'definition': 'Comptes annuels standardisés / Stock Analysis / S&P Global, rapprochés des comptes de l’émetteur'}
    result['historySupplementProvenance'] = source['provenance']
    return result
