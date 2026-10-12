# Extension des outils — 12 octobre 2026

Les ajouts utilisent les registres partagés. Les fiches, textes et images gardent leurs structures existantes. Les profils DCA restent des scénarios éditoriaux : leurs budgets sont des montants choisis, pas des données salariales collectées.

## ETF et historiques

- Matériaux : fiche classique Xtrackers IE00BM67HS53 et fiche iShares MSCI World Materials Sector Advanced, IE00BJ5JP766, fiche et historique WMTS Amsterdam USD depuis mai 2022. La sélection Advanced diffère du MSCI World Materials classique.
- Services publics : Xtrackers MSCI World Utilities, IE00BM67HQ30, fiche et historique XDWU Xetra EUR depuis juin 2016. Les performances antérieures du fonds luxembourgeois fusionné ne prolongent pas cette part irlandaise.
- Innovation médicale : IE00BYZK4776, fiche existante conservée ; collecte officielle de la part et historique HEAL Londres USD depuis octobre 2016.
- Cloud : IE00BJGWQN72, fiche existante conservée ; historique WCLD Londres USD depuis octobre 2019. Les cotations sont extraites automatiquement de la table ISIN/devise/ticker/RIC de la fiche WisdomTree, indépendamment des dates des frais.

Ces quatre séries alimentent Performance depuis, Et si tu avais investi et Il y a X ans. Les simulations utilisent les cours ajustés ; les anniversaires les clôtures brutes. Les clôtures mensuelles sont recoupées avec les séances quotidiennes, sans interpolation.

L’iShares World Utilities de mai 2025 reste exclu des constructions : aucune année civile complète publiée. Le fonds Xtrackers fournit une part plus ancienne réellement disponible. Minimum Volatility, Digital Security et les semi-conducteurs étaient déjà raccordés aux historiques : aucun doublon.

## Comparaisons et portefeuilles

Les fiches de santé mondiale et des deux parts matériaux couvrent aussi les supports du générateur.

Cinq comparatifs : Quality/Value, Momentum/Minimum Volatility, industrie/infrastructures, semi-conducteurs/robotique, matériaux classique/Advanced. Le comparatif santé/innovation/biotech existe déjà.

Trois duels : World seul contre World + 20 % Minimum Volatility, + 10 % santé mondiale, + 5 % semi-conducteurs. Quatre constructions ajoutent Minimum Volatility, santé, matériaux ou services publics au World. Le générateur conserve six années réelles communes : la poche matériaux utilise la part Xtrackers déjà collectée, et non un proxy attribué à l’iShares plus récent.

Les profils DCA réutilisent Costco, Caterpillar, Deere, Waste Management et les secteurs matériaux/services publics, sans changer leurs budgets totaux.

## Indices

MSCI World Materials et MSCI World Utilities : documents MSCI, composition propre de l’indice et rendement net USD. Tous les champs affichés sont exigés. Le workflow quotidien des fiches entièrement automatisées collecte désormais ces deux indices en plus des cinq sélections existantes. L’indice Minimum Volatility reste dans sa fiche existante.

## Entreprises

Walmart, Netflix, Booking Holdings, Caterpillar et Deere : découverte renouvelable des publications depuis leurs archives officielles. Quatre trimestres publiés, historique consolidé GAAP, cours de dernière séance terminée et estimations publiques. Aucun Q4 calculé par soustraction.

La collecte officielle est primaire ; la SEC n’est pas nécessaire pour les comptes. Les composants annuels optionnels sont aussi relus dans les documents de l’émetteur. Un champ non qualifié reste absent. Les colonnes de pourcentages Walmart ne deviennent pas des montants ; les revenus financiers de Caterpillar ne remplacent pas son chiffre d’affaires consolidé ; les montants Netflix en milliers sont convertis explicitement.

Les divisions Netflix 10:1 et Booking 25:1 sont recoupées entre déclaration officielle et séance Yahoo. Une date d’effet précédant un week-end ou un jour sans cotation est rapprochée de la première séance réelle suivante, sans tolérance arbitraire. Les BPA originaux et les preuves de normalisation sont conservés.

## Fréquences et validation

ETF : collecteurs quotidiens existants. Indices : collecte quotidienne stricte. Historiques : les 2/4/8/16 du mois, reprise quotidienne des échecs et derniers cours chaque jour. Entreprises : workflow quotidien à 06:35 UTC. Les erreurs gardent les observations et leurs dates d’origine.

Une PR de validation dédiée collecte les nouvelles sources sur GitHub Actions, vérifie les registres et constructions, compile le site, puis contrôle les outils et exports dans Chromium. La publication reste soumise à ces contrôles.

Les poids nets de liquidités/dérivés DWS restent signés, sans écrêtage ni renormalisation des actions. Les données ETF sont partitionnées uniquement à la compilation, avec une source JSON unique et une limite de taille par fichier.

Waste Management reste hors publication et collecte de production : ses documents répondent HTTP 403 sur GitHub Actions. Le candidat pourra être requalifié par une collecte explicite, sans activer de chiffres locaux à sa place.
