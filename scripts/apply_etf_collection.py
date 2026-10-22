"""Apply a fully validated issuer collection to the active shared ETF registry."""
import copy
import datetime as dt
import re
import json
from pathlib import Path
from data_automation import reject, write_json_atomic

RECENT_LAUNCHES = json.loads((Path(__file__).with_name('recent-calendar-evidence.json')).read_text())['shares']

SECTORS = {
    # iShares EM Value, official product 297452, checked 2026-10-15.
    # Preserve published sub-industry labels; never aggregate these as broad sectors.
    **{name:name for name in ['Steel', 'Automobile Manufacturers', 'Automotive Parts & Equipment', 'Marine Transportation', 'Copper', 'Aluminum', 'Specialized Finance', 'Gold', 'Diversified Chemicals', 'Precious Metals & Minerals', 'Construction & Engineering', 'Paper Products', 'Construction Materials', 'Tires & Rubber', 'Passenger Airlines', 'Construction Machinery & Heavy Transportation Equipment', 'Marine Ports & Services', 'Automotive Retail', 'Coal & Consumable Fuels', 'Oil & Gas Drilling', 'Renewable Electricity', 'Wireless Telecommunication Services', 'MULTI-LINE INSURANCE']},
    # ICB sector published by the STOXX Europe 600 Banks fund; keep its granularity.
    'Banks': 'Banques',
    # VanEck sub-industries retain the issuer classification.
    **{s:s for s in ['Broadline Retail', 'Communications Equipment', 'Consumer Electronics', 'Data Center REITs', 'Diversified REITS', 'Diversified Real Estate Activities', 'Health Care REITs', 'Hotel & Resort REITs', 'Hotels, Resorts & Cruise Lines', 'Industrial Conglomerates', 'Industrial REITs', 'Integrated Telecommunication Services', 'Interactive Media & Services', 'Multi-Family Residential REITs', 'Other Specialized REITs', 'Other/Cash', 'Real Estate Development', 'Real Estate Operating Companies', 'Retail REITs', 'Self-Storage REITs', 'Single-Family Residential REITs', 'n/a']},
    **{s:s for s in ['Corporate - industrials','Corporate - financial institutions','Corporate - utilities','Cash*']},
    'CORPORATE - INDUSTRIAL':'Entreprises industrielles', 'CORPORATE - FINANCE':'Entreprises financières', 'CORPORATE - UTILITY':'Entreprises de services collectifs', 'Monétaire':'Monétaire', 'Autres':'Autres',
    # Published fixed-income classifications remain distinct from equity sectors.
    **{s: s for s in ['ABS Other', 'Agency Fixed Rate', 'Auto Backed', 'Banking', 'Basic Industry', 'Brokerage/Asset Managers/Exchanges', 'CMBS', 'Capital Goods', 'Cash and/or Derivatives', 'Communications', 'Consumer Cyclical', 'Consumer Non-Cyclical', 'Covered Other', 'Credit Card', 'ETFs', 'Electric', 'Energy', 'Finance Companies', 'Financial Other', 'Government Guaranteed', 'Government Sponsored', 'Healthcare', 'Hybrid Collateralized', 'Industrial Other', 'Insurance', 'Local Government', 'Local Government Guarantee', 'Local Government No Guarantee', 'Mortgage Collateralized', 'Natural Gas', 'Other', 'Owned No Guarantee', 'Public Sector Collateralized', 'Real Estate', 'Reits', 'Residential Mortgage', 'Sovereign', 'Stranded Cost Utility', 'Supranational', 'Technology', 'Transportation', 'Treasuries', 'Treasury', 'Utility Other', 'Whole Business']},
    'Cash':'Liquidités', 'Information technology':'Technologie', 'Health care':'Santé', 'Consumer staples':'Consommation de base', 'Consumer discretionary':'Consommation cyclique', 'Communication services':'Communication',
    **{s: s for s in ['Immobilier','Industrie','Matériaux','Santé','Technologie','Énergie','Services publics']},
    'Informationstechnologie':'Technologie','Finanzen':'Finance','Gesundheitswesen':'Santé','Immobilien':'Immobilier','Industrieunternehmen':'Industrie','Kommunikationsdienste':'Communication','Basiskonsumgüter':'Consommation de base','Nicht-Basiskonsumgüter':'Consommation cyclique','Energie':'Énergie','Material':'Matériaux','Versorgungsunternehmen':'Services publics',
    'Biens de consommation cycliques':'Consommation cyclique','Biens de consommation non-cycliques':'Consommation de base','Matériaux de base':'Matériaux','Services aux collectivités':'Services publics','Services de Communication':'Communication','Sociétes financières':'Finance',
    "Technologies de l'info":'Technologie','Télécommunications':'Communication','Unassigned':'Non classé','Energy Equipment & Services':'Équipements et services énergétiques','Oil, Gas & Consumable Fuels':'Pétrole, gaz et combustibles',
    'Information Technology': 'Technologie', 'Financials': 'Finance',
    'Consumer Discretionary': 'Consommation cyclique', 'Consumer Staples': 'Consommation de base',
    'Industrials': 'Industrie', 'Materials': 'Matériaux', 'Communication': 'Communication',
    'Health Care': 'Santé', 'Energy': 'Énergie', 'Utilities': 'Services publics',
    'Real Estate': 'Immobilier', 'Cash & Others':'Liquidités et autres', 'Cash and/or Derivatives': 'Liquidités et/ou dérivés', 'Other': 'Autres', 'Others': 'Autres', 'Communication Services': 'Communication', 'Communications': 'Communication', 'Technology': 'Technologie',
    'Personal & Household Goods': 'Biens personnels et ménagers', 'Food & Beverage': 'Alimentation et boissons', 'Retail': 'Distribution', 'Construction & Materials': 'Construction et matériaux', 'Financial Services': 'Services financiers', 'Basic Materials': 'Matériaux', 'Telecommunications': 'Communication', 'Telecommunication': 'Communication',
    "Technologies de l'info.": 'Technologie', 'Finance': 'Finance', 'Conso Cyclique': 'Consommation cyclique',
    'Conso non Cyclique': 'Consommation de base', 'Services de communication': 'Communication',
    **{s: s for s in ['Asset Management & Custody Banks', 'Biotechnology', 'Computer Services', 'Consumer Finance', 'Diversified Banks', 'Diversified Financial Services', 'Diversified Reits', 'Financial Exchanges & Data', 'Health Care Distributors', 'Health Care Equipment', 'Health Care Facilities', 'Health Care Services', 'Health Care Supplies', 'Health Care Technology', 'Hotel and Lodging REITs', 'Hotels and Motels', 'Insurance Brokers', 'Investment Banking & Brokerage', 'Life & Health Insurance', 'Life Sciences Tools & Services', 'Managed Health Care', 'Multi-Sector Holdings', 'Office REITs', 'Other Specialty REITs', 'Pharmaceuticals', 'Property & Casualty Insurance', 'Real Estate Holding and Development', 'Regional Banks', 'Reinsurance', 'Residential Reits', 'Retail Reits', 'Transaction & Payment Processing Services']},
    # Issuer sub-industry breakdowns retain their published labels (no GICS aggregation).
    **{name:name for name in ['Fertilizers & Agricultural Chemicals', 'Agricultural Products & Services', 'Application Software', 'Cash and/or Derivatives', 'Communication', 'Communications Equip.', 'Consumer Discretionary', 'Consumer Staples', 'Consumer Staples Merchandise Retail', 'Distillers & Vintners', 'Electric Utilities', 'Electronic Components', 'Electronic Equipment & Instruments', 'Electronic Manufacturing Services', 'Energy', 'Financials', 'Food Distributors', 'Food Retail', 'Gas Utilities', 'Health Care', 'Household Products', 'IT Consulting & Other Services', 'Independent Power Producers & Energy Traders', 'Industrial Goods & Services', 'Industrials', 'Information Technology', 'Integrated Oil & Gas', 'Internet Services & Infrastructure', 'Materials', 'Media', 'Multi-Utilities', 'Oil & Gas Equipment & Services', 'Oil & Gas Exploration & Production', 'Oil & Gas Refining & Marketing & Transportation', 'Oil & Gas Storage & Transportation', 'Packaged Foods & Meats', 'Personal Care Products', 'Semiconductor Equipment', 'Semiconductors', 'Soft Drinks & Non-Alcoholic Beverages', 'Systems Software', 'Technology', 'Technology Distributors', 'Technology Hardware, Storage & Peripherals', 'Tobacco', 'Utilities', 'Water Utilities']},
}


AUDIT_DATES = {'checkedAt', 'modifiedAt'}

def checked_observation(incoming, previous, checked):
    """Keep value-change dates separate from successful source checks."""
    values = {k: v for k, v in incoming.items() if k not in AUDIT_DATES}
    old_values = {k: v for k, v in previous.items() if k not in AUDIT_DATES}
    if values == old_values:
        return {**previous, 'checkedAt': max(checked, previous.get('checkedAt', ''))}
    return {**values, 'checkedAt': checked, 'modifiedAt': checked}


def merge_collection(report, current, baseline, sibling_aum=None):
    next_records = copy.deepcopy(current)
    checked = report['checkedAt'][:10]
    for share in report['shares']:
        isin = share['isin']
        old = next_records.get(isin, {})
        if old and (old['currency'] != share['currency'] or old['productId'] != share['productId']):
            reject('Active automated share identity changed')
        from etf_anomalies import anomalies
        issues = anomalies(old, share, (sibling_aum or {}).get(isin, ()))
        if issues:
            reject('Suspicious ETF change; previous record preserved: ' + ' ; '.join(issues))
        record = {**old, 'currency': share['currency'], 'productId': share['productId'], 'sourceUrl': old.get('sourceUrl', share['sourceUrl']) if share.get('exposureOnly') else share['sourceUrl'], 'provider': share.get('provider', 'iShares')}
        for field in ('aum', 'sectors', 'countries', 'countriesRisk', 'holdings', 'commodityAllocation', 'listingObservation'):
            if field not in share:
                continue
            incoming = copy.deepcopy(share[field])
            if field != 'aum' and not incoming.get('rows'):
                continue  # Absence cannot erase or re-date a previously published value.
            active_date = old.get(field, {}).get('asOf') or baseline.get(isin, {}).get(field + 'AsOf')
            if active_date and incoming['asOf'] < active_date:
                continue
            if field == 'sectors':
                for row in incoming['rows']:
                    if row['name'] not in SECTORS:
                        reject('Unknown issuer sector: ' + row['name'])
                    row['label'] = SECTORS[row['name']]
            record[field] = checked_observation(incoming, old.get(field, {}), checked)
        if not share.get('exposureOnly'):
            characteristics = {k:v for k,v in old.get('characteristics',{}).items() if k not in AUDIT_DATES}
            characteristics.update(share.get('characteristics') or {'terPct': share['terPct'], 'index': share['index'], 'distribution': share['distribution']})
            # Monthly document facts must not overwrite more recent page facts.
            facts_date = share.get('characteristics', {}).get('asOf')
            active_facts_date = old.get('characteristics', {}).get('asOf') or old.get('characteristics', {}).get('checkedAt', '')
            if (checked >= old.get('characteristics', {}).get('checkedAt', '')
                    and (not facts_date or not active_facts_date or facts_date > active_facts_date
                         or (bool(old.get('characteristics')) and all(characteristics.get(k) == v for k,v in old.get('characteristics', {}).items() if k not in AUDIT_DATES | {'sha256','sourceUrl','asOf'})))):
                record['characteristics'] = checked_observation(characteristics, old.get('characteristics', {}), checked)
                provenance = copy.deepcopy(old.get('characteristicChecks', {}))
                for key in old.get('characteristics', {}):
                    if key not in AUDIT_DATES | {'sha256','sourceUrl','asOf'}:
                        provenance.setdefault(key, {'checkedAt':old['characteristics'].get('checkedAt'), 'sourceUrl':old['characteristics'].get('sourceUrl',old.get('sourceUrl')), 'asOf':old['characteristics'].get('asOf')})
                observed = share.get('characteristics') or {k:share[k] for k in ('terPct','index','distribution') if k in share}
                for key in observed:
                    if key not in AUDIT_DATES | {'sha256','sourceUrl','asOf'}:
                        provenance[key] = {'checkedAt':checked, 'sourceUrl':observed.get('sourceUrl',share['sourceUrl']), 'asOf':observed.get('asOf')}
                record['characteristicChecks'] = provenance
        if share.get('fieldQualification') and checked >= old.get('qualificationCheckedAt', ''):
            record['fieldQualification'] = copy.deepcopy(share['fieldQualification'])
            record['qualificationCheckedAt'] = checked
        performance = share.get('performance')
        if not performance:
            next_records[isin] = record
            continue
        # Store complete annual observations by year; consumers select a common window.
        if baseline.get(isin, {}).get('currency') and performance['currency'] != baseline[isin]['currency'] or performance['basis'] != 'fund':
            reject('Incompatible performance')
        # Recent shares can publish their own complete years without replacing a proxy.
        years = performance['years']
        observations = performance.get('observations', [])
        for observation in observations:
            import math
            date = dt.date.fromisoformat(observation['asOf'])
            value = observation['value']
            if (date.isoformat() > checked or not observation.get('label') or
                    isinstance(value, bool) or not isinstance(value, (float, int)) or
                    not math.isfinite(value) or not -100 < value < 1000):
                reject('Invalid dated cumulative performance observation')
        if len({o['label'] for o in observations}) != len(observations):
            reject('Duplicate cumulative performance observation')
        if not years and not observations:
            next_records[isin] = record
            continue
        import math
        if any(not str(y).isdigit() or int(y) >= int(checked[:4]) or
               isinstance(v, bool) or not isinstance(v, (int, float)) or
               not math.isfinite(v) or not -100 < v < 1000 for y, v in years.items()):
            reject('Invalid or incomplete calendar observation')
        if isin in RECENT_LAUNCHES:
            launch = dt.date.fromisoformat(RECENT_LAUNCHES[isin]['launchDate'])
            first_year = launch.year + ((launch.month, launch.day) != (1, 1))
            if any(int(year) < first_year for year in years):
                reject('Recent share calendar includes a partial launch year or a predecessor history')
        previous_performance = old.get('performance', {})
        launch_text = record.get('characteristics', {}).get('inceptionDate')
        launch = dt.date.fromisoformat(launch_text) if isinstance(launch_text, str) and re.fullmatch(r'\d{4}-\d{2}-\d{2}', launch_text) else None
        if isinstance(launch_text, str) and re.fullmatch(r'\d{8}', launch_text):
            launch = dt.datetime.strptime(launch_text, '%Y%m%d').date()
        if launch and launch.isoformat() > checked:
            reject('Future exact-share inception date')
        first_year = launch.year + ((launch.month, launch.day) != (1, 1)) if launch else None
        if first_year and any(int(year) < first_year for year in years):
            reject('Exact-share calendar includes a partial launch year or a pre-inception history')
        if previous_performance and any(previous_performance.get(k) != performance.get(k)
                                        for k in ('currency', 'basis', 'method')):
            reject('Annual performance convention changed')
        evidence = performance.get('yearEvidence', {})
        for year, proof in evidence.items():
            if (year not in years or proof.get('asOf') != f'{year}-12-31'
                    or not proof.get('sourceUrl') or not re.fullmatch(r'[0-9a-f]{64}', proof.get('sha256', ''))):
                reject('Invalid calendar-year evidence')
        from issuer_monthly_capture import merge_monthly_returns
        monthly = merge_monthly_returns(previous_performance, performance, checked)
        preserved_years = dict(previous_performance.get('years', {}))
        excluded_years = copy.deepcopy(previous_performance.get('excludedYears', {}))
        for year in list(preserved_years):
            if first_year and int(year) < first_year:
                excluded_years[year] = {'value': preserved_years.pop(year),
                    'reason': 'partial-or-pre-inception-year', 'inceptionDate': launch.isoformat(),
                    'sourceUrl': old.get('sourceUrl'), 'checkedAt': previous_performance.get('checkedAt'),
                    'excludedAt': checked}
        performance = {**performance, **monthly, 'years': {**preserved_years, **years}}
        if excluded_years:
            performance['excludedYears'] = excluded_years
        preserved_evidence = {**previous_performance.get('yearEvidence', {})}
        for year in excluded_years:
            preserved_evidence.pop(year, None)
        # A replacement value cannot inherit proof of the old observation.
        for year in years:
            preserved_evidence.pop(year, None)
        if preserved_evidence or evidence:
            performance['yearEvidence'] = {**preserved_evidence, **evidence}
        if checked >= (old.get('performance', {}).get('checkedAt') or baseline.get(isin, {}).get('performanceCheckedAt') or ''):
            record['performance'] = checked_observation(performance, old.get('performance', {}), checked)
        next_records[isin] = record
    return next_records


def apply(report, destination, baseline):
    current = json.loads(destination.read_text()) if destination.exists() else {}
    merged = merge_collection(report, current, baseline)
    if merged != current:
        write_json_atomic(destination, merged)
    return merged != current


def apply_valid_shares(report, destination, baseline):
    """Keep failures and proposed observations in the report, publish healthy shares atomically."""
    current = json.loads(destination.read_text()) if destination.exists() else {}
    merged, valid = current, []
    for share in report['shares']:
        try:
            merged = merge_collection({**report, 'shares': [share]}, merged, baseline)
            valid.append(share)
        except (ValueError, KeyError, TypeError) as error:
            report.setdefault('failures', []).append({'isin': share['isin'],
                'sourceUrl': share.get('sourceUrl'), 'reason': str(error), 'proposedObservation': share})
    report['shares'] = valid
    if merged != current:
        write_json_atomic(destination, merged)
    return merged != current
