# Reliquat après publication f45c20c2 / b62c57d4 — 16 novembre 2026

| Cause | Pièce exacte et prochaine action utile |
|---|---|
| Six fenêtres refusées sur le groupe constant de 79 | Voir le CSV individuel : cinq parts, périodes, outils, bornes et résidus. Pour quatre cas Amundi, prouver la politique historique de revenus, la complétude des distributions et la convention ajustée ; la réponse actuelle est ambiguë. Pour Bitwise 2021, obtenir décembre 2020 ; Paris commence en juin 2021. Pour iShares Retail 2019, obtenir unités/facteurs et bornes exactes XETR 2018/2019 |
| Palladium | Deux restrictions distinctes : NAV décembre 2014 et cotation 2025. Obtenir les bornes et facteurs propres à chacune ; les voies indépendantes utilisables restent disponibles |
| WisdomTree | Voie officielle de livre natif fonctionnant depuis Actions, et classe actuelle nCino pour WCLD. Ne pas répéter les mêmes 403 sans nouvelle piste ; classement sans NAV et XLSX de calendrier non qualifiés |
| Uranium | Valorisation des deux contrats ZAR et identité exacte des deux classes Verdera. Conserver les 72 lignes et valeurs inconnues ; ne pas déduire zéro ni un ISIN du nom |
| Russell / S&P | Livre économique exact daté, poids et identités permettant la consolidation des entreprises ; source native accessible et conditions d’utilisation qualifiées. S&P reste attribué à #1253, substituts explicites préservés |
| LifeStrategy | Photographies compatibles des fonds parents et sous-jacents, puis couverture des obligations et liquidités. Transparisation actions partielle conservée sans renormalisation |
| Deux dossiers 13F | Unité exacte des déclarations Druckenmiller/Klarman ou autre voie indépendante qualifiée. Le faux incident de copie de rapport est corrigé séparément, pas ces deux montants |
| Conflits documentaires et financiers | Deux qualifications PEA, QYLD à date identique, BCOM Other à −0,11 % et top 10 d’indice contradictoire : preuve explicite nécessaire ; aucune valeur choisie arbitrairement |
| Ancienne publication onboarding 41639923023 | Reçu 13232852348 retrouvé, sept empreintes anciennes différentes des fichiers actuellement servis. Une publication ultérieure ne prouve pas que les octets anciens ont été servis ; conserver cette limite historique |
| Autres reliquats connus | Linxea Vie : plage de taux non qualifiée ; ACPR : PDF fonds-euros inaccessible ; XTB : brochure officielle absente ou ambiguë ; flux ETF manuels ; document JEPG expiré ; tables pays primaires iShares périmées malgré le secours opérationnel. Dernières valeurs et dates conservées, aucune réparation revendiquée ici |
| Compléments concurrents | #1355 renforce la reprise SCPI : neuf résultats source et enregistrement604d5407 prouvés par push43873060316 ; publication encore à observer, sans preuve de cron ou de branche conditionnelle. #1356 et #1357 sont en cours ; leurs fichiers ne sont pas repris ici |
| Déclenchements et passage annuel | Aucun cron fournisseur postcorrectif du 16 novembre visible à 13:24 ; les crons du moniteur ne les remplacent pas. Voir passages-planifies.json pour les échéances nominales. Fin 2026 et janvier 2027 restent des observations futures |

L’export courant conserve tous les diagnostics et le rapprochement conserve les 1 218 identités initiales. Regrouper ces causes ne supprime aucun impact. Les limites ne sont pas déclarées réparées par une recette supplémentaire et ne permettent pas d’annoncer une automatisation complète.


---

# Archive du bilan précédent — état daté, ne pas confondre avec la livraison ci-dessus

# Limites conservées — chantier consolidé #881

Relevé 2026-11-15T23:44:48.417698+00:00. Code public `fdf1b581402f909f04d1e4f6bfe98126742b0c20`, données `eb865db0b760ed5b47fdfd003bf51df60e92a14c`, voie `validated-data`. Suivi unique [#881](https://github.com/madmax91310/shinny-potato/issues/881). Les preuves antérieures restent datées ; ce complément ne les réécrit pas.

## Historiques

Le groupe constant contient 79 fenêtres : 73 qualifiées préservées, six refusées sur cinq parts. La liste individuelle est dans `historiques-six-fenetres-refusees.csv`. Il ne s’agit pas du dénominateur de tout le catalogue. Les 77 anciennes divergences et deux résidus restent suivis séparément.

- DE000A0H08P6/2019 : unités et facteurs officiels de la cotation XETR aux bornes 28/12/2018–30/12/2019 ; résidu 2,44422892 points.
- DE000A27Z304/2021 : borne EUR décembre 2020 et continuité exacte. Paris commence en juin 2021 ; le graphique annuel ne fournit pas la borne manquante. La voie Paris et le contrôle quotidien Xetra ne réparent pas l’ancienne série mensuelle Xetra. Le 15 novembre, le fournisseur expose firstTradeDate=2026-11-05 et seulement sept séances quotidiennes ; la requête historique bornée retourne 400. `range=max` renvoie des points horaires, non qualifiables comme historique mensuel. Pièce requise : historique exact antérieur et continuité documentée ; aucune date de lancement financière déduite de cette limite technique. Voir `preuves/bitwise-historical-provider-limit.json`.
- FR0010755611/2021 et 2024 : facteurs, revenus et convention aux bornes CL2.PA ; résidus 5,62997039 et 2,54861047 points. La nouvelle lettre officielle du 26 janvier 2024 concerne la durée recommandée de détention, explicitement sans impact sur la valeur. Elle ne prouve ni split ni distribution.
- FR0013411998/2025 et FR0013412004/2025 : horaires, revenu et ajustements des bornes déjà recoupées ; résidus 2,67685035 et 2,13251246 points.
- Palladium IE00B4556L06 : NAV 2025 qualifiée mais décembre 2014 refusé ; cotation décembre 2014 qualifiée mais fenêtre 2025 refusée. Les deux conventions ne sont pas interchangeables.

Pièce utile suivante : observations officielles contemporaines des bornes, facteurs/distributions et identité de la cotation. Une nouvelle collecte identique ne suffit pas.

## Compositions et expositions

- WisdomTree : livres natifs WDEF IE0002Y8CX98, WQTM IE000W8WMSL2, WTAI IE00BDVPNG13, GGRA IE00BZ56SW52, VOLT IE00BKLF1R75 et WCLD IE00BJGWQN72. L’accès automatisé GitHub reste refusé (403). Les livres conservés et les chemins de secours ne prouvent pas la réparation de l’accès natif. Il faut un export officiel autorisé et fonctionnel depuis GitHub, de même identité et périmètre.
- WCLD : nCino 1,65809 %. Nouvelle preuve Nasdaq ECA2022-1 : changement 63947U107 → 63947X101, effet boursier le 10 janvier 2022. Les trois requêtes indépendantes confirment que le FIGI du livre BBG00XTV91S5 désigne l’ancienne classe US63947U1079. La succession explique le conflit, mais ne confirme pas à elle seule la position exacte du fonds en 2026. Pièce restante : livre corrigé ou confirmation de l’émetteur reliant cette ligne à la classe successeur US63947X1019. Aucun remplacement silencieux ; poids conservé. Voir `preuves/ncino-continuity-investigation.json`.
- Global X Uranium : contrôle officiel local du 15 novembre à 11:04 UTC, photographie 12 novembre. La ligne CURRENCY CONTRACT — ZAR n’a ni NET_ASSETS ni MARKET_VALUE ; deux identités Verdera restent non qualifiées. Il faut les valeurs/identités officielles, pas zéro. Ce contrôle local n’est pas un nouveau passage GitHub. La page officielle alternative a aussi été examinée le 15 novembre à 12:21 UTC : son livre embarqué de 72 lignes conserve deux contrats ZAR sans valorisation ni poids (quantités −59 694,77 et −10 853,93). Les deux autres contrats portant explicitement 0 % sont distincts. Voir `preuves/uranium-official-page-alternative-proof.json`.
- Russell 1000 : livre identifiable complet de la même photographie manquant ; 1 023 titres de juin et 1 022 d’octobre ne se combinent pas en une couverture actuelle. Les titres ne sont pas des entreprises consolidées.
- S&P Global et Euro Dividend Aristocrats : accès natif toujours 403 dans le producteur ordinaire 43715089091. Les substituts et relais qualifiés restent utilisables dans leurs limites ; #1253 conserve la piste native.
- LifeStrategy 20/40/60/80 : cron ordinaire 43716281467 observé le 15 novembre, quatre fiches renouvelées et sous-jacent IE00BK5BQW10 désormais au 31 octobre. Les parents restent au 30 septembre : les nouvelles dérivations 60/80 sont refusées, leurs livres valides conservés. Pièce manquante : portefeuille exact du sous-jacent au 30 septembre, ou ensemble de photographies parent/sous-jacents compatibles à une date ultérieure. Le contrôle du schéma public GPX en lecture a été interrompu sans réponse, aucune voie datée n’est donc qualifiée.  transparisation des poches actions de septembre, environ 20,27/39,91/59,77/79,70 % du fonds ; pas de livre complet actions+obligations+liquidités. Le recouvrement intégral reste interdit.
- Global X QYLD IE00BM8R0J59 : poids contradictoires à date égale, aucune préférence arbitraire entre sources.
- BCOM : Invesco IE00BD6FTQ80 et iShares IE00BDFL4P12 (même ventilation exacte d’indice publiée par Invesco, provenance commune conservée) : poids publié « Other » −0,11 % incompatible avec le contrôle existant ; nouvelle extraction ou explication de périmètre requise. Seuil inchangé. Nouvelle piste native Bloomberg testée en lecture le 15 novembre à 13:34 UTC : page officielle des indices de matières premières et document candidat BCOM-Fact-Sheet, tous deux refusés HTTP 403. Aucun document ni poids alternatif qualifié ; détails dans `preuves/bcom-official-alternative/`.

Les admissions et limites de chaque entrée DCA/expositions sont dans `compositions-usages-dca-expositions.csv`. Une admission ne prouve pas un cron fournisseur. Les actions détenues directement ne sont pas comptées comme des fonds à composition collectée.

## Autres limites conservées

Linxea Vie : conditions et historique officiel des rendements exacts encore incomplets ; ACPR : accès refusé ; XTB : correspondance exacte du document à qualifier ; flux ETF manuels : pas de voie durable démontrée. Les deux qualifications PEA restent inconnues/conflictuelles sans preuve explicite. Radar volontairement arrêté, Portefeuilles IA supprimé : pas de panne à réparer ni d’automatisme à réactiver.

## Observations futures

Une exécution sur push ou une reprise manuelle ne prouve pas un cron. Les passages planifiés postcorrectifs non observés restent à vérifier. L’acquisition des dernières bornes de décembre 2026 et la publication des performances annuelles 2026 nécessitent janvier 2027 ; les tests isolés de changement d’année ne constituent pas cette preuve.

## Limites opérationnelles du complément

Les anciennes erreurs iShares restent tracées individuellement ; les nouvelles acquisitions GitHub qualifiées remplacent leur statut courant seulement pour les champs contrôlés. Le cron 13F du 15 novembre est désormais prouvé, avec 28 contrôles sans nouvelle déclaration. Les crons mensuel et ETF postcorrectifs restent à observer aux échéances jointes. Les livres complets comportent encore 11 refus individuels, qui ne sont pas effacés par les 194 réussites. Les anciennes divergences financières ne sont pas clôturées par une autre voie utilisable. Les futurs relevés de janvier 2027 restent nécessaires.

## Conflits 13F apparus après l’enrichissement SEC

Druckenmiller : table SEC 5 210 856, fournisseur 5 210 856 000 USD. Klarman : table SEC 5 045 853, fournisseur 5 045 853 000 USD. Les deux tables SEC transformées indiquent explicitement « VALUE (to the nearest dollar) » : aucune multiplication automatique par 1 000 justifiée. Fundsmith : SEC 13 648 923 682 USD/41 lignes, fournisseur 18 167 841 425 USD/42 lignes positives sans CUSIP ; périmètre et rapprochement exact à confirmer. Pièces requises : correction ou explication officielle des unités des deux premières déclarations ; positions identifiables et périmètre comparable pour Fundsmith. Voir `conflits-13f-actuels.csv` et preuves par document. Les dernières positions datées restent conservées ; trois exports monétaires refusés.

La reprise indépendante iShares #1339 est testée avec une réponse officielle et des scénarios isolés ; les derniers passages ordinaires ont réussi sur leur réponse primaire. Ils ne prouvent donc pas le déclenchement conditionnel de cette nouvelle branche en production. Les crons post#1336/#1339 et le cron du collecteur SEC enrichi restent distinctement attendus.
