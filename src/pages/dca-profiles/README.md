# Portefeuille et DCA

- `data.js` : 100 scénarios éditoriaux. Aucun témoignage, contribution reçue ou citation n'est inventé. Les exports utilisent une narration neutre.
- `engine.js` : poids actuels indépendants du DCA, sommes des poids à 100 %, flux >= 0, maximum 8 positions, pas de capital inféré. Les poids préparés sont des choix éditoriaux, pas des observations de personnes.
- `exposures.json` : extrait généré, jamais édité à la main. `scripts/build-dca-exposures.mjs` réutilise les registres communs et s'exécute avant dev/build. Les noms de supports restent ceux du registre d'instruments.
- Expositions : 24 références ETF disposent de pays/secteurs. Les quatre LifeStrategy sont identifiés mais n'ont pas de ventilation géographique/sectorielle qualifiée dans le registre. Les actions directes, métaux et cryptos ne reçoivent pas de ventilation inventée. Couverture et détail des sources sont visibles.
- Une participation commence sans ISIN confirmé. Le choix du support est explicite, jamais déduit d'un libellé générique. Pour un autre support, laisser l'absence de confirmation : il n'est pas remplacé silencieusement par un proxy.
- `portfolioExposure` conserve les dates, bases fonds/indice et classifications séparées. Le texte et le visuel affichent la photographie couvrant le plus grand poids ; toutes les photographies sont disponibles dans les détails. Les poids sont toujours rapportés au portefeuille total. Une photographie partielle n'est pas une répartition exhaustive.
- Aucun score, conseil d'achat/vente, adéquation au profil de risque ou chiffre de chevauchement sans compositions complètes.
- Les contributions restent dans l'état du navigateur ; sauvegarde locale facultative, pas d'envoi serveur. Toute modification révoque la validation de publication. Une restauration nécessite une nouvelle validation.
- Export PNG 1600 × 1067 et texte modifiable. Modifier une position régénère le texte ; le message dans l'interface l'annonce.

Validation : `npm run test:dca`, `node scripts/test-dca-images.mjs` (avec `CHROMIUM_PATH` si nécessaire), `npm run build`.

## Publication validée le 15 octobre 2026

Accroche : prénom, âge et activité, revenu mensuel, puis DCA. Répartition détenue, versements par support et commentaire factuel sur la composition. Conclusion « Que pensez-vous du DCA de… ? ». Aucun paragraphe sur les versements suivant la répartition.

Image 1600 × 1067 : montant mensuel dominant, cartes des versements avec poids détenus, donut géographique. Le donut utilise une seule photographie compatible ; la couverture non représentée reste grise. La date, la base et la couverture restent discrètes. Les légendes longues et 1 à 8 lignes s’adaptent au cadre.
