# Comparateur d’indices : complétude au 4 octobre 2026

Le contrôle couvre les 14 familles, soit 35 indices actions distincts, ainsi que les comparaisons or/argent et Bitcoin/Ether.

## Correction

Les photographies qui ne contenaient que le nombre de titres sont enrichies avec des pondérations géographiques et sectorielles sourcées. Les nouvelles photographies MSCI du 30 septembre 2026 sont distinctes des archives d’août : les autres consommateurs conservent leur date de référence explicite. Les photographies FTSE Russell et les compositions d’indices issues des fiches Amundi restent au 31 août 2026.

Le PNG et le tweet utilisent un résumé commun : les trois principales expositions, puis le solde « autres », calculé à 100 %. Le formulaire propose également toutes les pondérations documentées. Les classifications sectorielles des fournisseurs restent distinctes. La date, le comptage, les rendements 2023–2025, leur devise et leur convention de dividendes figurent sur le PNG. Les noms Enhanced Value et Sector Neutral Quality désignent les variantes réellement suivies.

Les sources et les dates individuelles sont enregistrées dans `src/data/index-composition-review.js`. Les rendements restent dans le registre commun existant, avec leurs références exactes. Aucune composition de portefeuille ETF n’est substituée à une composition d’indice.

## Lacune restante

34 indices sur 35 disposent de pays et de secteurs chiffrés. Pour **S&P Euro Dividend Aristocrats**, les pages officielles consultées ne fournissent pas les pondérations exploitables de la variante exacte. Les répartitions du fonds SPYW et celles de l’indice Screened ne sont pas utilisées. Le PNG et le tweet signalent explicitement cette absence ; les rendements annuels de l’indice restent disponibles.

`npm run audit:index-completeness` contrôle les 14 familles et interdit toute nouvelle lacune. Ajouter `-- --strict` fait échouer le contrôle tant que cette dernière composition n’est pas sourcée.

## Validation

Build, audits des fiches d’indices, du catalogue et de cohérence des performances, et contrôle du texte des 14 familles. Les 14 PNG ont également été rendus avec Canvas et leurs boîtes de texte contrôlées : aucun chevauchement ni texte hors image. Les tests Playwright existants vérifient en CI le rendu navigateur, les aperçus mobiles et les téléchargements ; le navigateur Chromium n’était pas disponible dans l’environnement local.
