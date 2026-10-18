# Nouveaux actifs automatisés — 18 octobre 2026

Lot « nouveaux actifs » : 110 actions internationales et 14 ETF iShares entrent dans le catalogue avec des données qui se maintiennent seules. Les chiffres régénérés de `asset-tool-routing.md`, `asset-field-coverage.md` et `exposure-coverage.md` priment sur ceux de cette page.

## Chaîne d’intégration

1. `scripts/global-equity-candidates.json` : identités curatées (ISIN, cotation attendue, devise, région, scène). Une ligne n’entre dans `src/data/global-equities.json` qu’après deux contrôles réels.
2. Classification officielle : `collect_dca_complete_holdings.py` retrouve l’ISIN exact dans les positions complètes BlackRock (World, S&P 500, EM IMI, World Small Cap) et en tire le nom, le pays de risque, le secteur GICS, le ticker, la place et la devise de la cotation détenue.
3. Qualification Yahoo : `export-equity-candidates.mjs` dérive la cotation Yahoo de cette place (refus si elle diffère de la cotation curatée), puis `qualify_monthly_candidates.py` vérifie symbole, devise, type, date de première cotation, continuité mensuelle, recoupement quotidien/mensuel et dernière séance. Seul le dernier segment continu entièrement recoupé est publié.
4. `sync-global-equities.mjs` promeut les lignes qualifiées avec leur pays, secteur, période et source ; les autres restent candidates avec le motif du dernier essai.
5. Le workflow `onboard-assets.yml` enchaîne ces étapes sur la branche de la pull request (et à la demande) puis commite les observations validées. Après fusion, les collecteurs quotidiens et mensuels existants entretiennent les séries ; un échec conserve la dernière version contrôlée.

Nouvelles places prises en charge par les exporteurs : Bruxelles, Oslo, Helsinki, Stockholm, Shanghai, Toronto et l’ASX. Les tickers londoniens à point final (BP., NG.) sont normalisés vers la convention Yahoo.

## Actions ajoutées

Europe 64 (+49), Asie 57 (+37), États-Unis 33 (+18), Canada 6 (+6) : voir `src/data/global-equities.json` (entrées datées du 2026-10-17 et suivantes). Chaque action conserve sa devise de cotation (GBp distinct de GBP) ; les conversions en euros utilisent les taux BCE de fin d’année déjà collectés.

Outils raccordés pour chacune : Et si tu avais investi (versement unique et DCA), Performance depuis, Il y a X ans (clôtures brutes distinctes), Qui a vraiment gagné ? (recherche manuelle et 34 nouvelles sélections préparées, dont 13 avec ETF de référence), Duel de portefeuilles et Générateur en composition manuelle (années civiles communes en euros, trois au minimum), Portefeuille & DCA (pays, secteur et recouvrement par ISIN avec les positions complètes des ETF), Bibliothèque de données. Faits marquants et Analyse d’entreprise gardent leurs périmètres propres.

## ETF ajoutés (pipeline des expositions qualifiées iShares)

| Part | ISIN | Rôle de comparaison |
|---|---|---|
| iShares Core MSCI EMU (Acc) | IE00B53QG562 | Zone euro large face à l’Euro Stoxx 50 ; PEA documenté |
| iShares MSCI EMU Small Cap | IE00B3VWMM18 | Petites capitalisations de la zone euro |
| iShares Euro Dividend | IE00B0M62S72 | Rendement du dividende face aux Dividend Aristocrats euro |
| iShares Edge MSCI Europe Value / Momentum / Quality | IE00BQN1K901, IE00BQN1K786, IE00BQN1K562 | Facteurs appliqués à l’Europe, face aux facteurs World |
| iShares Edge MSCI USA Quality / Value / Momentum | IE00BD1F4L37, IE00BD1F4M44, IE00BD1F4N50 | Facteurs appliqués aux États-Unis |
| iShares S&P SmallCap 600 | IE00B2QWCY14 | Petites capitalisations américaines face au Russell 2000 |
| iShares MSCI World SRI EUR (Acc) | IE00BYX2JD69 | Filtres extra-financiers face au World |
| iShares Electric Vehicles and Driving Technology | IE00BGL86Z12 | Thème face à la chaîne des batteries |
| iShares Global Aerospace & Defence | IE000U9ODG19 | Défense mondiale face à la défense européenne |
| iShares Ageing Population | IE00BYZK4669 | Démographie face à l’innovation médicale |

Champs collectés par le connecteur iShares existant : nom officiel, cotations officielles avec preuve, frais, encours de la part, calendrier NAV complet, pays, secteurs, positions intégrales et top dix, domicile, réplication, distribution et métriques. L’historique mensuel Yahoo de la cotation exacte a été qualifié pour les 14 parts.

Outils raccordés : Présentation d’ETF, Comparatif ETF (12 nouvelles paires), Et si tu avais investi, Performance depuis, Il y a X ans, Qui a vraiment gagné ? (lignes annuelles NAV et mensuelles), Duel de portefeuilles et Générateur en composition manuelle lorsque trois années civiles communes existent, Portefeuille & DCA (compositions complètes collectées pour les 14 parts), Bibliothèque de données. Aéronautique et défense (lancée en février 2024) ne dispose que de l’année 2025 : elle reste hors duels et Générateur jusqu’à trois années complètes, sans prolongement artificiel.

Statut PEA : l’éligibilité de la part MSCI EMU est documentée par deux sources secondaires indépendantes. Pour les treize autres parts, le collecteur de métadonnées lit le champ « Régime fiscal PEA » de la page produit BlackRock France (Oui/Non ; un tiret reste non documenté) ; aucune déduction à partir du domicile ou de l’indice.

## Candidats écartés ou en attente

- CNOOC et China Mobile : absents des positions des fonds iShares utilisés pour la classification (sociétés visées par les sanctions américaines) ; aucune classification officielle possible.
- Taïwan (TSMC, MediaTek, Hon Hai) : la BCE ne publie pas de taux de référence TWD. Le collecteur de change croise désormais la série H.10 de la Réserve fédérale (FRED DEXTAUS, TWD par USD) avec le taux USD de la BCE du dernier jour commun de chaque mois ; les trois actions entrent en candidature dès la première collecte réelle de ce taux sur `master`.
- BHP, CSL, Commonwealth Bank, Macquarie : d’abord rejetées (« Duplicate Yahoo local date »), le diagnostic réel du 18/10 a montré que Yahoo répète la dernière séance de Sydney en deux barres (10:00 et 16:10 locales) aux prix identiques. Une séance identique est désormais conservée une fois, toute date répétée avec des prix différents reste refusée ; les quatre actions ont été qualifiées et promues le 18/10 (Océanie, période depuis 2015-01) avec la sélection « Grandes valeurs australiennes ».
- FedEx, Bajaj Finance, Kotak Mahindra : ISIN initialement obsolètes ou erronés, corrigés d’après les positions BlackRock (US31428X1063, INE296A01032, INE237A01036) et requalifiés dans un second passage ; BP, National Grid et AB InBev de même après normalisation des tickers et de la place de Bruxelles.
- Spotify : écarté pour éviter la confusion entre société européenne et cotation américaine.

## Vérifications

Tests unitaires de qualification, `test-global-equities` (7 outils pour chaque action promue), `test-equity-monthly`, `test-equity-duels`, `test-performance-rankings` (84 catégories), `test-qualified-exposures`, `test-etf-tool-connections`, audits du catalogue d’instruments, de cohérence des frais et des performances, de provenance des supports, du catalogue de données et des historiques automatisés ; compilation avec budgets de routes. Les bases NAV et cours de Bourse ajustés des familles États-Unis et Chine du comparateur sont désormais explicitées, car quatre parts existantes ont reçu leur historique de marché dans le même passage.
