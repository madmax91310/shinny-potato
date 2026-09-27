# Reprise de l’audit Comparatif ETF et Comparateur d’indices — 27 septembre 2026

## Point de départ

Cette reprise prolonge `DATA-REVIEW-2026-09-24.md` et `DATA-ROADMAP-AUDIT.md` ; elle ne remplace pas leurs contrôles des rendements historiques, des croisements entre outils et de la provenance. Les données concernées sont les 16 thèmes du Comparatif ETF (Tweet Midi) et les familles du Comparateur d’indices, ainsi que le référentiel commun des frais et le PNG exporté.

## Corrections de cette reprise

| Domaine | Correction et pièce primaire |
| --- | --- |
| Monde PEA | Amundi DCAM n’est pas le seul MSCI World éligible : [CW8](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681043599/ENG/FRA/INSTITUTIONNEL/ETF/20260228) et [WPEA](https://www.ishares.com/ch/professionals/en/products/335178/ishares-msci-world-swap-pea-ucits-etf) existent. |
| S&P 500 PEA | Ajout de la part iShares SPEA, ISIN IE000DQLYVB9, TER 0,10 %, encours 54,66 M€ au 25/09/2026 : [BlackRock](https://www.blackrock.com/fr/intermediaries/products/342916/). Fonds lancé en mai 2025 ; aucune performance calendaire 2023–2025 ne lui a été attribuée. |
| Japon PEA | Ajout de la part TOPIX EUR Hedged FR0013411998, éligible PEA, TER 0,48 %, actif géré 150,05 M€ au 30/04/2026 : [Amundi](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013411998/FRA/FRA/INSTITUTIONNEL/ETF/20260430). Le TOPIX PEA sans couverture n’est donc pas un choix unique ; les performances historiques conservées sont celles de cette dernière part. La part Xtrackers LU1875395870 de Tweet Midi est distributive et couverte en euros : [DWS](https://etf.dws.com/download/asset/07d814c6-0032-4fc4-bc41-171c6dae90e4). |
| Ressources PEA | Ajout de l’Amundi Basic Resources LU1834983550, PEA, TER 0,30 %, actif géré 752,60 M€ au 30/06/2026 : [Amundi](https://www.amundietf.com/pdfDocuments/monthly-factsheet/LU1834983550/ENG/LUX/RETAIL/ETF/20260630). Basic Materials n’est pas l’unique option ressources en PEA. |
| Dividendes | Les aristocrates mondiaux et européens peuvent maintenir **ou** augmenter leur dividende pendant dix ans : [State Street Europe](https://www.ssga.com/fr/fr/individual/etfs/state-street-spdr-sp-euro-dividend-aristocrats-ucits-etf-dist-eudv-gy). EUDV n’est pas le seul ETF à dividendes en PEA : [Amundi MSCI EMU High Dividend](https://www.amundietf.fr/fr/particuliers/produits/equity/amundi-msci-emu-high-dividend-ucits-etf-dist/fr0010717090). |
| Composition des indices | STOXX Europe 600 comprend aussi moyennes et petites capitalisations ([STOXX](https://stoxx.com/index/sxxp/)); MSCI Europe comprend grandes et moyennes ([MSCI](https://www.msci.com/indexes/index/990500/msci-europe-index)); MSCI China comprend des actions A du continent ([MSCI](https://www.msci.com/indexes/index/302400/msci-china-index)); Nikkei 225 sélectionne selon liquidité et équilibre sectoriel ([Nikkei](https://indexes.nikkei.co.jp/en/nkave/index/profile)). Les formulations trop absolues sur le S&P 500 ont été corrigées. |
| ETF spatial | VanEck n’est plus le seul UCITS du secteur : [iShares Space Technologies](https://www.ishares.com/uk/individual/en/products/351117/ishares-space-technologies-ucits-etf) et [WisdomTree Space Economy](https://www.wisdomtree.eu/en-gb/etfs/thematic/wspc---wisdomtree-space-economy-ucits-etf---usd-acc) sont apparus en 2026. |
| Image du comparateur | Le PNG affichait PEA pour des fonds CTO quand la note disait « CTO, … » ; le marqueur CTO est maintenant reconnu dans toute la note. Vérification du texte dessiné sur toile simulée pour SPDR ACWI, iShares MSCI China et SPEA. |

## Résultats et portée

- `npm run build` et `npm run verify:tweet-midi` : succès, 3 751 variantes de publications, dont 16 thèmes Comparatif ETF.
- `npm run audit:etf-consistency` : 139 mentions, 106 ISIN distincts, 27 partagés ; aucune divergence de frais entre les trois bibliothèques.
- `npm run audit:performance-consistency` : 17 comparaisons par ISIN, aucune erreur ; un écart d’arrondi inférieur à 0,1 point. Les 16 parts propres au comparateur figurent dans la sortie détaillée du script.
- `npm run audit:etf-snapshots` : aucune divergence d’encours d’au moins 10 % dans la même devise ; deux observations en devises différentes.
- `npm run audit:etf-annual-performance` : 38 fiches, 28 séries complètes, aucune erreur de structure.

**Limite de preuve :** ces audits automatiques contrôlent des structures et des recoupements internes, pas la véracité externe de chaque montant, nombre de titres ou performance. Les encours non datés, les nombres de constituants et les affirmations de prix relatif évoluent ; les rafraîchir sur les fiches de l’émetteur à la date de publication. Les séries 2023–2025 recoupées dans la revue du 24 septembre restent documentées dans ce rapport antérieur. La ligne PCEU 2025 y mentionne 19,42 % sur une fiche d’août ; la valeur actuelle 19,41 % a ensuite été recoupée sur une fiche d’avril 2026 : les arrondis des documents divergent de 0,01 point.

Le test complet en navigateur réel n’a pas pu être exécuté dans cet environnement : Chromium Playwright absent et téléchargement du navigateur échoué. Le build, les audits et la vérification du texte dessiné sur toile simulée passent ; l’interface et le PNG devront être contrôlés dans un navigateur avant mise en production.
