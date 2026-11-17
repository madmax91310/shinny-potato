# Historiques et performances — complément des 16–17 novembre

Relevé de clôture `2026-11-17T02:38:15.222429+00:00`. Code servi `77bd0158205833dddb6a129db9f4304ec0e139bb`, contexte données `fd5cbf64986cc171d207d59fe0e5af3dc2582e99`, voie `validated-data`, construction `2026-11-17T01:09:07.603Z`. Le contexte données n'est pas assimilé à une publication de chaque fichier : `preuves/continuation-20261116/final-public-byte-proof.json` rapproche les empreintes réellement servies et les reçus par périmètre.

| Famille | Disponibilité et mise à jour | Limite |
|---|---|---|
| Neuf NAV WisdomTree : Copper, Brent, WTI, Coffee, Artificial Intelligence, Cloud, Cocoa, Natural Gas, Wheat | Extraction rolling réparée, neuf identités/conventions exactes réellement contrôlées, données mensuelles jusqu'à octobre2026 enregistrées et publiées. Performance depuis vérifiée publiquement dans les formats disponibles. | Calendriers glissants exclus ; source NAV/rendement qualifié distincte des anciennes cotations. Six contrôles par relance ciblée puis trois par producteur ordinaire postcorrectif ; ces évènements ne sont pas des preuves de cron. |
| Bitwise Paris / ABTC | Voies qualifiées et dernières périodes préservées ; sélections, textes calculés et PNG publics vérifiés. | Ancienne route mensuelle Bitwise Xetra toujours400 ; dernier contrôle quotidien séparé refusé pour régression/convention, non reproduit localement et candidat rejeté brut non conservé. Paris a réussi. Une tentative échouée n'est ni une réussite ni une indisponibilité générale de Bitwise. |
| Groupe constant79 |73 fenêtres qualifiées conservées. | Six refus sur cinq parts, liste exacte dans `historiques-six-fenetres-refusees.csv`.77 anciennes divergences et2résidus restent distincts. |
| Palladium | Périodes NAV et de cotation déjà qualifiées conservées. | Décembre2014 NAV et cotation2025 restent séparément refusés. Nouvelle preuve de rapprochement des bornes jointe, aucune donnée remplacée. |

Le tableau `historiques-mensuels-usages.csv` décrit775historiques exposés par les getters publics et3899lignes historique/outil, leurs bornes présentes et leurs restrictions ; ce ne sont ni775collectes fraîchement certifiées ni une admission de toutes les fenêtres.

La première reprise des neuf NAV a bien contrôlé les sources mais son enregistrement a été refusé après modification concurrente de package.json. Ce refus est conservé. Le producteur43959903558 a enregistré six contrôles réussis et trois403 explicites. Le producteur ordinaire postcorrectif contrôle ensuite les trois seuls échecs ; la preuve finale est l'union des neuf résultats individuels publiés, pas une prétendue réussite9/9 du run43959903558. Aucune tentative ancienne n'est réécrite. Le producteur push43958707900 ne contrôlait que l'ancienne voie Xetra : son job vert n'est pas annoncé comme une collecte financière réussie.

Palladium : la borne du31décembre2014 associe NAV23,584359 et niveau10012,1551, facteur424,525216 contre417,715655 aux bornes adjacentes. Un niveau NAV23,96882899 serait implicite si le facteur était constant, soit1,63019% d'écart. Ce calcul d'investigation ne prouve pas quelle composante est fausse et ne justifie aucun remplacement. Il manque la NAV USD officielle contemporaine et la réconciliation exacte de convention/bornes.

Les nouveaux documents Amundi confirment des changements de nom/organisation, pas une absence de distribution ni les facteurs attendus. Les quatre refus Amundi restent justifiés ; lettres et sources exactes sont jointes. Aucune distribution absente déduite comme zéro.

Prochaines observations nominales :17novembre06:45UTC reprise ciblée ;2décembre06:15 collecte mensuelle complète ; clôtures selon le calendrier du producteur. Les preuves Nasdaq antérieures restent acquises, distinctes du cron mensuel postcorrectif encore attendu.

Même suivi [#881](https://github.com/madmax91310/shinny-potato/issues/881), mêmes matrices et identités. 35271 couples donnée/usage conservés, dont 35 259 initiaux ; ce ne sont pas autant de champs financièrement certifiés. Les 1 218 identités initiales sont toutes réconciliées, sans transformer une absence en résolution. L'export public complet contient11437 diagnostics au relevé, catégories dans `denominateurs.json` ; qualifications, attentes, traces historiques et pannes ne sont pas additionnées comme des erreurs financières. Radar arrêté, Portefeuilles IA et Analyse d'entreprise non restaurés, aucune publication sur X.


---

# Archive du bilan précédent — état daté, pas le statut courant

Les preuves de cette version antérieure restent dans le [commit d2c4c9f9](https://github.com/madmax91310/shinny-potato/tree/d2c4c9f9f87ec83c947bf5f6275e8fa804572fac/reports/corrections-audit-2026-11-13-2014/livraison-2026-11-15). Les tableaux ci-dessus et les fichiers courants décrivent le nouveau relevé.

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
