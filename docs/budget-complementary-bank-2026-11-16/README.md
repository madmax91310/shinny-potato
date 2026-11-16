# Complément de banque et préparation des publications — 16 novembre 2026

## État de départ et périmètre

Départ de `master` à `8895d8e474e7aae80c001626552412cbc61e37e3`, après #1337. Banque réelle : **91 profils**. `CLAUDE.md`, l’audit applicable et les rapports des lots précédents ont été relus ; aucun `AGENTS.md` présent. PR ouvertes vérifiées avant modification puis pendant la recette : aucune ne porte sur les fichiers budget. Les autres outils ne sont pas modifiés.

Version publique de départ constatée dans `build-info.json` : code `e1f7ca723b8acb0a7e1d77d647488baeb58b44fb`, données `8895d8e474e7aae80c001626552412cbc61e37e3`, voie `validated-code-data`. Le `sha` désigne le code déployé, banque incluse ; `dataSha` désigne le commit des données de marché superposées. Ils n’ont pas à être identiques. La vérification finale du déploiement est rapportée dans la PR et le compte rendu de livraison.

`inventory-before.csv` recense les 91 identifiants et leurs catégories réelles. Les empreintes `existing-profiles-preserved.json` vérifient chaque objet historique entier, pas seulement ses totaux : aucune modification des montants, des sources, des récits ou des identifiants précédents. Guillaume conserve notamment son PEL à 45 €/mois. Le profil supprimé de 76 ans n’est pas réintroduit.

Les statuts de publication et leurs dates sont personnels et locaux au navigateur. Ils ne peuvent pas être recensés depuis GitHub. L’inventaire les note donc `device-local-not-readable`, sans inventer « publié » ou « non publié ». Les nouveaux identifiants ne sont ajoutés à aucun statut par l’application.

## Recherche : six admissions, sept non-admissions

Treize dossiers supplémentaires réellement consultés, dont les deux réserves : **six retenus, quatre complétés financièrement**, deux conservés à partir de références publiées avec regroupements/périmètres explicités, sept non retenus. Le lot de quatorze précédent est ainsi complété de six, soit vingt nouveaux profils sur les deux interventions, sans ajouter vingt profils de plus aujourd’hui. Banque finale : **97**.

`candidates.json` donne URL, période, messages propres à l’auteur lorsqu’il s’agit de Finary, empreintes et motif individuel. Une déclaration publique ou un portrait publié n’est pas une vérification indépendante. Les pages MoneyRadar et Budget Famille sont conservées comme portraits/références publiés dans les métadonnées, sans prétendre recevoir un témoignage. Pour Marianne, **seul l’extrait public a été lu** : la partie abonnée n’a pas été consultée ni contournée. Les données utilisées figurent dans cet extrait. La consultation Aufeminin passe par le lecteur web public ; un échec HTTP direct n’est pas présenté comme une consultation réussie du même canal.

Les auteurs des deux nouvelles sources Finary sont comparés, par empreinte et situation, aux auteurs déjà représentés ; les autres admissions sont contrôlées par URL et composantes financières. Les réponses des autres membres ne deviennent jamais les déclarations du profil.

| Profil | Pays documenté | Source / période | Ressources | Dépenses | Versements | Marge | Intérêt |
|---|---|---|---:|---:|---:|---:|---|
| Valentin, 29 ans | France | [Finary 38357](https://community.finary.com/t/38357), juillet 2026 | 3 634 € | 1 912,75 € | 1 200 € | 521,25 € | Première location, prêt étudiant et association professionnelle à préparer |
| Monique, 68 ans | Non renseigné | [Marianne](https://www.marianne.net/economie/consommation/isabelle-68-ans-retraitee-j-ai-gagne-plus-au-chomage-qu-a-la-retraite), juin 2025, extrait public | 1 160 € | 970 € | 100 € | 90 € | Pension personnelle et répartition des dépenses entre deux comptes |
| Djamila, 43 ans | France | [Aufeminin](https://www.aufeminin.com/societe/dossiers/gerer-son-budget/je-suis-dans-le-rouge-tous-les-mois-dans-les-comptes-de-corinne-43-ans-maman-solo-de-2-enfants-et-au-chomage-2677099.html), situation de 2025, mise à jour décembre | 1 146 € | 1 976 € | 20 € | **−850 €** | Deux enfants, chômage et pension alimentaire irrégulière |
| Séverine, 39 ans | France | [MoneyRadar](https://moneyradar.org/articles-votre-argent/finance-a-la-loupe-claire/), septembre 2025 ; modification du site novembre 2026 séparée | 4 500 € | 3 199 € | 1 300 € | 1 € | Activité indépendante, encaissements irréguliers et trésoreries séparées |
| Ingrid et Joël | Belgique | [Budget Famille](https://www.budgetfamille.com/blog/budget-familial-belgique-bruxelles), novembre 2026 | 4 800 € | 4 110 € | 400 € | 290 € | Couple locataire avec deux enfants, budget du mois fondé sur les salaires seuls |
| Tristan, 24 ans | France | [Finary 36718](https://community.finary.com/t/36718), mai 2026 | 1 900 € | 1 200 € | 600 € | 100 € | Propriétaire sans crédit, voiture employeur, patrimoine investi mais très peu de liquidités |

Tous les montants sont en EUR. Aucun nouveau CHF ajouté ; les profils CHF précédents restent inchangés. Les prénoms sont éditoriaux ; âge des adultes d’Ingrid et Joël, métiers exacts et pays de Monique restent inconnus. Aucun compte-témoignage reçu ou citation personnelle inventé.

### Points de qualification importants

- **Valentin** : la réserve `38357` est admise avec des dépenses préparées explicites. Salaire avant impôt conservé, treizième mois non ajouté au mois ordinaire, provision d’impôt de 500 € créée et non certifiée fiscalement. Les 200 € d’achats courants ne sont pas comptés deux fois ; regroupements et composants d’origine restent dans `sourceLedger`. Versements sources de 700 + 500 € conservés. Aucun montant d’association ni loyer futur inventé.
- **Monique** : aucun loyer, abonnement, mutuelle ou assurance automobile payé par son conjoint n’est redéduit de sa pension. Énergie et petits postes manquants complétés, épargne préparée de 100 €, aucun patrimoine détenu inventé.
- **Djamila** : ressources recalculées à partir des composantes, pas du total narratif arrondi de l’article : 970 + moyenne(130,150) + 36 = 1 146 €. Pension irrégulière exclue ; loyer brut et APL ne sont pas déduits deux fois. Aucun revenu ajouté pour effacer le déficit. Versement source d’assurance-vie de 20 € maintenu et déficit visible. Le financement de ce manque n’est pas établi ; cela reste explicitement une limite. Provisions et reste à charge créés séparément des assurances et dépenses sources.
- **Séverine** : 4 500 € est le versement personnel approximatif publié, pas le chiffre d’affaires. Les charges professionnelles ne sont pas déduites une seconde fois. Le pont professionnel source présente un écart de 65 € et des charges non entièrement détaillées ; il est documenté, sans fabriquer un revenu net corrigé. Tableau personnel : 3 199 € exacts, 1 300 € annoncés d’épargne, marge 1 €. Les 19 000 € sont un objectif de réserve, pas un stock attesté. Répartition des versements entre AV/PEA/PER non inventée.
- **Ingrid et Joël** : seuls les salaires publiés sont chiffrés. Allocations et ressources ponctuelles ne sont ni inventées ni assimilées à zéro : la limite figure dans le récit. Provision annuelle 3 000/12 = 250 € ; périmètre préparé excluant les primes d’assurance déjà dans les 170 €, aucun double compte. Pas d’avantage social ou fiscal calculé.
- **Tristan** : salaire moyen calculé entre 1 800 et 2 000 €. Dépenses préparées de 1 200 €, versements authentiques de 600 € : marge 0/100/200 € selon le salaire, sans revenu employeur fictif. Aucun frais auto ajouté à la prise en charge établie. Les encours détaillés ne font que 96 400 €, contre environ 112 000 € annoncés globalement : l’écart n’est pas converti en liquidités. Prêt familial futur éventuel distinct du patrimoine actuel. Pas de loyer ou de crédit créé.

Non-admissions : `24412` reste une réserve (périmètre des charges/crédit et diversité insuffisamment établis), `26961` ne chiffre pas les revenus immobiliers d’un patrimoine important, `39463` ne donne pas son salaire et réside fiscalement en France malgré son emploi belge, `40547` ne chiffre pas ses ressources actuelles, `34219` est le même auteur/situation qu’Alexandre déjà présent. La référence freelance Plan & Multiply omet une affectation dans son calcul de solde ; celle de l’électricien d’Ajaccio redéduit des charges professionnelles après un revenu présenté comme net de ces mêmes coûts. Pas de correction inventée de leurs revenus pour les admettre.

Aucun nouveau profil luxembourgeois qualifié sur cette intervention : Florent, ajouté précédemment, conserve ses hypothèses séparées des faits et son âge inconnu. Les dépenses manquantes sont complétables ; une recette inconnue n’est pas créée pour atteindre un quota.

## Inconnues des quatorze précédents

Les quatorze sources ont été **rouvertes via l’API publique** ; les messages précédemment cités ont toujours la même empreinte (`prior-fourteen-review.json`). Les réponses propres à l’auteur ont aussi été distinguées. Aucun montant n’est changé.

- Baptiste : ni âge ni métier établi. Projet de parking abandonné et revenu de 2 580 € restent tels que qualifiés.
- Florent : deux ans d’expérience ne donnent pas un âge. Esch est le lieu de travail ; la résidence du personnage au Luxembourg reste explicitement une création précédente.
- Manon : « aller à Paris » concerne un projet, pas une résidence actuelle démontrée. Pays non renseigné conservé.
- Alban : le pays n’est pas déduit de ses enveloppes financières françaises.
- Les âges non établis de couples et les enfants non renseignés ailleurs ne sont pas inventés. Des champs inconnus ne signifient pas que les dépenses préparées ou la publication sont inutilisables ; ils limitent ce qu’on affirme et les filtres applicables.

## Sélection à publier prochainement

`selection-a-publier.json` prépare douze situations variées, dont les six ajouts, au **format de sauvegarde version 4 existant**. Il ne contient aucun brouillon, aucun texte personnalisé, aucun profil publié, aucune date de publication ni marque « utilisé ».

Sur l’appareil qui détient le suivi : exporter d’abord sa sauvegarde, puis importer ce fichier dans « Brouillons et transfert entre appareils », examiner l’aperçu et garder **« Conserver mes données locales »**. Les identifiants déjà présents provoquent les conflits normaux ; le choix local préserve leurs textes, statuts et dates. Les nouvelles entrées seules rejoignent la file. Une archive de récupération est créée par le mécanisme existant. Rien n’est synchronisé ni appliqué automatiquement aux autres appareils. Cette sélection ne constitue aucune publication sur X.

## Recette

`generated-texts.md` conserve les six publications finales pour relecture. Chaque ajout comporte deux questions éditoriales attribuées comme telles, jamais une troisième conclusion automatique. Les titres sont neutres, sans date ni mention de fabrication ; sources et créations restent dans le panneau de vérification.

Les images utilisent le moteur existant et la police financière de 40 px. Les libellés et regroupements sont qualifiés dans un vrai Chromium. L’image principale contient toutes les lignes mensuelles sur une seule page 1 080 × 1 350 ; patrimoine et projets restent dans le texte et les pages de détail existantes. Aucun moteur graphique refait, aucune hauteur longue ou microtypographie de secours.

Contrôles : `npm run test:budget` (incluant ledgers indépendants, empreintes des 91 profils, import additif et conflits), compilation complète `npm run build`, `npm run lint`, planification des parcours CI. La recette Chromium et les PNG sont enregistrés sous `test-artifacts/budget-new-profiles-*` ; les résultats chiffrés et l’inspection visuelle effective sont complétés à la livraison. Les commandes CI existantes restent toutes présentes, les seuils ne sont pas relevés.

### Couverture locale réellement réalisée

- Compilation complète réussie ; suite budget et portabilité réussie ; lint sans erreur (avertissements préexistants hors périmètre). Aucun seuil relevé.
- Chromium réel à 1 440, 390 et 320 px : six ajouts, quatre choix d’image, **180 PNG** téléchargés et rouverts ; dimensions 1 080 × 1 350 et SHA-256 aperçu/export identiques. Tous les libellés et montants sont recherchés dans le dessin réel du canvas ; bornes et absence de chevauchement contrôlées. Six images principales d’une page chacune.
- Inspection visuelle effective à largeur 390 : les six images principales, les dix-huit pages détaillées et les dix-huit pages synthétiques. Les dix-huit pages X détaillées sont identiques octet pour octet aux pages détaillées correspondantes pour ce lot. Échantillons denses, déficit, noms de couple, deux enfants, retraite et projet professionnel présents.
- Copie exacte, conservation après rechargement d’un texte personnel puis régénération volontaire, ancienne personnalisation de Guillaume et statut daté du 1er novembre préservés.
- Recette de portabilité existante rejouée aux trois largeurs : filtres combinés EUR/CHF, anciens brouillons, confirmation/modification/retrait de publication, anciennes dates nulles, sauvegardes datées, deux choix de conflit, rejet d’un import périmé et récupération de stockage corrompu.
- Contrôle supplémentaire des cinq filtres combinés pour chacun des six ajouts à 390 px dans le parcours dédié ; comparaison aux résultats attendus du moteur, dont pays/famille non renseignés. Ce contrôle est aussi ajouté aux trois commandes CI du nouveau lot.

Les artefacts PNG locaux ne sont pas committés ; les parcours CI les téléversent dans les artefacts du workflow. Les validations de PR et la vérification publique restent distinctes de cette recette locale.
