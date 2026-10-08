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

## Compléments et résistance des sources — 8 octobre 2026

Deux réserves ont une preuve officielle explicite et une revalidation quotidienne :

- Trade Republic : les plans programmés PEA sans frais d’exécution, confirmés par la FAQ PEA du centre d’aide. Les frais de garde et de transfert PEA restent distincts.
- Interactive Brokers : transfert entrant PEA décrit dans le guide du Portail Client, associé à la clause publique d’absence de frais de transfert. Les frais du courtier de départ ne sont pas remboursés par déduction.

Les autres réponses inconnues restent inconnues faute de clause officielle de portée suffisante : PEA-PME Trade Republic, PEA-PME/PEA Jeune et achats automatiques PEA IBKR, achats automatiques PEA Fortuneo, rémunération des espèces CTO BoursoBank/Fortuneo/CA IDF/Bourse Direct, change boursier CA IDF et commissions de change/garde PEA Trade Republic.

`broker_document_sources.py` suit les liens des catalogues officiels pour les brochures Fortuneo, Saxo, XTB, CA Île-de-France et Bourse Direct, ainsi que les conditions générales Bourse Direct. La brochure régionale CA IDF est choisie parmi les millésimes publiés, sans substitution de segment professionnel, de DIT ou d’addendum. Les addenda avril/octobre 2026 relus concernent les offres bancaires et successions, pas le barème de courtage ; leur interprétation automatique reste hors de ce parseur.

Lors d’une panne du catalogue, le dernier lien qualifié est privilégié, puis les URL officielles de secours (Fortuneo `/files`, Bourse Direct `.com`). Si le catalogue publie un nouveau PDF inaccessible, ambigu, de portée incorrecte ou dont une clause change, la collecte conserve la dernière observation et signale l’échec. Elle ne recertifie pas un ancien PDF à sa place. Les contrôles existants de date future et de régression restent actifs pour les barèmes.

Chaque observation et référence utilise l’URL effectivement téléchargée ; `discoveryUrl` et `sourceResolution` conservent le catalogue et le mode de résolution. Tests : rotation de lien, domaines et périmètres incorrects, PDF courant indisponible, ancienne clause modifiée, panne/reprise et propagation vers les consommateurs.
