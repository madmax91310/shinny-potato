# Capture des publications complètes

Base : `414bd67a1afa1ae9cc003e5e98a3f0c0f6b92d2d`. Même état des données avant/après ; les fichiers de projection locaux ont été régénérés par le build, sans inclusion dans la PR.

| Famille | Textes capturés | Textes modifiés |
|---|---:|---:|
| indices | 53 | 53 |
| fiches-etf | 279 | 279 |
| comparatif | 156 | 12 |
| dca | 150 | 150 |
| budget | 54 | 0 |
| faits | 144 | 0 |
| pratique | 74 | 0 |
| grok | 280 | 0 |
| banque | 131 | 0 |
| investisseur | 37 | 1 |
| courtier | 28 | 0 |
| generateur | 4 | 4 |
| calculateur | 15 | 15 |
| performance | 4 | 0 |
| anniversaire | 6 | 0 |
| classement | 4 | 4 |

Total : 1419 textes, 518 modifiés ; 0 refus.

Les cas `synthetique-six-lignes`, `actions-*`, `fonds-*`, `partiel`, `sans-majorite` et `personnalise-*` sont des fixtures de contrôle, pas des données de publication. Les calendriers et données réels restent dans leurs registres. Les catalogues statiques sont capturés intégralement ; les outils combinatoires sont échantillonnés, complétés par leurs suites de tests. Ce nombre ne signifie pas une lecture humaine exhaustive de toutes les combinaisons.

Rejeu : `node scripts/audit-editorial-20261102.mjs /tmp/editorial.json`. Les deux archives JSON contiennent les publications complètes, le calendrier et les refus ; aucun texte n’est tronqué.
