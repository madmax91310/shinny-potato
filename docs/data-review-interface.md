# Données à revoir

L’espace `/donnees-a-revoir` sert à la maintenance des données dans l’interface.
Il ne modifie ni les générateurs de tweets ni les exports d’images et ne bloque
pas leur utilisation. Il ne prétend pas certifier automatiquement les sources.

La liste est calculée depuis le catalogue commun et le registre des preuves
courtiers, sans copie des chiffres. Elle propose recherche par nom, ISIN, alias
ou outil, filtres et liens vers les fiches et sources. Les filtres sont conservés
dans l’URL. Les dates du jour suivent Europe/Paris.

Les échéances sont calculées par type de données et affichées pour chaque champ :

| Données | Prochaine vérification |
| --- | --- |
| Clôtures mensuelles du calculateur | Début du mois suivant celui de la prochaine clôture attendue : septembre présent → 1er novembre ; août seulement → 1er octobre |
| Performances annuelles | 1er janvier après la dernière vérification, pour rechercher la nouvelle année complète ; les séries à période fixe restent historiques |
| Frais, caractéristiques, encours et PEA des ETF | Dernière vérification + 3 mois |
| Photographies de composition des indices | Dernière vérification + 3 mois ; conserver la photographie historique |
| Documents courtiers | Dernière vérification + 3 mois, séparément pour chaque document |
| Statistiques de ménages | Dernière vérification + 12 mois, ou dès nouvelle publication |
| Références, cotations et définitions | Dernière vérification + 6 mois |
| Copies locales des portefeuilles 13F | 45 jours après la clôture du trimestre suivant celui du relevé |
| Offres | Échéance explicite `reviewUntil` |

Les jours de fin de mois sont bornés au dernier jour valide. Les vérifications
sont « à jour », « revue prochaine » dans les 30 jours, ou « à revoir / en retard »
dès l'échéance. Une date de contrôle absente ou future reste à examiner. Les
photographies historiques ne sont jamais réécrites par le calendrier.
Une consultation récente ne décale pas l'échéance d'une clôture mensuelle ou
d'un trimestre 13F manquant. Les trois copies locales 13F (Li Lu, Gates, Klarman)
sont collectées et déployées automatiquement ; la date de récupération est
présentée comme dernière vérification technique, sans certifier le contenu.
Les huit autres portefeuilles sont chargés en direct et ne possèdent pas de
copie locale datée dans ce calendrier.

Les vues « Calendrier des vérifications » et « Dans les 30 prochains jours »
complètent les tâches actives. Un filtre explicite par outil conserve sa valeur
dans l'URL après rechargement. Le calendrier regroupe les échéances de champs
communs, avec les outils consommateurs du catalogue, et les offres. Les réserves
restent dans leur propre vue même après une recherche récente. Les alertes
actives suivent leur priorité puis leur échéance ; le calendrier suit les dates.

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

Au 2 octobre 2026, le nouveau calendrier contient 939 contrôles de champs et
sources, ainsi que les trois offres. Une échéance mensuelle est atteinte pour
l'or (dernière moyenne mensuelle disponible : août). Les 23 autres séries
mensuelles arrivent à échéance le 1er novembre. Les 9 réserves et les 4 contrôles
non datés restent visibles. Les dates ne certifient pas les données et ne
déclenchent pas de recherche automatique supplémentaire.

## Accès pour les mises à jour manuelles

Chaque champ sourcé de la bibliothèque et du calendrier propose un bloc
« Pour préparer la mise à jour ». Les pages et documents sans date figée
restent consultables directement. Une preuve PDF datée propose une recherche
sur le domaine du fournisseur, avec l’ISIN pour les instruments ou le nom de
la fiche pour les autres données. Ce lien est identifié comme recherche :
il ne prétend pas avoir retrouvé ni vérifié la dernière publication.
Les requêtes Yahoo figées disposent d’un lien de consultation manuelle vers
l’historique du même ticker. Aucun appel externe n’est exécuté par l’application.
Pour les ETF, le profil déjà enregistré dans les preuves d’identité complète
les liens de recherche. Les liens identiques sont dédoublonnés.

Les preuves du dernier contrôle, dates, valeurs, exports JSON et échéances ne
changent pas. Les archives non recertifiables ne reçoivent pas de raccourci
pouvant laisser croire qu’elles ont été validées. Avant une mise à jour,
comparer la période, la devise et le périmètre, puis mettre à jour le registre
commun et sa preuve. Les générateurs ne sont pas modifiés.
