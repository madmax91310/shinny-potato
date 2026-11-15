# Export X du Budget de… — 15 novembre 2026

## État vérifié

La PR #1289 est présente dans master au commit `04912d56ccfc091e56174b84107448c9f803ccb7`. Au début de cette intervention, elle n'était pas encore servie : le site annonçait le code `d034cca4ff7b5bc184c5ce4b4c142400d9815d31` et le PNG public d'Émilie mesurait réellement 1 200 × 2 809 pixels. Le succès d'une compilation ne prouve donc pas cette publication.

La branche a ensuite repris master, notamment le travail éditorial concurrent #1294, sans modifier les profils ni leurs textes. Sur ces 70 profils actuels, l'ancien moteur #1289, exécuté avec le vrai canvas et les polices du navigateur, produit 40 images 4:5 et 30 secours longs, jusqu'à 4 395 pixels. L'inventaire CSV joint indique chaque profil, ses dimensions et l'excès de hauteur mesuré.

## Résultat

Le format X ne bascule plus vers le format long. Chaque PNG mesure exactement 1 080 × 1 350 pixels. Les libellés financiers ont une taille fixe de 40 pixels, soit environ 14,4 pixels à 390 pixels de large. Les colonnes et les cartes sont disposées selon leur encombrement réellement mesuré ; les montants peuvent passer sous leur libellé dans une colonne étroite. Les raccourcis conservent notamment les participations personnelles, provisions et conditions de revenu.

23 profils tiennent intégralement sur une image. 39 utilisent deux images et 8 en utilisent trois : 125 PNG au total. La première page de chaque série présente les totaux de revenus, dépenses, versements et solde. Les lignes d'origine ne sont pas comptées deux fois : les valeurs répétées sont explicitement des totaux. Les pages suivantes conservent les autres postes, réserves et projets. Le sélecteur affiche le nombre de pages et le téléchargement porte sur la page affichée, avec un nom numéroté.

Émilie tient sur une page : ses 11 dépenses, ses 2 300 € de revenus, 1 735 € de dépenses, 500 € de versements et 65 € après versements sont préservés. Son livret de 7 000 € comprend les 5 000 € de sécurité ; l'apport actuel de 2 000 € est distingué de l'objectif de 20 000 € à trois ans. Lucie utilise trois pages. Les modes détaillé et synthétique restent des choix explicites, avec leurs dimensions historiques.

Aucun montant, calcul, profil, texte de publication, stockage ou statut n'a été modifié. Les participations personnalisées utilisent leur propre contexte et n'héritent pas du patrimoine du personnage bancaire dont elles dérivent.

## Validation locale réellement exécutée

- `npm run test:budget`, tests du registre des quatre lots navigateur et du lanceur CI : réussis.
- `npm run build` : réussi, sans changement des seuils.
- `node scripts/playwright-budget-social-image.mjs` : 70 profils et 125 pages régénérés avec Chromium, polices chargées et canvas réel ; dimensions, conservation de toutes les lignes et valeurs, immobilité des données/textes, bornes des glyphes et chevauchements contrôlés. Le parcours UI utilise la compilation réelle.
- Les 125 PNG ont été affichés dans un vrai navigateur à 390 pixels puis relus visuellement sur des planches conservant cette largeur. Les cas courts, denses, familles, CHF, déficits, revenus variables et projets ont été examinés. Les captures et PNG sont dans les artefacts locaux de recette, hors dépôt.
- Parcours à 1 440 et 320 pixels sur les représentants Émilie, Lucie, famille et série dense : sélection, navigation, absence de débordement horizontal, copie exacte, PNG téléchargé identique octet par octet à l'aperçu sélectionné, anciens formats.
- Participation restaurée CHF avec 72 lignes et un nom long : 11 pages 4:5 ; chaque montant conservé une fois, déficit, question manuelle, texte personnalisé préservé lors d'une modification, régénération volontaire, statut publié non coché.
- `scripts/playwright-budget-profiles.mjs` à 390 pixels : les 70 profils, anciens exports, copie, filtres, brouillons, invalidation et stockage corrompu passent. Le cas historique extrême choisit désormais explicitement le mode détaillé qu'il vérifie.

## Limites explicites

La lisibilité prime sur le nombre minimal de pages : certains derniers feuillets sont peu remplis. Aucun rétrécissement automatique de police ne les supprime. Les budgets manuels très longs peuvent dépasser les trois images nécessaires à la banque actuelle ; le test de 72 lignes en utilise onze. Les questions et les paragraphes narratifs restent dans le texte, sans surcharge automatique des images. La mise en production doit encore être confirmée par le run Pages, les métadonnées publiques et de vrais téléchargements publics après fusion.
