# Audit de vraisemblance des 101 budgets

Base de comparaison `b23b07a0`, issue des PR #1392 et #1393. Relecture du 19 novembre 2026.

- [Matrice des 101 profils](matrice.csv) avec contexte, lignes regroupées par poste, repères, limites, totaux, texte et export.
- [Grand livre des 1 547 lignes](lignes.csv) avec les montants affichés, le périmètre, la source de chaque montant quand elle est isolable, et l’équivalent sur douze mois si reconduit.
- [Repères datés](sources.md) et [55 profils à information essentielle manquante](exceptions.md).

**46 profils validés dans leur périmètre.** Les revenus, charges structurantes et postes atypiques ont un ordre de grandeur explicable ou un périmètre éditorial explicite. Le statut caractérise la vraisemblance du budget présenté. La source de chaque profil reste indiquée.

**55 profils avec une limite essentielle.** Le calcul et l’export passent également pour ces profils. La dernière colonne d’analyse donne la limite propre à chaque fiche. Cela comprend les revenus variables de Marc, le salaire non isolé de Romain, le voyage frontalier d’Adrien, le périmètre des achats de Noémie et l’aide Mobili-Jeune d’Apolline. Les postes sans montant isolé peuvent être groupés, hors périmètre ou inconnus. Les équivalents sur douze mois sont arithmétiques lorsque la reconduction est incertaine, notamment pour les mois avec bonus. Les postes mixtes peuvent être signalés dans plusieurs colonnes de la matrice. Seul le grand livre et les sous-totaux servent à additionner les montants.

## Corrections

| Profil | Évolution |
| --- | --- |
| Djamila | Vêtements du foyer 35 → 75 €/mois, soit 420 → 900 €/an, hypothèse d’achats d’occasion. Dépenses 1 976 → 2 016 €, manque avant versement 830 → 870 €, reste −850 → −890 €. Réserve de scénario 2 550 → 2 670 €, couvrant trois mois sans pension. Les sommes déclarées, dont les 20 € d’assurance-vie, sont conservées. [Texte](djamila.txt) · [PNG 1 080 × 1 350](djamila.png) |
| Morgane | Trajets et entretien auto 180 → 240 €/mois avec 60 € de provision explicite. Dépenses 1 650 → 1 710 €, capacité 750 → 690 €, reste 250 → 190 €. Les 12 000 € de réserve couvrent 11 920 € sur huit mois creux avec le PEA. Les frais professionnels sont déjà déduits du revenu disponible. [Texte](morgane.txt) · [PNG 1 080 × 1 350](morgane.png) |
| Adrien | Les 2 800 € nets après impôt et l’enveloppe de 40 € sont conservés. Le tweet précise que le coût complet du trajet frontalier reste inconnu. Le reste conditionnel est de 130 €. |
| Noémie | Pouvoir d’achat encaissé et titres-restaurant restent distincts. Le chiffre de 200 € couvre les courses payées sur le compte. Part des titres affectée aux courses et répartition du couple inconnues. Reste 80 €. |
| Apolline | Les 100 € d’aide restent une prévision dépendant de la dépense de logement à sa charge. Le reste prévu de 124,78 € serait de 24,78 € sans l’aide. |

Les données historiques et le périmètre d’origine restent disponibles. Les ajouts éditoriaux sont enregistrés dans la couche de revue. Les brouillons personnalisés, dates et statuts relèvent des mêmes mécanismes de conservation. Les douze situations de déficit restent en déficit.

## Contrôles locaux

- `npm run test:budget` et `npm run build` réussis.
- 101 parcours réels Chromium à 390 px. Texte de la fiche identique au presse-papiers, un seul PNG téléchargé de 1 080 × 1 350 et export identique octet pour octet à l’aperçu. Sous-totaux et lignes de regroupement du PNG rapprochés des données. Les 99 autres PNG ont les mêmes empreintes que dans la PR #1393.
- Les deux vrais PNG modifiés ont été ouverts à 390 px. Intitulés, montants, signe du déficit et carte des versements restent lisibles. La barre est absente sur Djamila.
