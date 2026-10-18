# Cohérence des performances — lots 1 à 3

Les conversions conservent désormais la convention de dividendes. Une observation officielle dans la devise cible n'est admissible que pour la même variante d'indice. L'ACWI Net Return USD reste net en EUR ; il n'emprunte plus le calendrier Gross Return EUR. Les comparaisons de deux indices nets/bruts incompatibles sont rejetées, y compris lors d'un choix manuel, sans substitution aléatoire.

Coulisses des indices réutilise la PR #787, avec séparation devise/variante. Les variantes nettes/brutes disponibles pour World, ACWI et Emerging Markets viennent des calendriers d'indices automatisés existants. Aucun historique n'est inventé. Les annualisées sur 5/10 ans d'une autre devise ou variante ne sont pas reprises. Pays, secteurs, positions et mises en page restent inchangés.

Les présentations ETF et comparatifs proposent EUR/USD pour les années complètes documentées de la part exacte. Les observations YTD/glissantes sans bornes ne sont pas converties arbitrairement. La devise de cotation et les caractéristiques du fonds restent inchangées.

Le Calculateur convertit chaque clôture mensuelle avant le calcul des unités achetées : chaque versement DCA utilise donc le change de son mois. Le prix facultatif reste saisi dans la devise d'origine et est converti à la borne finale. Les sorties texte, PNG et vidéo utilisent la devise de simulation. Le scénario de crise conserve pour l'instant sa devise native ; la conversion est disponible dans le scénario Date libre, en versement unique et DCA.

Classements et Calculateur partagent la conversion mensuelle ; Générateur et Duels partagent la conversion de rendements annuels, y compris les autres devises qualifiées. Les séries NAV, cours ajustés et indices restent distincts : l'identité d'un ISIN ne suffit pas à promettre une égalité entre deux bases différentes.

Le navigateur a révélé un défaut antérieur : les projections compilées du Calculateur et du module mathématique recréaient deux objets Livret A, ce qui faisait manquer le calcul spécifique des quinzaines. Le Calculateur importe maintenant les paramètres du même module que le moteur mathématique. Un contrôle navigateur vérifie que le Livret A ne reste pas à zéro sur une période rémunérée.

Validation : compilation et budgets, tests de change, classements, duels, calendriers ETF et contrôles croisés. Le nouveau test croisé vérifie ACWI net, le refus des mélanges, le DCA avec taux de chaque mois, les exports et 476 comparaisons fiche/comparatif (effectif observé à cette date). Un test navigateur dédié exerce les paramètres et téléchargements PNG, ainsi que le résultat Livret A de la version compilée. Ces deux tests rejoignent le portail de déploiement.

## Suite proposée

4. Raccordements : qualifier les cotations bloquées et collectes en attente, conserver les fenêtres minimales et distinguer prix brut/historique ajusté pour Il y a X ans.
5. Données descriptives : positions intégrales, couverture de change, cotations exactes, preuves PEA selon les actifs réellement utilisés.
6. Suivi : réconcilier rapports de couverture et causes des lacunes ; distinguer panne, attente de publication, historique trop court et non applicable.
