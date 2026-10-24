# Radar éditorial — fonctionnement proposé le 24 octobre 2026

Cette version est une évolution du Radar d’Épargnant Libre, à relire en PR avant fusion. Elle ne publie rien sur X. Le fonctionnement courant est déterministe : découverte, extraction, validation, classement et notification n’exigent aucun modèle génératif. Les ruptures de format nécessitent toujours une maintenance, signalée dans la supervision.

## Faits et intérêt éditorial

Les types sont distincts : publication statistique, mesure réglementaire, annonce de produit, première négociation, nouvelle place de cotation, changement de caractéristique, révision de source et nouvelle donnée raccordée. Un premier relevé de catalogue reste une extension de couverture. Une étude statistique ne passe jamais par les critères de promulgation d’une loi.

Les observations financières partagées gardent leurs validations et seuils. Le Radar lit les registres existants ; il ne les édite pas. Encours : seuil cumulé de 20 %, sans en déduire une collecte. Compositions : détection à 2 points inchangée ; une évolution d’au moins 5 points sur deux périodes distinctes peut devenir éditorialement exploitable, hors « autres » ou non ventilé. Un mouvement de poids n’est pas une transaction. Réplication équivalente et révision d’une même photographie restent secondaires, avec leurs preuves historiques.

La qualification d’un fait précède son score. Les sources externes ont des domaines autorisés et des parseurs explicites. L’évaluation partagée `editorialAssessment` vérifie source HTTPS, dates, périmètre, valeur et absence de conflit. Les nouvelles statistiques exigent date de publication et preuve d’extraction. Les annonces indirectes doivent être confirmées par le corps du communiqué. Un haut score ne lève aucun blocage de fiabilité.

Les poids configurables et testés sont dans `src/lib/radar-editorial.js` (`SCORE_RULES`) :

| Critère | Maximum | Règle |
| --- | ---: | --- |
| Public concerné | 30 | Ménages/statistiques : 30 ; épargne/courtiers/contrats : 21 ; composition majeure : 20 ; produit spécialisé : 11. Il s’agit d’une pertinence pour le lectorat, jamais d’un comptage de personnes. |
| Impact concret | 25 | Budget/revenus/patrimoine ou conditions d’épargne : 25 ; frais/PEA/composition majeure : 20 ; autre produit : 8. Aucun gain individuel n’est calculé sans preuve. |
| Nouveauté | 20 | Publication ou changement documenté : 20 ; couverture, révision ou variation technique : 0. |
| Comparaison/pédagogie | 15 | Repère ménages ou avant/après : 15 ; produits documentés : 11 ; comparaison absente : inconnue, 0. |
| Fraîcheur | 10 | Publication ≤2 jours : 10 ; ≤7 jours : 7 ; ≤14 jours : 3 ; plus ancienne : 0 ; publication inconnue : inconnue, 0. La détection ne remplace jamais la publication. |

Les critères et leurs raisons sont affichés. « Prioritaires » : fait fiable, exploitable et score ≥65. Les autres sujets exploitables restent accessibles sans limite de cinq cartes. La sélection courte de cinq groupes au maximum retient au plus deux publications d’une source et une exposition exacte connue. Une exposition inconnue n’est pas devinée. L’ordre, la fiabilité et les raisons sont partagés avec les notifications. Le score ne prédit aucune audience X ; les vues rapportées par l’utilisateur motivent le périmètre, pas une estimation de viralité.

## Publications et preuves

Pour les repères ménages, l’adaptateur réutilise les définitions qualifiées de `household-statistics.js` et les valeurs automatisées, sans seconde base de chiffres. Médiane et hauts salaires gardent l’unité « € nets par mois », le champ EQTP, le périmètre, le millésime, la date de publication et la date de collecte. Les preuves gardent la table et son empreinte. Les révisions d’une période restent distinctes d’une nouvelle période ou d’une publication distincte, même à valeur identique.

Les nouvelles publications INSEE, Banque de France et DREES sont extraites sans rédaction générative : titre, date officielle et résumé officiel chiffré. Les années d’une édition DREES ne sont pas présentées comme les années des données. Quand une période ne peut être extraite sans ambiguïté, elle reste inconnue et le résumé conserve ses références explicites. Les statistiques nouvellement découvertes ne sont pas automatiquement ajoutées aux outils financiers : ce raccordement a ses propres exigences.

Les annonces ETF acceptent HTML et PDF. La formulation « renforce son offre », « enrichit sa gamme » ou « nouvelles solutions » ouvre une qualification ; elle ne prouve pas seule un lancement. Le corps et les noms des produits rendent une annonce groupée exploitable sans exiger une fiche ETF complète. Une cotation ne devient ni un lancement ni une disponibilité chez un courtier.

L’association des caractéristiques se limite à un bloc à nom et ISIN uniques, ou à une ligne rectangulaire dont les en-têtes sont explicites. Pas de propagation d’un TER global vers tous les produits ; cellules fusionnées ambiguës exclues. Plusieurs parts restent séparées par ISIN. Les inconnues (frais, PEA, indice, revenus, gestion, dates, disponibilité commerciale) restent inconnues. Les preuves par produit sont consultables. Les informations du communiqué ne sont pas versées automatiquement dans les registres partagés.

## Découverte réellement vérifiée

La preuve datée et les limites se trouvent dans [le relevé réel](../reports/radar-publications-2026-10-24/sources.json), produit par `scripts/check-radar-sources.mjs`, sans importer le publieur ni envoyer de notification. Ce relevé est un échantillon borné, pas une preuve de couverture universelle.

| Source | Accès et découverte | Profondeur, cadence et extraction | État au contrôle |
| --- | --- | --- | --- |
| INSEE publications nationales | RSS officiel `/fr/flux/2`, identifié dans la liste officielle des abonnements | Fenêtre fournie par le RSS ; horaire ; titre, `date-diffusion`, chapeau | Opérationnel, dont les salaires 2025 |
| INSEE conjoncture/inflation | RSS officiel `/fr/flux/3` | Fenêtre RSS ; horaire ; chapeau ou premiers paragraphes officiels | Opérationnel, dont IPC et logement |
| Amundi actualités et avis | Sitemap annoncé dans `robots.txt`, `/sitemap/sitemap.xml` | Toutes les URL françaises des actualités du sitemap, contrôlé quotidiennement ; date du bandeau, corps HTML, tableaux | Opérationnel, dont les trois ETF thématiques |
| Banque de France crédits | Liste HTML thématique officielle existante réutilisée | Première page datée ; horaire ; contenu Webstat officiel | Opérationnel ; l’ancien canal de veille est conservé |
| Banque de France épargne | Liste HTML thématique, identifiants de filtres lus dans le formulaire officiel | Première page datée ; horaire ; blocs textuels Webstat | Opérationnel sur l’épargne des ménages |
| Banque de France endettement | Liste thématique datée | Découverte opérationnelle ; données principalement graphiques | Extraction chiffrée bloquée : absence de résumé/table datée exploitable par cet adaptateur ; documents en file d’erreur, aucun chiffre inventé |
| DREES | Liens de publications sur l’accueil officiel | Accueil courant, pas d’exhaustivité d’archive ; horaire ; date « Paru le », résumé | Opérationnel sur retraites et prestations échantillonnées ; accès susceptible de rejet anti-robot |
| DARES | Accueil officiel | Contrôle horaire ; extraction sur liens publics lorsqu’ils sont accessibles | Bloqué dans cet environnement par une vérification de sécurité en HTTP 200 |
| Vanguard | Modèle serveur de la page officielle des communiqués | Archive rendue ; horaire ; documents PDF, file persistante | Découverte opérationnelle ; échantillon courant de baisses de frais, pas un inventaire de tous les lancements |
| Global X Europe | Liste officielle Recent News | Archive rendue ; horaire ; HTML/PDF officiels autorisés | Découverte opérationnelle ; échantillon courant de dividendes classé secondaire |
| WisdomTree Europe | Liste HTML française actuelle, domaine officiel `.com` | Archive rendue ; horaire ; date près du titre, paragraphes et tableaux | Opérationnel, dont une annonce à plusieurs parts et TER par ligne |
| DWS / Xtrackers | Modèle JSON `vue-media-releases-page` du site DWS | Résultats rendus par le modèle, archive partielle ; horaire ; date officielle de la liste et document | Opérationnel sur l’échantillon ; plusieurs annonces anciennes, sans prétendre couvrir toute l’actualité Xtrackers |
| Service Public | RSS particuliers officiel | Fenêtre du flux ; horaire ; titre/résumé/date/statut | Opérationnel |
| Bercy | RSS officiel toutes actualités | Fenêtre du flux ; horaire ; filtrage particuliers, titre/résumé/date/statut | Opérationnel |
| Vie publique actualités et lois | Deux RSS officiels existants | Fenêtre de chaque flux ; horaire ; mêmes exclusions législatives et parlementaires qu’avant | Opérationnels ; zéro article pertinent peut être un résultat sain |
| CRE | Communiqués officiels HTML existants | Liste rendue ; horaire ; cartes datées sur les prix/tarifs ménages | Opérationnel |
| iShares / BlackRock | Page officielle corporate de communiqués testée HTTP 200 | Accès revérifié quotidiennement ; couverture des archives UCITS européennes non qualifiée | **Pas raccordé** à la découverte des lancements |
| BNP Paribas AM | API publique de la salle de presse | Deux pages, extraction réelle d’une annonce de quatre ETF | **Raccordé**, champs absents inconnus |
| State Street / SPDR | Portail officiel accessible | Contrôle quotidien ; archive européenne ETF non qualifiée | **Pas raccordé** |
| Invesco | Media hub officiel accessible, dont des PDF | Contrôle quotidien ; archive ETF et extraction automatique non qualifiées | **Pas raccordé** |
| VanEck | Accès variable : premier contrôle refusé, contrôle Node ultérieur HTTP 200 | Contrôle quotidien ; archive datée et adaptateur non qualifiés | **Pas raccordé** ; ne pas assimiler accès HTTP et couverture |
| UBS | Portail média officiel accessible | Contrôle quotidien ; archive ETF européenne non qualifiée | **Pas raccordé** |
| JPMorgan AM | Portail conseiller officiel accessible | Contrôle quotidien ; découverte UCITS datée non qualifiée | **Pas raccordé** |

Pour tous les connecteurs de publications : URL canonique sans paramètres de suivi, domaine officiel vérifié après redirection, date de publication distincte des horodatages techniques, hash et extrait de preuve. Le `Doc ID` Amundi, lorsqu’il existe, identifie les reprises du même document. Aucun rapprochement par seul thème. Les articles hors périmètre sont rejetés avec motif ; un format vide anormal est une erreur, pas « aucune nouveauté ».

Le détail des accès non qualifiés est versionné dans `radar-source-access.mjs` et visible dans l’écran. Les URL de ces portails ne sont pas comptées comme des raccordements terminés. Les refus de source et insuffisances de parseur restent détectés ; il n’y a ni service payant ni nouvel identifiant requis.

## File durable, cache, historique

`state.json`, `feed.json`, `notifications.json` restent publiés atomiquement sur `radar-data`, sans déployer l’application. La file de publications est stockée dans `state.publications.documents` ; la file d’enrichissement historique Vanguard/Global X dans `state.documentQueue`. Elles conservent découverte, tentatives, prochain essai, statut, erreur et dernière extraction valide.

Un passage traite au maximum 12 documents de publications (90 secondes de traitement, hors découverte) et 8 documents d’enrichissement (45 secondes). Les documents sont répartis entre sources ; la fin de file n’est jamais abandonnée. Une erreur retente après 2, 4, 8, 16 puis 24 heures au maximum. Les documents réussis sont recontrôlés après sept jours, les enrichissements après un jour. RSS/listes sont interrogés une fois par heure ; sitemap et contrôles d’accès une fois par jour. ETag et Last-Modified sont utilisés sur publications, enrichissements et veille pouvoir d’achat lorsque fournis. Un HTTP 304 réutilise la preuve conservée. Le timeout ou une panne ne rajeunit jamais la date de publication ou celle de l’extraction valide.

La reprise initiale parcourt les archives raccordées avec ces bornes de coût. Les nouvelles annonces de moins de 60 jours peuvent entrer dans le flux avec leur véritable publication ; les plus anciennes restent dans la file et l’état de collecte. Elles ne sont jamais présentées comme publiées aujourd’hui. Le récapitulatif ne retient que les sujets publiés depuis moins de 14 jours ; les alertes majeures exigent moins de deux jours. Les vieux signaux reclassés pendant la migration ne déclenchent pas de rafale.

Les identifiants et dates de détection des événements existants ne sont pas recalculés. La migration des libellés/unités enrichit l’historique sans réémettre de signal. Le registre des notifications acquitte les événements déjà présents lors de la migration de politique ; les lectures restent liées aux anciens IDs. Les nouveaux identifiants de publication incluent son identité, pour distinguer deux documents même à valeur et période inchangées.

L’état conserve l’historique complet. Le flux conserve **tous** les sujets exploitables/à suivre, avec les 500 variations secondaires les plus récentes. L’ancienne limite globale de 500 ne permet plus au bruit technique d’évincer un sujet utile. L’historique intégral des secondaires est dans `state.json` sur `radar-data`.

## Planification, notifications et reprise

GitHub Actions ne garantit pas une exécution à la minute précise. Le cron UTC est `15 6-19 * * *` ; une garde `Europe/Paris` ne laisse passer les exécutions programmées que de 08 h à 20 h, heure locale. Ainsi, en été 06–18 UTC et en hiver 07–19 UTC. Le changement d’heure est couvert par les tests. Les retards du planificateur restent visibles via les dates de contrôle.

Les passages programmés utilisent les dernières observations financières déjà validées, sans relancer la vérification DWS. Les `workflow_run` des collecteurs financiers conservent la voie lourde. Un échec de cette vérification conserve les faits précédents et signale une réserve, sans empêcher les nouvelles publications légères de paraître. Les collecteurs partagés, leurs calendriers et leurs validations financières ne sont pas modifiés.

Le canal existant reste l’issue GitHub suivie, attribuée au propriétaire, avec mention dans les commentaires :

- Événement majeur : fiable, exploitable, score ≥85, publication depuis ≤2 jours ; au plus deux groupes par passage et trois par jour de Paris.
- Récap quotidien : premier passage à partir de 19 h de Paris, jusqu’à cinq meilleurs nouveaux groupes exploitables depuis ≤14 jours, avec diversité de source/exposition ; un récap par date locale. Les alertes majeures restent possibles ensuite.
- Les faits d’une même publication sont regroupés dans le même lot. Une publication déjà notifiée n’est pas renvoyée pour une reprise sur un autre canal ou un nouveau fait secondaire.
- Les accusés sont enregistrés après un commentaire envoyé avec succès. Une description d’issue n’est pas un accusé. Après crash entre POST et commit, les marqueurs des commentaires du bot permettent la reprise sans doublon. Les erreurs restent en attente, sont persistées et exposées dans le flux.

Les tests simulent toute l’API ; ils n’envoient aucun message réel. La réception mobile **n’est pas vérifiée**. Elle dépend de l’accès aux issues, de l’attribution/mention, de l’abonnement GitHub et de l’autorisation de notifications de GitHub Mobile dans l’application et le système. L’installation ou les réglages de téléphone ne sont pas automatisés ici. Aucune publication sur X n’est possible dans cette chaîne.

## Supervision et recette

L’écran distingue source saine sans nouveauté, source en erreur, accès non qualifié, documents en attente, erreurs d’extraction, rejets, secondaires et notifications en attente/échec. Les erreurs sont isolées par source. Les contrôles de transport conservent les preuves précédentes. Les métriques enregistrent publication → découverte, découverte → disponibilité, couverture constatée, états de file, motifs de classement et délivrance des notifications.

La base de cas comprend des extraits officiels INSEE, Amundi, inflation, DREES, WisdomTree et des scénarios synthétiques de tableaux groupés, panne/reprise, migration, révision, extension de couverture et composition majeure. `npm run test:radar` les rejoue après chaque changement ; le workflow de PR les exécute sans notification. Les tests ne figent ni les valeurs vivantes des registres ni les compteurs de production.

Commandes :

```sh
npm run test:radar
npm run build
npm run test:radar:browser
python3 -m unittest discover -s scripts -p test_dws_reconciliation.py
node scripts/test-economic-consumers.mjs
node scripts/audit-household-statistics.mjs
npm run lint
# Lecture réseau uniquement, sans publication ni notification :
node scripts/check-radar-sources.mjs --passes 3 --output /tmp/radar-sources.json
```

Dans un environnement avec proxy et Node 24, utiliser `NODE_USE_ENV_PROXY=1` pour les contrôles réseau. Le workflow GitHub n’exige pas ce réglage. Pour continuer une vérification de file locale : `--state /tmp/radar-state.json`. La commande ne charge jamais `publish-editorial-radar.mjs`.

Le résultat de livraison, les avant/après et les limites de mesure sont dans [le compte rendu de validation](editorial-radar-v2-validation.md).

La qualification complémentaire ETF et immobilier, ses preuves et limites actualisées figurent dans [la matrice des extensions](editorial-radar-extensions.md).
