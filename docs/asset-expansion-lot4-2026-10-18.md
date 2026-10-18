# Actifs manquants — lot 4 (18 octobre 2026)

Suite de la feuille de route (lots 4 à 7). Chiffres recomptés sur `master` du 17 octobre au soir
(`docs/asset-tool-routing.json`) avant intervention.

## Constat

| Mesure | Valeur |
|---|---|
| Actifs présentés (fiche, comparatif ou profil DCA) sans historique automatique | 77 (76 ETF + TSMC) |
| … dont aucune cotation enregistrée dans le registre | 52 |
| … dont cotation documentée mais série jamais collectée | 9 |
| … dont série collectée trop courte pour la génération automatique (< 6 années complètes) | 16 |
| Cotations collectables (place, devise EUR/USD, preuve) non supportées | 0 |
| Qualifications Yahoo échouées | 0 (215 validées, 1 en attente : IE00B0M62X26) |

La chaîne de raccordement était donc saine mais aveugle : rien n’entrait faute de cotation. Trois
causes expliquaient les 52 actifs sans cotation.

| Cause | Actifs | Correction |
|---|---|---|
| Le collecteur de métadonnées interrogeait l’API Amundi en GET : réponse « 405 Method Not Allowed », aucune métadonnée ni cotation pour 46 instruments Amundi (18 d’entre eux sans aucune cotation) | 18 | `collect_instrument_metadata.py` interroge l’API en POST (même client que la collecte Amundi), lit la politique de distribution, la méthode de réplication et la table `LISTINGS` de la part exacte |
| Pages produit DWS (`pdpMetaTagsTealium`) sans parseur : « No qualified structured metadata parser » | 10 | parseur de la table « Stock exchange » de la page produit (place, devise, ticker Bloomberg, RIC Reuters), identité ISIN unique exigée sur tout le document ; testé sur la fixture `dws-exact-share.json` |
| Fiches et pages Vanguard, SPDR, Invesco, WisdomTree, Global X, VanEck, UBS, HSBC, BNP lues correctement mais sans ligne de cotation à chercher | 23 | `scripts/listing-candidates.json` : 71 lignes candidates (place, devise, ticker, symbole Yahoo) injectées dans les cibles du collecteur par `build-automation-targets.mjs` ; une ligne n’entre au registre que si le document officiel la contient (place, devise et ticker sur la même ligne) |
| TSMC (ADR) | 1 | action, hors du collecteur ETF ; reste à traiter avec les identités d’actions |

Les alias de places des fiches émetteurs (« EURONEXT P », « XETRA », « SIX SWISS ») sont reconnus.
Deux documents ne pourront pas confirmer leurs lignes tels quels : la fiche HSBC ne porte pas la
place sur la ligne du ticker, la fiche BNP Easy S&P 500 sépare devise et place. Leurs candidats
restent déclarés et attendent un autre document officiel.

## Ce que fait la chaîne ensuite, sans intervention

1. `update-instrument-metadata.yml` (quotidien, 09 h 20 UTC) renouvelle les métadonnées : les
   cotations Amundi, DWS et les lignes candidates confirmées entrent dans
   `automated-instrument-metadata.json`, donc dans `INSTRUMENT_LISTINGS_BY_ISIN`.
2. `update-market-monthly.yml` exporte les candidats (`export-monthly-candidates.mjs`, douze
   ISIN par passage), qualifie les séries Yahoo (`qualify_monthly_candidates.py`) et les ajoute aux
   historiques mensuels, aux duels, aux classements, aux anniversaires et au Générateur dès que six
   années complètes existent. Les neuf cotations iShares enregistrées le 17 octobre au soir sont déjà
   dans la file du prochain passage.
3. `docs/asset-tool-routing.{json,md}` portent désormais une colonne « Blocage » par actif présenté
   sans historique automatique : `no-listing`, `listing-not-collectable`, `qualification-failed`,
   `collection-pending` ou `history-short`, avec la cause relevée (erreur du collecteur, années
   complètes). `test-asset-routing-blockers.mjs` (portail de déploiement et collecte mensuelle)
   exige une cause pour chacun et contrôle les lignes candidates (place collectable, symbole
   cohérent, aucune copie d’une cotation déjà vérifiée).

## Limites

- Aucune collecte n’a pu être exécutée depuis cet environnement : les hôtes des émetteurs et Yahoo
  sont inaccessibles. Les parseurs sont testés sur fixtures ; la première exécution réelle est la
  prochaine collecte programmée. Les causes affichées dans l’audit se mettront à jour à cette occasion
  (les mentions « 405 » et « No qualified structured metadata parser » disparaîtront).
- Les tickers candidats proviennent de recherches croisées (pages émetteurs, Deutsche Börse,
  communiqués) et non d’un relevé direct : ils ne sont que des hypothèses à confirmer par le document.
- Les seize séries trop courtes (lancements 2023-2025 : WPEA, PEA Luxe, défense, quantique, iBonds…)
  n’ont pas de raccourci : six années communes restent requises en génération automatique
  (`docs/generator-expansion-2026-10-16.md`), et les duels exigent trois années.
- Domicile et éligibilité PEA ne sont pas publiés par l’API Amundi ni par la page DWS sous une forme
  explicite : ces champs restent « en attente » pour ces émetteurs, sans déduction depuis l’ISIN.
