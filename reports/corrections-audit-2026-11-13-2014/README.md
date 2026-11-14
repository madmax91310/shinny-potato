# Livraison consolidée après l’audit du 13 novembre à 20:14 UTC

Code public : `332ce044c94085ed30eee75445c5f52bf0134d15`. Données : `a4cf51167c2ac3c19b9bc604ff66c70a8fdff8ae`. Contrôle : 2026-11-14T21:46:02.242694+00:00.

- [Historiques et performances](HISTORIQUES-PERFORMANCES.md)
- [Compositions, expositions et 13F](COMPOSITIONS-EXPOSITIONS-13F.md)
- [Reliquat et pièces manquantes](RELIQUAT.md)
- [Matrice complète CSV compressée](matrice-donnees-usages-actualisee.csv.gz) ; CSV brut également disponible dans le dossier de livraison local
- [Matrice synthétique](matrice-synthetique-memes-identites.csv.gz)
- [Rapprochement des 1 218 identités](reconciliation-1218-identites-actualisee.csv)
- [Six fenêtres refusées](six-fenetres-refusees-conservees.csv)
- [Versions et preuves](versions-et-preuves.json)

Même suivi #881, même branche de rapports ; aucune liste parallèle. Les preuves distinguent acquisition, validation, enregistrement, publication et usage, ainsi que manuel/push/planifié. Aucun pourcentage global ni certification indépendante des 35 259 couples.

Contrôle final : moniteur du 14 novembre à 21:24 UTC, 13F collecte/validation/enregistrement/publication réussis, zéro diagnostic 13F en échec dans l’export public complet. Dix PNG 13F et quatre PNG DCA/DWS vérifiés sur ordinateur et mobile. Backend corrigé `3c5b3867`, code public `332ce044`, données `a4cf5116` : compatibilité de la voie de publication des données vérifiée ; aucune modification du code applicatif entre ces versions. L’ancienne alerte d’enregistrement des expositions encore affichée est rapprochée de son successeur publié dans le CSV, sans effacer les tentatives historiques.
