# Raccordements des expositions distinctes

Les sept nouvelles sélections pédagogiques utilisent les registres communs par ISIN : Nasdaq classique/équipondéré, small cap de marché/value active, obligations à échéance 2028/2029, cuivre/mines, cloud/robotique/batteries, immobilier monde/Europe et défense/nucléaire/quantique. Chacune produit un comparatif ETF et une fiche pratique avec image. Le cuivre sur contrats reste explicitement un ETC. Avantis reste explicitement un ETF actif.

Les présentations des ETF et les compositions manuelles DCA existaient déjà pour ces parts ; elles sont vérifiées et reliées aux nouvelles fiches pratiques. Les mises à jour des caractéristiques, frais, encours et compositions continuent de passer par les collecteurs émetteurs existants. Le présent lot ne crée pas de nouvelle donnée de marché manuelle.

Les duels ajoutent le cloud et deux exemples : World + cloud contre World + robotique, et World seul contre World + mines de cuivre. Le générateur reçoit deux constructions supplémentaires pour les profils généralistes équilibrés, dynamiques et offensifs : monde/cloud/robotique et monde/bois/agro-industrie. Les règles de pondération, risque et concentration continuent de s’appliquer. Les mines de cuivre sont accessibles en composition manuelle sur leurs trois années communes.

Les parts récentes sont qualifiées à chaque collecte/build : trois années civiles complètes au minimum pour les duels et la composition manuelle du générateur, six pour la génération automatique. Une série ajustée de marché reste distincte d’une performance NAV. Chaque rendement annuel exige les treize clôtures mensuelles de décembre à décembre ; aucune lacune n’est comblée et aucune année en cours n’est annualisée. Les obligations à échéance sont exclues des nouveaux portefeuilles après leur année de fin.

Les outils historiques déjà raccordés continuent d’utiliser les séries mensuelles collectées automatiquement, sur leurs fenêtres propres. Les données de fonds ne sont jamais promues en compositions d’indice dans Coulisses des indices.

`node scripts/audit-asset-tool-routing.mjs --write` régénère le relevé exhaustif et `docs/distinct-asset-routing.json`, avec les destinations, sources mensuelles et motifs de qualification par actif. Cette génération rejoint la collecte mensuelle. Les tests des sept sélections et des calculs sont exécutés avant publication ; le parcours navigateur vérifie les quatorze exports des fiches/comparatifs, les deux images de duels et les mises en page mobiles.

Validation locale : compilation avec budgets existants, 9 300 portefeuilles sans violation, suites DCA, duels, fiches pratiques, présentations, registres légers et calculs de projection. Chromium local ne peut pas ouvrir de socket dans cet environnement : les contrôles visuels sont requis en CI avant fusion.
