# Présentation ETF — bleu nuit, titane et or

Style retenu par l’utilisateur le 4 octobre 2026 : première maquette stylisée, sans chiffres sculptés ni architecture spectaculaire. 26 illustrations locales, sans texte financier ni logos d’émetteurs. Les 106 affectations restent explicites dans `visualIdentity.js`. Les symboles Bitcoin/Ethereum restent les SVG vérifiés de la collection existante et leur silhouette est conservée.

Les illustrations désignent une exposition, pas un logo officiel ni une carte d’allocation. Contrôle visuel des 26 scènes : globes orientés Amériques / Europe-Afrique-Asie / Europe / Asie ; objets sectoriels cohérents ; lingots vierges distincts pour or et argent. Les données et les dates sont écrites par canvas depuis les registres partagés.

## Production

Mode intégré ImageGen, puis encodage WebP qualité 88. Prompt commun : « Production hero asset for a premium ETF information poster. LANDSCAPE 3:2. Subject below. Object occupying the RIGHT TWO THIRDS, fully visible, left third dark empty for title added in code. Controlled warm gold rim light, navy fill, deep midnight navy #061522 studio background, subtly brushed dark titanium floor and faint reflection. Restrained editorial product art, plausible geometry. No text, digits, official logos, branding, watermark or frame. »

| Fichier | Sujet |
|---|---|
| america.webp | Titanium globe with North and South America facing viewer, gold continent inlays and orbital ring. |
| world.webp | A brushed titanium globe correctly showing Europe, Africa and Asia with gold continent inlays and a thin luminous golden orbital ring, representing global equities. |
| europe.webp | A brushed titanium globe centered on Europe, geographically coherent continent outlines, champagne gold continent inlays and a thin golden orbital ring. |
| asia.webp | A brushed titanium globe centered on Asia, geographically coherent Asia outlines, champagne gold continent inlays and a thin golden orbital ring. |
| bonds.webp | A neat stack of embossed blank bond certificates with an elegant metallic seal, representing fixed income. No printed text, letters or digits. |
| property.webp | A coherent miniature architectural cluster of modern residential and commercial buildings in dark brushed titanium with a few warm golden windows. |
| chip.webp | A single sophisticated large microprocessor with a dark titanium housing, intricate gold electrical traces and circuitry, representing semiconductors and technology. |
| health.webp | A scientifically recognizable elegant double helix sculpture, two interwoven titanium strands with golden rungs, representing health and biotechnology. |
| energy.webp | An oil pumpjack and single oil barrel rendered as miniature brushed titanium sculptures with subtle gold accents, traditional energy. |
| defense.webp | A single realistic sleek aircraft without any insignia, militaristic symbols or weapon effects, titanium with subtle gold trim, representing the aerospace defense industry. |
| security.webp | A solid titanium protective shield with a simple central padlock engraved in gold, cybersecurity. |
| water.webp | A large single sculpted water drop in brushed titanium with a gold rim, clean industrial water theme. |
| luxury.webp | An elegant unbranded analog wristwatch, brushed titanium bracelet and champagne gold accents, no letters or digits on dial, luxury goods. |
| finance.webp | A classical bank building with columns, no writing, miniature titanium sculpture with warm gold accent edges. |
| robotics.webp | A mechanically coherent articulated industrial robotic arm, brushed titanium with gold joints. |
| nuclear.webp | A realistic miniature nuclear power station with two cooling towers and controlled gentle white vapor, titanium and subtle gold trim, no atomic hazard logo. |
| batteries.webp | Two industrial electric vehicle battery cells, one coherent cutaway showing copper and graphite layers, dark titanium housing and gold-copper details. |
| space.webp | A realistic miniature communications satellite, central titanium body and two rectangular solar panels with gold grid details. |
| commodities.webp | A curated still life of unmarked gold ingots, wheat ears and oil barrel, representing a diversified commodities basket. |
| renewables.webp | A miniature wind turbine with three coherent blades and a modest solar panel, brushed titanium and subtle gold edges, renewable energy. |
| infrastructure.webp | A miniature suspension bridge with coherent cables and an electrical transmission pylon, brushed titanium sculpture and fine gold accents. |
| utilities.webp | A hydroelectric dam and coherent electrical transmission pylons, titanium and fine gold trim, utilities. |
| resources.webp | A mineral rock, coiled steel sheet and unmarked metal ingots, titanium with champagne gold rim lighting, basic resources. |
| consumer.webp | A minimal shopping basket with generic unbranded essential groceries, milk bottle, wheat and soap packaging without text, titanium and gold. |
| gold.webp | Two realistic rectangular physical gold bullion bars, completely blank without inscriptions, rich warm metallic gold. |
| silver.webp | Two realistic rectangular physical silver bullion bars, completely blank without inscriptions, bright brushed silver. |

## Validation

`node scripts/test-etf-art.mjs` vérifie les 106 rendus, les faits complets, les identifiants côte à côte, l’absence de coupures et chevauchements, les performances exactes et leurs couleurs, ainsi que le téléchargement et sa reprise après échec. Un PNG par thème et le S&P 500 choisi comme référence sont conservés dans les artefacts CI.

- `gaming.webp` : illustration originale de manette, créée pour les entreprises du jeu vidéo et de l’eSport le 05/10/2026 ; aucun logo émetteur, aucune pondération représentée.
