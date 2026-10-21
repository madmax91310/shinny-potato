# Composition et concentration dans Coulisses des indices

Qualification initiale : 21 octobre 2026. 33 indices sur 55. Les valeurs et la disponibilité sont recalculées au build depuis les observations communes.

Les documents de CAC 40, DAX et Dow Jones décrivent explicitement l’indice (jamais le panier du fonds synthétique). La règle de sélection de chaque univers permet une seule ligne par entreprise ; les dix lignes doivent toutes avoir un ISIN explicitement revu. Les autres compositions retenues sont des approximations par ETF physiques du benchmark exact, identifiées dans l’interface avec leurs preuves. Une modification du benchmark ou de la réplication suspend la nouvelle qualification.

Les compositions complètes sont regroupées par ISIN et table d’identités d’émetteurs revue, sans comparaison floue des noms. Les classes Alphabet, Samsung, Hyundai, Roche, les titres français au nominatif et la structure duale Rio Tinto sont notamment regroupés. Les dix entreprises sont sélectionnées après agrégation. Les poids ne sont pas renormalisés. Le reste vaut 100 moins leur somme, sans effectif supposé. L’arrondi répartit les centièmes pour que les dix libellés concordent avec le centre du donut et que les onze parts totalisent 100 %.

Les deux onglets sont distincts : « Coulisses des indices » conserve le texte et le PNG d’origine comme contenu et téléchargement principaux ; « Composition top 10 » propose uniquement le donut et ses actions, avec les preuves repliables. La sélection est commune et les brouillons survivent au changement d’onglet. Les 51 PNG d’origine sont comparés pixel par pixel au moteur de rendu antérieur à #858.

Le premier onglet conserve les pays, secteurs, positions et dates de la fiche d’origine. Le donut du second onglet utilise sa composition qualifiée, dont la date est exposée dans ses propres preuves ; il ne remplace aucune donnée de la fiche d’origine. Lorsque le portefeuille complet iShares publie les attributs de chaque ligne, les ventilations sont agrégées avec ses propres poids et sa propre date (pays de risque et secteurs publiés), sans utiliser les tableaux de ventilation indépendamment datés ni renormaliser la poche actions. Le tweet historique et ses performances, devises et conventions ne changent pas. La fiche d’origine reste directement prévisualisable et téléchargeable dans le premier onglet. Le comptage d’un fonds n’est jamais attribué à l’indice ; les comptages historiques restent dans le premier onglet. Les indices ajoutés ici n’inventent aucune performance ni aucun tweet.

Les portefeuilles physiques sont actualisés par les collecteurs existants. Le workflow quotidien des fiches actualise aussi les quatre indices complémentaires et conserve les qualifications validées et leur historique par date dans index-company-observations.json (documents) et index-company-qualified.json (qualifications). Un échec conserve la dernière qualification, indique sa date et remonte dans le rapport d’automatisation. La projection compacte est régénérée à chaque build ; elle est ignorée par git. La fraîcheur utilise freshness-policy.json.

MSCI Korea : la fiche officielle limitée à dix titres ne suffit pas après regroupement de Samsung. La composition complète publiée par NH-Amundi HANARO MSCI Korea TR (KRX 332940) permet de regrouper Samsung et les catégories Hyundai avant de sélectionner dix entreprises. Le prospectus confirme le benchmark MSCI Korea Gross TR standard et une stratégie de réplication physique. La qualification porte sur le panier de souscription publié, qui peut différer des positions comptables du fonds. Les noms et attributs pays/GICS proviennent du fichier iShares par ISIN, obligatoirement à la même date ; aucun poids du MSCI Korea 20/35 n’est lu ni utilisé. Les valeurs publiées restent rapportées au total, sans renormalisation ; les liquidités restent dans le complément à 100 %. Les deux sources et leurs empreintes sont conservées.

Limites : une fiche limitée à dix titres ne certifie pas dix entreprises après regroupement. Les droits ou titres sans ISIN, les fonds sous-jacents non transparisés à la même date et les dates de ventilations incompatibles désactivent la nouvelle qualification. Une approximation ETF peut différer de l’indice (échantillonnage, trésorerie, arrondis, réplication) ; la source et cette limite restent visibles dans l’interface.

| Indice | Composition top 10 | Date ou limite |
|---|---|---|
| MSCI USA | Indisponible | Les principales lignes disponibles ne certifient pas les dix premières entreprises après regroupement. Aucune composition complète qualifiée pour cet indice exact. |
| MSCI India | Approximation physique | 2026-10-19 |
| FTSE EPRA Nareit Developed Dividend+ | Indisponible | Dates des positions, pays et secteurs incompatibles ; aucun mélange de photographies |
| FTSE Global Core Infrastructure | Approximation physique | 2026-10-19 |
| MSCI World Momentum | Approximation physique | 2026-10-19 |
| MSCI World Minimum Volatility (USD) | Approximation physique | 2026-10-19 |
| MSCI World Sector Neutral Quality | Approximation physique | 2026-10-19 |
| MSCI World Enhanced Value | Approximation physique | 2026-10-20 |
| MSCI EM ex-China | Indisponible | Identifiant, doublon ou poids de titre incohérent |
| MSCI ACWI IMI | Approximation physique | 2026-10-20 |
| S&P 500 Equal Weight | Approximation physique | 2026-10-19 |
| Russell 2000 | Approximation physique | 2026-10-20 |
| MSCI Emerging Markets | Approximation physique | 2026-10-20 |
| TOPIX | Indisponible | Les principales lignes disponibles ne certifient pas les dix premières entreprises après regroupement. Aucune composition complète qualifiée pour cet indice exact. |
| Nikkei 225 | Indisponible | Les principales lignes disponibles ne certifient pas les dix premières entreprises après regroupement. Aucune composition complète qualifiée pour cet indice exact. |
| MSCI ACWI | Approximation physique | 2026-10-20 |
| FTSE All-World | Approximation physique | 2026-09-30 |
| MSCI World Small Cap | Indisponible | Identifiant, doublon ou poids de titre incohérent |
| MSCI World ex USA | Approximation physique | 2026-10-19 |
| MSCI World | Approximation physique | 2026-10-19 |
| STOXX Europe 600 | Approximation physique conservée | 2026-10-19 ; nouvelle photographie non qualifiée (ventilations de date différente, attributs localisés non interprétés) |
| EURO STOXX 50 | Approximation physique | 2026-10-19 |
| MSCI Europe | Approximation physique | 2026-10-20 |
| MSCI EM ex-Egypt ESG Broad CTB Select | Indisponible | Les principales lignes disponibles ne certifient pas les dix premières entreprises après regroupement. Aucune composition complète qualifiée pour cet indice exact. |
| S&P 500 | Approximation physique | 2026-10-20 |
| Nasdaq-100 | Approximation physique | 2026-10-20 |
| MSCI World Consumer Discretionary | Indisponible | Les principales lignes disponibles ne certifient pas les dix premières entreprises après regroupement. Aucune composition complète qualifiée pour cet indice exact. |
| MSCI World Communication Services | Indisponible | Les principales lignes disponibles ne certifient pas les dix premières entreprises après regroupement. Aucune composition complète qualifiée pour cet indice exact. |
| MSCI World Health Care | Approximation physique | 2026-10-19 |
| MSCI World Financials | Indisponible | Les principales lignes disponibles ne certifient pas les dix premières entreprises après regroupement. Aucune composition complète qualifiée pour cet indice exact. |
| MSCI World Energy | Indisponible | Les principales lignes disponibles ne certifient pas les dix premières entreprises après regroupement. Aucune composition complète qualifiée pour cet indice exact. |
| MSCI World Islamic | Approximation physique | 2026-10-19 |
| MSCI World Materials | Approximation physique | 2026-10-19 |
| MSCI World Utilities | Approximation physique | 2026-10-19 |
| MSCI World Industrials | Approximation physique | 2026-10-19 |
| MSCI World Consumer Staples | Indisponible | Les principales lignes disponibles ne certifient pas les dix premières entreprises après regroupement. Aucune composition complète qualifiée pour cet indice exact. |
| MSCI EM IMI | Indisponible | Identifiant, doublon ou poids de titre incohérent |
| FTSE All-World High Dividend Yield | Approximation physique | 2026-09-30 |
| S&P Global Dividend Aristocrats Quality Income | Indisponible | Les principales lignes disponibles ne certifient pas les dix premières entreprises après regroupement. Aucune composition complète qualifiée pour cet indice exact. |
| MSCI World Growth | Indisponible | Les principales lignes disponibles ne certifient pas les dix premières entreprises après regroupement. Aucune composition complète qualifiée pour cet indice exact. |
| FTSE China 50 | Indisponible | Les principales lignes disponibles ne certifient pas les dix premières entreprises après regroupement. Aucune composition complète qualifiée pour cet indice exact. |
| FTSE EM | Approximation physique | 2026-09-30 |
| MSCI China | Indisponible | Les principales lignes disponibles ne certifient pas les dix premières entreprises après regroupement. Aucune composition complète qualifiée pour cet indice exact. |
| MSCI China A | Indisponible | Les principales lignes disponibles ne certifient pas les dix premières entreprises après regroupement. Aucune composition complète qualifiée pour cet indice exact. |
| MSCI EM Asia Screened Select ex Thermal Coal | Indisponible | Les principales lignes disponibles ne certifient pas les dix premières entreprises après regroupement. Aucune composition complète qualifiée pour cet indice exact. |
| MSCI Emerging EMEA ESG Transition | Indisponible | Les principales lignes disponibles ne certifient pas les dix premières entreprises après regroupement. Aucune composition complète qualifiée pour cet indice exact. |
| MSCI Emerging Markets Latin America | Indisponible | Les principales lignes disponibles ne certifient pas les dix premières entreprises après regroupement. Aucune composition complète qualifiée pour cet indice exact. |
| MSCI Latin America Selection 20/35 Capped | Indisponible | Les principales lignes disponibles ne certifient pas les dix premières entreprises après regroupement. Aucune composition complète qualifiée pour cet indice exact. |
| MSCI Japan IMI | Approximation physique | 2026-10-19 |
| MSCI World High Dividend Yield Advanced Select | Approximation physique | 2026-10-19 |
| S&P Euro High Yield Dividend Aristocrats | Approximation physique | 2026-10-20 |
| CAC 40 | Poids de l’indice publiés par Amundi | 2026-09-30 |
| Dow Jones Industrial Average | Poids de l’indice publiés par Amundi | 2026-09-30 |
| DAX | Poids de l’indice publiés par Amundi | 2026-09-30 |
| MSCI Korea | Approximation physique | 2026-10-20 |

Validation : tests purs et collecte avec panne partielle, parsers existants, build et audit des bundles, vérificateur des fiches, contrôle navigateur de tous les canevas qualifiés, export réel et égalité binaire aperçu/PNG pour neuf indices, navigation rapide, indisponibilité Korea et mobile 390 px. Les images MSCI Korea, DAX, World, Dow Jones et Russell 2000 ont été inspectées visuellement. Les preuves navigateur sont produites sous test-artifacts/index-concentration.
