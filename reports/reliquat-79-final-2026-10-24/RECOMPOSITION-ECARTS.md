# Décomposition des 79 écarts d’origine

Les 79 lignes sont conservées dans recomposition-79-ecarts.csv. Pour 72 cas disposant de pièces quotidiennes officielles, la somme des composantes reproduit l’écart signé du rapport initial à moins de 0,000000001 point. Les sept autres lignes sont explicitement non calculables ; aucune valeur manquante n’est remplacée par zéro.

Cette égalité arithmétique ne démontre pas la cause économique du résidu. Une pièce quotidienne officielle disponible n’est pas une série automatiquement admissible dans l’application. Le rapprochement ne modifie ni les cours, ni la méthode de conversion de l’application, ni les seuils d’alerte.

## Composantes, en points de pourcentage

1. Différence entre le rendement du registre initial et le rendement recalculé depuis la capture brute. Elle est conservée séparément, sans être attribuée automatiquement à un arrondi.
2. Différence entre le calendrier publié converti et le rendement de la série quotidienne aux bornes calendaires. Elle n’est pas appelée systématiquement « arrondi ».
3. Effet du passage des bornes calendaires aux dates de cotation effectivement reçues, avec le même change mensuel.
4. Effet du passage de ce change mensuel aux fixings BCE correspondant aux dates de NAV. Le fixing intrajournalier ne certifie pas le change exact au moment de la clôture ou de la valorisation.
5. Contribution du défaut de dividende corrigé, pour WFNS2023 et Amundi FR0007054358/2020. Le signe représente sa contribution à l’ancien écart ; il ne s’agit pas d’un flux ajouté une deuxième fois.
6. Résidu entre le rendement de marché et la série officielle ainsi rapprochée. Il reste à attribuer sur les preuves financières manquantes indiquées par cas.

## Deux exemples

| Contribution | GDX 2025 | WFNS 2023 |
|---|---:|---:|
| Registre / capture brute | +0,00000215 | +0,00000779 |
| Calendrier publié / quotidien | −0,03131272 | +0,00181226 |
| Bornes NAV | +3,55314011 | 0 |
| Bornes de change | +1,07811066 | 0 |
| Défaut de dividende corrigé | 0 | −2,69315413 |
| Résidu non attribué | +1,05766100 | −0,11385975 |
| Ancien écart reproduit | +5,65760120 | −2,80519382 |

GDX : les dates de cotation sont les 30 décembre 2024 et 2025 ; le calendrier NAV utilise les 31 décembre. Les dates, devises et niveaux détaillés figurent dans rapprochement-bornes-79-cas.csv et effet-bornes-change-79-cas.csv. La nouvelle voie NAV sécurise l’usage sans expliquer la cotation originale.

WFNS : le dividende officiel de 0,1077 USD du 15 juin 2023 manquait dans l’ajustement du fournisseur. Sa correction est démontrée ; le résidu marché/NAV reste distinctement ouvert. Voir WFNS-DIVIDENDE.md.

## Contrôles supplémentaires

Les quatre lignes State Street utilisaient une convention de signe différente pour l’effet des dates dans une table dérivée : calendrier moins dates de marché. Le rapport normalise ce champ en dates de marché moins calendrier, à partir des bornes et rendements originaux. Trois valeurs non nulles changent de signe ; aucune NAV, aucun cours et aucun calcul de l’application ne changent. La trace est dans preuves/normalisation-signe-calendrier.json. La recomposition lit directement le rendement calendaire officiel, sans le déduire d’un champ de signe ambigu.

Natural Gas JE00BN7KB334, 2022 : le factsheet officiel du 30 septembre 2026 confirme 17,51 % sur la ligne du produit, en USD. Son benchmark donne 18,67 %. Les NAV quotidiennes capturées, 26,745 USD au 31 décembre 2021 et 32,094 USD au 30 décembre 2022, donnent 20 %. La différence officielle de 2,49 points ne s’explique donc pas par une simple sélection de cette ligne benchmark. Il manque la confirmation de la convention des dates de la série quotidienne et des ajustements éventuels. Le résidu de la cotation face à cette série vaut encore 0,202016 point. Ni l’un ni l’autre des rendements officiels n’est remplacé arbitrairement.

Le PDF, son texte et son empreinte sont conservés sous preuves/ngas-factsheet-controle*. Cette lecture locale ne constitue pas une validation de collecte GitHub. Les preuves d’origine sont conservées avec leurs empreintes ; les causes complètes ne sont pas déclarées résolues par cette décomposition.

## Complément Amundi et pont prix/NAV

Les douze distributions omises Amundi sont prouvées indépendamment de la politique actuelle de capitalisation. En2020, le facteur de deux cash vaut0,9770936643909641 ; le rendement de cotation ajusté non arrondi passe de−5,1095936396% à−2,8850459086%, soit+2,2245477311points. Le résidu face à la NAV réinvestie aux mêmes dates reste−0,4741181555point. La cotation stockée arrondie à six décimales vaut−2,8850474902%. Les écarts d’arrondi sont conservés, sans égaliser cours/NAV. La fenêtre2020 reste refusée ; le manuel/Duel utilise le calendrier NAV annuel indépendant.

`pont-cours-nav-ajustements-79.csv` conserve79lignes :72identités arithmétiques vérifiées et sept preuves manquantes explicites. Il sépare le cours brut, l’ajustement fournisseur, la NAV brute et le niveau réinvesti officiel aux dates réellement disponibles. L’identité `(cours ajusté − NAV réinvestie) = (cours brut − NAV brute) + (ajustement fournisseur − réinvestissement officiel)` ne démontre pas la cause d’un résidu. Les dates, devises et conversions restent individuelles.
