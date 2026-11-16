# Neuf voies NAV : nouveau format de périodes glissantes

Le cron43898359717 a acquis711séries, mais refuse neuf voies NAV WisdomTree avec
« Official performance share/currency/convention conflict » (la dixième erreur
concerne l'ancienne voie Bitwise Xetra, indépendante de sa voie Paris utilisable).

La réponse réelle Wheat du16novembre ajoute cinq lignes windowTag=rolling12,
rorWindow=yearOverYear, à des dates de fin de mois. Identité exacte, cotation,
deviseUSD et conventionNAV(TR) restent conformes. Le lecteur refusait le nouveau
tag avant les contrôles des années civiles. Il ne s'agit pas d'une conversion
de devise ni d'un changement de convention financière.

Reconnaître uniquement cette forme publiée, en conservant tous les contrôles
d'identité, de devise, de type NAV(TR) et des diagnostics. Date de fin de mois
non future, rendement numérique fini et absence de doublon obligatoires.
Ces lignes restent inutilisées pour les niveaux, les rendements mensuels et les
corroborations d'années civiles. Les contrôles des bornes quotidiennes de chaque
année complète, les précisions publiées et l'ancrage NAV historique sont inchangés.
Aucune année2026 complète anticipée, aucun ajout de distribution ni réajustement.

La source réelle Wheat conserve1218observations jusqu'au13novembre et quatre
calendriers2022–2025indépendamment rapprochés. Les cinq fenêtres glissantes sont
tracées comme non utilisées ; modifier leur valeur ne modifie aucun niveau.
Les champs contradictoires ou absents restent refusés. Aucun actif ajouté.

Les voies affectées sont Copper, Brent, WTI, Coffee, Artificial Intelligence,
Cloud Computing, Cocoa, Natural Gas et Wheat. Une reprise ciblée du producteur
ordinaire doit qualifier chacune après fusion ; une source locale ne prouve
ni GitHub Actions, ni un passage planifié, ni la publication.
