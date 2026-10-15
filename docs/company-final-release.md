# Réception finale du parcours de valorisation — 15 octobre 2026

## Périmètre livré

112 dossiers qualifiés complets sur 125 actifs : 60 dossiers initiaux, 50 entreprises supplémentaires et deux dossiers historiques complétés (Adobe et Nike). Le seuil bloquant de livraison et de surveillance passe à 110. Les 13 dossiers historiques partiels ne sont pas comptés dans ce seuil ; leurs limites sont visibles dans la fiche.

Les objectifs conditionnels à 1/3/5 ans, trois scénarios, hypothèses modifiables, lecture inverse, sensibilités, reverse DCF et exports de la PR 616 sont conservés. Le squelette des textes et le dessin des images ne changent pas. Les nouvelles fiches ont une activité et un point de vigilance propres à l’entreprise.

## Ajouts qualifiés

| Entreprise | Symbole | Domaine |
|---|---|---|
| Accenture | ACN | Logiciels et services |
| Autodesk | ADSK | Logiciels et services |
| Cadence | CDNS | Logiciels et services |
| Synopsys | SNPS | Logiciels et services |
| Cognizant | CTSH | Logiciels et services |
| Fair Isaac | FICO | Logiciels et services |
| Akamai | AKAM | Logiciels et services |
| Verisign | VRSN | Logiciels et services |
| Tyler Technologies | TYL | Logiciels et services |
| Paycom | PAYC | Logiciels et services |
| Broadridge | BR | Logiciels et services |
| Eaton | ETN | Industrie |
| AMETEK | AME | Industrie |
| Grainger | GWW | Industrie |
| Expeditors | EXPD | Industrie |
| Wabtec | WAB | Industrie |
| Quanta Services | PWR | Industrie |
| Cummins | CMI | Industrie |
| Otis | OTIS | Industrie |
| Carrier | CARR | Industrie |
| Trane Technologies | TT | Industrie |
| Xylem | XYL | Industrie |
| Lennox | LII | Industrie |
| Regeneron | REGN | Santé |
| Vertex | VRTX | Santé |
| IDEXX | IDXX | Santé |
| Zoetis | ZTS | Santé |
| Edwards Lifesciences | EW | Santé |
| Boston Scientific | BSX | Santé |
| Agilent | A | Santé |
| Mettler-Toledo | MTD | Santé |
| Lululemon | LULU | Consommation |
| D.R. Horton | DHI | Consommation |
| AutoZone | AZO | Consommation |
| Yum! Brands | YUM | Consommation |
| Domino’s Pizza | DPZ | Consommation |
| Pool Corporation | POOL | Consommation |
| Ulta Beauty | ULTA | Consommation |
| eBay | EBAY | Consommation |
| Garmin | GRMN | Consommation |
| PPG Industries | PPG | Matériaux et équipements |
| Ecolab | ECL | Matériaux et équipements |
| Linde | LIN | Matériaux et équipements |
| Nucor | NUE | Matériaux et équipements |
| Vulcan Materials | VMC | Matériaux et équipements |
| Martin Marietta | MLM | Matériaux et équipements |
| Avery Dennison | AVY | Matériaux et équipements |
| Monolithic Power Systems | MPWR | Semi-conducteurs |
| Skyworks | SWKS | Semi-conducteurs |
| Teradyne | TER | Semi-conducteurs |

## Collecte et réception

- Les nouvelles entreprises utilisent la collecte SEC avec repli annuel standardisé explicite, cours de clôture Yahoo, prévisions ajustées sourcées et vérification de toute la fenêtre des fractionnements. Les contrôles ne sont pas assouplis.
- Adobe, Nike et Booking disposent d’un complément annuel renouvelable Stock Analysis / S&P Global. Il est accepté seulement si les chiffres annuels et les exercices comparatifs se rapprochent exactement des comptes de l’émetteur. Les comptes primaires et les dates trimestrielles ne sont pas remplacés ; un ancien bilan ne reçoit jamais une nouvelle date de vérification.
- Le complément complète Adobe et Nike. Booking conserve une restriction FCF liée à la certification du retraitement de son fractionnement.
- Le workflow publie les sociétés affectées, les données manquantes et les erreurs de collecte dans son résumé. Une perte du minimum de 110 est signalée après conservation des observations valides.
- `node scripts/qualify-company-universe.mjs --minimum=110` contrôle la réception. `node scripts/test-company-release.mjs` vérifie toutes les publications des dossiers qualifiés, tous les horizons, scénarios et modèles, le rapprochement graphique/prix/texte, les hypothèses personnalisées et le refus des sources absentes ou périmées.

## Limites historiques examinées

| Dossier | Données restant à qualifier |
|---|---|
| Alphabet | nombre moyen d’actions diluées sur quatre exercices ; FCF par action comparable |
| Amazon | FCF par action comparable |
| LVMH | investissements sur quatre exercices ; flux de trésorerie disponible sur quatre exercices ; nombre moyen d’actions diluées sur quatre exercices ; FCF par action comparable ; BPA prévisionnel et PER ajustés sourcés ; méthode de valorisation adaptée |
| Air Liquide | composantes annuelles ; flux de trésorerie d’exploitation sur quatre exercices ; investissements sur quatre exercices ; flux de trésorerie disponible sur quatre exercices ; nombre moyen d’actions diluées sur quatre exercices ; PER publié comparable ; FCF par action comparable ; BPA prévisionnel et PER ajustés sourcés ; méthode de valorisation adaptée |
| Schneider Electric | nombre moyen d’actions diluées sur quatre exercices ; FCF par action comparable ; BPA prévisionnel et PER ajustés sourcés ; méthode de valorisation adaptée |
| TotalEnergies | nombre moyen d’actions diluées sur quatre exercices ; FCF par action comparable ; BPA prévisionnel et PER ajustés sourcés ; méthode de valorisation adaptée |
| Visa | quatre exercices comparables ; composantes annuelles ; flux de trésorerie d’exploitation sur quatre exercices ; investissements sur quatre exercices ; flux de trésorerie disponible sur quatre exercices ; nombre moyen d’actions diluées sur quatre exercices ; FCF par action comparable |
| Meta | quatre exercices comparables ; composantes annuelles ; flux de trésorerie d’exploitation sur quatre exercices ; investissements sur quatre exercices ; flux de trésorerie disponible sur quatre exercices ; nombre moyen d’actions diluées sur quatre exercices ; FCF par action comparable |
| ServiceNow | FCF par action comparable |
| Walmart | FCF par action comparable |
| Netflix | FCF par action comparable |
| Booking Holdings | FCF par action comparable |
| Deere | quatre exercices comparables ; composantes annuelles ; flux de trésorerie d’exploitation sur quatre exercices ; investissements sur quatre exercices ; flux de trésorerie disponible sur quatre exercices ; nombre moyen d’actions diluées sur quatre exercices ; FCF par action comparable |

Les comptes trimestriels, bilans, estimations et historiques de fractionnements absents ne sont pas inventés. Un modèle FCF après intérêts ne déduit pas une seconde fois la dette. Les prévisions restent conditionnelles, sans probabilité attribuée aux scénarios.

## Vérifications locales

- 108 tests Python réussis, dont rapprochement intersources, refus des contradictions et conservation des dates d’origine.
- 1 971 publications de valorisation vérifiées sur les 112 dossiers complets.
- Tests existants des comptes, de la couverture, des modèles et du calcul inverse réussis.
- Compilation et budgets JavaScript inchangés vérifiés.
- La réception navigateur et GitHub est consignée dans la PR de livraison ; ne pas déduire un déploiement réussi de ce document seul.
