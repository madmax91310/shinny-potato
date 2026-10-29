# Preuves de la voie officielle de performance WisdomTree

Réponses publiques acquises le 29 octobre 2026 via les endpoints que le client officiel `https://perfchart.wisdomtree.eu/static/js/main.js` utilise. `*-graph.gz` et `*-tabular.gz` sont les réponses du même produit et de la même observation du 27 octobre ; `*-identity.gz` est la fiche officielle datée du 30 septembre. Les lignes du benchmark restent présentes dans la capture et sont exclues de la série produit. Aucune preuve de collecte GitHub ni de licence n’est déduite de ces fixtures.

Les quatre classeurs `*-qualified-nav.xlsx.gz` sont les exports officiels originaux qualifiés et publiés précédemment, conservés intégralement. Ils prouvent uniquement les ancres d’unités du 27 octobre, avec ISIN/classID/devise et SHA256 dans `scripts/wisdomtree-performance-anchors.json`. Leur consultation locale ne constitue pas une nouvelle réussite source. Le collecteur contrôle réellement le graphique, sa table d’identité et la fiche à chaque passage ; une panne n’est jamais remplacée par ces captures.

Les niveaux NAV(TR) du graphique sont des niveaux de performance, pas un prix brut : une multiplication constante les exprime dans les unités de la NAV de référence. Les ratios, facteurs déjà inclus et frais restent ceux de l’émetteur ; aucun dividende n’est ajouté. Le code ne revendique aucune réparation de l’ancienne cotation ou de l’ancien export.

La série fournie commence aux périodes déjà approuvées (Copper janvier2015 ; Brent/WTI décembre2020 ; Coffee décembre2021). Les observations précédentes du produit restent dans les preuves brutes mais sont exclues du résultat. En particulier, l’ancienneté du graphique Coffee ne prouve pas la continuité de l’ISIN actuel avant décembre2021.

Les contrôles calendaires et seuils existants restent appliqués à chaque année. Les six refus de l’ancien export restent dans sa fixture et dans les tests de fenêtres ; ils ne peuvent être retirés de l’usage actif qu’après requalification individuelle de la nouvelle série.
