# JEPG — raccord de deux champs vivants, même suivi #881

Part IE0003UVYC20, USD distribuante. Le document Singapour encore servi au 6 novembre décrit le 31 août 2026 : ses pays, secteurs, calendrier et caractéristiques ne deviennent pas des observations de novembre.

La voie publique `FundsMarketingHandler/product-data?cusip=IE0003UVYC20&country=sg&role=per&language=en&userLoggedIn=false`, déjà utilisée pour les positions complètes, fournit :

- `fundData.aum.value` : 1 717 570 208 USD au 5 novembre. Le drapeau d’affichage USD et l’identité/devise du fonds sont contrôlés. Les 1 591 637 806 d’actifs de la part sont un autre champ, non utilisé comme encours du fonds.
- `fundData.dailyHoldings` : dix positions au 5 novembre, identifiants exacts et poids natifs en valeur de marché. Aucune renormalisation, aucun recouvrement complet inféré. Le total des valeurs de marché du portefeuille est encore une métrique distincte de l’encours ; il n’est pas forcé à lui être égal.

L’identité commune à `jpm_holdings.py` est extraite sans changer ses conditions. Le portefeuille complet conserve ses contrôles ; ces deux champs n’exigent pas sa disponibilité. Leur validation est indépendante : une donnée AUM invalide ne bloque pas un top 10 valide, et inversement.

Les valeurs PDF gardent leur source et leur période. Les classifications propriétaires de l’API ne sont pas substituées à celles du PDF. Une panne du PDF ne renouvelle aucun champ PDF conservé ; une panne de l’API n’écrase ni ne redate ses dernières valeurs valides. Les erreurs individuelles et tentatives de chaque source restent dans le compte rendu existant.

Preuve locale : réponse API réelle SHA256 `255a9f3c3724d9842f16fbcbb7305def29692c61298beca76be5f25f2f1f59bf`, contrôlée le 6 novembre, fixture intégrale compressée sous `scripts/fixtures/official-documents/presentation-six/jpm-live-api.json.gz`. La page officielle européenne affiche également « Fund size / As of 05.11.2026 / USD 1,72 Bn » ; sa fiche Techrules répond HTTP200 avec un corps vide, non considérée comme un PDF réussi.

Cette note ne certifie pas une publication ni un cron. Les reçus GitHub, l’enregistrement et la consommation publique doivent être joints au bilan final consolidé avant d’annoncer les usages rétablis. L’accès public ne constitue pas une licence de réutilisation indépendante.
