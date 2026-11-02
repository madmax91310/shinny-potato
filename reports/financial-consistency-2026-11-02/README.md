# Cohérence financière entre outils — 2 novembre 2026

Base examinée : `master` **414bd67a1afa1ae9cc003e5e98a3f0c0f6b92d2d**. Le calcul est rejouable avec `node scripts/audit-cross-tool-finance.mjs --write`. [Matrice JSON](matrix.json) (preuves, conventions, fenêtres et empreintes des entrées) et [CSV](matrix.csv) (valeurs non arrondies) sont des résultats d’audit datés, jamais des sources de l’application.

## Périmètre et coordination

PR ouvertes relues : #1141 (Données à revoir, présentation et décompte des situations), #1140 (Budget), #1061 (accès AUM iShares bloqué, brouillon à ne pas fusionner), #1042 (guide LifeStrategy). Les réparations mensuelles et qualifications des PR fusionnées #1136/#1137/#1138 sont présentes dans la base ; elles ne sont pas réimplémentées. #1139 et son pied d’image du Générateur sont conservés. La PR #1142, apparue pendant ce travail, ne modifie que le suivi consolidé et les preuves des reprises ; son diff a été relu, sans reprise concurrente de ses fichiers. Aucun collecteur, seuil financier, prix, frais, revenu, preuve ou calendrier de qualification modifié ici. Aucun historique d’indice attribué à un fonds.

Ce lot possède le routage du prix final saisi dans `investment-calculator/comparison.js`, les mentions de convention mensuelle, leur consommation dans le Calculateur/Performance depuis et les tests/matrice associés. Il ne répare pas les accès externes, le moniteur ou l’interface Données à revoir. Le chantier Automatisation conserve ces sources ; #1141 conserve les situations et leurs preuves.

## Sources, transformations et moteurs réellement utilisés

| Outil / consommateur | Chemin réel | Conventions et duplication constatée |
|---|---|---|
| Présentation ETF | `etf-cards.js` → `etf-publication-data.js` → `getInstrumentAnnualPerformance` → `annualPerformance.js` | Identités `instruments.js`, caractéristiques `instrument-facts.js`, frais `etf-ter.js`, encours `instrument-aum.js`, cotation `instrument-listings.js`. Calendrier de part provenant d’`automated-etf.js`, sinon cours ajustés qualifiés ou archive documentée. Pas d’historique d’indice ajouté. |
| Comparatif ETF | `etf-themes.js` → façade `tweet-midi/data/comparatifEtf.js` → `comparisonPerformance.js` | Même getter annuel, avec priorité aux détails de comparaison documentés ; années communes, conversion par `annual-performance-currency.js`. Les rendements du comparateur d’indices interne gardent leur mapping ISIN et preuves propres. |
| Performance depuis | `performanceHistory.js` → `marketHistory.js` ou `qualified-annual-calendars.js` → `engine.js` | Clôtures décembre N−1/décembre N ; année en cours exclue. Calendriers annuels distincts des prix mensuels. `performanceCurrency.js` choisit une série officielle d’indice compatible, sinon conversion BCE aux deux bornes. Net/Gross restent distincts. |
| Calculateur, comparaison et vidéo | `calculator-history.js` → `market-history.js` → observations mensuelles / NAV qualifiées / indices / actions → `historyInCurrency` → `investment-series.js` | Achat initial ou unités achetées chaque fin de mois, bornes incluses. Le prix saisi revalorise les unités déjà acquises, sans recréer d’achats. `derive`, `comparison.js` et vidéo consomment le moteur commun. |
| Générateur | `portfolio-assets.js` → getters annuels de part, admissions manuelles de `automated-portfolio-funds.js` / `annual-portfolio-funds.js` → `performance.js` | Années communes complètes, conversion historique par `calendar-fx.js`, somme pondérée annuelle puis capitalisation géométrique. Poids rétablis chaque année. Archives `r` et calendriers datés coexistent ; `r` n’est pas un calendrier glissant implicite. Les proxies autorisés restent étiquetés. |
| Duels | `duel-assets.js` → mêmes calendriers sélectionnés → `duel-returns.js` → `portfolio-duels/lib.js` | Même rendement annuel EUR sur les calendriers partagés ; capital initial de 10 000, poids rétablis annuellement. Les petites différences de sommation sont contrôlées au seuil numérique 1e−8, sans modifier aucun seuil d’admission. |
| Il y a X ans | `anniversaryHistory.js` / `marketHistory.js` → `anniversaryPoints` ou niveaux officiellement qualifiés → `resolveAnniversaryLevel` | Prix brut/NAV hors distributions et date propre ; ce n’est pas le rendement avec réinvestissement. Les cours ajustés sans série brute qualifiée restent exclus. |
| Classements, faits historiques, crise et exports | Séries communes, `performance-rankings/engine.js` et `series.js`, `history-windows.js`, `crisis.js` | Classement : fenêtres exactes, portefeuille sans/avec rééquilibrage explicite. Les faits et crises importent les séries communes ; pas de réparation de données répliquée. |
| Projections navigateur | `project-tool-data.mjs`, `project-selected-data.mjs`, `project-light-registries.mjs`, build Vite | Dérivent les registres, métadonnées, séries et libellés. Régénérées et comparées aux sources ; aucune sortie générée corrigée à la main ni ajoutée au commit sans modification de son générateur. |

Les doublons apparents sont principalement des archives, cours de cotation, calendriers NAV et proxies ayant des contrats différents. Les tarifs et identités courants sont déjà mutualisés. La duplication fautive restante démontrée ici concernait une condition de routage : le même prix saisi était retiré du deuxième résultat quand l’identité était identique. Les mentions de méthode concurrentes du Calculateur sont maintenant composées par `performance-conventions.js`.

## Matrice et méthodes

4 199 lignes de rapprochement : **4 113 compatibles numériquement**, **24 lignes d’indices conservées distinctes**, **58 écarts entre mesures différentes dont l’amplitude reste à qualifier**, **2 fenêtres refusées conservées**, **2 exemples avant/après du même défaut**. Ce sont des contrôles, pas 4 199 observations externes recertifiées. Les 3 869 comparaisons annuelles Générateur/Duels étendent le contrôle à tous les ISIN partagés, au-delà des dix instruments d’échantillonnage. Les 54 séries mensuelles NAV partagent la régression des mentions de méthode.

| Instrument exact | Rôle dans la matrice |
|---|---|
| IE00B4L5Y983 — iShares Core MSCI World Acc | Physique capitalisant, longue cotation EUR et calendrier natif USD |
| IE00BYYHSQ67 — iShares World Quality Dividend Dist | Physique distribuant, cours ajustés et revenus réinvestis |
| FR0011871128 — Amundi PEA S&P 500 | Synthétique, NAV EUR, calculs mensuels et annuels |
| IE0002XZSHO1 — iShares World Swap PEA | Part récente : seul 2025 complet disponible dans le calendrier actuel ; série mensuelle actuellement qualifiée à partir de janvier 2026 ; aucun remplacement par l’indice |
| LU2196470426 — Xtrackers Nikkei 225 | Calendrier NAV JPY converti et voie NAV EUR ; cotation XNKY.DE refusée sur sa fenêtre financière |
| IE00BK5BQT80 — Vanguard FTSE All-World Acc | Fonds distinct de son indice ; cotation EUR différente de la NAV USD |
| IE00B4ND3602 — iShares Physical Gold | ETC métal physique, sans distribution, différent du spot et de sa moyenne mensuelle |
| CH0454664001 — 21Shares Bitcoin | ETP/ETN : NAV indépendante de la cotation ABTC.PA refusée |
| GB00B15KXQ89 — WisdomTree Copper | ETC synthétique sur contrats, NAV de rendement total ; unités de performance non revalorisables par un prix de part |
| IE00BDBRDM35 — iShares Global Aggregate EUR Hedged Acc | Fonds obligataire avec couverture ; conversion de devise différente d’une couverture |

MSCI World Gross USD et MSCI ACWI Net USD/EUR contrôlent les chemins d’indice et le refus d’un mélange net/brut. Portefeuilles : 100 % d’une ligne ; 60 % World + 40 % S&P 500 dans Générateur/Duels ; une/deux lignes de séries mensuelles identiques dans Classements, avec rééquilibrage annuel ou conservation des unités. Montants et pourcentages sont calculés sans arrondi intermédiaire ; l’affichage arrondit ensuite. Le DCA rapporte le gain aux versements, sans prétendre donner un rendement annualisé.

## Corrections démontrées

| Classification / cause | Avant | Après |
|---|---|---|
| **Erreur de calcul**, même Bitcoin à gauche en versement unique et à droite en DCA ; prix final saisi 100 000 USD. Décembre 2020–décembre 2025 inclus, 61 versements de 100 USD, 6 100 USD au total. Condition `asset2Id !== asset1Id` supprimant la saisie du côté B. | B = **13 226,84059949 USD** au cours de base ; seul A revalorisé | B = **15 114,86395086 USD**, comme la somme indépendante des unités achetées × prix final saisi. Même saisie et convention des deux côtés. |
| Même défaut, investissement de 100 EUR par mois, achats convertis à chaque fixing historique, valorisation finale 100 000 USD convertie au fixing de décembre 2025 | B = **12 304,92051622 EUR** | B = **14 061,34731343 EUR**. Ni les dates de flux ni la convention d’achat n’ont changé. |
| **Présentation trompeuse** : NAV officielles passées dans la branche générique `priceMethod=adjusted` | Calculateur : « Cours ajustés de l’ETF » ; Performance depuis ne précisait pas la NAV mensuelle | Libellé de valeur liquidative et revenus réinvestis, frais de fonds inclus ; même règle pour interface et copie. Les valeurs calculées et le style des images restent identiques. |
| **Présentation trompeuse** : texte de comparaison aux repères EUR figé sur « coté en dollars » | Affirmait USD pour toute série étrangère, y compris JPY/CHF/GBP | Devise réelle de la série ; aucun risque de change réputé supprimé par une cotation EUR. |
| **Présentation trompeuse** : réserve générale sur tous les frais contredisant les NAV nettes de frais | « frais et fiscalité non pris en compte » | « frais de courtage et fiscalité non pris en compte », avec frais du fonds expliqués dans la méthode. |

La correction est dans le calcul commun du comparatif utilisé par le texte et la vidéo. Aucun prix, rendement ou projection financière n’a été réparé manuellement. Le premier résultat, le calcul des unités et le principe de revalorisation ne changent pas.

## Différences légitimes conservées et limites

- Fonds ≠ indice, Acc ≠ Dist, EUR ≠ USD, Net Return ≠ Gross Return. Pas d’égalité forcée ; les variantes d’indice incompatibles restent bloquées.
- NAV ≠ cotation ajustée : heure de valorisation, marché, prime/décote, distributions et change de clôture peuvent différer. Exemple VWCE 2025 : cours EUR **9,1577817958 %**, calendrier de part USD converti EUR **8,3639012766 %**. La méthode explique pourquoi on ne force pas l’égalité ; elle ne prouve pas à elle seule l’origine de chaque fraction de cet écart. Les 58 lignes correspondantes restent explicitement non certifiées dans la matrice.
- Le niveau brut de l’anniversaire n’est pas la performance totale. Une année partielle n’est pas une année civile complète. Un portefeuille conservé sans rééquilibrage n’a pas à égaler une allocation remise aux poids chaque année. Versement initial et DCA n’ont pas le même calendrier ; le comparatif égalise le budget total puis conserve leurs dates propres.
- Les fenêtres XNKY.DE et ABTC.PA refusées restent refusées ; les voies NAV indépendantes ne les « réparent » pas. Les 79 enquêtes antérieures, le mois palladium 2014-12 et les autres limites de sources restent dans le suivi financier consolidé et la PR Données à revoir. Aucun ancien rapport n’a été pris comme preuve d’une panne actuelle.
- La piste AUM iShares #1061 et les accès/collectes externes relèvent de l’Automatisation. Les dates de preuve et les dernières valeurs valides ne sont pas renouvelées par cette enquête.
- Le contrôle n’est pas une certification exhaustive des marchés, des dividendes ni de toutes les images et vidéos. Il recalcule les chemins cités depuis les registres actuels, compare des valeurs à contrat égal et documente les cas non comparables.

## Validation

- Build complet, budgets inchangés, 4 583 certificats de couverture et concordance des 42 fichiers du manifeste public.
- Exemples financiers indépendants, régressions du comparatif (modes et côtés inversés, USD/EUR, absence de fuite vers un autre actif), conventions des 54 NAV ; tests devises, 520 comparaisons de devises ETF, NAV officielles et liens entre outils.
- Projections légères/sélectionnées : 759 identités et toutes les fenêtres annuelles ; 716 historiques anniversaire ; parité Vite/canonique et routes concernées.
- Stress Générateur : **9 300 portefeuilles, 0 violation** ; recettes : **418 constructions, 11 757 combinaisons exhaustives, 2 790 générations déterministes**. Aucun poids ni admission automatique modifiés.
- Recette Chromium et publication : voir le complément de livraison après exécution ; ne pas déduire « en ligne » du seul build local.

Recette ciblée locale terminée à 1 440/390 px : sommes affichées et copies exactes, six PNG réellement téléchargés (dont égalité binaire aperçu/téléchargement de Performance depuis), comparaison du même Bitcoin en deux modes, et vidéo WebM réellement produite/téléchargée à 1 440 px avec les deux capitaux corrects. Les PNG NAV et Calculateur ont été inspectés ; aucun code de dessin modifié. [Reçu numérique](local-browser-proof.json). Rejeu : `CHROMIUM_PATH=/usr/bin/chromium node scripts/playwright-financial-consistency.mjs`. Cette recette est ajoutée au manifeste navigateur CI, sans retrait d’un contrôle existant.

Le parcours historique du Calculateur demandait l’absence de toute mention « Cours ajustés » dans la copie. Il demande désormais la présence de la méthode exacte de la série ; ses contrôles des capitaux, périodes, absence de NaN, exclusions et images sont conservés. Cela accompagne l’ajout de la convention à la copie, sans assouplissement de qualification financière.
