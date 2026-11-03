# Le budget de… — dix témoignages supplémentaires (30 octobre 2026)

Ajoute uniquement les dix profils de la sélection approuvée par l’utilisateur : dix budgets existants + dix nouveaux. Les trois candidats en réserve (Belge, couple de 33 ans et Baptiste_C) restent exclus. Les témoignages sont des photographies datées, autodéclarées ; aucun compte bancaire n’a été contrôlé et leur situation n’est pas présentée comme actualisée en octobre 2026. Chaque profil conserve source primaire, publication, contrôle, base des revenus et réserves.

## Rapprochements mensuels

| Source primaire | Ressources | Dépenses | Versements au budget | Solde après versements | Qualification |
|---|---:|---:|---:|---:|---|
| [Cybersécurité, 24 ans](https://community.finary.com/t/debutant-en-investissement-besoin-de-conseils/39359), 27/08/2026 | 2 800 € | 900 € | 0 € | 1 900 € | Budget personnel, capacité annoncée ; prêt étudiant en différé conservé dans le contexte. |
| [Alternant ingénieur, 21 ans](https://community.finary.com/t/plan-dinvestissement-debutant-alternant-ingenieur/23973), 08/03/2025 | 2 550 € | 852 € | 300 € envisagés | 1 398 € | Salaire 1 850 + cours 300 + parents 400. Loyer déjà net d’APL ; aucun double comptage. |
| [Alternant, 21 ans](https://community.finary.com/t/strategie-dinvestissement-d-un-etudiant-en-alternance/25836), 08/05/2025 | 1 090 € | 210 € | 750 € | 130 € | Hébergement parental ; postes mixtes conservés groupés. |
| [Locataire, 25 ans, réponse 3](https://community.finary.com/t/dissimuler-un-credit-loyer-besoin-de-vos-avis/31245/3), 08/11/2025 | 2 900 € | 2 160 € | 0 € | 740 € | La réponse précise le net après impôt et le logement charges comprises ; pas de mélange avec les 3 300 € du premier message. |
| [Alternant bâtiment, 21 ans](https://community.finary.com/t/21ans-apprentissage-23-5k-de-disponible/30076), 30/09/2025 | 1 500 € | 300 € | 1 200 € | 0 € | Conversion exacte de la répartition 60/15/5/10/10. Logement gratuit ; alimentation non ventilée, signalée dans le texte. |
| [Étudiant, 20 ans](https://community.finary.com/t/questions-etudiants-debutant-avec-un-budget-de-7-10k/24298), 19/03/2025 | 1 200 € prévus | 400 € | 0 € | 800 € | Budget de septembre 2025 annoncé en mars ; ne pas utiliser le salaire de CDI de 1 800 € ni présenter le projet comme réalisé. Doublon /24418 exclu. |
| [Célibataire, 31 ans](https://community.finary.com/t/question-pour-investissement/34118), 03/02/2026 | 2 400 € | 1 775 € | 625 € | 0 € | Charges 880 + enveloppe courante 895 calculée d’après « le reste ». Cette enveloppe est explicitement nommée calculée. Pourcentages ETF incohérents non repris. |
| [Frontalier, 37 ans](https://community.finary.com/t/37-ans-cadre-frontalier-vos-suggestions-de-strategie-patrimoniale/27399), 30/06/2025 | ~6 700 € | ~3 320 € | 1 572 € | 1 808 € | Source arrondit le reste à 1 800 € ; écart conservé dans le texte, sans inventer 8 € de dépenses. Voiture/essence de fonction. |
| [Salarié du bois, 18 ans, réponse 5](https://community.finary.com/t/2-200-par-moi-a-18-ans/30510/5), 16/10/2025 | 2 200 € prévus | 1 373 € moyens | 0 € | 827 € moyens | Projet de départ : location 450–650, courses 200–300. La moyenne est celle de l’auteur ; dépenses 1 223–1 523 conservées dans le texte. |
| [Ingénieur, 28 ans, Neuchâtel](https://forum.mustachianpost.com/t/todds-introduction/16886), 16/08/2025 | 7 393 CHF moyens | 3 644 CHF recalculés | Pas de virement individualisé | 3 749 CHF | Ressources avec ventes, dividendes et héritage ; pas salaire récurrent seul. Source : dépenses 3 643 et épargne moyenne 3 750, écart de 1 CHF d’arrondi conservé. L’épargne moyenne annoncée est une capacité de 3 750, pas un faux virement qui créerait un déficit d’un franc. |

Les prénoms éditoriaux sont explicitement fictifs, uniques et distincts des dix existants. Aucune ventilation contraintes/non contraintes n’est forcée sur les nouveaux postes mixtes. Les dates, sources et réserves détaillées restent dans la fiche ; les limites nécessaires à la compréhension restent dans le texte et les libellés.

## Devise et compatibilité

La devise facultative accepte EUR ou CHF, avec EUR par défaut pour les anciens profils et brouillons. Sélecteur, fiche, texte, canvas et export utilisent la devise du profil, sans conversion. Une adaptation conserve CHF et permet de sélectionner EUR ou CHF ; aucun montant n’est converti automatiquement. Une devise inconnue rend le brouillon invalide sans écraser le stockage illisible.

Les nouveaux témoignages statiques sont dans un fichier JSON dédié, importé par data.js : aucune logique n’a été déplacée pour alléger artificiellement le budget de route et aucun seuil n’a été relevé. Les données sont comptabilisées comme les autres imports JSON par le rapport de taille existant.

## Validation à consigner avant livraison

- Tests de tous les profils et dix rapprochements indépendants ; CHF, anciennes données sans devise, arrondi suisse et budgets prévus.
- Build complet et seuil de route inchangé.
- Recette navigateur du roster à 1440, 390 et 320 px : texte, canvas complet, PNG égal à l’aperçu, publication manuelle, brouillons et adaptation CHF/EUR.
- CI, fusion, publication Pages, build-info et contrôle public : résultats effectifs à reporter dans la PR.
