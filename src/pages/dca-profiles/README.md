# Portefeuille et DCA

- `data.js` : 100 scénarios éditoriaux. Aucun témoignage, contribution reçue ou citation n'est inventé. Les exports utilisent une narration neutre.
- `engine.js` : poids actuels indépendants du DCA, sommes des poids à 100 %, flux >= 0, maximum 8 positions, pas de capital inféré. Les poids préparés sont des choix éditoriaux, pas des observations de personnes.
- `exposures.json` : extrait généré, jamais édité à la main. `scripts/build-dca-exposures.mjs` réutilise les registres communs et s'exécute avant dev/build. Les noms de supports restent ceux du registre d'instruments.
- Expositions : 24 références ETF disposent de pays/secteurs. Les quatre LifeStrategy sont identifiés mais n'ont pas de ventilation géographique/sectorielle qualifiée dans le registre. Les actions directes, métaux et cryptos ne reçoivent pas de ventilation inventée. Couverture et détail des sources sont visibles.
- Une participation commence sans ISIN confirmé. Le choix du support est explicite, jamais déduit d'un libellé générique. Pour un autre support, laisser l'absence de confirmation : il n'est pas remplacé silencieusement par un proxy.
- `portfolioExposure` conserve les dates, bases fonds/indice et classifications séparées. Le visuel affiche la photographie couvrant le plus grand poids ; toutes les photographies sont disponibles dans les détails. Les poids sont toujours rapportés au portefeuille total. Une photographie partielle n'est pas une répartition exhaustive.
- Aucun score, conseil d'achat/vente, adéquation au profil de risque ou chiffre de chevauchement sans compositions complètes.
- Les contributions restent dans l'état du navigateur ; sauvegarde locale facultative, pas d'envoi serveur. Toute modification révoque la validation de publication. Une restauration nécessite une nouvelle validation.
- Export PNG 1600 × 1067 et texte modifiable. Modifier une position régénère le texte ; le message dans l'interface l'annonce.

Validation : `npm run test:dca`, `node scripts/test-dca-images.mjs` (avec `CHROMIUM_PATH` si nécessaire), `npm run build`.

## Publication validée le 15 octobre 2026

Accroche : prénom, âge et activité, revenu mensuel, puis DCA. Répartition détenue, versements par support et commentaire factuel sur la composition. Conclusion « Que pensez-vous du DCA de… ? ». Aucun paragraphe sur les versements suivant la répartition.

Image 1600 × 1067 : montant mensuel dominant, cartes des versements avec poids détenus, donut géographique. Le donut utilise une seule photographie compatible ; la couverture non représentée reste grise. La date, la base et la couverture restent discrètes. Les légendes longues et 1 à 8 lignes s’adaptent au cadre.

## Révision validée : 50/50 et grand donut

100 profils : 50 classiques, 50 convictions plus marquées (classification interne uniquement). Tous conservent un ETF socle et 2 à 4 lignes ; les petits budgets ont deux lignes. À deux lignes, le complément est une conviction (thème, facteur, action, métal ou crypto), pas un second indice régional. Budgets et identités conservés. Poids détenus explicites et stables dans `holdings`, indépendants des flux mensuels. Les allocations ne sont pas déduites du métier ni copiées de témoignages.

Pistes éditoriales consultées : discussions Finary « Création portefeuille ETF PEA » (https://community.finary.com/t/creation-portefeuille-etf-pea/32907) et « Meilleure sélection d’ETFs » (https://community.finary.com/t/meilleure-selection-detfs/39439), Reddit « Allocation portefeuille CTOQ » (https://www.reddit.com/r/vosfinances/comments/18zoy6c). Ces discussions ne valident pas les scénarios ; les scénarios restent éditoriaux.

Visuel : bleu nuit, crème et jaune ; typographie serif pour les titres et montants ; versements à gauche sans cartes ; donut de 560 px à droite, centre vide, légende dessous. Parts exactes utilisées pour les arcs ; pourcentages entiers affichés par méthode des plus forts restes (total 100 %), sans altérer les données ni imposer des nombres moins ronds. Couverture manquante conservée en gris, sources et bases séparées comme auparavant. Aucune donnée illustrative de la maquette utilisée en production.
