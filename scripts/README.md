# Scripts d'audit / stress-test

Scripts réutilisables du repo, committés plutôt que recréés ad hoc en session (audit "outils" du
14/09/2026). Chacun s'exécute directement avec `node scripts/<fichier>.mjs` (le repo est en
`"type": "module"`, aucun bundler nécessaire tant que le script importe uniquement des fichiers
`.js`/`.mjs` sans JSX — voir plus bas pour les scripts qui en ont besoin).

## Committés

### `stress-test-portfolios.mjs`

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

## À committer (pas encore fait)

Ces vérifications ont existé sous forme de scripts jetables au fil de la session (créés dans le
scratchpad, jamais ajoutés au repo) mais n'ont pas encore été réécrites comme outils réutilisables :

- **Tests Playwright par outil** — un "write→look once" en navigateur réel (Chromium via
  `/opt/pw-browsers/chromium`) a été fait à la main après chaque changement de données/logique tout
  au long de la session (ex. génération Crypto-Curieux Dynamique, tirage Aléatoire d'Impact des
  frais), jamais formalisé en suite de tests committée par outil.
- **Vérification des générations Tweet Midi** — pas de script dédié écrit cette session pour ce
  format précis ; à construire sur le même modèle que `stress-test-portfolios.mjs` (générer un grand
  nombre de tweets pour chaque format, vérifier l'absence de placeholder non résolu, la cohérence
  des données citées avec leur source — Calculateur pour Anniversaire/Performance, Lexique pour
  Vrai/Faux).
- **Audit croisé ISIN/TER** (Fiches ETF ↔ Tweet Midi ↔ Comparateur d'indices) — le script qui a
  trouvé l'erreur de TER du fonds Quality Factor (0,30% → 0,25%, corrigée le 13/09/2026) était un
  bundle esbuild ad hoc, jamais committé.
