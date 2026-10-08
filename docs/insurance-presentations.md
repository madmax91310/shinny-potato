# Présentations d’assurance-vie

Route `/presentation-assurance-vie` : Linxea Spirit 2 (Spirica), Linxea Avenir 2 (Suravenir), Linxea Zen (Apicil), Linxea Vie (Generali), Lucya Cardif (Cardif Assurance Vie) et Placement-direct Vie (SwissLife Assurance et Patrimoine). Sélection d’un contrat, texte long modifiable, copie et rétablissement ; consultation des rendements et conditions des fonds euros dans les réglages. Les mêmes observations alimentent la bibliothèque de données.

## Visuel minéral clair

Les onglets Texte et Image partagent les mêmes observations. Le visuel utilise une illustration décorative, des teintes ivoire et sauge et des titres sérif ; les chiffres, dates et conditions sont dessinés par le code. « Télécharger l’image » exporte exactement cet aperçu en PNG, à 1 600 pixels de large, avec une hauteur adaptée au contenu. Le texte retouché reste conservé au changement d’onglet ; les retouches du texte ne modifient pas les faits du visuel.

Les dates propres aux indicateurs, les conditions et fourchettes des fonds euros, les frais HT et maxima contractuels restent explicites. Les sources et la date du relevé figurent au pied du visuel. Un chargement d’illustration en échec interrompt l’export et permet de réessayer.

## Données et sources

`src/data/automated-insurance.json` : pages officielles des distributeurs et des fonds, notices contractuelles et fiches synthétiques des frais. Collecte des frais de versement, arbitrage en ligne, gestion des unités de compte et transactions ETF ; minimums des versements initial, libre et programmé ; nombre et catégories de supports annoncés ; rendements annuels publiés, garantie nette de gestion, plafond de versement et conditions d’accès aux fonds euros.

Les rendements annuels sont nets de gestion, avant prélèvements sociaux et fiscaux ; les bonus commerciaux sont exclus. Trois années sont affichées si disponibles, seulement l’historique réellement publié pour Euro Objectif Climat et les fonds de Linxea Zen. Une fourchette conditionnelle publiée reste une fourchette, notamment Netissima en 2023 ; elle ne devient pas un taux unique. La garantie annuelle ne vaut pas une garantie de 100 % du capital. Les frais des supports s’ajoutent à ceux du contrat ; les frais des fonds euros ne doivent pas être retranchés une seconde fois du rendement net publié.

La date de vérification des pages n’est pas présentée comme une date d’effet des tarifs. Gestion libre uniquement ; les mandats, options et conditions spécifiques de supports ne sont pas couverts intégralement.

## Conditions propres aux nouveaux contrats

- Zen : pénalité de 2 % sur les arbitrages d’Euroflex vers Euro Garanti ; retrait total et participation annuelle explicités. Le complément de rendement 2025 appliqué à tous les clients est distingué des bonus commerciaux conditionnels.
- Vie : accès à Netissima sans quota d’unités de compte qualifié jusqu’au 31 décembre 2026 ; au-delà, le parseur exige une nouvelle condition officielle. La garantie nette de Netissima est confirmée par la page du contrat. Celle d’Eurossima reste non renseignée faute de valeur nette explicite dans les sources collectées.
- Eurossima : le plafond annuel est fixé par l’assureur dans une plage de 0 à 50 000 € la première année, puis de 0 à 25 000 € ; ce n’est pas un plafond universel de versement du contrat.

- Lucya Cardif : Fonds général et Euro Private Strategies sont distincts, notamment leurs frais et garanties nettes. L’allocation Euro Private Strategies exige au moins deux euros d’unités de compte pour un euro sur le fonds. La quote-part maximale actuelle du Fonds général reste non renseignée ; la clause conditionnelle liée au TME est affichée, sans supposer la valeur actuelle de cet indice. Adhésion UFEP et conditions particulières des supports immobiliers sont visibles.
- Placement-direct Vie : un seul fonds euros qualifié, Actif général SwissLife. Chaque année conserve les six taux du barème officiel (deux encours × trois parts d’UC), avec la fourchette et les conditions affichées. Le maximum commercial n’est pas converti en rendement universel. La garantie annuelle minimale hors option plancher décès est calculée à 99,4 % depuis la clause de garantie minorée des frais et les frais annuels de 0,60 %, contrôlés entre notice et fiche tarifaire. Cette proportion diminue chaque année avec les frais ; le coût éventuel de la garantie décès est distinct. La quote-part maximale reste non renseignée faute de valeur explicite. La notice alimente aussi les majorations d’allocation déléguée (+0,40 %/an) et d’allocation opportunités 100 % Trackers (+0,70 %/an), uniquement sur les UC concernées. Les frais particuliers des actions sont affichés.
- Le lecteur Nuxt accepte uniquement les littéraux et alias sérialisés, sans exécuter le JavaScript du distributeur. Toute modification du catalogue des fonds ou incohérence du barème exige une nouvelle qualification.

## Actualisation

`.github/workflows/update-insurance.yml` : tous les jours à 07:25 UTC, déclenchement manuel et contrôles sur les pull requests. Collecte publique sans clé personnelle, validations, construction et déploiement. Une source inaccessible, un tarif ambigu, un historique incomplet ou des conditions incohérentes conservent toute la dernière fiche validée du contrat concerné ; les autres contrats peuvent être actualisés. Le rapport d’observation détaille l’échec, qui est également suivi dans « Données à revoir ».

```sh
python -m unittest discover -s scripts -p test_insurance.py
python -m unittest discover -s scripts -p test_presentation_expansion.py
python scripts/collect_insurance.py --apply --output insurance-observation.json
node scripts/test-insurance.mjs
npm run audit:data-catalog
npm run build
node scripts/test-insurance-ui.mjs
node scripts/test-presentation-images.mjs
```

Les sources supplémentaires doivent être qualifiées avant d’étendre les produits. Aucun envoi automatique sur X.

## Transition annuelle et échéances

Les taux restent attachés aux années effectivement publiées. Du 1er janvier au 30 juin, les taux N−2 sont acceptés si N−1 n’est pas publié ; un état explicite « en attente de publication » apparaît dans le texte, les réglages et le PNG. Les historiques glissent dès la publication suivante. Au 1er juillet, un exercice manquant devient un échec avec conservation de la dernière fiche. Les fourchettes, leurs conditions et les six taux SwissLife restent attachés à leur propre millésime.

La date de rendement doit correspondre à la dernière ligne annuelle ; les années doivent être consécutives, et toute régression du millésime ou source invalidée échoue. Cette tolérance de calendrier ne dispense pas de redécouvrir et relire les sources. Elle ne prolonge aucune offre commerciale : l’accès Netissima expiré déclenche toujours un échec tant qu’une nouvelle condition officielle n’est pas qualifiée, et les consommateurs masquent le quota et les opérations échus même si la dernière fiche est conservée.

Tests : `python -m unittest discover -s scripts -p test_publication_periods.py` et les tests des textes/PNG.

### Correction de la composition minérale

L’export est une carte carrée de 1600 × 1600 pixels : grand titre, illustration dominante et trois panneaux de chiffres essentiels, conformément à la proposition 1. Le texte conserve le détail des conditions et des sources. Les taux de distribution restent identifiés comme bruts de fiscalité étrangère ; les fonds euros gardent leurs fourchettes et conditions lorsqu’elles s’appliquent.
