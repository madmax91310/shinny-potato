"""Append a dated public reconciliation to the existing consolidated ledgers.

Usage: python <this-file> DELIVERY_DIRECTORY RECONCILIATION_DIRECTORY PUBLIC_CAPTURE
No old row, identifier, financial finding or status column is removed or rewritten.
New source successes must be evidenced separately; disappearance is never a repair.
"""
import collections
import csv
import gzip
import io
import json
import pathlib
import sys

csv.field_size_limit(8_000_000)
base, reconciliation, capture = map(pathlib.Path, sys.argv[1:])


def read_csv(path):
    raw = path.read_bytes()
    if path.suffix == '.gz':
        raw = gzip.decompress(raw)
    reader = csv.DictReader(io.StringIO(raw.decode('utf-8-sig')), delimiter=';')
    return list(reader.fieldnames), list(reader)


def write_csv(path, fields, rows):
    out = io.StringIO(newline='')
    writer = csv.DictWriter(out, fieldnames=fields, delimiter=';', lineterminator='\n', extrasaction='raise')
    writer.writeheader()
    writer.writerows(rows)
    raw = out.getvalue().encode('utf-8-sig')
    path.write_bytes(gzip.compress(raw, mtime=0) if path.suffix == '.gz' else raw)


_, current_rows = read_csv(reconciliation / 'reconciliation-diagnostics-1nov.csv')
current = {r['diagnostic_id']: r for r in current_rows}
assert len(current) == len(current_rows)
ledger_path = base / 'suivi-consolide.csv.gz'
fields, ledger = read_csv(ledger_path)
original_ids = [r['id_suivi'] for r in ledger]
assert len(set(original_ids)) == len(original_ids)
extra = ['diagnostic_id_1nov', 'presence_publique_1nov', 'classe_publique_1nov',
         'nature_1nov', 'cause_mutualisee_1nov', 'statut_diagnostic_1nov',
         'preuve_1nov', 'limite_1nov']
fields += [f for f in extra if f not in fields]
matched = set()
for row in ledger:
    key = next((row.get(field) for field in ('diagnostic_id_1nov', 'diagnostic_id_29oct', 'id_suivi')
                if row.get(field) in current), None)
    if key is None:
        # Keep the earlier qualification; no new verification is claimed.
        row.update(presence_publique_1nov='non rapproché par identité exacte ; ligne antérieure conservée',
                   limite_1nov='Aucune résolution ni panne nouvelle déduite sans rapprochement actuel du contrat.')
        continue
    matched.add(key)
    item = current[key]
    row.update(diagnostic_id_1nov=key, presence_publique_1nov=item['presence_1nov'],
               classe_publique_1nov=item['classe_courante'], nature_1nov=item['nature_1nov'],
               cause_mutualisee_1nov=item['cause_mutualisee_1nov'],
               statut_diagnostic_1nov=item['motif_courant'] or 'identité absente ; pas de résolution déduite',
               preuve_1nov='preuves/reprise-2026-11-01/reconciliation-diagnostics-1nov.csv#' + key,
               limite_1nov=item['limite'])
for key in sorted(set(current) - matched):
    item = current[key]
    ledger.append({
        'id_suivi': 'diagnostic_1nov:' + key,
        'axe': 'reprise consolidée ; identité export public',
        'type_defaut': item['nature_1nov'],
        'statut_donnees': 'voir qualification datée ; aucune réparation globale déduite',
        'statut_supervision': 'identité publique réconciliée',
        'reliquat_actif': item['actif_courant'],
        'probleme': item['motif_courant'] or item['motif_initial'],
        'outils': item['outils_declares'],
        'origines': 'export initial du1novembre et export public courant ; mêmes identités conservées',
        'diagnostic_id_1nov': key,
        'presence_publique_1nov': item['presence_1nov'],
        'classe_publique_1nov': item['classe_courante'],
        'nature_1nov': item['nature_1nov'],
        'cause_mutualisee_1nov': item['cause_mutualisee_1nov'],
        'statut_diagnostic_1nov': item['motif_courant'] or 'absent ; résolution non déduite',
        'preuve_1nov': 'preuves/reprise-2026-11-01/reconciliation-diagnostics-1nov.csv#' + key,
        'limite_1nov': item['limite'],
    })
assert [r['id_suivi'] for r in ledger[:len(original_ids)]] == original_ids
assert set(current) <= {r.get('diagnostic_id_1nov') for r in ledger}
write_csv(ledger_path, fields, ledger)

path = base / 'restant-a-verifier.csv.gz'
fields, remaining = read_csv(path)
previous_remaining_ids = [r['id_suivi'] for r in remaining]
by_id = {r['id_suivi']: r for r in ledger}
extra = ['statut_final_1nov', 'nature_reliquat_1nov', 'dans_boite_active_1nov',
         'limite_usage_1nov', 'preuve_finale_1nov']
fields += [f for f in extra if f not in fields]
for row in remaining:
    ref = by_id[row['id_suivi']]
    key = ref.get('diagnostic_id_1nov')
    observed = current.get(key)
    row.update(statut_final_1nov=ref.get('presence_publique_1nov', 'qualification antérieure conservée'),
               nature_reliquat_1nov=ref.get('nature_1nov') or 'contrat / preuve antérieurs ; nouvelle panne non déduite',
               dans_boite_active_1nov=observed['actif_courant'] if observed else 'non rapproché',
               limite_usage_1nov=ref.get('limite_1nov', 'voir limite antérieure conservée'),
               preuve_finale_1nov=ref.get('preuve_1nov', 'voir preuve antérieure conservée'))
existing = set(previous_remaining_ids)
for ref in ledger:
    observed = current.get(ref.get('diagnostic_id_1nov'))
    if ref['id_suivi'] in existing or not observed or observed['actif_courant'] != 'True':
        continue
    remaining.append({'id_suivi': ref['id_suivi'], 'axe': ref.get('axe', ''),
                      'probleme': ref.get('probleme', ''), 'outils': ref.get('outils', ''),
                      'origines': ref.get('origines', ''),
                      'statut_final_1nov': observed['presence_1nov'],
                      'nature_reliquat_1nov': observed['nature_1nov'],
                      'dans_boite_active_1nov': 'True', 'limite_usage_1nov': observed['limite'],
                      'preuve_finale_1nov': ref.get('preuve_1nov', '')})
assert [r['id_suivi'] for r in remaining[:len(previous_remaining_ids)]] == previous_remaining_ids
write_csv(path, fields, remaining)

# Preserve all79 historical comparisons. Only append the exact public engine
# qualification, independently of whether its old financial divergence is solved.
financial = json.loads((capture / 'financial-reconciliation.json').read_text())
open_rows = {r['id']: r for r in financial['rows'] if r.get('open') or r.get('residualOpen')}
path = base / 'reconciliation-79-ecarts.csv'
fields, comparisons = read_csv(path)
assert len(comparisons) == len(open_rows) == 79
extras = ['qualification_publique_1nov', 'voies_publiques_1nov', 'preuve_etat_publie_1nov', 'limite_intervention_1nov']
fields += [f for f in extras if f not in fields]
qualified = 0
for row in comparisons:
    # The legacy `id` identifies a series, not a unique comparison. Preserve it;
    # reconcile the exact share/year pair against the public case identity.
    case_id = row['isin'] + '/' + row['year']
    observed = open_rows[case_id]
    windows = (observed.get('currentConsumer') or {}).get('windows', [])
    admitted = any((w.get('qualification') or {}).get('qualified') for w in windows)
    qualified += admitted
    row.update(qualification_publique_1nov=str(admitted),
               voies_publiques_1nov=json.dumps(windows, ensure_ascii=False),
               preuve_etat_publie_1nov='preuves/reprise-2026-11-01/' + capture.name + '/financial-reconciliation.json#' + case_id,
               limite_intervention_1nov='Renouvellement et rattrapage mensuels distincts ; aucune ancienne divergence ni fenêtre refusée déclarée résolue par la correction Yahoo, H10 ou BCE.')
write_csv(path, fields, comparisons)
print(json.dumps({'consolidatedRowsBefore': len(original_ids), 'consolidatedRowsAfter': len(ledger),
                  'publicIdentitiesLinkedWithoutLoss': len(current),
                  'remainingRowsBefore': len(previous_remaining_ids), 'remainingRowsAfter': len(remaining),
                  'historicalComparisons': len(comparisons), 'qualifiedWindows': qualified,
                  'refusedWindows': len(comparisons) - qualified}, ensure_ascii=False))
