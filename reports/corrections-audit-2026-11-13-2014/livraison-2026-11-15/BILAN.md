# Livraison consolidée — automatisation des données

Relevé 2026-11-15T14:13:53.566111+00:00. Code public `bc4b7a73959b4b2b449c2d76329e81431ba8d81e`, données `84597a3943d8516152ceb140120b4de44b16e4c5`. Même suivi [#881](https://github.com/madmax91310/shinny-potato/issues/881). Correctifs : [#1299](https://github.com/madmax91310/shinny-potato/pull/1299) ; [#1303](https://github.com/madmax91310/shinny-potato/pull/1303) ; [#1307](https://github.com/madmax91310/shinny-potato/pull/1307) ; [#1312](https://github.com/madmax91310/shinny-potato/pull/1312) ; [#1313](https://github.com/madmax91310/shinny-potato/pull/1313).

## Corrections et preuves

- #1299 : enregistrement des expositions après changements indépendants et reprises mensuelles tardives or/Bitcoin.
- #1303 : voie officielle CoinShares actuelle, distincte des anciens PDF périmés.
- #1307 : compositions exactes STOXX Europe 600/TOPIX et calendriers officiels JEPG.
- #1312 : borne annuelle BCE, collecte MSCI indépendante, enregistrement sécurisé après ajouts Budget, preuves de stockage distinctes des réussites source.
- #1313 : attendre la fin réelle du rendu PNG dans la recette mobile Budget ; aucune maquette ni formule financière modifiée. La validation PR annulée n’est pas comptée comme réussite : la validation production finale est jointe.

Les nouvelles observations doivent être identiques aux observations validées, présentes dans le manifeste public et consommées dans les parcours testés. Ces trois preuves restent séparées dans [preuves-livraison.json](preuves-livraison.json).

## Rapports séparés

- [HISTORIQUES-ET-PERFORMANCES.md](HISTORIQUES-ET-PERFORMANCES.md)
- [COMPOSITIONS-EXPOSITIONS-13F.md](COMPOSITIONS-EXPOSITIONS-13F.md)
- [PREPARATION-ANNUELLE-2026.md](PREPARATION-ANNUELLE-2026.md)
- [LIMITES-ET-PIECES-MANQUANTES.md](LIMITES-ET-PIECES-MANQUANTES.md)
- [matrice-donnees-usages.csv](matrice-donnees-usages.csv)
- [compositions-usages-dca-expositions.csv](compositions-usages-dca-expositions.csv)
- [compositions-indices-actifs.csv](compositions-indices-actifs.csv)
- [historiques-six-fenetres-refusees.csv](historiques-six-fenetres-refusees.csv)
- [preparation-annuelle-2026-series-configurees.csv](preparation-annuelle-2026-series-configurees.csv)
- [reconciliation-1218-identites.csv](reconciliation-1218-identites.csv)
- [diagnostics-publics-complets.csv](diagnostics-publics-complets.csv)
- [passages-planifies.json](passages-planifies.json)

## Périmètres réconciliés

L’export final réel de l’écran public contient **11034 points** et **15070 signaux**, moniteur du `2026-11-15T13:52:55.481693+00:00`. Chaque diagnostic reste dans l’export ; ces points ne sont pas autant de pannes.

Les **1 218 identités initiales** sont conservées individuellement, avec leur présence actuelle, historique ou résolution prouvée. La matrice conserve **35 259 couples donnée/usage**, sur **10526 identités de donnée** ; aucune certification financière globale n’en est déduite. Les preuves nouvelles sont limitées aux instruments et champs explicitement contrôlés.

Les six fenêtres refusées sur le groupe constant de 79, les restrictions Palladium, les limites WisdomTree/Uranium/Russell/S&P et les photographies LifeStrategy incompatibles restent ouvertes. Une ancienne valeur utilisable ne prouve pas son actualisation. Les passages futurs et janvier 2027 ne sont pas revendiqués par anticipation. **L’automatisation complète n’est pas démontrée.**
