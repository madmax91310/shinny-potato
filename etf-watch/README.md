# etf-watch

Outil de veille automatisée des lancements de nouveaux ETF en Europe, pour
Vanguard, BlackRock/iShares, Amundi, BNP Paribas Easy, SPDR/State Street et
Invesco (+ justETF comme agrégateur cross-émetteurs, et un scraper AMF
expérimental désactivé par défaut).

À chaque exécution : scrape les sources configurées, compare avec une base
SQLite locale indexée par ISIN, isole les nouveautés, et génère un résumé
prêt à copier pour un tweet par ETF détecté.

## ⚠️ À lire avant de coder dessus davantage

Ce script a été écrit dans un environnement dont l'accès réseau sortant
était bloqué (sandbox de développement) : **la structure HTML réelle des
pages ciblées n'a pas pu être vérifiée en direct**. Les sélecteurs/URLs
viennent de recherches web et de la structure documentée de ces sites, pas
d'une inspection live. Concrètement :

- Les scrapers "presse" (Vanguard, Amundi, BNP Paribas Easy) et l'agrégateur
  justETF utilisent des heuristiques génériques (recherche de liens
  contenant des mots-clés de lancement, extraction d'ISIN/TER/ticker/date
  par regex dans le texte) plutôt que des sélecteurs CSS rigides — donc ils
  ont de bonnes chances de fonctionner tels quels, mais méritent un premier
  run de vérification.
- Le scraper AMF (`amf`) est **désactivé par défaut** dans `config.py`
  car son endpoint de recherche est une hypothèse non vérifiée. Voir le
  docstring de `etf_watch/scrapers/amf.py` pour la marche à suivre.
- iShares et Invesco utilisent des pages de filtrage très probablement
  JS-driven → le scraper essaie `requests` puis bascule sur Playwright si
  aucun ISIN n'est trouvé dans le HTML brut (Playwright est optionnel, voir
  installation ci-dessous).

**Avant la première exécution planifiée**, lancez chaque source
individuellement (`python -m etf_watch.main --source vanguard`, etc.) et
vérifiez les logs (`data/etf_watch.log`) : si une source ne retourne aucun
ETF alors qu'elle devrait, c'est probablement un sélecteur à ajuster dans
`etf_watch/config.py` ou une classe de `etf_watch/scrapers/`.

## Installation

```bash
cd etf-watch
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Optionnel mais recommandé pour iShares/Invesco (pages JS) :
pip install playwright
playwright install chromium
```

## Utilisation

```bash
# Exécution complète (toutes les sources activées)
python -m etf_watch.main

# Exécution ponctuelle / test sur une ou plusieurs sources
python -m etf_watch.main --source amundi --source justetf

# Voir les sources configurées et leur état (enabled/disabled)
python -m etf_watch.main --list-sources

# Scraper + comparer à la base sans rien écrire (pour tester sans polluer l'historique)
python -m etf_watch.main --dry-run
```

Le résumé des nouveaux lancements est affiché sur stdout (format prêt à
copier pour un tweet, un bloc par ETF) et tout est journalisé dans
`data/etf_watch.log` (rotation automatique à 2 Mo, 5 fichiers conservés).

### Premier run = initialisation de la base, pas une alerte

Au tout premier lancement, la base est vide : tous les ETF trouvés seraient
"nouveaux" par définition, ce qui spammerait de fausses alertes pour des
produits qui existent en réalité depuis des mois/années. Le premier run
**enregistre donc le catalogue de départ en base sans générer de résumé de
lancement** ("Aucun nouveau lancement d'ETF détecté..." est normal et
attendu la première fois). À partir du deuxième run, seuls les ISIN
réellement inédits sont signalés.

### Automatisation (cron)

Voir `cron/etf_watch.cron.example`. En résumé :

```bash
crontab -e
# puis coller (en adaptant les chemins) :
15 7 * * * cd /chemin/vers/etf-watch && /chemin/vers/etf-watch/.venv/bin/python -m etf_watch.main >> data/cron_stdout.log 2>&1
```

Le script est conçu pour tourner en non-interactif : il ne lève jamais
d'exception pour une source en échec (voir section suivante), écrit ses
logs dans un fichier, et retourne un code de sortie non nul uniquement si
**toutes** les sources demandées ont échoué (utile pour une alerte cron
externe du type "ce job échoue silencieusement depuis 3 jours").

## Gestion des erreurs

- Chaque scraper est isolé : une exception dans `fetch()` ou `parse()`
  d'une source est loguée puis avalée, le run continue avec les autres
  sources.
- `robots.txt` est vérifié avant chaque requête (par domaine, mis en
  cache) ; une source qu'il interdit est sautée avec un log explicite.
- Délai minimum configurable entre deux requêtes vers le même domaine
  (`ETF_WATCH_DELAY`, 3s par défaut) + retries avec backoff exponentiel sur
  échec réseau/HTTP.
- User-Agent identifiable et configurable via `ETF_WATCH_USER_AGENT`.
- Un ETF sans ISIN valide extrait n'est jamais inséré en base (évite de
  polluer l'historique avec du bruit de parsing).

## Structure du projet

```
etf_watch/
  config.py          URLs, sélecteurs, mots-clés, réglages réseau
  models.py           dataclass ETFProduct
  db.py                SQLite (table etfs indexée par ISIN, table runs)
  fetch.py             requests + robots.txt + rate limit + fallback Playwright
  pdf_utils.py          extraction de texte/tableaux PDF (pdfplumber)
  text_extract.py       regex ISIN/TER/ticker/date/classe d'actif
  summarize.py           génération du texte "tweet-ready"
  scrapers/
    base.py              classe de base (jamais de crash, ScraperResult)
    press_release.py      logique partagée pages d'actualités (Vanguard/Amundi/BNPP)
    screener.py            logique partagée pages "screener" JS (iShares/Invesco/justETF)
    vanguard.py, amundi.py, bnpparibas.py, ishares.py, invesco.py,
    justetf.py, spdr.py, amf.py    un fichier par source, quelques lignes chacun
  main.py                orchestrateur CLI
tests/                  tests unitaires (fixtures HTML locales, aucun accès réseau requis)
sample_output/          exemple de sortie généré (generate_sample.py + example_run.txt)
cron/                   exemple de crontab
data/                   base SQLite + logs (ignorés par git)
```

## Ajouter une nouvelle source

1. Ajouter une entrée dans `SOURCES` dans `config.py`.
2. Créer `scrapers/ma_source.py` qui hérite de `PressReleaseScraper` (pages
   d'actualités en prose) ou `ScreenerScraper` (pages de type
   catalogue/tableau) — ou de `BaseScraper` directement pour un cas
   vraiment particulier (voir `spdr.py` pour un exemple PDF).
3. L'enregistrer dans `scrapers/__init__.py` et `main.py::SCRAPER_CLASSES`.
4. Ajouter un test avec une fixture HTML locale dans `tests/fixtures/`.

## Sources non retenues

`etf.com` et Trackinsight étaient listés dans la demande initiale comme
agrégateurs, mais la reconnaissance préalable a montré qu'ils ne
convenaient pas pour ce cas d'usage : etf.com est centré sur le marché
américain (couverture Europe obsolète), et la base de données ETF de
Trackinsight est désormais principalement commercialisée via une API
payante (Nasdaq Data Link), sans page publique de "nouveaux ETF"
librement scrapable. **ETF Stream** (`etfstream.com/news/new-listings`)
a été identifié comme une alternative plus pertinente pour une couverture
Europe si vous voulez l'ajouter plus tard.

## Tests

```bash
pip install pytest
pytest -q
```

Les tests couvrent l'extraction regex, le modèle de données, la base
SQLite, le générateur de résumé, la logique de diff/baseline du CLI, et le
comportement de parsing des scrapers `press_release` / `screener` / `spdr`
contre des fixtures HTML locales — aucun test ne nécessite d'accès réseau.
