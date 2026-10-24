# Suivi consolidé — validation en cours

Ce lot prolonge #907 et #908 ; il ne recommence pas leur audit et ne qualifie aucune nouvelle convention financière. La coordination initiale figure dans RECONCILIATION.md.

## Corrections des données

L’hydratation Python écrasait 21 séries résidentes certifiées par leurs fragments antérieurs. Les points et preuves authentiques sont restaurés dans ces fragments. Leur identité est conservée ; aucune nouvelle date de collecte, aucun cours et aucune transaction n’est fabriqué. Le certificat global UBS en échec dans le producteur planifié 40062245637 reproduit ce défaut. Les 21 divergences avant/après sont conservées. Le moteur comptable teste réellement toutes les cotations sélectionnables aux dates qualifiées : il ne certifie pas une collecte fournisseur du jour.

## Corrections de supervision

Les incidents de clôture IA visent exclusivement Portefeuilles IA et la route réellement essayée. Tentative, dernière réussite et date du dernier point restent distinctes ; une panne ne renouvelle pas la preuve. Une validation technique défaillante remonte séparément d’une panne de source. L’audit des identités est indépendant du premier test comptable et conserve son issue bloquante.

## Ce qui reste ouvert

Les 79 comparaisons historiques ne sont pas closes par ce lot de stockage : 77 causes anciennes inexpliquées et deux résidus après correction. Les 90 comparaisons originales et leurs preuves sont conservées. Copper/WisdomTree, PEA, continuité Amundi et les limites documentaires gardent leurs pièces manquantes. Une voie NAV sûre ne vaut pas explication d’une ancienne cotation. Le suivi unique réconcilie les 8 600 lignes héritées sans additionner leurs chevauchements ; l’absence d’un ancien contrat ne vaut pas correction.

## Validation

993 tests Python passent sur le dernier état local. Les nouveaux scénarios sont également ajoutés aux contrôles GitHub. Le build et les contrôles de couverture publiable passent. Ces preuves locales ne valent pas validation fournisseur ni publication ; les trois corrections restent en validation dans le suivi jusqu’aux exécutions GitHub et à la vérification du site. Les chiffres de clôtures techniquement qualifiées ne signifient pas qu’il faut recollecter chaque jour les actifs non détenus.

Le bilan, le suivi CSV, les sources héritées et les preuves sont livrés séparément. Le reçu final sera complété après intégration ; aucune résolution en production n’est annoncée ici.
