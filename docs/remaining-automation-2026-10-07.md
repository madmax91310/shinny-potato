# Roadmap d’automatisation — points 3, 4 et 5

Ce lot est séparé de la PR #353, sur laquelle il repose pour le taux du Livret A et les alertes d’échec. Il ne modifie pas les caractéristiques d’instruments exclues par l’utilisateur : réplication, distribution, domicile, couverture de change et éligibilité PEA.

| Point | Résultat au 7 octobre 2026 | Suite nécessaire |
|---|---|---|
| 3 — QYLD UCITS distribuant IE00BM8R0J59 | Sources officielles retestées ; calendrier annuel et expositions économiques encore non qualifiés | Obtenir une publication attribuant explicitement les données à cette part et à son exposition économique |
| 4 — Russell 1000, Global Dividend Aristocrats Quality Income, Euro High Yield Dividend Aristocrats | Trois compositions exactes encore non automatisées | Une source officielle exploitable doit publier les pondérations numériques du benchmark exact |
| 5 — paramètres fiscaux et plafonds utilisés | Huit publications DILA raccordées ; exemples recalculés ; taux LDDS automatisé et Livret A de #353 utilisé dans le lexique | PEE, PER et paramètres immobiliers raccordés par la seconde passe du 8 octobre ; règles qualitatives et exceptions encore éditoriales |
| 5 — courtiers | Sept barèmes qualifiés, compléments de change/garde/transfert et deux offres Saxo ; voir [bilan du 8 octobre](broker-automation-2026-10-08.md) | Bourse Direct inaccessible ; champs et conditions restant à qualifier détaillés dans le bilan |
| 5 — SCPI et fonds euros individuels | Aucun contrat ou SCPI nommé utilisé dans les séries actives de ce périmètre | Les moyennes ASPIM/ACPR relèvent de #353 ; les exemples fictifs restent des hypothèses pédagogiques |

## Paramètres réellement consommés

`collect_regulatory_data.py` collecte le flux XML DILA officiel, sans clé : F2365 (plafond individuel Livret A), F2368 (plafond et taux LDDS), F2385 (plafond PEA et cumul PEA/PEA-PME), F21618 (PFU des plus-values mobilières et ses composantes), F22414 (assurance-vie : taux sociaux, abattements, seuil de primes et taux après huit ans), F22449 (impôt sur les retraits PEA avant cinq ans), F2329 (tableau du régime général des revenus de placements pour l’année publiée), F2613 (dividendes).

Identité, titre, structure, cohérence des sommes, bornes, date future et retour à une publication antérieure sont contrôlés. Les régimes particuliers et années historiques du tableau social sont exclus de la sélection du taux courant. Le régime assurance-vie reste distinct du CTO et du PEA ; leurs exceptions historiques restent décrites. `publishedAt` est la date de publication de la fiche, **pas** une date d’effet juridique. `checkedAt` date le contrôle réel et le document porte son empreinte.

Le registre partagé alimente les fiches du lexique, leurs sections et exemples de Tweet Midi, ainsi que la recherche et l’export du catalogue. Les intérêts et gains nets sont recalculés avec les paramètres correspondants. Les taux du Livret A viennent des observations de #353 ; le LDDS est qualifié sur sa propre publication.

`collect_broker_tariffs.py` sélectionne les colonnes Découverte et Starter dans les tableaux des brochures officielles, avec date tarifaire et page calculée. Les tarifs d’autres forfaits, marchés ou produits ne sont pas substitués. Starter conserve la condition du premier ordre mensuel sous le seuil et l’avertissement sur les anciens tarifs. Le registre alimente tableau, publication, justificatifs et catalogue. Il ne certifie pas les autres cellules du comparatif, dont les dates de revue restent distinctes.

Le workflow quotidien `update-regulatory-data.yml` valide, collecte, audite et construit avant publication. Une source en échec conserve ses dernières valeurs ; les autres observations validées peuvent être publiées. Un échec de collecte rend le workflow en échec même après une publication partielle. Le suivi de #353 observe ce neuvième workflow : alerte seulement en cas d’échec, retrait après une exécution complète réussie. Les rapports détaillent les sources échouées ; un seul succès partiel ne clôture pas l’alerte.

## Sources encore bloquantes : essais du 7 octobre

- QYLD : https://globalxetfs.eu/funds/qyld/ identifie bien IE00BM8R0J59 dans les informations principales, mais son tableau de performances annonce **USD Accumulating**, avec rendements glissants et calendrier discret vide. Son profil produit identifie IE00BM8R0H36, la part capitalisante. Le PDF Fundassist essayé renvoie HTTP 500. Le DOM contient deux jeux de positions issus du rendu asynchrone, et le CMS masque les graphiques sectoriels/géographiques : aucune sélection arbitraire n’est publiée. Le panier de substitution reste exclu des expositions économiques.
- Russell 1000 : la fiche FTSE Russell officielle US1000USD du 30 septembre 2026 publie un comptage et des principales sociétés, mais pas les pondérations individuelles nécessaires. Les données Vanguard VONE testées décrivent le fonds, sans composition numérique qualifiée du benchmark. https://research.ftserussell.com/Analytics/FactSheets/Home/DownloadSingleIssue?isManual=False&issueName=US1000USD&openfile=open
- S&P : les pages exactes et leur endpoint public de données ont été retestés ; les réponses HTTP 403 empêchent la qualification. Les variantes « Screened » et les compositions de fonds SPDR ne deviennent pas les compositions de ces indices exacts. https://www.spglobal.com/spdji/en/indices/dividends-factors/sp-global-dividend-aristocrats-quality-income-index/ et https://www.spglobal.com/spdji/en/indices/dividends-factors/sp-euro-high-yield-dividend-aristocrats/

La complétude reste donc partielle : aucun de ces quatre blocages ne doit être compté comme résolu.

## Validation de ce lot

Collectes réelles : huit publications DILA et deux brochures officielles réussies. Six tests Python couvrent identité, date, mauvaises colonnes, année suivante, cohérence des sommes, conservation après échec et reprise des alertes. Les tests des consommateurs injectent des taux et frais différents, puis vérifient les exemples recalculés et la propagation aux fiches, tweets, tableaux, preuves et catalogue. Audits de catalogue, provenance, roadmap et courtiers réussis ; 12 955 générations Tweet Midi validées ; build réussi ; 19/19 outils en navigateur ; test dédié sur cinq fiches fiscales et les deux courtiers, avec affichage mobile.

Les fixtures XML proviennent du flux public DILA du 7 octobre 2026 (Licence Ouverte). Les deux extractions de brochures proviennent des URLs officielles de collecte, au même jour ; elles conservent les autres colonnes pour tester l’absence de substitution de barème.
