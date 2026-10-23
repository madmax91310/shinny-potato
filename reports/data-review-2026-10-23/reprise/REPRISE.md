# Reprise et sécurisation des consommateurs

État avant intégration : master d780e917 (#900, #902, #904, #901 et suivi IA courant) intégré. La dernière instruction utilisateur autorise fusion et déploiement après validation. La PR n'est pas encore fusionnée à ce stade.

Les 8 550 lignes précédentes sont conservées dans le suivi actualisé de **8 555 lignes**. La ligne supplémentaire est le nouvel incident de table primaire CSPX du producteur 40011202978. Les originaux complets du suivi et du bilan sont archivés ici ; aucune disparition n'est interprétée comme une résolution. Les 73 conflits DWS disparus sont associés à leurs épisodes `resolved` datés dans le moniteur réel. Les 36 autres conflits attendent toujours quatre heures de stabilité du nouveau document : aucun délai n'est antidaté.

## Fonctionnement corrigé

- Les 79 comparaisons financières non expliquées (78 causes et le résidu WFNS) ne sont pas clôturées. **52 cas de cotation sont refusés** dans leurs fenêtres contestées ; **27 cas disposent d'une NAV indépendante qualifiée**, notamment après #900. Les cours originaux conservés ne sont pas rebaptisés NAV. Les restrictions sont liées à la cotation, à la devise native et à la période ; un ISIN entier n'est pas interdit.
- Le refus atteint calculateur, DCA, vidéo, anniversaires, calendriers annuels dérivés, conversions, classements et portefeuilles. Les fenêtres récentes compatibles restent calculables. Le portefeuille des classements peut se calculer directement sur une fenêtre explicitement choisie, sans fabriquer une courbe antérieure.
- Les calendriers VL annuels qualifiés deviennent une sélection distincte quand l'historique mensuel contesté ne convient pas. Copper 2018 est exportable avec la convention **VL de l'ETC** ; ses cotations 2018 sont refusées et sa période janvier–septembre 2026 reste simulable/exportable. Un calendrier annuel ne donne pas de simulation mensuelle.
- La projection de métadonnées du navigateur conserve les sources, la devise d'origine et la convention ; les périodes admises dans les sélecteurs sont identiques à celles du registre chargé.
- Les quatre doubles présentations WisdomTree sont réunies sans effacer les diagnostics, identifiants, sources ou dates : **48 présentations pour 52 signaux** dans la capture courante. Les historiques du moniteur ne sont pas réécrits.
- WisdomTree : le parseur accepte le nouveau libellé explicite « Base / Trading Currency », contrôle la devise native et la cotation correspondante à l'ISIN. Régions IE/NL autorisées, limitées au même chemin produit. Les reprises concernent le transport ; une erreur financière ou d'identité n'est pas masquée par un autre candidat.

## Blocages fournisseurs maintenus

| Cas | Résultat réel et pièce manquante | Conséquence utilisateur |
|---|---|---|
| Quatre WisdomTree | Producteur ordinaire GitHub 40017262668 : 177/181 valides ; GB/IE/NL HTTP403, API/navigateur également refusés. Les réponses locales IE/NL valident le parseur mais ne qualifient pas l'accès GitHub. | Dernières compositions conservées à leur vraie date ; échecs individuels ouverts ; aucune nouvelle admission intégrale. |
| Deux autres WisdomTree GGRA/VOLT | Identités manquantes : six/dix-huit SEDOL dans les pages candidates ; pas de correspondance indépendante complète admise depuis le producteur. | Aucun portefeuille partiel renormalisé. |
| Copper | Produit exact 1000073, USD, identifié localement sur les pages officielles NL/IE. L'API `fund-history/1000073?view=navHistoryModal` reste refusée depuis GitHub ; aucune autre série quotidienne équivalente qualifiée. | Calendrier VL annuel distinct disponible, simulations de cotation limitées aux fenêtres admises ; collecte quotidienne NAV toujours bloquée. |
| L&G / UBS / BNP | Quatre explorateurs L&G sans classe active ni portefeuille économique intégral ; PCF non assimilé au portefeuille investi. UBS reste top 10 indice, BNP top 10 fonds. | Capacités intégrales/recouvrement refusées ; usages des périmètres qualifiés conservés. |
| Identités | `identites-positions.csv` conserve 20 lignes sans ISIN dans 14 fonds. NCINO : FIGI éditeur BBG00XTV91S5 et ISIN US63947X1019 renvoient à deux shareClassFIGI distincts ; le nom ne prouve pas la continuité. | Recouvrement partiel signalé, aucune attribution par ressemblance. |
| Deux PEA | IE00B0M62S72 : conflit des sources ; fiche officielle « - » non concluante. IE0003R87OG3 : la page Zonebourse téléchargée ne contient pas l'affirmation PEA du résumé de recherche. | Inconnu maintenu ; aucune majorité ni extrait de recherche transformé en preuve. |
| SSGA IE00B3T9LM79 | Capture actuelle qualifiée, ancienne valeur 1,146701 contre 1,146616 ; ancienne capture brute sans empreinte toujours manquante. | Conflit historique maintenu, aucun seuil changé. |
| DWS | 73 résolutions ordinaires prouvées, 36 contrôles de stabilité encore nécessaires après le changement de document de 19:02. | Valeurs courantes recoupées ; alertes historiques encore actives conservées. |
| CSPX | Table sectorielle primaire invalide, nouvel épisode de production « Incomplete allocation ». Voie des 504 positions complètes à même date qualifiée séparément dans la PR. | Répartition qualifiée utilisable ; panne primaire toujours visible. |
| 30 compositions économiques d'indices / documents et contrats consommateurs | Les cas, sources et pièces manquantes restent détaillés par champ dans le suivi principal et les captures d'inventaire. Aucun panier de substitution ne devient un indice économique ; aucun document privé non publié n'est inventé. | Seules les capacités exigeant ces données restent indisponibles. |

Les observations réseau locales sont marquées `local` et ne sont pas importées comme observations GitHub. Les données d'identités et de compositions modifiées par les sondes locales ont été restaurées. Le livre réel IA n'a pas été modifié ; les projections concurrentes de master sont préservées.

## Validation avant la CI finale

Build complet et budgets inchangés : réussis. Recette navigateur : quinze vrais PNG, refus Copper 2018, export récent, export VL annuel et déduplication des incidents réussis ; export XNDX du 23/10 réussi. Les premières erreurs de tests et les erreurs d'environnement OCR sont archivées, avec leurs rejeux séparés. La conclusion GitHub finale et les résultats définitifs sont ajoutés après exécution ; cette section n'annonce pas une CI verte.

La suite Python finale comporte **965 tests réussis** après installation des ressources OCR françaises et de la configuration TSV de l’environnement. Le rapprochement IA ne remplace que la série, le statut et le certificat SWDA dont la preuve GitHub du 22/10 est plus récente. Les autres observations concurrentes et le fixing du 23/10 sont préservés ; la reprojection démontre l’égalité profonde du livre réel avant/après.

L’intégration de #904 a révélé un budget de banque de tweets dépassé dans plusieurs jobs GitHub : même cause regroupée, aucun contrôle supprimé. Le contenu statique est sérialisé en JSON, sans changer aucun texte, source, date ni empreinte de revue ; les trois récits passent leurs parcours à 1440, 390 et 360 px. Le suivi ajoute cette cause et le refus des liens sans historique qualifié.

Le rejeu GitHub **40022869635** est globalement en échec : Copper, quatre WisdomTree et conflit PEA restent refusés. Publication XNDX du 23/10 et contrôle DWS 11/11 réussissent ; discovery finit sans promotion 0/6. Le producteur ordinaire **40022897634** confirme également **177/181** compositions et les quatre refus GB/IE/NL. Les observations et réponses sont archivées dans `github-40022869635/` ; aucune réussite de job n’est confondue avec une composition intégrale validée. La clôture XNDX est transmise au registre puis au consommateur Anniversaire et à son PNG réel.

#901 est intégrée sans modifier son travail de récupération mobile et de vérification hebdomadaire. Les tests comptables et hebdomadaires IA passent sur l’ensemble assemblé ; le livre réel reste strictement identique à celui de master. La recherche des alertes conserve aussi les identifiants techniques et alias des signalements dédupliqués.

## Corrections issues de la CI 49a9

La CI technique 40025337511 échoue dans trois partitions navigateur. Le build, les 965 tests Python, les contrôles d’exposition, les quatre jobs Tweet Midi, le smoke et la partition navigateur 1 réussissent. Les journaux de tous les échecs sont archivés. Le classement proposait une période contenant des cotations refusées ; il propose désormais une vraie plage continue qualifiée et explique toute adaptation de période. Les dates manuelles incompatibles restent refusées. Les preuves IA différencient les observations brutes et les plages réellement calculables. La recette anniversaire sélectionne un horizon effectivement admissible, sans supposer que tous les horizons sous le maximum sont valides.

En local : calculs IA recoupés, 29 supports dans trois outils, 16 profils, classements et 709 exports anniversaire réussissent. Les quinze exports de reprise passent à nouveau. Les identifiants inconnus sont refusés dans Performance et Calculateur, sans actif de remplacement ni écrasement des préférences. Ces résultats ne remplacent pas la nouvelle CI GitHub.

La comparaison réelle macOS 40026026342 ne restaure aucun accès fournisseur : mêmes refus Copper et WisdomTree ; aucune promotion discovery. La panne ne peut donc pas être attribuée au seul runner Ubuntu. L’origine précise des règles HTTP403 reste externe et non démontrée.
