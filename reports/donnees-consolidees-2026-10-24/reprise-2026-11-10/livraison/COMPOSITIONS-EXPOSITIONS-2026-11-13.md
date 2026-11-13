# Compositions et expositions — reprise consolidée du 13 novembre 2026

Même suivi#881 et mêmes matrices : **694entrées de portefeuille et86indices**, aucune extension de catalogue. Les dates de contrôle sont distinctes des photographies ; aucune renormalisation, aucune modification des maquettes, tweets ou PNG.

**Publication finale en cours de validation ; aucune adoption publique de la nouvelle clôture revendiquée avant reçu final.**

## Usages préservés et contrôlés publiquement

| Actif / outil | Périmètre réellement disponible | Actualisation et limite |
|---|---|---|
| Healthcare IE00BYZK4776 et Ageing IE00BYZK4669 | Recouvrement intégral selon moteur, concentration, DCA et expositions ; Healthcare99,83623%, Ageing99,62259% de NAV identifiée | Correctifs CVR préservés, sources datées. Nouvelle recette publique : paire18,71%, texte/PNG conformes |
| Invesco EqualWeight IE000L2SA8K5 et EM SmallCap IE00B3F81G20 | Recouvrement intégral selon moteur, couvertures99,9709% et99,56404% | Identités, résidus et classes d’actions préservés ; nouveau contrôle public de sélection, calcul et PNG |
| LifeStrategy20/40/60/80 | Poche actions transparisée20,26632441/39,90975951/59,77378837/79,69919190% ; dates compatibles parents/enfants | Pas de couverture complète des fonds, ni transparisation des obligations. Paire20/80 reste«Partiel»dans le public, PNG conforme ; nouveau cron GPX à observer distinctement |
| MSCI EM IMI / ETF IE00BKM4GZ66 | Ventilations natives de l’indice séparées du substitut ETF explicite ; couverture ETF99,41514% | ETF ≠ indice exact ; recouvrement complet toujours refusé sur ce livre partiel |
| DWS FTSEAllWorld IE000L6ZMMC4 | Livre identifié94,32610835%, fonds monétaires et fonds Inde gardés distincts des entreprises | Collecte déjà réparée et preuves du12Nov préservées ; les poches non transparisées restent partielles |
| SPYL IE000XZSV718 | Pays, secteurs et top10 réellement renouvelés dans le producteur13Nov, photographie11Nov ; champs identiques au registre public | Run43355654291 **manuel**, pas cron. Contrôle complet de recouvrement non levé : somme brute et dénominateur non rapprochés |
| Russell1000 | Pays, secteurs et1022titres natifs au31Oct ; fiche classique cohérente30juin conservée | Livre ou classement complet de sociétés consolidées pondérées manquant ; top10titres ne certifie pas dixentreprises |

Quatre allocations ont été exercées sur le vrai site le13Nov : Healthcare/Ageing, Invesco/EMSmallCap, LifeStrategy20/80 etSPYL/EMIMI. Sélection, calcul, valeurs partielles, aperçu et téléchargement identiques vérifiés ; affichages1440et390px, sans erreur JavaScript. L’invariance à l’ordre a été contrôlée séparément dans le moteur commun ; quatrePNG publics ont été téléchargés. Ces contrôles ont **leur version publique propre** et ne sont pas rétroactivement réétiquetés : [reçus](preuve-consommateurs-compositions-publics-2026-11-13.json).

## Blocages approfondis, sans admission artificielle

| Cause / actifs | Résultat nouveau utile | Pièce manquante et usage empêché |
|---|---|---|
| Deux compositions natives S&P Global QualityIncome / EuroHighYieldDividendAristocrats | Nouvelle route officielle espagnole qualifiée localement, indices exacts92388578USD et5475610EUR, photo30Oct. **Refus403 dans GitHub Ubuntu ET macOS**, également confirmé pour les deux indices dans le producteur ETF ordinaire | Accès officiel autorisé et fonctionnel depuis GitHub, ou handoff automatiquement renouvelé. #1253 reste **brouillon, non fusionnée/non déployée** ; dernière photo et vrai contrôle6Nov conservés. Aucune tolérance48h augmentée |
| GlobalXRobotics IE00BLCHJB90 | Nouvelle collecte ciblée réelle13Nov encore refusée : deux contrats FX sans NET_ASSETS/MARKET_VALUE ; l’erreur ne vient pas du parseur qui aurait perdu un zéro | Valeurs et poids NAV officiels des deux lignes. Dernier livre valide9Nov conservé ; renouvellement complet défaillant, usages antérieurement qualifiés encore disponibles avec leur date |
| Six livres WisdomTree Cloud/Defence/Quantum/AI/Battery/GGRA | Nouvelle piste régionale.eu réellement examinée : redirection vers la même source.com, aucun livre NAV indépendant obtenu | Livre économique exact avec dénominateur NAV, liquidités, identités et poids, plus accès automatisable autorisé. Les classements existants ne prouvent pas un recouvrement intégral |
| Autres limites déjà documentées : Mining, QYLD, L&G, Nikkei, livres dont total/couverture refusés | Identités contradictoires, paniers de substitution, conditions non qualifiées et photographies incompatibles conservés dans chaque ligne | Aucun nouveau document concluant n’a été obtenu sur ces cas dans ce lot ; aucune ancienne acquisition n’est présentée comme une nouvelle résolution |

[Preuve S&P locale/GitHub distincte](preuve-sp-native-refus-2026-11-13.json), [GlobalX](globalx-source-control.json), [pisteWisdomTree](preuve-wisdomtree-piste-regionale-2026-11-13.json). L’échec d’une source primaire demeure séparé du succès d’une alternative : Defence conserve son livre de secours qualifié sans prétendre réparer ses tables primaires incomplètes.

## Matrices et preuve de publication

[694entrées](compositions-expositions-2026-11-12.csv) et [86indices](compositions-indices-2026-11-12.csv) sont actualisés dans **les mêmes fichiers de suivi**. Les suffixes12Nov sont conservés pour maintenir les liens ; les colonnes13Nov et preuves datées distinguent l’état courant. Aucun actif ni identifiant supprimé.

Requalification des694entrées par **le moteur effectif** `sharedPositions/catalogCoverage` :538admissibles dont411actions directes (pas538fonds),103partielles,53nonapplicables au recouvrement des sociétés. Les86indices conservent52fiches sélectionnables et37vues de dixentreprises :10natives et27approximations de fonds explicitement identifiées ; ce n’est pas37livres complets natifs d’indices. Sept des dix natifs reposent sur livres complets, trois sur dixentreprises déjà certifiées. Aucune ventilation de pays/secteurs n’est assimilée à un livre intégral.

Le producteur ETF du13Nov a livré42observations iShares,37Amundi,9SSGA,126supplémentaires,107résultats d’indices réussis et4nonapplicables, avec2échecs natifs S&P. **Ces résultats ne certifient pas tous les champs absents ni les livres complets indépendants.** Les rapports individuels et leurs véritables champs sont joints : [preuve](preuve-collecte-etf-individuelle-2026-11-13.json). SPYL et les111entrées liées au manifeste ont leur reçu de consommation distinct : [preuve initiale79entrées Git +32projections générées](public-inputs-initial-binding.json).

Les crons fournisseurs postcorrectifs sont documentés au moment réellement observé, pas à leur seule heure nominale : [passages](preuve-passages-planifies-2026-11-13.json). Les anciens rapports et tentatives échouées restent dans Git et l’[archive du commentaire#881](historique-commentaire-881-avant-13nov.md). Automatisation complète **non démontrée** sur les livres et accès bloqués ci-dessus.
