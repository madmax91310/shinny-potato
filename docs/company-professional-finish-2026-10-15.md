# Réception complémentaire de l’analyse d’entreprise — 15 octobre 2026

## Résultat

156 dossiers actifs, 152 avec une méthode bénéfices disponible, 133 avec une méthode FCF disponible, 133 avec les deux. 143 satisfont le contrat complet existant. Les 31 admissions supplémentaires passent ce contrat sans abaissement de ses critères. Les candidates non qualifiées restent hors interface.

## Mécanique et explications

- Version 3 : la croissance de convergence conserve les contractions historiques du chiffre d’affaires, avec une médiane bornée de −10 à +10 %, au lieu de 0 à +10 %. Les anciennes archives gardent leur version et leurs hypothèses.
- Le panneau d’explication précise la convention de convergence, les personnalisations et les écarts entre méthodes. Aucun objectif moyen n’est calculé. L’écart relatif des deux objectifs utilise leur moyenne comme dénominateur ; il ne constitue pas une mesure de confiance.
- Les marges de trésorerie atypiques et l’absence de données permettant de financer les rachats remontent dans les limites du scénario.
- La publication parle de « variation annualisée » pour couvrir naturellement une hausse comme une baisse. Squelette et visuels conservés.
- Les méthodes restent réservées aux entreprises opérationnelles qualifiées. Banques, assurances et foncières ne sont pas ajoutées sans moteur adapté et données renouvelables validées.

## Données et exploitation

Collecte réelle des candidates via les adaptateurs existants, vérification des comptes, définitions des prévisions, cours et bases par action ; collecte complémentaire des risques tentée sur les 31 admissions. Les compléments dont les revenus/résultats ne se réconcilient pas avec les comptes retenus restent exclus. Ces champs de vigilance ne sont pas des entrées obligatoires du moteur.

Le seuil quotidien est porté à 150 entreprises avec au moins une méthode disponible et 140 satisfaisant le contrat complet. Le rapport sépare les deux comptes ainsi que les méthodes bénéfices/FCF. Les dates originales sont conservées en cas d’échec de collecte ; les mécanismes de péremption existants restent actifs.

Les quatre dossiers sans projection restent LVMH, Air Liquide, Schneider Electric et TotalEnergies. Les restrictions des classes d’actions, fractionnements, FCF négatifs et définitions non comparables décrites dans `company-qualification-2026-10-15.md` ne sont pas levées artificiellement. Cela ne constitue pas une couverture mondiale ni une certification externe.

## Validation

114 tests Python ; 2 565 scénarios recalculés indépendamment ; 2 484 publications sur les dossiers complets. Tests supplémentaires : contraction persistante, périmètre économique des modèles, DCF lorsque croissance et actualisation sont égales, conservation exacte des données de revue après compaction et absence d’objets mutables partagés.

Compilation et budgets inchangés. La compaction des métadonnées conserve exactement les valeurs ; elle évite que l’extension des entreprises dépasse le budget de la page de revue. Réception Chromium réussie sur les 156 entreprises : copie, images, téléchargement PNG, recherche partagée et mobile sans débordement. Contrôles GitHub et déploiement à confirmer avant clôture.

## Renouvelabilité depuis GitHub

Le premier passage GitHub a refusé sept admissions (PG, JNJ, ABT, EMR, RPM, PNR, GWW) : la SEC était accessible localement, mais le repli depuis le runner ne réconciliait pas BPA et actions. Elles restent candidates et doivent qualifier le repli standardisé avant admission automatique. Dover, Gartner, Waters, Snap-on et ITT ont été admises après collecte complète et réconciliation du repli ; un parse SEC partiel déclenche maintenant ce contrôle. Les seuils et les tolérances comptables restent inchangés.
