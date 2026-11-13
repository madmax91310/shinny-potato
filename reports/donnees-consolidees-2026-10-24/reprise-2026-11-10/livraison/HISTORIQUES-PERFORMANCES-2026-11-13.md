# Historiques et performances — reprise consolidée du 13 novembre 2026

Même suivi [#881](https://github.com/madmax91310/shinny-potato/issues/881#issuecomment-6776720896), mêmes matrices et identités de départ. Base relue : public152629fe, puis CODE8ad7a501/DATAc495bd2e. #1249/#1250 déjà livrées préservées ; #1252 interface flux, #1222 supervision Radar et #1061 encours laissées à leurs propriétaires. Aucun ancien outil restauré, aucun changement de maquette, aucune publication sur X.

## Correction effective

[#1251](https://github.com/madmax91310/shinny-potato/pull/1251), fusion **5d09e983d1aa178355e54ba7ed68ebe7eb4b238e** : la clôture XNDX utilise directement le document officiel FRED/Nasdaq NASDAQXNDX, **USD Total Return brut**, avec preuve de série, source, séance XNYS achevée, date de publication, empreinte et bornes. Aucun cours Yahoo n’est requalifié par la seule disponibilité du document FRED. Anciennes comparaisons et divergences conservées.

[#1254](https://github.com/madmax91310/shinny-potato/pull/1254), fusion **5904a61dd5052f04ba732dbdb5f222f25c5f3581** : le test consommateur reconnaît séparément les contrats Yahoo historiques et FRED officiels, sans confondre prix et rendement total. Il est exécuté avant **et après** la vraie collecte. La preuve de séance utilise la clé existante `session`, reconnue par le client déjà publié ; valeurs, séance, devise, convention et empreinte sont identiques. La garde de publication n’a été ni modifiée ni contournée. Quatorze contrôles requis et la qualification fournisseur GitHub sont réussis. [Preuve de compatibilité financière et de publication](preuve-compatibilite-xndx-sans-baisse-de-garde-2026-11-13.json).

Une source en retard reste « attente de publication », sans renouveler la réussite précédente ; panne, format invalide, mauvaise identité ou séance future préservent la dernière observation et remontent dans les contrats existants. Reprise ciblée `anniversary_series` disponible dans le producteur ordinaire ; périmètre déclaré avant collecte, dérivation de l’or non tentée en reprise ciblée. Le cron07h40UTC et son périmètre complet restent inchangés.

Collecte réelle **43383944403**, événement **push**, à **07:13:04UTC** : 704 clôtures demandées et contrôlées, sans erreur ; l’or705e résultat est une dérivation validée et non une705e consultation fournisseur. XNDX **34 587,76 points au12novembre**, contre observation conservée du10novembre avant lot. Stockage automatique **9a82604ea9ba5222fb279e5b536a2a6cad105aed**. Source/contrats et publication sont prouvés séparément. Le premier contrôle consommateur sur les vraies données a révélé l’assertion Yahoo figée ; la correction#1254et son passage aprèscollecte sont nécessaires avant toute clôture publique. L’ancienne version publique conservant encore l’ancien fichier, la garde de reçu a refusé à07:17 une publication partielle ; sa bascule automatique vers validation du nouveau code est conservée, pas maquillée en réussite : [preuve](preuve-garde-publication-2026-11-13.json).

**CODE `8ad7a501d045fc03a49bd47fe41e690f2c8dfb41` / DATA `fb510c95b22e4485afdd176faced146a62f3014b`, vérifiés à 2026-11-13T09:15:11.137341+00:00.**

| Outil / voie | Disponibilité et actualisation | Limite restante |
|---|---|---|
| Il y a X ans, simple et comparatif, Nasdaq100 | Nouveau contrôle source quotidien ordinaire, réinvestissement et USD conservés ; recettes texte, valeurs, aperçu/PNG ordinateur/mobile liées au reçu public final | Cette clôture ne qualifie pas une nouvelle fenêtre mensuelle ; cron postcorrectif distingué du push |
| Performance depuis ; Et si tu avais investi ; comparaisons/classements ; DCA, générateur et Duels selon sélection | Les périodes mensuelles qualifiées sont préservées, dernière période close octobre2026 ; matrice774routes complète, conventions et refus propres à chaque route | Six fenêtres du groupe79 restent refusées ; aucune règle d’admission assouplie |
| Bitwise Paris DE000A27Z304 | Voie mensuelle EUR juin2021–octobre2026 et clôtures récentes indépendantes préservées ; Paris2023/2024 déjà utilisables | Année2021 entière : borne décembre2020 et continuité manquantes |
| Bitwise Xetra BTCE.DE | **Cinq clôtures récentes valides5–11Nov** ; six horodatages annoncés mais close12Nov nul. Production13Nov conserve bien11Nov, pas la regularMarketPrice comme clôture | Demande historique2020–oct2026 toujours400 ; `firstTradeDate`5Nov2026 n’est pas une date de création du produit. Ne pas attribuer deux fois l’impact à Paris |
| WTI, Wheat, NGAS, Brent/WTI2020 | Voies et historiques déjà qualifiés préservés ; aucun nouveau contrôle de NAV matières premières inventé à partir d’une simple clôture Yahoo | Dernier cron propre à chaque producteur et preuve d’adoption restent séparés ; voir registre des passages |
| Palladium | Autres périodes et NAV2025 indépendante conservées | NAV décembre2014 toujours non qualifiée ; cotation IPDM.L2025 refusée, cas distinct |

## Six fenêtres inchangées, 73/79 conservées

| Part / période | Pièce exacte manquante |
|---|---|
| DE000A0H08P6 — Retail2019 | Facteurs officiels avril/juillet, bornes et méthode de réinvestissement homogènes ; reconstruction38,2409679375% contre38,2505510559%, résidu−0,0095831184point conservé |
| DE000A27Z304 — Bitwise2021 | Cours EUR/Xetra de décembre2020 à décembre2021 et continuité ; Paris commence juin2021. La nouvelle piste Bourse de Francfort exige une qualification des ajustements **et des droits d’utilisation du téléchargement dans un service tiers** ; licence non documentée. Aucun cours de cet export recopié |
| FR0010755611 — CL2 2021 et2024 | Définition officielle de la série EUR ajustée ou flux/opérations et facteurs complets. Concordance annuelle acquise réutilisée, pas preuve quotidienne de réinvestissement |
| FR0013411998 — Japon couvert2025 | Même nécessité sur cette part EUR couverte ; cellule vide ≠ zéro distribution |
| FR0013412004 — Amérique latine2025 | Convention EUR, flux/opérations, bornes de NAV et cotation ; résidu non déclaré prime/décote par simple soustraction |

Nouvelle recherche du13Nov : trois fiches mensuelles officielles Amundi exactes téléchargées et examinées. Les mentions « dividendes réinvestis » définissent les indices, pas explicitement la série quotidienne ajustée EUR des fonds ; les calendriers concordants restent des preuves distinctes. [Documents, empreintes et passages exacts](preuve-amundi-definition-performance-2026-11-13.json). Aucun zéro distribution déduit.

[Six cas détaillés](six-fenetres-restantes-2026-11-12.csv), [79cas requalifiés](windows79-requalified.json), [774routes](historiques-performances-2026-11-12.csv). Les77anciennes divergences et deux résidus ne sont pas clôturés par une voie indépendante.

## Résultat final effectivement servi

Le producteur ordinaire **43398418519**, déclenché sur **push** après fusion, contrôle **704 sources**, plus une dérivation d’or, sans erreur ni attente. Contrôle XNDX le **13 novembre à09:06:55UTC** ; clôture officielle **12 novembre,34 587,76points USD Total Return**. Enregistrement **fb510c95b22e4485afdd176faced146a62f3014b**, publication Pages réussie et vérifiée à **09:12:34UTC**. Le reçu exige exactement les trois fichiers du producteur ; aucune sortie antérieure n’a été publiée à leur place.

Le navigateur public utilise cette valeur sans saisie manuelle dans **Il y a X ans, simple et comparatif**, sur1440et390px : calcul, texte, dessin, aperçu et les deux téléchargements PNG validés. Les reçus distinguent identité du client **8ad7a501** et données **fb510c95**, sans annoncer une livraison du JavaScript client5904. Les111entrées financières initiales sont liées au manifeste, dont79entrées Git et32projections générées ; cette correspondance ne certifie pas indépendamment chaque valeur financière. [Chaîne complète et recettes](preuve-xndx-chaine-2026-11-13.json), [manifeste effectivement servi](publication-et-entrees-finales-2026-11-13.json).

**Usages mensuels : aucun des six refus n’est artificiellement levé. Les73fenêtres déjà utilisables restent73/79.** Le renouvellement de cette clôture quotidienne est une réparation distincte, pas une nouvelle année mensuelle.

Dépendance annuelle existante des portefeuilles : la collecte ordinaire **43396884761**, manuelle, conserve le taux de référence fonds euros2025 **2,63% contrôlé8Nov** : les deux documents ACPR sont refusés403 dans GitHub. Une piste nouvelle dans Chrome GitHub/macOS confirme le même403 ; aucun contrôle réussi n’est inventé à partir du succès HTTP local. Les sources SCPI2025 et LivretA ont été effectivement contrôlées et enregistrées avec leurs conventions propres ; aucune NAV d’un contrat d’assurance-vie n’est déduite de ces références. [Résultats individuels et échecs de transport](preuve-references-performances-annuelles-2026-11-13.json).

## Vérifications et autonomie

Les14contrôles requis de#1251, la collecte GitHub en PR et les57tests publication,62contrats producteurs et34régressions13F ont passé. Le helper de plans partagé est requalifié à sortie identique pour les28gestionnaires avant mise à jour de son empreinte de garde, sans exemption. Build du **commit fusionné exact** réussi : [reçu](preuve-build-master-2026-11-13.json). Les deux premiers essais locaux incomplets avaient omis les entrées `reports/` du checkout sparse ; ces fichiers suivis ont été restaurés à leur contenu Git exact, sans modification d’application.

[Passages planifiés et crons configurés](preuve-passages-planifies-2026-11-13.json) : un cron du moniteur ne certifie pas une collecte fournisseur. Une échéance nominale passée sans run observable reste à observer ; on n’attend pas indéfiniment son déclenchement et on ne le transforme pas en panne réseau inventée. Les reprises ordinaires et limites financières restent en place.

Les anciennes alertes de publication conservent leur essai échoué. La publication actuelle, les incidents source et les preuves historiques non récupérées sont séparés ; aucun redéploiement n’a été lancé simplement pour les verdir. [Rapprochement par incident et étape](preuve-anciennes-publications-2026-11-13.json).

[Réconciliation des1218traces initiales des six familles de workflows](reconciliation-incidents-2026-11-13.csv) :1186qualifications documentaires,25éléments de supervision,5collectes et2contrôles dans cette photographie, **pas1218pannes de données**. La matrice conserve774routes, pas774instruments uniques. Aucun taux global d’automatisation annoncé.

Le moniteur consulté à09:13UTC ne conserve plus l’incident individuel `anniversary-nasdaq100`. L’ancien état global du workflow et certaines alertes de CI restent des traces d’exécutions antérieures : elles ne prouvent pas un nouvel échec du run43398418519. Aucun incident historique n’a été effacé ou clôturé sur la seule couleur verte. [Boîte publique, chargements200 et export complet](preuve-boite-publique-2026-11-13.json), [export complet compressé](export-boite-publique-complet-2026-11-13.json.gz).
