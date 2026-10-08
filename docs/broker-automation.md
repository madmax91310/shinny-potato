# Automatisation du comparatif des courtiers

Les huit courtiers et les onze colonnes du comparatif sont couverts par la collecte quotidienne du workflow `update-regulatory-data.yml` à 08:45 UTC. L'audit `python scripts/audit_broker_coverage.py` refuse une colonne dépourvue de collecteur. BoursoMarkets est un produit de BoursoBank, sans objet chez les sept autres établissements.

| Données | Collecteur et source |
| --- | --- |
| Courtage, change, garde, transferts, promotions | Barèmes PDF et pages tarifaires officielles, `collect_broker_tariffs.py` et `broker_tariff_extensions.py` |
| DCA, PEA, PEA-PME, PEA Jeune, IFU, espèces rémunérées, BoursoMarkets | Contrats, barèmes et pages d'aide officielles, `broker_profiles.py` et `broker_profile_sources.json` |

Les observations alimentent le tableau, les textes de comparaison, les visuels et le catalogue. Elles conservent date de consultation, URL, page PDF de la clause, extrait décisif et empreinte du document. Les sources secondaires ne qualifient aucune nouvelle observation automatique.

La collecte distingue disponibilité confirmée, absence explicitement annoncée et réponse inconnue. Une exclusion concernant le PEA ne qualifie pas automatiquement le CTO. Un service générique de courtage ne prouve pas sa disponibilité sur PEA. Les montants variables extraits se propagent aux textes ; les taux variables non qualifiés ne sont pas inventés.

Un téléchargement en échec ou une clause modifiée conserve la dernière observation qualifiée, signale le champ en échec et fait échouer le bilan de production après publication des autres mises à jour. Une nouvelle formulation nécessite une adaptation contrôlée du parseur. Automatiser les contrôles ne rend donc pas toutes les réponses publiques ou certaines.

Validation : captures réelles des sources, mutations de clauses et montants, maintien sur panne et reprise, audits des consommateurs et des réserves, test navigateur des 28 duels et de la page de revue.
