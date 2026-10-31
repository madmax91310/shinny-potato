import pathlib,json,csv,gzip,collections,datetime
root=pathlib.Path('/dev/shm/data-automation-20261028');out=root/'consolidated-30oct';base=pathlib.Path('/workspace/finalisation-donnees-20261027')
actual=json.loads((out/'actualisation-30oct.json').read_text());matrix=json.loads((out/'matrice-bilan.json').read_text())
release=json.loads((root/'proofs-29oct/final-release-proof-30oct.json').read_text())
with (out/'statut-19-actions.csv').open(encoding='utf-8-sig')as f:actions=collections.Counter(r['statut']for r in csv.DictReader(f,delimiter=';'))
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
head=f'''# Reprise consolidée des30–31octobre2026 — état courant vérifié

Relevé final : {now}. Code/données réellement servis et empreintes : `preuves/reprise-2026-10-30/final-release-proof-30oct.json`. Les sections plus anciennes ci-dessous sont des photographies historiques ; leurs compteurs ne décrivent pas la boîte courante.

## Résultat livré

Les corrections de publication/enregistrement (#1067/#1070/#1081/#1084), les collectes mutualisées WisdomTree (#1077/#1080/#1068/#1088) et les publications officielles partielles (préparées#1087 puis regroupées#1088) sont distinguées des qualifications de supervision (#1074). Les preuves exactes et les limites de chaque lot figurent dans le reçu de livraison, sans certification globale d'un champ non contrôlé. Les lots indépendants #1073/#1075/#1079/#1083/#1085/#1086/#1089/#1091/#1098 sont préservés et attribués à leurs travaux d'origine.

- Quinze encours WisdomTree natifs : trois producteurs ordinaires, valeurs/devise/périmètre/date/hash vérifiés, 30exports PNG et15exports JSON publics exercés. Aucun encours USD d'une autre cotation substitué au montant natif.
- Six allocations pays WisdomTree : photographie source réelle, définition IncorporatedCountry qualifiée, 24recettes publiques mobile/ordinateur. Douze contrats effectivement utilisés sont démontrés ; les six exports Bibliothèque sans pays sont non applicables.
- WTI/WTAI : renouvellement source ordinaire de70/94mois sans changement d'aucune des250séries financières ; calcul unique/DCA EUR/USD, Performance depuis et les deux classements exercés. Les cinq voies supplémentaires Copper/Coffee/Cocoa/NaturalGas/Wheat ont une preuve individuelle GitHub ; enregistrement/publication et recettes finales : reçu de livraison.
- INSEE : quatre flashs provisoires du mois non clos conservés séparément des historiques ; septembre reste le dernier mois utilisable au30octobre. Aucun taux, indice ni unité inventé. Tudigo reste cessée, accès RunOff désormais ouverts et migration en cours ; anciennes conditions toujours datées. Le référentiel IWM conserve la position signée mais fournit seulement des classifications exactes par ISIN, sans importer ses poids dans un fonds consommateur.

## Périmètre réconcilié

Export public complet : {sum(actual['allByClass'].values())}identités, classes {json.dumps(actual['allByClass'],ensure_ascii=False)}. Boîte active : {sum(actual['activeByClass'].values())}identités, classes {json.dumps(actual['activeByClass'],ensure_ascii=False)}. Une qualification n'est pas une panne ; une même cause peut toucher plusieurs champs et outils. Les attributions génériques de la boîte ne constituent pas une preuve que tous les outils listés consomment le champ.

Les661identités initiales et toutes les identités du suivi antérieur sont conservées. Les colonnes datées30octobre distinguent présence active, événement de résolution explicite, conservation historique et absence sans preuve. Aucune absence d'un export ne devient une résolution. Le suivi courant reste#881 ; #583 reste historique, sans troisième suivi.

La matrice unique conserve tous ses contrats antérieurs et les{matrix.get('additionalDatedBudgetRecords',30)}profils de budget déclarés ou préparés, datés, non assimilés à une collecte bancaire. Le fichier `matrice-bilan.json` donne les dénominateurs exacts par donnée logique et couple donnée×usage ; A signifie preuve bornée, B qualification/blocage précis, non applicable ne signifie pas donnée manquante. Aucun taux global d'automatisation n'est annoncé.

## Rétablissements financiers complémentaires

PR#1096 et#1097 fusionnées après validation : Copper est utilisable en manuel/Duels sur six calendriers annuels NAV exacts. AmundiFR0013412004 etHSBCIE00B4K6B022 disposent désormais d’une route EUR NAVTR annuelle prioritaire dans ces mêmes moteurs. Ces voies ne sont pas comptées comme nouvelles fenêtres mensuelles.

Le getter partagé conserve les calendriers exacts partiels au lieu de les remplacer par un autre produit. Six calculs annuels de portefeuille sont corrigés (deux autres getters étaient déjà correctement datés dans les moteurs). CoinSharesBTC/ETH conservent quatre années2022–25, Bitwise cinq années2021–25 : aucun cours spot antérieur n’est emprunté. Les recettes automatiques utilisent seulement leurs options déjà admises et six années réelles communes ; le minimum n’est pas abaissé. Les tests de construction existants sont conservés.

Quarante scénarios publics ont vérifié dix parts dans les deux moteurs, avec copie, aperçu et40PNG réellement téléchargés ; les calendriers CoinShares portent bien sur quatre années, malgré un libellé générique «six-year» du journal de recette. Trois autres portefeuilles DCA contenant les huit nouvelles références économiques ont été vérifiés publiquement : recouvrements/analyses/canvas et troisPNG identiques aux aperçus, deux largeurs ; les deux références physiques restent approximatives.

Les bulletinsT3 SCPI sont réellement enregistrés par la reprise automatique bot41126561155, puis publiés et vérifiés jusqu’aux quatre PNG publics. Ce workflow_dispatch automatique n’est pas un cron. INSEE etIl y a X ans ont également quatre recettes publiques avec registres effectivement publiés. La preuve IWM est une référence de classification de1974identités, pas une composition pondérée substituée. Les nouveaux contrôles ne renouvellent aucune période financière ancienne. La reprise13F41132216612 a contrôlé28gestionnaires (27inchangés-vérifiés et1succès) et enregistré2025388 ; la période des positions reste distincte de celle de la consultation. Le reçu final précise la publication et les contrôles du consommateur.

## ABTC : incident API et fraîcheur distincts

Le rapport original41135102229 contient un échec de performance sur l’API primaire21Shares. Le lien PDF affiché dans l’export ne prouvait pas que ce document avait échoué : sa consultation réelle donneHTTP200, empreinte8e44e9f… et encours29septembre. Cette attribution initiale est rectifiée ; l’ancien rapport reste conservé. L’endpoint précis de l’ancien410 n’était pas enregistré : il n’est pas inventé rétroactivement.

La PR#1104 utilise le même produit exactCH0454664001 pour renouveler l’encours et les frais à partir des champs que le client officiel associe explicitement àtotal_nav etannual_fee. La période vient devaluation_date pour l’encours, jamais pour les frais. Trois requêtes API partagées, aucune reconstruction d’encours ni nouvel ajustement du split. Une erreur future conserve sonURL réelle dans les résultats ETF/anniversaire, avec les dernières valeurs valides datées.

Les collectesPR41145068324 et41145068358 ont vérifié individuellement les champs du produit et les deux variantes anniversaire. L’encours618385969,835628USD au30octobre, frais1,49% et calendriers2020–2025 ont leurs réponses brutes/empreintes. L’état après fusion, enregistrement, publication et recettes publiques est donné séparément dansabtc-delivery-state-31oct.json ; un succèsPR ne constitue pas une livraison publique. Le secours secondaire découvert n’est pas activé. Aucune des neuf fenêtres mensuelles n’est déclarée rétablie par cette amélioration.

## Conflits DWS : preuve nouvelle et défaut corrigé séparément

Les photographies originales du producteur Radar41136960119 sont conservées, sans leur attribuer une nouvelle date de contrôle lors de leur relecture. Neuf fonds,18agrégats pays/secteurs : concordance exacte avec les registres effectivement publiés. Sur109conflits pays,97propositions correspondent à des lignes explicites ;12concernent un pays absent. Neuf de ces absences proviennent de sources entièrement classées. Les trois autres ne prouvent pas zéro : IE00BTJRMP35 conserve0,209237% non classés (Australie/Singapour) etIE000L6ZMMC4 conserve1,499781% non classés (Uruguay).

Le correctif#1102, fusionnéfa82582, est réellement exécuté par le producteur ordinaire41142238317. Les trois conflits pays et leurs anciennes dates sont conservés, aucune proposition0 n’est renouvelée. Les mêmes contrôles signalent aussi deux secteurs non qualifiés surIE00BM67HS53 : les anciens zéros restent datés, ils ne sont pas présentés comme des données réparées. Le flux effectivement consommé sur le Radar public expose les trois qualifications sur ordinateur/mobile ; les pannes fournisseurs sans rapport restent explicites et rendent le run global partiel. Le correctif bloque précisément ces inférences de zéro et leur réadmission depuis une ancienne proposition. Les conflits, poids inconnus et dates anciennes sont conservés ; les champs explicitement sourcés restent disponibles. La collecte et l'affichage des répartitions natives fonctionnent déjà : ces109lignes ne sont pas109pannes fournisseurs. Leur réconciliation automatique conserve le délai de stabilité4h existant (au plus tôt31octobre00:35UTC pour la photographie étudiée). L'explication des anciennes valeurs et le contrôle après publication restent séparés. Preuves détaillées : dws-nine-published-snapshots-reconciliation-30oct.json, dws-radar-proposals-vs-published-30oct.json et dws-pending-stability-public-impacts-30oct.json.

## Fenêtres financières et limites

Le périmètre constant reste79couples part×année :70fenêtres mensuelles qualifiées et9refusées sur6parts. Zéro nouvelle qualification dans cette reprise. Les calendriers annuels déjà disponibles ne sont pas comptés comme nouveaux usages mensuels. Les77anciennes divergences et2résidus restent séparés des voies indépendantes utilisables.

Les neuf lignes ont leurs recherches et pièces manquantes individuelles dans `reconciliation-79-ecarts.csv` : Retail2019 (vraie borne NAV31décembre et facteurs de distributions avril/juillet), Bitwise2021/2023/2024 (profondeur quotidienne officielle manquante), Amundi2021/2024 et deuxparts2025 (documents de distributions/identité/période insuffisants), HSBC2024 (contradiction FCA/Euronext conservée ; aucun double ajustement). Une page vide ou un rapport sans distribution n'a jamais été assimilé à zéro.

Brent/Cloud : les essais alternatifs refusés ne remplacent pas le dernier succès de la route canonique du producteur complet41072651357 ; son contrat684résultats explicites est archivé. Battery/GGRA :403 natifs et alternative23octobre plus ancienne que les livres28octobre conservés. Uranium : contrat ZAR sans poids publiés ; WorldHedged : brut100,6414% et net100,00007% incompatibles avec l'admission existante, sans renormalisation. Quantum100,0002% reste partiel. Deux statuts PEA restent conflit/inconnu. Les contradictions DWS/SPDR/Bitwise et les dates de compositions ne sont pas effacées par une nouvelle photographie.

Le tableau `bilan-par-outil.csv` précise les fonctions opérationnelles, l'actualisation partielle et les périodes bloquées pour chacun des24outils/routes. Les chiffres personnels, hypothèses, archives et champs non applicables restent distincts des données vivantes. PortefeuillesIA demeure supprimé ; aucun de ses automatismes n'est réactivé.

## Preuves d'exécution et réserves

Les25automatisations communes annoncées correspondent à24entrées du registre de supervision (21producteurs ou orchestrateurs de données, troiscontrôles/pilotes/code) et au publieur partagé. Ce décompte ne représente pas25fournisseurs distincts. Tous les fichiers existent ; les sondes CI supplémentaires ne sont pas des collecteurs planifiés. Une vérification individuelle des artefacts apporte une preuve supplémentaire : six encours natifs WisdomTree sont collectés, validés, enregistrés et publiés par la première tentative planifiée41068552867. Sept autres sont réellement collectés sur la première tentative planifiée41068013127, mais cette tentative échoue à l’enregistrement ; son succès ultérieur après relance ne réécrit pas cet échec. Les deux autres encours n’ont pas de nouvelle preuve planifiée qualifiée ici. Les13champs exacts et leurs26consommateurs sont indiqués individuellement ; aucun autre champ du même workflow n’est certifié. Les métadonnées des derniers cron sont archivées, mais un cron de supervision ou un workflow vert ne certifie aucun résultat individuel. Les exécutions ordinaires manuelles/push sont identifiées comme telles ; aucun passage fournisseur après correctif n'est revendiqué sans preuve. Les deux périmètres anciens incomplets restent des limites historiques.

Statuts des19actions : {json.dumps(dict(actions),ensure_ascii=False)}. P1-04 est réouverte en partielle sur preuve actuelle de deux accès complets WisdomTree refusés et d'un secours trop ancien. Le changement de compteur n'est pas masqué. Le correctif#1099 est fusionné ; les enregistrements ordinaires déjà observés ne prouvent pas automatiquement sa branche conditionnelle de recalage. Le correctif#1100 est fusionné après149régressions de supervision et un rejeu des vraies étapes13F ; sa consommation publiée est vérifiée séparément. La branche conditionnelle du nouvel adaptateur mensuel possède des rejeux Git réels et tests CI ; sa vérification en production reste distincte du fonctionnement des autres branches.

La PR#1099 garde une réserve fournisseur explicite : son contrôle en lecture seule a reçuHTTP500 sur le PDF UBSIE00BD4TXV59. Le producteur ordinaire41130420592 avait réellement validé et publié le même document (SHA2568bdbf7953d336b2f37608e4b97f7d2d7c12cae1c1009625721779ce975cda13e). Ce succès distinct n’efface pas la tentative500 ; aucun contrôle ni seuil n’a été retiré. Le passage ultérieur41135102229 a réussi source/validation/build mais a refusé l’enregistrement après la fusion#1100 ; sa reprise automatique bot41141924192 est distinguée d’une réussite déjà prouvée. Les contrôles, builds CI et parcours réellement exercés sont détaillés dans le reçu. Les résultats de collecte, validation, enregistrement et publication restent séparés. Les pannes de sources tierces conservées ne sont ni transformées en succès ni présentées comme corrigées. Aucun test de panne n'a modifié la production.

L'automatisation complète n'est pas déclarée : les dépendances externes et qualifications utiles encore ouvertes restent du travail non résolu, avec leur pièce exacte dans le suivi et le reliquat. Les limites de réutilisation documentaire restent explicitement non vérifiées lorsqu'aucune licence n'est établie.

---

# États historiques conservés

'''
for name in ['RAPPORT.md','LIVRAISON.md']:
 old=(base/name).read_text();(out/name).write_text(head+old)
(out/'README.md').write_text('''# Livrables consolidés — reprise du30octobre2026

- LIVRAISON.md et RAPPORT.md : résultat courant puis historique conservé.
- bilan-par-outil.csv : 24outils/routes, fonctions opérationnelles/partielles/bloquées.
- matrice-donnees-usages.csv.gz et matrice-bilan.json : matrice unique et dénominateurs.
- suivi-consolide.csv.gz : toutes les identités et observations conservées.
- perimetre-initial-complet.csv.gz : les661identités initiales avec appartenance courante.
- causes-consolidees.csv.gz : regroupements, impacts individuels, preuves et limites.
- reconciliation-79-ecarts.csv :79cas inchangés,70voies mensuelles qualifiées/9refusées.
- statut-19-actions.csv :19actions réévaluées, sans certification de tout le catalogue.
- restant-a-verifier.csv.gz : reliquat exact, éléments historiques et non applicables distincts.
- collectes-controles.csv.gz et chaines-donnees.csv.gz : preuves mutualisées par producteur/champ.
- preuves/reprise-2026-10-30/ : réponses, reçus GitHub, résultats navigateur et vérification finale.

Fichiers gzip : CSV UTF-8 avec BOM, séparateur point-virgule. Chaque fichier est téléchargeable séparément ; aucune grosse archive obligatoire. Les anciens audits restent dans Git et dans les sections historiques, sans réécriture des tentatives anciennes.
''')
bilan=json.loads((base/'bilan.json').read_text());bilan['reprise30octobre']={'observedAt':now,'public':actual,'matrix':matrix,'actions19':dict(actions),'release':release,'completeAutomationClaimed':False};(out/'bilan.json').write_text(json.dumps(bilan,ensure_ascii=False,indent=2)+'\n')
(out/'ETAT-REPRISE.json').write_text(json.dumps({'updatedAt':now,'scope':'chantier consolidé existant','completeAutomationClaimed':False,'release':release,'remaining':'restant-a-verifier.csv.gz','matrix':'matrice-donnees-usages.csv.gz'},ensure_ascii=False,indent=2)+'\n')
print('Prepared consolidated final reports without dropping prior history or claiming complete automation')
