# Scénarios et suivi des prévisions — version 2

## Écarts propres à chaque société

La trajectoire centrale garde les BPA ajustés annuels sourcés et les multiples comparables de la version 1. Les écarts des scénarios sont désormais calculés avec la dispersion des variations logarithmiques annuelles du CA et des bénéfices publiés (FCF/action pour la méthode cash). Le maximum des deux dispersions est retenu. Deux variations au minimum sont requises ; moins de trois entraîne une majoration de 25 %. L'écart est borné entre 4 % et 40 %, avec un plancher de 12 % en présence de pertes historiques.

Le choc cumulé est `exp(± écart × sqrt(horizon))`. Les multiples prudent/favorable reprennent les quantiles 20/80 de l'historique propre à la société, exprimés relativement à sa médiane puis appliqués au multiple central. Plafonds et planchers explicites évitent des scénarios identiques ou extravagants. Ce sont des sensibilités sous conventions, sans probabilité ni intervalle statistique de confiance. La série courte et la nature GAAP des bénéfices servant au stress sont des limites, pas une mesure de précision du consensus ajusté.

## Construction du FCF

Le modèle projette séparément CA, trésorerie opérationnelle, investissements et actions diluées, sur la base des comptes publiés. La croissance du CA rejoint en trois ans l'ancre de croissance. La marge opérationnelle de trésorerie rejoint sa médiane des trois derniers exercices. Le capex/CA garde le maximum du dernier exercice et de la médiane récente : un programme d'investissement élevé n'est pas effacé pour gonfler le FCF.

La variation des actions repose sur les moyennes diluées comparables, corrigées des splits uniquement après certification. La dilution est plafonnée à 10 %/an. Une baisse observée est plafonnée à 5 %/an, puis réduite par la fraction des rachats couverte par le FCF après dividendes (0–100 %). Sans données de rachats/dividendes, aucune baisse du nombre d'actions n'est extrapolée. Le nombre d'actions n'est appliqué qu'une fois, après les flux totaux. Les rémunérations en actions ne sont pas déduites une seconde fois.

Les anomalies de marge de trésorerie sont signalées, ainsi que la conversion FCF/résultat et la rémunération en actions/OCF. Aucun retraitement automatique d'un « exceptionnel » supposé : les comptes publiés restent intacts. Acquisitions, locations et financement futur restent hors projection explicite. Ce modèle de cours futur est une aide à l'analyse, pas une DCF complète.

AMD rejoint les dossiers FCF sous réserve de quatre exercices positifs, de nombres d'actions publiés réconciliés avec le BPA GAAP, et du contrôle de toute la fenêtre de divisions d'actions. Les sociétés à plusieurs classes d'actions ou à données insuffisantes restent exclues.

## Archive et évaluation prospective

La collecte quotidienne de production écrit dans la branche `company-forecast-history`, séparée du site. `forecasts/DATE-SHA256.json` conserve chaque instantané, sa version du modèle, la révision du code, les sources, les exclusions, les hypothèses et les trois scénarios sur 1/3/5 ans. Le SHA-256 du contenu est vérifié à chaque lecture. Aucune modification/suppression d'une prévision existante n'est permise par le script ; les versions Git fournissent une seconde trace. Même contenu : aucune duplication. Des données différentes le même jour créent un nouvel instantané, sans écraser le premier. Ce n'est pas un stockage inviolable face à un administrateur Git : ses droits habituels restent applicables.

L'archivage débute réellement à la première exécution de production, sans reconstruire artificiellement un passé favorable. Les réglages locaux des visiteurs ne sont pas transmis ni archivés.

Pour le cours, l'évaluation prend la première clôture **observée** dans les sept jours suivant l'échéance et enregistre le délai réel. Il ne s'agit pas forcément de la première séance : un échec de collecte peut décaler l'observation. Une absence de données après sept jours reste visible. Les prix n'incluent pas les dividendes.

Pour les fondamentaux, le contrôle attend la publication du premier exercice fiscal se terminant après l'échéance : BPA ajusté observé de même source/définition, ou FCF/action annuel de même définition. Pour le FCF, ce contrôle utilise le montant annuel projeté archivé, et non sa valeur interpolée à l'échéance du cours. Les dates FCF projetées sont des anniversaires : pour les exercices de 52/53 semaines, une seule observation annuelle de même définition dans une fenêtre de ±14 jours est acceptée, avec conservation de la date réelle. Les BPA ajustés gardent les dates exactes de leur source. La première observation comparable est retenue ; les comptes futurs ne réécrivent pas la prévision initiale.

Une division d'actions dans la période ou une couverture de contrôle insuffisante suspend la comparaison. Aucun facteur de split n'est deviné. L'erreur signée vaut `prévision / constat − 1`, l'erreur absolue sa valeur absolue. Le bilan compare le cours central à la référence naïve « cours inchangé », conserve la présence du constat dans la fourchette et sépare méthode/horizon/version. Les prévisions quotidiennes se recouvrent : leurs erreurs ne sont pas des échantillons indépendants ni un taux de réussite probabiliste.

Les résultats détaillés sont recalculables dans `evaluation.json`, les hypothèses d'origine restent fixes. Le site expose le résumé `src/data/company-forecast-evaluation.json`. Aucun score n'est annoncé avant maturité. Les PR testent une archive temporaire ; seule la collecte de production pousse la branche d'historique.

Les observations fondamentales restent collectées lorsque la société devient déficitaire ou son FCF devient négatif, indépendamment de son éligibilité à de nouvelles projections. Les pertes sont évaluées avec `(prévision − constat) / abs(constat)`. Un constat nul reste évalué en unités par action ; son pourcentage est indéfini et il est exclu du seul dénominateur des erreurs relatives, dont le nombre est affiché séparément.
