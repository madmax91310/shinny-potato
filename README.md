# shinny-potato

Yo

## Daily market tweet

Génère chaque matin un tweet de point marché (style éducation financière, en
français) à partir de données vérifiées : clôtures de la veille (CAC 40, S&P
500, Bitcoin, Or) et principales actualités financières du jour.

### Fonctionnement

1. `daily_market_tweet/market_data.py` récupère les clôtures via Yahoo Finance
   (`yfinance`).
2. `daily_market_tweet/news.py` récupère les dernières actualités financières
   via flux RSS.
3. `daily_market_tweet/tweet_generator.py` envoie ces données vérifiées à
   Claude avec le prompt système qui définit le style du compte (phrases
   complètes, contexte autour des chiffres, une idée forte, question de fin
   précise, jamais de chiffre ou de news inventés).
4. `daily_market_tweet/poster.py` publie le tweet sur X si les identifiants
   sont configurés ; sinon il l'affiche uniquement.

Un exemple de sortie (généré manuellement à partir de données vérifiées) est
disponible dans [`examples/tweet-2026-08-12.md`](examples/tweet-2026-08-12.md).

### Utilisation

```bash
pip install -r requirements.txt
export ANTHROPIC_API_KEY=...
python -m daily_market_tweet.main
```

Pour publier automatiquement sur X, définir en plus `X_API_KEY`,
`X_API_SECRET`, `X_ACCESS_TOKEN` et `X_ACCESS_SECRET`.

### Automatisation

Le workflow GitHub Actions
[`daily-market-tweet.yml`](.github/workflows/daily-market-tweet.yml) exécute
le script chaque jour de semaine à 06:00 UTC (avant l'ouverture d'Euronext
Paris). Les identifiants doivent être ajoutés comme secrets du dépôt :
`ANTHROPIC_API_KEY`, `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`,
`X_ACCESS_SECRET`.
