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
**toute** la fenêtre historique, au-delà des deux ans de cours habituels. Un split
bloque le modèle FCF tant que les retraitements des rapports ne sont pas qualifiés.
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

Les étapes 5–8 (grand graphique, mise en page finale, texte et nouvel export)
ne font pas partie de cette livraison. Le panneau fonctionnel expose les étapes
1–4 sans remplacer le format de publication existant.
