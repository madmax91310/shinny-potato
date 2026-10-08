# Automatisation du comparatif des courtiers

Les huit courtiers et les onze colonnes du comparatif sont couverts par la collecte quotidienne du workflow `update-regulatory-data.yml` à 08:45 UTC. L'audit `python scripts/audit_broker_coverage.py` refuse une colonne dépourvue de collecteur. BoursoMarkets est un produit de BoursoBank, sans objet chez les sept autres établissements.

| Données | Collecteur et source |
| --- | --- |
| Courtage, change, garde, transferts, promotions | Barèmes PDF et pages tarifaires officielles, `collect_broker_tariffs.py` et `broker_tariff_extensions.py` |
| DCA, PEA, PEA-PME, PEA Jeune, IFU, espèces rémunérées, BoursoMarkets | Contrats, barèmes et pages d'aide officielles, `broker_profiles.py` et `broker_profile_sources.json` |

Les observations alimentent le tableau, les textes de comparaison, les visuels et le catalogue. Elles conservent date de consultation, URL, page PDF de la clause, extrait décisif et empreinte du document. Les sources secondaires ne qualifient aucune nouvelle observation automatique.

La collecte distingue disponibilité confirmée, absence explicitement annoncée et réponse inconnue. Une exclusion concernant le PEA ne qualifie pas automatiquement le CTO. Un service générique de courtage ne prouve pas sa disponibilité sur PEA. Les montants variables extraits se propagent aux textes ; les taux variables non qualifiés ne sont pas inventés.

Un téléchargement en échec ou une clause non reconnue conserve la dernière observation qualifiée, signale le champ en échec et fait échouer le bilan de production après publication des autres mises à jour. Les variantes reconnues se revalident automatiquement ; une formulation hors des règles ou ambiguë nécessite encore une adaptation contrôlée du parseur. Automatiser les contrôles ne rend donc pas toutes les réponses publiques ou certaines.

Validation : captures réelles des sources, mutations de clauses et montants, maintien sur panne et reprise, audits des consommateurs et des réserves, test navigateur des 28 duels et de la page de revue.

## Compléments et résistance des sources — 8 octobre 2026

Deux réserves ont une preuve officielle explicite et une revalidation quotidienne :

- Trade Republic : les plans programmés PEA sans frais d’exécution, confirmés par la FAQ PEA du centre d’aide. Les frais de garde et de transfert PEA restent distincts.
- Interactive Brokers : transfert entrant PEA décrit dans le guide du Portail Client, associé à la clause publique d’absence de frais de transfert. Les frais du courtier de départ ne sont pas remboursés par déduction.

Les autres réponses inconnues restent inconnues faute de clause officielle de portée suffisante : PEA-PME Trade Republic, PEA-PME/PEA Jeune et achats automatiques PEA IBKR, achats automatiques PEA Fortuneo, rémunération des espèces CTO BoursoBank/Fortuneo/CA IDF/Bourse Direct, change boursier CA IDF et commissions de change/garde PEA Trade Republic.

`broker_profile_qualification.py` recherche désormais une déclaration explicite pour ces douze champs dans les documents officiels déjà affectés à chacun. Une formulation reconnue au présent confirme automatiquement la réponse, positive ou négative, et publie son extrait, sa source, sa date et sa page PDF. Les montants reconnus restent dans l’extrait sans extrapolation de taux ou de conditions. Les preuves synthétiques des tests ne sont jamais ajoutées au jeu de données publié.

Les règles exigent un énoncé explicite ou une cellule de tableau sans ambiguïté, avec le périmètre exact : achats automatiques sur PEA, espèces du CTO, garde du PEA, change du PEA ou opérations boursières dans le barème régional CA IDF. Une mention générique, un versement programmé, une annonce future ou conditionnelle, le change Visa et les frais bancaires restent insuffisants. Des clauses reconnues concurrentes suspendent la qualification. Si une preuve précédemment confirmée disparaît, sa date ne change pas : elle est conservée et le champ est signalé en échec jusqu’au rétablissement de la preuve.

Cette surveillance s’exécute chaque jour à 08:45 UTC. Elle ne parcourt pas librement tout le Web. Un domaine ou un format hors des règles reconnues nécessite encore une adaptation contrôlée. La recherche complémentaire du 8 octobre n’a fourni aucune nouvelle clause officielle suffisante pour lever ces douze réserves.

`broker_document_sources.py` suit les liens des catalogues officiels pour les brochures Fortuneo, Saxo, XTB, CA Île-de-France et Bourse Direct, ainsi que les conditions générales Bourse Direct. La brochure régionale CA IDF est choisie parmi les millésimes publiés, sans substitution de segment professionnel, de DIT ou d’addendum. Les addenda avril/octobre 2026 relus concernent les offres bancaires et successions, pas le barème de courtage ; leur interprétation automatique reste hors de ce parseur.

Lors d’une panne du catalogue, le dernier lien qualifié est privilégié, puis les URL officielles de secours (Fortuneo `/files`, Bourse Direct `.com`). Si le catalogue publie un nouveau PDF inaccessible, ambigu, de portée incorrecte ou dont une clause change, la collecte conserve la dernière observation et signale l’échec. Elle ne recertifie pas un ancien PDF à sa place. Les contrôles existants de date future et de régression restent actifs pour les barèmes.

Chaque observation et référence utilise l’URL effectivement téléchargée ; `discoveryUrl` et `sourceResolution` conservent le catalogue et le mode de résolution. Tests : rotation de lien, domaines et périmètres incorrects, PDF courant indisponible, ancienne clause modifiée, panne/reprise et propagation vers les consommateurs.

## Découverte des sources et variantes d’extraction

`broker_profile_discovery.py` complète les documents des douze périmètres encore inconnus. Trois nouveaux points d’entrée sont raccordés : FAQ Bourse Fortuneo, page CTO BoursoBank et guide des types de comptes IBKR. Les FAQ PEA/frais Trade Republic, les pages régionales CA Île-de-France et les contrats/tarifs Bourse Direct déjà connus servent également d’entrées adaptées à chaque champ.

La découverte suit un niveau de liens pertinents, avec au plus huit candidats par champ, cache partagé et téléchargements bornés. Elle exclut navigation, cartes, livrets, assurance, espace de connexion, pages pédagogiques/comparatifs et sources d’une autre caisse. Une URL HTTPS, un domaine et un chemin autorisés sont obligatoires ; les redirections des documents dans ces périmètres sont contrôlées avant d’être suivies. L’URL finale et la page de découverte restent dans la preuve. Les liens découverts ont une identité stable dérivée de leur URL et ne modifient pas le registre global en mémoire.

`profileDiscovery` conserve les pages consultées, leurs empreintes, les candidats et les erreurs pour chacun des douze champs. Un inventaire dépassant la limite ou une source inaccessible est un échec visible : le collecteur conserve l’observation précédente et sa date. Une source auparavant décisive qui disparaît du parcours ne sera pas retéléchargée et recertifiée silencieusement depuis une ancienne URL.

L’extraction conserve maintenant les paragraphes et titres HTML et les pages PDF. Elle normalise espaces, apostrophes et accents pour reconnaître des variantes de commercialisation, de disponibilité et de rémunération, tout en conservant l’extrait original. Les tableaux simples avec en-têtes explicites sont pris en charge : colonnes PEA/CTO dans les deux ordres, ou libellé de produit/périmètre et disponibilité/tarif. Des colonnes fusionnées, un tarif accompagné d’une note non interprétée, une question sans réponse, une hypothèse ou un titre/date d’application future ne qualifient pas une réponse. Les montants divergents ou les disponibilités opposées suspendent la qualification.

Validation locale du 8 octobre : 39 tests courtiers, tests du transport documentaire partagé et audits/compilation réussis. La collecte élargie a trouvé onze URL candidates supplémentaires et validé 49 observations de profils pour sept courtiers. Bourse Direct reste en HTTP 502 depuis cet environnement ; ses observations précédentes sont conservées. Les trois nouveaux points d’entrée ont été téléchargés réellement et leurs captures allégées, sans scripts/navigation, sont utilisées dans les tests. Aucune des nouvelles sources ne lève les douze réserves actuelles ; aucune donnée issue des scénarios synthétiques n’est publiée.
