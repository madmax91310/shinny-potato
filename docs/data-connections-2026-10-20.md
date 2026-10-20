# Qualification et raccordement des données — 20 octobre 2026

L'inventaire distingue désormais les observations vivantes, historiques, archives,
hypothèses de simulation, contenus éditoriaux, références et données indisponibles.
Un workflow configuré ne certifie ni la collecte de chaque champ ni sa fraîcheur.
Les modules et champs inconnus restent non qualifiés.

Dans « Revue des données », les raccordements à traiter disposent de leur propre
vue et d'un export `data/data-connections-backlog.csv`. Chaque ligne conserve
l'état de l'observation, le diagnostic de collecte, les sources, les outils
consommateurs et l'action suivante. Les dates de tentative, de réussite et de
preuve restent distinctes. Les anciennes valeurs ne sont pas redatées.

## Dix-sept nouveaux portefeuilles complets

La découverte des sources reconnaît les structures physiques françaises et
allemandes, les endpoints DWS actuels et les fiches SSGA. Les contrôles portent
toujours sur l'ISIN exact, la devise, la structure physique, la date et les poids.
Les réponses sources sont identifiées par SHA-256.

La collecte réelle du [run 39390359291](https://github.com/madmax91310/shinny-potato/actions/runs/39390359291)
a validé les 17 sources sur 17. Le manifeste est conservé dans
`scripts/source-snapshots/live-data-connections-2026-10-20.json`.
Les libellés allemands d'actions permettent de lire les positions, mais ne servent
pas à écraser les classifications sectorielles ou géographiques partagées.

La collecte quotidienne alimente le registre commun et les calculs de recouvrement
DCA. Une modification du collecteur ou de sa configuration sur master déclenche
également une collecte suivie du déploiement normal.

## Rendements QYLD non recertifiés

La page officielle QYLD présente sa table de performance sous « USD Accumulating ».
La présence d'une ligne de cotation de la part distribuante IE00BM8R0J59 ne suffit
pas à attribuer cette table à cette part. Trois observations glissantes manuelles
ont donc été déplacées en archive, avec leurs valeurs et dates initiales.
Elles ne sont plus utilisées comme rendements actuels de la part distribuante.
La preuve de cette qualification est datée et hachée dans le même manifeste.
Un futur collecteur exact peut prendre la priorité sur l'archive.

## Reste à raccorder

Le backlog distingue notamment les connecteurs absents, indices à suivre pour les
ETF synthétiques, fonds de fonds nécessitant une transparisation, erreurs de source,
preuves dépassées, conflits et observations manuelles. Les obligations et ETC ne
sont pas annoncés comme des portefeuilles d'actions collectés : leur état brut
reste visible, avec un périmètre distinct.

Six conditions de courtiers corroborées manuellement et quatorze conditions ou
contrats manquants sont désormais visibles dans ce suivi. Les hypothèses et archives
ne sont pas transformées artificiellement en données financières automatiques.
Les compteurs publiés sont reconstruits à chaque build ; l'export est la référence
opérationnelle, plutôt qu'un total figé dans ce document.

## Contrôles

Les tests vérifient les identités, les libellés localisés, les sources synthétiques
refusées, les dates inchangées après échec et les nouvelles données non qualifiées.
Le navigateur contrôle les calculs de recouvrement avec plus de dix titres communs,
la fiche QYLD et l'inventaire, sur mobile et ordinateur.

En PR, toute erreur de collecte complète bloque la validation. La collecte intégrale
sur le run 39398154323 a validé 120 sources sur 120. En production, une collecte
partielle reste signalée en échec après publication des seules observations validées.
Les tests Python des compositions s'exécutent dans le job Python, où leurs dépendances
HTML sont installées, et restent obligatoires avant le déploiement.
