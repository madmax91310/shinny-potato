# Automatisation des données consommées — deuxième livraison du 21 octobre 2026

## Périmètre

Les sept priorités de la roadmap ont été réexaminées à partir des sources réelles. Cette livraison modifie les collecteurs, les identités et leurs contrôles. Elle ne modifie aucun composant de rendu, texte de tweet ou modèle d’image. Analyse d’entreprise reste retirée. Les chiffres ci-dessous sont ceux de la recette locale ; le bilan public doit être vérifié après le déploiement.

## Raccordements effectués

Trois portefeuilles physiques WisdomTree supplémentaires sont collectés intégralement et projetés dans les recoupements DCA : Europe Defence (IE0002Y8CX98, 42 lignes), Quantum Computing (IE000W8WMSL2, 47 lignes) et Artificial Intelligence (IE00BDVPNG13, 58 lignes). La photographie publiée est datée du 15 octobre. Les poids restent ceux du fonds, avec leur arrondi ; aucune normalisation à 100 % ni substitution par un indice.

Le cache contient désormais 71 correspondances indépendantes qualifiées contre 23 au début de cette livraison. Les variantes orthographiques proposent au maximum trois candidats issus de portefeuilles déjà prouvés. Sept candidats de découverte supplémentaires sont explicitement sourcés. Ni les noms ni ce registre n’attribuent un ISIN : chaque correspondance demande deux requêtes OpenFIGI concordant sur le FIGI exact, la classe et le type de titre. Les ADR et les actions enregistrées à New York restent distincts des actions ordinaires. Les échecs d’identité restent inconnus ; un changement de candidats peut être réinterrogé sans recertifier une ancienne réponse en échec.

Placement-direct Vie renouvelle à nouveau ses données. La notice actuellement publiée précise la déduction du coût de la garantie optionnelle plancher décès. Le parseur reconnaît cette clause exacte et confronte toujours les frais euros à la fiche tarifaire ; la garantie reste exprimée hors coût éventuel de cette option. Une nouvelle formulation ou un désaccord de frais bloque la collecte. Le plafond d’allocation non publié reste inconnu.

## Fiabilité et sources de secours

Les accès primaire et alternatifs configurés d’un champ en attente sont contrôlés indépendamment, dans la limite de huit routes par champ et six requêtes simultanées. Les doublons sont téléchargés une seule fois. Un accès primaire défaillant demeure enregistré même si une autre route répond ; les routes dépassant le budget sont explicitement conservées comme non contrôlées. Aucun de ces contrôles HTTP ne renouvelle une date financière ou ne clôt un incident de qualification.

Le téléchargement commun aux SCPI, assurances et plateformes réessaie désormais également les réponses interrompues et limite leur taille à huit millions d’octets. Les réponses vides, trop volumineuses, les 404 et les données invalides ne deviennent pas des succès. Les contrôles de somme WisdomTree API rejettent aussi explicitement NaN, infini et les booléens.

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

Avant fusion : 78 raccordements ouverts contre 81 ; 177 compositions intégrales actuelles contre 174 ; 688 historiques mensuels actuels. Ces périmètres se chevauchent et ne s’additionnent pas. La publication peut faire apparaître un incident de source conservé par un cycle concurrent ; ses données brutes priment sur ces chiffres de recette.

Les tests couvrent la séparation ADR/action ordinaire, les hypothèses erronées, les ambiguïtés, les limites de requêtes, les erreurs d’accès primaire avec secours disponible, les coupures de lecture, les documents trop volumineux, les clauses contractuelles modifiées et les sommes non finies. Un parcours Chromium mobile et bureau exerce les nouveaux portefeuilles dans le calcul de recouvrement et vérifie la conservation des poids complets dans les projections. Les obligations par outil et le retrait d’Analyse d’entreprise sont aussi rejoués.

Cette livraison ne réalise pas l’automatisation totale : les sources non publiées, les identités encore inconnues et les compositions d’indices non qualifiées restent explicitement requises. Il faut une nouvelle source exploitable pour les fermer.
