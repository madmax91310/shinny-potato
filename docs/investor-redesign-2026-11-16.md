# Portefeuilles d’investisseurs : refonte du visuel du 16 novembre 2026

La refonte conserve le moteur Canvas commun à l’aperçu et au PNG téléchargé. Elle concerne les déclarations 13F ; les allocations modèles et les autres outils conservent leur composition. Les collecteurs, les valeurs, les identités de gestion, les classes, les options, les historiques et les sauvegardes ne sont pas modifiés.

Les consignes CLAUDE et l’audit du 18 octobre, notamment §5 et §7.8, ont été relus, ainsi que les PR précédentes #1330 et #1344. Le worktree `investor-redesign` part de master 40938a1 ; la PR ETF #1346, fusionnée pendant le travail, ne touche pas ce rendu. Les PR concurrentes #1347, #1298, #1253 et #1061 ne sont pas interrompues.

## Composition et comparaison

| Critère demandé | Changement vérifié dans les PNG |
| --- | --- |
| Typographie | Inter variable locale sous SIL OFL, chargée avant export ; nom jusqu’à 86 px, positions 34 px, montants et pourcentages 30 px. Aucun monospace dans le nouveau rendu. |
| Palette | Fond neutre clair, chiffres noirs, noms verts ; secteurs de couleurs distinctes, couleurs de remplacement déterministes partagées avec le détail. |
| Place du graphique | Diamètre 664 px contre 470 px auparavant ; anneau de 161 px contre 90 px. Aucun agrandissement d’une position ni renormalisation du sous-ensemble présenté. |
| Portrait | Détourage vérifié conservant ses proportions, jusqu’à 368 px de large ; peut dépasser légèrement l’intérieur de l’anneau. Les pourcentages restent à l’extérieur de son emprise. |
| Logos | Intégrés dans les secteurs suffisamment grands, autrement placés auprès du libellé. Alphabet est cadré sur son mot-symbole existant, sans bande de site web et sans toucher l’asset des autres outils. Les logos manquants utilisent des initiales. |
| Libellés | Cartes blanches périphériques et longs traits supprimés ; noms courts, classes Alphabet A/C et Berkshire A/B préservées, badges de pourcentage associés à la couleur du secteur. |
| Densité | La place de deux colonnes lisibles détermine la sélection ; jusqu’à dix positions représentées, dont « Autres » si nécessaire. Aucune limite appliquée aux données ni aux détails. |
| Pied | Une ligne principale du total, signature, et seulement le crédit photo lorsque sa licence le demande. Méthode, réserves et sources conservées dans l’application, le texte et les détails. |

Les pièces jointes David Tepper / maquette Warren Buffett mentionnées dans la demande ne sont pas accessibles dans cette session. Cette comparaison porte donc sur la direction visuelle décrite par l’utilisateur et les vrais PNG avant/après, **pas sur une comparaison visuelle directe avec la maquette Buffett jointe**. La fidélité exacte à cette pièce reste à confirmer lorsqu’elle sera disponible.

Les PNG « avant » ont été réellement téléchargés sur le site public, version b423d25e2be9adb7893784d84430c434e7693649. Les PNG « après » proviennent des téléchargements de l’application compilée, et leurs octets sont identiques à l’aperçu et aux téléchargements ordinateur.

| Exemple au 30 juin 2026 | Avant | Après | Total inchangé |
| --- | --- | --- | --- |
| David Tepper | 5 positions nommées ; Autres 42,3 % | 9 positions nommées ; Autres 21,8 % | 7 471 257 999 USD |
| Berkshire Hathaway | 5 positions nommées ; Autres 31,3 % | 9 positions nommées ; Autres 14,7 % | 299 253 556 246 USD |

- [Tepper : avant/après à 390 px](../reports/investor-redesign-2026-11-16/tepper-comparison-390.png) · [PNG avant](../reports/investor-redesign-2026-11-16/tepper-before.png) · [PNG après 1080 × 1350](../reports/investor-redesign-2026-11-16/tepper-after.png).
- [Berkshire : avant/après à 390 px](../reports/investor-redesign-2026-11-16/berkshire-comparison-390.png) · [PNG avant](../reports/investor-redesign-2026-11-16/berkshire-before.png) · [PNG après 1080 × 1350](../reports/investor-redesign-2026-11-16/berkshire-after.png).

Le relevé Berkshire 2026 reste attribué à Berkshire Hathaway, avec les initiales de l’entité. Le lien de gestion personnelle n’étant pas vérifié dans cette collecte, ajouter automatiquement Warren Buffett et son portrait serait contraire à la règle d’identité existante. La refonte ne contourne pas ce garde-fou.

## Recette effectuée

- `npm run build` : succès, budgets respectés ; route investisseurs 723,8 / 725 kB. Les pages PNG détaillées sont chargées à la demande pour conserver le budget existant, sans augmenter sa limite.
- `scripts/test-investor-screenprint.mjs` : 30 PNG (26 relevés et quatre cas synthétiques), absence de texte coupé/chevauché, dimensions, calculs et cohérence du texte. Téléchargements PNG/JSON/ZIP, presse-papiers, portrait/logo absent, panne source conservant la dernière version, échec Canvas et réessai, données incomplètes.
- `scripts/test-investor-visual-ui.mjs` sur le site compilé : 56 parcours, les 28 profils à 1440 et 390 px. 52 PNG réellement téléchargés et rouverts ; identiques à l’aperçu et entre les deux largeurs. Les deux profils incomplets restent bloqués. Aucune erreur JavaScript ni débordement de page.
- Test navigateur du dépôt avec Node 20 : `scripts/playwright-tools.mjs --investors` réussi pour les 28 textes, les sélections, le mobile et les états incomplets.
- `scripts/check-investor-values.py` : calculs Decimal indépendants sur les lignes originales, total, poids et regroupement « Autres » des 26 déclarations qualifiées. Deux déclarations restent incomplètes.
- `scripts/audit-investor-profiles.mjs` et les tests purs de publication réussis : classes, noms longs, couleurs principal/détail, 300/1 501 positions et poids inférieur à 0,1 %.
- Renaissance : le vrai ZIP téléchargé contient 3 151 lignes CSV/JSON et 485 PNG 1080 × 1350 ; CRC vérifié.

Tous les profils exploitables ont été examinés sur les planches à 390 px : [1](../reports/investor-redesign-2026-11-16/all-investors-1.png), [2](../reports/investor-redesign-2026-11-16/all-investors-2.png), [3](../reports/investor-redesign-2026-11-16/all-investors-3.png), [4](../reports/investor-redesign-2026-11-16/all-investors-4.png). Examen approfondi de Tepper, Berkshire, Icahn et Pabrai (concentration), Renaissance (diversification), Gayner (classes), Vinall (noms), Gerstner (portrait) et des cas synthétiques [très petit poids](../reports/investor-redesign-2026-11-16/petite.png), [dense](../reports/investor-redesign-2026-11-16/dense.png), [noms longs](../reports/investor-redesign-2026-11-16/longs.png), [médias absents](../reports/investor-redesign-2026-11-16/fallback.png). Les PNG ont été rouverts en grand et les compositions réduites à 390 px examinées, en plus des captures de l’aperçu dans l’application.

Les preuves structurées sont dans [financial-check.json](../reports/investor-redesign-2026-11-16/financial-check.json), [layout-check.json](../reports/investor-redesign-2026-11-16/layout-check.json), [ui-check.json](../reports/investor-redesign-2026-11-16/ui-check.json) et [large-export.json](../reports/investor-redesign-2026-11-16/large-export.json).

## Limites préservées

Druckenmiller et Klarman restent bloqués par leurs conflits d’unités ; aucun visuel complet n’est produit pour eux. Les personnes sans portrait réutilisable vérifié gardent les initiales. Les portefeuilles très diversifiés gardent une part « Autres » parfois majoritaire ; leur détail reste intégral. Les noms très longs peuvent être abrégés sur l’image, avec les identités complètes conservées dans les exports. Aucun changement des collectes programmées ni publication sur X.

Les références de fusion, du portail Pages et de la version publique sont consignées dans la [PR #1348](https://github.com/madmax91310/shinny-potato/pull/1348), mise à jour après le déploiement.
