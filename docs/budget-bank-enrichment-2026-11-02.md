# Le budget de… — enrichissement de la banque, 2 novembre 2026

## État requalifié avant intervention

Base de travail isolée : master `a484b8c9cd241569ae3af849f73efcad804e96d0`. CLAUDE.md et les références éditoriales, visuelles et de recette de l’audit du 18 octobre ont été relus. Aucun AGENTS.md applicable trouvé. Les PR ouvertes #1144 (éditorial), #1146 (enregistrement des observations), #1061 et #1042 sont préservées ; leurs fichiers ont été examinés. #1144 conserve explicitement les 61 budgets et ne modifie pas leur moteur. Les versions historiques #1115/#1125/#1140 ne remplacent pas ce contrôle de master.

`build-info.json` public avant intervention : code `e61cb2e1d4e2856103130409d0d6377c0e12c831`, données `865f685aefbb43e9399ce4d961ca65c19fe19863`, voie `validated-code-data`, construit le 2 novembre à 09:00:52 UTC. Chromium sur la route publique confirme **61 profils**, deux modes d’image, filtres et suivi manuel daté. Aucun accès ni publication sur X.

## Inventaire et ciblage

L’[inventaire complet avant/après](budget-inventory-bank-2026-11-02.csv) contient pays, devise, revenus, dépenses, affectations, solde, configuration, enfants, logement, profession/statut, période réelle, date de source, vérification, provenance et complétude. Une devise EUR historique par défaut reste signalée comme telle. Aucun pays, enfant, métier, âge ou revenu de conjoint n’est déduit pour compléter les champs vides.

Avant : France 29, Suisse 13, Belgique 3, pays inconnu 16 ; EUR 48, CHF 13. Configurations : couples 27, seuls 8, autres 6, inconnues 20. Enfants : oui 15, non 14, inconnus 32. Logement : location 31, propriété 11, autre 7, inconnu 12. Aucun résident luxembourgeois documenté. Les budgets suisses de référence couvrent déjà de nombreuses configurations : aucune nouvelle colonne de revenu n’est ajoutée pour augmenter le compteur.

Après : **70 profils, neuf ajouts**, tous en EUR ; France 35, Suisse 13, Belgique 4, pays inconnu 18. Couples 30, seuls 11, autres 6, inconnus 23. Enfants : oui 16, non 17, inconnus 37. Location 37, propriété 13, autre 7, inconnu 13. Les nouveaux profils couvrent une activité indépendante avec deux crédits, une installation propriétaire, deux projets d’alternance, une salariée avec petit revenu, une salariée avec crédit auto, deux configurations de couple et une référence belge avec primes annuelles.

Les **61 fiches complètes et leurs textes générés** ont été comparés strictement avant/après, sans modification. Empreinte de cette capture : `625ca60e3896aa44c9e0682f68fba3291dfdc439a6b2a0d7f8a7b904c09ac25f`. Projection financière des 61 profils et identifiants : `65ca0d1444787d3aa231dcdcb308c75caef562aed116ec698c0ffe82bbf9ef4d`, protégée par un test. Aucun changement du stockage, du moteur, du modèle graphique 3 ou de l’interface.

## Neuf admissions

Sources primaires réellement consultées le 2 novembre : messages et réponses du contributeur via l’API publique Discourse, pages HTML complètes et, pour Indexo, calculateur ouvert dans Chromium. L’empreinte du document consulté est conservée dans chaque provenance. Les prénoms des témoignages et des personnes des exemples ont été changés ; les modèles génériques restent génériques.

| Profil / portée et période | Source / date de publication | Ressources / dépenses / affectations / solde (EUR par mois) |
| --- | --- | --- |
| Benoît, 29 ans, indépendant informatique à Lille, en couple, propriétaire ; budget personnel de mars 2025 | [Finary, Maxime847, message 1](https://community.finary.com/t/23767), 02/03/2025 | 5 130 / 3 100 / 2 000 / 30 |
| Axel, 27 ans, célibataire propriétaire ; installation prévue en 2026, pays et métier inconnus | [Finary, Pegasus](https://community.finary.com/t/34498), 21/02/2026 | 2 500 / 1 500 / 1 000 / 0 |
| Apolline, 20 ans, alternante, loyer payé par ses parents ; projet novembre–décembre 2026, pays/configuration inconnus | [Finary, Lyslelys](https://community.finary.com/t/40101), 06/10/2026 | 1 284,78 / 50 / 900 / 334,78 à affecter à la vie courante et aux loisirs |
| Émilien, 20 ans, élève ingénieur, future colocation à Marseille ; projet de rentrée sans année certaine | [Finary, Jules304](https://community.finary.com/t/39107), 18/08/2026 | 1 925 / 850 / 0 / 1 075 à répartir entre loisirs, épargne et projets |
| Clémence, 28 ans, ingénieure environnement, seule sans enfant, locataire à Bordeaux ; exemple de mars 2026 | [Plan & Multiply, étude de cas 1](https://www.planandmultiply.fr/blog/budget-mensuel-guide-complet-2026), 04/05/2026 | 2 280 / 1 965 / 250 / 65 |
| Hugo et Océane, comptable de 32 ans et infirmière de 30 ans, sans enfant, locataires à Lille ; exemple de foyer de janvier 2026 | [Même guide, étude de cas 2 distincte](https://www.planandmultiply.fr/blog/budget-mensuel-guide-complet-2026), 04/05/2026 | 4 550 / 2 920 / 1 450 / 180 |
| Salarié seul sans enfant, locataire en Belgique ; modèle de novembre 2026, sans identité inventée | [Indexo, budget proposé par le calculateur](https://indexo.be/budget/salaire-necessaire/), mise à jour 31/10/2026 | Net cible annuel moyen 2 200 / 2 000 / 200 prévus / 0 |
| Nolwenn, 28 ans, vendeuse, studio à Rennes ; exemple 2026, configuration/enfants inconnus | [Plan & Multiply, méthode des enveloppes](https://www.planandmultiply.fr/blog/economiser-petit-salaire-enveloppes), 01/05/2026 | Salaire hypothétique 1 398 / 1 248 / 50 / 100 |
| Mélina et Loïc, deux adultes et deux enfants, locataires près de Lyon ; exemple de foyer 2026 | [Plan & Multiply, budget familial](https://www.planandmultiply.fr/blog/budget-familial-guide-complet), 10/04/2026 | 4 500 / 3 850 / 450 / 200 |

Une seule admission est un budget de dépenses et versements déclarés ; trois sont des projets publiés par leurs contributeurs ; cinq sont des exemples de référence publiés. Les projets ne sont pas annoncés comme réalisés. Aucun complément de montant n’est attribué à une personne réelle. Les postes groupés ne sont pas artificiellement ventilés.

### Conditions et rapprochements

- Benoît : les 1 200 € couvrent immobilier et voiture, sans ventilation. Les 1 900 € regroupent la vie courante. Aucun salaire de conjointe ou revenu locatif futur ajouté. Les 30 € ne sont pas un virement supplémentaire.
- Axel : 1 350 € incluent charges, alimentation et remboursements. Le LDDS de 200 € prépare des dépenses annuelles/projets : pas entièrement une épargne nouvelle. Pays et métier inconnus.
- Apolline : les 384,78 € prévus sur compte courant comprennent les 50 € fixes. Le reste 334,78 € doit encore payer la vie courante ; libellé explicite dans texte et images. Les revenus/allocations de janvier et les augmentations ultérieures sont exclus. Le sujet /38004 concerne la même personne : pas de seconde fiche.
- Émilien : les 400 € d’aides prévues sont aussi reversés aux parents ; une entrée et une sortie, sans inventer le loyer total ou ventiler les aides. Les lignes donnent 1 075 €, contre 1 100 € annoncés : écart arithmétique de 25 € conservé dans la provenance. L’option discutée de 750 € ne devient pas un versement. L’année de rentrée étant ambiguë, `budgetAsOf` est absent et le profil ne remonte pas artificiellement dans le tri.
- Clémence : le sous-titre de la source annonce 2 350 €, mais sa ligne de salaire, son total récurrent et son calcul final utilisent explicitement 2 280 €. Prime semestrielle de 1 200 € exclue du mois courant. Fixes 1 245 + variables 720 = 1 965 ; capacité 315, virement prévu 250, marge 65. La ligne auto inclut assurance et crédit : aucun gain futur de 217 € promis.
- Hugo/Océane : 2 400 + 1 800 + 350 de primes de nuit lissées = 4 550. Dépenses 1 540 + 1 380 = 2 920. Affectations 800 apport + 250 vacances + 400 précaution = 1 450. La marge courante 180 n’est pas un versement.
- Belgique : la ressource est une **cible de net annuel moyen**, pas un salaire observé ou versé tous les mois. Primes annualisées et précompte explicités dans le libellé principal. Pas d’utilisation du brut calculé pour fabriquer un revenu réel, ni d’ajout du centime d’arrondi annuel du simulateur.
- Nolwenn : les lignes donnent 750 de fixes et 498 de variables ; versement prévu 50, marge 100. Le salaire du scénario n’est pas présenté comme le SMIC 2026, contrairement au raccourci inexact de l’article. Aucune reconstitution des 1 400 € d’épargne annuelle racontés à partir de la marge non dépensée.
- Mélina/Loïc : **les douze lignes fixes font 2 380, et non les 2 580 annoncés**. Variables 1 470 ; dépenses détaillées 3 850 ; affectations 450 ; solde 200. Les 22 lignes sont toutes conservées. Aucun poste inventé pour forcer le zéro annoncé. Les ressources du foyer restent non ventilées en salaires/aides ; les enveloppes vacances et rentrée restent distinctes de la réserve de précaution.

Les jours « 01 » des périodes connues seulement au mois servent au tri mensuel ; ce ne sont pas des jours d’observation déclarés. Les versions annuelles restent des années. Préparation, date de source, période de budget et publication déclarée sur X restent des informations distinctes. Métadonnées contradictoires de modification des pages conservées séparément dans la provenance, sans actualiser les budgets anciens.

## Recherche et exclusions

L’[audit des 42 discussions Finary consultées](budget-bank-candidates-2026-11-02.csv) donne URL, date, titre, décision et motif par candidat : quatre admissions, 38 refus ou doublons. Les réponses du contributeur ont été examinées lorsque disponibles. Les refus historiques du [lot précédent](budget-release-2026-11-02.md) ne sont pas rouverts sans nouvelle pièce levant leur blocage. Les résultats de recherche qui renvoient de nouveau à ces refus ne constituent pas de nouvelles preuves.

Autres sources réellement ouvertes, non retenues :

| Candidat / source | Motif précis |
| --- | --- |
| [Contrôleuse de gestion, Tours, 10/10/2026](https://www.letribunaldunet.fr/argent/budget-mensuel-controleuse-gestion-tours-2480-euros.html) | Les charges détaillées ne retrouvent pas les 1 285 € fixes annoncés. Base net/IR/mutuelle et intéressement lissé ne sont pas rapprochés ; pas d’admission sur les totaux de l’article. |
| [Tailleur de pierre, Angoulême, 22/10/2026](https://www.letribunaldunet.fr/argent/budget-mensuel-tailleur-pierre-angouleme-2070-euros.html) | Périmètre personnel/foyer mélangé, contribution de compagne 700 € introduite après le calcul ; revenu de compagne inconnu. 2 070 − 1 106 − 80 − 893 n’est pas zéro. |
| [Professeur, Amiens, 13/06/2026](https://www.letribunaldunet.fr/argent/budget-mensuel-professeur-lycee-amiens-2340-euros.html) | Variables détaillées 288 + 27 + 192 + 80 + 35 + 72 = 694, mais fixes détaillés ne retrouvent pas 945. Base de salaire, IR et mutuelle non résolue. |
| [Puéricultrice, Grenoble, 16/09/2026](https://www.letribunaldunet.fr/argent/budget-mensuel-puericultrice-grenoble-2210-euros.html) | Salaire 2 210 + ASF 145, dépenses détaillées 1 876,50, versement 95 : reste 383,50 non expliqué ; énergie/hygiène absentes et coût de garde après crédit fiscal, sans trésorerie avant remboursement. |
| [Noémie, Madmoizelle, page mise à jour le 24/01/2025](https://www.madmoizelle.com/noemie-2-950-par-mois-a-deux-avec-un-metier-passion-nous-ne-serons-jamais-riches-1613605) | Le récit situe encore le remboursement à venir en février 2024 et les frais vétérinaires en 2023. Mise à jour 2025 insuffisante pour qualifier ce budget comme 2025/2026. |
| [Budget étudiant à Anvers, 02/10/2026](https://www.reddit.com/r/Antwerpen/comments/1wve7by/cost_of_living_for_a_student/) | 200 € d’aide parentale et futur emploi non chiffré ; réponses fournissant des fourchettes de coûts, pas de revenus et budget individuel rapprochés. |
| [Coût de la vie, Luxembourg, 17/10/2026](https://www.reddit.com/r/Luxembourg/comments/1x82oji/cost_of_living_struggle_is_real/) | Salaire annuel 65 k et logement 1 700 ; net mensuel et autres coûts inconnus. |
| [Foyer de trois, Luxembourg, 10/04/2025](https://www.reddit.com/r/Luxembourg/comments/1jw2g26/current_financial_situation_in_luxembourg/) | Revenu net 5 000 et logement 2 200 seulement. Un commentaire décrit un autre foyer et ne peut compléter les chiffres du premier. |
| [Budget de référence STATEC/LUSTAT, version publiée le 10/07/2026](https://data.public.lu/en/datasets/conditions-sociales-conditions-de-vie-budget-de-reference/) | Panier de besoins de référence ; pas de revenu réel de ménage. Aucun salaire n’est inventé pour transformer un coût en témoignage. |
| [Bilan annuel 2025, Dualtron](https://www.reddit.com/r/vosfinances/comments/1q2zw71/mon_bilan_d%C3%A9sastreux_pour_2025/) | Image source réellement téléchargée/lue : salaires 35 491 + participation aux charges 3 600 + cadeaux 1 332 = 40 423, contre budget 40 517. Écart 94 € non expliqué ; sous-arbres également incohérents. La participation du conjoint n’est pas son salaire. Pas de seconde année ajoutée comme personne distincte. |
| [Référence belge expatriés, 12/01/2026](https://www.cyriljarnias.com/expatriation/installer-en-belgique-expatrie-guide-complet/cout-de-la-vie-belgique-expatries-budget-logement-scolarite/) | Fourchettes pour le salarié seul ; famille surtout centrée sur scolarité internationale et coût global. Nécessiterait de choisir de nombreux montants hypothétiques ; modèle belge mieux défini retenu chez Indexo. |
| [Modèle de retraite, Mensuel](https://mensuel.net/budget-mensuel/retraite/) | Tableau arithmétiquement cohérent, mais édition exacte du budget non datée, pension de référence issue d’une moyenne nette de 2023 ; ne pas l’annoncer comme budget actuel 2026. |

Autres pistes repérées mais non qualifiées par un document complet : moyennes nationales Statbel, tarifs étudiants, calculateurs de répartition et articles de précarité donnant un reste à vivre seulement. Un extrait de recherche, un patrimoine ou une liste de prix ne suffit pas.

**Reliquat : onze profils pour atteindre vingt.** Aucun nouvel exemple suisse ajouté. Les indépendants modestes, retraités, parents seuls et résidents luxembourgeois restent des cibles ; ce lot ne prétend pas les avoir tous couverts. Neuf admissions qualifiées sont préférables à vingt fiches partiellement inventées.

## Vérifications et livraison

Les rapprochements indépendants en centimes et les pourcentages attendus des neuf admissions rejoignent les tests du budget. Contrôles de ressources futures exclues, remboursement d’aides compté une fois, solde non épargné, âges du couple, doublon Lyslelys, période inconnue et regroupements de synthèse (crédits, alimentation, logement, voiture). Lecture intégrale des neuf textes générés. Les textes personnalisés et les migrations existantes ne changent pas.

Master `8730dcbfc499ed08af816eff1d9e9eb66c98f9d4`, incluant #1144 et #1146, intégré sans conflit. Le diff de livraison reste limité aux sept fichiers de données, tests et audit du budget. Compilation complète sur cet arbre et tests unitaires budget/transfert réussis. Aucun seuil de validation ou de taille de bundle relevé.

Les preuves finales des recettes des 70 profils aux trois largeurs (deux images, PNG identique à l’aperçu, copie, filtres), de la conservation des brouillons/statuts, du portail GitHub, de la fusion et de Pages sont consignées dans la PR de livraison. Elles doivent être rapprochées du SHA effectivement publié et du parcours public, jamais déduites du seul build local.
