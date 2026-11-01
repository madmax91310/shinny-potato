Recettes du chantier consolidé, à lancer depuis la racine du dépôt avec npm et Playwright installés.

- `TEST_BASE_URL=https://madmax91310.github.io/shinny-potato PROOF_DIR=test-artifacts/stoxx-public node reports/donnees-consolidees-2026-10-24/livraison-2026-10-29/preuves/reprise-2026-11-01/verification/verify-stoxx.mjs`
- `CAPTURE_OUTPUT_DIR=test-artifacts/public-final node reports/donnees-consolidees-2026-10-24/livraison-2026-10-29/preuves/reprise-2026-11-01/verification/capture-public.mjs`

La première recette sélectionne réellement le STOXX, ouvre ses preuves, vérifie la photographie et télécharge trois PNG. Sans TEST_BASE_URL elle utilise le build local courant, qui doit être reconstruit sur le commit à tester.

La seconde conserve les réponses publiques effectivement consommées et les exports de la boîte de diagnostics. Elle ne substitue aucune donnée : les octets capturés sont servis à l’identique, avec contrôle des ETags et du build avant/après. Elle décode le moniteur avec le lecteur de l’application. Une variation de version pendant la capture fait échouer la preuve ; reprendre dans un autre dossier, sans écraser les photographies initiales.

- `HISTORY_SCOPE=nonbond PROOF_DIR=test-artifacts/public-histories node reports/donnees-consolidees-2026-10-24/livraison-2026-10-29/preuves/reprise-2026-11-01/verification/verify-public-histories.mjs`

La recette des historiques lit les blobs Git effectivement déclarés dans le manifeste public, calcule indépendamment les montants, puis exerce les vrais sélecteurs, textes et téléchargements. Aucun historique n’est injecté dans la page. `HISTORY_SCOPE=all` exige aussi PayPal octobre effectivement publié ; ne pas utiliser un succès local pour le déclarer en ligne. `SCREEN_WIDTH=390 HISTORY_ONLY_IDS=adobe` exerce le mobile. Les tableaux masqués sur mobile sont contrôlés dans le DOM attaché, les rendus et téléchargements visibles restent exercés.

`update-consolidated.py` préserve toutes les identités historiques et rapproche les79comparaisons parISIN/année (leur ancien id n’est pas unique). `update-usage-evidence.py` ajoute les seules preuves bornées, quatre archives budgétaires non vivantes et le périmètre courant26routes ; les deux outils retirés par#1116 restent des traces historiques. Ces scripts de rapport ne modifient aucune donnée de l’application.

- `PROOF_DIR=test-artifacts/public-exposure-recovery node reports/donnees-consolidees-2026-10-24/livraison-2026-10-29/preuves/reprise-2026-11-01/verification/verify-public-exposure-recovery.mjs`

Cette recette lit les catalogues et positions référencés par le manifeste effectivement publié. Trois parts exactes, sommes indépendantes des top5/top10, couverture originale et rapprochement comptable, puis sélection/analyses et sixPNG publics ordinateur/mobile ; pas de substitution de données dans la page, pas de certification de toutes les positions fournisseur ni de recouvrement pair à pair.
