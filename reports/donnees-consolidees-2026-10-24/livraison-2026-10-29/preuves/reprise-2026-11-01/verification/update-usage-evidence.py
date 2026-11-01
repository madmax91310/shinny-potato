"""Append bounded evidence and current tool scope; preserve earlier qualifications.

Usage: script DELIVERY_DIRECTORY PROOF_DIRECTORY
No source-wide success is projected onto untested fields or historical windows.
"""
import csv
import gzip
import io
import json
import pathlib
import sys

csv.field_size_limit(8_000_000)
base, proof = map(pathlib.Path, sys.argv[1:])


def read(name):
    data = (base / name).read_bytes()
    if name.endswith('.gz'):
        data = gzip.decompress(data)
    reader = csv.DictReader(io.StringIO(data.decode('utf-8-sig')), delimiter=';')
    return list(reader.fieldnames), list(reader)


def write(name, fields, rows):
    stream = io.StringIO(newline='')
    writer = csv.DictWriter(stream, fieldnames=fields, delimiter=';', lineterminator='\n')
    writer.writeheader()
    writer.writerows(rows)
    data = stream.getvalue().encode('utf-8-sig')
    (base / name).write_bytes(gzip.compress(data, mtime=0) if name.endswith('.gz') else data)


registry = json.loads((proof / 'current-tool-registry.json').read_text())
active = {r['route']: r['outil'] for r in registry['tools']}
removed = set(registry['removedRoutes'])
assert len(active) == 26 and not active.keys() & removed
bounded = json.loads((proof / 'public-nonbond-two-consumers/proof.json').read_text())
assert len(bounded['calculations']) == 14 and not bounded['errors']
tested = {'history:' + r['id'] for r in bounded['calculations']}
fields, rows = read('matrice-donnees-usages.csv.gz')
initial_ids = [r['id_suivi'] for r in rows]
extra = ['perimetre_outil_1nov', 'preuve_intervention_1nov', 'usage_verifie_1nov', 'limite_preuve_1nov']
fields += [k for k in extra if k not in fields]
for row in rows:
    row['perimetre_outil_1nov'] = ('périmètre supprimé #1116 ; trace conservée, aucune donnée réparée' if row['route'] in removed
                                      else 'outil actif' if row['route'] in active else 'route non rapprochée ; qualification antérieure conservée')
    row['limite_preuve_1nov'] = 'Aucune qualification globale déduite du build ni du succès du producteur ; preuves antérieures conservées.'
    if row['actif_identifiant'] in tested and row['route'] == '/calculateur-investissement':
        row.update(preuve_intervention_1nov='preuves/reprise-2026-11-01/public-nonbond-two-consumers/proof.json',
                   usage_verifie_1nov='Calcul public USD janvier2020–octobre2026, ratio indépendant sur le registre publié ; aperçu/texte/PNG Adobe vérifiés séparément.',
                   limite_preuve_1nov='Le parcours de chaque série est vérifié ; les exports individuels des treize autres actions et toutes les anciennes fenêtres ne sont pas certifiés.')
    if row['actif_identifiant'] == 'history:adobe' and row['route'] == '/classements-performances':
        row.update(preuve_intervention_1nov='preuves/reprise-2026-11-01/public-nonbond-two-consumers/proof.json',
                   usage_verifie_1nov='Comparatif public USD octobre2024–octobre2026 : rendement annualisé et année2026 partielle calculés indépendamment ; texte et PNG ; recette mobile distincte.',
                   limite_preuve_1nov='Aucune extension aux conventions, devises ou périodes non exercées.')
    if row['route'] == '/le-dca-de' and row['actif_identifiant'] in ['IE00B441G979', 'IE000C6ITGC8', 'IE0007Y8Y157'] and row['cle_champ'] in ['coverage:completeHoldings', 'coverage:holdings']:
        row.update(preuve_intervention_1nov='preuves/reprise-2026-11-01/public-exposure-recovery-quantified/proof.json',
                   usage_verifie_1nov='Sélection publique exacte ; concentration top5/top10 recomptée sur les poids du manifeste ; analyse et sixPNG ordinateur/mobile concordent avec les aperçus.',
                   limite_preuve_1nov='Aucun poids renormalisé ; WorldHedged conserve98,70072%actions. Pas de certification indépendante des pays/secteurs, des recouvrements ou de toutes les positions fournisseur.')
    if row['route'] == '/il-y-a-x-ans' and row['actif_identifiant'] in {'history:'+id for id in ['etcPalladium','etf_world_communication','etf_clean_energy','etf_financials','etfIE00B2QWCY14']}:
        row.update(preuve_intervention_1nov='preuves/reprise-2026-11-01/public-retained-anniversaries/proof.json',
                   usage_verifie_1nov='Niveau conservé du29/30octobre réellement utilisé ; évolution du prix depuis novembre2025 recomptée ; conventions et6PNG vérifiés.',
                   limite_preuve_1nov='Aucun nouveau contrôle source réussi : date de contrôle31octobre conservée. Le refus de collecte1novembre et les bornes réinvesties mensuelles manquantes restent ouverts.')
existing = set(initial_ids)
budgets = ['reddit-famille-bourges-2026-07-12', 'budget-conseil-personne_seule-2025-2026',
           'budget-conseil-monoparent_1enfant-2025-2026', 'budget-conseil-monoparent_2enfants-2025-2026']
for asset in budgets:
    key = f'usage:/le-budget-de|{asset}|archive:published-budget'
    if key not in existing:
        rows.append({'id_suivi': key, 'outil': active['/le-budget-de'], 'route': '/le-budget-de',
                     'actif_identifiant': asset, 'nom': asset, 'donnee': 'Budget publié / prévision déclarée',
                     'cle_champ': 'archive:published-budget', 'nature': 'archive', 'requise': 'True',
                     'etat': 'non applicable', 'nature_ecart': 'non applicable',
                     'blocage': 'Publication datée ou prévision déclarée ; pas une donnée vivante à recollecter.',
                     'perimetre_outil_1nov': 'outil actif ; archive',
                     'preuve_intervention_1nov': 'PR#1115 ; registres budgets publics conservés',
                     'limite_preuve_1nov': 'Aucune actualisation automatique de chiffres historiques revendiquée.'})
assert [r['id_suivi'] for r in rows[:len(initial_ids)]] == initial_ids
assert len({r['id_suivi'] for r in rows}) == len(rows)
write('matrice-donnees-usages.csv.gz', fields, rows)

fields, summaries = read('bilan-par-outil.csv')
extra = ['perimetre_1nov', 'fonctionnement_demontre_1nov', 'actualisation_partielle_1nov',
         'blocages_1nov', 'suite_1nov', 'preuve_1nov']
fields += [k for k in extra if k not in fields]
known = {r['route'] for r in summaries}
for route, title in active.items():
    if route not in known:
        summaries.append({'route': route, 'outils_variantes': json.dumps([title], ensure_ascii=False),
                          'limite_comptage': 'Route éditoriale ou supervision ; pas une nouvelle chaîne financière.'})
for row in summaries:
    route = row['route']
    row['perimetre_1nov'] = 'périmètre supprimé #1116 ; trace conservée' if route in removed else 'outil actif'
    row['fonctionnement_demontre_1nov'] = 'Corrections et preuves antérieures préservées ; aucun nouveau parcours non exercé revendiqué.'
    row['actualisation_partielle_1nov'] = 'Voir les preuves exactes par champ et période ; les contrats non confirmés ne sont pas autant de pannes.'
    row['blocages_1nov'] = 'Limites antérieures conservées ; pas de certification de tous les champs à partir des collectes mutualisées.'
    row['suite_1nov'] = 'Pièces manquantes et étapes non démontrées dans le suivi consolidé et les diagnostics publics réconciliés.'
    row['preuve_1nov'] = 'preuves/reprise-2026-11-01/current-tool-registry.json ; matrice-donnees-usages.csv.gz'
    if route in removed:
        row['fonctionnement_demontre_1nov'] = 'Outil retiré par un autre chantier ; aucun rétablissement revendiqué.'
        row['blocages_1nov'] = 'Non applicable ; les données et consommateurs partagés sont préservés.'
    elif route in ['/idees-classements', '/hey-grok', '/dilemme']:
        row['fonctionnement_demontre_1nov'] = 'Contenu éditorial, scénario ou saisie personnelle ; aucune collecte financière nouvelle requise par ces contenus.'
        row['blocages_1nov'] = 'Non applicable aux hypothèses/archives ; les éventuelles suggestions Radar conservent les limites de leur source.'
    elif route == '/donnees-a-revoir':
        row['fonctionnement_demontre_1nov'] = 'Chargement public des documents et exports complets actifs/tous contrôlés, erreurs navigateur nulles ; empreintes et version conservées.'
        row['preuve_1nov'] = 'preuves/reprise-2026-11-01/public-final/capture.json ; reconciliation-diagnostics-1nov.csv'
    elif route == '/calculateur-investissement':
        row['fonctionnement_demontre_1nov'] = 'Quatorze actions USD, calcul janvier2020–octobre2026 vérifié indépendamment ; texte et PNG Adobe sur ordinateur/mobile.'
        row['preuve_1nov'] = 'preuves/reprise-2026-11-01/public-nonbond-two-consumers/proof.json ; public-nonbond-mobile-final/proof.json'
    elif route == '/classements-performances':
        row['fonctionnement_demontre_1nov'] = 'Adobe USD, comparaison octobre2024–octobre2026 et année2026 partielle, texte/PNG ordinateur/mobile ; règles des années complètes conservées.'
        row['preuve_1nov'] = 'preuves/reprise-2026-11-01/public-nonbond-two-consumers/proof.json ; public-nonbond-mobile-final/proof.json'
    elif route == '/le-dca-de':
        row['fonctionnement_demontre_1nov'] = 'WorldHedged, iSharesQuantum et VanEckQuantum : sélection exacte, top5/top10 recomptés depuis les poids du manifeste public, analyse et6PNG ordinateur/mobile identiques aux aperçus.'
        row['blocages_1nov'] = 'WorldHedged reste98,70072%actions identifiées ; pas de renormalisation. Les autres positions partielles, livres WisdomTree incomplets et Uranium restent distincts.'
        row['preuve_1nov'] = 'preuves/reprise-2026-11-01/public-exposure-recovery-quantified/proof.json'
    elif route == '/il-y-a-x-ans':
        row['fonctionnement_demontre_1nov'] = 'Cinq parts aux NAV conservées29/30octobre : sélection, dates, prix hors distributions quand applicable, évolution indépendante et6PNG publics.'
        row['actualisation_partielle_1nov'] = 'Le producteur41348779315 réussit651éléments mais conserve19échecs :14dépendancesFXoctobre et5qualifications NAV/TR. Les niveaux antérieurs datés restent utilisables.'
        row['blocages_1nov'] = 'Refus de nouvelle collecte distinct de la disponibilité du dernier niveau qualifié ; aucune date de réussite renouvelée artificiellement.'
        row['preuve_1nov'] = 'preuves/reprise-2026-11-01/public-retained-anniversaries/proof.json ; publication-ordinary-41348779315-summary.json'
    elif route == '/tweets-factsheets':
        row['fonctionnement_demontre_1nov'] = 'STOXX600 : ventilations du même livre physique exact daté30octobre ; sélection, aperçu et troisPNG ordinateur/mobile.'
        row['blocages_1nov'] = 'Approximation physique explicite, pas composition officielle exacte de l’indice ; renouvellement primaire S&P403 non réparé.'
        row['preuve_1nov'] = 'preuves/reprise-2026-11-01/stoxx-browser-public/proof.json'
assert set(active) <= {r['route'] for r in summaries}
write('bilan-par-outil.csv', fields, summaries)
print(json.dumps({'matrixBefore': len(initial_ids), 'matrixAfter': len(rows), 'activeRoutes': len(active),
                  'historicalRemovedRoutes': len(removed), 'summaryRowsIncludingHistory': len(summaries),
                  'newArchivedBudgetRows': len(rows) - len(initial_ids)}, ensure_ascii=False))
