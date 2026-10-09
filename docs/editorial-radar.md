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

Dans l’appli : compteur des signaux non lus du dernier flux consulté dans la navigation (sans requête réseau depuis les autres outils), filtres, recherche, statut lu mémorisé sur l’appareil, brouillon modifiable et copie. Le radar affiche sa date de contrôle ; après 36 h il ne prétend plus confirmer l’absence de nouveautés. Une erreur de chargement laisse les signaux précédemment chargés affichés.

### Notifications GitHub automatiques

Après publication du flux, le même workflow regroupe les signaux validés non encore notifiés dans une issue attribuée à `madmax91310` et le mentionne explicitement. Chaque signal conserve ses valeurs avant/après, ses périodes de référence, la date de détection et de vérification, les sources ancienne/actuelle, le périmètre, le seuil appliqué, l’outil concerné et un angle éditorial. Les valeurs structurées sont également fournies intégralement. Une exécution sans changement significatif ne crée ni issue, ni commentaire, ni mention. Un lot exceptionnel dépassant la limite du corps d’une issue est découpé en plusieurs issues.

`notifications.json`, sur `radar-data`, garde les identifiants acquittés indépendamment du flux public limité à 500 événements. Au premier déploiement du mécanisme, tous les événements déjà présents dans l’historique sont acquittés silencieusement (notamment l’ancien signal Russell 1000). L’initialisation des observations, les nouvelles références de périmètre et les nouveaux champs sur un produit déjà suivi restent silencieux. Les nouvelles données réellement détectées par les règles existantes après cette référence sont notifiables ; elles ne sont pas présentées comme des lancements.

Le registre initial est publié avec les observations avant l’envoi. Une panne d’Issues n’empêche donc pas la publication quotidienne du radar : le workflow signale l’échec et reprend les événements non acquittés au prochain passage, même si ce passage ne détecte aucune nouvelle variation. Avant chaque envoi, il recherche les marqueurs individuels dans toutes les issues créées par `github-actions[bot]`, ouvertes **et fermées**, avec pagination. Cela évite une deuxième issue après un arrêt entre création de l’issue et enregistrement du registre. Une attribution manquante est réparée sur l’issue existante. Aucune réouverture automatique ni relance sur un événement acquitté. La concurrence de production reste sérialisée, sans annulation et sans push forcé.

Prérequis techniques : les issues du dépôt doivent être activées, `madmax91310` doit être un destinataire attribuable et le job de production dispose de `contents: write` et `issues: write` via `GITHUB_TOKEN`. Les droits sont limités au job exécutant le code de `master` ; la validation de PR reste en lecture seule et ne crée aucune notification. Le script contrôle l’accès aux issues et l’éligibilité de l’attribution lorsqu’il existe un signal à envoyer. Aucun PAT ni service de notification externe n’est nécessaire.

Pour recevoir les alertes :

1. Dans [les paramètres GitHub de notification](https://github.com/settings/notifications), activer **On GitHub** pour les conversations auxquelles le compte participe ; activer **Email** si souhaité et vérifier l’adresse de réception. L’attribution et la mention rendent le compte participant. Il n’est pas nécessaire de suivre toutes les activités du dépôt.
2. Ne pas ignorer le dépôt ni se désabonner des issues radar dont on souhaite les mises à jour.
3. Dans GitHub Mobile (Android : Profil → Paramètres → Configure Notifications), activer les push **Assignments** et **Direct mentions**, autoriser les notifications de l’application dans Android et vérifier les horaires de réception.

Références officielles : [configuration des notifications et de GitHub Mobile](https://docs.github.com/en/subscriptions-and-notifications/get-started/configuring-notifications), [raisons d’abonnement](https://docs.github.com/en/subscriptions-and-notifications/concepts/about-notifications), [attribution via l’API](https://docs.github.com/en/rest/issues/assignees). Les préférences personnelles et la réception effective sur le téléphone ne sont pas vérifiables par le token du dépôt ; la réussite du workflow prouve la création/attribution de l’issue, pas la livraison du push. Le contrôle conditionnel ChatGPT précédemment créé est indépendant : ce changement ne modifie pas ses paramètres.

## Vérifications

`npm run test:radar` : initialisation silencieuse, déduplication, seuils cumulés, scopes, dates, non-régression, conservation après disparition/invalidité, nouvelles années, nouvelles entités et sécurité des liens. Extraction des observations réelles de chaque famille ; parseur de communiqués, anciennes archives, lien étranger, format changé et panne réseau.

La même commande exécute aussi `scripts/test-radar-notifications.mjs` : migration silencieuse, regroupement, attribution/mention, preuves et valeurs complètes, doublons internes et entre exécutions, issues fermées, pagination, reprise après échec ou création sans acquittement, réparation de l’attribution, accès refusé, absence d’issues, sécurité du contenu et découpage des lots volumineux. Aucune notification de test n’est envoyée à GitHub.

`npm run test:radar:browser` : chargement de signaux, filtres, mémorisation de lecture, édition/copie, échec conservant le contenu, contrôle périmé, absence de débordement mobile et état initial vide. Les réponses de flux simulées sont isolées au test navigateur et ne sont jamais enregistrées en production.

Les deux suites sont raccordées à la validation GitHub Pages. Le radar reste automatique en fonctionnement normal ; une panne durable ou un changement de format du fournisseur peut nécessiter une réparation, comme pour les autres collecteurs.
