# Compositions prioritaires — 29 octobre 2026

## Changements réellement acquis

| Support | Avant | Après acquisition ordinaire locale |
|---|---|---|
| WisdomTree Battery Solutions — IE00BKLF1R75 | Classement du 23 octobre, 111 actions, somme arrondie 100,0004 %, taux intégral refusé | API native du 28 octobre : 111 actions identifiées, 99,39972904817284 % de NAV ; 0,6002709518271457 % de liquidités publiées ; aucune renormalisation |
| WisdomTree Global Quality Dividend Growth — IE00BZ56SW52 | Classement du 23 octobre, identité Merck non qualifiée, 97,1431 % identifié | API native du 28 octobre : 439 actions identifiées, 98,21244781256102 % de NAV ; 1,7875521874390112 % de liquidités publiées ; aucune renormalisation |

Le nouveau livre GGRA ne contient pas l’ancienne ligne Merck : son identité n’a pas été inventée ni considérée comme réparée. Les deux photographies ne sont pas mélangées.

Les dix identifiants provisoires Battery et les quatre GGRA sont prouvés par double requête indépendante : namespace CUSIP/CINS/SEDOL et ISIN, même FIGI, classe et type, ticker publié identique. Les FIGI de places secondaires exigent une nouvelle requête ISIN sur la place observée, incluant explicitement les cotations non listées lorsque nécessaire. Une classe commune ou un nom ne suffit jamais à affecter un ISIN. Les cinq dernières hypothèses utilisent le registre existant et une nouvelle requête exacte, pas un raccord manuel.

Les réponses indépendantes intégrales sont conservées sans perte dans le cache existant, encodées en gzip/base64 avec limite de décompression. Hashes et dates d’origine inchangés. La fixture immuable reproduit les 550 identités depuis les octets natifs et leurs reçus ; aucune dépendance aux prochains rafraîchissements du registre vivant.

## Consommation

Contrat explicite de poche actions complète : toutes les actions identifiées, livre daté rapproché à 100 %, seules des liquidités littérales omises, poids source conservés. Le contrat ne s’applique ni aux listes principales, ni aux identités inconnues, ni aux dérivés ou postes « autres ». Le seuil de couverture NAV des autres observations et le refus au-delà de 100,5 % restent inchangés. La concentration globale garde son propre contrôle de couverture ; le recouvrement porte sur les entreprises du périmètre qualifié, sans intégrer les liquidités aux entreprises.

Les collecteurs, workflow quotidien, registres et projections partagés sont réutilisés. Aucun texte de tweet, dessin PNG, profil, nouvel actif ou seuil de bundle modifié.

## Blocages confirmés, pas déclarés résolus

- **BNP Europe 600 — FR0011550193** : API officielle BNP accessible ; expose seulement dix positions de l’indice sans identifiants, et déclare 600 constituants. Son KID exact confirme une réplication synthétique. L’inventaire comptable du fonds ne peut remplacer la composition économique STOXX. Pas de composition économique intégrale qualifiée et réutilisable obtenue.
- **Amundi PEA Nasdaq-100 — FR0011871110** : API/page officielles accessibles ; dix composants d’indice seulement. Le téléchargement complet proposé concerne les actifs de substitution du fonds synthétique et reste exclu. Pas d’accès intégral Nasdaq qualifié obtenu.
- **Amundi PEA Immobilier Europe — FR0011869304** : exposition publiée partielle ; pas de composition intégrale FTSE/EPRA qualifiée et réutilisable obtenue.
- **Amundi PEA US Tech Screened — FR0013412269** : référence Solactive ISS ESG US Tech 100, distincte du Nasdaq-100. Le bouton public « Show Index Weights » rend techniquement disponibles 58 composants, mais ses conditions interdisent explicitement extraction automatisée et réutilisation sans accord écrit. Ces composants ne sont ni intégrés ni publiés. L’autorisation générale de l’utilisateur ne constitue pas cette licence ; question sur les accès sous licence envoyée pendant le travail, réponse non reçue à ce stade.
- **iShares MSCI World EUR Hedged — IE00B441G979** : livre natif valide comptablement, mais actions à 100,76218 % de NAV et change à terme négatif. Le périmètre brut/net reste incompatible avec l’allocation nette admise ; conservation de la dernière observation acceptée et du diagnostic distinct. Aucune division forcée par 100,76218 ni augmentation du seuil 100,5 %.

Ces cinq supports restent partiels ou en échec explicite. L’application n’est pas déclarée entièrement automatisée sur leurs compositions.

## Contrôles exécutés

- Collectes locales réelles via `collect_dca_complete_holdings.py --only ... --apply` : sept passages bornés, dernier reçu joint. Les preuves s’accumulent dans le cache partagé ; cadence partagée inchangée, nouvelles recherches bornées à vingt requêtes de placeholders et vingt hypothèses de places par support.
- 71 régressions WisdomTree réussies, dont reproduction des deux livres réellement qualifiés ; 25 tests Python DCA, suite `test:dca` et build local réussis. Lint exécuté avec avertissements préexistants. Recette navigateur/CI/publication à compléter avant livraison.
- Premier passage PR ordinaire **40964013892** : 182/183 compositions acquises ; accès API des deux fonds confirmé depuis GitHub ; refus World Hedged seul. Ce passage précède le cache complet final et ne prouve pas sa publication.

Fusion, déploiement, passage automatique final et recette publique ne sont pas encore revendiqués dans cette version du rapport.
