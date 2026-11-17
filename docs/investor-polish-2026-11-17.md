# Investisseurs — corrections ciblées après #1380

Base : master `5bca0be78733f7087e62b85d278e2e946db26e78`, également servi publiquement au démarrage. Actualisation concurrente Vanguard `b380d7c586600597f609ceda4427280f5bc41b8b` conservée par rebase avant ouverture de la PR ; elle ne touche pas les données investisseurs. Composition de #1380 conservée : 1080×1350, gris, grands noms verts, donut de 760 px à anneau épais, portrait central, logos et pastilles. Aucun changement d’un autre outil, de collecteur financier, de position financière, de poids, d’angle, de période, de devise ou de qualification.

## Couvertures distinctes

La synthèse additionne les valeurs exactes des seules positions nommées, puis divise par la valeur admissible complète. Renaissance affiche ainsi « 7 positions affichées · 9,5 % » et Cathie « 8 positions affichées · 34,0 % ». Le calcul n’utilise pas la somme des pourcentages arrondis. Les couvertures des douze premières (13,4 % et 45,6 % sur ce relevé) restent dans les compléments. Série éditoriale et archive exhaustive restent distinctes. Les tests recalculent les attentes depuis les positions courantes, sans figer ces comptages.

## Logos et montants

Le placement vérifie les pixels réellement opaques du portrait, les pastilles, les traits et les autres logos. La recherche couvre davantage d’espace du secteur et essaie les orientations horizontale, radiale et tangentielle, sans agrandir aucun secteur. Le nom reste le repli ; une microposition n’hérite pas d’un logo illisible. Les métadonnées PNG distinguent média non qualifié, échec de chargement, rejet de placement et placement effectif.

| Cas | Diagnostic et correction |
| --- | --- |
| Berkshire chez Gates | Wordmark existant chargé, mais très allongé : l’ancien seuil et la recherche de position le rejetaient. Désormais placé dans la zone libre supérieure du secteur. |
| Waste Management chez Gates | Aucun média qualifié existant. Variante vectorielle transparente retrouvée dans le contenu officiel WM, conservée sans carte blanche et avec sa provenance, dans un registre propre à l’outil. |
| Canadian National Railway | Pas de média qualifié dans le registre. Le site officiel fournit son logo, mais exige une autorisation écrite pour son usage ; aucune n’est établie. Logo non activé, nom exact conservé. [Conditions CN](https://www.cn.ca/en/media/trademark-licensing/) : « Any use of CN Brand Assets requires a formal licensing agreement or an authorization letter from CN. » |
| Coca-Cola chez Berkshire | Média existant chargé, précédemment rejeté ; orientation tangentielle dans son secteur visible. |
| Bank of America chez Berkshire | Wordmark existant chargé mais trop allongé pour la zone libre. Symbole compact officiel `mask-icon` du site de la banque, dont la référence dans la page d’accueil et le fichier ont été vérifiés ; aucune géométrie inventée. Le wordmark partagé reste inchangé. |

Les six principales positions nommées sont les candidates aux montants, par valeur décroissante ; « Autres » vient ensuite. Les candidates cherchent un espace libre près de leur propre libellé, avec de petits décalages, à taille constante de 27 px. Aucun nom ni pourcentage n’est réduit. Apple chez Berkshire et Amazon/Micron chez Tepper disposent désormais de leurs montants. Certains montants restent impossibles à placer proprement, notamment près du bas très dense de Berkshire ; ils restent dans le texte et les exports. Tous les montants des lignes des compléments sont conservés. Les médias réellement absents et les petits secteurs contraints restent nommés.

## Photographies et contours

- Cathie : nouvelle photographie authentique de Caroline Wood, [Commons, 2020](https://commons.wikimedia.org/wiki/File:Cathie_Wood_ARK_Invest_Photo.jpg), 1445×1790, **CC BY-SA 4.0**. Fichier original de 1 573 001 octets, SHA-1 `edcfaf83c81ce4b163ff80b2458af70b7bb99fad`, contrôlé contre la fiche source. Identité recoupée visuellement avec le portrait précédent. Cheveux, lunettes, visage et vêtements conservés ; cadrage sur le buste. Crédit, licence, lien, source et adaptation voyagent avec le PNG et le JSON. L’ancien portrait Jurvetson et son masque de #1380 sont conservés.
- Tepper : recherche ciblée effectuée ; aucune meilleure photo avec droits de réutilisation établis. Source Appaloosa existante, CC BY-SA 3.0, conservée. Agrandissement de publication limité à 1,5× : environ 504×426 pour le détourage 336×284. La faible définition native reste une limite.
- Renaissance : masque lié à l’empreinte de l’original Gleuschk, CC BY-SA 3.0. Fond sombre au-dessus et derrière le crâne retiré ; véritables boucles blanches de la nuque conservées. Le masque de segmentation existant affine les bords dans le contour revu.
- Gerstner : contour lié à l’original White House dans le domaine public. Personne d’arrière-plan exclue, bord d’épaule resserré sur la photographie, chemise et microphone préservés. Pas de trou dans le microphone ni de recoloration du visage.

Les pixels RVB restent ceux des sources, seuls alpha, cadrage et redimensionnement changent. Les masques refusent une autre photographie. Cache adressé par contenu, provenance, crédits et anciens médias sont préservés. Aucune recherche exhaustive des douze portraits manquants, aucun visage généré.

## Vérification

Compilation complète et budget inchangé : **724,9 / 725 kB**. La validation 13F découvrait les tests médias avant d’installer Pillow : dépendance désormais installée avec les contraintes existantes avant les tests des jobs PR et programmé, sans changement de collecte, de timeout ou de garde. Huit tests médias ; 30 rendus valides et deux refus financiers, contrôles des textes et compléments, copie, téléchargements, pannes et réessai. Archive Renaissance réelle vérifiée : 3151 lignes, 526 PNG, CRC valide. Les huit allocations modèles restent identiques octet pour octet.

Recette de compilation : 56 parcours ordinateur/mobile, 132 PNG, aperçu et deux boutons de téléchargement identiques, navigation, ZIP éditoriaux, 56 contrôles copie/JSON/CSV et récupération. La dernière correction alpha de Gerstner a une recette ciblée supplémentaire sur les deux largeurs, ses PNG/ZIP/JSON/CSV et ses aperçus. Vérification indépendante des 28 profils depuis les JSON effectivement téléchargés : sommes, sélection, Autres, dénominateurs et CRC des ZIP. Les blocages Druckenmiller/Klarman restent bloquants.

Les cinq PNG sont ouverts au format natif puis à 390 px, et les autres synthèses sont balayées sur planches. Les preuves sont dans `reports/investor-polish-2026-11-17/`. Les contrôles CI, la fusion, le SHA public et la recette publique après déploiement seront consignés dans la PR après constat. Aucune publication sur X.
