"""Ensure every comparison column has an automatic official-source collector."""
import json
import pathlib
from broker_profiles import DOCUMENTS, SOURCES
ROOT = pathlib.Path(__file__).resolve().parent.parent
COLUMNS = ('frais','change','garde','dca','pea','pme','jeune','ifu','cash','transfert','boursomarkets')
snapshot = json.loads((ROOT / 'src/data/automated-broker-tariffs.json').read_text())
for broker, routes in DOCUMENTS.items():
    observation = snapshot['brokers'][broker]
    for field in COLUMNS:
        if field == 'frais':
            assert observation['sourceUrl'] and observation['values']
        elif field == 'transfert':
            assert observation['fields']['sortant']
            assert observation['fields'].get('entrant') or 'entrant' in routes
        elif field in routes:
            assert all(SOURCES[key]['url'].startswith('https://') for key in routes[field])
            current = observation.get('profile', {}).get(field)
            if current:
                assert current['refs'] and current['checkedAt'] and current['statement']
            else:
                assert f'{broker}:profile:{field}' in snapshot['profileCollection']['failures'], (broker, field)
        elif field in ('change','garde'):
            assert observation['fields'][field]['sourceUrl']
        elif field == 'boursomarkets' and broker != 'bourso':
            pass  # BoursoBank's proprietary product: inapplicable to another bank.
        else:
            raise AssertionError(f'No collector for {broker}:{field}')
print('Couverture : 8 courtiers × 11 colonnes = 88 cellules avec collecteur ou produit sans objet.')
print('Collecte des services :', snapshot['profileCollection'])
