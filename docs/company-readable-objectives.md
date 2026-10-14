# Objectifs lisibles et qualification — 14 octobre 2026

## Périmètre

L'outil calcule des prix futurs conditionnels, pas une valeur intrinsèque actuelle ni un consensus d'objectifs d'analystes. Les projections sourcées de BPA restent distinctes des résultats publiés et des extrapolations. La méthode par multiples est cohérente avec les approches de projection décrites par FAST Graphs et les modèles de multiples du CFA Institute ; elle ne reproduit pas leurs algorithmes propriétaires.

Références consultées :
- https://docs.fastgraphs.com/en/articles/9354268-company-explained
- https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/equity-valuation-concepts-basic-tools
- https://support.simplywall.st/hc/en-us/articles/4751563581071-Understanding-the-Valuation-section-in-the-company-report
- https://advisor.morningstar.com/Enterprise/VTC/MasterEquityResearchMethodology_Oct2020.pdf

Une DCF complète nécessiterait des données et conventions supplémentaires sur les flux, le financement et l'actualisation. Aucun résultat actuel par multiples n'est renommé DCF.

## Contrôles de méthode

Les 26 sociétés actives du catalogue sont des entreprises opérationnelles ; `valuationBusinessType` consigne ce périmètre. Ce marqueur ne constitue pas une certification de qualité ni de prévisibilité. Une société nouvelle non classée, une banque, un assureur ou une foncière n'obtient pas automatiquement ces objectifs. Les contrôles de comptes, de fraîcheur, de nombres d'actions et de définition continuent de s'appliquer séparément.

Les exercices utilisés pour la croissance et les BPA doivent être chronologiques, sans trou annuel (330 à 400 jours, pour tolérer les exercices de 52/53 semaines). Les valeurs observées ne peuvent porter sur un exercice futur par rapport à leur source. Les multiples historiques ont des dates valides, distinctes et ordonnées. Un échec suspend le modèle concerné sans fabriquer les valeurs manquantes.

## Lecture et preuves

`targetExplanation` dérive ses chiffres du scénario effectivement sélectionné : écran et export texte partagent la même explication. Le détail indique la date fiscale utilisée, le dernier exercice estimé par la source et le nombre d'échéances annuelles extrapolées. Ce nombre est une couverture de périodes, pas un pourcentage de confiance ou une décomposition de valeur.

Un scénario prudent/favorable appliqué à une estimation porte le libellé « estimation sourcée avec scénario appliqué ». Une croissance personnalisée devient « réglage personnel » et ne reste pas étiquetée comme consensus. Pour le FCF, les valeurs futures restent des projections du modèle à partir des comptes, jamais des estimations d'analystes. Les références des années de comptes et des multiples proviennent des entrées qualifiées.

Le pont entre cours et objectif est ordonné : variation du fondamental à multiple initial, puis changement du multiple sur le fondamental projeté. L'interaction appartient au second poste. La somme réconcilie exactement le prix avant arrondi. Les rachats/dilutions sont déjà compris dans les valeurs par action et ne sont pas ajoutés une deuxième fois. Ce pont est une décomposition mathématique des hypothèses, pas une attribution causale de rendements observés.

## Limites conservées

La référence historique de valorisation peut rester inadaptée à un changement durable de l'entreprise ou du marché. Les groupes de comparables et leurs pondérations demeurent ceux de la version précédente, à renforcer dans le chantier suivant. La dispersion historique ne fournit aucune probabilité statistique des scénarios. Les comptes annuels courts et les extrapolations demeurent visibles. Aucun score de précision n'est inventé.

Les objectifs numériques et leur version ne changent pas pour les entrées déjà cohérentes : seuls les contrôles d'admission et la présentation sont renforcés. Les anciennes prévisions archivées restent intactes.
