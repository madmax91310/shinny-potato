# Priorités 1 et 2 — qualification du 7 octobre 2026

La collecte réelle a validé les quatre nouvelles compositions ci-dessous et les calendriers exacts WPEA et UBS. Elles utilisent les collecteurs planifiés existants, les 3 et 16 du mois. Les priorités ne sont pas entièrement closes : les sources encore bloquées figurent séparément.

| Donnée raccordée | Publication validée | Périmètre |
|---|---|---|
| S&P 500 | Amundi LU0496786574, 31/08/2026 | 503 titres, pays, secteurs complets et dix positions pondérées |
| S&P 500 Equal Weight | Amundi LU2991918421, 31/08/2026 | 503 titres, pays, secteurs complets et dix positions pondérées |
| STOXX Europe 600 | Amundi LU0908500753, 31/08/2026 | 600 titres, pays, secteurs complets et dix positions pondérées |
| EURO STOXX 50 | Amundi FR001400ZGP1, 30/09/2026 | 50 titres, pays, secteurs complets et dix positions pondérées |
| WPEA IE0002XZSHO1 | Fiche BlackRock, statistiques de performance au 31/08/2026 | Rendement de la part EUR 2025 : 6,61 %, net de frais ; la ligne indice 6,77 % est exclue |
| UBS World IE00BD4TXV59 | Fiche UBS / Swiss Fund Data, 31/08/2026 | Rendements de la part USD 2022–2025 : −18,26 %, 23,79 %, 18,86 %, 21,31 % ; indice, YTD et rendements glissants exclus |

Les fiches mensuelles Amundi sont demandées à une URL calculée pour la dernière fin de mois, puis pour le mois précédent si la publication n’est pas accessible. La date publiée doit correspondre au mois demandé et rester récente. Les données sont extraites uniquement des tables « données de l’indice », avec contrôle de l’ISIN, de la réplication et de l’indice exact. Les fonds physiques EURO STOXX 50 et STOXX 600 publient également ces tables explicitement consacrées à l’indice ; leur portefeuille ne sert pas de substitut.

Les compositions ne déterminent pas la convention de rendement : les fiches Amundi décrivent des variantes NET, tandis que les rendements S&P 500 TOTAL USD et STOXX PRICE EUR gardent leurs sources et conventions distinctes. Les snapshots historiques restent immuables, même lorsqu’une nouvelle observation certifie la même date. La façade courante utilise alors les poids et la provenance de la nouvelle observation.

Les pages iShares accessibles fournissent toujours leurs frais et encours indépendamment du PDF des performances. Un PDF indisponible conserve ces champs valides et signale l’échec du champ performance. Les calendriers courts sont collectés sans exiger six années ; ils ne remplacent pas les proxys nécessaires aux fenêtres complètes de simulation. SPEA ne publie encore aucune année civile complète : c’est une absence de publication, pas un échec du connecteur. Le connecteur Dow Jones Amundi déjà configuré a également été exécuté et ses frais, encours et calendriers exacts intégrés.

## Blocages conservés explicitement

| Donnée | État constaté | Condition pour la raccorder |
|---|---|---|
| Trois BNP : FR0011550185, FR0011550193, IE000QDFFK00 | Composants Fundsheet/Fundsearch HTTP 502 ; URL récurrente de publication actuelle non découverte | Une découverte officielle récurrente, puis validation des parts, devises et dates. Un UUID PDF trouvé par recherche ne suffit pas à garantir son renouvellement. |
| Russell 1000 et 2000, compositions | Fiches courantes accessibles, mais graphiques sectoriels sans table numérique complète et positions sans poids | Publication des poids de l’indice ; les poids d’un ETF ne sont pas une composition exacte de l’indice. |
| Deux Dividend Aristocrats, compositions | Les tables State Street accessibles décrivent le portefeuille du fonds | Publication explicite des poids de l’indice. Les calendriers NET existants continuent leur collecte. |
| S&P 500 Equal Weight, annuels TOTAL USD | Endpoint public de données S&P HTTP 400. PDF récurrent accessible mais explicitement « Price Return », même avec le paramètre TR ; benchmark Amundi NET | Source récurrente explicitement TOTAL USD. Aucune substitution PRICE, NET ou rendement RSP après frais. |
| WisdomTree, disponibilité | Les replis officiels PDF et l’indépendance des champs existent ; l’accès HTML demeure intermittent | Maintenir les réessais et le signal d’échec. Aucune disponibilité permanente n’est présumée. |

Les expositions actions de produits crypto, métaux ou monétaire sont non applicables ; les performances de référence crypto des fiches CoinShares ne sont pas celles des parts après frais ou staking. Les autres champs encore hors collecte restent listés dans [le rapport de couverture](automation-coverage.md).

Validation : collecte réelle des quatre indices, WPEA, SPEA, UBS et Dow Jones ; 128 tests Python ; audits des compositions et rendements, consommateurs courants et archives, et build de production.
