# Extension qualifiée du 12 octobre 2026

Ajouts validés par récupération directe des sources publiques, avant publication.
Les squelettes de texte et d’image restent inchangés.
Les tests des nouveaux formats MSCI et des plateformes utilisent des exemples
synthétiques : aucune fiche MSCI complète ni page de conditions complète n’est ajoutée au dépôt.

## ETF et outils historiques

| Part exacte | Présentation | Historique partagé | Devise de cotation retenue |
|---|---|---|---|
| Xtrackers World Industrials, IE00BM67HV82 | API DWS : frais, encours daté, portefeuille et performances NAV USD | XDWI.DE, avril 2016 à septembre 2026 | EUR |
| iShares World Consumer Staples Advanced, IE00BJ5JP329 | API/page iShares : frais, encours daté, portefeuille et performances NAV USD | WCSS.AS, novembre 2019 à septembre 2026 | USD |

Les historiques servent Performance depuis, Il y a X ans et Et si tu avais investi.
Les simulations et rendements utilisent les clôtures ajustées des revenus et divisions.
Il y a X ans utilise les cours bruts et la dernière séance terminée, collectée séparément.
Pas de prolongement de l’historique industriel par le fonds luxembourgeois fusionné.
Les mois quotidiens et mensuels ont été recoupés. Les deux collecteurs ETF ont
réussi deux récupérations sans intervention ; les cinq champs affichés sont exigés.
Le workflow quotidien existant actualise les émetteurs ; le workflow mensuel
et sa récupération des échecs actualisent les historiques et cours anniversaires.

## Coulisses des indices

MSCI World Industrials et MSCI World Consumer Staples : fiches MSCI du 30 septembre
2026, rendement net USD, années 2020–2025. Le nombre de valeurs, les pays, les dix
premières positions et les performances viennent des documents officiels.
L’exposition sectorielle de 100 % repose sur la classification GICS expressément
publiée, pas sur les portefeuilles des ETF. Les poids par sous-industrie ne sont pas
confondus avec les secteurs. La légende des pays est extraite séparément.
L’indice Consumer Staples classique est distinct de la variante Advanced Select
20 35 Capped suivie par l’ETF iShares.

## Analyse entreprise

Meta : publications officielles trimestrielles et annuelles de l’émetteur,
cours de la dernière séance Yahoo et estimations publiques Finviz. Le collecteur
existant est étendu aux adresses de publication Meta. Les fichiers récupérés sont
réutilisés en mémoire pendant une collecte afin que comptes et historique restent
fondés sur les mêmes publications ; aucune capture complète n’est publiée.
Le PER historique n’est calculé que sur quatre BPA trimestriels publiés.
La SEC répond dans l’environnement de développement mais refuse l’accès depuis
GitHub Actions. Les neuf autres entreprises proposées ne sont donc pas ajoutées :
leur historique et leurs comptes doivent d’abord passer une collecte complète sur
l’environnement d’exécution, via des sources de secours officielles.

## Présentations d’acteurs

Tudigo : investissement en actions, barème officiel et CGU ; conditions des offres
obligataires exclues. Lendosphere : financement en dette, FAQ et fonctionnement ;
les offres en actions sont distinctes. Aucun ticket, taux ou délai commun à tous
les projets n’est inventé. Les conditions de la collecte sélectionnée restent
propres à cette collecte. L’exception de frais Lendosphere (retrait de fonds
crédités sans investissement) est conservée. Ces conditions publiques sont
actualisées par le workflow quotidien des acteurs.
Les logos proviennent des sites officiels (SVG Tudigo extrait intact ; SVG
Lendosphere téléchargé sur son site).

## Exclusions

- MSCI Canada et MSCI Australia : exclus à la demande de l’utilisateur.
- Hello bank! : tarifs, PEA et IFU publics identifiés, mais disponibilité du DCA
  non qualifiée sur une source officielle. Aucun courtier incomplet ajouté au comparatif.

## Illustrations d’entreprises

Fichiers : `public/asset-art/company-light/meta.webp`.
Création avec l’outil intégré de génération d’images ; référence stylistique :
`public/asset-art/company-light/costco.webp`. Illustration Meta inspectée
dans une planche de contrôle, puis encodées en WebP sans modification de composition.

Prompt commun : illustration panoramique 2:1 de miniatures réalistes en studio,
fond blanc/gris clair, socles en marbre blanc, lumière douce, matériaux réalistes,
accents de marque limités, marge autour des objets, sans chiffres financiers,
sans légende ni filigrane. La référence ne sert qu’au style : retirer toute
identité Costco. Sujet publié : Meta, réseaux sociaux et serveurs, avec emblème de marque.
