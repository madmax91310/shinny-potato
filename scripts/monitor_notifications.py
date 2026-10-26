"""Notification criticality only; incidents, evidence and validation stay intact."""
import datetime as dt
import hashlib
import json
import re

POLICY_MARKER = '<!-- monitor-notification-state:'
REMINDER_HOURS = 24

def stamp(value):
    try:return dt.datetime.fromisoformat(value.replace('Z','+00:00')).astimezone(dt.timezone.utc)
    except (AttributeError,ValueError,TypeError):return None

def critical_incidents(monitor):
    now=stamp(monitor.get('checkedAt'))
    result=[]
    priority=[]
    for identifier,row in monitor.get('active',{}).items():
        first=stamp(row.get('firstSeenAt'))
        hours=(now-first).total_seconds()/3600 if now and first and now>=first else 0
        reason=None
        if identifier=='monitor:radar' and hours>=1:
            reason='Flux global du Radar illisible depuis au moins une heure.'
        elif row.get('kind')=='publication' and row.get('impactScope')=='collector' and hours>=6:
            reason='Publication de la collecte durablement bloquée depuis au moins six heures.'
        elif identifier.startswith('workflow:') and row.get('kind')=='collection' and 'Radar éditorial' in row.get('tools',[]) and hours>=2:
            reason='Exécution globale du producteur Radar en échec depuis au moins deux heures.'
        if reason:
            result.append({**row,'criticalReason':reason})
        if row.get('kind')=='collection' and row.get('workflow')=='update-editorial-radar.yml' and hours>=2:
            key=str(row.get('dataId',identifier)).lower()
            family='statistiques' if 'insee' in key else 'banques' if any(k in key for k in ('fortuneo','boursobank','trade-republic','revolut')) else 'immobilier' if any(k in key for k in ('credit-logement','creditlogement','banque-france','bdf','notaires')) else None
            if family:priority.append((family,identifier,row))
    if len({family for family,_,_ in priority})>=2:
        members=sorted(identifier for _,identifier,_ in priority)
        result.append({'id':'critical:radar-coverage','kind':'coverage','name':'Couverture prioritaire du Radar','firstSeenAt':min(row['firstSeenAt'] for _,_,row in priority),'members':members,
                       'criticalReason':'Au moins deux familles prioritaires affectées depuis deux heures ; perte de couverture, pas simple absence de nouveautés.'})
    return result

def fingerprint(row):
    # Attempt URLs, timestamps of retries and individual HTTP messages cannot
    # generate a new alert. A new episode or wider critical scope can.
    value=[row['id'],row.get('firstSeenAt'),row.get('kind'),sorted(row.get('members',[]))]
    return hashlib.sha256(json.dumps(value,sort_keys=True).encode()).hexdigest()

def notification_state(body,comments,monitor):
    match=re.search(r'<!-- monitor-notification-state:(\{.*?\}) -->',body)
    if match:
        state=json.loads(match[1])
        if state.get('version')!=2 or not isinstance(state.get('seen'),list):raise ValueError('Accusés techniques invalides ; envoi refusé')
    else:
        state={'version':2,'rolloutAt':monitor['checkedAt'],'seen':[fingerprint(row) for row in critical_incidents(monitor)],'lastSentAt':None}
    seen=set(state['seen'])
    sent=[state.get('lastSentAt')]
    for comment in comments:
        if comment.get('user',{}).get('login')!='github-actions[bot]':continue
        text=comment.get('body','')
        seen.update(re.findall(r'<!-- monitor-critical-receipt:([a-f0-9]{64}) -->',text))
        sent.extend(re.findall(r'<!-- monitor-critical-at:([^ ]+) -->',text))
    state['seen']=sorted(seen)
    state['lastSentAt']=max((value for value in sent if stamp(value)),default=None)
    return state

def notification_plan(monitor,state):
    rows=critical_incidents(monitor)
    fresh=[row for row in rows if fingerprint(row) not in state['seen']]
    now=stamp(monitor['checkedAt']);last=stamp(state.get('lastSentAt') or state.get('rolloutAt'))
    reminder=bool(rows and now and last and (now-last).total_seconds()>=REMINDER_HOURS*3600)
    return fresh if fresh else rows if reminder else [], bool(reminder and not fresh)

def state_marker(state):
    return POLICY_MARKER+json.dumps(state,separators=(',',':'),sort_keys=True)+' -->'
