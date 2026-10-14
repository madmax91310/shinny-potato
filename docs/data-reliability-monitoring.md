# Fiabilisation des données — étape 5

Le suivi `automation-status` rassemble les incidents dans « Données à revoir » et une seule issue GitHub réutilisée. Le contrôle tourne après les collectes et toutes les heures, indépendamment du déploiement Pages. GitHub peut retarder un déclenchement planifié ; l’interface signale un bilan non revérifié depuis deux heures.

## Périmètre

- Échecs des collecteurs, distingués des échecs de publication. Les rapports 13F détaillent désormais chacun des 18 investisseurs dans le suivi. Une réussite d’un autre investisseur ne lève pas son incident.
- Collectes silencieuses : cadence et tolérance du registre commun `automation-workflows.json`. Aucun succès n’est déduit d’un état absent ou d’une date future.
- Fraîcheur : même calendrier que l’interface, avec échéances propres aux données, notamment trimestre 13F et dernier mois disponible. Une collecte récente ne rajeunit pas une période ancienne. Réserves historiques et échéances encore à venir ne deviennent pas des incidents de fraîcheur.
- Contradictions de même période déjà identifiées par le radar. Elles restent des vérifications à faire, jamais des mouvements de marché confirmés. Les variations légitimes restent dans les notifications éditoriales du radar.
- Noms, champs, sources et outils utilisant l’actif proviennent du catalogue. Si l’actif n’est pas identifié dans ce catalogue, seul le périmètre du collecteur est indiqué, sans inventer un consommateur précis.

## Cycle et notifications

L’identifiant de l’incident reste stable pendant les tentatives répétées. La date de première détection est conservée ; la date de dernier contrôle progresse. Une disparition vérifiée produit un retour à la normale. Un radar absent ou ancien conserve ses contradictions précédentes et signale sa propre indisponibilité.

Une seule issue regroupe les incidents. Une nouvelle apparition ou une résolution produit un commentaire récapitulatif. Les mêmes incidents répétés ne renvoient rien ; les marqueurs des commentaires du bot évitent le doublon si GitHub a accepté une notification mais que sa réponse a été perdue. L’issue se ferme lorsque tous les incidents sont résolus et se rouvre au prochain incident. Les notifications suivent les abonnements GitHub du propriétaire ; aucun destinataire externe n’est ajouté.

Le suivi est enregistré avant les notifications : un échec d’envoi ne bloque pas les données de l’interface et sera retenté. Le corps de l’issue est borné ; tous les incidents restent dans le JSON et l’interface, avec recherche par actif, champ ou outil. Les 100 derniers retours à la normale restent visibles. Les anciens rappels hebdomadaires ne créent plus d’issues concurrentes ; leur rapport d’audit est conservé.

## Vérification

Tests du cycle échec/répétition/reprise, reprise partielle 13F, cadence silencieuse, dates invalides, fraîcheur indépendante des collectes, contradictions conservées si le radar est indisponible, fermeture/réouverture de l’issue et reprise après réponse réseau perdue. Le test navigateur couvre recherche, champ précis, historique des résolutions, bilan ancien et mise en page mobile.
