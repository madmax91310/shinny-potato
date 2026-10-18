# Comparatifs et classements dérivés des registres — lot 5 (18 octobre 2026)

Chiffres recomptés sur le dépôt avant intervention : 305 des 503 actifs classables hors des 54
catégories éditoriales des Classements (groupes de repli « Autres ETF et ETC », « Actions et autres
actifs ») ; sélection PEA annuelle prise par position (`slice(0, 6)`) sur des années figées
(2023-2025) ; 111 des 244 fiches ETF absentes des 90 thèmes du Comparatif ETF, un thème en doublon ;
10 fiches dans deux catégories absentes de l’ordre déclaré des Fiches ETF.

## Classements

- **Groupe par exposition.** Tout ETF ou ETC hors catégorie éditoriale est classé par
  `exposureGroup` (identité et indice du registre), jamais sous un libellé fourre-tout : Émergents,
  Obligations et monétaire, Matières premières, Secteurs et thématiques… Les actions restent
  « Actions individuelles » (le registre des sociétés ne porte pas de secteur) ; les indices restent
  « Indices ». Le vocabulaire partagé reconnaît désormais Corée, palladium, platine et argent.
- **Univers dérivés** (`EXPOSURE_CATEGORIES`, 12 univers) : un classement par groupe d’exposition,
  règle fixe : jusqu’à six parts, historiques les plus longs d’abord, une part n’est retenue que si la
  sélection conserve une année civile commune. La grille à cocher propose le groupe entier
  (« Par exposition (registre) »), pas seulement les six du classement préparé.
- **Calendriers PEA** (`ANNUAL_PEA_CATEGORIES`, 4 univers) : toutes les parts EUR éligibles PEA qui
  publient les trois dernières années civiles complètes (bornées par l’horloge, plus de liste
  d’années), groupées par exposition, calendriers les plus longs d’abord. L’ancienne sélection
  « six premières du fichier » disparaît.
- `test-performance-rankings.mjs` contrôle : aucun ETF en « Autres ETF et ETC », couverture commune de
  chaque univers dérivé, ordre des historiques, trois dernières années présentes pour chaque part PEA.

## Comparatif ETF

- **Doublon retiré** : « Obligations à échéance : 2028 ou 2029 » existait dans les sélections
  d’actifs distincts et dans les comparatifs qualifiés ; seule la sélection est conservée.
- **Thèmes « Même indice »** (13) : parts de nos fiches qui suivent le même indice
  (`benchmarkKey`, couverture de change distinguée), PEA en tête puis frais croissants, cinq parts au
  plus ; la mention PEA passe par `affirmInstrumentPea` (« éligible PEA », « CTO, hors PEA »,
  « éligibilité PEA non documentée »), la politique de distribution vient des caractéristiques.
- **Sélections par exposition** (24) : les fiches encore sans thème, groupées par famille
  d’exposition, quatre par thème, frais croissants, indice suivi en différenciateur.
- **Règle d’éligibilité** (`comparisonReady`) : une part n’entre dans un comparatif dérivé que si
  l’observation automatique porte frais, encours daté, au moins une année civile complète et les trois
  expositions publiées (pays, secteurs, positions) ; une matière première sans exposition actions est
  admise. Même exigence que `audit-comparison-automation.mjs`, qui tourne sur l’ensemble.
- Résultat : 126 thèmes couvrent 229 fiches avant fusion de master ; après la fusion des 14 ETF
  iShares de #762 (12 thèmes éditoriaux), 138 thèmes couvrent 243 fiches. Quinze fiches restent hors comparatif, pour cause
  d’observations incomplètes et non par oubli : FR0013346681 (monétaire, pas d’exposition actions),
  LU3180074463, FR001400ZGO4, LU2970735911 (lancements 2025, premier calendrier attendu),
  IE000716YHJ7, IE0000QLH0G6, IE000L6ZMMC4, IE00BLCHJB90, IE000NDWFGA5, IE00BMH5Y871, IE0000N55FP4
  (positions ou calendrier non collectés), IE000UL6CLP7 (secteurs non publiés), IE00BM8R0J59 (conflit
  de sources), IE00BD6FTQ80 et IE00BDFL4P12 (ETC sans calendrier). `test-etf-themes-coverage.mjs`
  exige qu’aucune fiche éligible ne manque et que toute fiche absente soit inéligible.
- `audit-comparison-automation.mjs` et l’inventaire des écarts ignoraient le collecteur
  `update-exposure-expansion.yml` (35 parts) : il est désormais compté parmi les collecteurs actifs.

## Fiches ETF

« Matières premières » (6 ETC) et « Multi-actifs » (4 LifeStrategy) entrent dans `CATEGORY_ORDER`
avec leur emoji ; le test de couverture exige que chaque fiche ait une catégorie déclarée.

## Limites

- Les groupes d’exposition sont un vocabulaire de navigation dérivé du nom et de l’indice ; ils ne
  remplacent pas une classification officielle.
- Les textes des thèmes dérivés sont des gabarits (transition, clôture, question) : moins incarnés que
  les thèmes éditoriaux, ils signalent leur origine par `derived` et peuvent être réécrits à la main
  en les promouvant dans les thèmes éditoriaux.
- Les actions individuelles restent un seul groupe : le registre des sociétés ne porte pas de secteur.
