# Automatisation des données consommées — deuxième livraison du 21 octobre 2026

## Périmètre

Les sept priorités de la roadmap ont été réexaminées à partir des sources réelles. Cette livraison modifie les collecteurs, les identités et leurs contrôles. Elle ne modifie aucun composant de rendu, texte de tweet ou modèle d’image. Analyse d’entreprise reste retirée. Les chiffres ci-dessous sont ceux de la recette locale ; le bilan public doit être vérifié après le déploiement.

## Raccordements effectués

Trois portefeuilles physiques WisdomTree supplémentaires sont collectés intégralement et projetés dans les recoupements DCA : Europe Defence (IE0002Y8CX98, 42 lignes), Quantum Computing (IE000W8WMSL2, 47 lignes) et Artificial Intelligence (IE00BDVPNG13, 58 lignes). La photographie publiée est datée du 15 octobre. Les poids restent ceux du fonds, avec leur arrondi ; aucune normalisation à 100 % ni substitution par un indice.

Le cache contient désormais 71 correspondances indépendantes qualifiées contre 23 au début de cette livraison. Les variantes orthographiques proposent au maximum trois candidats issus de portefeuilles déjà prouvés. Sept candidats de découverte supplémentaires sont explicitement sourcés. Ni les noms ni ce registre n’attribuent un ISIN : chaque correspondance demande deux requêtes OpenFIGI concordant sur le FIGI exact, la classe et le type de titre. Les ADR et les actions enregistrées à New York restent distincts des actions ordinaires. Un ancien portefeuille dont la preuve a dépassé la fraîcheur autorisée ne peut plus empêcher une nouvelle interrogation indépendante ; les deux collecteurs utilisent le même contrôle. Les échecs d’identité restent inconnus ; un changement de candidats peut être réinterrogé sans recertifier une ancienne réponse en échec.

Placement-direct Vie renouvelle à nouveau ses données. La notice actuellement publiée précise la déduction du coût de la garantie optionnelle plancher décès. Le parseur reconnaît cette clause exacte et confronte toujours les frais euros à la fiche tarifaire ; la garantie reste exprimée hors coût éventuel de cette option. Une nouvelle formulation ou un désaccord de frais bloque la collecte. Le plafond d’allocation non publié reste inconnu.

## Fiabilité et sources de secours

Les accès primaire et alternatifs configurés d’un champ en attente sont contrôlés indépendamment, dans la limite de huit routes par champ et six requêtes simultanées. Les doublons sont téléchargés une seule fois. Un accès primaire défaillant demeure enregistré même si une autre route répond ; les routes dépassant le budget sont explicitement conservées comme non contrôlées. Aucun de ces contrôles HTTP ne renouvelle une date financière ou ne clôt un incident de qualification.

Le téléchargement commun aux SCPI, assurances et plateformes réessaie désormais également les réponses interrompues et limite leur taille à trente-deux millions d’octets. La borne initiale de huit millions a été corrigée après rejet du rapport officiel ActivImmo de 17 423 444 octets par la recette GitHub ; ce cas fait désormais partie des tests. Les réponses vides, trop volumineuses, les 404 et les données invalides ne deviennent pas des succès. Les contrôles de somme WisdomTree API rejettent aussi explicitement NaN, infini et les booléens. Cloud dispose aussi du portefeuille intégral embarqué dans sa page officielle comme accès de secours, seulement après une panne de transport API. Ce portefeuille de 65 lignes a été qualifié localement ; sa photographie du 15 octobre est plus ancienne que celle du 19 octobre déjà conservée, donc elle ne la remplace pas. Une erreur financière API ou un retrait 404 ne déclenche pas ce secours.

## Relecture de toute la roadmap

| Priorité | Résultat et limite restante |
|---|---|
| 1. Cycles de production | Le cycle GitHub des compositions a enregistré ses observations après validation. Le statut brut montre toujours le refus Cloud HTTP 403 : la conclusion globale du job n’est pas une preuve que chaque source a réussi. Une collecte mensuelle a réussi, puis sa publication a été refusée pour conflit avec un changement concurrent du rapport de collecte. Le refus conserve les données publiées ; aucun conflit financier n’est résolu automatiquement. |
| 2. Incidents | Correction de la lecture de la notice Placement-direct Vie et recette réelle réussie des six contrats actifs. Les erreurs d’accès et d’identité restantes sont conservées. |
| 3. Compositions | Trois nouvelles compositions complètes, 48 correspondances supplémentaires qualifiées. Six compositions restent en découverte : identifiants non qualifiés ou panier L&G de portée non admissible. Les ventilations pays/secteurs manquantes restent propres au fonds entier. |
| 4. Indices exacts | Recollecte de 52 compositions et 56 calendriers d’indices sans exception. Les trente raccordements aux constituants et poids complets restent distincts de ces fiches agrégées. Les liens publics STOXX testés ont renvoyé 503/404 ; aucune liste partielle ou composition d’un ETF voisin n’a été promue comme indice complet. |
| 5. Performances | Les 688 historiques mensuels restent actuels. Les sept calendriers NAV manquants ont des alternatives calculées déjà raccordées ; les sources ne publient toujours pas un calendrier annuel qualifié de la part exacte. Les treize premières années attendent leur clôture. Recollecte des performances de présentation sans substitution de part. |
| 6. Autres données | Les onze fiches générales de plateformes ont été recollectées. Sept SCPI renouvelées ; Remake conserve sa dernière observation dans le délai de publication du prochain bulletin. Sept barèmes de courtiers renouvelés localement ; Bourse Direct a fermé la connexion sur ses routes publiques, avec conservation des données précédentes. Les six corroborations externes manuelles et les documents propres aux offres non publiés restent ouverts. |
| 7. Secours | Surveillance de toutes les alternatives configurées dans le budget, distinction accès/valeur, réponses interrompues réessayées, taille bornée et sommes non finies rejetées. Les secours Yahoo/FRED déjà installés restent en place. |

## Mesures et recette

Avant intégration du cycle concurrent : 78 raccordements ouverts contre 81 ; 177 compositions intégrales actuelles contre 174 ; 688 historiques mensuels actuels. Après conservation du dernier échec Cloud enregistré par GitHub : 79 raccordements ouverts et 176 compositions actuelles. Il s’agit des trois nouveaux raccordements, auxquels s’ajoute un incident d’accès désormais présent dans l’instantané intégré. Ces périmètres se chevauchent et ne s’additionnent pas. La publication peut faire apparaître un incident de source conservé par un cycle concurrent ; ses données brutes priment sur ces chiffres de recette.

Les tests couvrent la séparation ADR/action ordinaire, les hypothèses erronées, les ambiguïtés, les limites de requêtes, les erreurs d’accès primaire avec secours disponible, les coupures de lecture, les documents trop volumineux, les clauses contractuelles modifiées et les sommes non finies. Un parcours Chromium mobile et bureau exerce les nouveaux portefeuilles dans le calcul de recouvrement et vérifie la conservation des poids complets dans les projections. Les obligations par outil et le retrait d’Analyse d’entreprise sont aussi rejoués.

Cette livraison ne réalise pas l’automatisation totale : les sources non publiées, les identités encore inconnues et les compositions d’indices non qualifiées restent explicitement requises. Il faut une nouvelle source exploitable pour les fermer.

## Contre-vérification depuis GitHub

La recette du dernier code sur GitHub Actions ([collecte 39598011425](https://github.com/madmax91310/shinny-potato/actions/runs/39598011425)) a validé 177 portefeuilles sur 181. Les trois nouveaux WisdomTree ont tous renvoyé HTTP 403, comme Cloud. Ils sont bien raccordés avec leurs observations intégrales validées localement, mais leur renouvellement autonome depuis GitHub n’est pas démontré. Cette limite doit rester dans les incidents ; le gain de raccordement ne vaut pas résolution de l’accès.

La [sonde publique indépendante 39598711976](https://github.com/madmax91310/shinny-potato/actions/runs/39598711976), sans écriture de registre ni changement de date financière, a aussi testé le lecteur de documents standard sur les quatre pages exactes : quatre refus HTTP 403. Aucun changement de User-Agent, de runner déjà testé ou succès local n’est présenté comme une réparation de ces accès. Une source publique alternative exploitable ou un environnement de collecte durable ayant accès à ces sources reste nécessaire.

Les collectes GitHub des assurances, plateformes, SCPI et données réglementaires ont réussi sur le dernier code. Les tests Python et la recette navigateur des expositions ont aussi réussi. Le bilan final doit reprendre les incidents et les compteurs réellement publiés après les cycles de production, et non les seuls compteurs de la recette locale.

## Certificats des données réellement consommées

Le suivi relie désormais les séries nommées du calculateur à leur certificat mensuel par ISIN, avec contrôle de la devise, de la méthode, de la cotation sourcée et des deux bornes de période. Les rendements annuels du catalogue rejoignent le certificat NAV uniquement lorsque chaque année affichée concorde avec les valeurs qualifiées de la part exacte et de la même devise. Un prix ajusté ou un proxy de simulation n’est pas promu en rendement NAV.

Les certificats utilisent la règle de fraîcheur de leur champ dans le registre partagé : un historique mensuel ne reçoit plus le seuil d’une ventilation mensuelle simplement parce que son actif est un ETF. Un ancien contrôle hors délai, une date future ou une source en échec reste bloquant.

Une liaison vérifiée supprime le certificat de couverture en doublon tout en conservant l’union de ses outils consommateurs et de ceux de la façade. La recette conserve 1 515 fiches, 4 487 champs du catalogue et 20 outils ; les usages sont recalculés après cette correction de leur périmètre. Les usages à confirmer passent de 3 938 à 2 134 dans la recette, sans effacer les 857 usages bloqués de cet instantané. Ce sont des certificats de données déjà présentes, pas de nouvelles performances collectées.

Les tests refusent les mauvaises parts, devises, cotations, méthodes, fenêtres, années et valeurs. Ils contrôlent aussi la conservation des consommateurs absents de la façade, les échecs de source et les preuves expirées. Compilation et Chromium mobile/bureau du suivi des obligations par outil réussis.
