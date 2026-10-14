# Fiabilisation des données — points 3 et 4

## Compositions d’indices

Le registre contient 50 indices avec composition collectée. Les pays, secteurs,
nombre de titres et principales positions étaient déjà raccordés aux consommateurs.
La correction ajoute une validation commune après chaque parseur : identité exacte,
date non future et récente, comptage entier, preuve SHA-256 et URL de la source,
poids finis, absence de doublons, total des pays/secteurs et top cohérent.
Une composition invalide est exclue de la fusion : la dernière photographie reste
conservée et une performance collectée indépendamment peut continuer à être actualisée.

Russell 1000 conserve deux dates : secteurs/comptage mensuels et poids individuels
trimestriels. Les poids trimestriels ne sont pas copiés dans la composition mensuelle.
Les erreurs de collecte de ces deux blocs deviennent obligatoirement signalées dans
le workflow global, au même titre que les performances.

## Investisseurs

Les 18 profils sont déjà interrogés quotidiennement. La collecte vérifie désormais
l’identité du fonds dans chaque réponse et page, la cohérence du trimestre, les
valeurs et types de positions, la complétude et les doublons. Les lignes sans ticker
restent distinctes par leur identité publiée ; « Unmapped CUSIP » n’est pas un ticker.
Le garde-fou opérationnel de 200 jours signale une source très ancienne ; il ne
représente pas une règle relative aux délais de dépôt SEC.

Un échec n’interrompt plus le diagnostic des autres profils. Un rapport couvre les
18 gestionnaires et est conservé en artifact GitHub pendant 35 jours. Si une
validation échoue, l’ensemble des fichiers antérieurs est conservé et le workflow
échoue explicitement. Aucun relevé plus ancien ne remplace un trimestre récent ;
les archives trimestrielles existantes restent conservées.

Le navigateur rejette lui aussi les relevés incohérents avant génération du texte
et de l’image. Les tests rédactionnels fixes ne dépendent plus des poids du dernier
trimestre réel ni d’un fournisseur imposé pour Ackman. Les historiques de valeur
et séries de benchmark renvoyés par un fournisseur ne deviennent jamais une
performance de gestion. Aucune performance non sourcée n’est ajoutée.

## Vérification

- Validation des 50 compositions stockées et des 18 relevés locaux.
- Tests de compositions tronquées, doublons, dates, provenance et conservation.
- Tests investisseurs : identité, trimestres, pagination, 429, conservation des
  archives et diagnostic complet malgré plusieurs erreurs.
- Audits des consommateurs, textes des 18 profils, build et budgets JavaScript.
- Collecte directe World, ACWI, MSCI Emerging Markets et Russell 1000 : quatre
  compositions et quatre historiques calendaires valides le 14 octobre 2026.
- Le workflow de PR répète la collecte réelle des 18 investisseurs ; le déploiement
  garde les validations habituelles.
