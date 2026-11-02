# Le budget de… — profils et publication datée, 2 novembre 2026

## État requalifié

Base master : `712598f15bfbaf8678c8cdfab4280dcc5ea9bfc8`. CLAUDE.md et les sections applicables de l’audit du 18 octobre ont été relus ; aucun AGENTS.md applicable trouvé. Branche isolée de l’intervention précédente. Les PR ouvertes #1061 et #1042 concernent d’autres outils et sont préservées. Les PR #1115 et #1125 sont des références historiques fusionnées, pas la preuve de la version publique.

Avant modification, `build-info.json` public : code `28745bf683c489f60146d745d47dc5c786bdfee5`, données `712598f15bfbaf8678c8cdfab4280dcc5ea9bfc8`, voie `validated-code-data`, construit le 2 novembre à 05:34 UTC. Chromium à 390 px confirme 54 profils, modèle 3, deux versions d’image, filtres, trois statuts et transfert manuel. Le statut publié est bien une liste d’identifiants sans date. Ces fonctions sont conservées.

## Inventaire et ajouts

L’[inventaire CSV](budget-inventory-2026-11-02.csv) décrit chaque profil avant/après : pays, devise, ressources, dépenses, versements, solde, configuration, enfants, logement, profession/statut, période, dates et provenance/complétude. Les 54 premiers gardent leurs montants et identifiants. Projection financière SHA-256 avant/après : `307184cb452405a50dd2c0ab7b1f76359d51f26f0f1d8981377a249911e62de8`.

Avant : France 28, Suisse 7, Belgique 3, pays inconnu 16 ; EUR 47 (dont 19 défauts historiques), CHF 7. Configurations : couple 23, seul 7, autre 6, inconnue 18 ; enfants oui 11/non 13/inconnus 30. Logement : location 25, propriété 11, autre 7, inconnu 11. Aucun résident luxembourgeois documenté ; les frontaliers ne sont pas reclassés comme résidents. Les inconnues ne sont pas déduites des professions ou prénoms.

Après : **61 profils, sept ajouts** ; France 29/Suisse 13/Belgique 3/inconnu 16, EUR 48/CHF 13. Couples 27, seuls 8, autres 6, inconnus 20. Enfants oui 15/non 14/inconnus 32. Location 31/propriété 11/autre 7/inconnu 12. La banque reste insuffisante en Belgique, au Luxembourg et pour les indépendants et propriétaires à revenus modestes.

Les sources suivantes ont été ouvertes réellement le 2 novembre ; les six PDF ont été téléchargés et leurs tableaux de première page lus visuellement. Empreintes des PDF conservées dans la provenance. Un seul niveau de ressources par configuration : les autres colonnes ne deviennent pas des profils pour augmenter le compteur. Les modèles sont intitulés « Exemple de budget », sans identité ou âge inventés. Les ressources non ventilées par l’éditeur restent des revenus de référence ; elles ne sont pas renommées salaires.

| Ajout / portée | Source / période | Ressources / dépenses / affectations / reste |
| --- | --- | --- |
| Couple sans enfant, foyer suisse | [Budget-conseil, 2025/2026, p. 1, première colonne](https://conseil-budgetaire.ch/fileadmin/budgetberatung.ch/Downloads/FR/RL_WZ/25_26_BB_couple.pdf) | 3 750 / 3 720 / 30 / 0 CHF |
| Couple et un enfant, foyer suisse | [Même édition, configuration distincte](https://conseil-budgetaire.ch/fileadmin/budgetberatung.ch/Downloads/FR/RL_WZ/25_26_BB_couple_1enfant.pdf) | 4 400 / 4 360 / 40 / 0 CHF |
| Couple et deux enfants, foyer suisse | [Même édition, configuration distincte](https://conseil-budgetaire.ch/fileadmin/budgetberatung.ch/Downloads/FR/RL_WZ/25_26_BB_couple_2enfants.pdf) | 5 000 / 4 920 / 80 / 0 CHF |
| Couple et trois enfants, foyer suisse | [Même édition, configuration distincte](https://conseil-budgetaire.ch/fileadmin/budgetberatung.ch/Downloads/FR/RL_WZ/25_26_BB_couple_3enfants.pdf) | 5 500 / 5 440 / 60 / 0 CHF |
| Parent et trois enfants, foyer suisse | [Même édition, configuration distincte](https://conseil-budgetaire.ch/fileadmin/budgetberatung.ch/Downloads/FR/RL_WZ/25_26_BB_monoparent_3enfants.pdf) | 4 500 / 4 420 / 80 / 0 CHF |
| Personne majeure en apprentissage, budget individuel | [Budget-conseil, 2025/2026, colonne 1 400 CHF, p. 1](https://conseil-budgetaire.ch/fileadmin/budgetberatung.ch/Downloads/FR/RL_WZ/25_26_BB_apprenties_majeures.pdf) | 1 400 / 1 105 / 210 / 85 CHF |
| Michel, 72 ans, ancien agent d’entretien, locataire en Normandie ; budget individuel rapporté | [Websourd Media, 2 octobre 2026](https://websourd-media.fr/actualites-02-il-vit-avec-1-100-euros-de-retraite-en-normandie-son-budget-detaille-poste-par-poste/) | Pension 1 100 / dépenses 1 100 / versements 0 / reste 0 EUR |

Les cinq budgets de foyers suisses couvrent les dépenses de base : garde, voiture, vacances et autres frais ne sont pas financés. Le reste est donc libellé « Reste à affecter aux frais non chiffrés », même à zéro. Enfants de moins de 12 ans, supplément alimentaire de 50–100 CHF dès 12 ans, net avant impôts et sans treizième salaire conservés. Les provisions santé et cadeaux restent des dépenses, la réserve pour imprévus une affectation budgétée, jamais une épargne observée. Jour de publication inconnu et tri en 2025, distinct de la préparation/vérification de novembre 2026.

Dans le modèle d’apprentissage, les 85 CHF restent destinés aux repas et/ou à la participation au logement ; le libellé principal et le contexte le disent. Logement, configuration et enfants inconnus. La prime LAMal figure bien dans la colonne choisie. Les 210 CHF sont prévus pour vacances/permis, sans prétendre qu’ils ont été versés. Dans le budget de Michel, les 60 EUR pour imprévus restent une enveloppe de dépenses ; aucune épargne réalisée n’est inventée. Montants de pension sans qualification net/brut non fournie. Témoignage rapporté par un seul article, pas des relevés bancaires contrôlés.

## Reprise des quinze candidats précédents

L’[audit précédent](budget-release-2026-11-01.md#recherche-complémentaire--quatre-profils-qualifiés-reliquat-de-six) examinait quinze candidats : quatre déjà intégrés et onze refusés. Le « reliquat de six » était le manque pour atteindre dix ajouts, pas six admissions acquises. Les quatre sources déjà présentes restent des doublons exclus du nouveau lot. Les onze refus ont été repris en priorité :

| Candidat / source | Contrôle du 2 novembre / décision |
| --- | --- |
| [Catherine, Marianne, 23/02/2026](https://www.marianne.net/economie/consommation/catherine-68-ans-retraitee-on-fait-attention-a-l-argent-mais-on-prend-l-avion-trois-a-quatre-fois-par-an) | Page ouverte via recherche ; pension complète toujours non accessible. Accès HTTP direct 403. Pas d’admission sur des frais partiels. |
| [Retraités Schmid, PME, 24/01/2026](https://www.pme.ch/actualites/retraite-le-budget-mensuel-dun-couple-en-detail/zl7526q) | 4 650 + 5 430 + 1 345 + 3 000 de capital retiré + environ 200 = 14 625 CHF, contre 14 630 annoncés. Restaurants et dons non mensualisables précisément. Rejet maintenu. |
| [Laetitia, Aufeminin, octobre 2026](https://www.aufeminin.com/societe/news-societe/precarite-2/laetitia-47-ans-mere-celibataire-au-rsa-et-benevole-au-secours-populaire-apres-les-prelevements-il-me-reste-150-a-200-e-pour-faire-vivre-3-personnes-tout-un-mois-2857190.html) | Page rouverte via recherche ; le reste de 150–200 EUR ne fournit toujours pas le tableau complet de ressources/dépenses. |
| [Graphiste de Nantes, Tribunal du Net, 26/04/2026](https://www.letribunaldunet.fr/argent/budget-mensuel-auto-entrepreneuse-nantes-2100-euros.html) | Article téléchargé et relu : passage CA/net, provisions professionnelles et solde personnel non réconciliables. Rejet maintenu. |
| [Salariée belge, BEFire, 09/09/2026](https://www.reddit.com/r/BEFire/comments/1wbg7au/your_honest_opinion_on_my_budget_28f/) | Publication et commentaires ouverts : 125 EUR de chèques-repas et mobilité séparée, tableau chiffré non restitué. Pas de salaire total et de rapprochement complet accessibles. |
| [Père divorcé, VosSous, 2025](https://www.reddit.com/r/VosSous/comments/1mc5y3w) | 1 750 EUR, crédits 140/70, pension 200, fille 100–150, carburant 200 et assurances 85. Logement et autres postes non complets, aucune fourchette arbitrairement figée. |
| [Deux retraités, TF1, 02/10/2026](https://www.tf1info.fr/economie/temoignages-c-est-une-somme-que-je-n-aurai-pas-deux-retraites-calculent-ce-que-les-efforts-demandes-par-le-gouvernement-vont-leur-couter-2467541.html) | Nouvel accès refusé 403. L’audit précédent n’avait trouvé qu’un effet de réforme, aucun tableau mensuel. Pas de qualification nouvelle possible. |
| [Ina, Pleine Vie, 09/10/2026](https://www.pleinevie.fr/retraite-travail/retraite/ina-69-ans-percoit-une-retraite-de-trois-pays-mais-est-choquee-par-une-facture-fiscale-de-1-626-euros-je-nai-plus-depargne-227692.html) | Article rouvert : pension 1 675 EUR et remboursement fiscal 200 EUR/mois de la dette 2024 de 1 626 EUR ; logement social belge maintenant identifiable, mais loyer et dépenses toujours non chiffrés. |
| [Étudiant, Université du Luxembourg](https://www.uni.lu/life-fr/aide-financiere/cout-de-la-vie/) | Page rouverte : coûts d’installation et conditions/estimations, toujours pas un budget individuel à ressources connues. |
| [Salariée IT, Belgium, 03/07/2026](https://www.reddit.com/r/belgium/comments/1um8a7v/vlaams_woning_fonds_worth_it_as_a_single/) | Publication rouverte : 2 500 EUR **bruts**, 700 EUR de mobilité utilisés pour le loyer, pas le net ni les autres dépenses. |
| [Ancienne militaire, VosSous, 27/07/2026](https://www.reddit.com/r/VosSous/comments/1v81lsi/je_narrive_pas_%C3%A0_men_sortir/) | Publication rouverte : heures supplémentaires et crédits, découvert réel ; tableau toujours incomplet. Un solde partiel positif serait trompeur. |

## Autres recherches et exclusions

Les recherches ont ciblé 2026 puis 2025, France/Belgique/Suisse/Luxembourg, retraités, indépendants et ressources courantes. Recherche web complétée par l’API publique de recherche du forum Finary, puis consultation des messages originaux datés. Comparaison des URL normalisées, auteurs quand disponibles, périmètres et signatures financières avec les 54 profils : aucun des sept ajouts n’est une reprise sous un autre prénom. Aucun budget annuel n’a été converti arbitrairement ; les sources admises sont déjà mensuelles, impôts et réserves compris.

| Sources consultées, non admises | Raison précise |
| --- | --- |
| [Anouk, technicienne son, 03/10/2026](https://www.letribunaldunet.fr/argent/budget-mensuel-technicienne-son-villeurbanne-2140-euros.html) | 38 EUR de remboursement transport séparés, reste à charge transport 29 EUR contradictoire ; fixes annoncés 915 EUR contre 915 de lignes mais autres totaux et inclusion du remboursement ambigus. Pas de double compte forcé. |
| [Sylvain, agent SNCF, 27/08/2026](https://www.letribunaldunet.fr/argent/budget-mensuel-agent-triage-sncf-metz-2240-euros.html) | Salaire 2 240 + allocation 45 ignorée du solde final ; postes fixes 1 075 mais variables 210+140+65+30+55+90=590. Périmètre du solde annoncé incompatible avec les ressources ; taxe d’habitation « résiduelle » non qualifiée. |
| [Guillaume, libraire, 26/06/2026](https://www.letribunaldunet.fr/argent/budget-mensuel-libraire-strasbourg-1690-euros.html) | Trois totaux fixes contradictoires (titre 1 047, paragraphes 865/1 425) et lignes ne les reconstituant pas. Impôt déjà prélevé ou à retrancher ambigu. |
| [Tristan, kiné libéral, 06/06/2026](https://www.letribunaldunet.fr/argent/budget-mensuel-kinesitherapeute-liberal-besancon-2950-euros.html) | 5 800 − (620+1 180+310+140) = 3 550, pas 2 950 EUR. Carburant/charges pro et prêt professionnel mêlés au budget du foyer, fixes et reste incompatibles. |
| [Nadège, accueil, 15/08/2026](https://www.letribunaldunet.fr/argent/budget-mensuel-hotesse-accueil-nantes-1720-euros.html) | Chèques-repas mêlés au disponible, énergie non chiffrée, épargne seulement 40–80 EUR ; dépenses listées ne rapprochent pas le solde. |
| [Nolwenn, hôtellerie, 20/08/2026](https://www.letribunaldunet.fr/argent/budget-mensuel-gouvernante-hotel-deauville-2090-euros.html) | 1 950 + 140×5/12 + 300/12 = 2 033,33, pas la moyenne 2 090 annoncée ; fixes réels 1 226 corrects mais variables 498,49 et statut de l’épargne ambigu. |
| [Yann, cariste, 29/05/2026](https://www.letribunaldunet.fr/argent/budget-mensuel-cariste-dunkerque-1890-euros.html) | 1 720 + 100 + 428 + 70 = 2 318, pas 2 388 EUR ; APL déduite du loyer et déjà dans les ressources, mutuelle déjà prélevée : pas de rapprochement fiable. |
| [Solène, commerciale, 08/09/2026](https://www.letribunaldunet.fr/argent/budget-mensuel-commerciale-sedentaire-besancon-2190-euros.html) | Fixes détaillés 1 170,98, variables 649,90 ; total 1 820,88 contre 1 949 annoncé ; 130 de chèques-repas non rapprochés. |
| [Sandrine, laboratoire, 02/05/2026](https://www.letribunaldunet.fr/argent/budget-mensuel-laborantine-strasbourg-2310-euros.html) | Fixes 1 180 et variables 650 donnent 1 830 ; 2 395 − 1 830 = 565, pas 365. Vacances 1 400/an vs 120/mois incohérentes. |
| [Jeune notaire, Finary, 15/07/2026](https://community.finary.com/t/38357) | Salaire avant impôt, impôt absent, dépenses de vacances reconnues comme non suivies. Le témoin confirme que le delta d’environ 1 470 EUR est une inconnue : pas un solde disponible démontré. |
| [Couple retraité, Finary, 13/08/2025 et suivi](https://community.finary.com/t/28718) | Patrimoine et crédit 750 connus, pensions et dépenses courantes non chiffrées. |
| [Indépendant, Finary, 10/04/2026](https://community.finary.com/t/35437) | Chiffre d’affaires variable 1 500–5 000, ni revenu personnel net ni tableau de dépenses. |
| [Chargé de clientèle, Finary, 23/07/2026](https://community.finary.com/t/38548) | Salaire 2 050 et primes 8 000/an, affectations connues, dépenses courantes non renseignées ; voyages seuls ne suffisent pas. |
| [Belgique, Finary, 30/10/2026](https://community.finary.com/t/40547) | Donation patrimoniale de 100 000, recherche d’emploi : aucun budget de ressources/dépenses mensuelles. |
| [Frontalier, Finary, 10/06/2025](https://community.finary.com/t/26793) | Heures supplémentaires et crédit connus, dépenses courantes absentes. Ni résident luxembourgeois ni budget complet. |
| [Policier, Finary, 28/06/2026](https://community.finary.com/t/37939) | Salaire 2 200, logement 950 et investissement souhaité 200 seulement ; autres dépenses manquantes. |
| [60 ans, Finary, 08/02/2026](https://community.finary.com/t/34221) | Revenu TNS 4 000 et retraite future 3 000, patrimoine détaillé, mais pas de dépenses mensuelles rapprochées. |
| [72 ans, Finary, 26/07/2025](https://community.finary.com/t/28164) | Héritage, propriété et placements seulement ; pension et dépenses absentes. |
| [58 ans, Finary, 30/06/2026](https://community.finary.com/t/37969) | Capacité d’épargne actuelle/future et crédit restant, sans ressources et dépenses mensuelles complètes. |
| [Construction, Finary, 04/08/2026](https://community.finary.com/t/38815) | Foyer 4 900 + SCPI environ 200, logement actuel et prêt futur, dépenses quotidiennes absentes. Pas de mélange actuel/futur. |
| [Projet bateau, Finary, 15/07/2026](https://community.finary.com/t/38370) | Patrimoine et épargne possible seulement, budget projeté 2029 hors période prioritaire, pas de ressources/dépenses actuelles complètes. |
| [Jeunes au Luxembourg, Virgule, 23/04/2026](https://www.virgule.lu/luxembourg/comment-les-jeunes-etrangers-trouvent-ils-un-logement-au-luxembourg/146894855.html) | Texte accessible par l’index : logement étudiant 400, salaire seulement déduit d’un ratio, autres dépenses absentes. Accès direct interdit aux robots ; aucune qualification sur un extrait. |

**Reliquat : trois candidats manquent pour dix ajouts qualifiés, huit pour quinze.** Sept sont admis, dont six modèles explicites et un témoignage rapporté. Aucune identité ni montant ajouté pour compléter le lot. Les catégories Belgique, Luxembourg, indépendants et propriété avec crédit à ressources modestes restent à compléter lorsque des tableaux suffisants seront accessibles.

## Suivi manuel daté et compatibilité

La case « Profil publié » ouvre un formulaire ; elle ne devient cochée qu’après « Confirmer la publication ». La date proposée est le jour courant Europe/Paris (testé aussi près de minuit et en heure d’été/hiver), sans lien avec la source. Une date passée est autorisée ; date invalide ou future refusée. Affichage « Publié le JJ/MM/AAAA », modification, retrait immédiat et bouton « Annuler le retrait » qui restaure aussi la date inconnue le cas échéant. Les statuts utilisé, à publier et publié restent indépendants. Ni copie ni PNG ne publient. Aucun accès ou publication sur X. La validation du contributeur reste séparée.

Workspace et export passent en version 3, en gardant la clé atomique historique. Migration en lecture des versions 2 et anciennes clés : tous les identifiants publiés sont conservés, leur date vaut `null`, affichée « Publié — date non renseignée ». Les octets ne sont remplacés qu’après écriture réussie. Une ancienne application refuse un workspace v3 plutôt que d’en effacer les dates. L’export v3 conserve les dates ; import v2 et anciens brouillons uniques acceptés. Une différence de date seule est un conflit, avec choix local/fichier explicite et date visible dans l’aperçu. Dates invalides rejetées, sauvegardes corrompues préservées, archives restaurables, concurrence comparée avant écriture/import. Les textes personnalisés restent inchangés et les identifiants de participations sont conservés.

## Recette

Tests unitaires du budget et du transfert : sept rapprochements indépendants en centimes, pourcentages, synthèses sans double compte, devises, absence de doublons de source/nom/identifiant, conditions indispensables et sorties éditoriales. Tests de migration v1/v2 sans date inventée, export v3 et import v2/v3, conflits portant seulement sur la date, concurrence, corruption, refus de stockage et textes personnels.

Compilation complète et seuils existants inchangés. Recettes Chromium à 1440, 390 et 320 : corpus entier dans les deux modes, mesures des textes sur canvas et PNG identique octet pour octet à l’aperçu, copies exactes, filtres/tri, budgets EUR/CHF, longs noms, absence d’épargne, déficit et maximum de lignes. Parcours du suivi daté dans la recette de transfert : confirmation/annulation, aujourd’hui Paris, passé, futur refusé, modification, retrait/annulation, rechargement, import/export et date inconnue.

Les états de réussite des commandes, de la PR, de la fusion et de Pages ainsi que les identifiants publics sont à établir au terme de la livraison ; ce document ne transforme pas un build local en preuve de déploiement.
