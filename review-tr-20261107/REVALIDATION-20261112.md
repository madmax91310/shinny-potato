# Réévaluation de la PR #1201 — 12 novembre 2026

Base vérifiée : `master` à `9a1074370931e8274a408d7aea0df3edafcbf795` (12 novembre, 01:05 UTC).
Head initial : `6f0095f6fa06b60eb20c37a77517dc9f90167b33`.
L'intégration de cette base dans la branche de la PR ne produit aucun conflit.
Le diff fonctionnel relatif à cette base reste celui des six fichiers de code/tests de la PR initiale.

## Cause de l'échec des logos

Le job du 7 novembre `128408904321` utilise le merge de test `6bb7365ffdcda52813605d184fa30282a9bce46e`
et télécharge l'artefact `validated-generated-data` avant les tests navigateur.
Son générateur vérifie déjà les utilisations archivées des logos, mais parcourt toutes les fiches financières disponibles.
L'admission de la fiche trimestrielle Russell ajoute donc une entrée vide `"russell-1000":{}` à la reconstruction.
Cette entrée ne figure pas dans le registre revu. Le journal tronque les deux objets à 10 000 caractères ;
leur différence de longueur est de 18 caractères, exactement celle de cette entrée et de son séparateur.

Reproduction avec l'ancien générateur et les projections actuelles : voir `logo-reproduction-20261112.json`.
La seule différence est cette entrée vide ; toutes les fiches revues, les sociétés et les identifiants de titres restent identiques.
Le contrôle ne révèle ni logo altéré ni régression de la collecte Trade Republic.
Il s'agit d'une divergence de périmètre entre une projection financière actualisée et une archive de logos.

Le correctif indépendant `7ba18ea033e276bb41e3123cace38c71f53d213a`, déjà intégré à master,
utilise `reviewedLogoSheets` et refuse toujours la disparition d'une fiche revue.
`6b08ba2f35027ae8278eff5d1010643dddfa19e2` place sa régression après la génération des compositions.
Les alias, empreintes, SVG, images locales et comparaison exacte restent contrôlés.
Aucune régénération du registre ni modification des données financières n'est nécessaire dans cette PR.

## Huit contrôles Trade Republic

La sonde `revalidate.py` appelle `collect`, `fetch_content`, le résolveur et les parseurs réels.
Seuls les deux hôtes Trade Republic déjà autorisés sont téléchargés ; les autres courtiers sont exclus de cette sonde,
sans être déclarés en échec de production. Aucun `--apply`, aucun changement des observations de production.
Les reçus et les résultats avant/après sont dans `revalidation-20261112.json`.

| Entrée | Résultat du 12 novembre |
| --- | --- |
| `tr` | Validé : 1 € hors plans ; les autres coûts possibles restent distincts |
| `tr_direct` | Validé : 2 € au total, dont 1 € règlement et 1 € place |
| `tr_garde_cto` | Validé : 0 € CTO, aucune extrapolation au PEA |
| `tr_transfer_cto` | Validé : 0 € facturé par TR, frais tiers possibles |
| `tr:profile:dca` | Confirmé : plans PEA sans frais d'exécution annoncés, réserves conservées |
| `tr:profile:pme` | Source traitée sans erreur ; disponibilité PEA-PME toujours non établie |
| `tr:profile:change` | Source traitée sans erreur ; qualification toujours partielle |
| `tr:profile:garde` | Source traitée sans erreur ; qualification PEA toujours partielle |

Neuf tentatives de téléchargement : une ancienne URL conservée en référence renvoie encore vers `/support`
et est refusée par le contrôle ; la reprise sur l'URL configurée avec `web_view=true` réussit.
Les huit autres téléchargements (sept articles et contrat France) réussissent.
Aucun échec TR final. Les contrôles d'identifiant, pays/langue, H1, canonical et redirections restent actifs.
Les sept tests d'identité incluent le rejet des faux HTTP 200 et la conservation exacte des anciennes valeurs,
dates, références et empreintes en cas d'échec des huit entrées.

## Validation locale

- 74 tests `test_broker_tariff*.py` : réussis.
- 14 tests `test_regulatory*.py` : réussis.
- `test-broker-automation.mjs`, `test-regulatory-consumers.mjs`, `audit:broker-evidence` : réussis.
- `npm run build`, y compris audits de couverture et manifeste publié : réussi.
- `build-index-logo-registry.mjs --check`, `test-index-logo-review-scope.mjs` : réussis.
- Lancement local du test navigateur `test-index-ribbon.mjs` : bloqué avant les assertions par
  `socket() failed: Operation not permitted` dans Chromium. L'installation de Chrome Headless Shell échoue
  aussi (archive téléchargée invalide). Les résultats navigateur doivent donc être établis par la CI de la PR.

La branche de travail peut être mise à jour et validée en CI ; toute fusion dans master et tout déploiement
restent soumis à l'approbation explicite du propriétaire.
