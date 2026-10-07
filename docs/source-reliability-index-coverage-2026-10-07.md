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
| WisdomTree, disponibilité | Les replis officiels PDF et l’indépendance des champs existent ; l’accès HTML demeure intermittent | Maintenir les réessais et le signal d’échec. Aucune disponibilité permanente n’est présumée. |

Les expositions actions de produits crypto, métaux ou monétaire sont non applicables ; les performances de référence crypto des fiches CoinShares ne sont pas celles des parts après frais ou staking. Les autres champs encore hors collecte restent listés dans [le rapport de couverture](automation-coverage.md).

Validation : collecte réelle des quatre indices, WPEA, SPEA, UBS et Dow Jones ; 128 tests Python ; audits des compositions et rendements, consommateurs courants et archives, et build de production.

## Nouvelle vérification après la PR 326

Cette passe raccorde les annuels S&P 500 Equal Weight TOTAL USD : 46 séries annuelles d’indices sont désormais automatisées. Les priorités 1 et 2 restent ouvertes pour les trois BNP et les quatre compositions restantes.

- BNP : la page produit officielle en anglais Luxembourg est accessible, mais son HTML ne contient que la configuration de Fundsheet. Le composant JavaScript publié par cette page renvoie toujours HTTP 502, avec et sans le paramètre de version. Les données d'un extrait de moteur de recherche ne constituent pas une source récurrente pour le collecteur.
- S&P 500 Equal Weight TOTAL USD : le téléchargement direct AEM de la fiche Invesco RSP fonctionne avec le suffixe `.pdf.coredownload.inline.pdf`. La collecte réelle valide SPXEWTR, USD et la ligne « Underlying index » : 2020–2025, respectivement 12,83 %, 29,63 %, −11,45 %, 13,87 %, 13,01 %, 11,43 %. La publication trimestrielle du 30 juin 2026 conserve sa date, avec une limite de fraîcheur de 130 jours. L’identité RSP/CUSIP, la convention TOTAL USD, les colonnes annuelles et la présence de six années closes sont contrôlées ; les lignes fonds, prix de marché, benchmark S&P 500 classique et périodes glissantes sont exclues. L’URL courante est relue par le workflow existant les 3 et 16 du mois.
- Russell 2000 : nouvelle récupération du PDF récurrent `US2000USD`, édition du 31 août 2026. Les dix noms de constituants sont publiés sans poids numériques ; le graphique sectoriel ne fournit pas de table numérique dans le texte extrait. Il ne permet donc pas de remplacer la composition pondérée actuelle. Les compositions Russell 1000 et Dividend Aristocrats restent non qualifiées.

Le correctif WisdomTree conserve désormais les frais, encours et répartitions HTML validés lorsqu'un PDF est rejeté (identité, date, contenu ou disposition). Un défaut des tableaux de répartition PDF conserve les frais et calendriers PDF déjà validés ; les répartitions rejetées ne sont jamais appliquées. Les erreurs de champ restent transmises au rapport de collecte et au statut d'échec du workflow. Une mauvaise identité HTML ou PDF, lorsqu'il n'existe aucune source indépendante valide, continue de faire échouer la collecte.

Validation de cette passe : collecte réelle Invesco et WisdomTree ; 140 tests Python, dont les rejets de PDF erroné et de répartition incomplète ; audits des indices, performances ETF, revue et catalogue des données ; build de production.

## Poursuite après la PR 330 — Russell 2000

La composition exacte Russell 2000 est raccordée à la fiche mensuelle Amundi LU1681038672, explicitement intitulée « Données de l’indice ». La collecte réelle du 7 octobre valide l’édition du 31 août 2026 : 1 953 titres, pays complets, onze secteurs totalisant 99,85 % et dix positions pondérées (3,15 % après arrondis individuels ; total publié 3,16 %). La publication de septembre renvoie HTTP 404 ; le repli contrôlé vers août conserve sa date réelle. Chaque exécution demande la dernière fin de mois, puis la précédente.

Source validée : https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681038672/FRA/FRA/INSTITUTIONNEL/ETF/20260831

L’ISIN, la réplication synthétique, la mention Russell 2000 et le symbole RU20N30U sont vérifiés. Seuls les tableaux d’indice sont lus. La convention NET de cette fiche ne remplace pas les rendements TOTAL USD FTSE Russell déjà collectés. Composition et rendements échouent indépendamment, et chaque champ conserve sa provenance. La couverture passe à 39 compositions ; restent trois BNP et trois compositions (Russell 1000 et deux Dividend Aristocrats).

La nouvelle récupération du composant Fundsheet BNP renvoie encore HTTP 502. La page S&P Euro High Yield Dividend Aristocrats est accessible mais ses poids sont chargés par un composant séparé ; l’endpoint public utilisé par cette page renvoie HTTP 400, puis HTTP 403 lors du réessai de cette vérification. Le Global doit être la variante Quality Income exacte, jamais Screened ni Blend. Ces sources restent hors collecte tant que les publications complètes, datées et renouvelables ne sont pas qualifiées.

Validation de la poursuite : collecte réelle Russell 2000 sans exception ; 35 tests Python ciblés (extensions et documents d’indices, fusion des observations et rafraîchissement émetteurs), audits index-facts/index-completeness/data-review/data-catalog et build de production réussis.
