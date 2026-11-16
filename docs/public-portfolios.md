# Portefeuilles publics

Route : `/portefeuilles-publics`, groupe « Construire un portefeuille ». Stockage local versionné `el-public-portfolios-v1`, indépendant des outils Budget/DCA/tweets. Les publications et notes personnelles ne sont jamais envoyées à GitHub. Aucune synchronisation des fiches entre appareils.

## Réserve initiale et provenance

Trente portefeuilles partagés par leurs auteurs ont été recherchés le 16 novembre 2026 dans les publications publiques Getquin. Le choix couvre des approches ETF, actions, revenus et cœur-satellite ; il ne dépend pas des meilleurs rendements. Les noms restent des pseudonymes publics. Aucun âge, métier, revenu ou montant n’est ajouté.

`src/pages/public-portfolios/catalogue.json` conserve, pour chaque profil, le lien partagé, la publication personnelle justificative, la stratégie reformulée et l’objectif seulement lorsqu’il est explicite. « Réel déclaré par son auteur » décrit une déclaration, jamais un audit des transactions. Les performances mensuelle et depuis janvier ne sont pas préremplies ; leur vérification reste obligatoire avant préparation.

La première ouverture ajoute les profils manquants et enregistre une révision de catalogue. La migration de vingt à trente ajoute uniquement les dix nouvelles entrées ; les anciennes suppressions ne réapparaissent pas. Les fiches existantes, leur nature, leurs textes et leurs publications sont conservés ; les variantes linguistiques d’un même lien Getquin ne créent pas de doublon. Une fiche supprimée ne réapparaît pas au rechargement.

## Acquisition réellement disponible

- **Getquin : récupération partielle à confirmer**, pour les trente liens partagés du catalogue. Le collecteur lit uniquement leur page HTML publique, sans compte, cookie de connexion, API privée ou contournement. Le `robots.txt` consulté le 16 novembre 2026 n’exclut pas les pages `/en/dashboard/`. Le schéma de rendu `__NEXT_DATA__` fournit les ratios d’allocation `positions_by_ratio[].breakdown.ratio` ; ils sont conservés sans renormalisation. Identité, page disponible, absence de démonstration, noms, devise explicite et poids sont contrôlés. Aucun rendement n’est déduit des positions. Les champs techniques `returns.*` initialisés à zéro sont ignorés. Un total masqué/normalisé à 100 n’est jamais repris comme montant.
- **eToro : saisie manuelle.** La documentation `https://builders.etoro.com/reference` décrit une API nécessitant des identifiants ; aucun accès correspondant n’a été fourni. Aucune clé n’est embarquée dans la SPA.
- **Mon Petit Portfolio : saisie manuelle.** Les pages publiques sont consultables, mais leur lecture inter-origines n’est pas autorisée à cette SPA. Le taux « Annual return since … » est annualisé et ne devient ni rendement mensuel ni rendement depuis janvier. Aucun connecteur MPP n’est déclaré opérationnel.
- Les nouveaux liens saisis librement restent manuels tant qu’ils ne font pas partie du catalogue de collecte. Modifier l’URL d’une fiche la déconnecte de son ancien collecteur.

Les dates effectives, périodes de rendement, dividendes, frais et méthode de performance non établis restent vides/non précisés. Chaque observation collectée est donc à vérifier. L’utilisateur peut la corriger dans un nouveau relevé. Les noms/poids restent consultables avec la source et la date de collecte.

## Collecte et bouton d’actualisation

`.github/workflows/refresh-public-portfolios.yml` lance une collecte chaque samedi à 07:10 UTC (08:10 en France en hiver, 09:10 en été), selon la disponibilité de GitHub Actions, et permet un lancement manuel depuis GitHub. Une modification fusionnée du catalogue ou du collecteur déclenche également une lecture. Les trente lectures sont bornées et séquentielles. Une redirection hors d’un lien public Getquin autorisé est refusée. Une connexion ou un CAPTCHA provoque un échec visible, jamais un contournement.

`scripts/refresh-public-portfolio-feed.mjs` lit le flux précédent, lance le collecteur Python et publie exclusivement `public/data/public-portfolios-feed.json` sur la branche **`public-portfolio-data`**. Il vérifie le SHA du fichier avant écriture et utilise le bail atomique de l’API Contents. Il ne modifie ni `master`, ni les fichiers financiers, ni leurs collecteurs, protections ou voies de publication. Les succès indépendants sont conservés même si une autre source échoue ; le workflow signale les erreurs après publication de leur état.

À chaque ouverture de l’outil, le dernier flux public est chargé automatiquement. Le bouton **« Actualiser tous les portefeuilles »** recharge ce dernier flux public depuis `raw.githubusercontent.com` et ajoute les observations nouvelles à la réserve locale. Il ne lance pas directement les sites sources ; l’interface l’explique et fournit le lien de relance GitHub. Le flux initial inclus dans l’application provient d’une lecture réelle des trente pages. Les chargements suivants ne remplacent jamais les relevés précédents, leur vérification manuelle, les brouillons ou l’historique publié. Une observation inchangée ne crée pas de doublon. Un flux ancien, invalide ou une panne de transport ne supprime aucune donnée. Les échecs par source affichent leur date et la date du dernier succès de lecture, distincte de la vérification des performances.

La surveillance commune déclare ce collecteur et sa seule route dans `src/data/automation-workflows.json`. Le moniteur écoute ses fins de lancement. Son contrat spécifique contrôle la branche, le chemin du flux, la validation et le bail d’écriture ; les contrôles des producteurs financiers qui écrivent sur `master` restent conservés.

## Conservation éditoriale

Un relevé corrigé ajoute une version. Une publication conserve texte final, date, numéro, URL facultative, profil sans historique récursif, relevé et version du rendu. Les images de l’historique utilisent cette photographie, jamais le dernier relevé. Le rendu v1 doit être conservé si le style évolue.

## Vérifications

- `node scripts/test-public-portfolios.mjs` : persistance, conflits, périodes, pertes/zéros/absences, allocations, nature, benchmark, historique et tests d’actualisation.
- `node scripts/test-public-portfolio-refresh.mjs` : catalogue sourcé, migration/doublons/suppression, flux invalide/ancien, conservation des corrections et publications, publication isolée avec bail.
- `python3 -m unittest discover -s scripts -p test_public_portfolio_collector.py` : fixtures synthétiques séparées ; ratios sans renormalisation, total masqué, faux zéros, devise, démonstrations, schéma changé, pannes, conservation du dernier succès et restriction des URLs.
- `node scripts/playwright-public-portfolios.mjs` : trente profils initiaux, actualisations répétées, panne par source et transport sans perte, sauvegarde incomplète/rechargement, copie réelle, PNG/ZIP, historique, mobile et routes DCA/Budget/tweets. `BASE_URL` exerce la version publique et son vrai flux avant les simulations de panne dans le navigateur éphémère.

Aucune donnée fictive n’est ajoutée à la réserve de production. La lecture publique d’une allocation et la réussite d’une collecte ne certifient pas son rendement.


## Corrections de fiabilité du 16 novembre 2026

- Une allocation qui revient après un état différent (A → B → A) crée une nouvelle occurrence datée. Les lectures consécutives identiques restent dédupliquées. Les identifiants historiques, corrections, brouillons et publications restent intacts.
- La sauvegarde manuelle et la migration comparent le même code de tableau Getquin, y compris dans une autre langue ou avec des paramètres de partage. Aucun doublon existant n’est supprimé automatiquement : une fiche peut contenir un historique personnel distinct.
- Consultation, collecte, date effective d’allocation et période mensuelle sont affichées séparément. Une date effective inconnue reste inconnue. Le texte final précise la date de la répartition ; le rendu v2 la porte aussi. Les anciennes publications gardent leur rendu v1.
- Une performance chiffrée ne passe plus les contrôles avec une méthode, des frais ou des dividendes non précisés. Une méthode « Autre » exige une description documentée ; modifier ces conventions retire les coches de contrôle. Les anciens relevés et textes restent sauvegardés ; un brouillon incomplet doit être complété avant un nouvel export.

### Recherche pour un premier épisode

Les trente publications justificatives du catalogue ont été relues le 16 novembre 2026 sans compte. Leurs auteurs et liens partagés concordent. Cette revue porte sur ces publications, pas sur l’intégralité des publications de chaque auteur.

`performance-research.json` conserve une piste : Part_Time_Joe, bilan d’octobre publié le 1er novembre 2026, déclaration de −3,89 % en EUR. Le texte distingue un versement de la perte du mois. Il ne documente toutefois ni une méthode TWR/IRR, ni le traitement des dividendes/frais, et ne donne pas de rendement YTD chiffré. La valeur `relative_value` de la carte jointe n’a pas de période qualifiée : elle n’est pas réutilisée comme mois ou YTD. Les montants de début et fin de mois ne servent pas à reconstruire un rendement supposé.

La piste apparaît dans la fiche avec son lien, sa date de revue et les éléments manquants. Elle ne préremplit aucune performance et ne coche aucune vérification. Un épisode complet avec performance mensuelle reste bloqué par ces preuves fournisseur manquantes. Aucun rendement de démonstration n’est enregistré dans le catalogue ou le flux.

| Profil | Publication justificative | Conclusion sur le mois requis |
|---|---|---|
| Altmark96 | [2026-09-24](https://app.getquin.com/en/post/ksqCVGhiSk/mein-anfang) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| anticapitalism | [2026-06-12](https://app.getquin.com/en/post/zFmzSddVew/portfolio-update-5) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| AroundNicco | [2026-02-17](https://app.getquin.com/en/post/BfCJvMmVur/mid-month-update-february-26) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| BVLGARI | [2026-10-14](https://app.getquin.com/en/post/MuPkpjyAKl/meilenstein-400k) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| Chris98_ | [2026-01-18](https://app.getquin.com/en/post/cfgnfbOHHa/vorstellung) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| Daytamauit | [2026-08-08](https://app.getquin.com/en/post/xHCFasdoGm/portfolioanalyse) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| der_Don | [2026-10-27](https://app.getquin.com/en/post/FGuokofKJj/das-ist-jetzt-meine-endgultige-depot-aufstellung) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| DerDepotFuchs | [2026-10-22](https://app.getquin.com/en/post/txIgibxWff/zwischenstand-chf-25000-wie-lange-dauerts-wohl) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| DonkeyInvestor | [2022-11-24](https://app.getquin.com/en/post/NhIGEJGCTA/howto-portfolio-feedback-on-getquin) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| fizzelfritz | [2026-03-20](https://app.getquin.com/en/post/fyZjYvQkXn/portfolioumbau) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| IDtodal | [2026-10-06](https://app.getquin.com/en/post/RlkItAEDMm/kleines-update-zu-den-80k) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| jve05 | [2026-11-11](https://app.getquin.com/en/post/mqEfVeXmzx/tips-on-which-stocks-to-buy) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| Lewi | [2025-08-06](https://app.getquin.com/en/post/MQUQsrgXZK/depot-eines-19-jahrigen-angehenden-bankkaufmann) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| Maximil1an | [2026-07-21](https://app.getquin.com/en/post/XyOUxaPMvg/rostet-gerne-m21-dualer-student) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| mr_mezzanotte | [2026-09-16](https://app.getquin.com/en/post/JoKZLdJtxy/2-year-review) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| Pherror | [2026-06-15](https://app.getquin.com/en/post/TqqxcxhyqX/mein-depot) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| Pitosonzac | [2026-07-12](https://app.getquin.com/en/post/CDRxfRKdoh/first-post-feedback-appreciated) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| profit_pilot_3104 | [2026-09-26](https://app.getquin.com/en/post/uctVdsCWAa/rate-my-portfolio) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| Timdie | [2026-09-16](https://app.getquin.com/en/post/EsMCEBLYQw/less-than-1000-away-from-the-20k-milestone) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| value_visionary_211 | [2025-08-12](https://app.getquin.com/en/post/qroiITaTDE/portfolioverkleinerung) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| Catpitalist | [2026-10-30](https://app.getquin.com/en/post/McRqysFiao) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| cashing | [2026-01-04](https://app.getquin.com/en/post/nlRfigHRog) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| Part_Time_Joe | [2026-11-01](https://app.getquin.com/en/post/tPaFJFpoXR) | Octobre 2026 déclaré ; méthode, conventions et YTD manquants |
| 20fritz02 | [2025-11-03](https://app.getquin.com/en/post/upZPMkjfmX) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| GeneralRed | [2026-10-16](https://app.getquin.com/en/post/OJcYtwFSRA) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| Oktoberfest | [2026-08-09](https://app.getquin.com/en/post/vPESoYBWzY) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| Ricard99 | [2026-07-04](https://app.getquin.com/en/post/vzHQwWyaRM) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| Cloo | [2026-06-01](https://app.getquin.com/en/post/jvvFBecdiR) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| JoshuaDL | [2026-05-28](https://app.getquin.com/en/post/DGIjzuwZyV) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
| LMHNK | [2025-02-03](https://app.getquin.com/en/post/kgAeBricLv) | Pas de rendement d’octobre 2026 avec méthode qualifiée dans cette publication |
