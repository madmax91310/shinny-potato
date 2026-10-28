# Données à revoir — fiabilisation du 28 octobre 2026

Le candidat corrige les liaisons de preuves, le classement des données présentes, des clôtures historiques ciblées et la lisibilité du centre de suivi. **Il reste 2 108 points à traiter dans le rejeu comparable. Ce nombre n'est ni zéro panne ni une mesure de données absentes.** Aucun collecteur fournisseur n'est annoncé réparé par ce lot de supervision. Aucune fusion ni aucun déploiement n'est autorisé par la dernière demande.

## Périmètre et état initial reproductible

Consignes : `CLAUDE.md`, référence `docs/claude/audit-application-2026-10-18.md`, rapports consolidés du 24 octobre et suivi existant relus avant modification. Les observations historiques sont requalifiées sur le code courant, sans réintroduire Portefeuilles IA.

Capture publique du 28 octobre à **15:14:17.582393 UTC** : code `79c7245a146c759c872d1e3601c591c894366c2b`, données `7c54f55d10a05ba2a9a0fbb54daf72e9da5cc72c`, voie validated-data, construction 15:10:46. Les octets, URL et empreintes sont conservés dans `preuves/capture-initiale/`. L'état publié donne alors **3 430 points, 3 094 qualifications, 182 raccordements, 151 pannes/anomalies et 3 lacunes de surveillance**. Les nombres 3 095/150 du précédent relevé ne sont donc pas figés dans un test.

Base initiale `0e73de84a8d6049992075e446fbdf376b000c6cc`. Après examen des travaux concurrents, les corrections Générateur #1013 et Radar #1014 sont intégrées par rebase sur **`9a7b862110042ebc75c08ebacf3c53b2933c82ca`**. #1012 possède les voies NAV et leurs calculs ; #1015 possède le transport du radar. Leurs collecteurs, moteurs et visuels ne sont pas modifiés. Seul appendice partagé : `docs/data-operations-coordination.md`.

Une deuxième recette publique ordinateur/mobile a chargé les quatre vrais documents sans substitution : **3 492 points** avec le moniteur du **28 octobre 16:58:45.671992 UTC**, code public `d771f2d30588d3157804c28d37986900a9465d7a`. Répartition : 3 094 qualifications, 183 raccordements, 150 anomalies, 65 lacunes/diagnostics de surveillance. Les **72 nouveaux signalements** sont conservés : **62 comptes rendus Radar interrompus du run 40725300073**, **deux erreurs de composition** (`IE000NDWFGA5` : cellule numérique vide ; `IE00B441G979` : portefeuille non long-only) et **huit contrats d’usage de positions intégrales à qualifier**. Le détail est consigné dans `nouveaux-signaux-publics.csv`, Le transport Radar est possédé par #1015 ; les autres points restent attribués à leur producteur. La différence entre signaux et points explique que ce décompte ne se soustrait pas directement à 3 492. Ce relevé mouvant n'est pas soustrait au rejeu comparable.

Le bilan principal compare master 9a7b8621 et le candidat avec les **mêmes entrées et la même horloge d'évaluation, 16:29:09.081135 UTC**. Cette horloge de rejeu ne modifie aucune observation, date de collecte ou règle de fraîcheur. Le résultat 3 431 diffère du relevé public 3 430 parce que les registres et le code master sont plus récents. Le bilan de la première base est conservé séparément dans `initial-master/`.

## Comptage

| Classe | Master comparable | Candidat |
|---|---:|---:|
| Points à traiter | 3 431 | 2 108 |
| Qualifications manquantes | 3 094 | 1 881 |
| Données nécessaires non raccordées | 183 | 73 |
| Pannes ou anomalies | 151 | 152 |
| Surveillance non démontrée | 3 | 2 |
| Historique et résolutions | 1 147 | 1 149 |
| Attentes normales | 17 | 17 |
| Revues éditoriales | 784 | 784 |
| Non applicables et archives | 280 | 280 |

Les 152 pannes incluent une reclassification depuis la consommation : la réduction d'un autre compteur ne constitue pas une réparation de source. Tous les **10 853 signalements initiaux** sont rapprochés : **8 241 conservés, 2 610 liaisons exactes démontrées, 2 résolutions historiques ciblées, zéro disparition inexpliquée et zéro nouveau signalement** dans ce rejeu. Voir `suivi-avant-apres.csv` et `suivi-signaux.json.gz` pour les preuves attachées ; `points-ouverts.csv` donne chaque réserve, son action, ses sources, ses dates et ses outils déclarés.

Définitions : un champ est une observation ou une série sous contrat ; un usage est le couple de ce champ et d'un outil déclaré ; un signalement est une entrée issue d'un rapport ; un point réunit les signalements du même champ quand leur preuve correspond ; une cause commune exige un même producteur, run, tentative et étape ou rapport ; un épisode historique demeure distinct de la réparation actuelle.

L'ancien regroupement en 537 « causes » fusionnait notamment des messages/URL semblables après effacement des dates. Il ne prouvait pas une cause commune. Les **2 108 groupes prudents** du candidat ne sont pas comparables à ces 537 groupes. Les points non reliés par une preuve restent séparés, consultables et paginés.

Les dénominateurs sont distincts : **4 275 certificats de couverture**, **4 556 champs catalogue**, **27 974 usages requis déclarés sur 23 outils**, **24 producteurs/contrôles et le moniteur lui-même**. La suppression de 74 doubles représentations du même certificat fait passer 28 048 usages à 27 974, sans supprimer de champ, actif ou consommateur. L'affectation d'un actif à un outil reste une déclaration lorsqu'aucune liaison précise de champ n'est prouvée ; elle ne démontre pas que tous ses calculs consomment ce champ.

## Corrections démontrées

- **Donnée présente ≠ donnée absente.** Un usage bloqué avec donnée présente reste une qualification à compléter ; une panne source reste une panne. Une présence inconnue n'est pas transformée en absence. Les contrats sans certificat expliquent désormais la preuve ciblée à raccorder.
- **1 229 champs du lecteur Radar** reprennent le certificat source existant seulement sur identité, valeur, URL, contrôle, période, périmètre, devise, méthode et membres concordants. Les gardes de composition de #1014 sont appliqués. Ni panier de substitution, ni composition partielle, ni PEA inconnu ne devient une exposition complète ou une valeur certaine.
- **38 historiques mensuels supplémentaires / 152 usages** retrouvent leur certificat exact. La page générique du fonds ne remplace plus l'URL de la série collectée ; méthode et bornes sont conservées par la façade. Une empreinte SHA-256 de tous les points, devise et méthode interdit la qualification d'une série différente. Le certificat Bitcoin couvre réellement BTC-USD/Yahoo et conserve son contrôle du **5 octobre**, sans le dater du build. Aucun cours n'est changé.
- **Clôture consommateur publiée.** Un ancien incident de qualification mensuelle ne peut être clos que si les fichiers source et la façade consommée ont les mêmes empreintes dans le manifeste public. Ce nouveau code n'étant pas déployé, les incidents qui exigent ses octets restent ouverts dans le rejeu. Aucune clôture sur le seul succès d'un workflow.
- **Dates ciblées.** Une tentative PEA ne renouvelle plus implicitement celle des cotations. Périodes, tentatives et contrôles conservés sont transmis au diagnostic sans fabriquer une date inconnue.
- **Fenêtre historique Radar.** L'API GitHub réelle énumère exactement 51 runs entre l'ancre 40198351233 et la première lacune : l'ancre déjà suivie et 50 exécutions skipped. Aucun résultat ordinaire manqué dans cet intervalle. La fausse lacune issue d'une lecture limitée à 30 est résolue avec liste des identités et empreinte de page ; un run ordinaire, une page manquante ou un échec API empêcherait cette clôture.
- **Échec historique du moniteur 40213617352.** La lecture complète des jobs démontre l'interruption de `Initialise current statuses` dans un job en échec. Le succès de la **même étape**, run 40395077280 du 26 octobre 20:26:47, qualifie sa reprise. Ce n'était pas une panne avant toute étape. Les autres épisodes sont conservés.
- **Bitcoin historique.** Contrat limité au code historique exact `3976ea40…`, ses étapes et ses trois sorties. Validation et enregistrement sont démontrés ; deux fichiers sont identiques aux fichiers publiés. `automated-indices.json` diffère : publication globale toujours non démontrée, noms des fichiers et preuve partielle affichés. Aucune réussite source actuelle ni disponibilité des autres indices déduite.
- **Stockage historique sans perte.** Seuls les grands tableaux historiques sont compressés avec SHA-256, longueur décodée et cardinalités ; incidents actifs, horloges et périmètres restent préservés. Le véritable état passe de 77 607 493 à 60 829 012 octets après compactage des périmètres puis archives, avec restitution identique. Une archive ou un producteur illisible ouvre son incident sans interrompre les autres.
- **Interface.** Regroupement sur preuve, condition de clôture par classe, dénominateurs explicites, dates et action exploitables. Export JSON complet avec définitions des périmètres de preuve ; recherche, copie de secours et pagination restent accessibles sur mobile et ordinateur. Un moniteur absent, ancien ou invalide ne donne pas un écran rassurant.

## Réserves conservées

- **1 881 qualifications** : 1 305 à la consommation, 488 en qualification source, 79 financières, 8 d'enregistrement et 1 d'historique du moniteur. Le certificat exact des autres familles (notamment documents, SCPI, paramètres, métriques, fonds/indices) n'est pas déduit de la disponibilité d'une URL, d'un workflow ou de la présence d'un actif dans un outil. Le détail de la comparaison manquante est conservé par champ.
- **73 raccordements** : sources à qualifier, documents contractuels propres au support, périmètres économiques complets et quelques valeurs réellement absentes. Une allocation d'indice n'est pas remplacée par un fonds de substitution. Les tarifs manuels sont distincts d'une alimentation automatisée.
- **152 pannes/anomalies** : contrôles échus, erreurs de transport et contradictions datées restent actifs tant que le producteur ne prouve pas leur résolution ciblée. Les contradictions du Radar relèvent du chantier concurrent ; ce lot ne choisit aucune valeur à sa place. Les échecs fournisseur WisdomTree et les reprises NAV appartiennent à #1012 ; sa CI fournisseur rouge n'est pas déclarée verte ici.
- **Deux lacunes de surveillance** : publication Bitcoin partiellement rapprochée ; artefact Radar du run **40131317914** réellement absent (API zéro artefact, log de dépôt « No files found … feed.json »). Un autre rapport ou une exécution verte ultérieure ne remplace pas ces pièces. La couverture du moniteur antérieure à sa fenêtre initiale de lecture reste également explicitement non démontrée dans sa qualification historique.
- **79 cas financiers ouverts/résiduels sur 90** sont conservés. Les garde-fous refusent 41 fenêtres de cotations ajustées et préservent 38 cas NAV indépendants. Aucun seuil financier modifié, aucune inconnue passée à zéro, aucune prolongation ou renormalisation.

Ces réserves sont des travaux ouverts, pas toutes des dépendances externes insolubles. Le lot améliore la fiabilité du diagnostic ; il ne prétend pas achever tous les contrats de l'application ni prouver tous les parcours de tous les consommateurs.

## Validation et preuve

`matrice-producteurs.csv` énumère les 24 producteurs et leurs rapports attendus ; `classes-de-panne.csv` relie les classes aux tests et précise leur niveau. Les scénarios injectés dans les vrais lecteurs/réducteurs ne sont pas présentés comme des collectes fournisseur réussies.

- 140 tests Python de supervision ; 44 tests Python de contrats producteurs ; contrats JavaScript producteurs.
- Inventaire, qualification, certificats catalogue, consommateurs, réconciliation, projection exhaustive et budget de projection ; 707 historiques propagés dans les consommateurs mensuels.
- Contrôles financiers 90/79, patrimoine (15 groupes), Impact des frais (2 880 variantes et 7 contrats), compilation et contrôle des 4 275 certificats / 41 fichiers du manifeste construit.
- Chromium ordinateur/mobile : recherche au-delà de la première page, filtres, regroupement démontré, pagination imbriquée, copie avec repli, export intégral, moniteur absent/invalide/périmé/réseau, projection incohérente puis reprise.
- Parcours réels et **15 PNG** : deux fiches Or, IBKR, DCA, secteurs ETF, cessation Tudigo, avec textes et données communes.

Les réponses GitHub et le rejeu sont dans `preuves/` ; ils sont **en lecture seule**. La validation du futur code par le producteur ordinaire sur master ne peut pas être revendiquée avant fusion autorisée. La recette du candidat avec le véritable état capturé/rejoué affiche bien **2 108 points**, conserve les **79 cas financiers**, exporte les **416 définitions de périmètre** avec zéro référence manquante, sur les deux tailles d'écran et sans erreur JavaScript. Les empreintes des PNG réellement générés sont dans `preuves/exports-png.json` ; les images restent aussi disponibles dans les artefacts locaux de recette. Les résultats et captures sont dans `preuves/browser-real-candidate/` ; la recette publique dans `preuves/browser-public/`.

La CI de PR doit être consultée séparément pour son résultat exact. Aucun run volontairement défaillant n'est provoqué en production.

## Reproduire le bilan

Décompresser `preuves/capture-initiale/*.json.gz` dans un dossier de capture, garder `capture.json`. Utiliser un checkout séparé de master 9a7b8621 avec ses dépendances. Depuis le candidat :

```sh
node scripts/report-data-review-reliability.mjs snapshot --root CHEMIN_MASTER --capture CAPTURE --at 2026-10-28T16:29:09.081135+00:00 --output AVANT
node scripts/report-data-review-reliability.mjs snapshot --root CHEMIN_CANDIDAT --capture CAPTURE --at 2026-10-28T16:29:09.081135+00:00 --monitor reports/data-review-reliability-2026-10-28/preuves/after-monitor.json.gz --output APRES
node scripts/report-data-review-reliability.mjs reconcile --before AVANT --after APRES --output BILAN
```

Les instantanés avant/après sont aussi conservés dans `preuves/current-before` et `preuves/current-after`. Le CSV de suivi donne une ligne par signal initial et le JSON compressé sa preuve détaillée. `SHA256SUMS` contrôle les pièces. Les collecteurs continuent à évoluer : ces instantanés sont un bilan daté, pas des compteurs vivants figés dans l'application.
