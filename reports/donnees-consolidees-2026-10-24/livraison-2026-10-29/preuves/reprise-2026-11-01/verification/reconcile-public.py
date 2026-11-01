"""Reconcile actual public exports, without inferring a repair from disappearance.

Usage: python <this-file> INITIAL_CAPTURE CURRENT_CAPTURE OUTPUT_DIRECTORY
The original exports remain the evidence; this script does not alter a producer,
financial value, source clock or monitor status. CSVs use the consolidated format.
"""
import collections
import csv
import gzip
import hashlib
import json
import pathlib
import sys

csv.field_size_limit(8_000_000)
initial, current, output = map(pathlib.Path, sys.argv[1:])
output.mkdir(parents=True, exist_ok=True)


def read_capture(folder, name):
    path = folder / (name + '.json')
    raw = path.read_bytes() if path.exists() else gzip.decompress(path.with_suffix('.json.gz').read_bytes())
    return json.loads(raw)


def index(rows):
    result = {}
    for row in rows:
        key = row.get('id') or row.get('key')
        assert key and key not in result, f'Missing/duplicate diagnostic identity: {key}'
        result[key] = row
    return result


def category(row):
    kind = row.get('kind', '')
    cause = row.get('cause', '')
    if kind == 'not-applicable':
        return 'non applicable'
    if kind == 'waiting':
        return 'attente déclarée ; échéance à conserver'
    if kind == 'editorial':
        return 'contenu éditorial / hypothèse / revue humaine'
    if kind == 'history':
        return 'trace historique'
    if kind == 'connection':
        if 'corroborée manuellement' in cause:
            return 'preuve externe manuelle ; état du tarif primaire à examiner séparément'
        if 'USD Accumulating' in cause:
            return 'convention de part non qualifiée ; ancien chiffre non recertifié'
        return 'pièce documentaire du produit manquante ; raccordement conditionné'
    if cause == "'2026-10'":
        return 'dépendance de change mensuel absente ; panne distincte de la NAV source'
    if 'Monthly NAV/return end not independently qualified' in cause:
        return 'qualification de nouvelle période manquante ; anciennes périodes préservées'
    if 'Résolution historique non démontrée' in cause or 'Producteur interrompu avant son compte rendu' in cause:
        return 'preuve historique incomplète ; aucune panne actuelle déduite'
    if kind in ('qualification', 'monitoring'):
        return 'qualification ou preuve à compléter ; panne non déduite'
    if 'contradictoir' in cause or 'conflit' in cause.lower() or 'non rapprochés' in cause:
        return 'conflit financier ou documentaire'
    if row.get('stage') in ('Enregistrement', 'Publication', 'Validation'):
        return row['stage'].lower() + ' interrompue'
    return 'donnée / collecte à vérifier sur la dernière tentative'


def group(row):
    key, cause = row.get('id', row.get('key', '')), row.get('cause', '')
    if key.startswith('calendar:data:history:'):
        identity = key[len('calendar:data:history:'):].rsplit(':', 1)[0]
        if identity in ('bitcoin', 'or', 'ftseAllWorld'):
            return 'calendrier-producteur-distinct-' + identity
        return 'couverture-du-dernier-mois-clos'
    if 'Shifted/duplicate Yahoo monthly candle' in cause:
        return 'cotation-terminale-yahoo'
    if 'TWD' in key and 'cross-rate' in cause:
        return 'maturite-h10-twd'
    if 'IE00BD4TXV59:completeHoldings' in key:
        return 'document-mensuel-swissfunddata-ubs'
    if 'S&P' in cause and ('403' in cause or 'handoff' in cause):
        return 'acces-primaire-sp-et-cache-date'
    if 'IE00BKLF1R75:completeHoldings' in key or 'IE00BZ56SW52:completeHoldings' in key:
        return 'positions-wisdomtree-acces-et-regression'
    if 'IE000NDWFGA5:completeHoldings' in key:
        return 'poids-non-publie-globalx-uranium'
    if key.endswith(':pea'):
        return 'qualification-pea-part-exacte'
    if 'IE00BM8R0J59' in key:
        return 'qyld-reference-et-part-distribuante'
    if key.startswith('history:') and row.get('kind') != 'failure':
        return 'preuves-historiques-a-conserver'
    if key.startswith('radar:') or 'update-editorial-radar' in key:
        return 'radar-' + (row.get('dataId') or key)
    if cause == "'2026-10'":
        return 'dependance-change-bce-octobre'
    if '2026-10' in cause and 'Monthly NAV/return end not independently qualified' in cause:
        return 'borne-mensuelle-nav-non-qualifiee'
    if row.get('kind') == 'connection':
        if 'corroborée manuellement' in cause:
            return 'recoupements-externes-courtiers-manuels'
        # The catalog and consumer views describe the same product/field. Keep
        # different vehicles separate even when their missing-doc wording matches.
        identity = '\x1f'.join([row.get('name', ''), row.get('field', ''), cause])
        return 'raccordement-documentaire-' + hashlib.sha256(identity.encode()).hexdigest()[:12]
    if key.startswith('usage:') and row.get('kind') != 'failure':
        return 'contrats-consommateurs-' + (row.get('category') or 'qualification')
    return str(row.get('category') or row.get('stage') or row.get('kind')) + ':' + hashlib.sha256(cause.encode()).hexdigest()[:12]


old_export = read_capture(initial, 'diagnostics-all')
new_export = read_capture(current, 'diagnostics-all')
old = index(old_export['rows'])
new = index(new_export['rows'])
old_active = index(read_capture(initial, 'diagnostics-action')['rows'])
new_active = index(read_capture(current, 'diagnostics-action')['rows'])
assert set(old_active) <= set(old) and set(new_active) <= set(new)
rows, causes = [], {}
for key in dict.fromkeys([*old, *new]):
    before, after = old.get(key), new.get(key)
    ref = after or before
    classification = category(ref)
    if after is None:
        presence = 'absent du relevé courant ; résolution non déduite'
    elif key in new_active:
        presence = 'présent dans la boîte active'
    else:
        presence = 'conservé hors boîte active / trace historique'
    cause_group = group(ref)
    row = {
        'diagnostic_id': key,
        'present_initialement': str(before is not None),
        'actif_initialement': str(key in old_active),
        'classe_initiale': before.get('kind', '') if before else '',
        'present_courant': str(after is not None),
        'actif_courant': str(key in new_active),
        'classe_courante': after.get('kind', '') if after else '',
        'presence_1nov': presence,
        'nature_1nov': classification,
        'cause_mutualisee_1nov': cause_group,
        'instrument_ou_donnee': ref.get('dataId') or ref.get('asset') or ref.get('name'),
        'champ': ref.get('field', ''),
        'outils_declares': json.dumps(ref.get('tools', []), ensure_ascii=False),
        'etape': ref.get('stage', ''),
        'motif_initial': before.get('cause', '') if before else '',
        'motif_courant': after.get('cause', '') if after else '',
        'run_courant': ref.get('runId', ''),
        'date_controle': ref.get('checkedAt', ''),
        'date_donnee': ref.get('asOf', ''),
        'preuve_releve': 'capture.json ; diagnostics-all.json.gz ; diagnostics-action.json.gz',
        'limite': 'La présence, la disparition et un succès global ne certifient pas une réparation du champ ; se reporter aux preuves bornées de livraison.',
    }
    rows.append(row)
    entry = causes.setdefault(cause_group, {'cause': cause_group, 'identites': [], 'actives': [], 'champs': set(), 'outils': set(), 'natures': set()})
    entry['identites'].append(key)
    if key in new_active:
        entry['actives'].append(key)
    entry['champs'].add(str(ref.get('field', '')))
    entry['outils'].update(ref.get('tools', []))
    entry['natures'].add(classification)


def write_csv(path, records):
    with path.open('w', encoding='utf-8-sig', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=list(records[0]), delimiter=';', lineterminator='\n')
        writer.writeheader()
        writer.writerows(records)


write_csv(output / 'reconciliation-diagnostics-1nov.csv', rows)
group_rows = [{
    'cause': key,
    'diagnostics_conserves': len(value['identites']),
    'diagnostics_actifs': len(value['actives']),
    'identites_exactes': json.dumps(value['identites'], ensure_ascii=False),
    'identites_actives': json.dumps(value['actives'], ensure_ascii=False),
    'champs': json.dumps(sorted(value['champs']), ensure_ascii=False),
    'outils_declares': json.dumps(sorted(value['outils']), ensure_ascii=False),
    'natures': json.dumps(sorted(value['natures']), ensure_ascii=False),
    'limite': 'Groupe de rapprochement, pas certification fournisseur ; une ancienne preuve incomplète reste historique.',
} for key, value in sorted(causes.items())]
write_csv(output / 'causes-1nov.csv', group_rows)
assert len(rows) == len(set(old) | set(new))
assert {r['diagnostic_id'] for r in rows if r['present_initialement'] == 'True'} == set(old)
assert sum(len(v['identites']) for v in causes.values()) == len(rows)
summary = {
    'initial': {'all': len(old), 'active': len(old_active), 'classes': dict(collections.Counter(r['kind'] for r in old.values()))},
    'current': {'all': len(new), 'active': len(new_active), 'classes': dict(collections.Counter(r['kind'] for r in new.values())), 'buildInfo': read_capture(current, 'build-info')},
    'union': len(rows),
    'initialIdentitiesPreserved': len(old),
    'initialNowAbsentWithoutRepairInference': len(set(old) - set(new)),
    'newIdentities': len(set(new) - set(old)),
    'mutualizedGroups': len(causes),
    'limit': 'Classification fondée sur les exports ; les preuves de correction restent séparées, aucune panne déduite des seuls contrats non confirmés.',
}
(output / 'rapprochement-bilan-1nov.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(summary, ensure_ascii=False))
