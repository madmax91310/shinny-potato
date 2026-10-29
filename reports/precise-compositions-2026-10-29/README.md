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
- 73 régressions WisdomTree réussies, dont reproduction des deux livres réellement qualifiés ; 25 tests Python DCA, suite `test:dca` et build local réussis. Lint exécuté avec avertissements préexistants. Recette navigateur/CI/publication à compléter avant livraison.
- Premier passage PR ordinaire **40964013892** : 182/183 compositions acquises ; secours Dataspan arrondi utilisé pour les deux fonds, refus World Hedged seul. Il ne confirme pas l’accès GitHub à l’API précise.

La recette Chromium locale finale vérifie 13 portefeuilles (complets, partiels, identifiants manquants, crypto/or, indices natifs, dates/périmètres incompatibles et rapprochement comptable), cohérence analyse/canvas/PNG téléchargé, ordinateur 1440 px et mobile 390 px. Les parcours de sélection, copie réelle, sauvegarde/ancien format et transport JSON à 1/2/8/50 lignes passent également. Deux exports du portefeuille GGRA/Battery inspectés visuellement.

Le renouvellement est anticipé dans la fenêtre existante (365 − 7 jours) ; un échec conserve la preuve encore valide, avec sa date d’origine. Les recherches négatives redeviennent éligibles après les sept jours du contrôle ordinaire, au lieu de bloquer une reprise pendant un an. La décompression du cache est bornée et les reçus complets sont vérifiés sans perte.

Master `51fe4c2`, dont #1057, intégré sans conflit ; build de l’arbre combiné réussi. Un huitième passage réel sans écriture vérifie le code final de renouvellement avec les 550 actions qualifiées.

Le passage PR40965305863 sur le cache complet refuse correctement deux régressions de date : l’API précise n’est pas acquise depuis GitHub, et le secours23octobre ne remplace pas les livres28octobre. Le transport navigateur passe désormais par le client public de la même fiche exacte, puis contrôle sa réponse API ; ni authentification ni résolution de challenge. Acquisition locale réelle du client public GGRA : mêmes169805octets et mêmeSHA256 que le fichier natif. Les diagnostics de régression conservent les tentatives d’accès, pour ne plus masquer une panne primaire derrière le seul libelléDateRegression.

Fusion, déploiement, passage automatique final et recette publique ne sont pas encore revendiqués dans cette version datée du rapport.


## Qualification distante finale : blocage conservé

Les trois environnements GitHub testés refusent les mêmes accès publics WisdomTree par HTTP403 : Ubuntu24.04 x64 (run40966893268), macOS15 ARM64 (run40967996438, job123777287958), Ubuntu24.04 ARM64 (run40968365058, job123778534671). API et fiches produits publiques sont toutes refusées. Le client navigateur ordinaire échoue aussi ; aucune résolution de challenge ni authentification n’est utilisée. Les deux qualifications de runtime ciblées réemploient le même producteur, sans écriture ; leurs reçus sont joints. Les jobs expérimentaux ne restent pas dans le workflow final, qui conserve son environnement et sa chaîne habituels. Les anomalies demeurent visibles dans la collecte ordinaire, avec la dernière observation valide conservée.

Les550identités sont qualifiées sur les acquisitions locales réelles. Leur collecte précise **n’est pas déclarée opérationnelle depuis GitHub**. Un accès de production autorisé et durable est nécessaire ; question envoyée à l’utilisateur, réponse non reçue à ce relevé. Les derniers refus ne réécrivent ni date financière ni date du succès précédent.

Le rapport EPRA public `https://crm.epra.com/media/MMR%20September.pdf`, réellement lu, porte notamment sur le Developers Benchmark, distinct du FTSE EPRA Nareit Developed Europe ; ses poids ne sont pas utilisés comme substitution. Les anciennes routes publiques STOXX de composants testées répondent404. Aucun de ces essais ne justifie une composition intégrale.

Les rapports et projections régénérés sont retirés du diff de PR conformément àCLAUDE.md : leurs générateurs existants les reconstruisent depuis les registres qualifiés au build. Le rapprochement avec masterf220bc7 conserve toutes les autres observations automatiques ; seuls les deux livres natifs plus récents sont retenus, aux dates d’origine. Aucun incident de suivi n’est déclaré résolu sur les seules preuves locales.


## Vérification finale du code et des données locales

Le registre conserve les routes natives par un identifiant de méthode versionné partagé Python/Node. Les anciennes observations gardent leur compatibilité ; modifier la description humaine ne désinscrit plus le collecteur, et une version inconnue est refusée. Le test du parcours découverte→génération→plan du producteur vérifie les six parts existantes. Les projections transmettent cet identifiant sans changer les poids.

Dernière acquisition ordinaire locale : 29octobre22:59:40UTC, deux livres du28octobre, 550actions, aucune identité inconnue. Reçu et synthèse joints ; aucun passage GitHub réussi de ces deux API n’est revendiqué. Nouveau build complet et nouvelle recette13portefeuilles après le raccord versionné réussis. Le générateur de portefeuilles et les duels ont aussi été parcourus sur mobile et ordinateur. La synthèse50/50 contient542titres distincts, huitentreprises communes, recouvrement1,5851925825662696% des poids NAV et couverture actions98,80608843036683% ; les liquidités ne deviennent pas des entreprises.

Les signatures, emojis, textes et squelette d’image n’ont pas été modifiés. Les sauvegardes, profils classiques/polémiques, copie réelle, imports/exports et ancien format ont été exercés. Publication effective et recette du site en ligne seront consignées dans la PR avec leurs SHA et exécutions, une fois accomplies.
