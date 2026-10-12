# Sources des régressions

Extraits des réponses officielles BlackRock get-product-data récupérées le 12/10/2026, portfolioId 328618 (USD, IE000RDRMSD1) et 251726 (EUR, IE00B3F81R35). Les métadonnées d'affichage et les grandes tables non utilisées ont été retirées ; valeurs, dates et classifications conservées. signed-holdings-evidence.json contient les lignes liquidités/dérivés correspondantes, les sommes complètes et l'empreinte des réponses capturées.

coinshares-fees.json est l'extrait du widget public ISIN_KEYSTATS_GB00BLD4ZL17 récupéré le 12/10/2026 via la configuration de https://coinshares.com/etp/physical-bitcoin/. Seuls l'ISIN, rateDate et managementFee sont conservés. Les modifications de cette fixture pour les tests de rejet et pour le cas Ethereum sont des scénarios synthétiques explicitement construits dans le test.

dws-industrials.json est l'extrait de https://etf.dws.com/api/pdp/en-gb/etf/IE00BM67HV82/holdings téléchargé le 12/10/2026, daté du 07/10/2026. Les colonnes et valeurs officielles sont conservées, les métadonnées d'affichage sont retirées. Il comprend la ligne Mutual Fund IE00BYQNZ507 qui bloquait la validation globale.
