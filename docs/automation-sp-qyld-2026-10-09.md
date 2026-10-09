# Qualification S&P / QYLD — 9 octobre 2026

## S&P : la session navigateur GitHub reste bloquée

Le run 37883906349 de la PR 380 charge la page publique des indices avec
Chromium standard, puis le JSON public par fetch same-origin dans la même session.
Sur Ubuntu 26.04, la page Global retourne HTTP 403 et le JSON HTTP 403.
macOS 15 échoue également. Les tests s'arrêtent sur Global : ce run ne prouve
pas un accès navigateur distinct à Euro, dont la requête directe était déjà
bloquée lors des tests du 8 octobre. Aucun contournement, désactivation de contrôle
d'identité ou proxy tiers n'est utilisé.

Conclusion opérationnelle : ni les headers usuels, ni le changement d'OS,
ni une session Chromium normale ne résolvent l'accès depuis les runners testés.
Une collecte autonome nécessite un accès S&P documenté ou un environnement
persistant dont l'accès public est confirmé. Aucun environnement de ce type
n'est configuré dans cette PR. Les dernières observations restent conservées,
avec alerte d'échec ; un import manuel ne constituerait pas une automatisation.

## QYLD : documents retrouvés, calendrier encore non qualifié

Page officielle : https://globalxetfs.eu/funds/qyld
Rapports : https://globalxetfs.eu/annual-reports
Les pages sont accessibles. L'ancien PDF répond 404 ; le nouveau Factsheet
FundAssist identifié dans la page répond toujours 500.

Les rapports semestriels de décembre pour Global X ETFs ICAV sont disponibles :

- 2023 : https://gxeustrapi.blob.core.windows.net/webpublic/uploads/C21811_C435449_20231230_FSIIFS_7844aa7fac.pdf
- 2024 : https://gxeustrapi.blob.core.windows.net/webpublic/uploads/C21811_C435449_20241230_FSIIFS_66ff493939.pdf
- 2025 : https://gxeustrapi.blob.core.windows.net/webpublic/uploads/C21811_C435449_20251231_FSIIFS_e693db0787.pdf

Dans les notes Share capital, la section Global X Nasdaq 100® Covered Call UCITS
ETF distingue explicitement USD Accumulating et USD Distributing. Elle publie
nombre de parts, actif net et VL pour décembre courant, juin courant et décembre
précédent. La part distribuante a donc des observations de clôture décembre
2022 à décembre 2025. La division actif net / nombre de parts fournit une VL
plus précise que la valeur arrondie imprimée ; ce ratio ne constitue pas seul
un rendement avec réinvestissement des distributions.

La page actuelle contient 41 lignes distributionHistoryData : juin 2023 à
 octobre 2026. Sept lignes seulement appartiennent à 2023, contre douze pour
2024 et douze pour 2025. Une ancienne page officielle italienne indexée présente
les distributions de février à mai 2023 ; ces quatre lignes sont absentes de
la réponse HTTP actuelle inspectée. Un résumé de moteur de recherche n'est
pas une source automatisée fiable et ne remplit pas ce trou.

Autre point de qualification : chaque ligne comporte EX_DATE, RECORD_DATE,
PAYMENT_DATE, AMOUNT, NAV et DIST. La date exacte de la NAV associée doit être
confirmée avant de l'utiliser pour une hypothèse de réinvestissement. Les VL
arrondies et leur absence de convention explicite empêchent d'assimiler le
calcul candidat à un total return NAV officiel. Aucun rendement annuel
reconstruit n'est publié par cette PR.

Les deux tables Top 10 Reference Index Constituents divergent encore et la
répartition sectorielle imprimée reste incohérente avec le Nasdaq. Le panier
de substitution n'est pas l'exposition économique ; il reste exclu.

## Prochaines dépendances réelles

S&P : environnement de collecte autorisé et persistant, ou accès API documenté.
QYLD : historique de distributions complet de la part IE00BM8R0J59 avec VL et
convention de réinvestissement documentées, ou tableau calendaire officiel
identifié pour cette part. Les parts capitalisante et américaine ne remplacent
pas la part distribuante UCITS. Le prototype de diagnostic ne doit pas être
présenté comme une résolution des deux blocages.
