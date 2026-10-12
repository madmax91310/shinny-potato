# Extension qualifiée et affectation aux outils — 12 octobre 2026

Règle : chaque affichage utilise une collecte réelle validée et une actualisation planifiée. Aucun ajout centré sur un pays. Aucun changement du squelette des textes/images. Les données de part ETF/ETC ne sont jamais substituées à celles d'un indice.

| Actif / exposition | Présentation ETF | Comparatif ETF | Performance depuis | Et si tu avais investi | Il y a X ans | Analyse entreprise |
|---|---|---|---|---|---|---|
| iShares World Mid-Cap Equal Weight | Oui | World / Mid-Cap Equal Weight | Non | Non | Non | Non |
| iShares Global Water | Oui | Non | Oui | Oui | Oui | Non |
| iShares Agribusiness | Oui | Non | Oui | Oui | Oui | Non |
| iShares Global Timber & Forestry | Oui | Non | Oui | Oui | Oui | Non |
| iShares Listed Private Equity | Oui | Non | Oui | Oui | Oui | Non |
| iShares World Industrials Sector Advanced | Oui | Non | Non | Non | Non | Non |
| iShares World Consumer Staples Sector Advanced | Oui | Consommation de base / discrétionnaire | Oui | Oui | Oui | Non |
| iShares World Consumer Discretionary Sector Advanced | Oui | Consommation de base / discrétionnaire | Oui | Oui | Oui | Non |
| iShares World Energy Sector | Oui | Non | Oui | Oui | Oui | Non |
| iShares World Communication Services Sector Advanced | Oui | Non | Oui | Oui | Oui | Non |
| Avantis Global Small Cap Value, ETF actif | Non | Non | Oui | Oui | Oui | Non |
| iShares Physical Platinum ETC | Non | Non | Oui | Oui | Oui | Non |
| iShares Physical Palladium ETC | Non | Non | Oui | Oui | Oui | Non |
| AMD | Non | Non | Non | Non | Non | Oui |

## Collectes et publication automatique

- Dix fiches : données officielles iShares structurées, ISIN, nom, réplication, domicile, revenus, frais, encours de la part, pays/secteurs/positions, performances calendaires NAV réinvesties. La cotation est extraite du composant structuré officiel, avec devise publiée, extrait de ligne et SHA-256 de réponse. Les pages HTML ne sont pas nécessaires. Nouveau workflow quotidien 07:50 UTC ; audit et publication des changements.
- Onze historiques : collecte mensuelle existante les 2/4/8/16 du mois et reprise quotidienne des échecs. Clôtures quotidiennes et bougies mensuelles comparées, devises et cotations exactes ; absence de mois ou anomalie non résolue bloque le raccordement. Le palladium conserve une vérification quotidienne indépendante du mois d'août 2015, sans relâcher la tolérance.
- Anniversaires : niveaux courants collectés chaque jour par le workflow existant ; historiques de cours bruts pour les anniversaires, ajustés des revenus pour les simulations/performance. La séance, la devise et la convention sont conservées.
- Avantis : historique depuis octobre 2024, 24 mois au lancement. Gestion active, sans assimilation à un indice.
- Platine/palladium : historiques des ETC exacts IPLT/IPDM en USD depuis mai 2011, 185 mois ; pas de substitution par des contrats futures ou par un cours spot.
- AMD : comptes officiels SEC, publications trimestrielles découvertes depuis l'archive IR, quatre vrais BPA trimestriels incluant Q4, cours et estimations collectés quotidiennement. Illustration générée sur le style existant, sans logo ni donnée chiffrée.

Les erreurs conservent les dernières observations validées sans modifier leur date de valeur. Les erreurs sur une fiche active font échouer le contrôle de collecte. Les candidats non qualifiés ne deviennent pas des choix disponibles. Les imports séparés gardent chaque paquet JavaScript sous 500 kB.

## Exclusions

- World Utilities : aucune année civile complète publiée pour la part identifiée ; reprise automatique et activation uniquement après collecte complète.
- Présentation Avantis et ETC : aucun pipeline complet qualifié pour tous les champs de ces fiches. Les historiques peuvent être utilisés indépendamment sans ajouter un TER manuel.
- Historiques Mid-Cap et Industrials : anomalie de clôture, début/couverture incomplet ou cotation non disponible chez le fournisseur ; aucun raccordement aux simulateurs.
- Coulisses : aucune nouvelle composition d'indice exacte avec performances dividendes réinvestis entièrement qualifiée dans ce lot. Les compositions de fonds restent des compositions de fonds.
- Adobe, Salesforce, ServiceNow, S&P Global, Intuitive Surgical : aucun adaptateur entièrement validé pour quatre trimestres publiés incluant Q4 ; pas de trimestre obtenu par soustraction annuelle.
- Mastercard : conflit de tags SEC ; Booking : revenus/résultat non alignés ; TSMC et Spotify : adaptateurs IFRS/devises nécessaires.
- BlackRock, Vanguard, Amundi, State Street, Invesco, WisdomTree, VanEck : les conditions de souscription/détention/revenus/frais/durée/sortie sont celles d'un produit précis, pas du gestionnaire.
- MSCI, FTSE Russell, S&P DJI, STOXX, Nasdaq et Solactive : fournisseurs d'indices, hors du squelette actuel de Présentations d'offres investissables.
