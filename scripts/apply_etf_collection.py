"""Apply a fully validated issuer collection to the active shared ETF registry."""
import copy
import datetime as dt
import json
from data_automation import reject, write_json_atomic

SECTORS = {
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
    'Basic Materials': 'Matériaux', 'Telecommunications': 'Communication',
    "Technologies de l'info.": 'Technologie', 'Finance': 'Finance', 'Conso Cyclique': 'Consommation cyclique',
    'Conso non Cyclique': 'Consommation de base', 'Services de communication': 'Communication',
    **{s: s for s in ['Asset Management & Custody Banks', 'Biotechnology', 'Computer Services', 'Consumer Finance', 'Diversified Banks', 'Diversified Financial Services', 'Diversified Reits', 'Financial Exchanges & Data', 'Health Care Distributors', 'Health Care Equipment', 'Health Care Facilities', 'Health Care Services', 'Health Care Supplies', 'Health Care Technology', 'Hotel and Lodging REITs', 'Hotels and Motels', 'Insurance Brokers', 'Investment Banking & Brokerage', 'Life & Health Insurance', 'Life Sciences Tools & Services', 'Managed Health Care', 'Multi-Sector Holdings', 'Office REITs', 'Other Specialty REITs', 'Pharmaceuticals', 'Property & Casualty Insurance', 'Real Estate Holding and Development', 'Regional Banks', 'Reinsurance', 'Residential Reits', 'Retail Reits', 'Transaction & Payment Processing Services']},
    # Issuer sub-industry breakdowns retain their published labels (no GICS aggregation).
    **{name:name for name in ['Fertilizers & Agricultural Chemicals', 'Agricultural Products & Services', 'Application Software', 'Cash and/or Derivatives', 'Communication', 'Communications Equip.', 'Consumer Discretionary', 'Consumer Staples', 'Consumer Staples Merchandise Retail', 'Distillers & Vintners', 'Electric Utilities', 'Electronic Components', 'Electronic Equipment & Instruments', 'Electronic Manufacturing Services', 'Energy', 'Financials', 'Food Distributors', 'Food Retail', 'Gas Utilities', 'Health Care', 'Household Products', 'IT Consulting & Other Services', 'Independent Power Producers & Energy Traders', 'Industrial Goods & Services', 'Industrials', 'Information Technology', 'Integrated Oil & Gas', 'Internet Services & Infrastructure', 'Materials', 'Media', 'Multi-Utilities', 'Oil & Gas Equipment & Services', 'Oil & Gas Exploration & Production', 'Oil & Gas Refining & Marketing & Transportation', 'Oil & Gas Storage & Transportation', 'Packaged Foods & Meats', 'Personal Care Products', 'Semiconductor Equipment', 'Semiconductors', 'Soft Drinks & Non-Alcoholic Beverages', 'Systems Software', 'Technology', 'Technology Distributors', 'Technology Hardware, Storage & Peripherals', 'Tobacco', 'Utilities', 'Water Utilities']},
}


def merge_collection(report, current, baseline):
    next_records = copy.deepcopy(current)
    checked = report['checkedAt'][:10]
    for share in report['shares']:
        isin = share['isin']
        old = next_records.get(isin, {})
        if old and (old['currency'] != share['currency'] or old['productId'] != share['productId']):
            reject('Active automated share identity changed')
        record = {**old, 'currency': share['currency'], 'productId': share['productId'], 'sourceUrl': old.get('sourceUrl', share['sourceUrl']) if share.get('exposureOnly') else share['sourceUrl'], 'provider': share.get('provider', 'iShares')}
        for field in ('aum', 'sectors', 'countries', 'holdings', 'commodityAllocation'):
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
            previous = {k: v for k, v in old.get(field, {}).items() if k != 'checkedAt'}
            record[field] = old[field] if previous == incoming else {**incoming, 'checkedAt': checked}
        if not share.get('exposureOnly'):
            characteristics = {k:v for k,v in old.get('characteristics',{}).items() if k != 'checkedAt'}
            characteristics.update(share.get('characteristics') or {'terPct': share['terPct'], 'index': share['index'], 'distribution': share['distribution']})
            previous = {k: v for k, v in old.get('characteristics', {}).items() if k != 'checkedAt'}
            # Monthly document facts must not overwrite more recent page facts.
            facts_date = share.get('characteristics', {}).get('asOf')
            active_facts_date = max(old.get('characteristics', {}).get('asOf', ''), old.get('characteristics', {}).get('checkedAt', ''))
            if (checked >= old.get('characteristics', {}).get('checkedAt', '')
                    and (not facts_date or not active_facts_date or facts_date >= active_facts_date)):
                record['characteristics'] = old['characteristics'] if previous == characteristics else {**characteristics, 'checkedAt': checked}
        performance = share.get('performance')
        if not performance:
            next_records[isin] = record
            continue
        # Store complete annual observations by year; consumers select a common window.
        if baseline.get(isin, {}).get('currency') and performance['currency'] != baseline[isin]['currency'] or performance['basis'] != 'fund':
            reject('Incompatible performance')
        # Recent shares can publish their own complete years without replacing a proxy.
        years = performance['years']
        if not years:
            next_records[isin] = record
            continue
        import math
        if any(not str(y).isdigit() or int(y) >= int(checked[:4]) or
               isinstance(v, bool) or not isinstance(v, (int, float)) or
               not math.isfinite(v) or not -100 < v < 1000 for y, v in years.items()):
            reject('Invalid or incomplete calendar observation')
        previous_performance = old.get('performance', {})
        if previous_performance and any(previous_performance.get(k) != performance.get(k)
                                        for k in ('currency', 'basis', 'method')):
            reject('Annual performance convention changed')
        performance = {**performance, 'years': {**previous_performance.get('years', {}), **years}}
        if checked >= (old.get('performance', {}).get('checkedAt') or baseline.get(isin, {}).get('performanceCheckedAt') or ''):
            previous = {k: v for k, v in old.get('performance', {}).items() if k != 'checkedAt'}
            record['performance'] = old['performance'] if previous == performance else {**performance, 'checkedAt': checked}
        next_records[isin] = record
    return next_records


def apply(report, destination, baseline):
    current = json.loads(destination.read_text()) if destination.exists() else {}
    merged = merge_collection(report, current, baseline)
    if merged != current:
        write_json_atomic(destination, merged)
    return merged != current
