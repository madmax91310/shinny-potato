# Radar : reprise des six collectes du 26 octobre 2026

## Incident de référence

[Exécution 40274508210](https://github.com/madmax91310/shinny-potato/actions/runs/40274508210) : producteur `update` réussi, observations publiées, `report-failures` rouge à cause des erreurs partielles. La PR #959 est déjà fusionnée ; ses priorités, regroupements et qualifications ne sont pas repris ici.

## Diagnostic et changements

| Source | Incident observé | Qualification locale du 26 octobre | Action |
| --- | --- | --- | --- |
| Revolut News | HTTP 403 | Liste de 10 documents, article français extrait et daté | Refus intermittent ; garder l’URL officielle et le filtre France. Aucun contournement ni changement de périmètre. |
| La Banque Postale | Page 2 HTTP 403 | Deux pages accessibles, 12 documents, PDF extraits | Défaut de reprise : un 304 de la première page pouvait conserver indéfiniment l’erreur de profondeur. Invalider le cache de découverte tant que l’archive est partielle ; conserver les résultats de page 1. |
| HANetf | Liste vide / format modifié | 9 communiqués découverts, documents extraits | Cause de la page vide historique non démontrée faute de corps HTTP archivé. Défaut actuel reproduit : liens « Read more » pris pour titres. Extraire chaque carte complète avec son vrai titre, exclure navigation/pied de page, renouveler uniquement sa version de découverte. Le mois de la carte ne remplace pas le jour publié dans le document. |
| WisdomTree | HTTP 403 | 22 communiqués découverts, documents extraits | Refus intermittent ; conserver l’archive française officielle. Les autres pays / domaines produits ne constituent pas une couverture équivalente démontrée. |
| DREES | `fetch failed` | HTTP 503 persistant lors du contrôle local | Une seule reprise ordinaire de la même URL sur erreur réseau/serveur temporaire ; aucun succès déclaré sur la seule base d’une page indexée. |
| DARES | Page anti-robot HTTP 200 | Vérification de sécurité persistante | Refus explicite conservé. La route publique `/test-flux-rss` consultée présente aussi une vérification ; aucun flux automatisable alternatif qualifié. |

Les pages DREES indexées et le catalogue OpenData documentent des publications ou données, mais ne prouvent pas une découverte et extraction automatisables équivalentes à ce connecteur. Le nom `www` n’a pas fourni de route qualifiée. Aucune inscription, session authentifiée, résolution de défi, rotation d’IP ou requête masquée n’est utilisée.

Le collecteur distingue `access-denied`, `temporary-unavailable`, `structure-changed` et `processing-error`. Ces catégories décrivent le symptôme, pas une cause racine certaine du fournisseur. Une seule reprise est autorisée pour une erreur de transport ou HTTP 408/425/500/502/503/504. Aucun retry immédiat des 401/403/429, aucune nouvelle tentative avec un signal déjà expiré ; les passages programmés restent responsables des reprises ultérieures. Les compteurs incluent les tentatives supplémentaires.

## Préservation et validation

- Dernières observations, dates et empreintes conservées lors des échecs ; aucune régénération de preuve fournisseur sur une simple relecture.
- IDs de documents, détection initiale, notifications, reçus et règles éditoriales conservés. Aucune notification de test envoyée.
- Fixture HANetf extraite de deux cartes réelles, provenance et empreinte de la page complète enregistrées. Les réponses de panne des tests sont des reproductions synthétiques explicites des statuts constatés.
- Tests : cinq erreurs de source, archive LBP partielle puis reprise sans piège 304, défi HTTP 200, aucune relance d’un 403, retry borné réseau/503, migration HANetf sans cache ni modification des preuves, exclusion du pied de page.
- `npm run test:radar` et huit tests Python DWS réussis. Qualification réelle locale : deux passages, rechargement disque, vérification de conservation sous panne simulée, zéro notification prévue pour l’initialisation. [Rapport local](reports/radar-source-recovery-2026-10-26/local-qualification.json).

La qualification locale et celle de la PR sont distinctes d’une exécution en production. Le workflow conserve le job rouge de signalement lorsque des collectes restent partielles. Fusion, publication et résultats réels doivent être rattachés à leurs exécutions avant toute annonce de réparation en production.
