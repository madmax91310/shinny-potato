# Suite Portefeuille & DCA — 29 octobre 2026

Base master `eb85231`, contenant #1050 et le raccord PANX #1052. #1036 est déjà fusionnée. PR ouvertes relues : #1031 (lecteur Global X), #1042 (guide), #1051 (qualification PEA), #1054 (illustration PANX) ; leurs fichiers métiers restent hors de ce lot. Fusion et publication explicitement autorisées par l’utilisateur. Texte public et squelette des images à conserver.

## Changements effectifs

- Le même contrat de qualification décide de l’admission des positions, de la complétude du recouvrement et de la concentration. Les bornes restent **93 jours**, **45 jours** entre photographies, **99,5 %** minimum et plafond historique inchangés. Les poids restent ceux publiés ; l’excédent de Battery reste visible, sans arrondi de la somme ni taux intégral fabriqué.
- L’analyse explique désormais par support les absences, dates périmées/futures/invalides, identifiants inconnus, couverture insuffisante et excédents. Les refus entre deux périmètres fonds/indice ou dates éloignées sont détaillés. Aucune explication ajoutée aux textes copiés ni aux images.
- Le collecteur partagé conserve une observation **refusée** réconciliée avec sa propre identité, date, date de contrôle, empreinte, benchmark et classes signées dans `lastRejectedObservation`. Elle n’entre jamais dans les calculs. Une panne ultérieure conserve ce diagnostic avec sa date, ainsi que la dernière composition admise et sa date d’origine. L’erreur de collecte reste en échec ; aucun incident n’est clos.
- Le contrôleur de sources ordinaires examine aussi le contenu des pages de recherche : colonnes et lignes observables, présence d’identifiants/poids, restriction d’accès et pistes de documents. Le PDF officiel Nasdaq et la route du benchmark XNDXNNR portent les routes surveillées de **5 à 7**. Toutes restent `financialDataQualified:false` ; un HTTP 200, un tableau ou un PDF ne certifie pas une composition.
- Actions explicites pour **répartir à parts égales** (centièmes, reste distribué déterministement, total 100 %) et **affecter le solde à une ligne**. Aucune action ne modifie les montants mensuels ni les identités. Aucun rééquilibrage automatique à la saisie.
- Import/export JSON versionné dans les deux parcours : portefeuille, texte exact, options d’image et choix d’analyse conservés. Lecture puis ouverture explicite ; fichiers invalides, trop volumineux ou du mauvais parcours refusés. Sauvegardes locales anciennes compatibles et jamais remplacées par l’import. Approbation révoquée à l’ouverture, jamais transportée comme consentement.

## Sources revérifiées et limites persistantes

| Support | Contrôle réel | Résultat / limite |
| --- | --- | --- |
| World EUR Hedged **IE00B441G979** | Collecteur ordinaire, 29/10 à 20:24 UTC ; photographie 28/10 | Actions **100,76218 %**, forwards **−1,89321 %**, net **100,00001 %**. Diagnostic brut/net désormais visible avec preuve. Aucun passage en composition nette intégrale ; dernière composition admise conservée au **23/10**, contrôle de succès d’origine **27/10 à 14:45 UTC** |
| Europe 600 **FR0011550193** | Deux pages officielles SXXR, 29/10 à 20:24 UTC | Page composants : zéro ligne exploitable dans le HTML reçu. Page données : aucun tableau intégral identifié/pondéré. Ni substitution par un ETF physique ni extrapolation |
| Nasdaq PEA **FR0011871110** | GIW NDX et XNDXNNR, PDF `nasdaq.com/NDX`, 29/10 à 20:24 UTC | GIW : accès complet réservé, zéro ligne exploitable publique. PDF reçu daté **05/01/2026** (format américain du document), ancien et sans preuve suffisante du périmètre exact/identifiants. Pas de QQQ comme indice. Le nouveau connecteur PANX ne fournit qu’un top 10 d’un **autre indice**, donc ne résout pas ce besoin |
| Immobilier PEA **FR0011869304** | LSEG et EPRA, 29/10 à 20:24 UTC | Fichiers réservés signalés par EPRA ; les documents publics contrôlés ne qualifient pas le benchmark exact pondéré et identifié. Aucun sous-ensemble mondial renormalisé |
| GGRA **IE00BZ56SW52**, SEDOL **B59RGY2** | Nouvelle requête exacte OpenFIGI SEDOL + deux ISIN candidats, 29/10 à 20:28 UTC | SEDOL : `No identifier found`. Aucun rapprochement avec Merck US ou Merck Allemagne par le nom. Couverture **97,1431 %** conservée ; **2,8565 %** restent inconnus |
| ACWI **IE00B6R52259**, Small Cap **IE00BF4RFH31**, EM **IE00BTJRMP35**, Infrastructure **IE00B1FZS467** | Quatre collectes réelles réussies dans le même passage | Compositions/poids et distinctions DUMMY, CVR, cash, fonds monétaires conservés. Aucun nouveau classement intégral revendiqué |

L’entrée de renouvellement existante a également été exécutée : **128 preuves qualifiées**, **zéro requête de renouvellement nécessaire** à cette horloge. La requête Merck de recherche est documentée séparément, sans la présenter comme une identité qualifiée ou un renouvellement automatique réussi.

## Validations exécutées

- `npm run test:dca`, dont actions sur 1/2/3/8/50 positions, import/version/ancien format, doublons/identités/poids invalides et conservation du texte.
- **25 tests Python DCA**, dont écriture réelle du producteur en répertoire temporaire : succès mixte, panne, régression de date, refus brut/net, conservation des dates et preuve liée au hash exact.
- **56 tests WisdomTree**, **44 tests de contrat producteur**, **5 tests d’accès**, **4 tests de contenu natif**, dont le PDF officiel réel archivé et rejoué.
- Contrôles inventaire d’automatisation et concentration d’indices ; lint et build avec les budgets existants et manifeste de publication vérifié.
- Chromium réel : actions 1/2/8/50 lignes sur 1440 et 390 px ; téléchargement JSON, import dans les deux parcours, mauvais parcours/fichier invalide refusés ; texte/options exacts, consentement révoqué et **PNG inchangé pour le même portefeuille après transport**.
- Recettes existantes : **13 portefeuilles** complets/partiels/inconnus/neutres/fonds-indices/résidus, analyse/canvas/PNG téléchargé identiques, ordinateur/mobile ; analyse DCA ; **34 compositions d’indices** avec vrais téléchargements et égalité PNG/aperçu.

Les reçus des collectes, leurs horloges et empreintes, le refus Merck et les extraits contrôlés des sources sont joints dans `evidence/`. Les journaux et images représentatives sont joints après recette finale. Aucun générateur de texte, dessin PNG, profil, seuil, frais, historique ou allocation préparée n’est modifié. Les variations de catalogues sans lien avec ce lot ne sont pas committées.

À la rédaction, la publication n’est pas encore revendiquée : la PR recevra les runs distants, le SHA public et la recette sur l’application publiée après fusion. Une surveillance automatique n’accorde pas l’accès aux compositions réservées, et un diagnostic brut/net ne résout pas une méthode financière encore non admise.
