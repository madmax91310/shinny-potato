# Reprise automatique INSEE — #583

Le 14 octobre 2026, la collecte de production avait échoué sur un délai de lecture
BDM. Une nouvelle collecte réelle à 09:31 UTC réussit : série 011814631, dernière
observation septembre 2026, qualité provisoire, aucune valeur modifiée.

Le collecteur conserve BDM comme accès principal et utilise l'autre accès officiel
`https://api.insee.fr/series/BDM/V1` après épuisement des reprises de transport.
Cet accès est référencé par l'INSEE sur https://www.data.gouv.fr/dataservices/api-bdm.
Chaque accès conserve les trois tentatives bornées et la validation XML existante.
Les erreurs d'autorisation, de format et de données ne déclenchent pas le secours.
Une panne des deux accès laisse le workflow en échec et conserve les données actives.
Le rapport indique l'accès réellement utilisé et les échecs de transport antérieurs.

La collecte est désormais quotidienne à 07:15 UTC : elle récupère automatiquement
après une panne et détecte aussi le passage provisoire/définitif. Une observation
inchangée n'écrit ni commit ni déploiement. La surveillance existante exploite le
rapport du passage de production pour résoudre l'incident, sans fermeture manuelle.

Validation : 17 tests de collecte, dont secours sur timeout, refus d'une mauvaise
série, d'un document HTML ou d'un HTTP 403, conservation des données en cas d'échec
et absence de requête supplémentaire quand BDM fonctionne. Le succès local ne
remplace pas la vérification du passage de production après fusion.
