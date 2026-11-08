"""JEPG's exact issuer allocations, with proprietary taxonomy kept separate.

Read fund value only, never secondaryValue (benchmark) or the PDF's GICS-like
sector groups. Countries and sectors have independent effective dates.
"""
import math
from decimal import Decimal
from jpm_holdings import ISIN, URL
from issuer_documents import document_date, proof, validated_rows

COUNTRY_METHOD='Published JPMorgan regional allocation of the fund; issuer labels and cash retained, no country-of-risk equivalence inferred'
SECTOR_METHOD='Published JPMorgan proprietary sector allocation of the fund; no GICS/ICB equivalence or regrouping'
SECTORS={
 'Pharm/Medtech':'Pharmacie et technologies médicales',
 'Technology - Semi & Hardware':'Semi-conducteurs et matériel',
 'Industrial Cyclicals':'Industries cycliques',
 'Consumer Staples':'Consommation de base',
 'Technology - Software':'Logiciels',
 'Telecommunications':'Télécommunications',
 'Utilities':'Services publics','Retail':'Distribution','Insurance':'Assurance',
 'Banks':'Banques','Health Services & Systems':'Services et systèmes de santé',
 'Financial Services':'Services financiers','Basic Industries':'Industries de base',
 'Energy':'Énergie','Media':'Médias','Property':'Immobilier',
 'Transportation':'Transports','Automobiles & Auto Parts':'Automobiles et équipementiers',
 'Consumer Cyclical & Services':'Consommation cyclique et services',
 'Cash':'Liquidités',
}
COUNTRIES={'United States','Japan','France','Germany','Netherlands','Spain','Switzerland','Italy','Singapore',
 'United Kingdom','Hong Kong','Belgium','Denmark','Canada','Australia','Ireland','Sweden','Israel',
 'Finland','Norway','Austria','Portugal','Cash','Other','Others','Unknown'}


def allocation(fund,body,now,field):
    component='emeaRegionalBreakdown'if field=='countries'else'emeaSectorBreakdown'
    value=fund[component];stamp=document_date(value['effectiveDate'],now)
    entries=value['data']
    if not isinstance(entries,list)or not entries:raise ValueError('Empty JPM '+component)
    totals=[r for r in entries if r.get('name')=='Total']
    if len(totals)!=1 or totals[0].get('value')!=100 or totals[0].get('dataType')!='PERCENTAGE':
        raise ValueError('Missing exact fund allocation total')
    rows=[]
    for r in entries:
        name=r.get('name');weight=r.get('value')
        if (r.get('dataType')!='PERCENTAGE' or type(weight)not in (int,float)or not math.isfinite(weight)
                or not 0<=weight<=100 or r.get('asOfDate')not in (None,stamp)):
            raise ValueError('Invalid JPM dated fund percentage')
        if name=='Total':continue
        if name not in (COUNTRIES if field=='countries'else SECTORS):
            raise ValueError('Unqualified JPM issuer allocation label: '+str(name))
        if r.get('displayValue')is None or Decimal(str(r['displayValue']))!=Decimal(str(weight)):
            raise ValueError('JPM displayed fund percentage disagrees')
        rows.append({'name':name,'weightPct':weight})
    validated_rows(rows)
    if sum(r['name']=='Cash'for r in rows)!=1:raise ValueError('Missing explicit JPM cash weight')
    # Verify the displayed total, allowing only the source's one-decimal rounding.
    total=sum((Decimal(str(r['weightPct']))for r in rows),Decimal(0))
    if abs(total-Decimal(100))>Decimal('.05')*(len(rows)+1):
        raise ValueError('JPM allocation total disagrees with all rows')
    return {'rows':rows,'asOf':stamp,'basis':'fund','sourceUrl':URL,'sha256':proof(body),
        'sourceComponent':'fundData.'+component,
        'classification':'jpm-published-regional-v1'if field=='countries'else'jpm-proprietary-sectors-v1',
        'method':COUNTRY_METHOD if field=='countries'else SECTOR_METHOD}


def sector_labels(share,observation):
    if (share.get('isin')!=ISIN or share.get('provider')!='J.P. Morgan' or share.get('currency')!='USD'
            or observation.get('sourceUrl')!=URL or observation.get('basis')!='fund'
            or observation.get('sourceComponent')!='fundData.emeaSectorBreakdown'
            or observation.get('classification')!='jpm-proprietary-sectors-v1'
            or observation.get('method')!=SECTOR_METHOD):
        raise ValueError('Unqualified proprietary sector contract')
    return SECTORS
