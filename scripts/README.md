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
Aléatoire d'Impact des frais. Sort en code 1 si un outil échoue.

Dépend de Chromium pré-installé à `/opt/pw-browsers/chromium` et de `playwright` installé
globalement à `/opt/node22/lib/node_modules/playwright` — aucun des deux n'est une dépendance du
projet, ce script ne tourne que dans cet environnement de session. Lance `vite preview` en groupe de
processus détaché (`detached: true`) pour pouvoir le tuer entièrement à la fin
(`process.kill(-pid)`) — un bug constaté à l'écriture de ce script : `server.kill()` seul ne tue que
le wrapper `npx`, laissant le vrai process `vite preview` tourner en orphelin sur le port.
