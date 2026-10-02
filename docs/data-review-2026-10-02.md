# Revue du 2 octobre 2026

Base : master b676957, après intégration de la PR #199. La liste calculée au 02/10/2026 contient avant cette revue 33 éléments : 21 contrôles sans date, 9 réserves courtiers et 3 rappels d’échéance Saxo. Les 16 archives déjà identifiées restent distinctes.

## Résultat

16 contrôles clôturés : 13 séries de rendements de portefeuille, 2 séries du comparateur et le comptage historique TOPIX de juillet. Après reprise sur master 117cfe5 (PR #200 et #201 intégrées) et modification : **4 contrôles sans date, 9 réserves et 3 échéances**. Le MSCI World mensuel a été résolu séparément par la PR #200 pendant cette revue. Aucun statut d’archive ajouté pour réduire artificiellement la liste. Aucune réserve promue en confirmation ; aucune date rétroactive inventée.

Les observations numériques et empreintes SHA-256 des réponses téléchargées sont conservées dans `scripts/source-snapshots/data-review-2026-10-02.json`. L’audit de revue compare ces observations avec les champs réellement exposés par le catalogue. Les tableaux sont lus dans les PDF ou HTML, et le graphique DWS est examiné visuellement. Un hash identifie le document consulté ; il ne certifie pas à lui seul ses chiffres.

## Contrôles clôturés

| Entrée | Publication et portée du contrôle |
|---|---|
| CH0454664001, 21Shares Bitcoin ETP | [Slickcharts](https://www.slickcharts.com/currency/BTC/returns), six rendements BTC/USD 2020–2025. La simulation reste un proxy avant frais de l’ETP, pas un rendement de sa part. Page lue via recherche, téléchargement direct refusé (403). |
| LU1931975079, obligations entreprises EUR | [Amundi août](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1931975079/FRA/FRA/INSTITUTIONNEL/ETF/20260831), ligne Portefeuille 2020–2025 EUR. Ancien lien mars 404. |
| LU1437018838, immobilier Acc | [Amundi août](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1437018838/FRA/FRA/INSTITUTIONNEL/ETF/20260831), tableau commun aux parts C/D en EUR, revenus réinvestis. Ancien lien décembre 404. |
| LU1737652823, immobilier Dist | [Amundi août, ISIN D](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1737652823/FRA/FRA/INSTITUTIONNEL/ETF/20260831). La même publication identifie expressément les deux parts et leur tableau commun. Le lien de la part Dist est désormais individuel. |
| FR0010755611, MSCI USA levier 2 | [Amundi août](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0010755611/FRA/FRA/INSTITUTIONNEL/ETF/20260831), ligne Portefeuille EUR. Ancien lien décembre 404. |
| LU1681043599, MSCI World | [Amundi août](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681043599/FRA/FRA/INSTITUTIONNEL/ETF/20260831), six rendements EUR. |
| FR0010342592, Nasdaq levier 2 | [Amundi août](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0010342592/FRA/FRA/INSTITUTIONNEL/ETF/20260831), ligne Portefeuille EUR. Ancien lien mars 404. |
| IE000RDRMSD1, Blockchain | [BlackRock](https://www.ishares.com/gls-download/literature/fact-sheet/blkc-ishares-blockchain-technology-ucits-etf-fund-fact-sheet-en-gb.pdf), Share Class USD 2023–2025 ; années antérieures complètes absentes, null conservés. |
| IE00BKPX3K41, Far East Acc | [BlackRock Acc](https://www.ishares.com/gls-download/literature/fact-sheet/iffi-ishares-msci-ac-far-east-ex-japan-ucits-etf-fund-fact-sheet-en-gb.pdf), 2021–2025 USD ; [part distribuante](https://www.ishares.com/uk/professionals/en/products/251848/ishares-msci-ac-far-east-ex-japan-ucits-etf) pour le proxy 2020 (+25,1 %). Lancement Acc en 2020, première année complète en 2021. |
| IE000I8KRLL9, Semiconductors | [BlackRock](https://www.ishares.com/uk/individual/en/literature/fact-sheet/semi-ishares-msci-global-semiconductors-ucits-etf-fund-fact-sheet-en-gb.pdf), Share Class USD 2022–2025 ; null antérieurs conservés. |
| IE00BJ5JP097, Financials Dist | [BlackRock](https://www.ishares.com/uk/individual/en/products/308836/ishares-msci-world-financials-sector-advanced-ucits-etf), Total Return USD 2022–2025 ; null antérieurs conservés. |
| IE00BYTRR863, Energy | [State Street, Amsterdam](https://www.ssga.com/ie/en_gb/institutional/etfs/state-street-spdr-msci-world-energy-ucits-etf-wnrg-na), Fund Net USD, six rendements concordants. L’ancien lien WRDE affiche une page générale sans tableau : nouvelle URL dans les deux registres. |
| IE000YYE6WK5, Defense | [VanEck](https://www.vaneck.com/fr/fr/dfns-supporting-doc.pdf), NAV nette USD 2024–2025. Années antérieures non complètes conservées null. |
| IE00B5M1WJ87, Euro Dividend Aristocrats | [State Street](https://www.ssga.com/uk/en_gb/intermediary/etfs/state-street-spdr-sp-euro-dividend-aristocrats-ucits-etf-dist-spyw-gy), Fund Net EUR 2023–2025 : 18,39 / 8,55 / 20,06 %. |
| LU2196470426, Nikkei | [DWS](https://etf.dws.com/Download/Past%20Performance/LU2196470426/FR/FR), graphique de la part 1C JPY : 30,5 / 20,9 / 28,2 %. Lecture visuelle des barres du fonds, distinctes du benchmark. |
| TOPIX juillet 2026 | [Amundi en anglais](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013411998/ENG/FRA/INSTITUTIONNEL/ETF/20260731), section Benchmark index composition : 1 637 valeurs. Le lien en français est 404 ; l’anglais fournit bien le benchmark à la date recherchée. |

Tous les chiffres ci-dessus restent inchangés : la recherche complète leurs preuves, leur devise et leur date de contrôle. Les sources courantes ne datent pas rétroactivement les photographies d’indices.

## MSCI World mensuel résolu séparément

La PR #200 intégrée pendant cette intervention remplace la série composite par 141 fins de mois MSCI officielles GRTR USD de janvier 2015 à septembre 2026, avec recoupement des dernières séances et des rendements annuels. Le DCA est réactivé par cette PR. Le registre de revue contient désormais son contrôle au 02/10/2026 ; il ne reste pas une tâche ouverte. Voir `scripts/MONTHLY-UPDATE-2026-10-02.md` et `calculator-msci-world-2026-10-02.json`.

## Quatre contrôles non clôturés

| Entrée | Recherche et limite | Preuve encore nécessaire |
|---|---|---|
| MSCI World, archive 1 283 titres | Recherche ciblée : anciennes occurrences juin 2026 dans les résultats, mais [page MSCI](https://www.msci.com/indexes/index/990100) ouverte désormais au 30/09/2026 avec 1 249 titres. Le PDF téléchargé est celui d’août. | Document récupérable qui rattache le comptage historique à une date précise. Un extrait de recherche ne suffit pas. |
| MSCI ACWI, archive juin–juillet | PDF MSCI récupéré, daté août : 2 458 titres. Aucune publication récupérée pour la photographie héritée à date incertaine. | Publication historique exacte ; conserver sa date inconnue en attendant. |
| MSCI China juillet, 576 titres | [Page MSCI](https://www.msci.com/indexes/index/302400/msci-china-index) ouverte : 576 au 30/09/2026. L’égalité avec juillet ne certifie pas juillet. Recherches ciblées sans publication historique exploitable. | Fiche ou archive officielle datée juillet. |
| TOPIX avril, 1 650 titres et répartitions | Fiche avril testée en français/anglais et segments retail/institutionnel : liens 404. Fiches juillet et août récupérées, mais leurs comptages (1 637 / 1 636) ne prouvent pas avril ni ses poids sectoriels. | Fiche avril complète, y compris secteurs et positions. |

## Neuf réserves courtiers

Revue renouvelée au 02/10/2026. Les exigences de preuve existantes sont maintenues. Aucun contact ni message envoyé aux courtiers.

| Réserve | Nouvelle recherche et limite persistante |
|---|---|
| Bourse Direct, cash CTO | CG mars 2024 ouvertes via recherche (téléchargement 502) ; recherches de clause de rémunération, page CTO indisponible lors de cette tentative. Pas de clause récupérée excluant explicitement la rémunération de tous les soldes CTO. |
| BoursoBank, cash CTO | CG officielles téléchargées et relues : clauses PEA/PEA-PME explicites, dispositions CTO ne tranchant pas. La présence de livrets séparés et le silence du contrat ne suffisent pas. |
| CA Île-de-France, cash CTO | Convention régionale téléchargée, page régionale CTO relue et recherche de rémunération : absence de condition régionale explicitement applicable à ce solde. |
| Fortuneo, cash CTO | CG et tarifs téléchargés. La clause non rémunérée se situe dans le PEA/PEA-PME ; le CTO reste sans exclusion explicite. |
| Fortuneo, DCA PEA | CG, tarifs et page Ordres Intelligents relus. Préordres et déclenchements conditionnels décrits ; aucune preuve explicite sur les achats périodiques automatiques PEA. |
| IBKR, DCA PEA | Page officielle des recurring investments et guide téléchargés : parcours générique, fractions. Pas de confirmation d’un mode PEA en titres entiers ; divergence des sources externes déjà conservée. |
| IBKR, PEA Jeune | Page PEA officielle ouverte : résident français, 18 ans minimum. Avenant IBIE téléchargé : plafond de 20 000 € pour un majeur rattaché. Le lien officiel du parcours conduit à la connexion et ne prouve pas l’acceptation de ce profil. |
| IBKR, PEA-PME | Page PEA et avenant relus : mention juridique du PEA-PME sans preuve de l’offre d’une enveloppe distincte. |
| Trade Republic, PEA-PME | Contrat France téléchargé et recherché ; aucune mention probante d’une enveloppe PEA-PME distincte. Page promotionnelle PEA indisponible (404) lors de cette tentative. |

Pour lever ces réserves : FAQ/contrat explicite ou réponse écrite du courtier couvrant l’enveloppe concernée. Une impossibilité d’accès ne confirme ni un « oui » ni un « non ».

## Rappels Saxo

Les trois échéances enregistrées au 31/12/2026 restent des rappels futurs, pas des données manquantes. Elles restent visibles jusqu’à leur réexamen à échéance ; aucune prolongation présumée.

## Validation effectuée

Build de production et lint réussis (trois avertissements lint préexistants). Audits data-review, data-provenance, broker-evidence, index-facts, etf-annual-performance, portfolio-provenance, performance-consistency, data-catalog et calculator-series réussis. Les générateurs continuent à exposer les mêmes rendements, les proxys identifiés et les blocages DCA existants. Aucune fusion ou mise en ligne effectuée dans cette revue.
