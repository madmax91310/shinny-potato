# Radar : matière éditoriale, alertes et visibilité — 26 octobre 2026

Ce lot corrige le tri et le bruit de la chaîne existante. Aucun raccordement général,
registre financier, seuil de qualité financière ou donnée d’un autre outil n’est modifié.
Aucune publication sur X ni notification utilisateur de test. Livraison par PR ; fusion et
déploiement non autorisés pour ce lot.

## Constats vérifiés et périmètre

Base initiale : master `9e59c99d`. Les PR concurrentes #985, puis #986 (Nikkei), #988
(parseur ETF) et #989 (génération du portail CI) ont été examinées. Les collecteurs financiers,
les verrous et les conditions de publication de leurs workflows sont préservés.

Sur la fenêtre de 24 heures examinée le 26 octobre, le suivi technique #881 contenait
36 commentaires du bot et le suivi éditorial #880 en contenait quatre. Parmi les alertes
majeures du jour figuraient un conseil général assurance-vie, une proposition de placement
pour la dépendance et un changement de plafond d’exonération de prime carburant. Ce sont
des observations ponctuelles, pas une moyenne hebdomadaire ni une mesure de réception mobile.

Les documents et leurs classifications antérieures sont figés dans
[`cases.json`](../scripts/fixtures/radar-publication/cases.json), issus du flux radar-data
`c52f7d039955f4c3efdd3029e811efb5a0b85063` et du rejeu daté de l’audit. Leur rejeu ne prouve
ni une découverte automatique ni un délai de production.

## Qualification puis score unique

1. Exclusions du sujet principal : fiscalité, prestations et aides au logement. « Avant impôt »
   comme convention d’un rendement reste admissible. Le plafond d’exonération de la prime
   carburant est bien fiscal, même sous une rubrique carburants.
2. Fiabilité existante : preuve, périmètre, dates, conditions, disponibilité et conventions.
3. Matière : fait extrait, nouveauté établie, population, unité/période et inconnues. Les valeurs
   comparées doivent partager périmètre, unités et conventions immobilières. Pas de chiffre
   calculé pour remplir une carte. Les ETF groupés restent exploitables avec seulement les
   noms/caractéristiques prouvés ; aucune confusion cotation/lancement/courtier.
4. Nature explicite : statistique observée, changement documenté, annonce, sondage,
   prévision, proposition, rumeur, correction ou conseil général. Prévisions/propositions
   restent à vérifier ; conseils sans nouveauté restent secondaires. Une enquête auprès des
   ménages n’est pas traitée comme une communication professionnelle.

| Critère | Maximum | Éléments réellement utilisés |
|---|---:|---|
| Matière pour le tweet | 25 | Faits extraits, périmètre, période, population/conditions documentées |
| Portée et conséquence | 25 | Population explicitement citée ; coût, rendement ou accès prouvé ; un agrégat statistique ne prouve pas un gain individuel |
| Nouveauté et actualité | 20 | Nouveauté qualifiée, publication originale, correction substantielle ou échéance vérifiable |
| Réaction/identification | 20 | Médiane/décile pour se situer, budget, arbitrage financier, réponses d’enquête ou choix de caractéristiques prouvées |
| Comparaison/prolongement | 10 | Avant/après compatible, seuil de distribution ou différences de produits ; aucun bonus automatique pour un bouton outil |

Les critères représentent des usages différents du fait, pas une multiplication du nombre
de chiffres. Ni marque, partenariat XTB, « record », « choc », taille de tableau ou nombre
brut de reprises n’apporte de points. Seuils éditoriaux conservés : priorité 65, majeur 85 ;
ils ne remplacent jamais la fiabilité ni la matière suffisante. Au maximum deux sujets d’un
même domaine et une promotion dans la sélection, une même exposition évite les doublons.
Tous les autres exploitables restent consultables, recherchables et filtrables.

La fraîcheur repose sur l’original, jamais sur la collecte. Une reprise explicitement reliée
conserve `originalPublishedAt`. Les traitements indépendants ne comptent qu’avec groupe
éditorial qualifié, preuve de contenu distinct et faits supplémentaires ; les copies et
versions linguistiques ne comptent pas. Aucun indicateur « viral » ou « tendance sur X ».
La couverture actuelle n’établit pas systématiquement cette indépendance : l’indice reste absent.

Un changement financier observé entre deux relevés comparables peut être récent sans date
d’annonce : il conserve les deux valeurs, sources, contrôles et empreintes et porte la mention
« changement constaté ; date d’annonce inconnue ». La première collecte n’est jamais ce changement.
La précision des dates conservées ne permet pas de déduire une heure absente.

## Avant/après sur les documents réels

Les scores sont ceux du rejeu au 26 octobre à 16 h UTC, pas des engagements sur les chiffres futurs.
Le rapport JSON de CI contient chaque critère et chaque source.

| Sujet | Avant | Après |
|---|---|---|
| Salaire médian INSEE, 22 octobre, données 2025 | 97, exploitable ; statistiques hors alerte majeure dans l’ancienne règle | Prioritaire, unité EQTP et faits regroupés ; admissible à une alerte rapide au moment de sa parution, pas rajeuni quatre jours après |
| Conseil Hello bank assurance-vie | 87, majeur | Secondaire, conseil sans nouveauté ; pas d’alerte |
| Placement dépendance proposé après le PER | 87, majeur | À suivre, proposition ; aucun changement confirmé déduit |
| Prime carburant / plafond d’exonération | 100, majeur | Exclu : sujet principalement fiscal |
| Enquête BPCE sur les comportements des Français | 58, non prioritaire | Exploitable, sondage/intention explicités, méthode conservée ; pas d’alerte rapide |
| Xetra 21 octobre et Amundi | 57 chacun, exploitables | Restent accessibles avec produits, inconnues et étapes ; pas promus automatiquement en alertes majeures |
| CSA septembre et INSEE 8996928 | Faits disponibles mais peu lisibles | Fait cité en premier, population littérale lorsqu’extraite ; vraie diffusion et période conservées, pas d’alerte rétroactive |

Les 19 événements de l’échantillon d’audit sont également rejoués avec leurs IDs conservés.
Ce lot n’améliore pas artificiellement leur découverte : archives, promotions expirées et
sources non raccordées restent distinguées. Le scénario de file hérité reste cinq passages
avant correction #959 contre un après ; aucune nouvelle mesure réelle sur une semaine n’est annoncée.

## Cartes, accueil et outils

L’accueil conserve sa grille et son calendrier et ajoute « À publier maintenant » : zéro à
trois sujets prioritaires non lus, sans remplissage. Sur mobile, les cartes défilent dans
un bloc compact et un accès Radar reste visible menu fermé.

Le badge compte les dossiers exploitables non lus, pas les erreurs. Il charge immédiatement
`radar-data/summary.json`, projection légère du même flux/classificateur, sans attendre une
visite du Radar. `…` signifie chargement, `?` panne ou résumé ancien (>36 h), `0` un vrai zéro.
Actualisation toutes les cinq minutes et au retour sur l’onglet. Les lectures et préférences
conservent leurs clés ; les changements se propagent entre onglets. Ajouter une reprise presse
ne rouvre pas un original déjà lu.

Les cartes montrent : fait principal, nature, publication originale et période, raison du
moment, jusqu’à trois faits sourcés, angle/question, public et accès aux preuves/inconnues.
Les gros compteurs et diagnostics viennent après les sujets. Éditeur et copie existants
conservés ; les détails techniques et produits restent dépliables.

Deux contrats réellement vérifiés, au maximum deux actions :
- Fiche ETF : ISIN exact déjà présent et revu, route existante `?isin=...`. Cela ne qualifie
  pas les données d’une annonce ni une disponibilité commerciale. Aucun bouton pour un ETF inconnu.
- Hey @Grok : suggestion en état React Router versionné, lien source et comptage X existant.
  L’import nécessite un clic et conserve un brouillon en cours. Aucun envoi automatique.

Le comparateur courtiers et les outils historiques ne disposent pas tous d’entrées adaptées
à ces sujets : aucun bouton ouvrant une sélection vide ou sans rapport. Leur absence ne
pénalise pas une excellente information.

## Notifications éditoriales et techniques

Planification inchangée : cron UTC `7,37 6-19 * * *`, puis garde Europe/Paris 8–20 h, changement
d’heure pris en compte. GitHub Actions peut retarder ou omettre des passages : pas de promesse
de temps réel. Les collectes partagées gardent leurs propres cadences.

- Un récap quotidien après 19 h Paris, seulement s’il reste de nouveaux sujets utiles.
- Alertes rapides : fiabilité + matière suffisante + priorité/score majeur + publication
  originale récente (48 h). Les grandes statistiques INSEE y sont explicitement admissibles.
  Également : élimination d’un coût, éligibilité PEA changée, nouveau service bancaire
  documenté ou changement relatif significatif (20 %) d’une valeur comparable.
  Il s’agit de règles éditoriales ; aucun seuil de validation financière n’est assoupli.
- Pas d’alerte rapide pour promotions ordinaires, conseils, propositions/prévisions,
  simples nouveautés de catalogue ou bruit technique.
- Deux événements maximum par passage, cinq dans le récap ; surplus conservé et visible,
  sans plafond journalier qui supprimerait silencieusement le quatrième événement majeur.
- Un événement = une section compacte et un accusé par fait. Une source supplémentaire ne
  relance pas l’alerte. Une correction qualifiée peut avoir un accusé distinct lié à l’original.
- Perte de réponse après POST : récupération des reçus avant reprise ; échec d’envoi non acquitté.
- Migration version 3 : accusés et anciens IDs conservés, surplus déjà admissible conservé,
  historiques nouvellement promus initialisés silencieusement. Les archives gardent leurs dates.

Exemple d’alerte simulée : « Salaire médian du privé : 2 238 € nets par mois en 2025 »,
publication du 22 octobre, donnée EQTP 2025, avant/après sourcé compatible, population,
raison de l’actualité et liens directs vers la source et le dossier. Le JSON de validation
contient le corps exact, généré contre une API en mémoire sans identifiant ni appel utilisateur.

La supervision technique conserve incidents, essais, preuves et échecs dans le suivi et
« Données à revoir ». Elle cesse les commentaires à chaque nouvelle tentative/rétablissement
local. Notification seulement pour une nouvelle panne critique ou extension significative :
flux global illisible ≥1 h ; producteur Radar global en échec ≥2 h ; publication entière
bloquée ≥6 h ; au moins deux familles prioritaires indisponibles ≥2 h. Rappel au plus après
24 h, reçu durable et récupération après perte de réponse. Le déploiement de la politique
initialise les anciens incidents sans rafale. Les détails HTTP seuls ne créent pas une nouvelle alerte.

La réduction attendue est démontrée par simulation : conseils/propositions exclus, un seul
commentaire par dossier, aucune répétition technique à chaque essai. La réduction réelle
sur plusieurs jours reste à mesurer après une future mise en production.

Les mails/push d’échec de **GitHub Actions** sont un canal distinct des commentaires. Les
préférences personnelles n’ont pas été modifiées : GitHub → Settings → Notifications →
Actions permet notamment de limiter aux workflows échoués auxquels on participe et de choisir
mail/push. Sur le dépôt, Watch → Custom → Issues/Actions ajuste les abonnements ; conserver
l’abonnement au suivi éditorial si souhaité. Sur GitHub Mobile, vérifier compte, autorisations
système, filtres et plages silencieuses. Un commentaire accepté par GitHub ne prouve jamais
sa réception sur le téléphone. Aucune notification de test n’a été envoyée.

## Validation et preuves

- `npm run test:radar` : suites existantes et nouvelle politique, API entièrement simulée.
- `replay-radar-audit.mjs` : échantillon daté, IDs et migration sans alertes rétroactives.
- Python `test_automation*.py` : cycle des incidents préservé et nouvelle politique critique.
- Lint, architecture, build avec budgets existants, tests Hey @Grok et recettes navigateur.
- Chromium réel 1440×1000 et 390×844 : accueil/badge sans visite préalable, chargement/panne/zéro,
  lecture inter-onglets, sélection commune, sources/dates, regroupement, historique, recherche,
  copie, transfert Grok, six lignes Xetra, inconnues et étapes séparées, scénario immobilier.
- La CI conserve les rapports JSON et captures Radar en artefacts, y compris après réussite.
  Les résultats CI sont à lire sur le dernier commit de la PR ; un build local n’est pas un déploiement.

Captures du rejeu local (documents réels figés, pas la production) :

![Accueil mobile](images/radar-publication-2026-10-26/home-mobile.png)

![Sélection Radar mobile](images/radar-publication-2026-10-26/radar-mobile.png)

Limites : les connecteurs partiels/bloqués documentés restent tels quels ; aucune nouvelle
couverture revendiquée. Les changements financiers composites sans clauses comparables
restent à qualifier. Le résumé devient disponible lors du premier producteur après un éventuel
déploiement ; avant sa présence, le nouveau badge annonce son indisponibilité et non zéro.
Aucun passage programmé avec ce code ni réception mobile n’est encore démontré.
