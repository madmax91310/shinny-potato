# Chantier 3 — images « Le budget de… »

Audit du 15 novembre 2026, depuis master `fe0d2bd`, après intégration de la sauvegarde DCA #1316. Les PR #1289 et #1306 sont fusionnées. #1318 reste ouverte lors de cette recette ; sa synthèse autonome n’est pas nécessaire à la conservation intégrale demandée ici. Sa correction du message d’erreur est reprise.

## Défauts reproduits et correction

Le site public servait le code `bc4b7a7`, avec les données `d2195bc`, en voie fallback. Inventaire réel par le sélecteur : **77 profils**, **291 aperçus PNG**, dont **154 hors format** (modes détaillé et synthétique en largeur 1200, hauteur variable). Les 137 PNG X étaient déjà en 1080 × 1350 grâce à #1306.

Les trois modes utilisent désormais le même moteur paginé. Les libellés complets restent dans le mode détaillé ; les regroupements existants restent dans le synthétique. La police des postes reste à 40 px (environ 14,4 px à 390 px de large). Les couleurs et le style sont conservés. Les nombres approximatifs gardent le signe ≈. Un montant maximal ne peut plus être placé dans une colonne trop étroite.

Les encadrés structurés omettaient des informations présentes dans le contexte, notamment le PEA/PEE de Solène, les ETF/retraite de Noémie et des conditions de financement. Le contexte existant est repris intégralement sur des pages « Patrimoine et projets », après les postes. Aucun montant, texte éditorial, provenance, stockage ou statut de publication n’est modifié. Les questions restent dans le texte éditorial. Aucun disclaimer ou source n’est ajouté aux images.

## Preuves locales

- Tests Budget : tous les profils actifs, calculs indépendants, immutabilité, sauvegardes et statuts ; réussis.
- Compilation complète, budgets des routes et manifeste des 47 fichiers publics : réussis. Lint : aucune erreur, avertissements existants.
- Rendu Chromium avec polices réelles : **914 PNG**, soit **310 X + 312 détaillés + 292 synthétiques**, pour les **77 profils** dans les trois modes. Chaque PNG vérifié à **1080 × 1350**, chaque glyphe dans les bornes, aucun chevauchement ; chaque poste et montant conservé et chaque caractère du contexte conservé sur sa série.
- `png-inventory.json` : dimensions et SHA-256 des 914 fichiers réellement encodés, contrôlés par Pillow après génération.
- Inspection visuelle réelle : les 310 pages X à 390 px, puis les 121 compositions différentes des autres modes ; les autres pages reprennent les mêmes dispositions de texte, vérifiées automatiquement. Émilie : 11 dépenses, 500 € de versements, 65 € de reste, réserve de 5 000 € et apport de 2 000 € vers 20 000 € conservés.
- Cas restauré CHF de 72 lignes : 11 pages, chaque montant une fois, dernière page disponible sans encodage des pages intermédiaires, modification et texte personnalisé conservé.
- Parcours abonnés : création, modification, sauvegarde, reprise, statuts, export et restauration, à 1440/390/320 px ; réussi.
- Parcours fonctionnel à 390 px : filtres, copie, brouillons, invalidation des exports et montants maximaux ; réussi.

Reproduction : `npm run test:budget`, `npm run build`, `CHROMIUM_PATH=/usr/bin/chromium node scripts/playwright-budget-social-image.mjs`. Ce dernier conserve PNG natifs, captures à 390 px, mesures et rapport dans `test-artifacts/budget-social-0/`. `scripts/check-budget-downloads.mjs`, avec `BUDGET_PUBLIC_BASE`, contrôle chaque page téléchargée des trois modes pour tous les profils à 1440 et 390 px : dimensions IHDR, octets identiques à l’aperçu, noms numérotés et ordre.

## Limites et suivi

Les pages de contexte sont parfois peu remplies : les paragraphes sont séparés pour conserver un texte lisible et l’ordre éditorial. Les très longs budgets manuels peuvent dépasser cinq pages (11 pour le cas de 72 lignes). Aucun téléchargement groupé n’existe : chaque page dispose de son aperçu et de son téléchargement identifié.

Les informations financières et les projets n’ont pas été réinterprétés ni recertifiés. Aucune incohérence de fond nouvelle et certaine n’a été établie par ce contrôle d’images. Les formulations existantes et leurs conditions sont conservées pour le chantier suivant.

Fusion, portail GitHub complet, Pages et commit réellement servi restent à rapprocher après les validations. Une réussite de compilation locale ne vaut pas déploiement public. Aucune publication sur X.
