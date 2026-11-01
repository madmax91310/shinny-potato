# Le budget de… — intervention du 1er novembre 2026

## État établi avant modification

Base de travail : `master`, `da245d2f967c4dfd761ca1a4ed2bcff6caeaf836`. Aucun AGENTS.md trouvé dans le dépôt ni les répertoires parents applicables. CLAUDE.md et sa référence `docs/claude/audit-application-2026-10-18.md` lus. Le parcours public a été ouvert dans Chromium à 390 px : 50 profils, texte adaptable, case manuelle Publié et modèle 3.

Le build-info public initial annonçait `sha=16fd8b562535a1fc3e0c1a38e55c9576f45f0bdb`, `dataSha=88f92ed4719b1343b98703c61a47dc5d7b971418`, voie `validated-data`, construction du 1er novembre à 12:17 UTC. Cette observation n'est pas une preuve de déploiement du présent changement.

Les PR #1082, #1085, #1093, #1098 et #1101 sont fusionnées. Les PR ouvertes ont été relues : #1108 et #1042 concernent la banque de tweets, #1061 les encours ETF ; #1109/#1111/#1112 concernent les collectes et leurs tests. #1110 concerne le DCA et sa feuille de style importée par cet outil. Les points communs à préserver lors d'une actualisation de branche sont package.json, la liste des recettes navigateur et les styles DCA. Aucun autre outil ni format n'est modifié ici. La PR calendrier #1114 a également été relue ; la découverte navigateur du budget s'appuie sur son titre, sans figer son ancien créneau.

## Inventaire et fidélité financière

L'inventaire ligne par ligne est dans [budget-inventory-2026-11-01.csv](budget-inventory-2026-11-01.csv). Les 50 premières lignes correspondent au corpus existant ; les quatre dernières sont les ajouts. Il conserve pays connu ou inconnu, ressources et devise, configuration familiale, enfants, logement, activité, période, préparation, vérification, provenance, complétude et source.

Avant : 27 pays France renseignés, 4 Suisse, 3 Belgique, 16 inconnus ; 46 budgets EUR (dont 19 anciens sans champ devise, historiquement EUR), 4 CHF. 8 configurations avec enfants renseignées, 12 sans enfants et 30 inconnues. 21 locataires, 11 propriétaires, 7 autres logements, 11 inconnus. Les inconnues ne sont pas déduites du prénom, de la profession ou du forum.

Après : 54 profils, dont 47 EUR et 7 CHF ; 11 configurations avec enfants renseignées. Les 50 anciens tableaux conservent exactement la séquence des montants de ressources, dépenses et versements, la devise et la capacité annoncée. SHA-256 de cette projection financière avant/après : `064c03ee392c2b7b3310e488697e3669673bec9e5f20d00d94721754e43498df`.

Les métadonnées des sources et leurs réserves restent dans le panneau de vérification. Les périodes remplacent les anciennes dates de préparation utilisées comme périodes. Pour les moyennes suisses de 2025 publiées en janvier 2026, le tri reste en 2025 ; le cas belge mélangeant salaire 2026 et dépenses 2025 l'indique et reste classé avec l'observation ancienne. Les références 2025/2026 sans jour de publication conservent cette inconnue. La relecture des textes du 1er novembre est distincte de la vérification financière et de la préparation d'origine.

## Relecture éditoriale

Chaque sortie a été lue en contexte : ressources seules ou multiples, impôt, foyers et budgets personnels, moyennes et dépenses exceptionnelles, logement aidé, crédits, ressources futures exclues, capitaux et flux, épargne et solde. Les sorties intégrales se régénèrent par `buildBudgetText` et sont contrôlées par la recette navigateur pour tous les profils.

Exemples :

- « Budget de Inès » devient « Exemple de budget d’Inès, 42 ans ». Les 2 400 € sont des indemnités chômage, les 645 € financent l'entreprise ; ils ne deviennent pas une épargne de précaution.
- Les lignes « Téléphone de l’auteur » / « Téléphone de sa femme » deviennent celles de Louis / Clara. Le projet d'enfant, les loyers versés aux deux mères et le téléphone remboursé en dix fois restent compréhensibles.
- Les mentions d'anonymisation et de préparation disparaissent des publications et images. Un exemple substantiellement complété reste intitulé Exemple de budget ; une prévision reste un Budget prévu.
- Les 3 749 CHF de Romain restent le solde calculé ; les 3 750 CHF annoncés restent une capacité arrondie. Les ressources exceptionnelles ne deviennent pas un salaire récurrent.
- Les exemples suisses incomplets affichent « Reste à affecter aux frais non chiffrés », avec les exclusions dans le libellé principal. Les 60 ou 10 CHF ne promettent pas que garde, voiture et vacances sont financées.

La présentation publique et les labels sont explicitement revus par profil. Aucun filtre de mots n'efface automatiquement une condition financière. La recherche de mentions internes complète la lecture ; elle ne la remplace pas. Les champs de provenance historiques sont conservés.

## Images et interface

Modèle 3 conservé : graphite, lavande, pêche, menthe, crème. Retours mesurés, colonne réservée aux montants, aucune ellipse. Les lignes courantes passent à 42 px ; les saisies exceptionnelles de 49 à 72 lignes conservent le minimum fixe de 36 px précédemment validé, avec montants placés sous les libellés longs. Pas de réduction progressive de police. Les montants approximatifs portent ≈ dans le montant principal, sans nouvelle petite ligne de disclaimer. La durée limitée du logement gratuit d’Antoine reste dans le contexte principal. Les deux cas extrêmes restent sous 16 384 px de hauteur.

Le choix Détaillée / Synthétique est explicite. La synthèse regroupe les catégories documentées dans leur ordre d'apparition, laisse les postes non classés visibles et ne regroupe pas les versements financiers. Elle utilise les mêmes calculs en centimes. Le changement de version invalide l'ancien aperçu ; le téléchargement utilise son blob exact.

Filtres combinables : pays de résidence, tranche de ressources par devise, configuration, enfants et logement. Les tranches EUR et CHF restent distinctes, sans conversion. Les statuts Utilisé, Publié et À publier prochainement restent indépendants et manuels. Copier ou télécharger ne publie rien et ne change pas Publié.

## Brouillons et transfert manuel

`el-budget-workspace-v2` stocke tous les brouillons, les textes personnalisés et les trois listes de statuts dans un enregistrement atomique. Les anciens `el-budget-*-v1` sont lus et conservés. Une écriture concurrente bloque le remplacement silencieux. Les brouillons restent aussi en mémoire si le stockage refuse l'écriture, avec possibilité d'exporter leur contenu.

Le fichier JSON porte `format: le-budget-de`, `version: 2`, une date d'export et un workspace validé. Les anciens objets de brouillon uniques sont importables. L'aperçu montre les profils, les textes dépliables, les statuts et le nombre de conflits. Le choix global explicite conserve les versions locales ou prend celles du fichier ; les profils absents restent présents. Le stockage est comparé à nouveau au moment d'appliquer.

Avant un import, les versions locales remplacées et les octets éventuellement corrompus sont archivés. Un export de récupération les conserve ; les anciennes versions lisibles peuvent aussi être réexaminées dans l'interface. Un stockage bloqué ou une sauvegarde invalide ne provoque pas d'effacement. Le texte automatique est régénéré à l'ouverture ; un texte marqué personnalisé est conservé. Il ne s'agit pas d'une synchronisation automatique.

## Recherche complémentaire : quatre profils qualifiés, reliquat de six

Les ajouts comprennent un témoignage prévisionnel et trois modèles publiés, pas quatre nouveaux témoignages individuels. Un seul niveau de ressources est retenu par configuration de référence, sans décliner arbitrairement plusieurs colonnes pour augmenter le compteur. Aucune identité n'est inventée pour les modèles.

| Candidat | Source réellement consultée | Qualification |
| --- | --- | --- |
| Élise et Karim, Bourges | [Publication du 12 juillet 2026](https://www.reddit.com/r/VosSous/comments/1uue6ca/jai_besoin_daide_sur_mon_budget/) et [tableau public lu visuellement](https://i.redd.it/on60b03ulsch1.jpeg) | Retenu. Deux salaires 2 110 + 570, CAF 196,60, bourse 216,30 ; dépenses 2 535,92 ; marge prévue 556,98. Vinted et hausse de salaire future exclus. Pas de versement ajouté. Auteur Odd-Year1834 distinct de Ratten-Hell, source du couple lillois déjà présent. |
| Personne seule, 2 500 CHF | [Budget-conseil Suisse, version 2025/2026, p. 1, première colonne](https://conseil-budgetaire.ch/fileadmin/budgetberatung.ch/Downloads/FR/RL_WZ/25_26_BB_personne_seule.pdf) | Retenu comme exemple. Dépenses de base 2 480, réserve 20, reste 0. Revenu de référence sans treizième salaire, impôts dans les dépenses. |
| Parent et enfant, 3 300 CHF | [Modèle monoparental, un enfant, p. 1](https://conseil-budgetaire.ch/fileadmin/budgetberatung.ch/Downloads/FR/RL_WZ/25_26_BB_monoparent_1enfant.pdf) | Retenu comme exemple. Dépenses 3 160, réserve 80, reste à affecter 60. Garde et vacances hors chiffrage, supplément alimentaire dès 12 ans conservé. |
| Parent et deux enfants, 4 000 CHF | [Modèle monoparental, deux enfants, p. 1](https://conseil-budgetaire.ch/fileadmin/budgetberatung.ch/Downloads/FR/RL_WZ/25_26_BB_monoparent_2enfants.pdf) | Retenu comme exemple. Dépenses 3 890, réserve 100, reste à affecter 10. PDF téléchargé et première page contrôlée visuellement. Mêmes limites explicites. |
| Catherine, 68 ans, Belgique | [Marianne, 23 février 2026](https://www.marianne.net/economie/consommation/catherine-68-ans-retraitee-on-fait-attention-a-l-argent-mais-on-prend-l-avion-trois-a-quatre-fois-par-an) | Non retenue : pension non chiffrée dans le contenu accessible, seulement certains frais fixes et courses pour trois personnes. |
| Couple retraité suisse Schmid | [PME, 24 janvier 2026](https://www.pme.ch/actualites/retraite-le-budget-mensuel-dun-couple-en-detail/zl7526q) | Non retenu : ressources détaillées totalisant 14 625 contre 14 630 annoncés ; restaurants non mensualisés et dons bornés seulement par un minimum. Retraits de capital à distinguer des pensions. |
| Laetitia, 47 ans, RSA | [Aufeminin, octobre 2026](https://www.aufeminin.com/societe/news-societe/precarite-2/laetitia-47-ans-mere-celibataire-au-rsa-et-benevole-au-secours-populaire-apres-les-prelevements-il-me-reste-150-a-200-e-pour-faire-vivre-3-personnes-tout-un-mois-2857190.html) | Non retenue : reste après prélèvements documenté, mais pas de tableau complet des ressources et dépenses permettant le rapprochement. |
| Graphiste indépendante à Nantes | [Le Tribunal du Net, 26 avril 2026](https://www.letribunaldunet.fr/argent/budget-mensuel-auto-entrepreneuse-nantes-2100-euros.html) | Non retenue : présentation incohérente du passage CA/net, provisions professionnelles et argent personnel ; les 420 € professionnels ne s'articulent pas avec le reste final annoncé. |
| Salariée belge, 28 ans | [BEFire, 9 septembre 2026](https://www.reddit.com/r/BEFire/comments/1wbg7au/your_honest_opinion_on_my_budget_28f/) | Non retenue : le texte consultable ne restitue pas le tableau complet. Chèques-repas, mobilité et vacances financées par primes doivent être rapprochés avant intégration. |
| Père divorcé, 36 ans | [VosSous, 2025](https://www.reddit.com/r/VosSous/comments/1mc5y3w) | Non retenu : 1 750 € et certains crédits/pension connus, logement et dépenses courantes incomplets ; la fourchette des frais de sa fille ne permet pas un budget complet. |
| Deux retraités face au projet de gel | [TF1, 2 octobre 2026](https://www.tf1info.fr/economie/temoignages-c-est-une-somme-que-je-n-aurai-pas-deux-retraites-calculent-ce-que-les-efforts-demandes-par-le-gouvernement-vont-leur-couter-2467541.html) | Non retenus : témoignages sur l'effet d'un projet de réforme, pas de tableau mensuel complet exploitable. |
| Ina, 69 ans | [Pleine Vie, octobre 2026](https://www.pleinevie.fr/retraite-travail/retraite/ina-69-ans-percoit-une-retraite-de-trois-pays-mais-est-choquee-par-une-facture-fiscale-de-1-626-euros-je-nai-plus-depargne-227692.html) | Non retenue : pensions 1 675 et facture fiscale exceptionnelle 1 626 pour 2024, sans dépenses mensuelles ni périmètre résidentiel complet. |
| Étudiant au Luxembourg | [Université du Luxembourg](https://www.uni.lu/life-fr/aide-financiere/cout-de-la-vie/) | Non retenu : seuil administratif de ressources et prix indicatifs, pas les ressources et dépenses d'un étudiant réel. |
| Salariée IT belge, 28 ans | [Belgium, 3 juillet 2026](https://www.reddit.com/r/belgium/comments/1um8a7v/vlaams_woning_fonds_worth_it_as_a_single/) | Non retenue : 2 500 € bruts et 700 € de mobilité ; revenu net et dépenses complètes manquants. Pas de mélange brut/net. |
| Ancienne militaire reconvertie | [VosSous, 27 juillet 2026](https://www.reddit.com/r/VosSous/comments/1v81lsi/je_narrive_pas_%C3%A0_men_sortir/) | Non retenue : mois à 1 925 / 2 500, tickets repas et frais listés partiellement ; santé, dépenses réellement consommées et nature des 20 € « Ass vie » non rapprochées. Un solde partiel positif masquerait le découvert réel. |

Les trois références suisses sont des dépenses de base, avec frais non chiffrés visibles. Les réserves santé/cadeaux restent des provisions de dépenses ; la réserve explicite pour imprévus est isolée en versement. La source et ses conditions de réutilisation sont conservées dans la provenance. Aucun montant additionnel n'est attribué à un témoin.

Il manque six candidats pour atteindre dix ajouts qualifiés. Les recherches sur les retraités, les indépendants et les résidents luxembourgeois n'ont pas fourni de tableaux suffisamment complets et rapprochés dans ce lot. Les liens ci-dessus permettent de poursuivre la qualification sans inventer les montants manquants.

## Validation et livraison

Tests unitaires : chaque profil valide son texte, ses ressources même sur une seule ligne, ses sommes en centimes, ses pourcentages, la couverture des dépenses et ses conditions utiles. Les régressions historiques gardent leurs attentes financières indépendantes. La synthèse conserve les totaux. Migration, textes manuels, trois statuts, format d'import, conflits, concurrence, corruption et refus d'écriture sont couverts.

Recette Chromium : tous les profils aux largeurs 1440, 390 et 320, deux versions, égalité octet pour octet du PNG et de l'aperçu, copie exacte, contrôle des coordonnées des textes du canvas, absence d'ellipse et de débordement. Les extrêmes EUR/CHF et déficit à 72 lignes restent contrôlés. Une recette dédiée couvre les filtres combinés, le transfert entre deux contextes de navigateur, les conflits, les anciens brouillons, les octets corrompus archivés et le refus de stockage. Les PNG et captures sont dans `test-artifacts/budget-profiles` et les artifacts des recettes CI.

Relecture visuelle : couple à 21 dépenses, Inès et financement de l'entreprise, référence monoparentale CHF et petit reste à affecter, très forte rémunération CHF, absence d'épargne, noms longs et déficit. Les polices restent fixes et toutes les informations sont présentes.

Build complet, contrôles d'architecture, budgets inchangés et manifeste public exécutés. Le statut final de CI, la fusion et le code/dataSha effectivement publiés doivent être contrôlés sur GitHub et build-info.json ; ils ne se déduisent pas du build local. Aucune publication sur X.

### Dépendance de validation constatée

Le premier portail de cette PR (`41319497051`) a reproduit `27 !== 28` dans test-data-review-reminder.mjs. Le défaut a aussi été reproduit localement. Les trois correctifs de tests de #1113, commit `299015df89989dd37f32817046ab62ac4d8e2428`, sont repris à l'identique après lecture : échéances individuelles 13F, borne INSEE propre au calcul personnalisé, invariance intégrale des archives sans mois figé. Ces tests restent stricts et n'altèrent ni donnée, ni calcul, ni seuil financier. Ils constituent une dépendance nécessaire du portail ; la branche concurrente est préservée.
