# Qualification des expositions et enregistrement des collectes

## Classifications

`src/lib/exposure-classification.js` qualifie les observations à partir du fournisseur, de l’URL officielle, du composant de collecte et, lorsqu’elle existe, de la méthode publiée. Les collecteurs conservent désormais `sourceComponent` pour les ventilations iShares et Amundi. Les observations antérieures peuvent être qualifiées par le contrat explicite du collecteur et leur URL ; cette preuve est distinguée dans `classificationMetadata.evidence`.

| Source | Contrat reconnu | Périmètre conservé |
|---|---|---|
| iShares API | `exposureBreakdowns.geography.countries` | Géographie publiée ; aucune assimilation au pays de risque |
| iShares API | `exposureBreakdowns.sector`, vocabulaire sectoriel connu | Secteurs publiés ; les industries inconnues restent distinctes |
| iShares positions | Méthodes explicites pays de risque / secteurs des positions | Classification distincte des ventilations API |
| Amundi API | `FUND_COUNTRIES` / `INDEX_COUNTRIES` | Fonds physique et indice séparés ; secteurs non assimilés entre familles d’indices |
| DWS | Méthode explicite des pays d’enregistrement | Distinct des pays de risque |
| Vanguard | FTSE Country of Risk / CNTRYATPCB / distribution par émetteur | Pays de risque, marchés obligataires et types d’émetteurs distincts |
| VanEck | Méthodes Sector / SubIndustry | Secteurs et sous-industries distincts |

La qualification est recalculée à chaque construction des données communes, y compris l’extrait DCA. Elle ne modifie ni les poids ni les dates. Deux observations ne sont regroupées que si classification, date et périmètre fonds/indice coïncident. Une table partielle ne devient pas une couverture complète et n’autorise pas une comparaison intégrale. Les méthodes non reconnues suivent les règles conservatrices existantes ; sans méthode, chaque support reste isolé.

L’outil DCA conserve son approximation récente et les dates individuelles introduites par son évolution dédiée. Sa compatibilité ETF utilise les mêmes identifiants qualifiés et distingue fonds/indice ; la seule identité iShares ne suffit plus à déclarer GICS ou pays de risque. Les actions individuelles et leurs classifications explicites restent disponibles.

Le test `node scripts/test-exposure-classification.mjs` couvre les regroupements compatibles, les sources non reconnues, les contradictions de composant, les dates, les périmètres et les couvertures partielles.

## Collecteurs

Les 18 workflows publiant des observations sur `master` passent par `scripts/commit-validated-data.sh`. Chaque workflow conserve sa liste explicite de fichiers et ses conditions de publication. Le radar éditorial reste sur son mécanisme dédié à une branche de suivi.

Le helper prépare un index et un worktree temporaires, récupère `master`, rebase les seuls fichiers autorisés et tente un push sans forçage jusqu’à trois fois. Un conflit arrête l’opération. Le worktree et l’index d’origine ne sont pas modifiés. `VALIDATED_DATA_CHECK` permet de refaire un contrôle après chaque rebase ; la collecte d’or conserve ainsi son audit des séries. Les sorties sont `commit_sha` et `changed`.

Le registre `src/data/automation-workflows.json` nomme les étapes de collecte et de validation de chaque job de production. Le suivi distingue :

1. **Collecte** : résultat des étapes de collecte et erreurs des rapports, y compris les collectes partielles.
2. **Validation** : échec d’un contrôle identifié ou réussite du point de contrôle placé après toutes les vérifications obligatoires.
3. **Enregistrement** : résultat du helper, y compris la réussite sans changement de données.
4. **Publication** : réussite effective de `actions/deploy-pages`, jamais déduite du seul succès d’un job pouvant sauter le déploiement.

Les anciennes exécutions sans ces étapes conservent leur preuve historique ; une phase non documentée n’est pas inventée. Une étape de configuration en échec ne prouve pas un échec de collecte. Les tests Python utilisent de vrais dépôts Git temporaires et vérifient les phases ainsi que les contrats des workflows. Le test Chromium du suivi couvre les quatre phases et leur affichage mobile.
