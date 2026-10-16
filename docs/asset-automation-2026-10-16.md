# Automatisation de tous les actifs — 16 octobre 2026

## Modifications

- Qualification réelle de 100 cotations exactes déjà documentées : 71 historiques ont passé les contrôles quotidiens/mensuels ; 5 doublons de séries existantes ont été écartés. 66 nouvelles séries sont raccordées, avec leurs preuves et leurs cours bruts d’anniversaire. Les séries très courtes ne proposent aucun calendrier annuel ou anniversaire incomplet.
- Qualification automatique de 12 candidats par exécution planifiée mensuelle/quotidienne, en commençant par les moins récemment examinés. Une série n’entre dans les outils qu’après contrôle de la cotation, devise, type, continuité, clôtures mensuelles/quotidiennes et dernière séance. Les échecs restent dans `monthly-qualification-status.json`, sans créer de fausse donnée active.
- Archivage des rendements NAV « 1 mois » publiés au dernier jour du mois : preuve et date conservées, mois manquants non interpolés, révision de plus d’un point bloquée. Une seule observation n’est pas présentée comme un historique complet.
- Correction du rapprochement des caractéristiques : la date de publication est comparée à la date de publication antérieure, sans confusion avec le dernier contrôle. Une nouvelle empreinte documentaire à valeurs identiques peut actualiser le contrôle. Les champs conservés ont une provenance distincte des champs réellement observés.
- Collecte élargie des caractéristiques explicites iShares/Amundi/DWS et utilisation des politiques de distribution, domicile et réplication disponibles dans le registre partagé. Aucun statut PEA ni couverture de change n’est déduit.
- Tableau « Couverture par actif et par champ » dans Données à revoir : historique mensuel distinct du calendrier annuel, présence, contrôle, période, source et motif de lacune. Données régénérées à chaque construction et collecte ETF.
- Index de recherche réduit aux champs réellement recherchés pour conserver les budgets JavaScript malgré l’extension des historiques.

## Contrôles en direct

Les 17 produits dont les frais ou encours étaient à recontrôler ont été interrogés : WPEA, SPEA, six WisdomTree, quatre L&G, UBS World, BNP S&P 500, Avantis Small Cap Value, Global X Silver Miners et QYLD. Les observations valides sont appliquées champ par champ avec leur période réelle ; une date de contrôle récente ne change pas une composition mensuelle en composition quotidienne.

## Lacunes conservées explicitement

- QYLD : positions contradictoires et secteurs de référence non qualifiés ; aucun panier de substitution n’est assimilé à l’exposition économique. L’historique mensuel de la cotation exacte QYLE EUR est désormais automatisé, distinct du calendrier NAV USD non publié.
- LifeStrategy : la page officielle britannique supplémentaire contrôlée ne fournit pas d’allocation économique complète pays/secteurs du fonds. La poche actions et les fonds détenus ne sont pas assimilés au portefeuille total.
- Avantis : les pages officielles du produit et des positions complètes renvoient HTTP 403 dans cet environnement. La fiche PDF ne publie que les cinq premiers pays ; leur solde n’est pas attribué artificiellement.
- Silver Miners : la page officielle présente les positions et pays, sans tableau sectoriel complet qualifié.
- Douze parts récentes n’ont pas encore de première année civile complète publiée. Leurs historiques mensuels, lorsqu’ils sont qualifiés, ne deviennent pas un calendrier annuel fictif.
- Certaines cotations Yahoo sont absentes, d’un autre type/devise, trop courtes ou présentent des divergences mensuel/quotidien. Les tentatives automatiques gardent ces motifs ; les tolérances ne sont pas relâchées.
- Les caractéristiques absentes des observations (notamment PEA, couverture de change et certaines cotations) restent identifiées comme manuelles. Le chantier ne prétend pas avoir automatisé 100 % des champs.

Voir `asset-field-coverage.md` et `public/data/asset-field-coverage.json` pour les chiffres régénérés, qui priment sur tout nombre historique.

## Validation

Audits des historiques et preuves, raccordements, propagation d’un nouveau mois, calculs ETF, tests des dates et révisions, rendu serveur des routes et compilation avec budgets. Le test navigateur mobile/ordinateur est raccordé à la CI ; le lancement local Chromium est bloqué par les restrictions de sockets de l’environnement.
