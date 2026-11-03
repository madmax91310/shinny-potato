"""Bind the rendered country allocation to dated exact-share publisher rows.

Country dates never come from the unrelated NAV/overview card. Incorporated and
Aggregate Country remain distinct. Only separately qualified definitions may
use the public API as an automatic substitute for the same country field.
"""
import math
import re
from decimal import Decimal, ROUND_HALF_UP, InvalidOperation
from collect_wisdomtree_holdings import flight_values
from issuer_documents import document_date, validated_rows
from wisdomtree_api_holdings import CLASS_CONFIG

LABELS={6:'Incorporated Country',16:'Aggregate Country'}


def parsed_group(rows,share,now,*,api=False):
    config=CLASS_CONFIG[share['isin']]
    if share.get('currency')!=config['currency']:raise ValueError('Wrong exact-share country base currency')
    if not rows:raise ValueError('Empty country allocation')
    id_key='wtID'if api else'wtClassID';ticker_key='ticker'if api else'classTicker'
    expected_id=config['rankingsEntityId']if api else config['classId']
    allowed=[config['fundTicker'],*[r['ticker']for r in config.get('rankingsListingAlternatives',[])]]
    if any(r.get(id_key)!=expected_id or r.get(ticker_key)not in allowed or r.get('entityName')!=config['title']for r in rows):
        raise ValueError('Wrong exact-share country identity')
    classes={r.get('rankClassificationID')for r in rows}
    if len(classes)!=1 or next(iter(classes))not in LABELS:raise ValueError('Ambiguous country classification')
    classification=next(iter(classes))
    if any(r.get('rankClassification')!=LABELS[classification]for r in rows):raise ValueError('Country classification label changed')
    dates=set();values=[]
    for row in rows:
        stamp=row.get('dt');name=row.get('name'if api else'constituentName');weight=row.get('pct'if api else'pctWeight')
        if not isinstance(stamp,str)or not re.fullmatch(r'20\d\d-\d\d-\d\dT00:00:00(?:\.0+)?Z?',stamp):raise ValueError('Invalid country observation date')
        dates.add(document_date(stamp[:10],now))
        if not isinstance(name,str)or not name.strip()or name.strip().casefold()in {'unknown','other','others','unassigned','cash'}:raise ValueError('Unqualified country label')
        if type(weight)not in (int,float)or not math.isfinite(weight)or not 0<=weight<=1:raise ValueError('Invalid country fraction')
        values.append({'name':name.strip(),'weightPct':float(Decimal(str(weight))*100)})
    if len(dates)!=1:raise ValueError('Mixed country observation dates')
    return {'rows':validated_rows(values),'asOf':dates.pop(),'basis':'fund','rankClassificationID':classification,
            'method':'Exact issuer '+LABELS[classification]+' allocation; original published percentages, no renormalisation'}


def primary_country(page,share,display_rows,now):
    """The rendered table is the field oracle; only its matching source rows date it."""
    if share['isin']not in CLASS_CONFIG:raise ValueError('Country source identity not configured')
    candidates=[]
    def visit(value):
        if isinstance(value,dict):
            default=value.get('holdings',{}).get('default')if isinstance(value.get('holdings'),dict)else None
            if isinstance(default,list):
                for classification in LABELS:
                    selected=[r for r in default if isinstance(r,dict)and r.get('rankClassificationID')==classification]
                    if selected:candidates.append(selected)
            for child in value.values():visit(child)
        elif isinstance(value,list):
            for child in value:visit(child)
    for value in flight_values(page):visit(value)
    try:
        shown=sorted((str(name).strip(),Decimal(str(weight).rstrip('%')))for name,weight in display_rows)
        if not shown or any(not weight.is_finite() or not 0<=weight<=100 for _,weight in shown):raise ValueError('Invalid rendered country percentage')
    except (InvalidOperation,TypeError) as error:raise ValueError('Invalid rendered country percentage') from error
    matched={}
    for rows in candidates:
        try:
            parsed=parsed_group(rows,share,now)
            rendered=sorted((r['name'],Decimal(str(r['weightPct'])).quantize(Decimal('.01'),rounding=ROUND_HALF_UP))for r in parsed['rows'])
            if rendered==shown:matched[(parsed['rankClassificationID'],parsed['asOf'],tuple(sorted((r['name'],r['weightPct'])for r in parsed['rows'])))]=parsed
        except (KeyError,TypeError,ValueError):continue
    if not matched or len({r['asOf']for r in matched.values()})!=1:raise ValueError('Rendered country allocation has no unique dated publisher match; NAV date excluded')
    policy=CLASS_CONFIG[share['isin']].get('countryAllocationDefinition')
    if policy:
        qualified=[r for r in matched.values()if r['rankClassificationID']==policy['classificationId']]
        if len(qualified)!=1:raise ValueError('Configured country definition no longer confirmed by rendered table')
        return {**qualified[0],'dateProof':'Exact rendered table reconciled to its publisher country rows; overview/NAV clock excluded'}
    # A matching date can be used without guessing between definitions whose
    # rendered values happen to coincide. Preserve the original table precision.
    return {'rows':validated_rows([{'name':n,'weightPct':float(str(w).rstrip('%'))}for n,w in display_rows]),
            'asOf':next(iter(matched.values()))['asOf'],'basis':'fund','method':'Exact rendered issuer Country Allocation; date confirmed by matching publisher rows; original display precision'}


def api_country(payload,share,now):
    policy=CLASS_CONFIG[share['isin']].get('countryAllocationDefinition')
    if not policy:return None
    if policy.get('classificationName')!=LABELS.get(policy.get('classificationId')):raise ValueError('Unqualified country definition policy')
    return parsed_group([r for r in payload if r.get('rankClassificationID')==policy['classificationId']],share,now,api=True)
