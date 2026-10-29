# Comptes rendus des positions complètes

Le rapport ordinaire `40952108356`, artefact `12932361898`, contient 182 observations source réussies et un refus financier World Hedged sur 183 instruments déclarés **avant** la collecte dans son manifeste indépendant. Son bloc `observations` est un dictionnaire de preuves bornées. L'ancien adaptateur le confondait avec une liste d'observations d'un autre producteur ; il produisait alors 183 omissions et conservait notamment les anciennes erreurs 403 WisdomTree, malgré les données effectivement enregistrées et publiées.

Le contrat commun utilise maintenant les listes explicites de succès/échecs de ce seul producteur et leurs preuves individuelles : identité, date de contrôle, période, URL primaire et empreinte. Une preuve absente, invalide ou explicitement sans contrôle source reste une qualification en échec. Le lecteur reconnaît uniquement cette combinaison exacte, sous le format `statuses` déjà autorisé pour ce producteur. Aucun schéma global ni seuil n'est assoupli.

Les URL mutualisées pour identifier les entreprises restent intégralement dans le rapport natif. Elles ne deviennent pas les sources financières de chaque fonds. Les poids, périodes, identités et critères de recouvrement ne sont pas modifiés. Le refus actions brutes/nettes de World Hedged reste entier ; une acquisition réussie ne certifie pas une composition intégrale.

Deux fixtures conservent les octets de l'ancien rapport et son manifeste indépendant, compressés sans perte. Leur relecture **isolée** démontre 182 résultats source et un refus, sans modifier ces archives ni reconstruire un ancien périmètre inconnu. Elle ne constitue pas une nouvelle collecte. La nouvelle exécution ordinaire et son ingestion publique restent à vérifier séparément.

Régressions : résultat individuel absent, preuve invalide, reprise ciblée, cache, interruption, conservation des dates source et de la période, lecture par le moniteur existant, maintien d'une qualification lorsque le manifeste indépendant manque.

Coordination : #1059 conserve les collecteurs WisdomTree, identités et règles financières ; ce lot ne modifie aucun de ses fichiers. #1058 conserve la réparation IMIE. Aucun composant Portefeuilles IA, contrôle financier, image ou format éditorial n'est réintroduit ou modifié.
