# Extensions de publication — 1er novembre 2026

## État initial et sélection avant implémentation

Base : master a9c92affdbf1a75b1464d5e4abee5dc079981ebf. Aucun AGENTS.md présent dans l’arbre ; CLAUDE.md et docs/claude/audit-application-2026-10-18.md applicables. PR ouvertes relues : #1119 (ordre BCE/NAV), #1118 (histoires), #1115 (budget), #1061 (accès encours PEA), #1042 (guide LifeStrategy). Les branches anciennes d’extension ne sont pas assimilées à des travaux actifs ou à des manques actuels.

L’audit courant distingue 674 instruments, 258 fiches et 245 instruments comparés dans son propre périmètre. Ces compteurs ne prouvent pas l’admissibilité financière individuelle. Les 28 profils investisseurs exposés sont tous des relevés 13F. Le calendrier et les outils retirés restent hors périmètre.

Priorité 1 : exploiter les actifs déjà documentés mais sans comparatif éditorial adapté. Onze questions, 23 parts distinctes : monétaire PEA/CTO ; All-World/ACWI IMI ; small Europe/monde ; uranium/filière nucléaire ; argent/mines ; contrats matières premières/actions minières ; méthodes robotique ; cybersécurité ; Nasdaq/vente d’options ; crédit investment grade/high yield ; autonomie stratégique/Europe large. Aucun nouveau produit quasi identique ajouté pour atteindre un quota. Une nouvelle relation éditoriale utilise les chiffres partagés et ne débloque aucun historique ou composition d’indice.

Priorité 2 : huit allocations de méthode : Buffett 90/10, Permanent Portfolio, Golden Butterfly, Ultimate Buy & Hold, Ivy, Swensen, Bernstein et 7Twelve. Vérifier les versions exactes et leur nature. Les cibles fixes publiées ne sont pas des positions vivantes ; aucune performance déduite. Les adaptations documentées par Faber doivent citer cette médiation. Aucune ligne UCITS présentée comme un titre détenu.

Priorité 3 / exclusions envisagées : nouveau 13F généraliste (faible diversité marginale), nouvelles parts World proches, profils sans pondérations rapprochables, chiffre vivant sans collecteur officiel, indice reconstruit à partir du fonds. Compléter le présent dossier avec les preuves, raccordements, exclusions et validations réellement obtenus.

## Sélection finale et preuves

La relecture du code actuel du Générateur a écarté Permanent Portfolio, Golden Butterfly, Ivy et Swensen, déjà présents sous forme d’adaptations. Les huit nouvelles méthodes ci-dessous ne dupliquent pas ces familles. Ultimate Buy & Hold n’est pas retenu : les tableaux officiels sont inaccessibles (403). Pour le Four Fund Combo, la page officielle établit les quatre classes, sans y fixer leurs poids : l’équipondération est donc expressément notre adaptation pédagogique.

La recherche a récupéré **23 réponses officielles avec l’ISIN présent**, ainsi que huit documents/pages/images pour les modèles. [Reçus, URL, empreintes, tailles et exclusions](publication-expansion-sources-2026-11-01.json). Les tableaux en image de Faber et Core-4 ont été ouverts visuellement ; les numéros de pages PDF et imprimées sont distingués. Les reçus ne recertifient pas globalement tous les champs des instruments. Les observations d’encours, devises, frais, PEA, positions et performances continuent de porter leurs preuves et dates propres dans les registres. Aucun chiffre vivant ne figure dans les nouvelles descriptions.

**Bilan d’identité : aucun nouvel ISIN.** Les 21 actifs ci-dessous existaient ; onze n’étaient dans aucun comparatif au relevé initial. Quatre étaient insuffisamment documentés pour leur benchmark exact (BOTZ, URNU, BUG, SILV) : ils sont maintenant complétés par collecte. Les autres ajouts sont des raccordements éditoriaux.

| Nouvelle question | Parts exactes concernées | Calendriers annuels communs publiables au contrôle |
|---|---|---|
| Monétaire : dans le PEA ou sur CTO | Amundi PEA Euro Court Terme UCITS ETF Acc — `FR0013346681`<br>Xtrackers II EUR Overnight Rate Swap UCITS ETF 1C — `LU0290358497` | 2025 |
| All-World ou ACWI IMI : la place des petites entreprises | Xtrackers FTSE All-World UCITS ETF 1C — `IE000L6ZMMC4`<br>State Street SPDR MSCI All Country World Investable Market UCITS ETF (Acc) — `IE00B3YLTY66` | Aucun : comparaison qualitative, sans rendement substitué |
| Petites capitalisations : Europe ou monde développé | iShares MSCI Europe Small Cap UCITS ETF — `IE0000N55FP4`<br>iShares MSCI World Small Cap UCITS ETF — `IE00BF4RFH31` | Aucun : comparaison qualitative, sans rendement substitué |
| Uranium ou filière nucléaire | Global X Uranium UCITS ETF USD Acc — `IE000NDWFGA5`<br>VanEck Uranium and Nuclear Technologies UCITS ETF — `IE000M7V94E1` | Aucun : comparaison qualitative, sans rendement substitué |
| Argent : métal physique ou actions minières | Global X Silver Miners UCITS ETF USD Accumulating — `IE000UL6CLP7`<br>iShares Physical Silver ETC — `IE00B4NCWG09` | Aucun : comparaison qualitative, sans rendement substitué |
| Matières premières : contrats ou entreprises minières | Invesco Bloomberg Commodity UCITS ETF — `IE00BD6FTQ80`<br>iShares Diversified Commodity Swap UCITS ETF — `IE00BDFL4P12`<br>VanEck S&P Global Mining UCITS ETF — `IE00BDFBTQ78` | 2025, 2024, 2023 |
| Robotique : Global X ou iShares | Global X Robotics & Artificial Intelligence UCITS ETF USD Acc — `IE00BLCHJB90`<br>iShares Automation & Robotics UCITS ETF — `IE00BYZK4552` | Aucun : comparaison qualitative, sans rendement substitué |
| Cybersécurité : Global X ou L&G | Global X Cybersecurity UCITS ETF USD Acc — `IE00BMH5Y871`<br>L&G Cyber Security UCITS ETF — `IE00BYPLS672` | Aucun : comparaison qualitative, sans rendement substitué |
| Crédit euro : investment grade ou haut rendement | Amundi Core EUR High Yield Bond UCITS ETF — `LU2970735911`<br>iShares Core € Corp Bond UCITS ETF (Dist) — `IE00B3F81R35` | Aucun : comparaison qualitative, sans rendement substitué |
| Europe : marché large ou autonomie stratégique | Amundi European Strategic Autonomy UCITS ETF Acc — `LU3180074463`<br>iShares Core MSCI Europe UCITS ETF — `IE00B4K48X80` | Aucun : comparaison qualitative, sans rendement substitué |

## Matrice de raccordement

| Consommateur | Raccordement du lot |
|---|---|
| Présentation ETF | Les 21 fiches existantes sont conservées ; indice exact complété automatiquement pour les quatre Global X. |
| Comparatif ETF | 10 nouvelles questions, 21 parts ; recherche par nom, ISIN et ticker, génération, texte et PNG. Une sélection mêlant ETF et ETC dit « produits », sans renommer l’ETC en ETF. |
| Fiches pratiques | Les mêmes 10 sélections et descriptions, frais partagés, recherche ISIN/ticker, texte et image. |
| Coulisses des indices | Aucun raccordement nouveau : une preuve d’objectif de fonds n’est pas une composition d’indice. |
| Le DCA de… / Actifs & expositions | Les 21 références existent déjà. Tests partagés complets rejoués ; aucune ventilation ni composition complète inventée à partir d’un top 10. |
| Classements | Aucune admission nouvelle ni nouvelle série ; calendriers, fenêtres et change existants conservés. Tests des consommateurs rejoués. |
| Performance depuis / Calculateur | Raccordements existants et contrôles de fenêtre conservés. En particulier, les parts récentes restent sans période admissible lorsque les preuves l’exigent. Aucun proxy ajouté. |
| Il y a X ans | Aucun prix brut ni convention de cours ajouté ; les refus restent séparés de ceux des outils de rendement. |
| Générateur / Duels | Aucune recette, pondération, série ou admission modifiée. Pas de nouvelle famille quasi identique. Le stress test des recettes n’est donc pas requis pour ce lot. |
| Bibliothèque de données | Huit nouvelles fiches de modèles recherchables par auteur, méthode et classes ; JSON issu des objets canoniques, provenance et portée conservées. |
| Portefeuille d’investisseur | 28 déclarations 13F préservées ; huit modèles ou adaptations dans un groupe distinct, toutes les lignes dans le texte, l’aperçu et le PNG. |

Les deux sélections qui affirment une éligibilité PEA exigent une preuve positive de la part concernée au moment de générer texte et image. Un statut inconnu ou contraire bloque la publication, dans les comparatifs comme dans les fiches pratiques.

Les raccordements historiques préexistants ne valent pas promesse que chaque fenêtre soit publiable. Le contrôle financier continue de refuser les périodes non rapprochées, les calendriers incomplets et les historiques d’une autre part.

## Huit méthodes et leur nature

| Profil / modèle ajouté | Nature | Portée de la référence |
|---|---|---|
| Buffett · la consigne 90/10 | Allocation modèle publiée | Lettre aux actionnaires 2013, publiée en 2014 ; Page imprimée 20 (PDF p. 19). Consigne testamentaire publiée, sans preuve de sa mise en œuvre ; elle ne décrit ni les positions de Berkshire Hathaway ni le patrimoine complet de Buffett. |
| Bernstein · quatre blocs selon Faber | Adaptation pédagogique documentée | Version publiée par Meb Faber en 2015, d’après The Intelligent Asset Allocator (2000) ; Figure 55, p. imprimée 94 (PDF p. 101). Adaptation pédagogique de la présentation de Faber ; aucune détention personnelle ni autre version de Bernstein n’est assimilée à ces cibles. |
| Faber · Global Market 2015 | Allocation modèle publiée | Global Asset Allocation, 2015 ; Figure 31, p. imprimée 48 (PDF p. 55). Approximation pédagogique publiée en 2015, conservée comme référence historique ; ces cibles ne représentent pas les poids actuels du marché mondial. |
| Israelsen · 7Twelve de base | Allocation modèle publiée | Introduction to 7Twelve, janvier 2026 ; Figure 1, PDF p. 1 ; modèle core. Modèle de base publié en janvier 2026, décrit par classes d’actifs ; aucun fonds américain ou équivalent UCITS n’est présenté comme une détention personnelle. |
| Tyler · Pinwheel | Allocation modèle publiée | Version États-Unis de Portfolio Charts, publication non datée ; Asset Allocation · Home Country United States. Allocation modèle publiée pour les États-Unis, sans traduction locale ni relevé de détentions personnelles. |
| Ferri · Classic Core-4 modéré | Allocation modèle publiée | Classic Core-4 · Moderate Growth, version publiée en 2018 ; Table Classic Core-4 with Moderate Risk. Allocation modèle publiée, variante Classic Moderate Growth ; les versions Low Risk, Conservative et Aggressive ont d’autres poids. |
| Merriman · quatre classes équipondérées | Adaptation pédagogique documentée | Adaptation pédagogique du Four Fund Combo · source non datée ; The Four Asset Classes ; équipondération choisie pour cet exemple. Adaptation pédagogique : les quatre classes sont celles de la fondation ; les poids égaux sont un choix de cet exemple, sans attribution de ces pondérations à Merriman ni à ses détentions. |
| Marc Faber · lecture de Meb Faber | Adaptation pédagogique documentée | Version pédagogique publiée par Meb Faber en 2015 ; Figure 35, p. imprimée 56 (PDF p. 63). Adaptation pédagogique de Meb Faber, qui choisit les répartitions géographiques et les classes de référence ; ces poids ne sont pas un relevé du patrimoine de Marc Faber. |

Aucun portefeuille personnel ni nouvelle position déclarée de société ajouté : les nouveaux objets sont **cinq allocations modèles publiées et trois adaptations pédagogiques**. Les modèles Faber/Bernstein/Marc Faber gardent leur version historique et sa médiation. Buffett décrit une consigne au trustee, sans attester sa mise en œuvre. Core-4 conserve la variante modérée, Pinwheel la version américaine. Le modèle mondial de 2015 ne devient pas une pondération mondiale courante.

Les cibles sont vérifiées en unités exactes : 7Twelve utilise douze unités sur douze, sans redistribuer un résidu d’arrondi à une ligne arbitraire. Tous les pourcentages affichés sont calculés à partir des mêmes poids. Aucun ETF UCITS, taux de change, historique ou rendement de simulation n’est attribué à ces investisseurs. Les modèles ne sont pas proposés aux moteurs de performance sans série et conventions qualifiées. Les nouveaux visuels conservent le fond et les cartes de verre ; leur hauteur s’adapte pour garder les douze lignes lisibles en une colonne.

## Actualisation durable et conservation des preuves

Les 21 produits utilisent leurs collecteurs existants (Amundi, DWS, iShares, State Street, Invesco, VanEck, L&G, Global X), leurs workflows programmés et leurs registres communs. Aucun second stock de TER ou d’encours. `globalx_sections.objective_benchmark` ajoute une lecture bornée au ticker exact, dans le texte visible de l’objectif : ni texte RSC caché, ni produit voisin. Un objectif absent n’émet pas ce champ ; un conflit est rejeté. Les collecteurs `collect_presentation_etf` et `collect_priority_issuer_etf` en bénéficient dans les deux workflows déjà utilisés.

Les quatre indices officiels collectés :
- BOTZ : Indxx Global Robotics & Artificial Intelligence Thematic v2 Index ;
- URNU : Solactive Global Uranium & Nuclear Components Total Return v2 Index ;
- BUG : Indxx Cybersecurity v2 Index ;
- SILV : Solactive Global Silver Miners Total Return v2 Index.

L’intégration ne modifie que `characteristics` et leur provenance pour ces quatre parts, ainsi que la preuve datée de non-publication sectorielle de SILV. Les encours, compositions, séries, frais numériques et leurs dates restent identiques au commit de base. Les tests rejouent les réponses officielles compressées et rapprochent leurs empreintes. Ils vérifient aussi qu’une lecture partielle ultérieure garde le dernier indice valide et son ancienne preuve, et qu’une panne conserve intégralement l’observation précédente.

Les allocations modèles sont des références fixes à une publication ou une adaptation explicitée, pas des poids actuels à collecter. Leur qualification commune est `reference` ; une nouvelle version exige une revue, sans écraser cette version ni renouveler sa date avec le build. Aucun nouveau cron n’est nécessaire.

## Exclusions

Exclusion après contrôle CI : le sujet Nasdaq/vente d’options (QYLD `IE00BM8R0J59` et Nasdaq-100 `IE00B53SZB19`) faisait partie des 23 parts recherchées, mais ne fait pas partie des **21 parts / 10 sélections livrées**. Le registre conserve une composition de référence contradictoire, des ventilations économiques non qualifiées et aucun calendrier total-return de la part USD distribuante. Aucun panier de substitution ou rendement capitalisant ne les remplace ; l’audit de raccordement reste strict. Pour SILV, la preuve négative sectorielle porte désormais la date des faits de la page officielle (30 octobre), séparément du contrôle du 1er novembre ; une nouvelle collecte réévalue toujours la publication éventuelle.

Pas de nouvelles parts World proches, de nouvelles déclarations 13F généralistes, de doublons des quatre familles déjà présentes dans le Générateur, de reconstitution des tableaux Merriman refusés, de rendement de fonds étendu avant création, de nouvelle conversion historique, de panier de substitution présenté comme exposition économique ou de composition d’indice déduite d’un fonds. Pas de modification du calendrier ni de réactivation d’un outil retiré.

## Validation

Base finale intégrée : `2220833` (master, #1115, #1118 et #1119 conservées). Les chantiers #1122 (chargement des données) et #1123 (répartition CI) ont été relus ; la nouvelle recette rejoint le manifeste navigateur existant, sans ajouter un job concurrent en dur. Aucun seuil de bundle relevé, aucune projection régénérée sans rapport dans le commit.

Vérifications locales exécutées :

- `npm ci` ; build complet sur master intégré, architecture, précontrôles éditoriaux, budgets et manifeste public. La route Données à revoir reste sous 892 ko de code ; les libellés de classes d’actifs sont des données JSON partagées.
- `test-publication-models.mjs` : huit méthodes, 21 actifs, dix sélections, sources, poids exacts, JSON partagé, refus des cibles invalides, qualification des références, recherche ISIN, benchmark et preuve propre à chaque champ. Les contrôles des calendriers ne figent pas leur absence actuelle : de futures années validées restent admissibles.
- Collecteurs : `test_publication_benchmarks.py`, `test_globalx_sections.py`, `test_presentation_etf.py`, `test_priority_issuer_etf.py` ; réponses réelles rejouées, identités, objectifs visibles, conflits, omission, panne et conservation des dates. Tests raccordés au workflow émetteurs existant.
- Audits et suites : catalogue des instruments, catalogue de données, cohérence ETF, provenance des portefeuilles, présentations ETF, comparatifs, fiches pratiques, caractéristiques automatisées, qualification des données, DCA complet, classements et fenêtres financières. Contrats du portail et planification des lots navigateur contrôlés.
- Chromium, recette dédiée à **1440 / 390 / 360 px** : huit modèles, dix comparatifs et dix fiches pratiques ; **84 téléchargements PNG** inspectés et identiques à leur aperçu octet pour octet ; export JSON 7Twelve égal à la source ; recherche de chaque part par ISIN et des tickers préférés ; copie exacte, périodes absentes conservées, ETF/ETC distingués, contrôles des boîtes de texte et des débordements.
- Chromium, anciens investisseurs : 28 portraits distincts et exports, poids et dates, panne d’image puis reprise, et mobile (`test-investor-screenprint.mjs`).
- Chromium, recette générale : **18/18 outils OK**, dont 258 fiches ETF, 55 duels, 28 déclarations 13F, calculateur, bibliothèques, indices et réserves ; aucun échec annoncé comme succès. Cette recette complète inclut les nouvelles sélections déjà raccordées.
- Inspection visuelle des extrêmes à 2 et 12 lignes, du modèle adapté et des comparatifs à 2 et 3 produits. La hauteur du PNG des modèles longs augmente pour conserver les noms et les douze cibles en une colonne ; les autres styles restent ceux des outils.
- Lint ciblé et contrôle d’espacement du périmètre livré.

Les contrôles financiers constituent des tests de périmètre et de conventions ; ils ne certifient pas tous les cours historiques du dépôt. Les rapprochements non résolus et exclusions antérieures restent visibles. La CI de la PR doit encore confirmer l’instantané poussé avant de déclarer le portail GitHub vert. Sur le premier instantané, le workflow publication signale aussi une série FTSE All-World mensuelle officielle incomplète/périmée (collecteur préexistant, dernière observation conservée) ; ce signal externe n’est ni masqué ni traité comme une réussite.

### Exemples de recette datés

Captures du 1er novembre 2026, destinées à la revue ; les chiffres vivants de l’application continuent d’être résolus depuis les collecteurs.

[Modèle 7Twelve complet](publication-expansion-2026-11-01/7twelve.png) · [ETF mines / ETC argent](publication-expansion-2026-11-01/argent-et-mines.png) · [Interface mobile, adaptation identifiée](publication-expansion-2026-11-01/mobile.png).
