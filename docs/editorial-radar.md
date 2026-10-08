# Radar éditorial — 8 octobre 2026

Objectif : alimenter les publications d’Épargnant Libre à partir de changements sourcés, sans recherche ou saisie quotidienne. Le bilan des posts publics de juillet à septembre 2026 suggère de privilégier les nouveautés concrètes, les situations auxquelles les lecteurs peuvent se comparer et les ressources de référence. L’échantillon indexé est incomplet : il ne constitue pas un classement exhaustif ni une preuve de causalité. Les formats personnels restent à préparer par l’auteur.

## Fonctionnement

Route `/radar-editorial`, visible en premier sur l’accueil. Les observations validées des collecteurs existants alimentent huit familles : ETF, indices, courtiers, épargne et paramètres réglementaires, SCPI, assurance-vie, investisseurs et repères économiques. Les communiqués ETF de la page officielle Vanguard Europe sont également recherchés automatiquement, même pour un produit absent du catalogue. Ce connecteur ne constitue pas une veille exhaustive de tous les lancements ETF.

Le workflow `update-editorial-radar.yml` s’exécute quotidiennement à 14 h 15 UTC et après la fin des sept collecteurs raccordés. Le collecteur ETF passe à une collecte quotidienne. Les autres collectes conservent leur propre calendrier de publication ; le radar ne crée pas de nouvelle donnée lorsqu’une source ne publie rien.

Seul le code de master est exécuté pour un événement workflow_run. Les événements de pull request et d’un autre dépôt ne peuvent publier. Les tests de PR sont en lecture seule. Les publications sont sérialisées, sans annulation d’un contrôle en cours.

Le flux et son état sont enregistrés atomiquement dans un même commit de la branche `radar-data` : `feed.json` et `state.json`. Chaque relevé contient la révision exacte des données analysées. L’interface charge le flux sans cache et le recontrôle toutes les cinq minutes ; aucun nouveau build n’est nécessaire pour afficher un signal. Le premier relevé crée une référence silencieuse. L’historique complet demeure dans l’état ; les 500 signaux les plus récents sont servis à l’interface.

## Détection

- Frais annuels des ETF : toute variation validée, part exacte.
- Encours : au moins 20 % de variation cumulée, avec même devise et périmètre part/fonds. Aucun flux net n’en est déduit.
- Compositions ETF/indices : variation cumulée de 2 points d’un pays, secteur ou des dix premières lignes publiées. Les paniers de substitution sont exclus du poids des principales lignes.
- Nombre de titres : au moins 5 % et dix titres.
- Courtiers : barèmes numériques et disponibilité confirmée des services ; périmètre et marché exacts. Un changement de texte seul ne suffit pas.
- Livrets, paramètres réglementaires, prix de parts, frais de contrats/SCPI : modifications des valeurs publiées.
- Rendements annuels et repères économiques : nouveau millésime ou révision du chiffre, avec les périodes originales.
- Investisseurs : nouvelle période 13F ou correction des positions et mouvements publiés. Les prix en direct, poids et performances ne sont pas des transactions. Les options sont exclues.
- Communiqués ETF Vanguard : titre, date et lien PDF officiels. Le titre seul ne produit ni ISIN, ni frais, ni affirmation de lancement. Les archives anciennes ajoutées après l’initialisation ne sont pas annoncées comme des nouveautés.

La référence d’un chiffre n’avance qu’après un signal : les petites variations quotidiennes s’accumulent donc jusqu’au seuil. Chaque signal garde les valeurs avant/après, leurs périodes et leurs sources. Un produit nouvellement raccordé est intitulé « nouvelle donnée suivie », pas « nouvel ETF lancé ». L’ajout d’un champ à un produit déjà suivi est silencieux.

## Échecs et notifications

Une donnée absente, périmée, non finie, sans source/date ou plus ancienne ne remplace pas la dernière observation validée. Un changement de périmètre crée une nouvelle référence silencieuse. Une disparition ne devient jamais une fermeture, sortie ou vente supposée. Une source locale entière illisible empêche la publication du nouvel état. Une panne du connecteur Vanguard conserve ses observations et est mentionnée dans les réserves.

Un historique existant illisible n’est jamais réinitialisé. La création initiale de la branche et les deux fichiers sont publiés ensemble. Une mise à jour concurrente empêche le remplacement du pointeur : aucun push forcé. Les échecs du workflow sont raccordés à « Données à revoir ». Les données conservées ne deviennent pas artificiellement fraîches.

Dans l’appli : compteur des signaux non lus dans la navigation, filtres, recherche, statut lu mémorisé sur l’appareil, brouillon modifiable et copie. Le radar affiche sa date de contrôle ; après 36 h il ne prétend plus confirmer l’absence de nouveautés. Une erreur de chargement laisse les signaux précédemment chargés affichés.

La notification hors de l’appli est un contrôle conditionnel ChatGPT du flux GitHub, créé séparément : seuls de nouveaux identifiants de signaux donnent lieu à une notification ; un contrôle sans nouveauté reste silencieux. Ce contrôle n’est pas une notification push native de GitHub Pages. Les autorisations de notification du téléphone et de ChatGPT déterminent l’affichage sur l’appareil.

## Vérifications

`npm run test:radar` : initialisation silencieuse, déduplication, seuils cumulés, scopes, dates, non-régression, conservation après disparition/invalidité, nouvelles années, nouvelles entités et sécurité des liens. Extraction des observations réelles de chaque famille ; parseur de communiqués, anciennes archives, lien étranger, format changé et panne réseau.

`npm run test:radar:browser` : chargement de signaux, filtres, mémorisation de lecture, édition/copie, échec conservant le contenu, contrôle périmé, absence de débordement mobile et état initial vide. Les réponses de flux simulées sont isolées au test navigateur et ne sont jamais enregistrées en production.

Les deux suites sont raccordées à la validation GitHub Pages. Le radar reste automatique en fonctionnement normal ; une panne durable ou un changement de format du fournisseur peut nécessiter une réparation, comme pour les autres collecteurs.
