# Automatisation et fiabilité — lots 1 à 5, 20 octobre 2026

## Livraisons

1. Les 21 producteurs financiers sont raccordés au publieur validé commun. Le registre `scripts/validated-data-producers.json` énumère toutes leurs sorties JSON communes explicitement committées, ainsi que les sorties principales du parcours d’intégration. Chaque fichier (y compris chaque fichier d'un répertoire 13F) est comparé au blob exact du producteur après tous les générateurs. Le reçu décrit ce producteur, et non des fichiers étrangers éventuellement retenus par la composition. Le manifeste et la vérification HTTP restent ceux des octets réellement construits. Le code financier modifié passe par le portail complet. Un fichier nécessaire retenu par la composition déclenche aussi ce portail ; il ne peut pas être publié par la voie rapide.
2. La surveillance ajoute les champs présents en retard et les compositions conservées après échec, même si le workflow est vert. Un bilan de champs absent ne certifie aucun retour à la normale. Les dates de tentative, d'observation et de contrôle restent distinctes. Le succès de l'action Pages ne suffit plus lorsqu'une étape de vérification publique existe mais échoue.
3. Les sources physiques restantes ont été examinées sans substituer un autre fonds. WisdomTree et UBS refusent l'accès aux pages testées ; les documents WisdomTree accessibles ne sont pas des compositions complètes. L&G fournit les identités et documents mais aucune composition complète qualifiée. Le CSV URNU contient des poids de change absents et deux lignes sans identité ; il reste rejeté. La découverte BNP ne fournit pas de composition complète. Les 13 raccordements ne sont pas clôturés.
4. Les deux parts TOPIX sont raccordées au CSV officiel JPX. Les poids au 31 août 2026 portent sur 1 636 lignes (99,9985 %, arrondis publiés). Le tableau courant officiel iShares TOPIX permettait de rapprocher 1 630 identités Tokyo/JPY. Le tableau historique au même 31 août, contrôlé contre son CSV daté, identifie les six dernières : les 1 636 lignes sont désormais identifiées. Les poids du fonds ne sont jamais utilisés. La qualification des parts est distincte, avec leur propre document Amundi et sa date. La part couverte garde uniquement le périmètre actions de l'indice ; les couvertures de change ne sont pas inventées. Les deux raccordements sont qualifiés. Une future identité absente reste explicite et remet le raccordement dans le backlog, sans renormalisation.
5. Les cinq cas PEA ont été retentés. Le conflit iShares Euro Dividend reste explicite (déclarations positives et négatives réobservées). La page Nasdaq de pondérations requiert une connexion pour la liste complète ; aucun accès restreint n’est contourné. Les champs QYLD demeurent non qualifiés lorsque part, période ou poids ne concordent pas. Les quatre anciens contrôles WisdomTree ne sont pas rajeunis avec une fiche plus ancienne.

La sélection des validations peut regrouper les commits de code devenus obsolètes avant le démarrage des contrôles, en revalidant intégralement le commit master sélectionné. Un changement des définitions de workflows empêche cette substitution : GitHub fixe ces définitions lors du déclenchement. La nouvelle file de validation évite le stock de validations de l'ancienne politique ; aucun run actif n'est annulé et le verrou de publication protège l'ordre code/données.

## Validation et preuves

- Tests des sorties multiples, des répertoires et des chemins non autorisés.
- Contrats de chaque workflow producteur ; maintien des validations et signaux d'échec partiel.
- Tests des incidents de champs, des rapports absents et de la vérification après Pages.
- Parseur JPX : dates, schéma, doublons, précision, total, source d'identité, part et benchmark exacts ; les poids du fonds d'identité ne modifient jamais le résultat.
- Collecte réelle TOPIX, compilation, tests DCA et inventaire, parcours Chromium ordinateur/mobile.
- Preuves de recherche dans les artefacts `automation-lots-sources`, `automation-lots-manifest` et `topix-validation` du workflow de qualification. Un accès HTTP réussi n'est jamais une qualification financière.

## Roadmap conservée

| Lot | État après ces changements | Suite |
|---|---|---|
| 1. Publication automatique fiable | Mécanisme généralisé aux 21 producteurs | Vérifier les cycles réels de chaque famille et les preuves publiques |
| 2. Surveillance et reprise | Surveillance des champs et certification de publication renforcées | Suivre les incidents réels et les délais propres aux sources |
| 3. Treize compositions physiques | Sources examinées ; blocages maintenus | Obtenir des téléchargements complets qualifiables pour les 13 fonds |
| 4. Indices de 32 ETF | Deux TOPIX raccordés, identité encore partielle | Six codes TOPIX à qualifier ; 30 autres raccordements d'indices |
| 5. Contradictions et données non qualifiées | Preuves PEA renouvelées ; absences et conflits maintenus | Résoudre les preuves PEA/QYLD et les quatre retards WisdomTree |
| 6. Conditions contractuelles | À poursuivre | Placement-direct Vie, Anaxago, Fundora, France Valley, Bacchus, MyMarguerit, Hectarea et six recoupements courtiers |
| 7. Données non publiées/manuelles | À poursuivre | 18 non publiées et 6 manuelles ; ne pas créer de valeurs artificielles |
| 8. Identités et conventions | Socle existant, à consolider | Événements de titres, devises, parts et conventions de performance |
| 9. Utilisation dans tous les outils | Raccordement TOPIX exercé dans DCA | Matrice exhaustive données/consommateurs et prérequis des calculs |
| 10. Lisibilité de la qualité | Statuts et couverture conservés | Preuves et limites près des résultats et dans les exports |
| 11. Tests et gouvernance | Tests ciblés ajoutés | Qualification des modules et procédures de reprise par famille |
| 12. Performances et exploitation | Chargement différé des compositions conservé | Suivi des poids, quotas, durées et coûts |

Les compteurs de l'inventaire publié restent la référence. Les deux TOPIX peuvent changer de catégorie sans réduire le nombre de points à traiter : raccorder un tableau complet ne résout pas les identités absentes. Les lots 3 à 5 ne sont donc pas annoncés comme intégralement terminés.
