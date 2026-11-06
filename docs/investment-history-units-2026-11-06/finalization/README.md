# Reçus de la livraison reprise

Les reçus locaux identifient le code applicatif `2697a89`, la base master `ea4f6d0` et les empreintes des fichiers réellement construits. Les commits suivants de livraison ajoutent les preuves, le rapport et une capture du formulaire, sans modifier les calculs ou les sources. Le statut GitHub du commit de livraison est recensé séparément dans la description de la PR #1181.

- `final-exhaustive.json` : quatre partitions complètes, 4 060 462 entrées, aucun échec ni omission. La date et les données sont figées dans `final-verifier.mjs.xz`.
- `final-verifier-identity.json` : compilation identique après la réconciliation et le dernier changement d’interface ; les empreintes d’entrées sont séparées.
- `final-browser-results.json` et `browser/*/results.json.gz` : 64 cas, deux largeurs, texte effectivement copié, PNG téléchargés et six vidéos enregistrées. Les films complets sont conservés dans les artifacts navigateur CI ; leurs empreintes et dernières images locales sont ici.
- `final-next-*` : collecte réelle en lecture seule, 2/2 sources validées ; elle ne vaut pas une CI complète.
- `final-detection.json.gz` : 93 alertes automatiques, sans présumer 93 erreurs financières.
- `resume-old-head-complete.json` et `previous-ci-external-failures.txt` : contrôles historiques de 39152c1, distincts de la livraison finale.

Les logs compressés conservent leurs octets originaux, y compris les espaces et codes de terminal. `SHA256SUMS.json` couvre tous les fichiers de ce dossier hors lui-même.
