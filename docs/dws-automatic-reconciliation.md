# Réconciliation automatique des compositions DWS

La revue du 14 octobre 2026 retrouve 34 contradictions actives pour cinq ETF.
Les six portefeuilles de la revue initiale et les valeurs historiques restent
archivés dans `scripts/fixtures/radar-review-583/`. Les 34 cas sont reproduits
dans le test de réconciliation ; deux anciens cas du 7 octobre avaient déjà
été résolus par une publication ultérieure.

## Ce qui permet de clôturer une alerte

Le radar relit l’API officielle de chaque portefeuille DWS physique complet
raccordé à l’application. Le parseur existant vérifie les colonnes, la date,
les identités de lignes, les classes d’actifs et les totaux. Les pays et secteurs
sont recalculés à partir de toutes les positions, sans déduire le pays de l’ISIN
ni renormaliser les liquidités et dérivés.

La nouvelle réponse doit correspondre exactement à la version de l’application :
empreinte SHA-256 canonique Python, date, méthode, périmètre et agrégats.
Le radar vérifie à son tour les deux répartitions complètes, y compris les
catégories absentes ramenées à zéro selon les règles déjà en place.

La version doit être stable depuis au moins quatre heures, soit l’intervalle
normal entre deux passages du radar. Le premier passage peut utiliser les
empreintes et horodatages des propositions historiques déjà enregistrées.
Une proposition concurrente plus récente repousse le début de cette période.
Les passages suivants utilisent les contrôles indépendants persistés. Une
nouvelle empreinte ou un échec de vérification recommence la période d’attente.
Relire un ancien rapport ou les fichiers locaux ne constitue pas une confirmation.

Cette politique accepte la version courante stable publiée par l’émetteur.
Elle ne prétend pas prouver quelle ancienne classification était correcte,
ni expliquer rétroactivement chaque déplacement de pays par une transaction.

## Résultat et audit

L’alerte est clôturée comme `verified-source-revision`. L’ancienne observation,
toutes les propositions et les résolutions restent dans l’historique. La valeur
courante et l’ancre du radar sont alignées sur le portefeuille vérifié, sans
produire de signal éditorial. Les anciens signaux fondés sur une période
disputée restent exclus, même après résolution.

Les réponses complètes sont conservées par empreinte sous
`dws-snapshots/<sha256>.json` dans la branche `radar-data`, dans le même commit
atomique que les résolutions. Les données actives ne sont pas modifiées par le
radar : leur collecteur habituel reste responsable des mises à jour.
Toute nouvelle différence de valeur à date identique rouvre automatiquement
l’alerte. Les erreurs de source sont exposées à la surveillance, sans effacer
les dernières données valides.

## Vérifications

- Lecture directe des onze portefeuilles DWS complets raccordés : correspondance
  avec les versions de l’application lors du contrôle du 14 octobre.
- Rejeu de l’état réel : 34 révisions réconciliées, zéro conflit restant et zéro
  signal de marché produit par cette réconciliation.
- Tests : preuves absentes, expirées, futures, d’une autre URL, incorrectes,
  partielles, rejouées, trop récentes, interrompues, puis nouvelles révisions.
- Tests existants du radar, de ses notifications et de la veille inchangés.

L’application en production doit être vérifiée après intégration : branche
`radar-data`, issue #583 et déploiement Pages. L’incident INSEE reste séparé.
