# Radar — limite de requête GitHub, 28 octobre 2026

Après fusion #1014, le producteur ordinaire `40725300073` a conservé les données précédentes
et échoué avec HTTP 422 sur `POST git/blobs`. Reproduction réelle, sans déplacer de branche :

| Sérialisation du même état, preuves déjà dédupliquées | Fichier UTF-8 | Requête JSON réellement envoyée | Réponse |
|---|---:|---:|---|
| Avec indentation | 49 722 358 octets | 53 711 760 octets | 422, « Sorry, your input was too large to process » |
| Compacte, valeurs identiques | 40 703 754 octets | 43 768 962 octets | Blob accepté, SHA `2f90ba896d9085bf22dbe3647a50baf307170f7b` |

Le second encodage JSON nécessaire au corps REST ajoute échappements et octets. Le fichier
interne `state.json` est désormais écrit sans indentation, via un sérialiseur partagé entre
le producteur et la commande locale. Les sources, champs, valeurs, dates, empreintes,
files, lectures et accusés ne changent pas ; feed/summary restent lisibles et inchangés.
Le parseur rétablit les mêmes preuves ; aucun seuil financier ou contrôle supprimé.

Les erreurs de l’API incluent maintenant son message borné, sans en-têtes ni identifiants
secrets, pour éviter de confondre limite de transport et échec de collecte.

Tests : égalité des données après parsing, restitution complète des preuves, redémarrage,
idempotence et réduction mesurée du corps REST avec ses échappements. Les deux appels
API de diagnostic n’ont créé aucun commit, déplacé aucun ref ni envoyé de notification.
La publication réelle de radar-data et la reprise ordinaire seront vérifiées après fusion.
