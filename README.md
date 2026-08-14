# Générateur de tweets ETF

Application web (React + Vite + Tailwind) pour générer des tweets d'éducation financière ETF, pour un compte français spécialisé. 100% côté client (aucun backend, tout est stocké dans le `localStorage` du navigateur).

## Fonctionnalités

- Bibliothèque de thématiques ETF (Monde, USA, Europe, Tech Europe, Émergents, Luxe, IA/Robotique, Santé, Renouvelables, Dividendes, Japon, Défense, Quantique, Spatial, Ressources naturelles, ETC métaux)
- Édition par thème : accroche, phrase de transition, liste dynamique d'ETF (nom, ISIN, frais, encours, différenciateur), phrase de clôture, CTA d'engagement et de partage, mention réglementaire (avec éligibilité PEA/CTO optionnelle)
- Aperçu live du tweet formaté exactement selon le squelette imposé (emojis, ordre des champs, sauts de ligne)
- Compteur de caractères avec indication du format nécessaire (tweet classique / note longue / thread)
- Bouton de copie presse-papiers
- Sauvegarde automatique en local (chaque thème édité est conservé entre les sessions)

Le thème "Monde" est pré-rempli à titre d'exemple avec 3 ETF (MSCI World, FTSE All-World, MSCI ACWI). Les autres thèmes démarrent vides — aucune donnée financière (ISIN, frais, encours) n'est inventée par défaut.

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
