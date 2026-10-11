# Quatre nouvelles fiches Coulisses des indices

MSCI Emerging Markets IMI, FTSE All-World High Dividend Yield, S&P Global Dividend Aristocrats Quality Income et MSCI World Growth réutilisent les collecteurs existants de `scripts/index-automation.json`.

Le workflow quotidien `collect-etf-pilot.yml` exécute `refresh_index_sources.py`. Chaque fiche lit les observations validées : nombre de titres, pays, secteurs, positions, poids, dates, sources et cinq dernières années civiles complètes. Aucune donnée chiffrée n’est recopiée dans le texte éditorial. La composition commune conserve sa provenance canonique et les archives restent intactes. Les performances sont celles des indices, dividendes réinvestis, en USD ; aucun rendement de part ETF n’est substitué.

Collecte réelle du 11 octobre 2026 : les quatre compositions et les quatre séries annuelles ont réussi, sans exception. Toutes les compositions sont au 30 septembre 2026. Les séries MSCI/FTSE contiennent six années, la série S&P cinq ; les fiches affichent cinq années communes complètes par indice.

Les observations incomplètes et les conventions Price Return sont refusées. Si un téléchargement échoue, le collecteur conserve les dernières observations validées. Le test `test-automated-index-sheets.mjs`, exécuté par la collecte quotidienne et le workflow de publication, vérifie la propagation d’une composition future et d’une nouvelle année jusque dans le tweet. Les tests navigateur existants parcourent les trente fiches et contrôlent les exports sans texte coupé ni chevauchement. Le format et les illustrations existantes sont conservés.
