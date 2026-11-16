# Historiques et performances — 16 novembre 2026

Version publique prouvée : codef45c20c2 / donnéesb62c57d4. Voir BILAN.md pour les PR, contrôles et traces originales.

| Donnée | Disponibilité et convention | Actualisation démontrée | Limite |
|---|---|---|---|
| Groupe litigieux79 fenêtres |73 utilisables ; six refus exacts conservés, pas une mesure du catalogue entier | Producteurs et périodes qualifiés préservés, contrôle public `public-financial-window-proof.json` | Aucun nouveau déblocage des six dans ce lot ; ancienne divergence séparée d’une voie indépendante |
| ABTC CH0454664001 | NAV officielle exacte, ajustements et calendrier existants |43865185684 contrôle réel inchangé à octobre2026 ; enregistrement382dfd69 puis publicationb62c57d4 | Exécution manuelle, pas cron observé |
| Bitwise DE000A27Z304 Paris | CotationParis en devise et convention qualifiées ; depuisjuin2021 | Mensuel43865185684 inchangé à octobre ; clôture43865781289 inchangée au13novembre ; sources et registres publiés | L’ancienne voieXetra400 reste distincte ; décembre2020 absent pour2021 |
| Changes historiques BCE/TWD | Méthodes et dates exactes du registre partagé | BCE et secoursFedH10 contrôlés dans43865185684 ; deux timeoutsFRED conservés | Les autres séries de classement non sélectionnées ne sont pas certifiées |
| Neuf iShares, calendriersannuels | NAVtotalreturn selon chaque part ; années complètes jusqu’à2025 | Collecte43836713977 puis publication et20PNG sur10parts avecEXSA | Pays primaires périmés isolés, pas un calendrier mensuel nouveau |
| QuatreL&G | NAVréinvestie annuelle et year_end_date explicite | API réelle mutualisée ; plage glissante corrigée#1341 et tests#1347 | Acquisition2026 encore future, profondeur minimale et lancement conservés |
| Palladium | NAV2025 utilisable/cotation2025 refusée ; cotationdécembre2014 utilisable/NAVdécembre2014 refusée | Voies récentes préservées | Ne pas mélanger NAV, cours et rendement ni annoncer les deux restrictions résolues |

Les six refus : DE000A0H08P6/2019 ; DE000A27Z304/2021 ; FR0010755611/2021et2024 ; FR0013411998/2025 ; FR0013412004/2025. LeCSV individuel donne outils, bornes, résidus et pièces. La réponse officielle Amundi déjà acquise le16novembre indique « Capitalisation and/or distribution » pour les trois partsAmundi ; le qualificateur exige une politique explicitement capitalisante. Une histoiredividende null ne prouve pas zéro. Cette nouvelle preuve explique le blocage d’une voieNAV, pas la cause des quatre anciennes divergences de cours.

77 anciennes divergences et deux résidus restent suivis indépendamment. Ni le calendrier annuel ni le nouveau contrôle courant ne les clôturent. Déclenchements planifiés postcorrectifs non observés au relevé13:24 ; dates nominales et limites dans passages-planifies.json. Préparation721 configurations et fin2026 documentée séparément.


---

# Archive du bilan précédent — état daté, ne pas confondre avec la livraison ci-dessus

# Historiques et performances

Relevé 2026-11-15T23:44:48.417698+00:00. Code public `fdf1b581402f909f04d1e4f6bfe98126742b0c20`, données `eb865db0b760ed5b47fdfd003bf51df60e92a14c`, voie `validated-data`. Suivi unique [#881](https://github.com/madmax91310/shinny-potato/issues/881). Les preuves antérieures restent datées ; ce complément ne les réécrit pas.

| Famille et usages | Résultat acquis | Limite et prochaine preuve |
|---|---|---|
| Producteur mensuel : Performance depuis, simulations, comparaisons et portefeuilles selon les conventions admises | Enregistrement ordinaire 43736125354, commit `dde6d66a`, désormais publié. 28 identités contrôlées et enregistrées. Protection des dépendances financières préservée ; verrou commun avec les observations courantes. | La seule ancienne série mensuelle demandée, `etfDE000A27Z304` Xetra, échoue encore en HTTP 400. Ce résultat individuel reste un échec malgré l’enregistrement des autres sorties. Les 28 identités ne sont pas 28 nouveaux historiques. Cron postcorrectif encore à observer. |
| ABTC CH0454664001 : fiche et voies NAV compatibles | API officielle secondaire réellement acquise dans GitHub 43736125412 ; calendriers exacts USD 2020–2025, contrôle du 15 novembre, observation du 13 novembre. Reprise entre origines seulement sur transport ; pas d’ajustement de split doublé. Texte/PNG et calcul NAV/EUR contrôlés séparément. | La bascule en cas de panne injectée est testée en isolation, pas une panne volontaire en production. Aucune nouvelle fenêtre ancienne libérée. Le succès sur push ne prouve pas le prochain cron. |
| Il y a X ans : clôtures courantes | Producteur ordinaire 43738533282, commit `da10dcbd` ; reçu publié. Bitcoin, Nasdaq 100, MSCI World et Apple vérifiés : valeur, devise, texte et PNG en 1440/390. | Les dates de contrôle ne changent pas la séance observée. Une consultation du dimanche ne fabrique pas une nouvelle clôture. |
| Bitwise DE000A27Z304 | Paris reste opérationnel sur son périmètre ; les contrôles courants exacts sont préservés. | Ancienne voie mensuelle Yahoo/Xetra distincte : requêtes historiques HTTP 400, réponse récente limitée à sept séances et `firstTradeDate` au 5 novembre 2026. Ce champ ne redéfinit pas la création du produit. Décembre 2020 et continuité antérieure manquent encore. |
| WTI, Wheat, Brent, NGAS, or et Bitcoin | Voies et périodes qualifiées préservées ; reprises mensuelles bornées configurées, dernières valeurs valides conservées. | Aucun succès planifié postcorrectif non observé n’est anticipé. Les contraintes exactes par série sont conservées dans la matrice. |
| CoinShares Bitcoin/Ethereum et JEPG | Voies officielles actuelles déjà collectées, enregistrées, publiées et testées ; leur preuve antérieure est conservée sans nouveau sondage inutile. | Calendriers des parts exactes, sans substitution par spot/indice ni extension mensuelle déduite. Les anciennes routes PDF restent tracées séparément. |
| BCE / calendriers annuels, Duels et générateurs | Dernière référence de décembre conforme aux séances TARGET ; collecte MSCI indépendante, résultats des deux étapes séparés. Correctifs concurrents du cache annuel et de l’arrondi repris. | Le change doit exister aux bornes historiques exigées. Un succès composite ne clôture pas une branche source échouée. |
| Groupe constant de 79 fenêtres | **73 fenêtres utilisables préservées, six refus**. Aucun refus levé sans nouvelle preuve financière. | Tableau individuel joint : bornes/ajustements/dividendes manquants. Les 77 anciennes divergences et deux résidus restent distincts de la disponibilité d’une voie NAV indépendante. |
| Palladium | Usages récents autorisés et conventions conservées. | NAV décembre 2014 et cotation 2025 restent deux restrictions distinctes ; leur résolution ne se déduit pas d’une autre période disponible. |

Les prochaines échéances sont nominales, en UTC : mensuel le 16 novembre à 06:15 et reprise ciblée à 06:45 ; ETF à 07:10 ; les reprises or/Bitcoin tardives demeurent configurées les 14/18/22/26/30 selon leurs horaires. Une programmation n’est pas une réussite planifiée observée.

Les étapes acquisition, qualification, enregistrement et publication restent séparées dans les preuves. La panne d’une source ne renouvelle pas la date des valeurs conservées.
