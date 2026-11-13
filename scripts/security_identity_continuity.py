"""Dated, document-qualified identity continuity; never adjusts a financial series."""
import datetime as dt
import json
from pathlib import Path

REGISTRY=Path(__file__).resolve().parents[1]/'src/data/index-company-identities.json'

def resolve_conflict(sedol,left,right,as_of,now):
    """Return an exact dated identity and its static evidence, or no resolution.

    A replacement share is not the same security. Portfolio dates choose the
    predecessor/successor; original dates, weights and source IDs stay auditable.
    A shared economic issuer is qualified separately in the common registry.
    """
    if not as_of or now is None:return None
    stamp=dt.date.fromisoformat(as_of)
    for record in json.loads(REGISTRY.read_text()).values():
        c=record.get('securityContinuity',{})
        if c.get('kind')!='completed-one-for-one-redomestication' or c.get('sedol')!=sedol:continue
        if {left,right}!={c['predecessorIsin'],c['successorIsin']}:continue
        effective=dt.date.fromisoformat(c['effectiveDate'])
        if now.date()<effective or c.get('ratio')!=1:continue
        if dt.date.fromisoformat(c['lastPredecessorTradingDate'])+dt.timedelta(days=1)!=effective:continue
        if c['successorIsin'][2:11]!=c.get('successorCusip'):continue
        evidence=c.get('evidence',[])
        if len(evidence)<2 or any(dt.date.fromisoformat(p['publishedAt'])>now.date()for p in evidence):continue
        chosen=c['predecessorIsin']if stamp<effective else c['successorIsin']
        return chosen,{'sedol':sedol,'sourceIdentities':sorted([left,right]),'selectedIsin':chosen,
            'portfolioAsOf':as_of,'effectiveDate':c['effectiveDate'],'scope':c['scope'],
            'evidence':evidence,'reason':'Completed one-for-one redomestication; identity selected by native portfolio date, not source retrieval date'}
    return None
