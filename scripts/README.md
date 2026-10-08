# Scripts d'audit / stress-test

Scripts réutilisables du repo, committés plutôt que recréés ad hoc en session (audit "outils" du
14/09/2026, complété le même jour). Chacun s'exécute directement avec `node scripts/<fichier>.mjs`
(le repo est en `"type": "module"`) ou via son alias `npm run`.

## `stress-test-portfolios.mjs`

Générateur de portefeuilles (`src/pages/portfolio-generator/`). Deux modes :

```bash
npm run stress-test:portfolios                    # mode regression (défaut)
node scripts/stress-test-portfolios.mjs --mode=combo --profile=crypto_curieux --risk=dynamique
```

- **regression** : génère ~300 portefeuilles réels par paire profil × risque valide (via la même
  fonction `generatePortfolio` que l'app) et vérifie que rien ne casse jamais la borne de perte du
  palier, l'invariante Pro-Européen, les invariantes Crypto-Curieux (Bitcoin, levier) ni la
  cohérence CTA/composition. Sort avec le code 1 si une violation est trouvée — utilisable comme
  porte de CI. À relancer après toute modification de `theses.js` ou `engine.js`.
- **combo** : teste exhaustivement toutes les combinaisons de `idOptions` d'un combo précis contre
  la borne de perte de son palier, à partir des poids actuellement dans `theses.js`. À lancer
  **avant** de committer un nouveau poids sur une ligne à risque (ex. relever un ETF à levier) —
  c'est la méthode utilisée pour valider le passage du levier Crypto-Curieux Dynamique de 4% à 10%
  le 14/09/2026.

Si le mode combo échoue : ne pas committer le poids tel quel. Voir le commentaire en tête du script
et celui du combo concerné dans `theses.js` pour la méthode (financer un poids en réduisant une
ligne au rendement proche plutôt qu'une ligne défensive).

## `verify-tweet-midi.mjs`

Tweet Midi (`src/pages/tweet-midi/`) — exécution réelle de `buildTweetText()` sur l'ensemble du
pool `ALL_ITEMS` (~2700 entrées, 7 formats confondus), pas un échantillon :

```bash
npm run verify:tweet-midi
```

Vérifie qu'aucune génération ne lève d'exception, ne renvoie un texte vide/trop court, ou ne laisse
fuiter un placeholder de gabarit non résolu (ex. `{yearsPhrase}` littéral dans le texte final — le
bug exact corrigé le 29/08/2026, transformé ici en vérification permanente). Vérifie aussi que
chaque `sourceTermeId` du format Vrai/Faux pointe vers un terme qui existe réellement dans le
Lexique financier (traçabilité). Sort en code 1 si un problème est trouvé.

Dépend d'un import extensionless en amont (`investment-calculator/lib.js` importe `from './data'`
sans suffixe, incompris par le résolveur ESM natif de Node) — d'où l'alias qui bundle avec esbuild
avant d'exécuter :

```bash
npx esbuild scripts/verify-tweet-midi.mjs --bundle --format=esm --platform=node | node --input-type=module
```

## `audit-etf-consistency.mjs`

Audit croisé ISIN/TER entre les 3 bibliothèques ETF de l'app (Fiches ETF, Générateur de tweets ETF,
Comparateur d'indices) :

```bash
npm run audit:etf-consistency
```

Les 96 ISIN utilisés dans ces bibliothèques tirent désormais leurs frais de
`src/data/etf-ter.js` : corriger le taux à cet endroit met à jour les champs chiffrés des
trois outils. L'audit exige une entrée pour chaque ISIN utilisé, refuse les entrées orphelines
et vérifie les 122 affichages. Les mentions éditoriales de frais dans ces bibliothèques
reprennent aussi le registre lorsque le taux apparaît dans le texte. Les superlatifs
(« le moins cher ») restent à réexaminer après une modification de frais.

Les encours ne sont pas centralisés : date de mesure, devise et périmètre peuvent différer.
`npm run audit:etf-snapshots` compare les montants normalisables d'un même ISIN dans une
même devise et signale les écarts d'au moins 10 %, sans substituer une valeur à une autre.
Le contrôle hebdomadaire affiche ces alertes. Recouper ensuite la fiche émetteur à la même
date avant de corriger les valeurs enregistrées.

## `audit-performance-consistency.mjs`

Même principe qu'`audit-etf-consistency.mjs`, mais pour la **performance annuelle** (2023/2024/2025)
plutôt que le TER — entre `src/data/portfolio-assets.js` (tableau `r`) et `index-comparator/data.js`
(`perfFunds`). Un mapping explicite relie chaque ligne de performance à l'ISIN du fonds
réellement cité, y compris lorsque la famille présente plusieurs ETF :

```bash
npm run audit:performance-consistency
```

Écrit le 23/09/2026 suite à un signalement utilisateur ayant révélé que le tweet "Dividendes (CTO)"
du Comparateur d'indices portait deux séries de performance fausses depuis leur création, en
désaccord silencieux avec les séries déjà vérifiées pour les mêmes fonds dans
`src/data/portfolio-assets.js` — un type d'erreur qu'`audit-etf-consistency.mjs` ne pouvait pas
détecter (il ne couvre que le TER). Le même audit a ensuite trouvé 2 autres divergences réelles
(MSCI EM IMI, Nasdaq-100) le même jour.

Un écart supérieur à 0,1 point fait échouer l'audit, même si la famille porte une note générale.
Les deux outils utilisent les mêmes séries émetteur iShares EM IMI, Vanguard FTSE All-World
et iShares Quality Dividend Dist : pour ces trois ISIN, tout écart fait échouer l'audit.
Les séries Vanguard restent arrondies au dixième par l'émetteur. Les
écarts de 0,01 à 0,1 point sont affichés pour relecture ; ils ne sont pas automatiquement corrigés.
Les parts présentes dans un seul outil ne peuvent pas être comparées par ce script. Un nouveau
`perfFunds` sans correspondance explicite avec un fonds affiché provoque un échec.

## `audit-portfolio-provenance.mjs`

Inventaire fermé des 71 supports du Générateur, par provenance du tableau annuel : part de fonds
recoupée chez l'émetteur, indice ou cours utilisé comme proxy, autre fonds/historique mixte,
ou hypothèse générique.

```bash
npm run audit:portfolio-provenance
```

Échoue lorsqu'un support n'est pas inventorié, qu'une série simulée n'a plus d'avertissement
visible dans l'interface, ou qu'un support déclaré en USD perd son indication de devise. Recense
aussi les fonds lancés en cours d'historique et conserve une référence vers les fiches des fonds
recoupés. Les 28 parts auparavant classées « série attribuée à une part » ont été revues auprès
des émetteurs le 24/09/2026 ; plusieurs séries ont été corrigées, y compris les parts à levier,
les ETF sectoriels et les foncières. Pour CSPX, la série en euros non documentée a été remplacée
par la série officielle en dollars, explicitement signalée dans le tweet. La part Quality Acc
n'a pas de rendement calendaire 2020 publié : la part Dist du même fonds fournit cette année,
signalée comme historique mixte. Les sources Vanguard en arrondi
à 0,1 point ne certifient que cette précision. Ce script vérifie les sources enregistrées et
les notes visibles, sans télécharger ni recalculer automatiquement les rendements.

Le second passage du 24/09/2026 porte sur les 13 historiques mixtes : sept séries remplacées par
la performance calendaire de leur propre part (ICOM, trois obligations d'entreprises, énergie
propre, consommation défensive et utilities). Trois autres parts sont vérifiées uniquement pour
leurs années complètes disponibles : semi-conducteurs (2021-2025), Asie hors Japon (2021-2025)
et JEPQ UCITS (2025), désormais remplacé par Global X QYLD UCITS (IE00BM8R0J59).
L'année 2020 de l'Asie provient de la part distribuante du même fonds, en USD avec dividendes
réinvestis ; celle des semi-conducteurs reste indisponible et le support reste retiré.
QYLD dispose d'une série 2020-2025 complète issue de l'ETF américain Global X, dont la stratégie
covered call existait déjà avant janvier 2020. Cette série est un proxy pour le fonds UCITS,
lancé en novembre 2022 et lié à une variante de l'indice (BXNTU plutôt que BXNT).
Depuis le contrôle du 03/10/2026, l’argent utilise les rendements officiels BlackRock en USD, sans conversion.
Les autres proxies sont les small caps Europe simulées via l'ETF SPDR suivant le même indice et les
obligations haut rendement Amundi simulées via la part Xtrackers suivant le même indice. Le
script conserve les références émetteur et ne classe pas ces proxies comme fonds vérifiés.

Le troisième passage du 24/09/2026 recoupe les séries sur indice ou cours. Deux parts
immobilières Amundi passent aux performances « Portefeuille » en EUR publiées par l'émetteur :
**2025 −3,43 %** au lieu de +10,70 %. Les séries MSCI Europe, EM IMI et EM standard sont
recoupées avec MSCI ; MSCI World corrige **2025 +6,77 %** (le +5,35 % était le rendement du
prix sans dividendes) ; MSCI ACWI est corrigé sur les six ans. Le proxy Vanguard a ensuite
été remplacé par les six rendements de la part Vanguard Acc en USD, publiés au dixième dans
son KIID ; le Comparateur d'indices utilise maintenant la même série 2023-2025. Les quatre supports or
utilisent une même série LBMA Gold Price PM USD publiée par le World Gold Council :
2020–2025 **+24,6 / −4,3 / +0,4 / +14,6 / +25,5 / +67,4 %**. Les small caps Europe
restent sur l'indice MSCI Net EUR. Le script protège désormais ces 12 séries et garde une
source nommée pour chacun des 16 supports encore fondés sur un indice ou cours.

Le contrôle suivant des 16 séries a permis de remplacer huit proxies par les six années
calendaires du **support exact** : iShares MSCI Europe (EUR), iShares EM IMI (USD), iShares
MSCI World (USD), SPDR ACWI (USD), SPDR EM (USD), puis les ETC or Invesco, iShares et
Amundi (USD). La série or utilisée auparavant (+67,4 % en 2025) correspondait à une
autre convention de cours de l'or : les trois ETC affichent désormais leur performance
propre, nette des frais ; à cette étape, WisdomTree était encore simulé sur le cours LBMA
publié en USD par Invesco (+65,0 % en 2025), avec une note explicite sur ce proxy.

Une nouvelle vérification le 24/09/2026 a retrouvé les performances propres de WisdomTree or,
WisdomTree Bitcoin et Bitwise Bitcoin. Bitwise n'a pas d'année calendaire complète en 2020 :
elle reste absente. Les **cinq proxies de cours ou d'indice** sont CoinShares Bitcoin,
21Shares Bitcoin, CoinShares Ether, Amundi PEA Monde et iShares petites capitalisations Europe.
Ce décompte exclut QYLD UCITS, Amundi High Yield et les années empruntées
dans les historiques mixtes. Les ETP encore
en proxy affichent le cours spot USD sans l'attribuer à leur ETP. Après les changements NAV,
les allocations Crypto-Curieux Dynamique (18 % Bitcoin, 21 % or) et Thématique Équilibré
(35 % secteur, 26 % or) sont de nouveau dans leurs bornes historiques.

Les deux hypothèses génériques sont revues séparément. `fonds_euros` prend la revalorisation
moyenne ACPR 2020-2025 des contrats individuels : **1,28 / 1,28 / 1,91 / 2,60 / 2,63 /
2,63 %**, nette des prélèvements sur encours et avant prélèvements sociaux. `scpi` garde
la mesure historique 2020 (+5,30 %, ancien taux de distribution + variation de prix) mais
utilise le rendement global immobilier ASPIM en 2021-2025 : **5,85 / 2,1 / −5,78 / −1,1 /
+3,1 %**. En 2025, +1,5 % est la *performance globale annuelle* calculée avec la
variation du **prix de part**, alors que +3,1 % est le *RGI* calculé avec la valeur de
réalisation : leur différence et la rupture de méthode en 2020 sont affichées dans la note.
Le RGI n'est pas le résultat net d'un investisseur qui vend ses parts.

Contrôle du 03/10/2026 : `argent` utilise désormais la série NAV officielle BlackRock USD, sans conversion.
Contrôle des historiques mixtes : VanEck Semiconductor a été retiré du générateur
à cause de son année 2020 non vérifiée. `qyld_ucits` reprend uniquement les rendements de l'ETF américain QYLD sur 2020-2025,
déjà exposé aux ventes d'options, et signale l'écart avec le fonds UCITS. `tech_europe` prend son indice MSCI exact pour 2020 et la part
iShares pour 2021-2025. `bitcoin_etcgroup` prend le cours spot BTC en 2020, puis sa NAV.
Les substitutions sont détaillées dans `DATA-REVIEW-2026-09-24.md` et dans l'interface,
jamais dans le tweet généré.

Le premier recoupement crypto utilisait les clôtures annuelles Slickcharts BTC/USD et ETH/USD.
Cette convention peut différer d'une clôture fixée à minuit UTC. Depuis la nouvelle revue,
seuls les historiques CoinShares Bitcoin, CoinShares Ethereum et 21Shares Bitcoin gardent ce
proxy spot : ce n'est **pas** une performance d'ETP et il ne comprend ni frais, ni change,
ni récompenses de staking pour Ethereum. WisdomTree Bitcoin et Bitwise Bitcoin utilisent
désormais leurs NAV propres ; DE000A27Z304 porte le nom officiel Bitwise Physical Bitcoin ETP.

Revue QYLD du 25/09/2026 : la fiche officielle Global X confirme l'ISIN de la part
**USD distribuante** IE00BM8R0J59 et son lancement en novembre 2022. Le tableau de
performance affiché par défaut concerne toutefois la part **USD capitalisante** et ne
fournit pas les rendements calendaires 2023-2025 de la part distribuante. Ses chiffres
ne peuvent donc pas remplacer la série du générateur. Le proxy américain 2020-2025
reste explicitement identifié dans l'interface ; aucun détail méthodologique n'est ajouté
au tweet. Source : https://globalxetfs.eu/funds/qyld

## `check-freshness.mjs`

Rapport de fraîcheur des données — scanne les `data.js` des 7 outils (Calculateur, Générateur de
portefeuilles, Fiches ETF, Comparatif courtiers, Lexique financier, Duel d'indices, Tweets ETF) et
signale quelles entrées ont une date de sourcing documentée, laquelle, et depuis combien de temps :

```bash
npm run check-freshness           # rapport lisible en console
node scripts/check-freshness.mjs --json   # même scan, sortie JSON pour un script tiers
node scripts/check-freshness.mjs --priorities # échéances et premières entrées à documenter
```

Classe chaque entrée datée en 🟢 récent (< 60j) / 🟡 à surveiller (60-180j) / 🔴 à revérifier
(> 180j), liste séparément les entrées **sans aucune date trouvée** ("non traçable" — un problème
différent de la péremption, cf. commentaire en tête du script), et repère les échéances explicites
du texte (`jusqu'au JJ/MM/AAAA`, ex. la promo Saxo) avec alerte si elles tombent à moins de 30 jours
ou sont déjà passées. Les dates historiques de changement de frais dans les commentaires
ne sont plus prises pour des échéances du contenu.

Scan uniquement — **aucune donnée modifiée, aucun appel réseau**. Un workflow GitHub Actions
hebdomadaire publie un résumé dans ses propres journaux ; le déploiement exige les audits de
provenance, de performance, de frais, de Tweet Midi et les stress tests. Sert à prioriser la revue, pas à
vérifier automatiquement quoi que ce soit. Méthode heuristique (repérage de dates DD/MM/AAAA dans
le texte entourant chaque entrée, pas un parseur strict) — cf. commentaire en tête du script pour
la limite connue sur les commentaires de section partagés par plusieurs entrées.

## `audit-publishable-content.mjs`

`npm run audit:publishable-content` vérifie que les faits, thèmes ETF, fiches ETF et
cas concrets possèdent leurs champs éditoriaux essentiels et leurs sources lorsqu'ils en
affichent, puis protège trois corrections ciblées : absence de small caps dans FTSE All-World,
absence de performance 2020 pour les deux ETP CoinShares, suppression de moyennes non sourcées
sur les bear markets. Le script ne prétend pas vérifier l'exactitude des autres chiffres ;
ceux-ci restent soumis aux documents des émetteurs et aux audits dédiés.

## `playwright-tools.mjs`

Le duel de portefeuilles compare deux constructions indépendantes : une base ETF obligatoire,
un complément facultatif et une thématique facultative, soit 1 à 3 ETF par côté. Les trois modes
(préparé, généré et manuel) utilisent le même moteur en euros et uniquement les années communes.
Le STOXX Europe 600 est limité aux rendements sourcés 2023–2025. `audit-portfolio-duels.mjs`
contrôle les rôles, les poids, les sources, la conversion USD/EUR et les calculs, puis exerce
500 générations. Le test navigateur couvre aussi le retrait du complément, l'ajout d'une
thématique, les sommes invalides, le PNG à trois lignes et l'affichage mobile.

Un test fonctionnel réel (Chromium) par outil, formalisant le "write→look once" fait à la main tout
au long de la session en suite réutilisable :

```bash
npm run test:tools   # build + lance son propre `vite preview` (port 4310) + teste + coupe le serveur
npx playwright install chromium  # à lancer une fois en local si Chromium n'est pas installé
```

Exerce une interaction réelle par outil (jamais juste "la page charge sans erreur") : sélection
d'actif + badges de confiance au Calculateur, génération + somme à 100% au Générateur de
portefeuilles, cycle des 36 fiches ETF, texte du duel par défaut au Comparatif courtiers (lu depuis
la `value` du `<textarea>` — jamais capturé par `innerText()`, piège rencontré à l'écriture de ce
script), cycle des 7 formats de Tweet Midi, cycle des 10 familles du Comparateur d'indices, tirage
Aléatoire d'Impact des frais, cycle des faits de Faits marquants des marchés (ajouté le 22/09/2026 à
la création de l'outil), marquage "publié aujourd'hui" + badge de repos de la Banque de tweets
(ajouté le 23/09/2026 à la création de l'outil). Sort en code 1 si un outil échoue.

Playwright est une dépendance de développement du projet ; le workflow GitHub Actions installe
Chromium, lance les audits et ce test avant de publier Pages. Une PR lance les mêmes vérifications
sans étape de déploiement. Lance `vite preview` en groupe de
processus détaché (`detached: true`) pour pouvoir le tuer entièrement à la fin
(`process.kill(-pid)`) — un bug constaté à l'écriture de ce script : `server.kill()` seul ne tue que
le wrapper `npx`, laissant le vrai process `vite preview` tourner en orphelin sur le port.


### Provenance active et archives

`npm run report:data-provenance` (ou `-- --json`) sépare les manques actifs de source des archives non recertifiables. Après la PR #150 : **0 manque actif de source ; 16 archives non recertifiables**, toutes motivées et exclues des consommateurs. Ethereum et SOXX sont documentés. `npm run audit:data-provenance` impose zéro manque actif et vérifie séparément l’inventaire des archives ; une nouvelle absence active ne peut pas se fondre dans ce compteur. Voir `docs/sourcing-2026-09-30.md` pour les critères et limites. Ce rapport couvre les champs du catalogue, pas la certification de chaque ancienne valeur ni les dates non publiées.

### Constructions du générateur

`node scripts/test-portfolio-recipes.mjs` vérifie les 93 constructions (trois pour chacun
des 31 couples profil × risque) : toutes les combinaisons de supports aux poids de départ,
puis une exploration déterministe de la génération avec pondérations variables. Il contrôle
les bornes historiques, les règles Europe/Bitcoin, les sources de revenu du Rentier, la poche
centrale et les compatibilités sectorielles du Thématique, ainsi que la rotation et les doublons.
À relancer après toute modification de `portfolio-generator/recipes.js` ou du moteur.

Les nouvelles constructions réutilisent `portfolio-assets.js` et les registres communs.
World, All-World, facteurs, émergents et petites capitalisations gardent des rôles distincts.
L’historique favorise les constructions les moins vues pour le couple choisi et exclut sa
dernière construction ; les supports tournent ensuite, puis les poids varient dans les limites
de chaque poche. Le levier et la conviction centrale thématique gardent leurs poids de départ.
La composition manuelle reste indépendante de ces contraintes de génération automatique.
Les bornes restent des filtres sur les années simulées, jamais des pertes maximales garanties.

### Chargement par route

Les 16 pages d’outils sont importées avec `React.lazy` dans `src/App.jsx`.
Le `Suspense` autour de l’Outlet conserve l’en-tête et la navigation pendant
le chargement ; l’accueil reste disponible immédiatement. Le basename et la
restauration `404.html` / `__route` de GitHub Pages restent inchangés.

Mesure Vite sur la même base `cd577fc` (avant/après découpage) :

| JavaScript initial | Avant | Après |
| --- | ---: | ---: |
| Minifié | 1 636,30 kB | 242,60 kB |
| Gzip rapporté par Vite | 432,83 kB | 78,31 kB |

Les dépendances partagées sont extraites par Vite et téléchargées uniquement
quand une route qui les utilise est ouverte. Aucun chunk ne dépasse 500 kB.
Le CSS propre aux pages est aussi différé (CSS initial : 84,84 → 24,62 kB).

Chaque build exécute `scripts/audit-route-bundles.mjs` à partir du manifeste :
16 entrées dynamiques, absence des pages dans les imports initiaux, budget de
300 kB pour le JavaScript initial et 500 kB par chunk. Sa mesure gzip utilise
Node/zlib et peut différer légèrement de celle du rapporteur Vite.

Après le build, `node scripts/test-route-loading.mjs` vérifie en Chromium les
requêtes de l’accueil, le chargement lent, la navigation, le retour arrière et
les 16 liens directs/rechargements avec paramètres et fragment. Il simule la
vraie réponse 404 de Pages plutôt que le fallback SPA de Vite preview.
Ce contrôle complète `scripts/playwright-tools.mjs` dans la CI.

### Variété de composition

`node scripts/audit-portfolio-variety.mjs` mesure les 31 couples sur trois graines,
100 tirages par graine et un historique de génération volontairement borné à 40.
`--baseline-ref=cd577fc` compare au moteur de la PR #211 (la référence doit être présente
dans le clone). Le script garde les registres de données actuels pour isoler le changement
du moteur ; ce n’est pas une comparaison des anciennes données de marché.

Les familles de `portfolio-generator/exposures.js` servent à reconnaître les changements
d’émetteurs et les constructions voisines. Elles ne calculent ni le chevauchement des titres
ni l’identité des rendements. « Proche » = au plus 10 points de capital à déplacer.
La génération essaie jusqu’à 16 candidats nouveaux dans une même recette, et privilégie
le plus éloigné des 20 derniers résultats de son couple. L’historique entier transmis par
l’interface est pris en compte pour éviter les répétitions exactes de familles et de poids.
Si une recette est saturée, le repli conserve impérativement toutes les règles de risque.

### Rappels hebdomadaires du calendrier

`node scripts/data-review-reminder.mjs --report [AAAA-MM-JJ]` lit exclusivement
`buildReview` pour présenter les échéances. `--json` fournit les lots à créer sans
écriture ; `--sync` les ouvre avec `gh api` dans `GITHUB_REPOSITORY`.
La date par défaut est celle de Paris, comme dans l'interface.

La fenêtre utile est de **7 jours**, plus toutes les échéances dépassées : le
calendrier peut afficher « bientôt » à 30 jours sans ouvrir prématurément une
issue. Les offres sont incluses ; les réserves, dates futures, champs sans date et
archives ne déclenchent pas seuls un rappel. Les règles mensuelles, annuelles,
trimestrielles et 13F restent uniquement dans `src/pages/data-review/lib.js`.
Aucune date de contrôle n'est modifiée par ce script.

Les issues sont lues avec pagination complète, ouvertes et fermées. Leurs
marqueurs identifient chaque couple donnée/échéance, sans dépendre du titre ni de
l'état. Fermer une issue acquitte ce rappel ; une nouvelle échéance ou une nouvelle
donnée à la même date reste rappelable. Les lots sont groupés par date, au plus
50 champs par issue pour respecter la limite du corps GitHub. Un lot créé avant
une erreur n'est pas recréé à la relance. Les anciennes issues du cycle fixe
n'acquittent pas implicitement des données qu'elles ne listaient pas.
Le job sérialise les exécutions et reste non bloquant en cas d'échec de GitHub.

Au **3 octobre 2026**, le catalogue récemment audité ne produit aucun rappel à
7 jours. Une série mensuelle à jour jusqu'en septembre est rappelable le
25 octobre pour sa revue du 1er novembre ; les trois 13F le 7 novembre pour le
14 novembre. Ces dates sont des observations du calendrier, pas des règles
recopiées dans le rappel.

Validation : `node scripts/test-data-review-reminder.mjs`,
`npm run audit:data-review`, `npm run build`, puis
`node scripts/test-data-review-calendar.mjs` (Playwright).

## Enrichissement des données du 03/10/2026

- `audit-monthly-history-additions.mjs` (inclus dans `audit:calculator-series`) rejoue les 18 séries ajoutées/remplacées : 11 historiques auparavant espacés et 7 séries monétaires/obligataires. Les captures conservent les réponses mensuelles et les dernières observations quotidiennes. Aucun mois n'est interpolé pour construire ces séries. Le recoupement utilise deux granularités Yahoo, sans fournisseur indépendant.
- CAC 40, LVMH, obligations euro 0–1 an et obligations indexées commencent en janvier 2016 : décembre 2015 présentait un écart quotidien/mensuel non résolu. L'ETF obligataire mondial couvert EUR commence en juillet 2019, premier mois complet de sa cotation disponible. Les autres séries commencent en janvier 2015. Nestlé et SAP restent les ADR en USD. Le CAC 40 reste un indice de prix sans dividendes.
- Les sept séries suivent des produits déjà utilisés, identifiés par ISIN : €STR (XEON), État euro 0–1 et 1–3 ans, obligations mondiales couvertes EUR, indexées sur l'inflation euro, entreprises euro investment grade et high yield. Les cours ajustés simulent les revenus réinvestis ; les frais du fonds sont déjà inclus, contrairement aux frais du courtier et à la fiscalité. Ces séries ne remplacent pas les rendements annuels ni les compositions du générateur.
- `audit-support-enrichment.mjs` contrôle les 52 nouvelles fiches par ISIN contre la capture des profils justETF. Les caractéristiques et frais sont dans les registres communs. Les encours déjà présents gardent leur date ; les nouveaux relevés ne prétendent pas connaître une date de photographie ou un périmètre part/fonds absent de la source. Aucun nombre de positions non daté n'est publié.
- `update-investor-13f.py` suit les 11 profils existants via la tâche quotidienne déjà installée. FolioFact fournit les relevés paginés ; pour Ackman, Tracefour est préféré quand son trimestre est plus récent. Les options sont conservées dans le relevé pour contrôler le total, puis exclues des principales positions sans renormaliser leurs poids. Les requêtes FolioFact sont espacées pour respecter 20 requêtes/minute.
- Lors d'un nouveau trimestre, le précédent est conservé dans `public/data/investors/archive/<profil>/<date>.json` et référencé dans `filingHistory`. Un amendement du trimestre courant ne modifie pas l'archive du précédent. Un relevé incomplet, une erreur fournisseur ou un recul de période interrompt la mise à jour avant l'écriture des fichiers.


## Expositions complémentaires du 03/10/2026

Les six expositions de `src/data/exposure-additions.js` alimentent les registres communs par ISIN : identité, frais, caractéristiques, PEA, cotations, encours et performances. Les dates des positions et des encours restent distinctes. Les chiffres annuels viennent des publications DWS, State Street et iShares ; les frais et dividendes réinvestis sont déjà inclus dans les rendements des parts.

| Exposition | Outils alimentés |
| --- | --- |
| S&P 500 Equal Weight | Présentation ETF, Impact des frais, Comparateur, Coulisses, Générateur, Duels |
| Russell 2000 | Présentation ETF, Impact des frais, Comparateur, Coulisses, Générateur, Duels |
| Dette émergente USD | Présentation ETF, Impact des frais, Générateur rentier, Duels, Cas concrets |
| État euro 15–30 ans | Présentation ETF, Impact des frais, Générateur rentier, Duels, Cas concrets |
| World hors USA | Présentation ETF, Impact des frais, Générateur, Duels ; comparateur et Coulisses déjà présents |
| PEA Global ACWI | Présentation ETF, Impact des frais, Générateur, Duels ; comparateur déjà présent |

Les parts World hors USA et PEA Global n'ont pas six années civiles propres. `simulation-proxies.js` identifie explicitement les bases utilisées dans Générateur et Duels : indice MSCI World ex USA Net USD hors frais ETF, et ancienne part iShares MSCI ACWI USD Acc. Présentation ETF conserve uniquement les années de la part exacte ; le catalogue expose séparément les deux historiques. Les textes exportés des simulations indiquent leur base.

Les nouvelles fiches Coulisses utilisent une présentation de méthodologie : aucun poids sectoriel ou poids d'entreprise n'est inventé pour Equal Weight. Les 500 sociétés sont une cible ; le Russell contient 1 953 titres au 31/08/2026 (publication FTSE Russell). Ses rendements d'indice Total Return USD sont distincts des rendements nets de frais du fonds SPDR. Le nombre de titres du fonds est lui-même distinct du nombre de titres de l'indice.

Berkshire classe B (BRK-B, USD) et ASML Amsterdam (ASML.AS, EUR) disposent de 141 mois continus, janvier 2015 à septembre 2026. La capture `companies-additions-2026-10-03.json` conserve les exportations mensuelles et les dernières séances quotidiennes. `audit:calculator-series` recoupe les clôtures brutes et les clôtures ajustées. Le fuseau de chaque place sert à identifier le mois Yahoo. Calculateur et Performance depuis utilisent les clôtures ajustées ; Il y a X ans utilise les clôtures brutes conservées dans `anniversaryPoints`, afin de comparer des cours cohérents avec une saisie actuelle. Les deux granularités viennent du même fournisseur, sans recoupement indépendant.

Les audits existants couvrent les six supports, les nouvelles recettes et les duels. Playwright parcourt toutes les fiches ETF et Coulisses, exporte aussi les deux nouveaux PNG, et vérifie les deux nouvelles entreprises dans Performance depuis et Il y a X ans.

## Observations des publications

`refresh_purchasing_power.py` collecte les cinq séries INSEE de niveaux, IRL et SMIC.
`refresh_anniversary_levels.py` réutilise les configurations des historiques pour fournir
les niveaux datés du format anniversaire ; l’or conserve sa moyenne mensuelle Banque mondiale.
Le workflow quotidien valide ces fichiers et l’affichage Chromium avant de publier.

`collect_sp_composition.py` complète les compositions Euro Dividend Aristocrats et Global
Dividend Aristocrats Quality Income via leurs fiches S&P exactes. Poppler et Tesseract sont
nécessaires : les lectures des légendes à 250 et 300 dpi doivent concorder.
Les tests `test_sp_composition.py` utilisent les extractions capturées des publications
du 30 septembre 2026 ; toute modification de données actives reste soumise aux audits.

Les rapports sont raccordés au suivi des automatisations avec récupération par source.
Voir `docs/publication-automation.md` pour les conventions, contrôles et limites QYLD/Russell 1000.
