# Audit des tickers et cotations du 30 septembre 2026

53 ISIN, 58 couples ISIN/ticker publiés, 142 cotations documentées. Tous les tickers des fiches ETF et du comparateur sont couverts, y compris les valeurs de repli dans instruments.js. Les ISIN sans ticker ne sont pas complétés arbitrairement.

## Corrections

| ISIN | Avant | Après | Preuve |
| --- | --- | --- | --- |
| IE00B66F4759 | IHYA / EHYA | IHYG | Tableau Listings BlackRock : IHYG, Londres, EUR ; également Milan EUR et SIX CHF |
| IE000YYE6WK5 | DFNS / DFND | DFNS / DFEN | Fiche VanEck : DFEN, Deutsche Börse, EUR |
| IE00BP3QZB59 | IWVL / WVAL | IWVL / IWFV | Tableau Listings BlackRock : IWFV, Londres, GBP |

## Registre et portée

Le registre src/data/instrument-listings.js conserve chaque tuple ticker/place/MIC/devise avec sourceUrl, checkedAt et evidenceId. Le relevé scripts/source-snapshots/instrument-listings-2026-09-30.json conserve les lignes ou cellules extraites des tableaux officiels. Plusieurs cotations vérifiées peuvent porter le même ticker ; la liste ne prétend pas être exhaustive. Le domicile et la réplication restent dans location : ce champ n'est pas une place de cotation.

La devise est celle de négociation, sans déduction à partir de la devise du fonds. Pour ETZ, PSP5 et GPEA, Borsa Italiana confirme ticker/ISIN/MIC XPAR, et le tableau public Euronext getDetailedQuoteFactsheets confirme explicitement Trading Currency EUR. Les pages Euronext principales chargent ce tableau séparément. Les anciennes fiches Amundi PSP5 indexées renvoient désormais 404 : elles ne servent pas de preuve principale. Les suppléments L&G datent du 19 septembre 2025 ; leur date documentaire reste distincte du contrôle du 30 septembre 2026.

Le contrôle automatique examine les tickers du catalogue et ceux effectivement affichés dans les outils. Il refuse les absences de preuve, les incohérences ISIN/ticker/place/devise, les domaines non officiels, les dates invalides, futures ou de contrôle dépassant 180 jours, les preuves orphelines et les doublons. Il contrôle les preuves conservées hors réseau ; il ne constitue pas une nouvelle revue des sites à chaque exécution. Une revue humaine doit actualiser les preuves lors d'un changement de cotation.

Il est appelé par les audits du catalogue et du contenu publiable, et par la CI avant le build. Dix mutations invalides sont testées séparément.

## Couverture

Le tableau présente une cotation documentée par ticker. Les autres lignes et devises sont conservées dans le registre.

| ISIN | Tickers publiés | Cotation documentée | Source officielle |
| --- | --- | --- | --- |
| FR0010527275 | WAT | WAT : Euronext Paris, EUR | [Source](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0010527275/FRA/FRA/INSTITUTIONNEL/ETF) |
| FR0011440478 | PLEM | PLEM : Euronext Paris, EUR | [Source](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0011440478/FRA/FRA/INSTITUTIONNEL/ETF) |
| FR0011550193 | ETZ | ETZ : Euronext Paris, EUR | [Source](https://www.borsaitaliana.it/borsa/etf/scheda/FR0011550193-XPAR.html) |
| FR0011869320 | PINR | PINR : Euronext Paris, EUR | [Source](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0011869320/FRA/FRA/INSTITUTIONNEL/ETF) |
| FR0011871110 | PUST | PUST : Euronext Paris, EUR | [Source](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0011871110/FRA/FRA/INSTITUTIONNEL/ETF) |
| FR0011871128 | PSP5 | PSP5 : Euronext Paris, EUR | [Source](https://www.borsaitaliana.it/borsa/etf/scheda/FR0011871128-XPAR.html) |
| FR0013411998 | PTPXH | PTPXH : Euronext Paris, EUR | [Source](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013411998/FRA/FRA/INSTITUTIONNEL/ETF) |
| FR0013412004 | PALAT | PALAT : Euronext Paris, EUR | [Source](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013412004/FRA/FRA/INSTITUTIONNEL/ETF) |
| FR0013412012 | PAASI | PAASI : Euronext Paris, EUR | [Source](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013412012/FRA/FRA/INSTITUTIONNEL/ETF) |
| FR0013412020 | PAEEM | PAEEM : Euronext Paris, EUR | [Source](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013412020/FRA/FRA/INSTITUTIONNEL/ETF) |
| FR0013412038 | PCEU | PCEU : Euronext Paris, EUR | [Source](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013412038/FRA/FRA/INSTITUTIONNEL/ETF) |
| FR001400U5Q4 | DCAM | DCAM : Euronext Paris, EUR | [Source](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR001400U5Q4/FRA/FRA/INSTITUTIONNEL/ETF) |
| FR0014017NX3 | GPEA | GPEA : Euronext Paris, EUR | [Source](https://www.borsaitaliana.it/borsa/etf/scheda/FR0014017NX3-XPAR.html) |
| GB00BLD4ZL17 | BITC | BITC : Euronext Paris, EUR | [Source](https://coinshares.com/etp/physical-bitcoin/) |
| IE0002XZSHO1 | WPEA | WPEA : Euronext Paris, EUR | [Source](https://www.ishares.com/ch/professionals/en/products/335178/?switchLocale=Y) |
| IE0006WW1TQ4 | EXUS | EXUS : Borsa Italiana, EUR | [Source](https://etf.dws.com/download/asset/82292b8e-bf9e-44f2-b20d-722c743110a3) |
| IE0007Y8Y157 | QUTM / QNTM | QUTM : Xetra, EUR<br>QNTM : Borsa Italiana, EUR | [Source](https://www.vaneck.com/uk/en/library/fact-sheets/qntm-fact-sheet.pdf) |
| IE000DQLYVB9 | SPEA | SPEA : Euronext Paris, EUR | [Source](https://www.ishares.com/ch/professionals/en/products/342916/?switchLocale=Y) |
| IE000I8KRLL9 | SEMI | SEMI : Euronext Amsterdam, USD | [Source](https://www.ishares.com/uk/individual/en/products/319084/?siteEntryPassthrough=true&switchLocale=y) |
| IE000M7V94E1 | NUKL | NUKL : Xetra, EUR | [Source](https://www.vaneck.com/fr/fr/library/fact-sheets/nucl-fact-sheet.pdf) |
| IE000RDRMSD1 | BLKC | BLKC : Euronext Amsterdam, USD | [Source](https://www.ishares.com/uk/individual/en/products/328618/?siteEntryPassthrough=true&switchLocale=y) |
| IE000YU9K6K2 | JEDI | JEDI : Borsa Italiana, EUR | [Source](https://www.vaneck.com/fr/en/library/fact-sheets/jedi-fact-sheet) |
| IE000YYE6WK5 | DFNS / DFEN | DFNS : Euronext Paris, EUR<br>DFEN : Xetra, EUR | [Source](https://www.vaneck.com/uk/en/library/fact-sheets/dfns-fact-sheet.pdf) |
| IE00B1FZS350 | IWDP | IWDP : Euronext Amsterdam, EUR | [Source](https://www.ishares.com/uk/individual/en/products/251801/ishares-developed-markets-property-yield-ucits-etf) |
| IE00B3F81R35 | IEAC | IEAC : Euronext Amsterdam, EUR | [Source](https://www.ishares.com/uk/individual/en/products/251726/?siteEntryPassthrough=true&switchLocale=y) |
| IE00B4L5Y983 | SWDA | SWDA : Borsa Italiana, EUR | [Source](https://www.ishares.com/uk/individual/en/products/251882/?siteEntryPassthrough=true&switchLocale=y) |
| IE00B4ND3602 | SGLN / IGLN | SGLN : Borsa Italiana, EUR<br>IGLN : London Stock Exchange, USD | [Source](https://www.ishares.com/uk/individual/en/products/258441/?siteEntryPassthrough=true&switchLocale=y) |
| IE00B4WXJJ64 | SEGA | SEGA : Borsa Italiana, EUR | [Source](https://www.ishares.com/uk/individual/en/products/251740/?siteEntryPassthrough=true&switchLocale=y) |
| IE00B5M1WJ87 | EUDV | EUDV : Euronext Paris, EUR | [Source](https://www.ssga.com/fr/en_gb/institutional/etfs/state-street-spdr-sp-euro-dividend-aristocrats-ucits-etf-dist-spyw-gy) |
| IE00B66F4759 | IHYG | IHYG : Borsa Italiana, EUR | [Source](https://www.ishares.com/uk/individual/en/products/251843/?siteEntryPassthrough=true&switchLocale=y) |
| IE00B6R52259 | SSAC | SSAC : Euronext Amsterdam, EUR | [Source](https://www.ishares.com/uk/individual/en/products/251850/?siteEntryPassthrough=true&switchLocale=y) |
| IE00B6YX5D40 | USDV | USDV : Borsa Italiana, EUR | [Source](https://www.ssga.com/ie/en_gb/institutional/etfs/state-street-spdr-sp-us-dividend-aristocrats-ucits-etf-dist-spyd-gy) |
| IE00B8FHGS14 | MVOL | MVOL : Borsa Italiana, EUR | [Source](https://www.ishares.com/uk/individual/en/products/251382/?siteEntryPassthrough=true&switchLocale=y) |
| IE00BF0M2Z96 | BATT | BATT : Borsa Italiana, EUR | [Source](https://www.borsaitaliana.it/CAETF/2025-92213-SUPPLEMENTS-6c5bd598-b83f-40ba-925d-a07046bf4e10.pdf) |
| IE00BF3N7094 | HIGH | HIGH : Euronext Amsterdam, EUR | [Source](https://www.ishares.com/uk/individual/en/products/290618/?siteEntryPassthrough=true&switchLocale=y) |
| IE00BF4RFH31 | WSML | WSML : London Stock Exchange, USD | [Source](https://www.ishares.com/uk/individual/en/products/296576/?siteEntryPassthrough=true&switchLocale=y) |
| IE00BFZPF546 | EMGA | EMGA : Euronext Paris, EUR | [Source](https://www.ishares.com/uk/individual/en/products/297676/?siteEntryPassthrough=true&switchLocale=y) |
| IE00BJ5JNY98 | WITS | WITS : Borsa Italiana, EUR | [Source](https://www.ishares.com/uk/individual/en/products/308858/?siteEntryPassthrough=true&switchLocale=y) |
| IE00BJ5JP097 | WFNS | WFNS : Euronext Amsterdam, USD | [Source](https://www.ishares.com/uk/individual/en/products/308836/ishares-msci-world-financials-sector-advanced-ucits-etf) |
| IE00BK5BCD43 | AIAI | AIAI : Borsa Italiana, EUR | [Source](https://www.borsaitaliana.it/CAETF/2025-92212-SUPPLEMENTS-ec3a89e8-685a-41c4-9208-0d21cd7b5f21.pdf) |
| IE00BK5BQT80 | VWCE | VWCE : Euronext Amsterdam, EUR | [Source](https://www.vanguard.co.uk/professional/product/etf/equity/9679/ftse-all-world-ucits) |
| IE00BKM4GZ66 | EMIM | EMIM : Euronext Amsterdam, EUR | [Source](https://www.ishares.com/uk/individual/en/products/264659/?siteEntryPassthrough=true&switchLocale=y) |
| IE00BM8R0J59 | QYLE | QYLE : Xetra, EUR | [Source](https://globalxetfs.eu/funds/qyld) |
| IE00BP3QZ601 | IWQU / IWFQ | IWQU : Borsa Italiana, EUR<br>IWFQ : London Stock Exchange, GBP | [Source](https://www.ishares.com/uk/individual/en/products/270054/?siteEntryPassthrough=true&switchLocale=y) |
| IE00BP3QZ825 | IWMO | IWMO : Borsa Italiana, EUR | [Source](https://www.ishares.com/uk/individual/en/products/270051/?siteEntryPassthrough=true&switchLocale=y) |
| IE00BP3QZB59 | IWVL / IWFV | IWVL : Borsa Italiana, EUR<br>IWFV : London Stock Exchange, GBP | [Source](https://www.ishares.com/uk/individual/en/products/270048/ishares-msci-world-value-factor-ucits-etf) |
| IE00BYPLS672 | ISPY | ISPY : Borsa Italiana, EUR | [Source](https://www.borsaitaliana.it/CAETF/2025-92214-SUPPLEMENTS-650e8c0e-ea76-4490-ad4e-32661d4a6888.pdf) |
| IE00BYTRR863 | WNRG | WNRG : Euronext Amsterdam, EUR | [Source](https://www.ssga.com/ie/en_gb/institutional/etfs/state-street-spdr-msci-world-energy-ucits-etf-wnrg-na) |
| IE00BYXG2H39 | BTEC | BTEC : London Stock Exchange, USD | [Source](https://www.ishares.com/uk/individual/en/products/291450/?siteEntryPassthrough=true&switchLocale=y) |
| IE00BYZK4552 | RBOT | RBOT : Borsa Italiana, EUR | [Source](https://www.ishares.com/uk/individual/en/products/284219/?siteEntryPassthrough=true&switchLocale=y) |
| LU1681043599 | CW8 | CW8 : Euronext Paris, EUR | [Source](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681043599/FRA/FRA/INSTITUTIONNEL/ETF) |
| LU1681047236 | C50 | C50 : Euronext Paris, EUR | [Source](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681047236/FRA/FRA/INSTITUTIONNEL/ETF) |
| LU1681048630 | GLUX | GLUX : Euronext Paris, EUR | [Source](https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681048630/FRA/FRA/INSTITUTIONNEL/ETF) |

## Validation

Audits cotations, catalogue, contenu publiable, cohérence ETF, snapshots ETF, performances annuelles ETF, cohérence des performances et inventaire des sources : réussis. Vérifications Tweet Midi et Fiches indices : réussies. Build : réussi. Le lint conserve deux avertissements préexistants hors de cet audit. Les résultats Playwright sont consignés dans la PR.

## Utilisation commune des cotations

Les Fiches ETF et les tickers publiés du Comparateur d’indices utilisent désormais un objet `listing` du registre, sélectionné par `getPreferredInstrumentListing`. La sélection privilégie EUR, puis Paris, Amsterdam, Milan et Xetra ; hors EUR, USD précède les autres devises. Ce choix éditorial ne compare pas les spreads ni la disponibilité chez un courtier.

Le ticker, la place et la devise s’affichent ensemble dans les textes et les exports PNG. Les anciennes listes de tickers ont été retirées des caractéristiques et du catalogue des noms ; `getInstrumentTickers` reste un accès de compatibilité dérivé des cotations sourcées. Les objets du registre sont figés pour éviter une modification locale par un outil.

Le contrôle exige la référence commune sélectionnée et refuse les champs ticker recopiés dans les outils. Quatre mutations supplémentaires couvrent une devise modifiée, une autre place, une sélection supprimée et un ticker recopié. Playwright vérifie la place et la devise en parcourant les 41 fiches. LU1834983550 ne publiait aucun ticker : cette fiche reste identifiée par son ISIN sans inventer de cotation.
