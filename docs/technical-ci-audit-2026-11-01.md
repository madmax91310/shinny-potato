# Portail CI et outillage : audit du 1 novembre 2026

## Défauts confirmés et changements

1. **Répartition incomplète.** Le plan utilisait des mesures anciennes pour les
   seuls contrôles du manifeste. Dix-sept commandes supplémentaires étaient
   affectées en dur, principalement au lot 0 : leur travail échappait au plan.
   Elles rejoignent le même manifeste et la même répartition déterministe sur
   quatre jobs. La sélection NAV particulière reste dans `TEST_NAV_IDS` sur la
   commande concernée. Aucun contrôle, largeur ou actif de cette sélection retiré.
2. **Rapport de lot dépendant d'un effet de bord.** Le runner écrivait son résultat
   dans test-artifacts sans créer ce répertoire (mkdirSync était importé mais
   inutilisé). Un contrôle qui ne crée pas de capture pouvait empêcher le rapport
   de sa propre erreur. Le runner crée maintenant son répertoire ; une recette
   exécute le vrai runner dans un répertoire neuf et contrôle succès, code d'échec
   exact, arrêt après échec et absence de faux succès après suite incomplète.
3. **Avis Vite reproduit en local.** Avec Vite 8.2.1, une requête
   `/.env?vite-wasm-instance` sur un serveur isolé révèle dans l'erreur les quatre
   premiers octets d'un fichier **synthétique** commençant par TEST. Le test
   `test-vite-file-boundary.mjs` échoue avant et passe avec 8.2.4. Les fichiers de
   production et secrets réels n'ont pas été utilisés. Risque d'outillage de
   développement exposé ; pas un serveur Vite en production sur Pages.
4. **Chaîne de build.** Vite passe de 8.2.1 à 8.2.4, source-map-js de 1.2.1 à
   1.2.2. Les avis officiels GitHub ont été relus : Vite
   GHSA-vfpm-58rq-9qcg, GHSA-rq7h-c2jc-7f22, GHSA-9jrq-w75r-8gcw et avis
   launch-editor GHSA-698v-4r3x-3vcv / GHSA-r825-w8mm-5pxw /
   GHSA-587h-7wmj-h5pm ; source-map-js GHSA-68fv-2mgg-jv7q.
   L'application ne traite pas de sourcemaps téléversées par des visiteurs.
   Les autres conditions (Windows/WSL/éditeur, middleware HTML personnalisé,
   chemins importés spécifiques) ne sont pas déclarées exploitées dans cette app.
   `npm audit --json` ne signale plus d'avis à cette date, sans garantie future.
5. **Moindre privilège.** Le jeton OIDC et la permission Pages ne sont plus
   hérités par tous les jobs. Les deux publications gardent Pages/OIDC, le build
   garde Pages pour sa préparation Pages. Les permissions explicites des autres
   jobs restent identiques. Aucun secret ajouté ni accès modifié.

Sources officielles : `https://github.com/advisories/<GHSA ci-dessus>` (API
GitHub Global Security Advisories, consultation le 1 novembre 2026). Les patchs
et le fichier lock sont la protection durable ; le test synthétique garde une
régression directement pertinente pour les sessions de développement.

6. **Déclenchement sans effet sur l'application publique.** Une PR limitée au
   dossier du service indépendant et à son workflow privé lançait aussi tous les
   contrôles Pages. Le portail distingue maintenant ce cas exact, tout en créant
   ses checks (jobs publics explicitement ignorés, workflow privé API/build/
   navigateur inchangé). Un fichier public, une dépendance, un autre workflow,
   une base manquante, une erreur Git ou un périmètre mixte rétablit le portail
   complet. Tous les push master et appels producteurs gardent le portail complet.
   Pas de paths-ignore qui laisserait un check requis indéfiniment en attente.
   Le besoin est démontré par #1120/#1124 : aucun import de ces modules serveur
   dans la SPA ; catalogue et découverte sont générés du canonique vers le service.

## Mesures et portée du gain

API jobs et steps de trois exécutions réussies et douze artefacts réels
browser-durations téléchargés, chacun avec code de sortie de chaque commande.
Les médianes de trois mesures par commande alimentent le plan ; le tableau
ci-dessous rejoue **les mêmes durées** avant/après affectation. C'est un replay
déterministe, pas trois nouvelles exécutions du nouveau workflow.

| Run source | Maximum du travail navigateur avant | Après répartition | Somme travail avant/après |
|---|---:|---:|---:|
| 41331119939 | 1 275,323 s | 1 202,960 s | 4 608,401 s / identique |
| 41328488296 | 1 287,924 s | 1 127,547 s | 4 373,391 s / identique |
| 41327475687 | 1 322,820 s | 1 183,284 s | 4 600,581 s / identique |

Détails bruts agrégés : `technical-ci-replay-2026-11-01.json`. Les coûts de setup,
artefacts et attente sont exclus de ce replay. Le contrôle des nouveaux récits
est conservé mais n'a pas encore de durée dans ces anciens runs. L'ancien
`playwright-wealth` n'est plus dans master au début de cette correction ; il
n'est ni retiré par ce diff ni compté dans la comparaison de périmètre constant.

Le maximum du travail planifié baisse de 72 à 160 s sur les trois traces. Le
travail total reste identique : **aucune économie de minutes de calcul annoncée**
pour cette répartition. La sélection des PR privées évite en revanche les jobs
publics sans effet sur leur résultat : leur coût historique complet ne doit pas
être présenté comme une économie mesurée tant qu’un run de cette voie n’a pas
été observé. Le workflow privé continue à exécuter sa propre recette complète. La somme réelle des jobs des runs de référence est de
132,75 / 131,70 / 136,58 minutes ; le portail est principalement limité par les
lots navigateur après le build. Le gain de temps réel dépendra de la contention
et de la nouvelle CI ; un premier run sera une vérification, pas une preuve
statistique indépendante. Tarifs et facturation non consultés : pas d'euros.

## Protections et décisions conservées

- Un seul build validé pour les navigateurs : dist et projections exactes sont
  déjà partagés. Le vérificateur Tweet Midi est également construit une fois.
- npm ci dure environ une seconde avec le cache existant dans le run témoin :
  partager node_modules ou ajouter un cache complexe n'est pas justifié.
- Les quatre jobs restent présents, fail-fast false, mêmes dépendances de
  publication, même smoke bloquant et même distinction voie données/code.
- Aucun verrou, groupe de concurrence, queue de producteur, condition de
  publication, reçu, preuve financière ou seuil de bundle changé.
- Les producteurs actifs et leurs publications ne sont pas annulés.
- Conservation des artefacts producteurs inchangée ; PNG de diagnostic sur
  échec seulement, sept jours, déjà en place.
- Les doublons apparents de tests entre étapes dont les données générées ou
  dépendances changent ne sont pas supprimés sans preuve d'entrées identiques.

## Validation

Tests du planner, du runner, commandes bornées et contrat de définition du
portail ; reproduction Vite avant/après ; build complet avec budgets et manifeste
public. Ces contrôles sont raccordés au job build existant. La CI et le run Pages
après fusion restent les preuves nécessaires avant d'annoncer une publication.
