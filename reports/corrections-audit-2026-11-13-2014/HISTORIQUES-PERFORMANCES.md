# Historiques et performances — bilan du lot

Correctifs fusionnés : [PR #1265](https://github.com/madmax91310/shinny-potato/pull/1265), enregistrement 13F ; [PR #1267](https://github.com/madmax91310/shinny-potato/pull/1267), manifeste de publication. Pages effectivement observé : **code `642e702a`, données `c9281f74`**, construction **2026-11-14T03:45:04.686Z**. Les versions de code et de données sont distinguées.
Complément [PR #1268](https://github.com/madmax91310/shinny-potato/pull/1268) : contrôle de promotion et quatre portées de publication après expiration des revues. Les maquettes, tweets et PNG restent inchangés.
Complément [PR #1269](https://github.com/madmax91310/shinny-potato/pull/1269) : ordre des lectures archivées et scellement des trois voies composites. Radar reste arrêté ; les quatre scénarios sont isolés et ne collectent aucune nouvelle publication.

## Résultat

**Aucune nouvelle fenêtre n’a été forcée ni nouvelle convention introduite.** Le contrôle exécuté sur les entrées de master confirme les **73 cas utilisables sur le groupe constant de 79**. Ces 79 cas ne sont pas tout le catalogue. L’inventaire existant de 774 routes et ses preuves restent la référence, sans nouvelle campagne de collecte.

| Chaîne / usage | Disponibilité et actualisation | Preuve conservée / réserve |
|---|---|---|
| Historiques communs : Performance depuis, Et si tu avais investi, comparaison et classements, portefeuilles selon admission | Fenêtres qualifiées et données mensuelles complètes d’octobre 2026 préservées ; nouvelles périodes soumises aux mêmes gardes. | Le push réparé 43467518507 a publié ses données valides, avec un échec individuel Xetra. **Pas de cron mensuel postcorrectif observé dans ce relevé.** |
| Nasdaq / Il y a X ans | Voie quotidienne FRED XNDX à rendement total en USD conservée. | Cron 43454784772 acquis dans le lot précédent : niveau du 12 novembre, enregistrement et publication prouvés. Ce n’est pas la preuve du producteur mensuel. |
| Bitwise Paris | Voie EUR depuis juin 2021, années 2023/2024 qualifiées ; pas de retour à l’ancienne voie par défaut. | L’ancien historique Xetra reste tronqué chez Yahoo ; des cours récents peuvent néanmoins y être présents. Pas de double attribution d’indisponibilité à tout Bitwise. |
| Matières premières, dont WTI/Wheat, et changes communs | Voies et conventions déjà qualifiées conservées. | Aucun nouveau défaut justifiant de refaire les collectes concluantes. Une NAV n’est pas substituée silencieusement à une cotation. |
| Six refus et Palladium | Restrictions ciblées conservées ; périodes indépendantes utilisables maintenues. | [Six cas exacts](six-fenetres-refusees-conservees.csv) et [pièces manquantes](RELIQUAT.md). NAV décembre 2014 et cotation 2025 Palladium restent distinctes. |

## Vérifications

Le moteur conserve les 73 fenêtres ; contrôle des cinq parts iShares avec oracle de rendement réinvesti, conversions historiques, absence de double cash et NAV d’anniversaire distincte. La régression Palladium maintient décembre 2014 explicitement refusé sans bloquer les mois valides. Build et CI complète de #1265 réussis. Aucun moteur, seuil, source historique, maquette ou format de tweet modifié.

## À observer

Créneaux **nominaux**, pas des réussites : reprise quotidienne le **14 novembre à 06:45 UTC**, collecte complète le **16 novembre à 06:15 UTC**. Vérifier alors résultats individuels, enregistrement, publication et consommateurs. Aucun lancement mensuel n’a été effectué pour remplir cette preuve.

Les divergences financières anciennes et résidus restent suivis séparément. Une voie indépendante utilisable ne les explique pas automatiquement.

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
