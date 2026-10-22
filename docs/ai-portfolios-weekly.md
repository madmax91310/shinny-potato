# Portefeuilles IA : décisions hebdomadaires et mobile

Les PR #878 et #879 sont conservées : registre international, cotations exactes,
comptabilité en rendement total et publication des grands catalogues. Aucun
participant, modèle réel, portefeuille ou décision n’a été créé dans le livre.

## Usage sur téléphone

Le tableau charge `overview.json` : livre publié, bilans déjà calculés, identités
archivées, calendriers et changes. Il ne charge aucun historique ni le catalogue.
Dans Gestion, **Charger le catalogue complet** ouvre la recherche sur toutes les
entrées techniques. Pagination et vingt champs de décision visibles ne limitent
pas la recherche. Les historiques des actifs sélectionnés et les preuves d’une
cotation sont chargés à la demande. Les exports exhaustifs restent disponibles.
Le fichier historique `snapshot.json` reste compatible avec l’ancien code, y
compris la voie de secours de publication ; la nouvelle interface ne le demande pas.

Mesures des fichiers JSON, même arrêté du 21 octobre : ancien dossier public
42 233 643 octets avant changement ; nouveau aperçu 264 000 octets ; catalogue
12 283 606 octets, séparé et consulté volontairement. Les mesures réseau Chromium,
cache froid, mobile 390 × 844, sont fournies dans la PR, puis vérifiées sur le site
publié. Elles incluent compression et requêtes réelles, pas une estimation de
réseau à partir des tailles JSON. Les compétitions suivies feront croître le livre
et les bilans ; ces mesures utilisent le vrai livre actuellement vide.

## Semaine, échéance et règles archivées

Les nouvelles configurations proposent trois participants manuels ; un bouton
permet d’en ajouter un quatrième. Fréquence hebdomadaire, lundi 00:00 inclus à
lundi suivant 00:00 exclu, Europe/Paris par défaut, UTC également disponible.
L’heure d’été/hiver fait partie du calcul des bornes. Une réponse compte dans la
semaine de son **enregistrement CLI**, conservation comprise. L’échéance de réponse
et d’enregistrement est le dimanche 23:59:59 local. Un brouillon, un import dans
le navigateur ou un téléchargement ne compte pas comme une réponse reçue.

Après lancement, les réponses attendent l’échéance commune, puis la première
séance future commune aux actifs concernés et positions du participant. Une autre
place du catalogue ne bloque pas cette opération. L’allocation initiale et la
référence partagent leur clôture future fixée au lancement. Une clôture prévue
manquante reste en attente sur cette date : aucun déplacement rétrospectif.
Sans réponse, les positions et liquidités continuent leur suivi ; aucune décision
« conserver » n’est inventée. Les modèles restent renseignés par l’utilisateur.

Les configurations existantes gardent fréquence et politique d’exécution. Passer
une compétition lancée à une autre fréquence/fenêtre exige une demande configure,
un motif et une trace before/after ; les règles et dates d’exécution des décisions
déjà enregistrées ne changent pas. Le lancement réel n’a pas été effectué.

## Dossier et réponse JSON

Le dossier individuel contient l’état financier à l’arrêté choisi, le participant
et son modèle, capital, liquidités, identités exactes, poids, valeurs, résultats
cumulés et contributions des lignes, performances et référence sur les mêmes
dates/devise, dernière réponse et opérations non exécutées. La dernière semaine
est un bilan commun du vendredi ; un arrêté quotidien ultérieur conserve cette
comparaison hebdomadaire et indique ses deux dates. La première semaine peut
être partielle. Un bilan incomplet empêche copie et téléchargement d’un dossier
présenté comme complet. Cette complétude est vérifiée pour le participant et la référence, sur les deux bornes nécessaires : un autre portefeuille incomplet ne bloque ni son dossier ni son focus individuel. Le classement global reste suspendu si un participant manque. Aucun complément d’actualité ou de marché n’est inventé.

Le texte précise règles, frais, échéance, exécution et unités **synthétiques**.
Résultat de ligne = valeur restante − achats cumulés + ventes cumulées ; contribution
= résultat / capital initial ; frais séparés. Ce n’est pas un rendement calculé
sur un coût de revient qui pourrait devenir négatif après des cessions.
Dividendes et divisions sont déjà intégrés aux cours ajustés, une seule fois.
Les unités synthétiques base 100 ne sont jamais des actions négociables.

Joindre l’export complet `univers-admissible.json` de la compétition. Le texte
principal ne contient pas des milliers de lignes. La réponse version 1 contient
participant, modèle, date, justification et kind :

- `hold` : aucune opération ;
- `target`, `weights: {identifiant: poidsEnPourcent}` : allocation après frais,
  liquidités résiduelles ; les positions omises sont entièrement cédées ;
- `trades`, `amounts: {identifiant: montantDeviseCommune}` : achats positifs,
  ventes négatives ; préférer target pour une liquidation exacte.

L’import par fichier ou texte résout les identifiants exacts. Un ISIN ou une clé
`TICKER|MIC|DEVISE` n’est accepté que s’il désigne exactement une cotation autorisée.
Pas de rapprochement approximatif par nom. Une erreur, un autre participant,
une famille interdite, un dépassement, un manque de liquidités/frais ou des cours
insuffisants empêchent la validation. L’aperçu montre avant/après, mouvements,
frais, liquidités et poids. Une validation manuelle séparée prépare la demande.

## Enregistrement durable et rattrapage

Le navigateur ne contacte aucune IA, aucun courtier et aucun service de stockage.
Il ne détient aucun jeton GitHub. Les saisies et retouches éditoriales restent
temporaires. Télécharger un JSON ne modifie pas le livre versionné.

1. Télécharger la demande préparée.
2. Dans une copie à jour du dépôt :
   `node scripts/ai-portfolios.mjs import /chemin/demande.json`.
3. L’import d’une décision/lancement lance le rattrapage ciblé avant de relire les
   séries et d’appliquer les contrôles. En cas d’échec nécessaire : pas de décision
   enregistrée. Les erreurs précises du collecteur sont conservées.
4. Vérifier le diff, commit/push de `data/ai-portfolios/` et
   `public/data/ai-portfolios/` (ou PR), puis publication validée.
5. Recharger l’outil pour retrouver la révision et la décision publiée.

Pour demander seulement un rattrapage, télécharger la demande non validée puis :
`python3 scripts/collect_ai_portfolios.py --request /chemin/rattrapage.json --request-only`,
`node scripts/ai-portfolios.mjs refresh`, commit/push, publication et rechargement.
Cette demande ne crée aucune décision. L’enregistrement doit encore être validé.

## Collecte exacte

Le workflow quotidien mutualise les identifiants : positions dont le solde
synthétique reste positif par participant, références et décisions recorded/pending.
Une ligne vendue ne demande plus de prix quotidiens mais garde son historique pour
les anciens bilans. Annulations et catalogue global ne déclenchent pas de collecte
quotidienne. Une opération importée ne rattrape que son participant et sa référence ;
un autre portefeuille ou marché ne bloque pas son admission.

Une série existante demande les observations depuis sa dernière date moins 14
jours, puis fusionne avec l’ancrage conservé. Au moins trois observations communes
et leurs cours bruts/ajustés sont vérifiés. Un écart force une collecte complète
depuis l’ancrage ; elle doit réussir intégralement avant remplacement. Une revue
complète est également due après sept jours pour les actifs nécessaires. Aucun
raccord de bases ajustées incompatibles. Réponses, empreintes et périodes des
requêtes sont tracées ; les corrections et effets sur valorisation restent audités.
Si toutes les séances nécessaires sont déjà conservées, le statut sain et la revue
non échue, les prix sont réutilisés sans requête inutile. Un statut qualified seul
ne suffit jamais : identité, devise/unité, calendrier, toutes les observations
attendues depuis l’ancrage, changes et arrêté de la veille UTC sont contrôlés.

Les changes BCE utilisent le fichier 90 jours avec le passé conservé, ou le fichier
historique pour une première collecte. Origines, empreintes, dates et corrections
sont gardées. CBC/ECB pour TWD et GBp/GBP restent inchangés. Les calendriers gardent
jours fériés, fuseaux, bornes certifiées et crypto 24/7. Un marché fermé conserve sa
vraie dernière clôture ; une séance attendue absente bloque le résultat. Pas
d’interpolation ou de substitution.

Qualification périodique des non-détenus : mécanisme reprenable existant,
indépendant de la collecte quotidienne. Source indisponible ne signifie ni
radiation ni garantie de disponibilité future. Yahoo reste le fournisseur des prix.

## Vérifications conservées

`node scripts/audit-ai-runtime.mjs` contrôle les **21 186 cotations qualifiées**
sur leurs séries et preuves réelles, sans nouvelle collecte intégrale. Aucun
échec ; les 35 anciens certificats sans evidenceId sont recoupés par ISIN,
symbole exact, devise, URL et empreinte identiques, sans inventer d’identifiant.
Rapport détaillé `data/ai-portfolios/runtime-audit.json`.

Le test du moteur couvre les **19 240 cotations sélectionnables**, 18 468
instruments, 31 MIC et 15 devises : achat fractionné, valorisation EUR et cession.
Une vraie collecte du nouveau chemin incrémental a validé World, Microsoft,
Diageo en GBp, Bitcoin et l’ETC or Amundi, ainsi que la BCE 90 jours. Preuves
horodatées : `data/ai-portfolios/incremental-validation.json` ; aucune modification
du livre ou des séries de production pour ce test.

Les tests ciblent DST/semaine commune, conservation sans réponse, exécution future,
import exact, validation financière avant enregistrement, dossier incomplet,
exhaustivité de recherche, chargement différé, reprise, révisions, mutualisation
et arrêt des collectes après liquidation. La recette Chromium utilise un livre
isolé et conserve les maquettes PNG. Aucun test de compétition réelle sur une
semaine ni lancement réel n’a été effectué ; cette recette reste une étape ultérieure.

Une recette CLI avec réseau est également disponible :
`node scripts/verify-ai-request-catchup.mjs`. Elle rétablit une vraie clôture
manquante, enregistre une demande uniquement dans un dossier temporaire, vérifie
le refus du doublon avant toute nouvelle collecte et contrôle que le livre réel
est identique octet pour octet. Preuve :
`data/ai-portfolios/import-validation.json`. Elle ne lance aucune compétition.
