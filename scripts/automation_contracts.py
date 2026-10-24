"""Ownership of field incidents; retiring a misattribution is not a recovery."""
import json
import re
from functools import lru_cache
from pathlib import Path


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
