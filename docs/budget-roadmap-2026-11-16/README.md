# Budget de… — feuille de route du 16 novembre 2026

## État vérifié et périmètre

Départ de `master` à `8a02fb9`, 97 profils actifs, aucun profil de 76 ans. Aucun `AGENTS.md` présent ; `CLAUDE.md`, la référence générale et les audits budget précédents ont été lus. Les PR #1347 et #1348 sont concurrentes mais ne touchent ni les profils ni l’outil budget. La branche préserve leurs travaux et ceux des collecteurs. Version publique initiale : code `dca8ef54e8af1a24e58e95372dfac3e8eab05fbf`, données `40938a16b0f8b7cea75d2fa85fba2ae33ddc563c`, voie `validated-code-data`. Le parcours public et les exports sont contrôlés séparément du build.

La feuille de route couvre la préparation de la prochaine série, les inconnues utiles, une passe de qualité ciblée, de nouvelles situations et les délais de livraison. Aucun envoi sur X. Pas de refonte graphique et pas de transformation d’un solde en épargne effectuée.

## Préparer douze publications sur l’appareil utilisateur

Une section « Préparer les prochaines publications » présente douze sujets variés dans un ordre alternant situations, pays et revenus. Elle utilise une seule liste dans `publication-selection-2026-11-16.json`. L’utilisateur choisit puis ajoute les profils **uniquement** à « À publier prochainement ».

- Ouvrir la section ne change aucun statut.
- Les profils déjà publiés sont désactivés et affichent leur date déclarée, y compris l’absence de date historique.
- Les entrées déjà dans la file ne sont pas dupliquées. Les profils utilisés restent distincts et identifiés.
- Les textes, brouillons, statut utilisé, statut publié et dates ne sont pas réécrits.
- Une écriture périmée depuis un autre onglet ou un stockage corrompu reste bloquée ; aucune récupération silencieuse.
- La sélection est enregistrée dans le navigateur qui clique. Elle n’est pas appliquée à distance aux appareils de l’utilisateur et ne constitue pas une synchronisation.

`selection-a-publier.json` permet aussi l’import dans le format de sauvegarde version 4 existant. Il ne contient aucun texte, aucun statut publié et aucune date de publication. Préférer « Conserver les versions et statuts locaux » après avoir examiné les conflits ; les sauvegardes personnelles restent le moyen de transfert entre appareils. Les identifiants personnels ne peuvent pas être lus depuis le dépôt : aucun statut utilisateur prétendument recensé ici.

## Passe de qualité et inconnues

`profile-review.json` recense les 97 profils antérieurs : périmètre, source existante, inconnues, origines des questions, calculs et décision de conservation ou clarification. Les 97 séries de totaux mensuels sont inchangées (`financial-before.json`). Les sources des 97 profils n’ont pas toutes été rouvertes pendant cette passe : les consultations et limites déjà documentées sont conservées, sans nouvelle affirmation de vérification indépendante. Les questions des 97 sorties ont été examinées ; les bonnes questions restent en place.

Trois profils clarifiés, sans changement de revenus, dépenses, versements ou marge :

| Profil | Avant | Après |
|---|---|---|
| Monique | Question sur les courses « pour deux », alors que la composition complète du foyer n’est pas établie | Question sur le contenu connu de l’enveloppe : entretien et quelques plats à emporter |
| Séverine | Les clients « ne paient pas toujours à la même vitesse » | Séparation des comptes personnels et de la trésorerie pour gérer les paiements tardifs |
| Ingrid et Joël | Seul le récit précise que les ressources sont les salaires seuls | « Salaires seuls » figure aussi dans le bloc de ressources de l’image ; énergie 220 + eau 40 regroupées à 260 €, composants originaux conservés |

Les avant/après et justifications figurent dans `provenance.editorialReviews`, également accessibles dans la fiche. Aucun texte personnalisé n’est remplacé ; la régénération reste volontaire et l’avertissement de modification du profil est préservé. Les anciens budgets déficitaires restent déficitaires. Les âges, pays, métiers et patrimoines non établis ne sont pas remplis pour compléter une grille. Les inconnues significatives de Baptiste, Florent, Manon, Alban et Monique restent documentées comme dans le lot précédent ; aucune nouvelle source ne permet de les établir.

`all-generated-texts.md` archive les 99 sorties finales. Pas de mention de fabrication, date de préparation, faux témoignage reçu ou citation inventée dans les contenus exportés. Les sources, dates et créations restent dans le panneau de vérification.

## Enrichissement qualifié

**Sept situations candidates examinées sur six fils publics : deux retenues et complétées, cinq non retenues.** Sources de 2026. Les âges, revenus et montants source sont des déclarations publiques, pas des attestations indépendantes. Le lecteur web public a été consulté ; l’API Reddit a refusé l’accès et n’est pas présentée comme lue. Les dates exactes des deux publications initiales viennent de l’index ; la date exacte du commentaire luxembourgeois n’est pas établie et reste nulle (année seule pour le tri).

| Profil | Source | Origine établie | Compléments et enjeu |
|---|---|---|---|
| Iris, 31 ans | [BEFire, 10/08/2026](https://www.reddit.com/r/BEFire/comments/1vkk08s/first_baby_steps_in_fire_project_savings_31f/) | Salaire 2 880 €, participation 375 € puis 500 €, factures 100 €, pension 87 €, réserve 1 500 € ; véhicule et carburant employeur | Dépenses complétées sans redoubler fluides/télécoms/voiture ; phase de deux mois, puis répartition différente. Participation chez le propriétaire, pas une propriété ou un crédit d’Iris |
| Laurent et Eva | [Commentaire dans un fil Luxembourg](https://www.reddit.com/r/Luxembourg/comments/1rpxj52/is_80k_yr_gross_enough_to_live_comfortably_as_a/) | Couple marié à un revenu, 3 850 € mensuels déclarés, loyer 1 600 € pour environ 50 m² | Autres dépenses et épargne prévue 400 € préparées ; marge 330 €. Métier et âge laissés inconnus. Ce commentaire n’est pas l’auteur du titre sur une offre à 80 000 € |

Pour Iris, le pays de résidence reste non renseigné : le forum belge et la banque ne prouvent pas son domicile. Aucun métier précis ni enfant déduit. 1 500 + 2 × 750 = 3 000 € de réserve. L’apport reçoit 600 € pendant ces deux mois puis pourrait recevoir 1 000 € pendant 58 mois, soit **59 200 € de versements** en cinq ans, pas un patrimoine initial inventé ni une performance garantie. Le palier de 10 000 € est retenu comme partie de l’apport, pas une seconde somme promise. Après le logement à 500 € et la seconde répartition, marge = 2 880 − 1 290 − 1 187 = **403 €**. Les primes et titres repas non chiffrés ne deviennent pas des recettes inventées. Les 87 € de pension ne sont pas présentés comme une réserve liquide. La question banque/courtier est une interrogation sourcée reformulée ; les autres questions sont éditoriales.

Pour Laurent et Eva : les 3 850 € sont le salaire déclaré par le commentateur marié, pas un net calculé à partir des 57 000 € annuels ou des 80 000 € du titre. Aucun salaire conjoint ni avantage fiscal ajouté. Les déplacements ponctuels créés sont hors réseau intérieur gratuit ; [source officielle luxembourgeoise consultée](https://luxembourg.public.lu/en/living/mobility/public-transport.html), avec exception de première classe. Aucun véhicule ou crédit auto inventé.

Les doublons sont recherchés par URL, auteur quand identifiable et signature financière (foyer, ressources, flux, patrimoine), pas par prénom. Les deux admissions ont des sources distinctes de la banque actuelle. Aucune correspondance d’identité interplateforme n’est prétendument prouvée.

Non-admissions :

- Le salarié du commerce à 32 heures de BEFire est **déjà Victor** (`prepared-lot2-16-2026-10-30`) : même publication, âge, profession, salaire de 2 300 € et capacité 700–800 €. La vérification sur la photographie d’origine a confirmé le doublon avant admission ; aucune variante sous le prénom Cyril n’est conservée. Le capital source d’environ 15 000 € BTC/World est distinct des créations patrimoniales déjà documentées pour Victor ; ses montants et son récit validés ne sont pas réécrits.

1. [BEFire 28F](https://www.reddit.com/r/BEFire/comments/1wbg7au/your_honest_opinion_on_my_budget_28f/) : budget présenté sous une forme dont les ressources ne sont pas lisibles dans le lecteur accessible ; ne pas déduire le salaire des seuls versements et commentaires.
2. [Projet luxembourgeois à 8 000 € bruts](https://www.reddit.com/r/Luxembourg/comments/1w0pwin/can_i_achieve_savings_of_2k_eur_and_provide_a/) : offre future et employeur juridique incertains, plusieurs nets hypothétiques et régimes fiscaux ; aucun net choisi arbitrairement.
3. [Salarié bancaire au Luxembourg](https://www.reddit.com/r/Luxembourg/comments/1x82oji/cost_of_living_struggle_is_real/) : salaire annuel seul, dette et soins non chiffrés. Les 3 300 € proposés par un autre membre ne sont pas son revenu déclaré.
4. Auteur initial du [fil à 80 000 €](https://www.reddit.com/r/Luxembourg/comments/1rpxj52/is_80k_yr_gross_enough_to_live_comfortably_as_a/) : offres et net estimé, pas de mois observé. Seul le commentaire distinct à 3 850 € est retenu.

Pas de nouveau parent seul, retraité ou indépendant modeste suffisamment qualifié dans cette recherche ciblée ; les profils déjà livrés de ces catégories ne sont pas dupliqués. Pas de quota de nouveaux profils. Banque finale : **99 profils**.

## Délai de livraison et file

Les 131 reçus de commandes réussies du run [43821651933](https://github.com/madmax91310/shinny-potato/actions/runs/43821651933) sont archivés dans `browser-measurements.json`. Les poids de planification sont actualisés séparément des durées utilisées pour les délais limites : **aucune limite par commande ou par job relevée**, aucun parcours retiré, six jobs conservés, Firefox/WebKit installés dans le job qui les utilise réellement.

Rejeu des durées constatées : lot le plus long **1 666,9 s → environ 1 299,8 s**, soit **22 %** de moins pour les commandes seules, hors démarrage, cache, artefacts et publication. Ce n’est pas une promesse de temps réel : les nouvelles commandes et les machines peuvent varier. Le rééquilibrage réduit le temps d’occupation potentiel de la file sans annuler les autres chantiers.

La coalescence existante de Pages a été examinée et ses tests rejoués : sélection du dernier commit compatible, identité du code/données, rejet des observations non publiées et protection des versions de code. Elle est conservée ; pas de deuxième voie de déploiement, pas d’annulation de validations concurrentes ni de contournement du portail complet. La version publique sera rapportée depuis le site réellement servi, séparément du commit de fusion.

## Recette et livraison

Contrôles financiers indépendants, suite budget et sauvegardes, runner et découpage CI, tests du sélecteur de snapshot et de la définition du portail. Compilation complète et Chromium aux trois largeurs, copies et exports effectivement téléchargés ; inspections visuelles distinguées des assertions automatiques. Les artefacts sont dans `test-artifacts` et ceux du workflow. Les résultats finaux et la version publiée sont consignés dans la PR et le compte rendu, après la fusion et la vérification publique.
