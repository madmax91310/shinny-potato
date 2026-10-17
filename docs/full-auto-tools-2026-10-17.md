# Raccordements et fraîcheur automatiques — 17 octobre 2026

Les historiques qualifiés rejoignent automatiquement les outils historiques, les classements, les duels et la composition manuelle du générateur. Les actions déjà connues sont reliées par leur cotation exacte et leur ISIN ; une cotation ADR ne remplace jamais une action ordinaire. Les nouvelles lignes manuelles ne modifient pas les recettes ni les bornes de risque automatiques.

Le workflow mensuel qualifie aussi les actions du catalogue encore dépourvues d'historique. Les candidats proviennent des positions complètes publiées, avec ISIN, place et devise ; les données Yahoo doivent confirmer la cotation exacte, le type et la devise. Seul un segment mensuel continu entièrement recoupé est publié, avec ses preuves et ses cours bruts distincts. Trois années civiles communes sont requises dans les duels et le générateur. Les parts récentes restent disponibles dans les autres outils selon leur couverture réelle.

La collecte quotidienne `update-instrument-metadata.yml` contrôle les caractéristiques explicitement publiées (distribution, domicile, réplication, PEA et change), ainsi que les cotations documentées par les émetteurs ou les places. Elle conserve des preuves par champ : URL, empreinte et date de contrôle. Un document accessible ou un nom contenant « PEA » ne renouvelle aucun statut à lui seul. Les sources actuelles des émetteurs sont privilégiées ; les profils spécialisés peuvent compléter les caractéristiques, mais ne certifient pas seuls une nouvelle cotation.

Les sources de positions intégrales sont complétées depuis les observations des fonds physiques. Le collecteur revérifie le type du fonds et sa réplication. Les paniers de substitution des ETF synthétiques ne deviennent pas leurs expositions économiques.

La qualification, les rendements annuels, les conversions BCE, les identités, les liens entre outils, les contrôles et le déploiement sont enchaînés automatiquement. Les erreurs conservent la dernière observation fiable à sa date originale. La surveillance quotidienne signale aussi les contrôles en retard, indépendamment du succès global du workflow. Les publications et les contrôles sont datés séparément.

Les calendriers des nouvelles lignes manuelles sont chargés à la sélection. Un échec laisse la sélection intacte et permet de réessayer. Les données complètes et les fichiers servis sont dérivés des mêmes registres à chaque construction. Les plafonds de 300 ko à l'accueil et 500 ko par fichier restent appliqués ; certains budgets totaux par outil sont dimensionnés pour l'extension du catalogue et de ses preuves.

L'automatisation ne signifie pas que tous les champs sont publiés. Les valeurs non observées restent identifiées comme manuelles ou manquantes, même si une nouvelle tentative est programmée. Les positions intégrales, les caractéristiques, les séries mensuelles et les calendriers annuels sont comptés séparément dans `asset-field-coverage.md` et le rapport JSON publié. Aucun proxy, mois interpolé, année partielle ou poids artificiel n'est créé pour compléter ces rapports.

Validation : qualification Python, invariants d'identité et de cotation, indépendance ADR/actions ordinaires, égalité des performances EUR des duels et du générateur, conservation des recettes existantes, projection des données et collecte en échec. Les parcours Chromium vérifient les sélections, le chargement différé, la reprise après erreur, les expositions, les exports PNG et le mobile en CI.

## Résultat de la collecte initiale

116 nouveaux historiques mensuels d'actions et une nouvelle part ETF sont qualifiés, avec preuves conservées. 274 actions disposent d'une identité exacte raccordée aux historiques ; les anciennes cotations ADR non rapprochées restent séparées des nouvelles cotations ordinaires. Les 519 références d'expositions restent distinctes par ISIN.

La collecte des caractéristiques a observé des champs sur 191 ETF/ETC. Les observations complètes de quatre fonds supplémentaires sont raccordées. Les chiffres détaillés par champ et leur fraîcheur sont régénérés dans le rapport de couverture ; ils ne doivent pas être interprétés comme une couverture intégrale des caractéristiques. Les champs encore manuels ou non qualifiés restent visibles et les tentatives suivantes sont planifiées.

Validation locale finale : compilation avec plafonds de 300 ko à l'accueil et 500 ko par fichier, tests des calculs et de la provenance, contrôles DCA, qualification, projections et fraîcheur. Chromium vérifie des actions anciennes et nouvellement qualifiées, un ETF raccordé, le chargement à la sélection, la reprise après erreur, les exports PNG et le mobile.
