# Automatisation des publications — 8 octobre 2026

Le workflow `update-publication-observations.yml` vérifie chaque jour les cinq séries INSEE et les niveaux des 21 actifs du format anniversaire. Les mises à jour valides passent les calculs, le build et un exercice Chromium avant publication. Les échecs conservent les dernières données vérifiées et sont publiés dans le suivi des automatisations de l’application.

## Pouvoir d’achat

Les séries INSEE sont identifiées par IDBANK, titre complet, champ géographique, fréquence et base. Les prix généraux (011814630), alimentaires (011813717) et d’énergie (011813864) utilisent une base commune 2025, la moyenne des douze mois de l’année de départ et le dernier niveau mensuel publié. Ce ratio évite le cumul de taux annuels arrondis. Les trois séries de prix changent ensemble ; un échec préserve ce groupe entier. Les observations provisoires sont signalées dans le texte et le PNG.

L’IRL (001515333, France métropolitaine) compare le premier trimestre de départ au dernier trimestre publié. Le SMIC mensuel brut pour 151,67 heures (000879877) compare janvier au montant publié en vigueur. Ces deux familles se mettent à jour indépendamment. Un changement d’identité, une période future, un trou dans la série ou une publication trop ancienne est rejeté.

## Anniversaires

Les configurations réutilisent les symboles, devises et variantes des historiques existants. Yahoo fournit des clôtures brutes de séances terminées, MSCI ses niveaux dans la variante exacte, STOXX son indice EUR Net Return. Bitcoin est en USD et CAC 40 en EUR. L’or garde la moyenne mensuelle Banque mondiale en USD par once : aucun cours spot ou contrat à terme ne la remplace.

Le texte et le PNG indiquent la date de chaque observation. Une observation quotidienne de plus de sept jours ou une moyenne d’or de plus de 75 jours n’est plus préremplie. L’utilisateur peut saisir un niveau vérifié ; cette correction porte la mention « Niveau saisi manuellement ». Une saisie invalide bloque copie et export. Deux actifs comparés gardent chacun leur date propre.

## Indices et alertes

Les compositions S&P Euro High Yield Dividend Aristocrats et S&P Global Dividend Aristocrats **Quality Income** sont raccordées à leurs fiches officielles exactes. Les tables natives fournissent les pays, le comptage et le poids cumulé des dix premières lignes. Les poids sectoriels sont imprimés sous forme de contours graphiques : deux lectures Tesseract, à 250 et 300 dpi, doivent donner les mêmes secteurs et poids, un total compatible avec les arrondis et des libellés GICS connus. Toute ambiguïté conserve la photographie précédente. Les poids individuels non publiés restent absents. Les rendements NET et leurs devises continuent d’utiliser les sources distinctes déjà qualifiées.

Les rapports ETF/indices alimentent maintenant le suivi des erreurs au niveau de la source. Une collecte partielle ne masque plus le champ en échec ; seule sa récupération le retire des alertes. Les exécutions de PR n’écrivent jamais le statut de production.

## Limites restantes

- **QYLD IE00BM8R0J59** : le calendrier affiché concerne la part capitalisante IE00BM8R0H36 et des périodes glissantes. La section « Reference Index » contient deux tableaux top dix contradictoires et des secteurs incompatibles avec l’exposition Nasdaq attendue. Les données du panier de substitution ne sont pas l’exposition économique du fonds. Les frais et encours restent automatisés ; les calendriers et expositions attendent une source exacte cohérente.
- **Russell 1000** : la fiche officielle publie un graphique sectoriel raster, des principales lignes sans poids et un comptage daté. L’association fiable des poids aux secteurs n’est pas qualifiée ; la composition précédente reste datée. Les rendements annuels sont déjà automatisés.
- Les fiches S&P sont lisibles dans la collecte locale mais peuvent renvoyer HTTP 403 depuis GitHub. La requête du même document avec des en-têtes publics usuels est aussi essayée ; une interdiction persistante conserve les dernières données vérifiées et remonte dans les alertes.
- VanEck : certaines fiches sont redirigées vers la page d’accueil américaine depuis les runners GitHub ; ce problème préexistant reste signalé.
- Les connecteurs réessaient les sources indisponibles et signalent les erreurs. Un changement de schéma demande toujours une réparation du code.

Validation : fixtures issues des publications du 30 septembre 2026 et des observations INSEE collectées le 8 octobre, tests de calcul, d’identité, de fraîcheur, d’échec partiel et de récupération ; contrôles Chromium pour saisie, dates, PNG et affichage mobile.
