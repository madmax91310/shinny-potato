# Livraison du plan de correction du 13 novembre, 20:14 UTC

Les causes démontrées sont corrigées : refus d’enregistrement 13F sur écritures ETF indépendantes ; omission de nouveaux chemins dans le manifeste de publication composite ; contrôle de promotion et portées PEA/CTO après expiration des revues externes ; ordre des lectures archivées qui bloquait la recette. Le scellement du manifeste couvre les trois constructeurs composites. Aucun moteur financier ni seuil modifié. Les autres travaux et restrictions restent conservés.

## Documents séparés

- `HISTORIQUES-PERFORMANCES.md` : usages, preuves, six refus et crons.
- `COMPOSITIONS-EXPOSITIONS-13F.md` : réparation, publication, recettes et limites.
- `RELIQUAT.md` : chaque blocage conservé, pièce exacte et prochaine action utile.
- `six-fenetres-refusees-conservees.csv` : six couples exacts actif/année.
- `versions-et-preuves.json` : PR, commits, version de code et version des données réellement servies.
- `matrice-synthetique-memes-identites.csv` : vue lisible des mêmes 35 259 couples donnée/usage.
- `matrice-donnees-usages-actualisee.csv` et `.csv.gz` : matrice détaillée complète, mêmes identités et anciennes preuves conservées ; le gzip ne contient que ce CSV.
- `matrice-delta-verifie.csv` : lignes modifiées et nature de chaque preuve.
- `reconciliation-1218-identites-actualisee.csv` : les 1 218 identités initiales, sans suppression ni renommage.
- `bilan-matrice.json` : unités et dénominateurs explicites.
- `preuves/` : reçus individuels, rapports de source, manifeste, moniteur, recettes navigateur, PNG et résultats de tests.

## Lecture et limites

CSV UTF-8 avec BOM, séparateur point-virgule. La matrice détaillée contient des champs JSON longs ; pour un tableur, utiliser d’abord la vue synthétique. Une ligne est un **couple donnée/usage**, pas un nouveau champ financier certifié. La preuve d’une publication n’est pas celle d’une acquisition ; la réussite d’un gérant ou d’une série ne certifie pas d’autres champs.

Les colonnes suffixées `audit` et les anciens champs conservent leur provenance datée. Les nouvelles observations disposent d’une date et d’une preuve distinctes ; les autres états de l’audit ne sont pas présentés comme une recollecte générale. Les 73/79 fenêtres et les six refus sont un groupe litigieux à périmètre constant, pas tout le catalogue.

Les collectes 13F/or exercées par ce lot sont des `workflow_dispatch` ; la promotion finale est un push de master. La collecte ETF concurrente est également manuelle, distincte de ces corrections. Les crons acquis antérieurement restent distincts ; les prochains créneaux nominaux ne sont pas des succès. Les flux ETF manuels, les deux anciens périmètres inconnus et les incidents hors priorité demeurent tracés dans le reliquat.

Portefeuilles IA reste supprimé, Radar reste arrêté. Aucune publication sur X.

Documents complémentaires : `incidents-publics-finaux-par-cause.csv` conserve les 20 lignes failure sous 11 causes ; `collecte-concurrente-indices-113-resultats.csv` conserve les 113 résultats de contrat individuels, sans les assimiler à des champs tous certifiés. Le moniteur brut complet est fourni séparément en gzip ; les vues 13F/Pages/1218 sont des projections limitées explicitement décrites.

La livraison est vérifiée le 2026-11-14T04:26:45.719307+00:00. Les dates du 13 novembre dans les noms désignent l’audit et le début du lot, pas une date artificielle des observations finales.

Navigateurs éprouvés : Chromium, formats 1440 et 390 px ; Safari et les appareils physiques restent non vérifiés.

## Archive pérenne dans GitHub

Les deux grands CSV sont fournis individuellement en `.csv.gz` dans cette branche de livraison. Après décompression, leurs empreintes correspondent aux noms CSV dans `SHA256SUMS`. Les autres rapports et preuves sont disponibles séparément. Cette branche archive le bilan ; elle ne modifie ni le code publié, ni les registres, ni le suivi unique #881.
