# Compositions, expositions et publication 13F — bilan du lot

Correctifs fusionnés : [PR #1265](https://github.com/madmax91310/shinny-potato/pull/1265), enregistrement 13F ; [PR #1267](https://github.com/madmax91310/shinny-potato/pull/1267), manifeste de publication. Pages effectivement observé : **code `642e702a`, données `c9281f74`**, construction **2026-11-14T03:45:04.686Z**. Les versions de code et de données sont distinguées.
Complément [PR #1268](https://github.com/madmax91310/shinny-potato/pull/1268) : contrôle de promotion et quatre portées de publication après expiration des revues. Les maquettes, tweets et PNG restent inchangés.
Complément [PR #1269](https://github.com/madmax91310/shinny-potato/pull/1269) : ordre des lectures archivées et scellement des trois voies composites. Radar reste arrêté ; les quatre scénarios sont isolés et ne collectent aucune nouvelle publication.

## Panne corrigée et données effectivement publiées

Les runs 43496138701 et 43504937474 validaient les sources 13F, puis échouaient sur des publications ETF concurrentes. Le correctif qualifie **six chemins exacts supplémentaires**, indépendants du collecteur et du plan des 28 gérants. Les trois empreintes d’acquisition, les propres snapshots, les fichiers voisins inconnus, la validation du nouvel arbre et le délai de 30 minutes restent protégés.

**Run ordinaire de production [43517469275](https://github.com/madmax91310/shinny-potato/actions/runs/43517469275) : workflow_dispatch.** Les **28 gérants** sont validés ; le rapport est daté **2026-11-13T22:21:22.946218+00:00**. Enregistrement **`50b7d557b1b633713065f5ecc024a86ee7eae9ce`**, publication réussie, **31 fichiers du reçu comparés exactement aux fichiers publics**. Cela représente des contrôles et fichiers, pas autant de nouvelles déclarations ni une certification indépendante de toutes leurs valeurs.

Renaissance passe effectivement du **30 juin au 30 septembre 2026** sur le site. Sélecteur, texte comparé au calcul du consommateur, aperçu et téléchargement PNG vérifiés à **1 440 px et 390 px**, sans erreur JavaScript. Les deux PNG sont identiques et affichent la nouvelle date. Les anciennes positions restent dans le mécanisme d’archive existant.

Le journal indique `Qualified 13F upstream changes: []` : **ce run n’a pas rencontré une nouvelle collision**. Le recalage sur les chemins qualifiés est démontré par les tests de vraies courses Git et la CI ; aucune collision n’a été provoquée en production. Prochain cron nominal : **14 novembre à 12:25 UTC**, non observé. Une reprise manuelle réussie ne le prouve pas.

## Compositions : usages et limites conservés

| Périmètre | Usages disponibles / actualisation | Limite et prochaine action |
|---|---|---|
| Métadonnées et expositions enregistrées pendant l’audit | Empreintes désormais concordantes avec le manifeste public ; réserve de publication levée. | Preuve de publication complétée, pas réparation nouvelle de tous les champs ni admission automatique des candidats. Champs conservés et inconnus restent tels quels. |
| Uranium | Présentation ETF : dix positions collectées au 12 novembre, dont trois reprises dans le texte ; pays du 31 octobre. Texte et PNG récapitulatif vérifiés publiquement à 1 440/390 px. DCA/expositions conservent le livre partiel valide du 11 novembre. Le PNG récapitulatif ne présente pas la composition. | Recouvrement intégral refusé. CSV du 12 novembre : deux FX ZAR sans valeurs/poids et deux Verdera non identifiées. Source officielle relue, aucune valeur fabriquée. |
| WisdomTree | Voies de classements déjà collectées préservées, champs indépendants conservés. | Livre NAV/cash insuffisamment qualifié. Nouvelle piste WCLD : rendu officiel accessible, mais `fundHoldingDetails` absent et seul classement disponible. Aucun classement présenté comme livre NAV complet. |
| Russell 1000 | Secteurs, nombre de titres et photographie trimestrielle conservés. | Lien titres/classes/sociétés et couverture consolidée manquants ; photos de juin/octobre non mélangées. |
| Deux indices S&P Dividend Aristocrats | Relais qualifié du 13 novembre, photographie du 30 octobre, utilisable dans sa limite. | Accès GitHub natif 403 conservé, PR #1253 en draft. Relais manuel non automatisé ; échéance nominale du contrôle le 15 novembre à 07:42:53 UTC. |
| LifeStrategy et autres livres partiels | Transparisation des poches actions et capacités déjà admises préservées. | Aucun portefeuille intégral annoncé ; autres réserves Mining/QYLD/L&G/BCOM conservées dans le reliquat. |

**Aucun nouveau livre complet n’est admis par ce lot.** Les tests de recouvrement confirment conservation des poids inconnus, couvertures partielles et invariance à l’ordre des actifs. Les contrôles WisdomTree refusent concentration, comparaison et images lorsque le dénominateur n’est pas qualifié.

## Preuves et suite

35 tests 13F/Git, 23 tests de positions physiques, tests DCA/expositions/consolidation et CI complète réussis. Les 28 présentations sont exercées en navigateur local ; la recette publique détaillée porte sur Renaissance et le reçu de 31 fichiers sur tous les fichiers attendus.

## Correction complémentaire du manifeste de publication

La PR #1267 répare une seconde cause : le code conservé par le compositeur ne suivait pas encore le nouveau chemin de l’archive Renaissance de juin. Le fichier était bien servi, mais absent du manifeste : le moniteur refusait correctement de confirmer 31 fichiers lorsqu’il n’en retrouvait que 30. Aucun réducteur, contrôle ou incident n’a été forcé.

Le producteur fige désormais son outil de scellement avant le changement de version du compositeur, et énumère les chemins autorisés du code **et** du commit de données explicitement qualifié. Les empreintes restent calculées sur les fichiers réellement assemblés. Huit tests de publication, les contrôles du publieur et la CI complète de #1267 passent. Le cas exact ancien code/nouvelle archive a été reproduit dans un dépôt Git isolé.

L’archive Renaissance de juin et la photo courante de septembre sont effectivement consultables dans le composant d’historique public, sur ordinateur et mobile, sans erreur JavaScript. Aucun nouveau livre complet d’ETF n’est admis.

[Pièces manquantes et alternatives](RELIQUAT.md). La matrice conserve les 35 259 couples de suivi et les 1 218 identités initiales ; ces lignes ne sont pas des champs tous financièrement certifiés. Le moniteur et l’export public sont rapprochés séparément après leur mise à jour ordinaire.

## Publication finale et preuves distinctes

Le producteur ordinaire [43527632485](https://github.com/madmax91310/shinny-potato/actions/runs/43527632485) (`workflow_dispatch`) a réellement acquis le classeur Banque mondiale, validé et enregistré son contrôle au 13 novembre. Les **142 moyennes mensuelles jusqu’à octobre 2026 sont inchangées**, classeur publié le 3 novembre. Le commit `a6ffeaf7` ne change que `checkedAt`, jamais la période des valeurs. Ce n’est pas une réparation nouvelle de la source or ni une preuve cron.

Lors du passage fournisseur du 13 novembre à 23:41 UTC, la voie de publication corrigée a figé son outil avant de composer le code `1c45b9b4` et les données `a6ffeaf7` : le manifeste public contient **387 empreintes**, dont les **31 du reçu 13F**. Cela prouve la publication des fichiers, pas l’exactitude indépendante de chaque champ financier. Après la promotion finale, le moniteur confirme nativement `matching-public-source-fingerprints`, 31 fichiers, contrôle à 2026-11-14T03:49:03.639572+00:00. Aucun incident n’a été clôturé par édition du moniteur.

Le parcours public Données à revoir est exercé à 1 440/390 px, export complet acquis sans erreur JavaScript. La lecture figée du moniteur utilise le commit `7cea78c060accd620d929fb927546e4feafcd630` et son empreinte exacte ; la lecture de branche via cache peut être plus ancienne et n’est pas confondue avec cet instantané. Le contrôle final de promotion et ses états publiés sont conservés séparément dans moniteur-promotion-code-final.json.

## Promotion du code : régression d’expiration corrigée

La [PR #1268](https://github.com/madmax91310/shinny-potato/pull/1268), fusion `e0c165bf55da99bb84fa0fd0022c2e5f17fb095c`, corrige le test qui exigeait encore une revue garde TR corroborée après sa date d’expiration. Le produit avait correctement conservé le statut partiel. Quatre portées manquaient aussi au contrôle obligatoire : garde PEA TR inconnue et gratuité CTO non transposable ; cash Bourso/Fortuneo/BD avec PEA documenté et CTO inconnu. Ces quatre portées exactes complètent les six existantes ; aucun mécanisme générique n’admet les futurs champs inconnus. L’adaptateur courant, les bornes inclusives, le lendemain et les périmètres PEA/CTO sont vérifiés sans modifier données, échéances ou règles. Build local et CI vérifiés ; cette correction de contrôle ne répare ni ne certifie la donnée du courtier.

## Dernière dépendance de publication

Le premier passage master 43536546079 a échoué sur la recette du lecteur de signaux archivés. Reproduction isolée : une ancienne réussite vide effaçait une panne plus récente et les derniers signaux. La PR #1269 protège l’ordre des réponses et le cache ; le test original reste inchangé et quatre cas supplémentaires couvrent les deux ordres succès/échec à 1440/390 px. Aucun collecteur ou notification Radar n’est réactivé.

Le même secours a reproduit l’omission du manifeste (386 empreintes, archive absente), tout en conservant les 31 fichiers réellement accessibles. Le correctif #1267 couvrait la voie partagée ; #1269 étend le scellement aux deux autres constructeurs, promotion avec données plus récentes et secours. Les neuf tests et le contrôle de couverture des trois chemins passent sans assouplir le contrôle financier ou l’ordre des publications. Les branches conditionnelles non rencontrées sont signalées séparément dans publication-branches-proof.json, sans panne provoquée en production.

## Données concurrentes préservées

La publication finale a réellement intégré le commit `c9281f74` produit par le collecteur ETF 43552458543, lancé par `workflow_dispatch`. Le scellement du composite code/données plus récent a donc été exercé en production ; le secours reste démontré par les tests/CI, sans panne provoquée. Le workflow concurrent reste en échec partiel ; ses données valides sont publiées, sans transformer les champs retenus en succès. Cette collecte parallèle ne compte pas comme une réparation propre à ce lot, ni comme un cron. Son contrat indices comporte 113 résultats : 107 `succeeded`, deux accès S&P `failed`, quatre `not-applicable`. Ce sont des résultats de contrat, pas 107 indices ni 107 champs financièrement certifiés. Le détail exact des instruments et périmètres est conservé dans collecte-concurrente-indices-113-resultats.csv ; les livres intégraux et historiques mensuels ne sont pas requalifiés par les résultats de composition ou de calendrier annuel.

La promotion finale ordinaire sur push de master **43548986618** est réussie et sa version de code exacte est effectivement servie : `642e702aead994fabf539e901cf886e98379a41a`. Recette publique du panneau de preuves à 1 440/390 px sans erreur JavaScript ; les 31 fichiers 13F restent identiques au reçu après ce déploiement. Ce push valide une publication de code, pas un cron fournisseur.

Précision WCLD issue du réexamen de la réponse conservée : classe UCITS IE00BJGWQN72 / 3104137 ; NAV et encours du 22 octobre, classement du 12 novembre, aucune valeur/quantité de position permettant le rapprochement. Les photographies ne sont pas mélangées ; aucune nouvelle date de source enregistrée.
