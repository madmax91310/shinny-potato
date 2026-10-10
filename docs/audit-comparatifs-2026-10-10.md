# Audit des sélections et images — 10 octobre 2026

Revue des 31 sélections de `DEFAULT_THEMES`. Cet audit porte sur la cohérence
éditoriale des expositions et la fidélité des exports aux registres existants ;
il ne constitue pas une nouvelle validation des données auprès des émetteurs.

## Corrections

- World PEA : un MSCI World (WPEA) face à un MSCI ACWI (GPEA), au lieu de trois
  World face à un ACWI. Les produits retirés restent dans le catalogue.
- USA PEA : un S&P 500 face à un Nasdaq-100 ; suppression du second S&P 500.
- Émergents PEA : PAEEM face aux trois régions ; retrait de PEMS, autre part du
  même fonds, de cette comparaison d’expositions.
- Métaux : un produit pour chaque métal (or, argent, cuivre), au lieu de deux or.
  La différence métal physique / contrats à terme et les coûts du swap sont conservés.
- Textes Monde et USA : nombres de produits, indices et enveloppes corrigés.
- Images : les agrégats « Other / Autres » ne sont plus présentés comme un pays
  ou un secteur individuel parmi les trois principaux. Les valeurs sources restent intactes.

## Revue des autres sélections

| Sélection | Motif de conservation |
| --- | --- |
| Monde | World, ACWI et FTSE All-World : univers et indices identifiés |
| USA | S&P 500, Nasdaq-100, Dow Jones : trois indices distincts |
| Europe | MSCI Europe, Europe 600, Euro Stoxx 50 : périmètres distincts |
| Tech Europe | Comparaison de produits sur un même indice : frais et enveloppe différents |
| Émergents | ESG, IMI avec petites capitalisations, et réplication physique : différences explicites |
| Luxe | Deux indices et enveloppes distincts |
| IA / Robotique | IA / Big Data, IA et robotique : univers distincts |
| Santé | Europe, monde avec exclusions, monde : périmètres distincts |
| Renouvelables | Trois indices distincts et politiques de distribution identifiées |
| Dividendes | Rendement, historique de croissance et qualité : méthodes distinctes |
| Japon | TOPIX couvert / non couvert, MSCI Japan et Nikkei : couverture et indices distincts |
| Défense | Défense mondiale et deux indices européens distincts |
| Quantique | Trois indices / méthodologies distincts, lancements récents identifiés |
| Ressources naturelles | Ressources européennes, matériaux Europe / monde et minières : univers distincts |
| World / Minimum Volatility | Pondération par capitalisation face à optimisation du risque |
| Innovation médicale | Santé, innovation et biotech : univers distincts |
| Émergents avec / sans Chine | Inclusion de la Chine et différence IMI précisées |
| Immobilier / infrastructures | Deux classes d’entreprises distinctes |
| World / ACWI / ACWI IMI | Pays émergents et petites capitalisations identifiés |
| World avec / sans USA | Exclusion des États-Unis explicite |
| Grandes / petites entreprises | Tailles d’entreprises distinctes |
| Financières | États-Unis face aux pays développés |
| Semi-conducteurs / technologie | Spécialisation face à secteur plus large |
| Europe PEA | Trois indices distincts |
| Spatial, jeux vidéo, blockchain | Trois fiches de découverte à un seul ETF, formulées « à découvrir » |

## Intégration visuelle et validation

Le style éditorial crème est composé par Canvas, avec une illustration locale
unique dans l’en-tête. Noms, ISIN, frais, rendements, secteurs, pays et dates sont
dessinés depuis les registres de l’application ; aucune capture contenant des
chiffres figés ne sert de fond. La carte est une silhouette Natural Earth décorative.
Les dates des secteurs et pays restent indépendantes, et chaque rendement est
celui de la part exacte dans sa devise. Aucun rendement de référence ne remplace
un historique absent. Les frais de gestion du cuivre restent distincts du swap.

Vérification : build, lint, audit des raccordements, assertions de sélection,
rendu des 31 sélections et de 46 actifs (texte, valeurs, découpe et chevauchement),
et tests du studio (zoom, téléchargement PNG, mobile et état des brouillons).
