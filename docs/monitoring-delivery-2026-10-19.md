# Livraison du suivi, publications et métadonnées — 19 octobre 2026

Périmètre autorisé : étapes 1–2–3 du diagnostic des 234 alertes. Le chantier des comptes et modèles de valorisation des entreprises reste distinct.

## Publications anciennes

Le `build-info.json` public consulté le 19 octobre identifie le code complet `ef9632a2a044621c5f7d23de52e832f510a72f51`, construit le 18 octobre à 21:24:11 UTC, sans `dataSha` de secours. Le manifeste public contient 257 empreintes de fichiers.
Pour chaque incident, le SHA réellement extrait du checkout du job de construction est un ancêtre de ce déploiement (API compare : `ahead`). Les anciennes données sont donc incluses ou remplacées par leurs versions ultérieures dans l'instantané publié. Cela ne certifie pas la validité de chaque chiffre. Les six incidents de publication sont résolubles par le rapprochement existant, sans retirer les éventuels incidents de collecte.

| Workflow | Run | Job de construction | SHA vérifié |
|---|---|---|---|
| update-economic-data.yml | 39132915229 | 117692099438 | 5cfaea1a80d965f466e4e127ea66c2d63318dc47 |
| update-scpi.yml | 39132915136 | 117692273437 | 74052f185d48ee57b554861cded9613a6e08cc99 |
| update-insurance.yml | 39132915224 | 117692189158 | ac80e512a11bab4b74eb2ed567c76d480cb7241d |
| update-presentation-actors.yml | 39132915112 | 117692271881 | 58390a6e421a6d686fc771f297c7d77e0547ff62 |
| update-practical-sheets.yml | 39132915132 | 117692068695 | 74052f185d48ee57b554861cded9613a6e08cc99 |
| update-qualified-exposures.yml | 39126273661 | 117682519271 | c399d4c0a30566eee7d334c27a2482d7f6c1b435 |

## Compléments à #801

- Fiches WisdomTree : lecture de la mention explicite `PEA Eligible` et de la place `Euronext(FR)` ; deux contrôles PEA renouvelés depuis les PDF effectivement téléchargés.
- Global X : table immédiatement adjacente au titre de la part exacte. Les fragments HTML différés sont rattachés par leurs identifiants explicites, sans exécuter de JavaScript. Une autre part ou une section ambiguë reste refusée. Les symboles Reuters absents ne sont pas inventés.
- Vanguard : découverte des cotations depuis le tableau officiel, même sans ticker préconfiguré. Le symbole Reuters et la place doivent correspondre. Plusieurs devises sur la même place sont conservées séparément.
- Collectes réelles ciblées : 28 instruments en retard, cinq compléments, trois Global X puis 16 Vanguard. Les dates restent propres à chaque champ effectivement observé.
- Le bilan détaillé expose les URL configurées et distingue une collecte partielle de cotations d'une couverture totalement renouvelée. Une absence de preuve PEA reste inconnue ; une ancienne preuve non renouvelée garde sa date.

## Limites et vérifications

Audit des cotations : 252 ISIN et 854 cotations, zéro erreur de preuve. Les champs sans preuve sont détaillés individuellement dans `public/data/asset-field-coverage.json` (ISIN, champ, date de tentative, sources et diagnostic), régénéré au build. Une limite de parseur ne signifie pas que l'émetteur ne publie pas le champ.

Tests Python de suivi et de métadonnées, cas négatifs de parts mélangées et de symboles incompatibles, diagnostic des champs, audit des cotations et build exécutés. Le téléchargement local de Chromium échoue ; les parcours navigateur GitHub restent requis avant fusion. Ce document décrit les vérifications préparatoires, pas une confirmation anticipée du déploiement final.
