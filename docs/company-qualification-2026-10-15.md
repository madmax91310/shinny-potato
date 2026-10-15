# Réception de la qualification — 15 octobre 2026

## Périmètre mesuré

125 entreprises actives ; 121 méthodes bénéfices disponibles, 106 méthodes FCF,
106 entreprises avec les deux. Le contrat historique reste inchangé : 112 dossiers
satisfont tous ses critères ; ce nombre ne signifie pas deux méthodes disponibles.
Aucun nouvel actif ajouté et aucun seuil de qualification abaissé.

## Les sept chantiers

1. Matrice automatique : présence, fraîcheur, utilisabilité, périodes, sources et motifs par méthode, pour les 125 dossiers. Artefact quotidien `company-method-and-field-qualification`.
2. Dossiers partiels : nouvelles tentatives de rapprochement pour Alphabet, Visa, Meta et Deere ; historique de Meta enrichi. Les autres restrictions restent explicites ci-dessous ; les désaccords ne sont pas arbitrés automatiquement et les fractionnements non certifiés restent bloquants.
3. Profondeur : complément annuel renouvelable et rapproché pour 120 sociétés. Dette, trésorerie, locations, rémunération en actions, rachats, dividendes et acquisitions sont distingués. Les données primaires existantes restent réutilisées. Netflix et Deere ont des divergences avec le complément standardisé ; les trois cotations EUR n’ont pas cet adaptateur. Les données trimestrielles absentes ne sont pas remplacées par des données annuelles.
4. Calculs : contrôles indépendants sur toutes les méthodes disponibles, y compris dossiers partiels. Sommes géométriques, actualisation, croissance inverse, annualisation, dates bissextiles, devises, sources et identité des objectifs/exports. Correction du double emploi potentiel des rachats dans le DCF : actions constantes dans le modèle de distribution intégrale.
5. Hypothèses : conservation des groupes homogènes existants ; pas de pairs ajoutés sur la seule appartenance sectorielle. Dispersion et quantiles propres à l’entreprise, limites historiques et conventions explicites. Les séries de FCF négatif et bases par action non certifiées ne sont pas forcées.
6. Textes : séparation des objectifs et du calcul inverse, progression annualisée du cours hors dividendes, explication du multiple, suppression de la répétition du prix cible. Squelette et style visuel conservés. Exemples avant/après présentés avant généralisation ; documentation obsolète remplacée.
7. Réception : tests Python, contrôles numériques, publications, archives immuables et parcours Chromium sur les 125 sociétés, copie/PNG/mobile et péremption. Surveillance quotidienne des régressions de collecte et de couverture ; aucun échec ne rafraîchit une ancienne observation.

## Disponibilité des données de vigilance

| Champ | Entreprises avec donnée utilisable |
|---|---:|
| cash | 120 |
| debt | 120 |
| acquisitions | 77 |
| leaseLiabilities | 120 |
| shareBasedCompensation | 110 |

Les montants et périodes peuvent différer entre entreprises. Les indicateurs de vigilance ne sont pas tous intégrés au calcul. Les champs absents ne valent pas zéro. Les acquisitions, locations et financements futurs restent hors projection explicite.

## Restrictions par méthode

| Entreprise | Méthode | Motif actuel |
|---|---|---|
| Alphabet | FCF | Les différentes classes d’actions ne disposent pas encore d’une base FCF par action qualifiée. Historique des divisions d’actions et nombres d’actions à qualifier. Au moins quatre exercices consécutifs de FCF positif par action comparables requis. Références historiques de multiple FCF comparables manquantes ou périmées. |
| Amazon | FCF | Un fractionnement figure dans l’historique : le retraitement des nombres d’actions doit être certifié par les publications de l’émetteur. Historique des divisions d’actions et nombres d’actions à qualifier. Au moins quatre exercices consécutifs de FCF positif par action comparables requis. Références historiques de multiple FCF comparables manquantes ou périmées. |
| LVMH | Bénéfices | BPA ajustés datés et PER de même définition manquants ou périmés ; aucune croissance Finviz appliquée au BPA publié. |
| LVMH | FCF | Quatre nombres moyens d’actions diluées publiés et sourcés sont nécessaires. Historique des divisions d’actions et nombres d’actions à qualifier. Au moins quatre exercices consécutifs de FCF positif par action comparables requis. Références historiques de multiple FCF comparables manquantes ou périmées. |
| Air Liquide | Bénéfices | Deux variations annuelles de chiffre d’affaires comparables sont nécessaires. |
| Air Liquide | FCF | Quatre nombres moyens d’actions diluées publiés et sourcés sont nécessaires. Historique des divisions d’actions et nombres d’actions à qualifier. Au moins quatre exercices consécutifs de FCF positif par action comparables requis. Deux variations annuelles de chiffre d’affaires comparables sont nécessaires. |
| Schneider Electric | Bénéfices | BPA ajustés datés et PER de même définition manquants ou périmés ; aucune croissance Finviz appliquée au BPA publié. |
| Schneider Electric | FCF | Quatre nombres moyens d’actions diluées publiés et sourcés sont nécessaires. Historique des divisions d’actions et nombres d’actions à qualifier. Au moins quatre exercices consécutifs de FCF positif par action comparables requis. Références historiques de multiple FCF comparables manquantes ou périmées. |
| TotalEnergies | Bénéfices | BPA ajustés datés et PER de même définition manquants ou périmés ; aucune croissance Finviz appliquée au BPA publié. |
| TotalEnergies | FCF | Quatre nombres moyens d’actions diluées publiés et sourcés sont nécessaires. Historique des divisions d’actions et nombres d’actions à qualifier. Au moins quatre exercices consécutifs de FCF positif par action comparables requis. Références historiques de multiple FCF comparables manquantes ou périmées. |
| Visa | FCF | Les différentes classes d’actions ne disposent pas encore d’une base FCF par action qualifiée. Historique des divisions d’actions et nombres d’actions à qualifier. Au moins quatre exercices consécutifs de FCF positif par action comparables requis. Références historiques de multiple FCF comparables manquantes ou périmées. |
| Meta | FCF | Les différentes classes d’actions ne disposent pas encore d’une base FCF par action qualifiée. Historique des divisions d’actions et nombres d’actions à qualifier. Au moins quatre exercices consécutifs de FCF positif par action comparables requis. Références historiques de multiple FCF comparables manquantes ou périmées. |
| ServiceNow | FCF | Un fractionnement figure dans l’historique : le retraitement des nombres d’actions doit être certifié par les publications de l’émetteur. Historique des divisions d’actions et nombres d’actions à qualifier. Au moins quatre exercices consécutifs de FCF positif par action comparables requis. Références historiques de multiple FCF comparables manquantes ou périmées. |
| Walmart | FCF | Un fractionnement figure dans l’historique : le retraitement des nombres d’actions doit être certifié par les publications de l’émetteur. Historique des divisions d’actions et nombres d’actions à qualifier. Au moins quatre exercices consécutifs de FCF positif par action comparables requis. Références historiques de multiple FCF comparables manquantes ou périmées. |
| Netflix | FCF | Un fractionnement figure dans l’historique : le retraitement des nombres d’actions doit être certifié par les publications de l’émetteur. Historique des divisions d’actions et nombres d’actions à qualifier. Au moins quatre exercices consécutifs de FCF positif par action comparables requis. Références historiques de multiple FCF comparables manquantes ou périmées. |
| Booking Holdings | FCF | Un fractionnement figure dans l’historique : le retraitement des nombres d’actions doit être certifié par les publications de l’émetteur. Historique des divisions d’actions et nombres d’actions à qualifier. Au moins quatre exercices consécutifs de FCF positif par action comparables requis. Références historiques de multiple FCF comparables manquantes ou périmées. |
| Deere | FCF | Quatre nombres moyens d’actions diluées publiés et sourcés sont nécessaires. Historique des divisions d’actions et nombres d’actions à qualifier. Au moins quatre exercices consécutifs de FCF positif par action comparables requis. Références historiques de multiple FCF comparables manquantes ou périmées. |
| Oracle | FCF | Au moins quatre exercices consécutifs de FCF positif par action comparables requis. Références historiques de multiple FCF comparables manquantes ou périmées. |
| Micron Technology | FCF | Au moins quatre exercices consécutifs de FCF positif par action comparables requis. Références historiques de multiple FCF comparables manquantes ou périmées. |
| Target | FCF | Au moins quatre exercices consécutifs de FCF positif par action comparables requis. Références historiques de multiple FCF comparables manquantes ou périmées. |
| J.B. Hunt | FCF | Au moins quatre exercices consécutifs de FCF positif par action comparables requis. Références historiques de multiple FCF comparables manquantes ou périmées. |
| Vertex | FCF | Au moins quatre exercices consécutifs de FCF positif par action comparables requis. Références historiques de multiple FCF comparables manquantes ou périmées. |
| Nucor | FCF | Au moins quatre exercices consécutifs de FCF positif par action comparables requis. Références historiques de multiple FCF comparables manquantes ou périmées. |

## Matrice des 125 dossiers

| Entreprise | Bénéfices | FCF | Contrat historique |
|---|---|---|---|
| Apple | Disponible | Disponible | Réuni |
| Microsoft | Disponible | Disponible | Réuni |
| Nvidia | Disponible | Disponible | Réuni |
| Alphabet | Disponible | Suspendu | Partiel |
| Amazon | Disponible | Suspendu | Partiel |
| LVMH | Suspendu | Suspendu | Partiel |
| Air Liquide | Suspendu | Suspendu | Partiel |
| Schneider Electric | Suspendu | Suspendu | Partiel |
| TotalEnergies | Suspendu | Suspendu | Partiel |
| Visa | Disponible | Suspendu | Partiel |
| Costco | Disponible | Disponible | Réuni |
| AMD | Disponible | Disponible | Réuni |
| Meta | Disponible | Suspendu | Partiel |
| Mastercard | Disponible | Disponible | Réuni |
| Adobe | Disponible | Disponible | Réuni |
| Salesforce | Disponible | Disponible | Réuni |
| ServiceNow | Disponible | Suspendu | Partiel |
| Intuit | Disponible | Disponible | Réuni |
| Coca-Cola | Disponible | Disponible | Réuni |
| PepsiCo | Disponible | Disponible | Réuni |
| Walmart | Disponible | Suspendu | Partiel |
| Netflix | Disponible | Suspendu | Partiel |
| Booking Holdings | Disponible | Suspendu | Partiel |
| Deere | Disponible | Suspendu | Partiel |
| Nike | Disponible | Disponible | Réuni |
| Walt Disney | Disponible | Disponible | Réuni |
| Home Depot | Disponible | Disponible | Réuni |
| McDonald's | Disponible | Disponible | Réuni |
| Lowe's | Disponible | Disponible | Réuni |
| Starbucks | Disponible | Disponible | Réuni |
| TJX Companies | Disponible | Disponible | Réuni |
| Colgate-Palmolive | Disponible | Disponible | Réuni |
| Kimberly-Clark | Disponible | Disponible | Réuni |
| Mondelez | Disponible | Disponible | Réuni |
| Hershey | Disponible | Disponible | Réuni |
| AbbVie | Disponible | Disponible | Réuni |
| Amgen | Disponible | Disponible | Réuni |
| Bristol Myers Squibb | Disponible | Disponible | Réuni |
| Pfizer | Disponible | Disponible | Réuni |
| Thermo Fisher Scientific | Disponible | Disponible | Réuni |
| Stryker | Disponible | Disponible | Réuni |
| Union Pacific | Disponible | Disponible | Réuni |
| UPS | Disponible | Disponible | Réuni |
| Norfolk Southern | Disponible | Disponible | Réuni |
| Illinois Tool Works | Disponible | Disponible | Réuni |
| Parker-Hannifin | Disponible | Disponible | Réuni |
| General Dynamics | Disponible | Disponible | Réuni |
| Lockheed Martin | Disponible | Disponible | Réuni |
| Northrop Grumman | Disponible | Disponible | Réuni |
| RTX | Disponible | Disponible | Réuni |
| Republic Services | Disponible | Disponible | Réuni |
| Automatic Data Processing | Disponible | Disponible | Réuni |
| Paychex | Disponible | Disponible | Réuni |
| Oracle | Disponible | Suspendu | Réuni |
| Cisco | Disponible | Disponible | Réuni |
| Qualcomm | Disponible | Disponible | Réuni |
| Texas Instruments | Disponible | Disponible | Réuni |
| Analog Devices | Disponible | Disponible | Réuni |
| Micron Technology | Disponible | Suspendu | Réuni |
| Applied Materials | Disponible | Disponible | Réuni |
| Exxon Mobil | Disponible | Disponible | Réuni |
| Chevron | Disponible | Disponible | Réuni |
| ConocoPhillips | Disponible | Disponible | Réuni |
| EOG Resources | Disponible | Disponible | Réuni |
| SLB | Disponible | Disponible | Réuni |
| Newmont | Disponible | Disponible | Réuni |
| Freeport-McMoRan | Disponible | Disponible | Réuni |
| Verizon | Disponible | Disponible | Réuni |
| Marriott International | Disponible | Disponible | Réuni |
| Hilton | Disponible | Disponible | Réuni |
| Moody's | Disponible | Disponible | Réuni |
| Target | Disponible | Suspendu | Réuni |
| Best Buy | Disponible | Disponible | Réuni |
| Ross Stores | Disponible | Disponible | Réuni |
| Dollar General | Disponible | Disponible | Réuni |
| Jack Henry | Disponible | Disponible | Réuni |
| Autodesk | Disponible | Disponible | Réuni |
| Cadence | Disponible | Disponible | Réuni |
| Synopsys | Disponible | Disponible | Réuni |
| Cognizant | Disponible | Disponible | Réuni |
| Fair Isaac | Disponible | Disponible | Réuni |
| Akamai | Disponible | Disponible | Réuni |
| Verisign | Disponible | Disponible | Réuni |
| Tyler Technologies | Disponible | Disponible | Réuni |
| Paycom | Disponible | Disponible | Réuni |
| Broadridge | Disponible | Disponible | Réuni |
| Eaton | Disponible | Disponible | Réuni |
| AMETEK | Disponible | Disponible | Réuni |
| C.H. Robinson | Disponible | Disponible | Réuni |
| Expeditors | Disponible | Disponible | Réuni |
| Wabtec | Disponible | Disponible | Réuni |
| Quanta Services | Disponible | Disponible | Réuni |
| Cummins | Disponible | Disponible | Réuni |
| Otis | Disponible | Disponible | Réuni |
| J.B. Hunt | Disponible | Suspendu | Réuni |
| Trane Technologies | Disponible | Disponible | Réuni |
| Xylem | Disponible | Disponible | Réuni |
| Lennox | Disponible | Disponible | Réuni |
| Regeneron | Disponible | Disponible | Réuni |
| Vertex | Disponible | Suspendu | Réuni |
| IDEXX | Disponible | Disponible | Réuni |
| Zoetis | Disponible | Disponible | Réuni |
| Edwards Lifesciences | Disponible | Disponible | Réuni |
| Boston Scientific | Disponible | Disponible | Réuni |
| Agilent | Disponible | Disponible | Réuni |
| Mettler-Toledo | Disponible | Disponible | Réuni |
| Lululemon | Disponible | Disponible | Réuni |
| D.R. Horton | Disponible | Disponible | Réuni |
| PulteGroup | Disponible | Disponible | Réuni |
| Yum! Brands | Disponible | Disponible | Réuni |
| Domino’s Pizza | Disponible | Disponible | Réuni |
| Pool Corporation | Disponible | Disponible | Réuni |
| Ulta Beauty | Disponible | Disponible | Réuni |
| eBay | Disponible | Disponible | Réuni |
| Garmin | Disponible | Disponible | Réuni |
| PPG Industries | Disponible | Disponible | Réuni |
| Ecolab | Disponible | Disponible | Réuni |
| Linde | Disponible | Disponible | Réuni |
| Nucor | Disponible | Suspendu | Réuni |
| Vulcan Materials | Disponible | Disponible | Réuni |
| Martin Marietta | Disponible | Disponible | Réuni |
| Avery Dennison | Disponible | Disponible | Réuni |
| Monolithic Power Systems | Disponible | Disponible | Réuni |
| Skyworks | Disponible | Disponible | Réuni |
| Teradyne | Disponible | Disponible | Réuni |

## Limite de réception

Il s’agit de vérifications internes reproductibles, pas d’une certification externe ni d’une garantie de réalisation des scénarios. La fusion et le déploiement doivent être confirmés par les exécutions GitHub ; ce document ne suffit pas à les attester.
