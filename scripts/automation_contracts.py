"""Ownership of field incidents; retiring a misattribution is not a recovery."""
import json
import re
from functools import lru_cache
from pathlib import Path

RETIRED_WORKFLOWS = json.loads((Path(__file__).resolve().parents[1] / 'src/data/retired-automations.json').read_text())['workflows']
RADAR_WORKFLOW = 'update-editorial-radar.yml'


def workflow_retirement(row, identifier=None):
    """Service withdrawal never retires a field with another or unknown consumer."""
    identifier = identifier or row.get('id', '')
    workflow = RADAR_WORKFLOW if identifier in ('monitor:radar', 'monitor:radar-proofs', 'critical:radar-coverage') else row.get('workflow')
    policy = RETIRED_WORKFLOWS.get(workflow)
    if not policy:
        return None
    if policy.get('status') == 'disabled-by-request':
        if identifier in ('monitor:radar', 'monitor:radar-proofs', 'critical:radar-coverage'):
            return policy
        if set(row.get('tools', [])) - {'Radar éditorial'} or row.get('impactScope') == 'asset':
            return None
        if row.get('dataId') and not row['dataId'].startswith('radar:'):
            return None
    return policy


@lru_cache(maxsize=None)
def field_contract(contract):
    return json.loads(Path(__file__).with_name(contract).read_text())


def fields(contract):
    return frozenset(field_contract(contract)['owned'])


@lru_cache(maxsize=None)
def entities(contract):
    records = json.loads(Path(__file__).with_name(contract).read_text())
    return frozenset(row['isin'] for row in records['instruments'])


def owns_failure(config, identifier):
    contract = config.get('dataFailureFieldContract')
    parts = identifier.split(':')
    if not contract or len(parts) < 2 or not re.fullmatch(r'[A-Z]{2}[A-Z0-9]{10}', parts[0]):
        return True
    known = fields(contract) | frozenset(field_contract(contract)['otherCollectors'])
    if parts[1] not in known:
        return True  # Unknown technical identifiers must remain visible.
    entity_contract = config.get('dataFailureEntityContract')
    return parts[1] in fields(contract) and (not entity_contract or parts[0] in entities(entity_contract))


RETIREMENT_REASON = ('Champ hors du contrat de ce collecteur ; suivi du champ conservé séparément. '
                     'Ce retrait ne prouve aucune réparation de donnée.')
