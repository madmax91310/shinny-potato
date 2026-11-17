# Enregistrement mensuel et ETF après changement d’archivage — 16 novembre 2026

Les runs ordinaires 43873059998 et 43873059993 ont collecté et validé leurs observations, puis refusé l’enregistrement : « Protected publication workflow changed beyond the exact Budget artifact addition ». #1357 a ajouté le support `public-portfolio-proof-${{ matrix.shard }}`, #1358 l’a retiré pour restaurer le regroupement Pages. Ce bloc ne modifie aucune commande de validation ni acquisition.

L’adaptateur des deux producteurs reconnaît uniquement l’ajout ou le retrait des sept lignes exactes, immédiatement après la commande navigateur à six partitions. Version de l’action, condition always, nom, chemin, rétention et absence de doublon sont figés. Toute autre différence de workflow reste refusée. Les graphes réels des cinq points d’entrée d’acquisition sont examinés aux deux commits ; si le workflow devient une entrée de collecte, le changement reste refusé.

Aucun chemin n’est ajouté au garde source partagé. Les sorties sont régénérées et la validation financière complète reste obligatoire sur l’arbre combiné. Aucune date de contrôle, valeur, composition ou qualification n’est renouvelée par cet adaptateur. Une nouvelle collecte ordinaire demeure nécessaire pour démontrer la chaîne après fusion ; les rapports de succès non enregistrés ne sont pas publiés aveuglément.

La fixture conserve les deux workflows réels 34859202/c4d8bf6a. Régressions Git isolées : ajout/retrait, permissions, commandes, chemin d’artefact, rétention, nom/version et acquisition dépendante. Les tests préexistants conservent les refus de sources modifiées, sorties financières contradictoires et validations échouées. Le workflow ETF inclut désormais l’adaptateur, son test et cette fixture dans ses déclencheurs et exécute sa régression ; le mensuel surveille aussi la fixture.

Les PR #1356/#1359 (investisseurs), #1253 (S&P), #1061 (PEA) et #1298 sont préservées. Aucun moteur, donnée financière, maquette, élément IA ou collecte Radar modifié. Les défauts fournisseurs et restrictions historiques restent distincts.
