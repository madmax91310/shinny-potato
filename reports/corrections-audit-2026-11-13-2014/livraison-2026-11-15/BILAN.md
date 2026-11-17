# Livraison consolidée — complément des 16–17 novembre, corrections et preuves publiques

Relevé de clôture `2026-11-17T02:38:15.222429+00:00`. Code servi `77bd0158205833dddb6a129db9f4304ec0e139bb`, contexte données `fd5cbf64986cc171d207d59fe0e5af3dc2582e99`, voie `validated-data`, construction `2026-11-17T01:09:07.603Z`. Le contexte données n'est pas assimilé à une publication de chaque fichier : `preuves/continuation-20261116/final-public-byte-proof.json` rapproche les empreintes réellement servies et les reçus par périmètre.

## Corrections livrées

| PR | Avant → après | Portée et preuve |
|---|---|---|
| #1360 | Un bloc d'archivage de sept lignes empêchait l'enregistrement d'observations indépendantes → adaptateur strict et revalidation conservée. | Producteurs ordinaires enregistrés ; aucun contournement du garde source. |
| #1367 | Dérivations LifeStrategy bloquées par des photographies incompatibles → huit dépendances exactes de septembre retrouvées avec leurs preuves originales. Uranium n'actualisait plus les positions connues → sous-ensemble explicitement partiel renouvelable. | Quatre poches actions seulement ; FX inconnus conservés, recouvrement intégral refusé. |
| #1369 | Neuf NAV WisdomTree refusaient un nouveau format rolling12 → lignes reconnues, exclues du calcul calendaire et des niveaux. | Neuf contrôles réels puis enregistrement et publication ; pas neuf nouvelles fenêtres libérées. |
| #1373 | Pays FTSE emprunté à l'indice comparé ; compte HSBC non identifié ; pays primaire iBonds périmé ; deux livres Invesco FR régressifs ; recette Uranium trop générale ; course d'un reçu documentaire ETF. | Colonnes financières strictes, compte exact valorisé, secours pays de risque séparé, voies UK des mêmes parts qualifiées, recette partielle correcte, adaptateur documentaire limité. Sources et reçus réels joints. |
| #1378 | Top10 Invesco datés/attribués à l'indice interne → projection commune pour trois parts ; secours canonique des trois accès NAV et propagation des0,004% non identifiés Uranium. | Fonds/top10/incomplet ; aucune admission d'indice exact ou de recouvrement par ce top10. Projection exacte du build transmise aux tests, six écarts reproduits puis corrigés sans toucher aux attentes financières. |

#1363/#1364/#1370/#1372/#1375 sont fermées car remplacées ou intégrées ; elles ne sont pas comptées comme des livraisons supplémentaires. Les correctifs concurrents #1365/#1366/#1371/#1374/#1376/#1377 et la présentation publique #1359 sont préservés.

## Résultat des sept axes

| Axe | Résultat et limite |
|---|---|
| Publication | Commit public, manifeste, registres et projections vérifiés sur les fichiers effectivement servis ; pas sur la seule couleur du workflow. |
| Collectes ordinaires | Expositions43958707997 et ETF43958708136 acquis, validés et enregistrés ; six NAV contrôlées par43959903558, puis trois autres par le producteur ordinaire postcorrectif (preuves individuelles et union explicite des périmètres jointes). L'ancienne voie Xetra demeure en400, Paris est opérationnel séparément. |
| Outils | 52 téléchargements PNG ciblés récents : présentations ETF 6, DCA et recouvrement 12, performances 22, Coulisses FTSE 2, preuve quatre ETF de l’ancienne publication 6, 13F nouvelles positions 4, sur ordinateur et mobile ; calculs/texte/aperçu et restrictions contrôlés. Les100 PNG du bilan précédent gardent leur date et ne deviennent pas des recettes de ce nouveau code. |
| Compositions | Nouveaux livres Invesco UK et HSBC utilisables, top10 communs raccordés ; maintenance des poches actions LifeStrategy et du sous-ensemble Uranium rétablie. Livres complets insuffisants conservés comme tels. |
| Historiques |73/79 fenêtres préservées, aucune nouvelle fenêtre litigieuse débloquée dans ce complément ; six refus et deux restrictions Palladium conservés avec leurs pièces manquantes. |
| Autonomie | Reprise SCPI réellement automatique après refus d’enregistrement prouvée jusqu’au fichier public ; nouvelle reprise ETF43992136948 déclenchée par le bot, enregistréefd5cbf64 et publiée. Sept anciens refus HTTP de l’annuaire commun contrôlés avec succès, une réponse mutualisée pour sept encours ; les pages produit403 et les livres complets restent distincts. Le cron13F du16novembre est démontré jusqu’aux nouvelles positions publiques et exports ; les autres passages fournisseur postcorrectifs du17novembre restent à observer. Les runs push/manuels ne sont pas des crons. |
| Passage annuel | Raccordements et tests de changement d'année conservés,721 configurations documentées. Acquisition des dernières bornes2026 et publication annuelle restent futures, aucune année complète anticipée. |

Le moniteur est relu après ses mises à jour automatiques :69 diagnostics de panne au relevé00:39,62 au relevé01:04,55 au relevé01:32 ;14diagnostics ne figurent plus dans la catégorie panne, aucune nouvelle panne dans ce différentiel. Les sept anciennes erreurs d’étapes disposent de preuves natives de résolution ; les sept contrôles de l’annuaire sont individuellement requalifiés dans la reprise automatique puis exactement publiés. Le relevé ne déduit aucune réparation de la seule disparition d’une ligne. Ce ne sont pas14réparations financières différentes. L’export final complet contient11437 diagnostics toutes catégories confondues, pas autant de pannes.

L’ancienne alerte de publication onboard du3novembre porte sur quatre parts (World/S&P500/WorldSmallCap/EMIMI). Leurs livres13novembre sont désormais qualifiés par le collecteur commun, enregistrés8f3ce9f, exactement publics et exercés dans six nouveaux PNG. Le garde natif exige une preuve du même workflow pour clôturer son ancienne publication : l’alerte reste visible comme défaut d’attribution de cette voie indépendante ; elle ne prouve pas une indisponibilité actuelle des quatre fonds. Preuve exacte jointe ; aucun rejeu d’intégration/catalogue pour produire un vert.

Les 197 opérations de livres validées comprennent192 fichiers complets, quatre poches actions LifeStrategy et un périmètre direct DWS partiel ; elles ne certifient pas197 recouvrements complets. Huit refus de livres complets restent explicites. AGGH a réussi dans le producteur ordinaire après un refus transitoire ; pas de réparation de parseur inventée. Les six livres WisdomTree, les valorisations GlobalX manquantes, les pièces Russell/S&P et les anciennes divergences financières restent ouverts. **Automatisation complète non démontrée.**

Même suivi [#881](https://github.com/madmax91310/shinny-potato/issues/881), mêmes matrices et identités. 35271 couples donnée/usage conservés, dont 35 259 initiaux ; ce ne sont pas autant de champs financièrement certifiés. Les 1 218 identités initiales sont toutes réconciliées, sans transformer une absence en résolution. L'export public complet contient11437 diagnostics au relevé, catégories dans `denominateurs.json` ; qualifications, attentes, traces historiques et pannes ne sont pas additionnées comme des erreurs financières. Radar arrêté, Portefeuilles IA et Analyse d'entreprise non restaurés, aucune publication sur X.


---

# Archive du bilan précédent — état daté, pas le statut courant

Les preuves de cette version antérieure restent dans le [commit d2c4c9f9](https://github.com/madmax91310/shinny-potato/tree/d2c4c9f9f87ec83c947bf5f6275e8fa804572fac/reports/corrections-audit-2026-11-13-2014/livraison-2026-11-15). Les tableaux ci-dessus et les fichiers courants décrivent le nouveau relevé.

# Livraison actualisée — 16 novembre 2026 — preuves publiques de 13:04 à 13:24 UTC

Code réellement servi : `f45c20c2852644e10bc16df6437e6bc403dfc13f` ; données : `b62c57d432fcb5ef2fefffab772b780dea984905` ; construction finale `2026-11-16T13:04:29.268Z`.
Déploiement complet [43864954307](https://github.com/madmax91310/shinny-potato/actions/runs/43864954307) réussi, avec les contrôles financiers, le build et les recettes navigateur existants. L’artefact effectivement déployé est `github-pages-current-data` **14229040003**, SHA256 `c050ab0e280dad4af165eff31a30199322de5cc9fbcbc708dd643ff122b944de` : ne pas le confondre avec l’artefact de code construit avant insertion des données validées.
Les 62 fichiers publics, 242 registres sources canoniques et 52 chemins exacts de reçus ont été rapprochés ; deux projections sont régénérées et comparées. Huit fichiers de code/entrée/transport du moniteur correspondent octet pour octet à l’artefact Pages. Les observations des neuf ETF précédentes sont conservées dans le conteneur ultérieur ; seule une empreinte de preuve source a changé pour une part, pas les valeurs, méthodes ni dates. Voir les preuves JSON.


Dernière lecture à 13:36 UTC : même code public `f45c20c2`, données désormais `4266a36fa589d52a3a116bddeafcb9868e836ce3`, construction13:25:53.754. Cette publication concurrente modifie uniquement `automated-presentation-actors.json` parmi les242 registres contrôlés ; les241 autres empreintes canoniques du manifeste restent identiques. Les données des100PNG demeurent inchangées. Preuve : `preuves/later-publication-supersession-proof.json`. Les matrices et l’export restent une photographie explicitement datée13:21, pas une prétention de synchronisation permanente.

## Corrections fusionnées et constat public

| PR | Correction effective | Preuve et limite |
|---|---|---|
| [#1341](https://github.com/madmax91310/shinny-potato/pull/1341) et [#1346](https://github.com/madmax91310/shinny-potato/pull/1346) | Neuf parts physiques iShares ne perdent plus tous leurs champs quand leur table pays primaire est périmée. Isolation existante, pays de risque du livre publié, contrôle de structure physique explicite. | Producteur ordinaire push43836713977, enregistrement8a02fb98 ; observations du13novembre. Erreurs pays primaires conservées, aucun seuil relevé ni poids renormalisé. |
| #1341 | Qualification L&G fondée sur la dernière année complète déclarée, au lieu d’une plage figée2020–2025. | API réelle mutualisée pour quatre parts ; passage annuel testé. Aucune performance2026 anticipée, lancement et profondeur conservés. |
| [#1347](https://github.com/madmax91310/shinny-potato/pull/1347) | Assertion du texte portefeuille sur ses vraies bornes qualifiées. | Défaut2021–2026 reproduit avant correction, deux scénarios EUR/NAV janvier2027 passent après. Pas de date de production modifiée. |
| [#1349](https://github.com/madmax91310/shinny-potato/pull/1349) | Recollecte SCPI bornée après refus d’enregistrement sur master devenu périmé ; rapports courants et tentatives séparés. | Push43856006333, 9 résultats/8 SCPI, enregistrement41646f9c et publication vérifiés. Une seule tentative réelle : branche de course testée isolément, pas exercée par ce run. Voir complément concurrent#1355 ci-dessous. |
| [#1352](https://github.com/madmax91310/shinny-potato/pull/1352) | Rapports13F canoniques séparés des tentatives ; relecture exacte d’une copie historique identique. | Exécution43859991189, 26 contrôles sans changement, 2 conflits financiers, enregistrement8dc54036. Copie historique du run43823335908 classée technique sans succès source ; deux erreurs financières conservées. |
| [#1353](https://github.com/madmax91310/shinny-potato/pull/1353) | EXSA/DE0002635307 : territoire Jersey manquant dans le parseur officiel allemand. | Push43864450028, 36/36 résultats natifs validés, enregistrement6c2bab29 publié. Ligne et poids publié0% conservés ; ce zéro provient bien de la source. |

Complément concurrent préservé : [#1355](https://github.com/madmax91310/shinny-potato/pull/1355), fusionné `f9a212db`, renforce la reprise SCPI : refus structuré lié au garde, arrêt après erreur source/financière, dépendances de validation protégées, limite de tentatives et nettoyage. Il n’est pas inclus dans le code public vérifié ci-dessus. Son producteur ordinaire push43873060316 a depuis produit neuf résultats réussis et enregistré604d5407 sur une tentative ; publication de ces nouvelles preuves encore à observer, pas de cron ni course conditionnelle revendiqués. Ne pas présenter la preuve antérieure comme une recette de ce nouveau code. #1354 sur les portefeuilles publics est aussi préservée ; #1356/#1357 sont en cours, sans reprise de leurs fichiers. S&P#1253 et PEA#1061 restent attribuées à leurs chantiers.

## Résultat par outil

| Outil/fonction | Fonctionnement réellement constaté | Limite restante |
|---|---|---|
| Présentation ETF | Dix sélections, texte copié exact, valeurs annuelles peintes, aperçus et20 PNG publics, ordinateur1440/mobile390. Neuf parts iShares et EXSA. | Table pays primaire des neuf parts non réparée ; alternative pays de risque qualifiée. Un top10 n’est pas un livre complet. |
| Performance depuis / Et si / Qui a gagné / DCA / Générateur / Duels | 73/79 fenêtres du groupe litigieux préservées ; BitwiseParis, ABTC et matières premières conservent leurs voies qualifiées. Deux séries mensuelles vérifiées de nouveau par le producteur ordinaire, jusqu’aux registres publiés. | Six fenêtres refusées et deux restrictions Palladium ; calendriers annuels non assimilés à des séries mensuelles. Aucune nouvelle fenêtre débloquée dans ce lot. |
| DCA / Actifs & expositions / recouvrement | Quatre paires publiques, consolidation indépendante des poids bruts et invariance à l’ordre, huit PNG. World/S&P :440 entreprises communes ; LifeStrategy20/40 :4203 ;60/80 :4205 ; EXSA/CoreEurope :371. | Les quatre paires sont partielles : aucun score de recouvrement intégral n’est annoncé. Huit obligations sur les neuf parts n’ont pas de ventilation DCA pays/secteurs applicable ; pas huit usages graphiques inventés. |
| Coulisses des indices | 52 fiches actives rapprochées dans le tableau dédié ; sources natives et substituts distingués. | Aucun livre exact Russell/S&P ou transparisation totale déduit d’un ETF. |
| Investisseurs13F | 26 fiches qualifiées, textes et52 PNG publics ; deux refus visibles sur les deux écrans. Contrôles réellement publiés sur50 chemins du reçu. | Contradictions d’unités Druckenmiller/Klarman.26 vérifications ne sont pas 26 nouvelles déclarations. |
| SCPI | Huit textes et16 PNG publics rapprochés des registres ; contrôle source postfusion et enregistrement/publi validés. | Aucun montant ni date de donnée nouvelle : seul un hash de preuve géographique change. Une consultation ne crée pas un trimestre. Complément#1355 : contrôle source et enregistrement prouvés, publication et branche de course à vérifier. |
| Passage annuel | Plages L&G et textes corrigés ; comportements janvier2027 testés ; tableau des721 configurations et tableau par famille conservés. | Décembre2026, distributions/changes définitifs puis acquisition/publication2026 encore futurs. |

**100 téléchargements PNG réels** sur ordinateur et mobile :20 ETF+52 investisseurs+16 SCPI+8 expositions+4 performances mensuelles ABTC/Paris. Quatre contrôles supplémentaires prouvent les refus13F. Les nouveaux rendus investisseurs et SCPI concurrents sont ceux réellement servis, pas ceux d’une ancienne recette.

## Exécutions et autonomie : unités distinctes

- Sources réellement exercées : ETF43836713977(push), exposition43864450028(push), SCPI43856006333(push), 13F43859991189(manuel), mensuel43865185684(manuel ciblé), clôtureParis43865781289(manuel ciblé).
- Mensuel : exactement `etfCH0454664001Nav` et `etfDE000A27Z304Paris`, inchangés mais contrôlés à la source, jusqu’à octobre2026. ChangeBCE et TWD réellement acquis ; deux tentativesFRED en timeout, secours officielFedH10 qualifié. Les autres statuts de classement du8novembre ne sont pas renouvelés par ce run. Huit des neuf chemins du reçu mensuel sont identiques ; le neuvième, anniversary-levels, est remplacé par la clôture valide ultérieure b62c57d4.
- Clôture : uniquement BitwiseParis, dernière séance13novembre contrôlée sans changement ;705 éléments explicitement non tentés. Cette réussite ne clôture ni l’ancienne voieXetra ni son erreur historique.
- Aucun nouveau cron fournisseur postcorrectif du16novembre n’est visible au relevé13:24. Les crons du moniteur00:04/06:16 sont réussis mais ne prouvent pas un cron fournisseur. Nasdaq conserve ses preuves planifiées antérieures ; pas de nouveau cron mensuel revendiqué.
- Prochaines échéances nominales :17novembre05:35LifeStrategy,06:45reprise mensuelle,07:10ETF,07:20SCPI,07:40clôtures,07:45exposition,12:2513F ; prochain passage mensuel complet2décembre06:15. Ces horaires ne sont pas des réussites garanties. Aucune attente d’un futur cron n’a empêché les corrections indépendantes.
- Les 26 contrats de workflows comprennent21 producteurs conditionnels/ordinaires, trois supports, un contrôle de publication et Radar volontairement arrêté. Ils ne représentent pas 26 collecteurs autonomes démontrés. Le passage25→26 vient du producteur de portefeuilles publics concurrent ; les artefacts et collecteurs sont des unités différentes.

## Suivi consolidé, sans compteur de certification

Export public complet du13:21, moniteur du13:17:47.818654 : **11 302 diagnostics**, dont68failure,254connection,366monitoring,2726qualification,30due,28editorial,4068archive,818waiting,1637nonapplicables et1307history ;15 374 signaux. Les76failure du relevé initial deviennent68 : huit identités quittent ce type, aucune nouvellefailure à ce relevé. LeCSV conserve leur statut, pas huit réparations arbitrairement déduites.

Les 1 218 identités initiales sont toutes conservées :19 résolutions enregistrées dans le moniteur,8 incidents actifs dans l’export,64 qualifications documentaires,25 preuves de supervision,1102 traces historiques/attentes/nonapplicables. Ces19 résolutions sont un état du suivi, pas19 nouvelles corrections de ce lot. Toutes les identités publiques courantes sont également exportées.

La matrice conserve **35 271 couples donnée/usage**, dont les35 259 initiaux et12 ajouts du lot précédent, sans nouveau catalogue. Le consommateur courant projette34 048 couples et30 319 exigences ;1223 anciens couples hors projection sont conservés, pas supprimés ni déclarés réparés. Les4598 champs déclarés et ces couples ne sont pas certifiés financièrement par un workflow vert.24 groupes de preuves mutualisées indiquent leurs champs, instruments, tentatives et limites exacts.

## Blocages et travail restant

Voir `LIMITES-ET-PIECES-MANQUANTES.md`, leCSV des six fenêtres et les deux matrices de composition. Les livres WisdomTree403, FX/identitésUranium, livre natifRussell/S&P, dates compatiblesLifeStrategy, conflitsPEA et financiers demeurent. Les six fenêtres et restrictionsPalladium ne sont pas masquées. L’ancienne publication onboarding41639923023 reste une limite historique : reçu retrouvé, mais les sept empreintes anciennes ne sont pas celles actuellement servies ; aucune clôture sans preuve exacte.

LinxeaVie, ACPR, XTB, fluxETF manuels et autres qualifications restent explicitement visibles ; aucune réparation n’est revendiquée pour ces sources. Les observations des autres outils et leurs dernières dates valides sont conservées. Radar reste arrêté ; IA et Analyse d’entreprise ne sont pas restaurés. Aucune publicationX.

**Conclusion de livraison : corrections ci-dessus fusionnées et publiées ; fonctionnement public démontré sur le périmètre indiqué. L’automatisation complète n’est pas démontrée. Restent des pièces fournisseur, des qualifications, des corrections concurrentes à publier et les passages planifiés/futurs à observer.**

## Fichiers séparés

- `matrice-donnees-usages.csv` : tous les couples, références de preuves mutualisées ; version intégrale avec toutes les colonnes en `matrice-donnees-usages.csv.gz`.
- `reconciliation-1218-identites.csv`, `diagnostics-publics-complets.csv` et `.json.gz`, `rapprochement-76-diagnostics-echec-initiaux.csv`.
- `compositions-usages-dca-expositions.csv` :702 entrées de sélecteur/695ISIN, y compris actions et alias ;535 admissibles sous réserve de paire,106 partielles,60 non applicables,1 bloquée. Pas702fonds ni535 crons prouvés.
- `compositions-indices-actifs.csv` :52 fiches ; `historiques-six-fenetres-refusees.csv`.
- `preparation-annuelle-2026-series-configurees.csv` :721 configurations ; `preparation-annuelle-2026-familles.csv` : méthodes/bornes/workflows/consommateurs/observations futures.
- `preuves/` : comptes rendus source, reçus, octets publics, recettes navigateur, moniteur complet et export UI complet séparés, sans URL signée temporaire.


---

# Archive du bilan précédent — état daté, ne pas confondre avec la livraison ci-dessus

# Livraison consolidée — automatisation des données

Relevé 2026-11-15T23:44:48.417698+00:00. Code public `fdf1b581402f909f04d1e4f6bfe98126742b0c20`, données `eb865db0b760ed5b47fdfd003bf51df60e92a14c`, voie `validated-data`. Suivi unique [#881](https://github.com/madmax91310/shinny-potato/issues/881). Les preuves antérieures restent datées ; ce complément ne les réécrit pas.

## Corrections intégrées et publication

[#1299](https://github.com/madmax91310/shinny-potato/pull/1299) ; [#1303](https://github.com/madmax91310/shinny-potato/pull/1303) ; [#1307](https://github.com/madmax91310/shinny-potato/pull/1307) ; [#1312](https://github.com/madmax91310/shinny-potato/pull/1312) ; [#1313](https://github.com/madmax91310/shinny-potato/pull/1313) ; [#1315](https://github.com/madmax91310/shinny-potato/pull/1315) ; [#1317](https://github.com/madmax91310/shinny-potato/pull/1317) ; [#1319](https://github.com/madmax91310/shinny-potato/pull/1319) ; [#1320](https://github.com/madmax91310/shinny-potato/pull/1320) ; [#1325](https://github.com/madmax91310/shinny-potato/pull/1325) ; [#1328](https://github.com/madmax91310/shinny-potato/pull/1328) ; [#1329](https://github.com/madmax91310/shinny-potato/pull/1329) ; [#1331](https://github.com/madmax91310/shinny-potato/pull/1331) ; [#1332](https://github.com/madmax91310/shinny-potato/pull/1332) ; [#1333](https://github.com/madmax91310/shinny-potato/pull/1333) ; [#1334](https://github.com/madmax91310/shinny-potato/pull/1334) ; [#1335](https://github.com/madmax91310/shinny-potato/pull/1335) ; [#1336](https://github.com/madmax91310/shinny-potato/pull/1336) ; [#1338](https://github.com/madmax91310/shinny-potato/pull/1338) ; [#1339](https://github.com/madmax91310/shinny-potato/pull/1339) ; [#1340](https://github.com/madmax91310/shinny-potato/pull/1340).

- ABTC : reprise bornée entre origines officielles en cas de panne de transport ; identité, devise, bundle et ajustements conservés. Collecte ordinaire réelle 43736125412, événement **push**.
- Enregistrement : sorties DCA, expositions et économie réellement indépendantes identifiées par fichier ; les contrôles des vraies dépendances financières restent obligatoires. Les producteurs mensuel, SCPI et observations ont ensuite enregistré leurs résultats.
- Cause commune supplémentaire : les deux écrivains de `anniversary-levels.json` utilisent désormais le même verrou avant le checkout et jusqu’à l’enregistrement. Une nouvelle exécution ordinaire 43738533282 a enregistré `da10dcbd`, sans fusion aveugle d’observations incompatibles.
- Les correctifs concurrents Performance/BCE, horloges DCA, Budget et identité Medpace ont été réutilisés. #1334 conserve la clé historique exacte de Medpace et son ISIN après régénération ; aucun seuil ni valeur financière n’a été changé pour faire passer la porte.
- #1340 corrige un refus réel de publication du moniteur causé par la taille des périmètres de résultats. Les scopes sont compressés sans perte sous leurs identités SHA ; mêmes plafonds, mêmes contrôles, mêmes résultats. Le nouveau format n’est activé que lorsque son lecteur est effectivement publié.
- La validation complète de publication est 43769258996. Les tentatives précédentes échouées/retirées sont conservées dans les preuves ; elles ne sont pas des réussites. Aucun producteur ni éditeur de données actif n’a été annulé pour les remplacer.

## Preuves séparées

Le contrôle final compare **54 fichiers publics**, **242 registres canoniques** et **66 chemins de reçus producteurs**. Le manifeste, les observations validées et la consommation navigateur restent des preuves distinctes. Les reçus remplacés par une observation ultérieure compatible sont conservés.

Textes, sélecteurs, calculs, aperçus et PNG ciblés ont été vérifiés sur ordinateur et mobile. Les rapports individuels donnent les instruments et champs réellement contrôlés ; cela ne certifie pas tout le catalogue.

## Périmètre conservé

L’export réel de « Données à revoir » contient **11217 points** et **15205 signaux**, moniteur du `2026-11-15T23:34:56.109281+00:00`. Les catégories et identités sont conservées dans les CSV. Un point de qualification ou une attente n’est pas présenté comme une panne.

Les **1 218 identités initiales** restent rapprochées individuellement. La matrice conserve **35259 couples initiaux**, complétés par **12 raccordements courants absents de l’instantané** ; total **35271 couples**, sur **10530 identités de donnée**. Aucun pourcentage de certification financière n’en est déduit.

## Rapports téléchargeables séparément

- [Historiques et performances](HISTORIQUES-ET-PERFORMANCES.md)
- [Compositions, expositions et 13F](COMPOSITIONS-EXPOSITIONS-13F.md)
- [Préparation annuelle 2026](PREPARATION-ANNUELLE-2026.md)
- [Limites et pièces manquantes](LIMITES-ET-PIECES-MANQUANTES.md)
- [Matrice données × usages](matrice-donnees-usages.csv)
- [Diagnostic public complet](diagnostics-publics-complets.csv)
- [Réconciliation des 1 218 identités](reconciliation-1218-identites.csv)
- [Six fenêtres historiques refusées](historiques-six-fenetres-refusees.csv)
- [Compositions utilisées par DCA/expositions](compositions-usages-dca-expositions.csv)
- [Compositions des indices](compositions-indices-actifs.csv)
- [Passages planifiés](passages-planifies.json)
- [Préparation annuelle par série](preparation-annuelle-2026-series-configurees.csv)

**L’automatisation complète n’est pas démontrée.** Les six fenêtres refusées, les restrictions Palladium, les livres/identités/valorisations manquants et les futurs crons restent explicitement ouverts. Radar reste arrêté, Portefeuilles IA et Analyse d’entreprise supprimés. Aucune publication sur X.

## Réparation du moniteur démontrée en production

Exécution ordinaire `43763894004`, puis `43764285969` : publication réussie. Le navigateur public charge le lecteur optionnel, vérifie les périmètres et exporte les résultats complets. Aucun état financier n’est certifié par cette réparation de transport. 3017 périmètres compressés et leurs empreintes ont été vérifiés ; mêmes plafonds et mêmes identités. Recette stricte en 1440/390 : aucune erreur de page ni erreur de santé du moniteur, export intégral cohérent. Les qualifications historiques inconnues restent présentes.

## Résultats par usage

| Usage | Résultat | Réserve |
|---|---|---|
| Présentations ETF / top 10 et expositions compatibles | Nouveau passage ordinaire 43762995148 : 42/42 contrôles pilote réussis ; EM IMI compatible à nouveau, sans relâcher le contrôle de date. | Les branches de source et les livres complets sont qualifiés séparément. |
| DCA, expositions et recouvrement | 50 parts actives qualifiées et 194/205 livres acquis/validés, enregistrés et publiés ; liquidités conservées. Calculs, ordre des actifs, texte, aperçu et PNG contrôlés. | 11 livres refusés. Admission complète dépend aussi de la paire ; aucune extension du catalogue. |
| Portefeuilles investisseurs | 25 qualifiés, 50 PNG ordinateur/mobile ; trois restrictions financières et six refus PNG vérifiés. | Cron 28/28 antérieur à la nouvelle branche SEC : trois nouveaux conflits restent ouverts. |
| Historiques et performances | 73/79 fenêtres, Bitwise Paris, matières premières et clôtures qualifiées préservés. Enregistrements mensuel et observations publiés. | Six fenêtres, deux restrictions Palladium et ancienne série Xetra distinctes ; pas de nouveau mois inventé. |
| Janvier 2027 | 721 configurations réconciliées avec les consommateurs actuels ; comportement du changement d’année testé. | Bornes définitives, qualification et publication 2026 futures, non revendiquées aujourd’hui. |
