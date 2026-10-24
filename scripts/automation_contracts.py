"""Ownership of field incidents; retiring a misattribution is not a recovery."""
import json,re
from functools import lru_cache
from pathlib import Path
@lru_cache(maxsize=None)
def fields(contract):
    return frozenset(json.loads(Path(__file__).with_name(contract).read_text()))
@lru_cache(maxsize=None)
def entities(contract):
    return frozenset(row['isin']for row in json.loads(Path(__file__).with_name(contract).read_text())['instruments'])
def owns_failure(config,identifier):
    contract=config.get('dataFailureFieldContract')
    parts=identifier.split(':')
    if not contract or len(parts)<2 or not re.fullmatch(r'[A-Z]{2}[A-Z0-9]{10}',parts[0]):return True
    entity_contract=config.get('dataFailureEntityContract')
    return parts[1] in fields(contract) and (not entity_contract or parts[0] in entities(entity_contract))
RETIREMENT_REASON='Champ hors du contrat de ce collecteur ; suivi du champ conservé séparément. Ce retrait ne prouve aucune réparation de donnée.'
