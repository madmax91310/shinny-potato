# Portefeuille et DCA

- `data.js` : 100 scénarios éditoriaux. Aucun témoignage, contribution reçue ou citation n'est inventé. Les exports utilisent une narration neutre.
- `engine.js` : poids actuels indépendants du DCA, sommes des poids à 100 %, flux >= 0, maximum 8 positions, pas de capital inféré. Les poids préparés sont des choix éditoriaux, pas des observations de personnes.
- `exposures.json` : extrait généré, jamais édité à la main. `scripts/build-dca-exposures.mjs` réutilise les registres communs et s'exécute avant dev/build. Les noms de supports restent ceux du registre d'instruments.
- Expositions : 24 références ETF disposent de pays/secteurs. Les quatre LifeStrategy sont identifiés mais n'ont pas de ventilation géographique/sectorielle qualifiée dans le registre. Les 37 actions sont classées par ISIN à partir des positions officielles iShares World (pays de risque et secteurs publiés). Les métaux et cryptos apparaissent hors classification, sans leur inventer de pays ou de secteur. Couverture et détail des sources sont visibles.
- Une participation commence sans ISIN confirmé. Le choix du support est explicite, jamais déduit d'un libellé générique. Pour un autre support, laisser l'absence de confirmation : il n'est pas remplacé silencieusement par un proxy.
- `publishedExposure` produit une synthèse indicative des répartitions publiées pour les graphiques du portefeuille : les libellés des émetteurs sont agrégés, sans affirmer l’équivalence de leurs taxonomies. Chaque contribution conserve sa source, sa date, sa base et sa classification. Les gardes sur les dates, les données manquantes et les poids restent appliquées.
- `dcaExposure` agrège les dernières observations compatibles (93 jours maximum, écart de 45 jours maximum). Le visuel affiche le groupe couvrant le plus grand poids ; chaque source conserve sa date et sa base fonds/indice/action dans les détails. Les règles historiques communes de `portfolioExposure` ne sont pas modifiées. Les poids sont toujours rapportés au portefeuille total. Une photographie partielle n'est pas une répartition exhaustive.
- Aucun score, conseil d'achat/vente, adéquation au profil de risque ou chiffre de chevauchement sans compositions complètes.
- Les contributions restent dans l'état du navigateur ; sauvegarde locale facultative, pas d'envoi serveur. Toute modification révoque la validation de publication. Une restauration nécessite une nouvelle validation.
- Export PNG 1600 × 1067 et texte modifiable. Modifier une position régénère le texte ; le message dans l'interface l'annonce.

Validation : `npm run test:dca`, `node scripts/test-dca-images.mjs` (avec `CHROMIUM_PATH` si nécessaire), `npm run build`.

## Publication validée le 15 octobre 2026

Accroche : prénom, âge et activité, revenu mensuel, puis DCA. Répartition détenue, versements par support et commentaire factuel sur la composition. Conclusion « Que pensez-vous du DCA de… ? ». Aucun paragraphe sur les versements suivant la répartition.

Image 1600 × 1067 : montant mensuel dominant, versements à gauche et donut géographique ou sectoriel au choix. Le donut utilise une synthèse compatible ; la couverture non représentée reste grise. La date, la base et la couverture restent discrètes. Les légendes longues et 1 à 8 lignes s’adaptent au cadre.

## Révision validée : 50/50 et grand donut

100 profils : 50 classiques, 50 convictions plus marquées (classification interne uniquement). Tous conservent un ETF socle et 2 à 4 lignes ; les petits budgets ont deux lignes. À deux lignes, le complément est une conviction (thème, facteur, action, métal ou crypto), pas un second indice régional. Budgets et identités conservés. Poids détenus explicites et stables dans `holdings`, indépendants des flux mensuels. Les allocations ne sont pas déduites du métier ni copiées de témoignages.

Pistes éditoriales consultées : discussions Finary « Création portefeuille ETF PEA » (https://community.finary.com/t/creation-portefeuille-etf-pea/32907) et « Meilleure sélection d’ETFs » (https://community.finary.com/t/meilleure-selection-detfs/39439), Reddit « Allocation portefeuille CTOQ » (https://www.reddit.com/r/vosfinances/comments/18zoy6c). Ces discussions ne valident pas les scénarios ; les scénarios restent éditoriaux.

Visuel : bleu nuit, crème et jaune ; typographie serif pour les titres et montants ; versements à gauche sans cartes ; donut de 560 px à droite, centre vide, légende dessous. Parts exactes utilisées pour les arcs ; pourcentages entiers affichés par méthode des plus forts restes (total 100 %), sans altérer les données ni imposer des nombres moins ronds. Couverture manquante conservée en gris, sources et bases séparées comme auparavant. Aucune donnée illustrative de la maquette utilisée en production.

## Expositions et gestion des profils (15 octobre 2026)

- `collect_dca_equities.py` contrôle l’ISIN de la source, son portefeuille complet, ses colonnes, chaque ISIN et les secteurs reconnus. Les absences conservent leurs anciennes dates (jamais renouvelées artificiellement), font échouer le bilan et deviennent hors couverture après 93 jours. Collecte quotidienne dans `update-qualified-exposures.yml`, puis régénération de `exposures.json` et déploiement.
- Nasdaq-100 : support corrigé vers IE00B53SZB19. IE00B53L3W79 est un Euro STOXX 50 et ne doit jamais servir de proxy.
- Les secteurs ICB, GICS et autres classifications non qualifiées ne sont pas fusionnés. Les pays d’enregistrement DWS restent séparés des pays de risque. Les bases de chaque observation sont conservées. Une couverture partielle ne représente pas l’ensemble du portefeuille.
- Choix pays/secteurs indépendant du texte. Il invalide seulement l’autorisation de publication d’une participation. Aucun changement du générateur de texte, des allocations ou des 100 profils.
- Filtres de budget, nombre de positions, type d’actif et utilisation. « Utilisé » est explicite et persistant ; voir un profil ne le marque pas comme publié. Le tirage respecte les filtres et gère les listes vides ou uniques.
- Recherche dans le catalogue par nom, nom du support ou ISIN ; aucune correspondance floue n’attribue un support sans confirmation.
- Duplication et jusqu’à 50 sauvegardes locales nommées, contenant portefeuille, texte personnalisé et choix du donut. Mise à jour et suppression individuelles ; restauration sans autorisation de publication. Ancien brouillon unique conservé. Les données corrompues ne sont pas écrasées silencieusement.

Validation supplémentaire : `node scripts/test-dca-upgrade.mjs`, `python -m unittest discover -s scripts -p 'test_dca_equities.py'`, 206 rendus (deux modes), filtres, recherche, duplication, sauvegardes après rechargement et mobile.

## Images d’exposition

Option « Expositions uniquement » : aucun pseudonyme, âge, activité, revenu ou montant de versement dans le PNG. Un nom vide est accepté dans ce mode. Choix géographie, secteurs ou les deux côte à côte, conservé dans les sauvegardes et brouillons. Chaque donut garde sa propre couverture et ses dates. Le mode avec identité reste disponible.

## Sélections de préparation (25 octobre 2026)

Les 100 scénarios historiques (`PROFILES`, y compris les 50 anciens groupes internes
« conviction ») restent inchangés dans « Profils classiques ». Les 50 scénarios ajoutés
sont définis dans `controversial-profiles.js`, exposés par `CONTROVERSIAL_PROFILES` et
exclusivement accessibles via « Profils polémiques ». `ALL_PROFILES` réunit les deux
banques pour l’interface ; `filterProfiles` applique la sélection avant les autres
critères et retourne une liste vide sans repli. Effacer les filtres conserve la sélection.

`selection` est une métadonnée interne, conservée dans les brouillons et sauvegardes.
Son absence vaut `classic`, indépendamment de l’ancien `editorialGroup`. Restaurer un
portefeuille restaure aussi sa sélection. Les règles historiques de cœur diversifié
restent testées sur les 100 profils classiques ; elles ne s’appliquent pas aux nouveaux.
Les supports sont ceux du catalogue existant, confirmés par ISIN dans `prepareProfile`.

Les tweets conservent identité, salaire, DCA, poids détenus, versements, question et
disclaimer ; les paragraphes automatiques de commentaire de l’allocation sont retirés.
Aucune catégorie n’est transmise aux libellés publics. Le moteur de rendu PNG est inchangé.

Contrôles supplémentaires : `node scripts/test-dca-selections.mjs` (également inclus dans
`npm run test:dca`) et `CHROMIUM_PATH=/usr/bin/chromium node scripts/playwright-dca-selections.mjs`.
`test-dca-images.mjs` couvre les 150 profils dans les quatre mises en page existantes,
ainsi que les cas limites historiques (620 rendus), avec contrôle des textes et débordements.
