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


## Suite du29octobre : croissance après la compaction

Le run40796807449 échoue encore sur `POST git/blobs` avec le message explicite de taille excessive. Le corps refusé n'a pas été sauvegardé : sa taille exacte n'est pas attribuée à celle du dernier état valide. Ce dernier reste disponible au commit `d9819db22c95fc7adf24d45ece3dd6018362a4af`, blob `693bc9426ae2dc8904204df8022ea2a87eabfa1a` (41870725octets).

La compaction#1015 est conservée. Quand la requête JSON complète dépasse32Mio, le même état est transporté sans perte sous enveloppe gzip/base64, avec SHA256 et taille décompressée vérifiés. Le budget est technique, indépendant des contrôles financiers. Décompression bornée à256Mio et refus explicite si le corps encodé reste trop grand ; aucune observation supprimée pour tenir dans la limite.

Mesure réelle sur l'état conservé : requête45013494octets →5872664octets, fichier stocké5714240octets. Restitution intégrale et idempotence contrôlées :613événements,7983observations courantes,7990ancres, preuves et files identiques. Le registre des conflits et les métriques restent en clair et vérifiés contre l'intérieur pour le lecteur Python de supervision. Les lecteurs Node partagent le codec ; l'audit Python historique utilise des commits anciens fixes. Flux public, résumé et registre des notifications conservent leur format.

Tests : anciennes formes, reprise ordinaire sans changement de signaux, caractères échappés deux fois, perte de projection, version inconnue, taille/hash/base64 altérés et restitution complète de l'état réel. Source de preuve : `reports/donnees-consolidees-2026-10-24/preuves/reprise-28oct/radar-transport-roundtrip-29oct.json`. Les suites Radar et le build local passent. Une réussite GitHub et un nouveau commit radar-data restent à acquérir après fusion.
