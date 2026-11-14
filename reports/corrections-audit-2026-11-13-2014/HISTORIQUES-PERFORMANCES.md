# Historiques et performances — livraison consolidée

Code public : `332ce044c94085ed30eee75445c5f52bf0134d15`. Données : `a4cf51167c2ac3c19b9bc604ff66c70a8fdff8ae`. Contrôle : 2026-11-14T21:46:02.242694+00:00.

## Résultat par outil et donnée

| Donnée / outils | Disponibilité et consommation | Actualisation démontrée | Limite restante |
|---|---|---|---|
| Groupe constant des 79 fenêtres litigieuses ; Performance depuis, investissement, comparaison et moteurs compatibles selon leurs capacités | **73 fenêtres qualifiées, six refus préservés**. Vérification du registre public et des six identités exactes | Aucune nouvelle admission de ces six dans ce lot ; les autres historiques du catalogue ne sont pas certifiés par ce dénominateur | Pièces exactes dans six-fenetres-refusees-conservees.csv ; 77 anciennes divergences et deux résidus distincts des usages rétablis |
| Bitwise DE000A27Z304, cotation Paris EUR | Sélecteur, calcul, texte, aperçu et PNG publics à 1440/390 px ; 1 000 EUR janvier 2023 → octobre 2026 = 3 047,90 EUR | Voie Paris préservée ; l’ancienne voie Xetra reste en HTTP 400 | Paris commence en juin 2021 : manque décembre 2020 pour qualifier l’année 2021. L’échec Xetra n’est pas une indisponibilité générale de Bitwise |
| ABTC CH0454664001 — NAV exacte, source USD convertie en EUR | 92 points mars 2019 → octobre 2026 strictement conservés ; split 14:1 déjà intégré une fois. Investissement : 1 000 EUR mars 2021 → octobre 2026 = 1 270,175379 EUR. Performance depuis : 2025 complète −15,8 %. Il y a X ans : NAV au 13 novembre, 22,525 USD → 20,380926529135 EUR au change BCE de même date. Texte, aperçu et PNG testés à 1440/390 px | Voie secondaire officielle acquise dans GitHub : calendrier sur push, NAV, cotation et quotidien en reprises ciblées ordinaires. Reçus 4/4,9/9,2/2 et3/3 publiés ; aucune nouvelle période financière. Cron postmigration non observé. | Aucun cron postmigration encore démontré pour ces trois entrées. Aucun nouveau mois ou cours de marché fabriqué à partir de la NAV |
| Enregistrement des historiques mensuels | Courses Budget/profils corrigées par #1273/#1276/#1282 ; nouvelle validation financière obligatoire à chaque changement de l’arbre | Production ordinaire sur push 43613864303 : enregistrement e6f3f413 réussi. Ses neuf chemins sont ensuite publiés par le reçu qualifié NAV bd4cfe22, neuf empreintes publiques vérifiées | Le reçu ancien e6f n’a pas été observé exactement 9/9 ; distinguer son successeur qualifié. L’acquisition tentée restait l’ancienne Xetra en échec ; aucun prix neuf revendiqué |
| Mensuel planifié | Cron 43601518941 du 14 novembre à 13:47 effectivement observé, validation et enregistrement 049558ce, neuf fichiers publiés | Un historique Xetra tenté : HTTP 400 ; 29 contrôles d’annuaires, neuf réussis et vingt inchangés réellement vérifiés | Ni 29 historiques ni tout le catalogue actualisé. Prochain mensuel complet nominal : **16 novembre 06:15 UTC**, preuve à observer |
| Nasdaq XNDX USD, rendement réinvesti | Preuve source planifiée 43454784772 du 13 novembre conservée : observation du 12 novembre, 34 587,76 | Producteur publication-observations planifié 43604901220 du 14 novembre : trois fichiers publiés | Cette preuve Nasdaq ne démontre pas le cron mensuel complet |
| Or et matières premières, WTI/Wheat compris | Voies et usages qualifiés préservés. Reprise réelle or 43527632485 : 142 moyennes jusqu’à octobre 2026, registre enregistré et publié | Dates et périodes d’origine conservées ; un contrôle sans changement ne crée pas une nouvelle période | Aucun nouveau cron fournisseur revendiqué pour chaque matière première |

## Corrections d’enregistrement et de publication

- #1265 : contrôle 13F revalidant les changements ETF indépendants, tout en gardant les empreintes d’acquisition et la fenêtre de validation de 30 minutes.
- #1267 : manifeste des vrais chemins code/données et scellement sur les octets effectifs.
- #1268 : contrôle de revue selon la date et quatre périmètres financiers exacts ; aucune expiration assouplie.
- #1269 : ordre de réponses d’un lecteur archivé, nécessaire à la CI ; Radar n’est pas réactivé.
- #1273/#1276/#1282 : lecteurs Budget/profils précisément qualifiés sur les graphes d’entrées des deux arbres, puis revalidation complète. Les trois entrées d’acquisition mensuelles et les deux entrées ETF sont examinées ; dépendance inconnue, dynamique ou nouvelle configuration financière = refus.
- #1280 : API officielle secondaire ABTC qualifiée, avec les anciens hôtes/preuves conservés et contrôles stricts de l’origine, de la part, de la devise et du split.

Le producteur ETF 43591714636 a publié quatre fichiers : 316 résultats réussis, 11 échecs, quatre non applicables sur 331 résultats déclarés. Le producteur 43603436898 a enregistré 14f6d4a2 : 315 réussites, 12 échecs, quatre non applicables ; son nouvel échec ABTC 410 a motivé #1280. Ces résultats ne sont pas autant de champs financièrement certifiés.

**Rectification de preuve de publication :** trois fichiers de l’ancien reçu 14f correspondent ; le fichier divergent était **automated-etf.json**, pas le fichier indices. Son successeur qualifié du cron 43605419666 a onze fichiers effectivement publiés. Comparaison exhaustive : 144 différences sur 12 instruments, dont 132 adresses de provenance et 12 libellés de réplication normalisés ; les autres clés, valeurs, types et ordres des tableaux sont conservés, notamment les données numériques. L’ancienne conclusion de simple sérialisation, fondée sur le mauvais fichier, est retirée et sa trace conservée. Aucun reçu ni statut natif réécrit. Voir les preuves etf-1276-proof-scope-correction.json et etf-1276-qualified-successor-corrected-proof.json.

Les refus 43607073199 (sources ABTC modifiées pendant la reprise) et 43613858603 (configuration CI DCA changée) restent des refus justifiés de sorties anciennes. Le passage frais 43613864303 puis la NAV 43614083063 prouvent la chaîne ultérieure ; ils ne transforment pas ces tentatives historiques en réussites.

## Six fenêtres refusées et Palladium

Un refus mensuel ne retire pas un calendrier annuel déjà qualifié ; ces calendriers ne comptent pas comme nouveaux usages mensuels.

| Actif / période | Preuves acquises | Pièce exacte restant nécessaire |
|---|---|---|
| DE000A0H08P6 / 2019 | Dividende officiel juillet 0,374603 EUR ; facteur reproduit 1,012099029361 au lieu de 1,012103295143 ; avril diverge aussi, janvier/octobre concordent | Unités/facteurs officiels et bornes XETR du 28/12/2018 et 30/12/2019 ; résidu 2,44422892 points, aucun seuil relevé |
| DE000A27Z304 / 2021 | Paris qualifié à partir de juin 2021, ancienne voie Xetra distincte | Borne EUR décembre 2020 et continuité/opérations exactes ; le point récent BTCF.DE ne prouve pas 2021 |
| FR0010755611 / 2021 et 2024 | Séries officielles quotidiennes présentes, anciennes divergences conservées | Bornes CL2.PA 31/12/2020–31/12/2021 et 29/12/2023–31/12/2024, facteurs et convention de revenu ; résidus 5,62997039 et 2,54861047 points |
| FR0013411998 / 2025 | Bornes XPAR 37,772 → 48,552 EUR déjà recoupées | Horaires de valorisation, revenus/ajustements et convention ; résidu 2,67685035 points |
| FR0013412004 / 2025 | Bornes XPAR 17,635 → 24,316 EUR déjà recoupées | Horaires de valorisation, revenus/ajustements et convention ; résidu 2,13251246 points |
| Palladium IE00B4556L06 | NAV 2025 qualifiée ; cotation IPDM XLON USD décembre 2014 qualifiée | NAV décembre 2014 encore refusée ; cotation 2025 encore refusée. Une longue fenêtre de marché traversant 2025 reste refusée |

Nouvelle acquisition Amundi réelle du 14 novembre à 10:57 : les niveaux quotidiens existent pour les trois parts/quatre fenêtres, mais les sources indiquent « Capitalisation and/or distribution » / C/D. La clause de dividendes de l’indice ne prouve pas celle du fonds. Il manque la qualification officielle des revenus et ajustements de la part : aucune distribution nulle déduite et aucun mode réinvesti imposé. Nouvelle piste du 14 novembre à 20:34–20:46 : trois DIC exacts, interface officielle et rapports annuels consultés ; montants de dividendes API non renseignés (`null`), CL2 ne publie qu’une devise sans montant. Les cellules blanches et les déclarations spécifiques HK/RMB ne qualifient pas ces parts françaises. Ces nouvelles preuves ne lèvent aucun des quatre refus Amundi ; détails dans income-qualification-conclusion.json.

## Tests et réserves

CI et build des PR fusionnées vérifiés séparément des collectes. Régressions pertinentes : vraies courses Git à deux auteurs, revalidation échouée bloquante, périmètres ciblés, identité et origine ABTC, conventions et conversions. Recettes publiques Chromium 1440/390 px : sélection, résultat, texte, presse-papiers, aperçu et téléchargement ; aucun appareil physique ni Safari testé. Les succès manuels ou sur push ne prouvent pas un déclenchement planifié.

Linxea Vie, ACPR, XTB et flux ETF manuels restent identifiés dans le suivi ; pas de modification concurrente de ces chantiers. Aucune automatisation globale complète annoncée.
