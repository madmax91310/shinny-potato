# Images individuelles du DCA — 16 novembre 2026

La validation utilisateur conserve le fond bleu nuit, les noms autour avec de petits tirets et les pourcentages dans le donut. La légende dessous a été refusée. Les noms passent de 46 px ordinaires à 56 px semi-gras, avec une palette soutenue moins fluo. Le centre reste vide. Les vues individuelles allocation, pays et secteurs utilisent le même rendu ; les vues complètes, doubles et le panneau des entreprises ne changent pas.

Les noms restent complets après les abréviations ETF existantes ; retour à la ligne en fonction de la largeur mesurée dans la police réellement dessinée. Les angles utilisent toujours les poids exacts. Les pourcentages d’allocation gardent leurs décimales ; ceux des expositions gardent la méthode d’arrondi existante et leur périmètre. Les catégories de couverture inconnue et les autres expositions conservent leurs couleurs neutres. Le style est limité aux images individuelles : aucun changement des textes, données, sauvegardes ou calculs.

Les petits pourcentages restent dans l’anneau. Les boîtes réellement orientées servent au contrôle de collision ; une valeur déplacée pour éviter une autre valeur reçoit un petit rappel interne vers sa part. Les tirets extérieurs suivent le placement des noms. En présence de nombreuses lignes ou de noms très longs, le canevas s’agrandit au lieu de supprimer une position ou de rétablir une légende. Sa résolution reste bornée à 16 000 px par côté et 32 mégapixels. Une image extrêmement dense reste moins lisible sur téléphone : ce budget technique n’est pas une garantie de lisibilité de cinquante longs libellés dans un fil X.

## Validation locale

- `npm run test:dca` et `node scripts/test-dca-image-series.mjs` réussis.
- `npm run lint` : aucune erreur, avertissements existants.
- Deux compilations complètes réussies, dont la dernière après les ajustements géométriques ; budgets de routes inchangés, couverture publiée et manifeste validés.
- Chromium réel : `scripts/playwright-dca-individual-style.mjs`, 150 profils × 3 images + 8 cas limites = 458 rendus. Contrôles de conservation des entrées, valeurs et nombres de pourcentages, absence de coupe et de chevauchement de textes, pourcentages internes et budget de canevas. Cas 1, 2, 9, 18, 50 lignes, 99,99/0,01, 50 poids déséquilibrés et 50 libellés longs. Test inscrit dans le portail navigateur existant.
- `scripts/playwright-dca-export-choices.mjs` : téléchargements des quatre choix, allocation de quinze et cinquante lignes, textes longs, absence de chevauchement des noms, aperçus à 1440/390 px.
- `scripts/playwright-dca-image-series.mjs` : portefeuille mixte, ancien brouillon, restauration, deux parcours et téléchargements individuels pays/secteurs sur mobile.
- Inspection visuelle effective des PNG : allocation de référence à 18 lignes, allocation à 15 lignes, pays et secteurs. La référence à 18 lignes est une fixture de recette, pas une modification du portefeuille de la pièce jointe.

Preuves : [allocation 18 lignes](../reports/dca-individual-style-2026-11-16/allocation-18.png), [pays](../reports/dca-individual-style-2026-11-16/countries.png), [secteurs](../reports/dca-individual-style-2026-11-16/sectors.png).

La CI, la fusion, le workflow Pages et la recette publique doivent être contrôlés avant d’annoncer la publication. Aucune publication sur X.

Le rapport détaillé avec identifiants de profils est exclu de la livraison et des artefacts de test ; seuls les compteurs agrégés et les exemples sans identité personnelle sont exportés.
