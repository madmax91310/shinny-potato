# Performances de Présentation ETF — 12 octobre 2026

Audit des 120 fiches : 113 avaient déjà un registre de performance automatisé, cinq affichaient des observations ponctuelles et deux ne disposaient pas de rendement publié.

Quatre séries sont désormais collectées chaque jour par le workflow ETF existant :

| Part exacte | Rendements publiés | Source |
|---|---|---|
| Amundi PEA Monde FR001400U5Q4 | Depuis janvier, 1 mois, 3 mois, 1 an, depuis lancement | Factsheet Amundi courante, ligne Portefeuille, EUR |
| Amundi Core EUR High Yield LU2970735911 | Idem | Factsheet Amundi courante, ligne Portefeuille, EUR |
| iShares S&P 500 Swap PEA IE000DQLYVB9 | Depuis janvier, 1 mois, 3 mois, 1 an | Factsheet BlackRock courante, ligne Classe d’Actions, EUR |
| VanEck Quantum IE0007Y8Y157 | Depuis janvier, 1 mois, 3 mois, 1 an | Factsheet VanEck courante, ligne ETF, USD |

Les colonnes annualisées depuis le lancement de BlackRock et VanEck ne sont pas présentées comme des rendements cumulés. Les observations ne deviennent jamais des années civiles. Les collecteurs annuels déjà actifs prennent la priorité dès qu’une année complète est publiée. Le registre partagé alimente texte et image sans modification du squelette. Les simulations et leurs éventuels proxies conservent leurs règles existantes.

La collecte conserve les anciennes observations en cas d’erreur et remonte cet échec au workflow, avec son rapport archivé. Identité de part, devise, méthode, date et colonnes sont contrôlées.

Restent sans nouvelle performance qualifiée :

- Amundi PEA Global FR0014017NX3 : aucune performance publiée qualifiée, année de lancement 2026. Le collecteur Amundi interroge déjà son calendrier quotidiennement.
- iShares Europe Small Cap IE0000N55FP4 : l’API officielle masque les rendements pour les parts de moins d’un an ; le collecteur existe déjà.
- Global X QYLD IE00BM8R0J59 : la page comporte un en-tête USD Accumulating alors que son ISIN primaire et le ticker QYLD sont ceux de la part distribuante. Aucun nouveau chiffre n’est intégré automatiquement à cette part tant que cette contradiction n’est pas levée.

Validation : quatre téléchargements réels qualifiés, tests sur les extraits conservés (ligne fonds vs indice, identité, date, périodes et conservation après échec), audits des fiches et de complétude.
