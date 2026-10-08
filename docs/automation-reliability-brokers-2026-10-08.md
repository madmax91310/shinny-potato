# Fiabilité des collectes et compléments courtiers — 8 octobre 2026

## Diagnostic après la PR #358

Le run économique 37741352329 échoue uniquement sur la découverte ACPR : les catalogues et le sitemap retournent HTTP 403. Le run réglementaire 37741352343 valide les treize publications DILA et sept barèmes ; Bourse Direct termine sur un délai dépassé. Les données qualifiées et leurs déploiements ont réussi dans les deux workflows. Les jobs finaux signalent volontairement les collectes partielles.

## Changements

- ACPR : ajout de la route publique paginée `etudes-et-recherche?page=0` au parcours de découverte. Elle contient la publication annuelle exacte et conduit au PDF officiel. Le millésime continue à être découvert ; aucun PDF ni taux courant n’est figé dans le code. Collecte réelle réussie du rapport 2025, taux individuel de 2,63 %, net de prélèvements sur encours et avant prélèvements sociaux.
- Bourse Direct : tentative du même document sur le domaine officiel `.com` après un échec du domaine `.fr`. Chaque réponse doit encore satisfaire les contrôles de date, identité, colonnes PEA et marché. La preuve conserve l’URL réellement utilisée ; toutes les causes d’échec figurent dans le rapport. Les deux accès retournent encore HTTP 502 lors des essais locaux. Le connecteur reste non qualifié en production tant qu’aucune collecte réelle ne réussit. La fixture de tableau reste synthétique.
- XTB : la question précise « Peut-on transférer son PEA vers XTB ? » sur la page PEA alimente automatiquement le transfert entrant, la publication, les preuves et le catalogue. La page annonce encore une fonctionnalité à venir. Aucune gratuité issue d’un article sur le transfert de titres CTO n’est attribuée au PEA. Si cette réponse change, le parseur signale le changement et conserve la dernière observation, au lieu de déduire des conditions nouvelles.

Collecte complète locale : sept barèmes et vingt-cinq compléments validés ; Bourse Direct reste seul en échec. Le premier essai GitHub du secours ACPR paginé reste en HTTP 403. Une seconde méthode utilise le client HTTP système sur les mêmes URL HTTPS publiques ACPR/Banque de France après un HTTP 403 de urllib, avec délai, taille et redirections bornés ; les contrôles de contenu restent ceux des parseurs. Son efficacité sur GitHub doit être établie par le run suivant.

## Limites restantes

Les frais de garde et de transfert **PEA** Trade Republic ne sont pas recertifiés par les pages CTO. Le contrat France a été téléchargé et inspecté : il décrit les transferts PEA et renvoie au tarif, sans fournir ici une grille numérique suffisante pour compléter ces frais. La page d’aide France de garde historiquement référencée retourne HTTP 404.

Le change boursier et les conditions financières de transfert entrant Crédit Agricole Île-de-France restent non qualifiés. La brochure régionale décrit les frais de sortie et les frais de correspondant possibles sur les titres étrangers. Sa commission de change figurant dans la rubrique internationale ne peut être assimilée au change boursier ; les offres d’autres caisses ne sont pas substituées.

Les alertes de collecte restent visibles après un succès partiel et ne sont retirées qu’après une exécution complète réussie. Aucun échec n’est masqué pour obtenir un workflow vert.

## Vérifications

Tests Python des parseurs économiques, courtiers et fiscaux ; tests des consommateurs économiques/réglementaires/courtiers ; audits catalogue, provenance et preuves ; build. Les tests du secours Bourse Direct couvrent la conservation après réponses invalides et l’URL de la preuve. Ils ne constituent pas une collecte réelle du courtier.
