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
