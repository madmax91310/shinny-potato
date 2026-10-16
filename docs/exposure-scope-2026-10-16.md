# Donuts et compositions — vérification du 16 octobre 2026

Les donuts géographiques et sectoriels décrivent la poche actions. Or, crypto, matières premières, monétaire et obligations identifiées restent dans l’allocation, sans devenir des pays ou des secteurs. Les LifeStrategy contribuent à hauteur de leur allocation actions publiée ; la poche actions est décomposée selon les fonds Vanguard réellement détenus. Les dates et sources de chaque étape restent conservées. Les allocations publiées arrondies sont pondérées à l’intérieur de la poche, sans inventer les pays manquants.

Le détail repliable présente tous les pays/secteurs disponibles et leur part de la poche et du portefeuille total. L’image conserve une légende courte (3, 4 ou 6 catégories) et un sous-titre précisant le poids de la poche actions. La suppression des dates, annotations de couverture et notes de bas d’image livrée par #695 reste appliquée. Les données manquantes gardent leur poids gris. Un portefeuille sans actions affiche « Sans objet ».

## Treize cas examinés

- TSMC : identité ADR US8740391003 et classification de l’émetteur via l’action sous-jacente TW0002330008, mises à jour automatiquement.
- AstraZeneca : correction de l’identité actuelle GB0009895292 et du libellé NYSE. Le programme ADR a fermé le 2 février 2026, selon l’émetteur : https://www.astrazeneca.com/media-centre/press-releases/2026/astrazeneca-begins-trading-on-NYSE.html . Les historiques financiers ne sont pas remplacés dans ce lot.
- World EUR Hedged et China A : ventilation des seules actions physiques à partir des positions complètes BlackRock. Les tables nettes avec devises/dérivés signés restent intactes dans les registres communs. Le pourcentage du donut représente les positions actions et non les pays des contrats de change.
- LifeStrategy 20/40/60/80 : transparisation de la poche actions, avec collecte des trois fonds Vanguard supplémentaires nécessaires. Les compositions de fonds entiers ne sont pas fabriquées à partir de cette poche.
- Deux fonds obligataires : conservés dans l’allocation ; exclus des donuts de la poche actions. Leurs expositions obligataires communes restent disponibles dans les données.
- QYLD : l’émetteur confirme que le sous-jacent actions correspond aux constituants du Nasdaq-100. Utilisation de la composition de cet indice déjà collectée automatiquement, en précisant le sous-jacent actions et en excluant le panier de substitution et le profil de rendement des options.
- Avantis : positions complètes collectées auprès d’Avantis, classifications pays jointes par ISIN aux positions officielles BlackRock et aux classifications de titres publiées par Avantis. Les positions sans correspondance restent non ventilées. Ni le préfixe de l’ISIN, ni le pays de cotation ne servent de pays de risque.
- Silver Miners : positions complètes Global X et secteurs des titres rapprochés par ISIN avec BlackRock. Les sociétés non retrouvées restent non ventilées ; le thème minier n’est pas arbitrairement assimilé à 100 % Matériaux.

Le résultat chiffré reproductible est dans `docs/exposure-coverage.md`. **Silver Miners reste partiel** ; Avantis dépasse désormais 99,5 % de pays identifiés. Les nouveaux collecteurs ne certifient pas 100 % de classification pour chaque ligne. Aucune suppression d’actif ou réattribution automatique ne masque ce reste.

## Actualisation

Les nouveaux collecteurs rejoignent le workflow quotidien existant `update-qualified-exposures.yml` (07:50 UTC). Ils fonctionnent sans clé et conservent les dernières observations valides en cas d’échec. Le workflow remonte les échecs, valide les projections puis publie les données validées. Les ventilations supplémentaires et le rapport sont reconstruits à chaque compilation. Les autres collectes ETF, compositions complètes et historiques mensuels existantes restent utilisées ; cela ne constitue pas une garantie que tous les champs de tous les instruments sont publiés par leurs émetteurs.

## Validation

Tests DCA, absence de renormalisation des inconnus, dates/identités, poche mixte, neutralité, mass conservation sur tout le catalogue, projections et compilation. Le test navigateur vérifie les quatre exports, trois tailles de légende, portefeuille 80/15/5, portefeuille sans actions et portefeuille mixte ; il s’exécute en CI, Chromium local étant bloqué par les sockets de l’environnement.
