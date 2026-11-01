Recettes du chantier consolidé, à lancer depuis la racine du dépôt avec npm et Playwright installés.

- `TEST_BASE_URL=https://madmax91310.github.io/shinny-potato PROOF_DIR=test-artifacts/stoxx-public node reports/donnees-consolidees-2026-10-24/livraison-2026-10-29/preuves/reprise-2026-11-01/verification/verify-stoxx.mjs`
- `CAPTURE_OUTPUT_DIR=test-artifacts/public-final node reports/donnees-consolidees-2026-10-24/livraison-2026-10-29/preuves/reprise-2026-11-01/verification/capture-public.mjs`

La première recette sélectionne réellement le STOXX, ouvre ses preuves, vérifie la photographie et télécharge trois PNG. Sans TEST_BASE_URL elle utilise le build local courant, qui doit être reconstruit sur le commit à tester.

La seconde conserve les réponses publiques effectivement consommées et les exports de la boîte de diagnostics. Elle ne substitue aucune donnée : les octets capturés sont servis à l’identique, avec contrôle des ETags et du build avant/après. Elle décode le moniteur avec le lecteur de l’application. Une variation de version pendant la capture fait échouer la preuve ; reprendre dans un autre dossier, sans écraser les photographies initiales.
