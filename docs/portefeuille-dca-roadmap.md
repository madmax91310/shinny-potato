# Portefeuille & DCA — décisions et roadmap

Décisions du 28 octobre 2026, après audit des parcours Actifs & expositions et Le DCA d’un abonné.

## Périmètre de la correction autorisée

- Vérifier les conventions réelles avant de comparer des répartitions : pays de risque et pays d’enregistrement, taxonomies et bases fonds/indice ne sont pas certifiés équivalents par le nom d’un groupe de synthèse. Une synthèse indicative reste disponible ; une comparaison hétérogène non qualifiée est refusée.
- Conserver le texte personnalisé lors d’un changement de type de visuel, de nombre de catégories ou d’ajout du top 10 des entreprises.
- Révoquer la validation d’une participation dès qu’une option du visuel change.
- Utiliser la même allocation analysée et le même périmètre de détentions dans l’analyse et le PNG de concentration, y compris après changement de mode, sauvegarde ou restauration. Les groupes de dates ou bases incompatibles restent distincts.

Les tests de régression couvrent les contrats des observations, la conservation du texte, la révocation de validation et les chiffres du canvas réellement associé à l’aperçu dans les deux parcours.

## Choix visuels confirmés

- Géographie et secteurs restent rapportés à la poche applicable ; or et Bitcoin n’ont pas de pays à leur attribuer. Aucune nouvelle mention dans les images.
- Pas d’ajout de dates, sources ou avertissements sur les PNG à l’occasion de ce chantier. Les preuves restent consultables dans l’analyse.
- Le format actuel de concentration reste léger. Les taux de recouvrement par paire restent dans l’analyse interactive ; pas de matrice supplémentaire dans l’image.
- Pas de refonte graphique ni de changement des profils éditoriaux dans ce lot.

## Suite proposée — non engagée

| Ordre | Chantier | Résultat attendu | Critère de fin |
| --- | --- | --- | --- |
| 1 | Rendre les limites plus compréhensibles dans l’interface | Expliquer pourquoi une comparaison est refusée et quels supports ou conventions sont concernés, sans encombrer le PNG | Un portefeuille mixte montre des raisons et sources précises ; aucune équivalence supposée |
| 2 | Améliorer les compositions utiles au recouvrement | Compléter les supports les plus utilisés dont seules les principales positions sont connues | Source intégrale automatisée, identité et date qualifiées, panne isolée avec ancienne observation conservée ; aucun top 10 transformé en composition complète |
| 3 | Faciliter la composition de grandes allocations | Répartition à parts égales et ajustement explicite du solde, avec contrôle des doublons et total visible | Cas 1, 2, 8 et 50 lignes utilisables sur mobile ; aucun poids changé sans action explicite |
| 4 | Rendre les sauvegardes transportables | Import/export des portefeuilles avec texte, options et choix d’analyse | Aller-retour sans perte, format versionné, import invalide sans écrasement et approbation révoquée à l’import |
| 5 | Renforcer les recettes ciblées | Rejouer les cas multi-actifs, méthodes différentes, données partielles et périmètres multiples après évolution des collectes | Égalité des chiffres entre écran et aperçu, données vivantes non figées et images lisibles sur téléphone |

Les priorités ci-dessus sont une proposition de suite, pas une autorisation de nouvelles fonctionnalités ou de nouvelles automatisations. Un nombre d’actifs supplémentaire ne constitue pas à lui seul un critère de réussite.
