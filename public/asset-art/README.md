# Titanium anniversary export artwork

Reviewed on 2026-10-03. Only the 12 existing eligible anniversary assets are enabled.
The historical database, exclusions and manual current inputs are unchanged.

## Identity review

| Asset | Visual | Reference checked |
| --- | --- | --- |
| Apple | Bitten apple with detached leaf, vector silhouette | https://www.apple.com/ |
| Microsoft | Four equally sized squares, corporate mark rather than a Windows perspective logo | https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks |
| Tesla | T-shaped symbol, not a lightning bolt | https://www.tesla.com/tesla-gallery |
| Broadcom | Round pulse symbol | https://docs.broadcom.com/docs/1232742686 |
| ASML | Full official ASML vector wordmark downloaded from the corporate site | https://www.asml.com/images/icons/asml-logo.svg |
| Bitcoin | Tilted double-stroked B in a circle | https://github.com/bitpay/bitcoin-brand |
| Ethereum | Diamond split into upper and lower parts | https://ethereum.org/assets/ |
| Nasdaq-100 | Custom technology illustration, **not** an official Nasdaq logo | https://www.nasdaq.com/ (Nasdaq-100 description) |
| SOXX | Generic semiconductor, **not** an iShares logo or an individual company logo | https://www.ishares.com/us/products/239705/ishares-phlx-semiconductor-etf |
| Berkshire Hathaway B | Custom holding illustration, **not** a logo of Berkshire Hathaway HomeServices | https://www.berkshirehathaway.com/ |
| Gold | Gold bullion with elemental symbol Au; no mint, weight or fineness claims | Existing gold series in `src/data/market-history.js`: ounce, monthly average |
| Silver | Silver bullion with elemental symbol Ag; not a gold bar | Existing silver series: COMEX futures, ounce (not direct ownership of the depicted metal) |

Apple, Tesla, Broadcom, Bitcoin and Ethereum silhouette SVGs are from Simple Icons
(`https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/<name>.svg`,
downloaded 2026-10-03) and cross-checked against the references above.
Simple Icons vector source: https://github.com/simple-icons/simple-icons (CC0).
Microsoft geometry is four flat squares. ASML's symbol wrapper was removed without
changing its paths. The metallic renderer leaves all source silhouette contours intact;
only fill, extrusion and reflections are added. Custom illustrations are deliberately
classified separately in `anniversaryArt.js`.

## Production assets

`titanium.webp`, `gold.webp`, `silver.webp` are generated production artwork with
no baked-in prices, dates, performance figures or signature. The original prompts:

* Titanium: portrait 4:5, warm pearl brushed titanium studio, upper wall and reflective
  plinth; quiet light lower half for black text, no subject or lettering.
* Gold: same studio; realistic gold ingot in upper half, engraved Au only, no weights
  or fineness; lower half empty for live text.
* Silver: same studio; silver ingot engraved Ag only, no other marks; lower half empty.

They were generated with the built-in image-generation tool and converted to WebP
at 1200×1500. All files are local, no third-party image server or API is used at export.
The font is Bodoni Moda (Latin subset, static weight 500 / optical size 24 for legible hairlines); see `OFL.txt` for its SIL Open Font License.
Source: https://github.com/google/fonts/tree/main/ofl/bodonimoda.

`renderAnniversaryImage` waits for images and fonts before drawing. Failed loads
reject instead of silently substituting a wrong visual; rejected cache entries are
cleared so retry can succeed. The app's existing loading/error button handles this.
Each input level, date and performance is drawn once per asset. Nasdaq levels use
points; gold/silver use dollars per ounce. Gold's mandatory source/license attribution
is retained. The comparative layout keeps one common signature and period.

The CI renders and checks every eligible asset and four mixed comparisons, invalid
and long inputs, signatures, units, ratios, local requests, and missing-logo retry.
Its PNGs are saved under the existing `tool-visual-checks` workflow artifact.

## Présentations SCPI et assurance-vie

`mineral-scpi.webp` et `mineral-insurance.webp` : illustrations décoratives générées pour le style minéral clair choisi le 8 octobre 2026. Elles ne contiennent aucune donnée produit ; tous les noms, chiffres et conditions sont composés par `src/pages/presentation-shared/imageExport.js`. Le WebP conserve la transparence du PNG source.
