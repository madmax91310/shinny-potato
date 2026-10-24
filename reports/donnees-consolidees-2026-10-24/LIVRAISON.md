# Livraison consolidée — 24 octobre 2026

Les PR [#920](https://github.com/madmax91310/shinny-potato/pull/920) et [#921](https://github.com/madmax91310/shinny-potato/pull/921) sont fusionnées. Le producteur corrigé collecte, valide, enregistre et publie depuis GitHub : [exécution 40085504061](https://github.com/madmax91310/shinny-potato/actions/runs/40085504061). Son échec de collecte restant est explicite ; validation, enregistrement et publication réussissent.

Le site réellement vérifié sert le code applicatif `6124113127807037b1ab765a177ce87788268471` et les données `2bc3a6d199de2ec1ab260bb73985237e97aec06c`. Le code du producteur exécuté est `2f37f75e19c91813d8df37de63da0b6574cc7801`. Les changements de scripts GitHub ne sont pas présentés comme un nouveau JavaScript de l’application.

- Métadonnées : vrai contrat de champs, ciblage valide obligatoire, absence de faux succès de cache, départ de master actuel sous verrou.
- Supervision : **44 → 30 signaux** ; 13 retraits d’attribution et un ancien contrôle technique rejoué. Les deux incidents source propres aux métadonnées restent visibles.
- Suivi : **983 → 969 enregistrements actifs**, **118 → 117 vérifications en attente** ; 8 600 provenances conservées. Les épisodes trouvés après l’audit initial restent dans les captures suivantes.
- Finance : **79 → 79 cas ouverts**. Recherche primaire Euronext sur 13 cas : neuf bornes de cours recoupées, quatre différences à investiguer. Aucun nouveau calcul admis sur cette seule recherche.
- Validation : 1 002 tests Python du lot, 10 tests du suivi, contrôle complet 40084758449 réussi, reprise réelle GitHub, 50 historiques servis vérifiés pour les 79 cas, quatre PNG publics identiques avant/après et diagnostics publics vérifiés sur mobile/ordinateur.

Le [rapport](RAPPORT.md), le [bilan](bilan.json), le [suivi unique](suivi-consolide.csv), les [19 actions](statut-19-actions.csv), les [79 écarts](reconciliation-79-ecarts.csv) et le [reliquat](restant-a-verifier.csv) sont disponibles séparément. Les pièces manquantes restent détaillées ; tout n’est pas déclaré réparé.
