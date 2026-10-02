# Données à revoir

L’espace `/donnees-a-revoir` sert à la maintenance des données dans l’interface.
Il ne modifie ni les générateurs de tweets ni les exports d’images et ne bloque
pas leur utilisation. Il ne prétend pas certifier automatiquement les sources.

La liste est calculée depuis le catalogue commun et le registre des preuves
courtiers, sans copie des chiffres. Elle propose recherche par nom, ISIN, alias
ou outil, filtres et liens vers les fiches et sources. Les filtres sont conservés
dans l’URL. Les dates du jour suivent Europe/Paris.

Les contrôles de source sont à revoir à partir de 180 jours ; une revue prochaine
est signalée 30 jours avant. Le calcul utilise `checkedAt` ou `checked`, jamais
la date de photographie, la période historique ou la date d’édition d’un contrat.
Une date absente ne devient pas une donnée fausse ou non sourcée. Une date de
contrôle future est signalée séparément. Les sources courtiers sont examinées
individuellement : la consultation récente de l’une ne rajeunit pas les autres.

Les réserves sont dérivées des statuts du registre. Les champs « sans objet »
sont exclus. Les archives `archive-unverifiable` sont comptées séparément et ne
figurent pas dans les tâches actives. Les entrées du catalogue sans consommateur
ne déclenchent pas d’alerte.

Les offres ne sont datées que lorsqu’une échéance explicite est enregistrée dans
leur source via `reviewUntil` (format ISO). Les trois offres Saxo au 31 décembre
2026 reprennent leurs échéances déjà documentées ; aucune date n’est déduite
d’un texte libre. Le dernier jour est inclus, puis l’offre est signalée expirée.
Une prolongation nécessite une vérification et une mise à jour manuelle. Le
panneau ne retire pas silencieusement l’offre des tweets.

Au 30 septembre 2026 : 9 réserves, 36 champs utilisés sans date explicite de
contrôle et 3 échéances à venir. Les 36 champs ne sont pas des valeurs manquantes
ni des preuves d’absence de source. Les compteurs évoluent depuis les registres.

Revue du 2 octobre 2026, après la PR #199 : 16 contrôles supplémentaires clôturés
sur publications retrouvées, dont le TOPIX de juillet. Le MSCI World mensuel a
également été résolu dans la PR #200, intégrée avant cette revue. Il reste 9 réserves
courtiers et 4 champs sans contrôle complet documenté ; les 3 échéances Saxo et
les 16 archives restent séparées. Les tentatives et les preuves encore nécessaires
sont détaillées dans `docs/data-review-2026-10-02.md`. La recherche de sources
ne constitue pas une confirmation lorsque le document est muet ou inaccessible.

Validation : `npm run audit:data-review` contrôle les limites calendaires,
l’exclusion des archives, la distinction photographie/contrôle et les sources
consultées à des dates différentes. Il est exécuté en CI. Playwright vérifie
recherche IBKR, filtres après rechargement, sources des échéances et absence de
débordement à 390 px. Les autres audits continuent de vérifier les générateurs.
