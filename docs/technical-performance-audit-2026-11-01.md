# Mémoire et initialisation des moteurs — 1 novembre 2026

## Défaut démontré

La mesure des exports a révélé une allocation importante dès l'ouverture du
format Anniversaire en mode Simple : environ 266 Mio de tas JavaScript après GC,
avant même la première image. `createFormatEngine` matérialisait d'avance les
listes quadratiques paire × période des modes Comparatif, puis leur copie dans
ALL_ITEMS. Les registres du catalogue grandissent ; ce coût ne dépendait pas du
choix d'utiliser effectivement une comparaison.

Les exports répétés n'étaient pas une fuite démontrée : sur le build témoin,
17 PNG par largeur, GC et quatre allers-retours SPA donnent un tas stable à
~279 Mio après le premier export. Les URL blob actives reviennent à zéro après
leur fenêtre de transfert. Cela distingue l'allocation initiale du moteur des
ressources d'export effectivement libérées.

## Correction circonscrite

Les deux listes de comparaisons se construisent une seule fois, au premier besoin
du mode concerné. Le tableau complet ALL_ITEMS reste un vrai tableau exhaustif,
mémorisé et disponible pour les audits Node et les consommateurs explicites.
Son accesseur d'export porte une annotation pure pour que le build retire une
initialisation inutilisée lorsqu'une route n'importe que le moteur courant.
Aucun Proxy, tableau incomplet ou distinction secrète navigateur/Node.

Les huit paniers du tirage aléatoire gardent leurs poids, ordre et anti-répétition ;
seul le panier tiré doit être construit. Aucune modification des actifs, périodes,
calculs, conventions, qualifications, ordre des paires ou identifiants. Le coût du
premier usage Comparatif existe toujours : il est différé pour les utilisateurs
qui en ont besoin, puis amorti par son cache. Cette PR ne prétend pas résoudre la
complexité quadratique du mode Comparatif lui-même.

## Mesures comparables avant/après

`scripts/measure-audit-performance.mjs <label>` sur deux builds du même code et
des mêmes données, avant/après cette initialisation différée. Chromium local,
trois contextes froids par largeur et par build, CPU ×4 à 390 px et ×1 à 1440 px,
fichiers statiques locaux, trois PNG téléchargés/inspectés par contexte.
Le temps « prêt » comprend chargement, calcul et rendu jusqu'au texte Apple.
Les octets mesurent séparément JS/JSON ; le tas est relevé via CDP après GC forcé,
pas la mémoire totale de Chromium, du GPU ou d'un véritable téléphone.

| Mesure médiane | Avant | Après |
|---|---:|---:|
| Prêt, 390 px CPU ×4 | 2 320 ms | 877 ms |
| Prêt, 1440 px | 721 ms | 471 ms |
| Tas JS avant PNG, 390 px | 266,66 Mio | 6,69 Mio |
| Tas JS avant PNG, 1440 px | 265,84 Mio | 5,89 Mio |
| Tas JS après PNG, 390 px | 278,73 Mio | 18,75 Mio |
| Tas JS après PNG, 1440 px | 278,79 Mio | 18,92 Mio |
| JS/JSON téléchargés | 1 829 027 octets | 1 829 174 octets |
| Export PNG, 390 px (9 exports) | 459 ms | 485 ms |
| Export PNG, 1440 px (9 exports) | 141 ms | 141 ms |

Échantillons mobiles avant : 2 434 / 2 320 / 2 167 ms ; après : 928 / 877 / 774 ms.
Ordinateur avant : 730 / 701 / 721 ms ; après : 471 / 479 / 445 ms.
La baisse de mémoire est répétée dans tous les contextes ; la construction
quadratique supprimée du mode simple en explique la cause. Aucun gain de poids
réseau ou de temps de génération PNG annoncé. Mesures brutes et protocole dans
`technical-performance-measures-2026-11-01.json` ; comparer un autre appareil ou un
réseau 4G exige une nouvelle mesure, ces durées ne sont pas des garanties terrain.

## Non-régression

- Cas synthétiques indépendants : aucun contrôle de paire en mode simple,
  qualification NETR/GRTR conservée au premier Comparatif, listes mémorisées,
  inventaire exhaustif et une qualification par historique. Le test existant est
  déjà raccordé au portail.
- Parité des pools et textes des six formats, bornes et projections Vite.
- Chromium 390/1440, Anniversaire et Performance depuis : simple → comparaison
  Apple/Microsoft → texte et PNG téléchargé → simple ; mêmes actifs, erreurs JS
  absentes. La recette rejoint le manifeste de CI.
- Build complet, architecture, budgets de routes et manifeste public conservés.
  Aucune projection financière régénérée sans rapport incluse dans le diff.
