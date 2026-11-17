# Investisseurs — contrôle visuel et correction des portraits

## Base et référence

Travail commencé depuis `348ef87c809d8890b6ad383423514c7e9711717b`, puis rebasé sur `0cc4dc2a65b91163f025b16cc3f56cbe19cc1f02` après la fusion concurrente #1298. Aucun changement DCA de cette PR n’est modifié. Instructions `CLAUDE.md` et référence d’audit du 18 octobre appliquées.

Les cinq PNG **avant** ont été téléchargés par les boutons de l’outil public, pas reconstruits depuis des chiffres recopiés. Le site servait le code `ba5b86a73b55759c7c25ce6c8532d3524f7d7d66` et les données `348ef87c809d8890b6ad383423514c7e9711717b`. Leurs fichiers natifs sont conservés dans le dossier de preuves.

La pièce jointe Buffett n’est pas disponible dans cette session. Recherche dans les fichiers du dépôt, `/workspace/library-files`, `/workspace/shared/downloads` et les dossiers de travail ; les images des anciennes recettes ne constituent pas la maquette originale. **Aucune comparaison directe avec cette pièce n’est revendiquée.** La comparaison porte sur la direction décrite par l’utilisateur et les PNG réels avant/après.

## Diagnostic et corrections observables

Le fond gris, le donut de 760 px à anneau de 195 px, les noms verts Inter très gras et les pastilles circulaires étaient déjà présents et lisibles à 390 px. Ils sont conservés. Les angles restent ceux des valeurs exactes sur le portefeuille admissible complet.

| Profil | Avant constaté dans le PNG public | Après à contrôler dans les preuves |
| --- | --- | --- |
| Berkshire | Grand portrait et donut déjà corrects ; coupe horizontale aux épaules, certains logos contraints ; aucun montant périphérique. | Cadrage arrondi, logos recherchés dans davantage de positions du secteur, montants secondaires dans les espaces libres ; nom de l’entité et trimestre conservés. |
| Tepper | Portrait réel mais peu défini, épaules coupées horizontalement ; Micron difficile à loger malgré sa grande part. | Épaules cadrées progressivement, Micron et autres logos repositionnés sans étirer les parts, montants lisibles quand la place existe. La définition photographique reste limitée. |
| Renaissance | 90,52 % d’Autres réel ; micropositions regroupées en bas ; logos extérieurs déjà utiles. | Même sélection et même dénominateur ; repli de logo près du nom conservé quand le secteur est trop étroit. Couverture des douze premières et quatre pages éditoriales distinctes de l’archive intégrale. |
| Gates Trust | Chemise et cravate évidées, petites zones de fond jaune aux cheveux ; veste découpée. | Contour alpha revu, vêtements opaques, fond exclu, cadrage arrondi. Bande « Bill Gates · trustee » dimensionnée sur son texte et réservée avant placement des logos. |
| Cathie Wood | Feuilles derrière les cheveux, vêtements troués, main levée effacée ; trop de bas du corps. | Contour revu sur la photo originale, main et vêtements préservés, cadrage sur le buste. Aucun visage ni vêtement reconstitué. |

L’image principale indique « Principales positions ». Les compléments portent « Suite des positions · N/M », leur trimestre réel et leurs rangs. Ils conservent de grands noms, logos proportionnés, montants noirs et poids sur le portefeuille complet. L’échelle des barres est explicite ; elle ne normalise pas la sélection à 100 %. Sa borne et son dénominateur sont aussi conservés dans le PNG.

Les noms restent à 36 px sur la synthèse et 34 px sur les compléments. Les montants secondaires ne réduisent pas les noms et n’éliminent aucune position ; ils ne sont ajoutés à la synthèse que si une zone libre existe, sans croiser libellé, logo, pastille ou trait. Tous les montants restent dans le texte et l’export intégral. Les montants de chaque position des compléments sont affichés.

Les logos sont ceux du registre vérifié, sans inventer une lettre ou utiliser les anciens pictogrammes factices de `company-light`. Priorité au secteur réel ; un repli près du libellé est conservé pour les micropositions. Certaines marques très longues ou sans identité graphique qualifiée restent désignées par leur nom. Ni cartes blanches, ni colonnes latérales rigides, ni élargissement artificiel des petits secteurs.

## Photographies, provenance et limites

Gates : photographie existante de la Commission européenne / Lukasz Kobus, CC BY 4.0. Cathie : photographie existante de Steve Jurvetson, CC BY 2.0. Sources, auteurs et licences restent dans le registre, les crédits et les exports. Les deux contours revus sont liés à l’empreinte exacte de la photographie ; changer l’image invalide le masque. Les pixels RVB du sujet sont conservés, seuls alpha et cadrage changent. Le cache de médias reste adressé par contenu et les anciennes ressources sont conservées.

Le [fichier Commons Cathie](https://commons.wikimedia.org/wiki/File:Cathie_Wood.jpg) mesure 498×635 pixels. Son [original Flickr](https://www.flickr.com/photos/jurvetson/52065327043/) mesure 3015×2005 mais représente toute la scène. La correspondance à la même échelle de pixels est vérifiée (corrélation 0,9982, origine du recadrage [673,443]) : agrandir la scène ne fournit pas un visage plus défini. L’éclairage bleu et le grain de cette photographie ne sont pas repeints. Le [fichier Tepper autorisé](https://commons.wikimedia.org/wiki/File:David_Tepper_01.jpg), Appaloosa Management, CC BY-SA 3.0 avec permission VRT, ne mesure que 336×291 pixels avant détourage. Ces deux limites de définition restent visibles à la résolution native ; aucun agrandissement génératif.

Aucune nouvelle permission n’a été établie pour les douze synthèses suivantes. Les médias et provenances déjà présents ont été réexaminés, ainsi que des recherches ciblées Commons/Flickr ; une photo publique ou officielle ne vaut pas autorisation de republication.

| Profil non résolu | Source examinée et limite maintenue |
| --- | --- |
| Morfit | [ValueAct](https://valueact.com/) ; photographie NurPhoto à droits gérés, aucune licence acquise. |
| Dorsey | [Dorsey Asset Management](https://dorseyasset.com/) ; pas de licence photographique ouverte établie. |
| Vinall | [RV Capital](https://www.rvcapital.ch/) ; droits de reproduction non établis. |
| Gavin Baker | [Atreides](https://www.atreidesmgmt.com/) ; pas de permission établie ; homonyme militant Commons écarté. |
| Einhorn | [Cornell Tech](https://tech.cornell.edu/news/david-m-einhorn-president-of-greenlight-capital-joins-the-council-at-cornell-tech/) ; permission photographique non établie ; rabbin homonyme écarté. |
| Halvorsen | [Viking Global](https://www.vikingglobal.com/) ; pas de licence réutilisable vérifiée. |
| Gayner | [Coca-Cola, Thomas Gayner](https://www.coca-colacompany.com/about-us/board-of-directors/thomas-gayner) ; portrait identifié, droits de republication non établis. |
| Loeb | [Third Point](https://www.thirdpoint.com/) ; portrait officiel identifié, sans permission établie ; dessin Commons non substitué à une photo. |
| Aschenbrenner | [The Rhine Group](https://www.rhinegroup.eu/members/leopold-aschenbrenner) ; permission photographique non établie ; ornithologue homonyme écarté. |
| Terry Smith | [Fundsmith](https://www.fundsmith.co.uk/sef/about-us/) ; pas de permission photographique établie ; guitariste et autres homonymes écartés. |
| Laffont | [Coatue](https://www.coatue.com/) / Milken Institute ; aucune nouvelle licence photographique vérifiée. |
| Baker Bros. | [Stanford / Felix Baker](https://news.stanford.edu/stories/2017/08/stanfords-board-trustees-elects-two-new-members), [Acadia / Julian Baker](https://acadia.com/en-us/about/leadership/board-of-directors/julian-baker) ; pas de permission photographique ou de logo autorisé confirmée. |

Les replis gardent le nom exact, sans personne différente ni faux visage. Berkshire, Gates Trust et Renaissance restent les entités déclarantes, distinctes de leurs personnes illustrées. Le pied indique une valeur déclarée, jamais un patrimoine personnel total ni des encours mondiaux.

Le balayage des autres portraits relève aussi un défaut préexistant sur Brad Gerstner : fragment de fond près des cheveux et découpe du microphone. Son masque reste à reprendre ; cette livraison ne signifie pas que tous les portraits sont finalisés.

## Données, vérification et livraison

Aucune observation financière, collecte, devise, période, classe, option, règle de qualification, sauvegarde ou navigation n’est modifiée. Les positions connues regroupées dans Autres ne deviennent pas des données inconnues. Les blocages Druckenmiller/Klarman et l’incident de collecte anniversaire restent distincts. Les archives exhaustives ne deviennent pas la série de publication.

Les calculs, les images, les vrais boutons de téléchargement, les crédits, les scénarios de médias absents et les réessais sont contrôlés séparément. La comparaison des huit allocations modèles avec le rendu précédent confirme des PNG identiques. Les contours photo sont testés sur visage, cheveux, vêtements, main et zones de fond ; le changement de photographie est refusé.

Les preuves avant/après à 390 px et les PNG natifs sont dans `reports/investor-visual-finish-2026-11-17/`. Les résultats finaux des contrôles, la fusion, le déploiement, le SHA réellement servi et les téléchargements publics après déploiement sont consignés dans la PR #1380 après constat effectif. La réussite technique ne prouve pas une conformité exacte à une référence inaccessible. Les limites de photos, de définition et de place pour certains logos/montants restent explicites. Aucune publication sur X.
