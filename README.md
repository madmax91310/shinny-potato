# Suivi de portefeuille d'investissement

Application web (React + Vite) de suivi de portefeuille crypto / actions / ETF, 100% côté client (aucun backend, tout est stocké dans le `localStorage` du navigateur).

## Fonctionnalités

- Ajout, édition, suppression de lignes de portefeuille (nom, ticker, type, quantité, prix d'achat, date d'achat)
- Cours crypto en direct via l'API publique **CoinGecko** (`/simple/price`), sans clé API, rafraîchis toutes les 60s
- Cours actions/ETF via l'API **Twelve Data** (`/quote`), avec clé API personnelle saisie dans l'onglet Paramètres (stockée en localStorage), file d'attente respectant la limite de 8 requêtes/min du tier gratuit
- Mode manuel de secours pour les actions/ETF si aucune clé n'est renseignée
- Tableau triable par colonne avec indicateur de source du prix (live / manuel)
- Camembert de répartition (par ligne ou par type) et courbe d'évolution de la valeur du portefeuille (7j / 30j / tout l'historique)
- Vue d'ensemble : valeur totale, performance globale, performance du jour

## Démarrage

```bash
npm install
npm run dev
```

Puis ouvrez `http://localhost:5173`.

## Build de production

```bash
npm run build
npm run preview
```

## Stack technique

- React + Vite
- Tailwind CSS v4
- Recharts (PieChart, LineChart)
