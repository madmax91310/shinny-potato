# Six fiches ETF automatisées — 11 octobre 2026

Ajout à Présentation ETF uniquement, sans modifier son squelette ni les sélecteurs des outils de simulation.

| Part exacte | Source renouvelable | Performances |
|---|---|---|
| iShares MSCI EM Small Cap — IE00B3F81G20 | API officielle iShares /251859 | Années complètes NAV USD, revenus réinvestis |
| iShares Core MSCI Pacific ex-Japan — IE00B52MJY50 | API officielle iShares /253735 | Années complètes NAV USD |
| WisdomTree Cloud Computing — IE00BJGWQN72 | Page officielle et factsheet courante par ISIN | Années complètes NAV USD |
| Global X Copper Miners — IE0003Z9E2Y3 | Page officielle COPX, part USD Acc | Rendements cumulés datés : 1 mois, 3 mois, 1 an, depuis janvier et depuis le lancement |
| VanEck Gold Miners — IE00BQQP9F84 | Factsheet courante GDX et API d’allocation | Années complètes NAV USD, revenus nets réinvestis |
| JPM Global Equity Premium Income Active — IE0003UVYC20 | Factsheet courante officielle JPMorgan, ISIN identique | Années complètes 2024 et 2025 NAV USD, distributions brutes réinvesties |

La collecte quotidienne existante (`collect-etf-pilot.yml`, 07:10 UTC) inclut ces six connecteurs activés. TER, encours datés (part/fonds explicités), pays, secteurs, positions pondérées et performances ont tous été qualifiés en collecte réelle. L’actualisation reste à la fréquence de publication de chaque émetteur. En cas d’identité, devise, date ou format incorrect, le collecteur signale l’échec et conserve les valeurs actives antérieures.

COPX : les rendements « discrete » publiés sont d’avril à avril. Ils ne deviennent jamais des années civiles. Les données cumulées passent désormais par le registre automatisé, avec leurs dates propres. Aucun rendement de l’indice ou d’une autre part n’est utilisé.

GDX : l’astérisque sur 2025 documente le changement d’indice de septembre 2025. Le collecteur accepte cette marque sur l’en-tête et garde la ligne numérique du fonds, distincte de celle de l’indice.

JPMorgan : ETF actif, sans réplication du MSCI World. Le MSCI World est seulement une référence de comparaison. L’année partielle de lancement 2023 est exclue. La part USD distribuante est distincte de la part EUR et des fonds américains.

Les champs structurels sont sourcés séparément. Le PEA n’est pas déduit du domicile ; seul le statut explicitement documenté est affiché selon la règle existante. Illustrations locales déjà présentes, sans nouvelles images ni modification du rendu.

Validation : collecte réelle 6/6 sans erreurs de champs ; tests des parts, périodes cumulées, lignes fonds/indice, années incomplètes, dates futures/périmées et données aberrantes ; contrôles des registres, cotations et provenance ; compilation et budgets de bundles. Les tests navigateur des exports font partie de la CI avant fusion.
