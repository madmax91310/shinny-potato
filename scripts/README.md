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

Regroupe toutes les lignes de fonds des 3 sources par ISIN et signale tout ISIN dont le TER diverge
de plus de 0,01 point d'une source à l'autre — reproduit la méthode qui avait trouvé et corrigé
l'erreur de TER du fonds Quality Factor (0,30% → 0,25%) le 13/09/2026. Un ISIN présent dans une
seule source n'est jamais un problème (couverture différente par design) ; seule une vraie
divergence de valeur sur un ISIN partagé est signalée. Sort en code 1 si une divergence est trouvée.
Testé par corruption volontaire d'un TER (restaurée aussitôt) pour confirmer que le script détecte
bien une vraie divergence, pas seulement l'absence de divergence.

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

Un écart supérieur à 1 point fait échouer l'audit, même si la famille porte une note générale.
Deux exceptions par ISIN sont documentées dans le script : iShares MSCI EM IMI (fonds USD versus
proxy de son indice en EUR) et Vanguard FTSE All-World (fonds USD versus proxy MSCI ACWI en EUR).
Elles nécessitent aussi une explication visible côté Comparateur **et** côté Générateur. Les
écarts de 0,25 à 1 point sont affichés pour relecture ; ils ne sont pas automatiquement corrigés.
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
et JEPQ UCITS (2025). L'année 2020 de l'Asie provient de l'indice MSCI Net USD ; celle des
semi-conducteurs et les années 2020-2024 de JEPQ restent `null`, protégées par une assertion.
Les autres proxies sont l'argent converti en EUR à partir de la performance USD et des taux BCE,
les small caps Europe simulées sur l'indice MSCI Europe Small Cap Net EUR (avant frais) et les
obligations haut rendement Amundi simulées via la part iShares. Le
script conserve les références émetteur et ne classe pas ces proxies comme fonds vérifiés.

Le troisième passage du 24/09/2026 recoupe les séries sur indice ou cours. Deux parts
immobilières Amundi passent aux performances « Portefeuille » en EUR publiées par l'émetteur :
**2025 −3,43 %** au lieu de +10,70 %. Les séries MSCI Europe, EM IMI et EM standard sont
recoupées avec MSCI ; MSCI World corrige **2025 +6,77 %** (le +5,35 % était le rendement du
prix sans dividendes) ; MSCI ACWI est corrigé sur les six ans et son proxy Vanguard reste
explicitement identifié comme **MSCI ACWI EUR, pas FTSE All-World**. Les quatre supports or
utilisent une même série LBMA Gold Price PM USD publiée par le World Gold Council :
2020–2025 **+24,6 / −4,3 / +0,4 / +14,6 / +25,5 / +67,4 %**. Les small caps Europe
restent sur l'indice MSCI Net EUR. Le script protège désormais ces 12 séries et garde une
source nommée pour chacun des 17 supports encore fondés sur un indice ou cours.

Les quatre proxies BTC et le proxy ETH ont ensuite été recoupés avec les tableaux annuels
Slickcharts BTC/USD et ETH/USD, dont la méthode déclarée est la variation entre clôtures de
deux années successives. Tous les supports d'une même crypto utilisent désormais exactement
les mêmes valeurs, avec deux décimales. Cette convention peut différer d'une clôture fixée à
minuit UTC ; la série n'est toujours **pas une performance d'ETP**, ne comprend ni ses frais,
ni le change, ni les récompenses de staking de l'ETP CoinShares Ethereum. Les pages émetteur
confirment les ISIN, tandis que Slickcharts fournit uniquement le proxy spot. La part
DE000A27Z304 porte le nom officiel Bitwise Physical Bitcoin ETP.

## `check-freshness.mjs`

Rapport de fraîcheur des données — scanne les `data.js` des 7 outils (Calculateur, Générateur de
portefeuilles, Fiches ETF, Comparatif courtiers, Lexique financier, Duel d'indices, Tweets ETF) et
signale quelles entrées ont une date de sourcing documentée, laquelle, et depuis combien de temps :

```bash
npm run check-freshness           # rapport lisible en console
node scripts/check-freshness.mjs --json   # même scan, sortie JSON pour un script tiers
```

Classe chaque entrée datée en 🟢 récent (< 60j) / 🟡 à surveiller (60-180j) / 🔴 à revérifier
(> 180j), liste séparément les entrées **sans aucune date trouvée** ("non traçable" — un problème
différent de la péremption, cf. commentaire en tête du script), et repère les échéances explicites
du texte (`jusqu'au JJ/MM/AAAA`, ex. la promo Saxo) avec alerte si elles tombent à moins de 30 jours
ou sont déjà passées.

Scan uniquement — **aucune donnée modifiée, aucun appel réseau** (WebFetch reste bloqué dans ce
sandbox de toute façon). Sert à prioriser où porter l'effort de revérification manuelle, pas à
vérifier automatiquement quoi que ce soit. Méthode heuristique (repérage de dates DD/MM/AAAA dans
le texte entourant chaque entrée, pas un parseur strict) — cf. commentaire en tête du script pour
la limite connue sur les commentaires de section partagés par plusieurs entrées.

## `playwright-tools.mjs`

Un test fonctionnel réel (Chromium) par outil, formalisant le "write→look once" fait à la main tout
au long de la session en suite réutilisable :

```bash
npm run test:tools   # build + lance son propre `vite preview` (port 4310) + teste + coupe le serveur
```

Exerce une interaction réelle par outil (jamais juste "la page charge sans erreur") : sélection
d'actif + badges de confiance au Calculateur, génération + somme à 100% au Générateur de
portefeuilles, cycle des 36 fiches ETF, texte du duel par défaut au Comparatif courtiers (lu depuis
la `value` du `<textarea>` — jamais capturé par `innerText()`, piège rencontré à l'écriture de ce
script), cycle des 7 formats de Tweet Midi, cycle des 10 familles du Comparateur d'indices, tirage
Aléatoire d'Impact des frais, cycle des faits de Faits marquants des marchés (ajouté le 22/09/2026 à
la création de l'outil), marquage "publié aujourd'hui" + badge de repos de la Banque de tweets
(ajouté le 23/09/2026 à la création de l'outil). Sort en code 1 si un outil échoue.

Dépend de Chromium pré-installé à `/opt/pw-browsers/chromium` et de `playwright` installé
globalement à `/opt/node22/lib/node_modules/playwright` — aucun des deux n'est une dépendance du
projet, ce script ne tourne que dans cet environnement de session. Lance `vite preview` en groupe de
processus détaché (`detached: true`) pour pouvoir le tuer entièrement à la fin
(`process.kill(-pid)`) — un bug constaté à l'écriture de ce script : `server.kill()` seul ne tue que
le wrapper `npx`, laissant le vrai process `vite preview` tourner en orphelin sur le port.
