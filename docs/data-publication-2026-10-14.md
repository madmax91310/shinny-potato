# Données et confort de publication — 14 octobre 2026

## Livré

- Silver Miners (IE000UL6CLP7) : pays complets au 30 septembre 2026 et dix premières positions au 13 octobre, depuis la page officielle Global X. Les garanties de prêt de titres sont exclues.
- Avantis Global Small Cap Value (IE0003R87OG3) : onze secteurs et dix premières positions au 30 septembre 2026, depuis la fiche officielle. Le parseur lit la colonne du fonds, contrôle les totaux et refuse les tableaux incomplets.
- Ces quatre blocs rejoignent le collecteur quotidien existant, avec date propre, source et empreinte du document. Les données déjà validées restent conservées si une collecte échoue.
- Favoris dans les sélecteurs d’actifs. Sélections restaurées pour fiches ETF, fiches indices, comparatifs et duels ; paramètres du simulateur et allocations manuelles des duels mémorisés. Les liens explicites vers un actif restent prioritaires.
- Les données calculées sont recalculées à l’ouverture. Une préférence obsolète ou un stockage indisponible ne bloque pas les outils.
- Téléchargement de l’aperçu affiché, nouvelle tentative en cas d’échec de génération et exclusion des images terminées après un changement de sélection.

## Couverture observée

| Champ | Avant | Après |
|---|---:|---:|
| Frais | 197/197 | 197/197 |
| Encours | 197/197 | 197/197 |
| Performances calendaires | 181/197 | 181/197 |
| Pays | 167/197 | 168/197 |
| Secteurs | 167/197 | 168/197 |
| Positions | 172/197 | 174/197 |

Une absence peut être normale : produit sans actions, première année incomplète, tableau non publié. Cette couverture ne promet pas une disponibilité universelle.

## Suite, par priorité

1. Compléter les expositions LifeStrategy seulement avec une source permettant un calcul transparent des fonds sous-jacents ; qualifier les tableaux pays/secteurs Invesco encore absents.
2. Continuer la surveillance des premières années complètes des parts récentes. Ne pas prolonger artificiellement leur historique avec celui d’une autre part. Avantis ne publie que cinq pays ; Silver ne publie pas de secteurs complets dans cette source.
3. Réduire les travaux de CI et chargements redondants après mesure, en conservant les validations de données et la vérification du déploiement réel.

Le chantier des 32 contradictions/radar est suivi séparément. Les formulations et le squelette des tweets ne sont pas modifiés par ce lot.

## Vérification

Tests des parseurs (dates futures, colonnes, totaux et tableaux manquants), tests de consommation des compositions, des préférences et inventaire des lacunes. Test navigateur ajouté au workflow : restauration des sélections, favoris, téléchargement identique à l’aperçu, changement d’actif, mobile et préférence obsolète. Build et budgets de chargement vérifiés.
