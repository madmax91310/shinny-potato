# Positions sans plafond — adaptation de #1298

Base vérifiée : `348ef87c809d8890b6ad383423514c7e9711717b`. Ancienne branche :
`e1c4eb5ce4dcb76f378f4a2e96b235442d94802e`. Cette adaptation conserve les évolutions
de master, notamment le rendu individuel de #1366 et les sauvegardes incomplètes.

## Comportement

- Aucun plafond produit de positions dans les deux parcours, les actions d’allocation,
  les brouillons et les sauvegardes. Les limites explicitement fournies aux validateurs
  restent respectées. Le nom historique `MAX_POSITIONS` suit la capacité partagée.
- Identités, poids et versements existants conservés. La répartition égale augmente
  sa précision pour ne pas créer de poids nuls au-delà de 10 000 lignes. La saisie
  des poids accepte aussi les décimales plus fines que 0,01 %.
- Les textes dépassant 20 000 caractères sont conservés. Les profils incomplets,
  champs vides, archives de récupération et protections contre les conflits restent
  pris en charge. Les 50 sauvegardes nommées et le fichier JSON de 1 Mo sont des
  limites distinctes et conservées ; un dépassement est signalé sans troncature.
- Le rendu individuel garde la palette, les noms semi-gras de 56 px logiques,
  les tirets et les pourcentages internes de #1366. Un index spatial réduit les
  candidats au test exact de collision, sans changer les décisions de placement.
- Le budget de 16 000 px par côté et 32 mégapixels s’applique aussi aux vues
  complètes et aux listes de versements. La géométrie logique garde toutes ses
  lignes ; seule la résolution change. L’extraction du panneau entreprises tient
  compte de l’échelle. Le hook encode et libère chaque canevas avant le suivant.
- La capacité sans borne est rétablie après sérialisation JSON (`Infinity` devient
  `null` dans la clé de rendu). Les exports obsolètes restent non téléchargeables.

## Validation locale

Environnement : Node 24 ; Chromium Headless Shell 153 pour les parcours navigateur.
Le Chromium système ne démarrait pas dans cet environnement ; la solution de repli
est installée hors du dépôt, sans modification des dépendances applicatives.

- `npm run test:dca` : suite existante et nouveau contrat 51/200/1 000/20 001.
  Sauvegardes complètes et incomplètes, textes longs, identités, poids, versements,
  valeurs vides, erreurs de quota, limite JSON et requêtes spatiales vérifiés.
- `npm run lint` : aucune erreur ; avertissements historiques conservés.
- `npm run build` : compilation complète, budgets de routes, couverture publiée et
  manifeste public validés.
- `scripts/playwright-dca-individual-style.mjs` : 458 rendus, 150 profils et huit
  cas limites, avec les contrôles de coupe, chevauchement, valeurs et budgets.
- `scripts/playwright-unlimited-rendering.mjs` : 24 PNG réellement encodés et
  rouverts par `createImageBitmap`, six vues à chacun des quatre volumes. Toutes
  les positions sont dessinées dans l’allocation, la vue complète et les versements.
  Le panneau entreprises et les périmètres pays/secteurs restent exportables.
- Avec `DCA_STYLE_BASELINE` pointant sur `image-individual.js` de la base ci-dessus :
  dix comparaisons de PNG strictement identiques, pour 1/2/9/18/50 positions,
  distributions égales et très déséquilibrées. L’optimisation du parcours du donut
  conserve aussi l’ordre des lignes.
- `scripts/playwright-unlimited-positions.mjs` : 1440/390/320 px, ajout de la 201e
  ligne, sauvegarde/restauration du texte long et d’un champ de versement vide,
  deux parcours, absence de débordement horizontal. À 320 px, aperçu à 1 000 lignes,
  téléchargement réel du PNG allocation puis réouverture du fichier téléchargé.
- `scripts/playwright-dca-image-series.mjs`, `scripts/playwright-dca-eight.mjs` et
  `scripts/playwright-subscriber-profiles.mjs` : exports, saisie/ordre/focus,
  sauvegardes historiques, imports, identités et parcours mobiles conservés.

Mesures et dimensions : [rapport de rendu](../reports/unlimited-positions-2026-11-17/rendering.json).
Les durées de ce rapport dépendent du poste de test et ne constituent pas un délai garanti.

## Limites pratiques

Les données à 20 001 positions et leur rendu sont testés ; le parcours d’édition
mobile complet est exercé jusqu’à 1 000 positions, pas à 20 001. Le plafond produit
est supprimé, sans promesse de mémoire ou de stockage sans borne.

Un PNG unique contenant des milliers de positions reste très peu lisible. Par
exemple, la vue complète à 20 001 lignes mesure 15 × 16 000 px après réduction.
La présence des libellés dans le rendu ne garantit pas leur lisibilité dans un fil X.
Aucune position n’est regroupée ou supprimée pour masquer cette limite.

La CI distante reste à contrôler sur la branche adaptée. Ce rapport ne vaut ni
autorisation de fusion, ni validation d’une publication Pages.
