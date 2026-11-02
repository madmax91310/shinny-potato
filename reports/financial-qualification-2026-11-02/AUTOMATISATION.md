# Transmission au chantier automatisation

Base rapprochée : master `4b5ea567e0209d958a57f0e67a6109f917c35e1e`, #1148 Nikkei conservée. Aucun changement de collecteur, HTTP/navigateur, workflow, concurrence, enregistrement ni déploiement dans le correctif financier. #1061 reste une piste AUM bloquée, hors de ce lot ; #1042 ne recoupe pas les réserves.

## Cinq refreshs NAV : source accessible, preuve financière manquante

Fichier de configuration existant : `scripts/official-nav-remainder-sources.json`. IDs : `etcPalladium`, `etf_world_communication`, `etf_clean_energy`, `etf_financials`, `etfIE00B2QWCY14`. API `get-product-data`, composants `keyFundFacts,performance`, productIds **256574, 326317, 251911, 308836, 251920**. Tous les appels et contrôles d’identité/devise réussissent dans la lecture actuelle.

[Requêtes exactes, empreintes, dates et valeurs](source-checks/nav-boundaries.json), réponses `.json.gz` nommées par ISIN. Reproduction financière sans HTTP, sans écriture de registre :

```python
import datetime as dt, gzip, json, pathlib, sys
sys.path.insert(0, 'scripts')
from issuer_nav_history import blackrock_nav
from blackrock_income_history import qualify
sources=json.load(open('scripts/official-nav-remainder-sources.json'))
for source in sources:
    path=pathlib.Path('reports/financial-qualification-2026-11-02/source-checks')/(source['isin']+'.json.gz')
    if not path.exists(): continue
    body=json.loads(gzip.decompress(path.read_bytes()))
    now=dt.datetime.fromisoformat('2026-11-02T12:00:00+00:00')
    parsed=blackrock_nav(body, source['isin'], source['navCurrency'], now)
    print(source['id'], max(parsed['nav']), max(parsed['totalReturn']))
    try: qualify(body,parsed,source,now)
    except ValueError as error: print(error)
```

Résultat : NAV du **30 octobre**, TR du **29 octobre**, `Monthly NAV/return end not independently qualified: 2026-10`. La NAV du 30 diffère de celle du 29. Aucune réparation de transport n’est justifiée par cette preuve, aucun décalage de date ni renormalisation ne peut certifier octobre. Attendre/obtenir la publication TR du 30 ou une preuve officielle indépendante de même portée. Maintenir la dernière valeur valide, sa date réelle et le refus visible. Une éventuelle séparation technique des canaux « niveau brut » / « rendement réinvesti » doit garder leurs qualifications indépendantes ; ce diagnostic n’autorise pas une extension du 29 au 30.

## Amundi : API cash null, pas zéro

ISIN **FR0013412020** et **FR0013412012**. [Requêtes exactes et réponses](source-checks/amundi-policies.json) ; fichiers `*-request.json` et `*-history.json.gz`. `dividendAmount` et `dividendCurrency` sont null, alors que les séries NAV/ajustées existent et que l’API et les documents indiquent une politique mixte. Ne pas convertir null en absence historique de distribution, ni le facteur d’échelle voisin de 5 en un split ou un dividende de 5 EUR.

Besoin financier restant : rapports annuels/avis officiels et historique juridique manquant en 2019–2022, puis paiements aux périodes 2019–2025, avec montants, devises, dates de détachement et continuité de part. Les versions officielles de décembre 2022 / janvier 2023 et mars 2024 retrouvées sont déjà dans le manifeste documentaire ; ne pas reprendre cette recherche comme un manque total de prospectus historiques. Aucun correctif de collecteur indispensable pour la correction de lecture actuelle : Fiches pratiques reçoit déjà la bonne politique. Le lot financier corrige le getter et le prédicat de copie, sans écriture de métadonnée automatisée concurrente.

## 35 résidus de mesures

Clés complètes : `measurementRows` non expliquées dans [matrix.json](matrix.json). 35 comparaisons et six canaux de cotation sur six ISIN, pas 35 pannes. Les sources officielles de part, les calendriers et les 13 cash-flows USD WQDV publiés sont archivés dans ce dossier. Manquent encore les rapprochements avec les observations de cotation ajustées et les fixings aux mêmes heures/dates, événement par événement pour WQDV. Une voie technique peut aider à obtenir ces preuves ; elle ne doit pas remplacer un fonds par son indice ni certifier un résidu en élargissant une tolérance.

L’ancien HTTP 410 ABTC est confirmé résolu par une lecture officielle réussie des trois endpoints primaires ; ne pas le rouvrir comme panne actuelle. Les anciennes restrictions de cotations ABTC.PA/XNKY.DE et les NAV indépendantes conservent leurs scopes distincts.
