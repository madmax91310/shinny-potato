# Promesse produit : des prévisions de cours fondées sur les données

Objectif confirmé le 14 octobre 2026 : choisir une entreprise et obtenir
**trois objectifs de cours futurs**, leur échéance (1, 3 ou 5 ans), le potentiel
par rapport à la dernière clôture et la progression annualisée du cours.
Le graphique doit montrer les clôtures observées puis des trajectoires
conditionnelles vers ces objectifs. L’image et le texte pour X reprennent
exactement le modèle, l’horizon et les hypothèses affichés.

Une valeur actualisée aujourd’hui ne remplit pas cette promesse. Les moteurs
de valeur actuelle ci-dessous restent des calculs distincts ; ils ne doivent
jamais être renommés « objectifs de cours ».

## Prévisions de cours — méthode active

`priceTargets.js` est le moteur utilisé par l’interface et les exports.
Objectif = BPA ou FCF/action de départ × (1 + croissance)^horizon × multiple de sortie.
Potentiel = objectif / cours − 1. Progression annualisée =
(objectif / cours)^(1 / horizon) − 1. Aucun dividende, frais ou impôt ajouté.

Les bases sont publiées et qualifiées. La croissance centrale vient de l’estimation
Finviz sur cinq ans pour le BPA, ou du CAGR des exercices comparables pour le FCF.
La même croissance annuelle est appliquée à l’horizon choisi. Elle est bornée à
±30 % dans les réglages automatiques, avec le chiffre source expliqué à l’utilisateur.
Le multiple central est le multiple actuel de l’entreprise (cours / base publiée),
pas un multiple identique imposé à toutes les entreprises. Les écarts prudent et
favorable (±3 points de croissance, ±20 % de multiple) sont des conventions
explicites et modifiables. Ce ne sont ni des probabilités ni un consensus d’objectifs
d’analystes. La base Finviz peut différer du BPA publié ; cette limite reste indiquée.

Le graphique conserve les dernières clôtures hebdomadaires sur deux ans et la
plus récente séance complète, collectées quotidiennement dans la série Yahoo
`close`, sans utiliser `adjclose` ni fabriquer des rendements totaux. Le multiple
converge géométriquement du multiple actuel à celui du scénario ; c’est une convention
de trajectoire, pas une prédiction des mouvements intermédiaires. Les pointsillés
commencent à la dernière clôture et finissent exactement à l’objectif. En l’absence
d’historique qualifié, seule la dernière clôture est affichée et identifiée.

Les tests empêchent la régression vers des valeurs actualisées : benchmark indépendant
322,102 pour une base 10, croissance 10 %, multiple 20 à cinq ans ; contrôle du
potentiel et de l’annualisation ; coïncidence des objectifs, dates, points terminaux,
textes et PNG ; changement automatique après modification de la donnée source.
La CI collecte les sources réelles et exige un historique de cours pour les
entreprises disposant d’un modèle actif.

## Référence des moteurs de valeur actuelle (distincts des objectifs futurs)

# Valorisation des entreprises — fondations (roadmap 1–4)

Le registre existant reste la seule source. `valuationInputs` audite à chaque
calcul la fraîcheur, les comptes, les devises, les historiques et la base par
action. `audit-company-valuation.mjs` produit le rapport de couverture dans
l’artefact quotidien `company-valuation-coverage`. Une absence reste explicite,
aucune interpolation ni approximation par bénéfice/FCF.

## Collecte renouvelable

Le collecteur existant réexamine les publications officielles, avec les nouveaux
libellés de nombres moyens dilués. Les nombres sont publiés, jamais déduits du BPA ;
le rapprochement bénéfice/nombre/BPA vérifie les colonnes. Les nombres moyens
annuels servent à l’historique FCF/action, pas à fabriquer une capitalisation.
La migration du bloc decision version 3 déclenche la relecture des archives.

`company_valuation.py` vérifie quotidiennement les événements de division sur
**toute** la fenêtre historique, au-delà des deux ans de cours habituels. Nvidia dispose
d’un adaptateur de retraitement : dates et ratios recoupés avec les publications
officielles, date de publication de chaque rapport, détection des comparatifs déjà
retraités. Les nombres publiés restent conservés. Les autres splits bloquent le
modèle FCF tant que leur base n’est pas qualifiée.
Les classes multiples sont exclues. Une erreur supprime la qualification et
suspend le calcul ; les comptes précédents gardent leur date réelle.

Il faut quatre exercices consécutifs positifs, à définition identique, avec
nombres moyens dilués sourcés. Les sociétés insuffisamment couvertes restent
visibles dans l’analyse et dans le rapport avec la raison du blocage. Le workflow
quotidien tente à nouveau les sources, sans intervention ni clé supplémentaire.

## Modèles, unités et conventions

Tous les taux internes sont décimaux. Flux en fin d’année ; multiple appliqué au
flux de la dernière année. Base = dernier FCF annuel / moyenne diluée annuelle.

FCF : V = somme(F0*(1+g)^t/(1+r)^t, t=1..N)
+ M*F0*(1+g)^N/(1+r)^N.

C’est un modèle simplifié de flux après intérêts sous financement net par dette
nul et nombre d’actions constant, pas un FCFF. Aucun ajout de trésorerie, aucune
soustraction supplémentaire de dette, aucun ajout des dividendes ou rachats.
Les capex sont déjà déduits du flux ; la croissance ne doit pas être interprétée
comme indépendante des besoins de réinvestissement. Les locations et acquisitions
ne sont pas intégralement capturées par le FCF collecté. Ces limites sont visibles.
Référence de méthode : https://pages.stern.nyu.edu/~adamodar/New_Home_Page/AppldCF/derivn/ch11deriv.html

Bénéfices : V = BPA0*(1+g)^N*PER_sortie/(1+r)^N, **hors dividendes**.
Les bénéfices annuels ne sont pas ajoutés comme des flux distribuables.
Le BPA de départ est celui qualifié par le calcul du PER existant.
Les résultats des deux modèles ne sont jamais moyennés.

La croissance implicite inverse le modèle FCF dans [-50 %, +50 %]. Le rendement
implicite est recherché dans [1 %, 50 %]. Pas de solution dans ces bornes => null,
jamais une borne présentée comme une solution. Hypothèses invalides rejetées.

## Scénarios automatiques version 1

FCF : CAGR calculé avec les dates réelles sur les exercices disponibles, borné à
[-10 %, +10 %] pour le central. Horizons 10 ans. Prudent/central/favorable =
central moins 3 points / central / central plus 3 points.
BPA : croissance Finviz cinq ans, bornée à [0 %, 10 %], horizon **5 ans** ; mêmes
écarts. La prévision cinq ans n’est pas prolongée silencieusement à dix ans.
Les croissances FCF et BPA restent distinctes, modifiables séparément.
Multiples 15/20/25 et rendement exigé 10 % sont des **conventions explicites**,
pas des valeurs issues d’un consensus ni des estimations sectorielles.
Les hypothèses personnelles survivent aux recalculs tant que l’entreprise reste
sélectionnée ; réinitialisation explicite disponible. Aucun stockage de compte.

## Validation et suite

Tests indépendants : annuité à croissance nulle, valeur terminale seule,
inversion, monotonie, bornes, fraîcheur et qualification. Tests Python des unités,
comptages publiés, profondeur du contrôle des splits et refus des fenêtres
incomplètes. Tests Chromium de modification, erreur et réinitialisation.

L’interface, le graphique et les exports actifs suivent désormais la promesse
« objectifs de cours » décrite en tête de ce document. Les calculs historiques de
valeur actuelle restent distincts dans valuation.js.

La couverture FCF reste conditionnée aux publications qualifiées : aucune
estimation ne remplace des nombres d’actions ou exercices manquants. L’audit
quotidien archive la couverture et les objectifs pour les trois horizons.
