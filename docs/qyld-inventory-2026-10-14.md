# QYLD et inventaire — 14 octobre 2026

## QYLD : requalification, sans inventer les champs absents

Page officielle de la part distribuante IE00BM8R0J59 contrôlée le 14 octobre.
Les frais et encours restent collectés. La page présente une section de performances
USD Accumulating, deux poids différents pour plusieurs titres de référence sous
la même date et un tableau sectoriel dont le périmètre reste à recouper.

La collecte quotidienne existante réexamine désormais les quatre champs et conserve
pour chacun son statut, le motif, la date de contrôle, l’URL, l’empreinte de la page
et les extraits utiles. L’inventaire lit cette qualification au lieu d’un diagnostic
figé au 9 octobre. Les rapports quotidiens archivés par GitHub conservent également
ces observations. Une réponse incomplète devient « à qualifier », jamais une preuve
que l’émetteur ne publie pas le champ. Une collecte en échec conserve la qualification
précédente avec sa date ; une ancienne collecte ne remplace pas une revue plus récente.

- Calendrier annuel : non publié pour la part exacte dans la section examinée.
- Pays : aucun tableau économique complet dans la page complète examinée.
- Positions : poids contradictoires dans le HTML officiel, sans choisir arbitrairement
  une version (le rendu dynamique de l’émetteur peut expliquer les doublons).
- Secteurs : à qualifier par recoupement de l’indice exact.

Un changement du contenu peut faire passer un champ à « à qualifier ». Il ne constitue
pas à lui seul une validation économique ni une autorisation d’importer le tableau.
Le panier de substitution et la performance de la part capitalisante restent exclus.
Ce lot automatise la requalification ; il ne prétend pas fournir les quatre données.

## Inventaire et documentation

`npm run inventory` dérive routes, volumes et couverture des registres.
Chaque build le régénère et vérifie les correspondances routes/modules ; le déploiement
contrôle ensuite le résultat. La collecte ETF quotidienne versionne aussi ce rapport.
Le README renvoie à cet inventaire et supprime les anciens nombres et statuts.
Le comparateur d’indices est explicitement documenté comme moteur interne sans route ;
aucun outil retiré n’est réexposé sans décision produit.

## Validation

Tests de contradiction, doublons identiques, nouvelle section, réponse incomplète,
non-substitution de part, conservation et non-régression des dates ; tests des
collecteurs publics et des lacunes ; build et contrôle des routes.

## Suite

Recouper les données QYLD lorsqu’une publication exacte exploitable apparaît.
Les analyses Caterpillar/Waste Management et les allocations non publiées restent
hors de ce lot. Le suivi quotidien est en place ; aucun chiffre ne comble artificiellement
une lacune.
