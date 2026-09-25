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
plutôt que le TER — entre `portfolio-generator/data.js` (tableau `r`) et `index-comparator/data.js`
(`perfFunds`). Un mapping explicite relie chaque ligne de performance à l'ISIN du fonds
réellement cité, y compris lorsque la famille présente plusieurs ETF :

```bash
npm run audit:performance-consistency
```

Écrit le 23/09/2026 suite à un signalement utilisateur ayant révélé que le tweet "Dividendes (CTO)"
du Comparateur d'indices portait deux séries de performance fausses depuis leur création, en
désaccord silencieux avec les séries déjà vérifiées pour les mêmes fonds dans
`portfolio-generator/data.js` — un type d'erreur qu'`audit-etf-consistency.mjs` ne pouvait pas
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

Inventaire fermé des 72 supports du Générateur, par provenance du tableau annuel : part de fonds
recoupée chez l'émetteur, indice ou cours utilisé comme proxy, autre fonds/historique mixte,
ou hypothèse générique.

```bash
npm run audit:portfolio-provenance
```

Échoue lorsqu'un support n'est pas inventorié, qu'une série simulée n'a plus d'avertissement
visible dans le tweet, ou qu'un support déclaré en USD perd son indication de devise. Recense
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
Les autres proxies sont l'argent converti en EUR à partir de la performance USD et des taux BCE,
les small caps Europe simulées sur l'indice MSCI Europe Small Cap Net EUR (avant frais) et les
obligations haut rendement Amundi simulées via la part iShares. Le
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
elle reste absente. Les **cinq proxies résiduels** sont CoinShares Bitcoin, 21Shares Bitcoin,
CoinShares Ether, Amundi PEA Monde et iShares petites capitalisations Europe. Les ETP encore
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

Contrôle des historiques mixtes : `argent` reste une conversion indicative des rendements
BlackRock USD en EUR avec les taux BCE. VanEck Semiconductor a été retiré du générateur
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

`npm run audit:publishable-content` vérifie que les 21 faits, 16 thèmes ETF, 36 fiches ETF et
6 cas concrets possèdent leurs champs éditoriaux essentiels et leurs sources lorsqu'ils en
affichent, puis protège trois corrections ciblées : absence de small caps dans FTSE All-World,
absence de performance 2020 pour les deux ETP CoinShares, suppression de moyennes non sourcées
sur les bear markets. Le script ne prétend pas vérifier l'exactitude des autres chiffres ;
ceux-ci restent soumis aux documents des émetteurs et aux audits dédiés.

## `playwright-tools.mjs`

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
