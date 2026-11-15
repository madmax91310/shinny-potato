# Chantier 3 — images « Le budget de… »

Audit du 15 novembre 2026, depuis master `fe0d2bd`, après intégration de la sauvegarde DCA #1316. Les PR #1289 et #1306 sont fusionnées. #1318 a été fusionnée pendant la recette : son image principale et sa gestion d’erreur sont conservées. Le détail X et les deux autres versions détaillées restent intégralement paginés. #1317 est également reprise depuis master pour la correction du cache BCE dans la projection navigateur.

Actualisation : master `893d843` est intégré, avec le chantier DCA #1324 et les corrections éditoriales #1323. Ces dernières sont conservées telles quelles. Les 997 fichiers de l’inventaire ont été régénérés et contrôlés après cette intégration ; 238 diffèrent de la première recette de 991 PNG. Les résultats finaux des téléchargements et du déploiement seront rapprochés dans le bilan de la PR.

## Défauts reproduits et correction

Le site public servait le code `bc4b7a7`, avec les données `d2195bc`, en voie fallback. Inventaire réel par le sélecteur : **77 profils**, **291 aperçus PNG**, dont **154 hors format** (modes détaillé et synthétique en largeur 1200, hauteur variable). Les 137 PNG X étaient déjà en 1080 × 1350 grâce à #1306.

Les trois modes utilisent désormais le même moteur paginé. Les libellés complets restent dans le mode détaillé ; les regroupements existants restent dans le synthétique. La police des postes reste à 40 px (environ 14,4 px à 390 px de large). Les couleurs et le style sont conservés. Les nombres approximatifs gardent le signe ≈. Un montant maximal ne peut plus être placé dans une colonne trop étroite.

Les encadrés structurés omettaient des informations présentes dans le contexte, notamment le PEA/PEE de Solène, les ETF/retraite de Noémie et des conditions de financement. Le contexte existant est repris intégralement sur des pages « Patrimoine et projets », après les postes. Aucun montant, texte éditorial, provenance, stockage ou statut de publication n’est modifié. Les questions restent dans le texte éditorial. Aucun disclaimer ou source n’est ajouté aux images.

## Preuves locales

- Tests Budget : tous les profils actifs, calculs indépendants, immutabilité, sauvegardes et statuts ; réussis.
- Compilation complète, budgets des routes et manifeste des 47 fichiers publics : réussis. Lint : aucune erreur, avertissements existants.
- Rendu Chromium avec polices réelles : **997 PNG**, soit **77 images principales + 313 X + 314 détaillés + 293 synthétiques**, pour les **77 profils** dans les quatre modes. Chaque PNG vérifié à **1080 × 1350**, chaque glyphe dans les bornes, aucun chevauchement ; chaque poste et montant conservé et chaque caractère du contexte conservé sur sa série.
- `png-inventory.json` : dimensions et SHA-256 des 997 fichiers réellement encodés, contrôlés par Pillow après génération.
- Inspection visuelle réelle : les 310 pages X et les 77 images principales à 390 px, puis les 121 compositions différentes des autres modes ; les autres pages reprennent les mêmes dispositions de texte, vérifiées automatiquement. Émilie : 11 dépenses, 500 € de versements, 65 € de reste, réserve de 5 000 € et apport de 2 000 € vers 20 000 € conservés.
- Cas restauré CHF de 72 lignes : 11 pages, chaque montant une fois, dernière page disponible sans encodage des pages intermédiaires, modification et texte personnalisé conservé.
- Parcours abonnés : création, modification, sauvegarde, reprise, statuts, export et restauration, à 1440/390/320 px ; réussi.
- Parcours fonctionnel des 77 profils à 390 px : filtres, copie, brouillons, invalidation des exports et montants maximaux ; réussi.

Reproduction : `npm run test:budget`, `npm run build`, `CHROMIUM_PATH=/usr/bin/chromium node scripts/playwright-budget-social-image.mjs`. Ce dernier conserve PNG natifs, captures à 390 px, mesures et rapport dans `test-artifacts/budget-social-0/`. `scripts/check-budget-downloads.mjs`, avec `BUDGET_PUBLIC_BASE`, contrôle chaque page téléchargée des quatre modes pour tous les profils à 1440 et 390 px : dimensions IHDR, octets identiques à l’aperçu, noms numérotés et ordre.

Téléchargements locaux : les **1 828 téléchargements** des 914 pages détaillées à 1440/390 px ont réussi, dimensions IHDR et octets strictement identiques aux aperçus, noms et ordre vérifiés. Les images principales sont contrôlées séparément par `check-budget-overview.mjs`, y compris panne d’encodage et réessai.

## Limites et suivi

Les pages de contexte sont parfois peu remplies : les paragraphes sont séparés pour conserver un texte lisible et l’ordre éditorial. Les très longs budgets manuels peuvent dépasser cinq pages (11 pour le cas de 72 lignes). Aucun téléchargement groupé n’existe : chaque page dispose de son aperçu et de son téléchargement identifié.

Les informations financières et les projets n’ont pas été réinterprétés ni recertifiés. Aucune incohérence de fond nouvelle et certaine n’a été établie par ce contrôle d’images. Les formulations existantes et leurs conditions sont conservées pour le chantier suivant.

Fusion, portail GitHub complet, Pages et commit réellement servi restent à rapprocher après les validations. Une réussite de compilation locale ne vaut pas déploiement public. Aucune publication sur X.
