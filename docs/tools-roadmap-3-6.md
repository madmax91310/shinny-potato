# Critique outil portefeuille — points 3 à 6

## Chargement

Les récits de Faits marquants et le catalogue annuel du Duel sont calculés au build depuis les registres canoniques. Le navigateur reçoit les résultats complets, avec sources et conventions, sans charger les historiques mensuels et parseurs nécessaires à leur construction. Tests d’égalité exhaustive des faits, du catalogue et des rendements convertis. Le rendu de l’image Duel est importé à la demande ; aucun changement du dessin.

Mesures de dépendances JavaScript statiques, build local :

| Route | Avant | Après | Réduction |
|---|---:|---:|---:|
| Faits marquants | 2 538 ko | 312 ko | 88 % |
| Duel | 1 856 ko | 498 ko | 73 % |

Ces chiffres incluent le code commun, mais pas les modules chargés ensuite (expositions, image, destinations). Les budgets de régression sont abaissés à 350 et 580 ko. Ce sont des poids, pas une mesure de temps de chargement mobile.

## Utilisation des actifs

Un index dérivé au build relie 191 ISIN à 705 destinations disponibles : présentation, comparatif, duel préparé, performance annuelle, simulation mensuelle et anniversaire. Les liens conservent la part exacte. Chaque outil revalide son identifiant et les historiques restent soumis aux contrôles existants. Les destinations ne sont chargées qu’à l’ouverture du panneau.

Trois duels préparés ajoutés sans nouvelle donnée manuelle : World + Momentum / Quality ; ACWI + émergents / émergents hors Chine ; All-World + santé mondiale / eau. Le catalogue contient désormais 45 duels préparés. Tous conservent deux ou trois supports et au moins trois années complètes communes.

## Explications du Duel

Le socle commun n’est expliqué qu’une fois ; une différence de pondération est nommée. Les poches émergentes hors Chine et petites capitalisations émergentes sont explicitées. L’exposition thématique du portefeuille peut dépasser le poids du fonds spécialisé, puisqu’un socle large peut déjà détenir ces entreprises. Les compositions actuelles restent distinctes de l’explication des performances historiques ; aucun rapprochement de pays/secteurs incompatibles n’est ajouté.

La conclusion ne répète plus le montant final déjà affiché. Elle conserve la comparaison des mauvaises années et signale les fenêtres inférieures à six années complètes. Le cas ACWI + émergents hors Chine précise que la Chine reste possible dans la base.

## Cohérence éditoriale

Corrections ciblées : question Value/Quality, répétitions du socle et du résultat dans le Duel, fins génériques des récits Nvidia/Meta/obligations, répétition de l’explication World hors USA et formulations passe-partout du Générateur. Les rubriques, chiffres et modèles d’images sont conservés. Les noms des ETF restent en anglais.

## Vérification

- `test-tools-roadmap.mjs` : projections sans perte, change, identités de toutes les destinations et cas limites des textes.
- `audit-portfolio-duels.mjs` : allocations, historique commun, capitaux, 500 générations.
- `test-portfolio-editorial.mjs`, `test-resource-selections.mjs`, `test-light-registries.mjs`.
- Compilation avec budgets de routes réduits.
- `playwright-tool-links.mjs` en CI : destinations et priorité sur réglages enregistrés, mobile/ordinateur, rendu image du Duel. Suite navigateur habituelle conservée.
