# Anniversary export artwork

The anniversary tool now uses the first-party files listed in
[`official-logos/sources.json`](official-logos/sources.json). Each entry records the
company page, exact download URL, retrieval date, SHA-256 hashes and any SVG wrapper adjustment.
116 distinct eligible assets now have a verified official logo; the registry check
requires at least 100 distinct files and detects an unrecorded asset change.
The official ASML vector already in this repository is reused. Legacy Simple Icons
silhouettes and generated Apple artwork are no longer used by this tool.

`src/pages/tweet-midi/anniversaryArt.js` explicitly maps verified logos before
applying the existing same-share visual aliases. An issuer logo must never stand
in for an index or fund. A missing verified logo, network/file error or invalid SVG
uses the asset's plain name. The complete current coverage is in
[`../../reports/anniversary-logos/coverage.csv`](../../reports/anniversary-logos/coverage.csv).
The absence of a verified file here does not mean that the company has no logo.

The renderer preserves source colours, transparency and proportions. It centres
logos in a 1160 × 620 maximum area around (800, 605), with raster caps where needed.
No metallic surface, extrusion, shadow, reflection, arbitrary recolouring, source
crop or added rectangular background is applied to a logo. The native white LVMH
SVG was rejected for lack of contrast; the official dark transparent PNG is used.
Inline corporate vectors are copied from the official page with their original
paths, fills and gradients in standalone SVG wrappers. Excess empty SVG canvas
is fitted around the complete geometry with padding; no path is cut or redrawn. Marks remain the property of their respective owners.

Both the preview and downloaded PNG use `renderAnniversaryImage`. It waits for all
local images and the font before drawing. Failed logo cache entries are cleared so
a later export can retry; background/font failures still use the existing error UI.
No remote brand service is contacted at runtime. The full provenance manifest is
kept separate from the compact runtime registry to preserve the route bundle budget.
After adding a verified asset, run `node scripts/sync-anniversary-logo-registry.mjs`;
CI checks its hashes and the generated registry with `--check`. `import.meta.env.BASE_URL` retains
the `/shinny-potato/` GitHub Pages prefix. Financial data, currency, units, source
credits, dates and calculations are unchanged.

`node scripts/test-anniversary-art.mjs` checks every eligible asset and mixed
comparisons, ratios, labels, units, local requests, fallback and recovery.
After building, `node scripts/test-anniversary-logos.mjs` checks the production
Pages bundle in Chromium desktop and iPhone 13 emulation: actual downloads from
both buttons, pixel equality with the preview, every integrated logo's aspect
ratio/margins/centring, selection changes, a late obsolete render, delayed loading,
missing/corrupt SVGs and recovery. Results and PNGs go to `test-artifacts/`.

## Production backgrounds

`titanium.webp`, `gold.webp`, `silver.webp` remain the existing production
backgrounds at 1200 × 1500. Titanium is a blank studio, with no brand or numbers;
gold/silver illustrate the respective commodities. The tool no longer uses
`approved/anniversary-apple.webp`, whose mark was baked into generated artwork.
The font is Bodoni Moda; see `OFL.txt` for its SIL Open Font License.
Source: https://github.com/google/fonts/tree/main/ofl/bodonimoda.

## Présentations SCPI et assurance-vie

`mineral-scpi.webp` et `mineral-insurance.webp` : illustrations décoratives générées pour le style minéral clair choisi le 8 octobre 2026. Elles ne contiennent aucune donnée produit ; tous les noms, chiffres et conditions sont composés par `src/pages/presentation-shared/imageExport.js`. Le WebP conserve la transparence du PNG source.

## Comparatifs papier ETF et indices

`comparison-paper-card.webp` : fond papier ivoire vierge, généré à partir de la
direction validée le 18 octobre 2026 (coin replié vert, aucun paysage).
Il ne contient aucun texte, chiffre, drapeau ou pictogramme. Le moteur commun
`src/design-system/comparisonPaper.js` compose les informations des registres
à chaque export. Les adaptateurs préservent les parts, les statuts PEA inconnus,
le périmètre fonds/indice et la date de chaque composition. Les répartitions
sont arrondies à une décimale pour la lecture ; les registres restent inchangés.
Les performances et explications détaillées restent dans le texte de publication.
`node scripts/test-index-ceramic.mjs` vérifie les deux exports en navigateur.

## Ancienne carte World / ACWI

`comparison-world-map.svg` : silhouette géographique issue des terres Natural Earth
à l’échelle 1:110 millions (domaine public), récupérée le 10 octobre 2026 :
https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson
L’Antarctique est omis. La carte est décorative ; elle ne représente ni les poids
ni les pays effectivement détenus par les fonds. Les chiffres restent calculés
à partir des données du comparatif, sans texte incorporé dans l’image.

## Coulisses des indices — relief pastel

Les deux exports d’indices réutilisent les logos officiels ci-dessus et les ajouts
répertoriés dans [`index-logos/sources.json`](index-logos/sources.json). Le raccordement
partagé utilise les ISIN pour le Top 10 et des alias explicitement revus par indice
pour les lignes historiques. Aucun rapprochement flou ni ticker ambigu. Les supports
seuls portent l’ombre ; les marques conservent leurs couleurs et proportions. Les
logos blancs ont un insert bleu ; les erreurs et délais de chargement produisent
des initiales et restent réessayables. Le moteur attend les ressources avant de
rendre l’aperçu ou le PNG. Le [bilan daté](../../reports/index-relief/README.md)
distingue 48 logos existants, 22 ajouts et 133 entreprises encore en initiales, avec
les aperçus réels, les ISIN et les preuves.
