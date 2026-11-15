# Chantier 4 — textes Budget

Audit des 77 profils disponibles depuis master 956c895, après intégration du chantier images #1306 et des sept profils #1308. Master fe0d2bd intégré ensuite sans conflit ; ses modifications concernent les données financières communes. Les PR concurrentes #1315, #1317, #1318, #1320, #1321 et #1322 ont été examinées. Les changements de rendu proposés dans #1318 restent distincts de ce chantier.

La matrice Markdown détaille chaque périmètre ; la matrice JSON conserve les montants en centimes, pourcentages, empreintes des lignes financières, des sources et du texte relu. Les 76 autres profils gardent leurs montants ; Marc reçoit une correction de classification.

## Corrections et exemples

- Marc : « Épargne et investissements : 16 167 CHF », reste zéro → aucun versement établi, « Reste disponible : 16 167 CHF ». La photographie interne précise déjà que le solde annuel n’est pas une preuve de versements. Revenus 22 500 CHF, dépenses 6 333 CHF et patrimoine conservés. La rémunération variable est une moyenne après impôt ; les dépenses ponctuelles restent mensualisées.
- Mathieu : « Salaire » → « Salaire net avant impôt ». Camille : « Salaire » → « Salaire net après impôt ». Seules les qualifications présentes dans les données sont restaurées ; « net » seul ne reçoit aucune qualification fiscale supplémentaire.
- Morgane : « Épargne et projets » → « Investissements », cohérent avec le versement PEA. Cinq autres titres distinguent épargne et investissements.
- Hadrien : deux questions portant sur le même arbitrage → une seule question sur les ETF et la réserve destinée au passage à quatre jours. La question retirée reste dans l’historique interne.
- Les accroches existantes précèdent désormais les tableaux, une seule fois. Les paragraphes réussis et questions propres aux situations sont conservés.

Guillaume : PEL 45 €/mois = 540 €/an, PEA 350 €, versements 395 €, reste avant versements 424 €, après 29 €. Émilie : 7 000 € de livret = 5 000 € de sécurité + 2 000 € d’apport ; 2 000 + 500 × 36 = 20 000 €. Noémie : carburant déjà inclus dans les 260 € auto, dépenses 2 600 €, versements 1 317 €, reste 483 €. Cédric : dépenses après départ 1 840 € ; avec 2 000 € de revenus, 160 € avant versements et déficit 840 € si les 1 000 € sont maintenus.

## Recette

- Suite Budget et build complet réussis, manifeste des 47 fichiers publics concordant ; lint sans erreur, avertissements existants.
- Canvas Chromium : 77 profils, 137 PNG X, tous 1 080 × 1 350 ; 25 profils sur une page, 44 sur deux, 8 sur trois. Découpage identique au point de départ. Conservation de chaque ligne, montant unique, bornes et absence de chevauchement vérifiées ; relecture visuelle des 137 exports sur douze planches, avec agrandissement de contrôle.
- 154 PNG des modes détaillé/synthétique : tous les libellés attendus et totaux présents, largeur 1 200, bornes et absence des formulations supprimées contrôlées.
- Recette dédiée : 77 textes sur ordinateur 1 440 px et sur mobile 390 px, soit 154 copies réelles du presse-papiers, strictement identiques au texte affiché et attendu, retours à la ligne et questions compris.
- Brouillon Marc personnalisé : migrations historique, v2 et v4, rechargement, copie exacte et alerte de chiffres modifiés ; rétablissement volontaire vers les chiffres corrigés. Aucun écrasement silencieux.
- Cas dense : 72 lignes en CHF, 11 pages 4:5, téléchargement de la dernière page, conservation du texte personnalisé et absence de perte de montant.

Commandes reproductibles : `npm run test:budget`, `npm run lint`, `npm run build`, `CHROMIUM_PATH=/usr/bin/chromium node scripts/playwright-budget-social-image.mjs`, `CHROMIUM_PATH=/usr/bin/chromium node scripts/playwright-budget-chantier4.mjs`. La dernière recette accepte `BUDGET_PUBLIC_BASE` pour contrôler le site déployé.

## Limites

La concordance est vérifiée avec les photographies et revues internes existantes ; aucune nouvelle consultation des auteurs n’est revendiquée. Les précisions fiscales absentes, futurs revenus, frais de projets et aides inconnues restent inconnus. Les déficits ne sont pas effacés. La provenance interne est conservée ; aucune affirmation de témoignage réel vérifié, source ou disclaimer ajouté aux PNG. Aucune publication sur X.

La fusion, le workflow Pages, le commit servi dans build-info.json et la recette publique doivent être consignés dans le bilan de livraison après leur exécution effective.
