# PR #903 — Guide ETF sectoriels et thématiques PEA

Contrôle effectué le 24/10/2026. Revue initiale du texte : 23/10/2026.

## Contrôle des 13 références

Les encours ci-dessous sont ceux du fonds/compartiment (pas une estimation à partir du prix). Ils restent hors du tweet copié. Les dates de valeur des documents sont distinctes de la date de consultation.

| ISIN | PEA | Frais annuels | Distribution | Encours du fonds EUR | Date encours | Preuve officielle |
|---|---|---|---|---:|---|---|
| IE00BMW42413 | Oui | 0.18 % | Capitalisation | 244 682 664 | 2026-10-23 | [Émetteur](https://www.blackrock.com/fr/particuliers/products/315818/ishares-msci-europe-information-technology-sector-ucits-etf) |
| LU1834988518 | Oui | 0.30 % | Capitalisation | 246 540 000 | 2026-09-30 | [Émetteur](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1834988518/FRA/FRA/RETAIL/ETF/20260930) |
| LU1834986900 | Oui | 0.30 % | Capitalisation | 906 670 000 | 2026-09-30 | [Émetteur](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1834986900/FRA/FRA/RETAIL/ETF/20260930) |
| LU1834983477 | Oui | 0.30 % | Capitalisation | 3 706 660 000 | 2026-09-30 | [Émetteur](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1834983477/FRA/FRA/RETAIL/ETF/20260930) |
| LU1829219390 | Oui | 0.30 % | Capitalisation | 6 483 760 000 | 2026-09-30 | [Émetteur](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1829219390/FRA/FRA/RETAIL/ETF/20260930) |
| LU1834987973 | Oui | 0.30 % | Capitalisation | 157 480 000 | 2026-09-30 | [Émetteur](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1834987973/FRA/FRA/RETAIL/ETF/20260930) |
| LU1834987890 | Oui | 0.30 % | Capitalisation | 444 330 000 | 2026-09-30 | [Émetteur](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1834987890/FRA/FRA/INSTITUTIONNEL/ETF/20260930) |
| LU1834983550 | Oui | 0.30 % | Capitalisation | 582 880 000 | 2026-09-30 | [Émetteur](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1834983550/FRA/FRA/RETAIL/ETF/20260930) |
| LU1834988864 | Oui | 0.30 % | Capitalisation | 222 720 000 | 2026-09-30 | [Émetteur](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1834988864/FRA/FRA/RETAIL/ETF/20260930) |
| DE000A0Q4R28 | Oui | 0.46 % | Distribution | 176 103 194 | 2026-10-23 | [Émetteur](https://www.blackrock.com/fr/particuliers/products/251932/ishares-stoxx-europe-600-automobiles-parts-ucits-etf-de-fund) |
| LU3047998896 | Oui | 0.35 % | Capitalisation | 563 000 000 | 2026-08-31 | [Émetteur](https://docfinder.bnpparibas-am.com/api/files/195fa0c8-6687-406c-af87-5928930c2e51) |
| IE000PS0J481 | Oui | 0.47 % | Capitalisation | 519 420 981,56 | 2026-10-23 | [Émetteur](https://globalxetfs.eu/funds/brij) |
| FR0011882364 | Oui | 0.60 % | Capitalisation | 100 500 000 | 2026-09-30 | [Émetteur](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0011882364/FRA/FRA/RETAIL/ETF/20260930) |

Les objectifs de gestion des reportings Amundi confirment explicitement le PEA, même lorsque la ligne générique « Éligibilité » indique un tiret ou ne liste que CTO/assurance-vie. Pour BNP, le communiqué officiel de lancement confirme le PEA et l’ISIN de la classe capitalisante ; la gamme de septembre 2026 confirme 0,35 % et 563 M€ au 31/08/2026. Le tarif promotionnel de 2025 n’est pas repris.

Eau : 100,50 M€ au 30/09/2026, soit seulement 0,50 M€ au-dessus du seuil. Le guide ne prétend pas connaître un encours quotidien au 24/10/2026. À revérifier avant réemploi.

## Intégration

- Base de travail : master 2179e96eae7c557f0dfd097a9384a812bf4be509.
- PR initiale : f6769c88c7ceb6b30dc53028201eeb4299c3e97e ; ajout de deux lignes seulement.
- Tous les octets de data.js sur master sont conservés en dehors de l’insertion du nouveau guide. Les ajouts récents (dont Histoires de marché) restent présents.
- Identifiant stable unique, 13 ISIN distincts, aucune autre entrée réécrite.
- Texte original conservé ; frais résolus par le mécanisme partagé existant et contrôlés à l’affichage.
- 14 sources originales conservées, complétées par 9 reportings datés et le communiqué BNP en PDF. Les 13 contrôles structurés gardent date de consultation et date d’encours.
- Revue du guide raccordée explicitement à la politique de validité ; expiration habituelle de 30 jours et contrôle des dates du registre conservés.

## Validation

- npm ci --ignore-scripts : réussi.
- npm run build (prébuild et audits de couverture/bundles inclus) : réussi.
- node scripts/test-tweet-bank-validity.mjs : réussi, 94 textes.
- Recette dédiée : scripts/playwright-sector-guide.mjs (ordinateur 1440 px et mobile 390 px). Réussi en navigateur réel (Chromium Headless Shell 141, chemin explicite).
- Recette générale de la banque : scripts/playwright-tools.mjs --tweet-bank. Réussi : 94 textes, copie fidèle, brouillons et suivi de publication.

Les sorties de prébuild sans rapport avec ce guide ne font pas partie du changement. Les essais de brouillon et de publication utilisent uniquement le stockage local d’un navigateur de test isolé ; aucune publication sur X.

La recette dédiée est ajoutée au manifeste CI existant scripts/ci-browser-checks.json.
