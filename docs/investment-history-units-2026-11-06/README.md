# Preuves de qualification des historiques

Les fichiers `.json.gz` et `.log.gz` sont des reçus complets, sans estimation des prix. Les notices et réponses primaires sont aussi conservées dans `scripts/fixtures/investment-units-20261106` et les archives de réponses. Les dates des prix, des revues et des builds restent distinctes.

`tweet-midi-exhaustive-before-identity.json.gz` valide les 4 062 113 entrées du corpus avant la dernière restriction d’identité BNKE. `final-scope-subset.json.gz` établit ensuite que les 4 060 462 entrées restantes conservent leurs entrées et sorties : 4 055 360 entrées sans BNKE identiques, 5 102 sorties BNKE comparées individuellement, 1 651 entrées retirées. Ce contrôle supplémentaire ne remplace pas la porte exhaustive GitHub du dernier commit. Les compilations immuables, leurs empreintes et le diagnostic sont archivés séparément.

Reproduire le diagnostic depuis un clone contenant les commits de cette PR :

```sh
mkdir -p /tmp/investment-unit-verifiers
tar -xJf docs/investment-history-units-2026-11-06/frozen-verifiers.tar.xz -C /tmp/investment-unit-verifiers
node docs/investment-history-units-2026-11-06/verify-final-scope-subset.mjs /tmp/investment-unit-verifiers/before-identity.mjs /tmp/investment-unit-verifiers/final.mjs /tmp/investment-unit-subset.json
```

`local-delivery-build-version.json.gz` identifie le build servi par les hashes des registres et de tous ses fichiers. Un build Vite local ne produit pas de `build-info.json`. `public-version-delivery.json` est le dernier reçu public réellement observé ; un `dataSha` absent n’est pas déduit du champ `sha`.

Les résultats navigateur conservent les paramètres, textes, valeurs, empreintes d’aperçus/PNG et erreurs de page. Les captures vidéo finales, probes et empreintes sont archivées ; les scripts Playwright reproduisent les téléchargements des vidéos complètes.
