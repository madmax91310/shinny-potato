# Recette des PNG DCA — 15 novembre 2026

Défauts reproduits : regroupement des détentions et versements au-delà de huit lignes ; couleurs et arrondis divergents entre vue complète et allocation individuelle ; liaisons excessivement longues ou traversantes sur allocations denses/concentrées ; noms de fichiers sans pseudonyme.

Corrections : chaque ligne conservée, couleur commune et poids détenu affiché au centième maximum ; libellés radiaux plus grands, petits pourcentages près du nom ; légende intégrale pour les cas denses/concentrés ; pseudonyme et identifiant du visuel dans le téléchargement. Style bleu nuit/crème/jaune conservé. Aucune donnée financière modifiée ni patrimoine inféré. Aucun ajout de source ou disclaimer dans les images.

`playwright-dca-png-audit.mjs` utilise les boutons réels, sauvegarde les fichiers, les rouvre et décode les octets enregistrés dans un second onglet Chromium. SHA-256 comparé à l’aperçu courant ; bornes, chevauchements des textes, noms, pourcentages, couleurs et géométrie des détentions contrôlés. Ordinateur 1440 px et fenêtre mobile 390 px. Profils préparés sélectionnés dans l’interface ; cas manuels injectés en brouillon puis téléchargés depuis l’interface. Modification réelle du pseudonyme et des versements, disparition immédiate de l’ancien export, fichiers successifs distincts et total mensuel vérifié.

Cas manuels : 1, 9, 50 positions ; 50 noms de 250 caractères ; 99,92 % + huit parts de 0,01 % ; ETF, Livret A, fonds euros manuel et versement sur une ligne sans détention. Le maximum actuellement accepté par master est 50 ; la PR #1298 visant un nombre illimité reste séparée.

Preuves visuelles : [15 positions](allocation-15.png), [50 positions](allocation-50.png), [supports mixtes, vue complète](mixed-complete.png). Les fichiers exhaustifs et journaux JSON SHA-256 sont conservés dans `test-artifacts/dca-png-shard-*/` dans l’environnement de recette.

Limites : Chromium en émulation de taille mobile, pas un iPhone/Android physique. Une image contenant cinquante noms intégraux reste longue : ouverture et zoom nécessaires ; aucune promesse de lecture intégrale d’un tel profil dans la vignette du fil X. La PR #1298 devra adapter les bornes physiques des canevas pour des capacités supérieures. Aucun contenu publié sur X.
