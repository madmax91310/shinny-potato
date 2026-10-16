# Portefeuille : raccordements et titres communs — 16 octobre 2026

## Livraison
- 209 supports collectés par ISIN exact et 220 actions du catalogue actif et des historiques. Registre commun dérivé au build, alias historiques conservés. Les 220 identités sont qualifiées et leurs pays de risque et secteurs proviennent des positions officielles iShares ; aucun pays déduit de l’ISIN.
- Passage de 8 à 50 positions. Changer de parcours conserve la composition ; les contrôles de total et de doublons restent appliqués. Le visuel validé conserve ses trois donuts ; au-delà de huit lignes, sept positions et un groupe résiduel assurent la lisibilité. Le détail reste dans l’éditeur.
- 69 fonds physiques actions disposent de compositions complètes conservées hors des top 10 éditoriaux. Collecte quotidienne dans update-qualified-exposures, échec partiel signalé et observations antérieures conservées avec leur date. Chargement navigateur uniquement des fragments nécessaires.
- Comparaisons par paire et agrégation par ISIN des poids directs et indirects. Une action détenue via plusieurs fonds n’est pas additionnée plusieurs fois à partir des paires. Les ADR et classes de titres ne sont pas fusionnés sur leur nom.

## Qualification
Les correspondances initiales des nouvelles actions ont été revues à partir du ticker, de la place de cotation, de la devise et du nom officiel, puis figées par ISIN dans dca-equity-extra-identities.json. Preuve : scripts/source-snapshots/dca-equity-identity-review-2026-10-16.json. Les actualisations rapprochent uniquement l’ISIN exact.

Le premier passage a vérifié 93 sources iShares : 69 fonds physiques actions retenus ; 23 supports obligataires, matières premières ou synthétiques hors périmètre et un fonds dont les positions actions positives dépassent 100,5 % exclu. Aucun panier de substitution n’est assimilé à l’indice économique.

Le score global par paire requiert deux listes complètes, des titres identifiés, une couverture d’au moins 99,5 %, des poids non négatifs, une source et des dates compatibles. Les positions publiées et indices restent séparés ; les titres directs peuvent compléter chaque périmètre. Les liquidités et titres sans ISIN restent hors du total identifié, sans renormalisation des manques.

## Limites visibles
Le catalogue sélectionnable ne signifie pas une couverture universelle : 395 supports sur 429 disposent individuellement de 99,5 % de géographie et secteurs exploitables au 16 octobre. Les méthodes différentes ne sont pas mélangées dans un même donut. Les autres émetteurs gardent leurs listes partielles quand aucune composition complète n’est qualifiée. Les classifications expirent après 93 jours, avec 45 jours d’écart maximum par synthèse.

Les listes à l’écran affichent les 30 premiers titres et paginent les paires par 20 ; tous les titres entrent dans les calculs. Pas de changement du squelette des tweets ni des profils préparés.

## Vérification
Tests du moteur, 100 profils, conservation des pourcentages, identité Nasdaq, catalogue complet, 50 lignes, agrégation à trois supports, positions directes/indirectes, sources synthétiques et données partielles. Compilation et budgets existants conservés. Le test navigateur inclut 420 rendus et les changements de parcours sans perte de composition.
