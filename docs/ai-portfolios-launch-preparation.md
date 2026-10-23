# Préparation du lancement après #886 — proposition non approuvée

> Enregistrement autonome : voir [la procédure téléphone](ai-portfolios-autonomous.md). Les instructions CLI ci-dessous restent un secours technique, pas le parcours courant.

Aucune compétition ni allocation réelle n’est créée par cette préparation. Le livre
réel reste à la révision 0. Les modèles exacts et les règles ouvertes attendent le
choix de l’utilisateur ; les réglages par défaut de l’application restent inchangés.

## Référence : contrôle réel du 23 octobre 2026

À 07:01 UTC, l’arrêté attendu est le **22 octobre** : la clôture de Londres
(15:30 UTC) et le délai de publication conservateur de deux heures sont passés.
Le 23 n’est pas encore une séance achevée à Londres. **CSPX.L**, Londres/XLON,
USD, **IE00B5BMR087**, renvoie encore une clôture attendue manquante le 22.
Les 72 clôtures réelles du 13 juillet au 21 octobre sont conservées et revérifiées.
L’identité, l’unité, les cours ajustés, le calendrier et les changes historiques
USD/EUR sont contrôlés. La BCE est disponible au 22 octobre. Le défaut persiste
sur plusieurs tentatives ; cela ne prouve pas une indisponibilité définitive.

Toutes les cotations documentées du même ISIN ont été examinées (8 places/cotations,
11 symboles documentés, essais réseau réels). Aucune autre part ni autre fonds :

| Cotation | Devise | Couverture historique contrôlée | À l’arrêté du 22 |
| --- | --- | --- | --- |
| Londres CSPX.L | USD | 13/07–21/10, 72 clôtures | clôture du 22 manquante |
| Londres CSP1.L | GBP (source GBp × 0,01) | 13/07–21/10, 72 | clôture du 22 manquante |
| Xetra SXR8.DE | EUR | 13/07–21/10, 73 | clôture du 22 manquante |
| Milan CSSPX.MI | EUR | 13/07–21/10, 73 | clôture du 22 manquante |
| Amsterdam CSPX.AS | EUR | 13/07–21/10, 73 | clôture du 22 manquante ; CSP1.AS : 404 |
| Suisse CSSPX.SW | USD | 13/07–21/10, 73 | clôture du 22 manquante ; CSSPX.S : 404 |
| Mexico CSPXN.MX | MXN | **13/07–22/10, 73** | **couverture et moteur EUR validés** |
| Santiago CSPX.SN | USD | aucune nouvelle série qualifiée | 404 |

CSPX.MX renvoie une place YHD incompatible et n’est pas retenu. Chaque échec reste
attribué au symbole testé. La qualification d’une variante ne vaut pas pour l’autre.
Le contrôle de CSP1 utilise bien la normalisation GBp/GBP certifiée de sa série.

**Alternative utilisable à cet arrêté : CSPXN.MX, Mexico/XMEX, MXN.** Même part
capitalisante, même exposition S&P 500, mais une autre cotation, un calendrier
mexicain et une conversion MXN/EUR. Contrôle indépendant du prix synthétique et
achat/liquidation dans le moteur réussis. Ce n’est pas une substitution ni une
fusion de séries. La référence par défaut reste **CSPX Londres USD** ; son
remplacement nécessite une décision explicite avant création de la compétition.

Les résultats datés, URLs, empreintes, unités et motifs figurent dans
`data/ai-portfolios/launch-reference-verification.json` (copie publique identique).
Le site expose la collecte actualisée et le défaut exact dans État des données.
Aucune interpolation ni clôture reportée artificiellement n’est admise.

## Proposition simple à valider

| Paramètre | Proposition | Conséquence |
| --- | --- | --- |
| Participants | ChatGPT, Claude, Gemini ; modèle exact saisi pour chacun | aucun modèle supposé ni appelé par l’application |
| Capital / devise | 10 000 EUR par participant, fixes | aucun apport/retrait externe après lancement |
| Fenêtre | lundi 00:00 à dimanche 23:59:59, Europe/Paris | même échéance ; prévoir une marge pour l’import Codex |
| Fréquence | une réponse enregistrée par semaine | conserver compte aussi comme une réponse |
| Composition investie | 3 à 6 lignes, 35 % maximum par ligne à l’achat | diversification simple ; une hausse peut faire dériver les poids |
| Liquidités | non rémunérées, sans plafond ; 100 % possible | exposition réduite autorisée ; si investissement non nul, respecter 3–6 lignes |
| Frais simulés | 0 pb sur transactions | comparaison simple des choix ; coûts du fonds déjà reflétés dans les cours |
| Réponse manquante | après lancement, conserver positions/liquidités | aucune décision fictive ajoutée ; avant lancement, attendre les trois réponses initiales |
| Univers | même export complet pour les trois IA | actions Europe/Asie/USA, ETF UCITS et autres familles déjà admises, crypto et matières premières sans levier ; qualification et rattrapage obligatoires |
| Exécution | première clôture future commune aux marchés concernés après échéance ; initialement même séance pour les trois IA et la référence | ni cours choisi rétroactivement, ni calendrier de tout le catalogue |
| Référence | CSPX Londres USD conservé, sous réserve de rattrapage | alternative Mexico seulement après validation explicite |
| Lancement | pas de date enregistrée ; au plus tôt lundi 26 octobre si tout est approuvé et les données disponibles | la date effective reste future et commune, fixée lors de l’import de lancement |

Le dimanche 25 octobre est le jour du passage à l’heure d’hiver : cette échéance
correspond à **22:59:59 UTC** ; la semaine compte 169 heures. Le moteur utilise
les semaines civiles de Paris et non une durée fixe de 168 heures.
Les points encore à choisir sont la limite hebdomadaire, les bornes de lignes,
le poids, les frais, la règle d’absence, les liquidités, la date et, si CSPX reste
bloqué, le choix de cotation de référence. Les modèles exacts restent à renseigner.

## Dossier initial et enregistrement ultérieur via Codex

Le dossier fonctionne avant toute position : capital et liquidités, identité
exacte de la référence, dates, état des données, règles et conventions synthétiques,
univers admissible joint en JSON. Les informations communes sont identiques ;
aucune réponse d’un autre participant n’y apparaît. Un défaut de source est décrit,
jamais présenté comme une autorisation d’exécuter. Le schéma initial utilise
`kind: "target"` et `weights: {}` à compléter avec les vrais choix de l’IA, sans
fabriquer d’allocation exemple. `kind: "hold"` signifie 100 % de liquidités au départ.

Après validation explicite des choix, lors d’une tâche ultérieure :

1. Configurer les règles et modèles. Préparer puis télécharger la **demande de
   création**, la joindre à Codex ; import CLI, contrôles, commit/push et publication.
   Cela crée uniquement une compétition en brouillon, sans la lancer.
2. Recharger ; copier/télécharger les trois dossiers et le même export
   `univers-admissible.json`. Transmettre soi-même aux IA.
3. Pour chaque réponse : importer son JSON, vérifier l’aperçu et les liquidités,
   préparer/télécharger la demande puis joindre le fichier à Codex. Exécuter
   `node scripts/ai-portfolios.mjs import /chemin/demande.json`. Le CLI rattrape
   données/changes et refuse les défauts ; aucun contournement.
4. Contrôler le diff et l’audit ; commit des seuls répertoires IA, PR, contrôles,
   fusion/publication. Recharger avant la demande suivante : chaque import change
   la révision ; ne pas importer trois demandes exportées sur la même ancienne révision.
5. Retrouver les trois décisions initiales enregistrées, encore sans exécution.
   **Le lancement reste une opération distincte, nécessitant une instruction
   explicite ultérieure.** Il fixe une seule clôture future aux trois participants
   et à la référence. Aucune de ces étapes n’est effectuée dans le livre réel ici.

La recette ciblée vérifie les dossiers vides, les mêmes règles, les JSON et poids,
les liquidités, l’absence de référence et le lancement commun dans une racine
isolée. Le vrai CLI a été exécuté sur une configuration de recette temporaire :
persistance et rechargement identiques, doublon refusé, décision refusée sur le
défaut CSPX sans réécriture du livre. Les calculs historiques déterministes du
test de lancement ne sont pas décrits comme une collecte réseau.
