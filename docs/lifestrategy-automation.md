# Vanguard LifeStrategy

Quatre parts capitalisantes exactes : 20/80 IE00BMVB5K07, 40/60 IE00BMVB5M21,
60/40 IE00BMVB5P51, 80/20 IE00BMVB5R75. Le premier nombre désigne les actions.

La collecte quotidienne utilise les pages officielles françaises, leur lien courant
vers la fiche Vanguard et l’API publique GPX. ISIN, code produit, EUR, politique de
capitalisation et cotation Xetra sont contrôlés. Les frais du PDF sont recoupés avec
la page. L’encours est celui de la part, arrondi au million dans le PDF, jamais
celui du fonds entier ni une estimation cours × nombre de parts. Chaque champ garde
sa date : fonds sous-jacents dans la fiche, allocation d’actifs sur la page,
rendements calendaires complets depuis 2021 dans GPX. Ni les secteurs ni les pays
des seuls fonds actions ne sont présentés comme ceux du portefeuille complet.

Les quatre historiques Xetra EUR utilisent les cours ajustés Yahoo, recoupés entre
requêtes quotidiennes et mensuelles. La plage commence en janvier 2021, premier mois
complet après le lancement. Le workflow mensuel existant reprend les échecs chaque
jour. La collecte quotidienne Vanguard conserve les dernières observations valides
et échoue visiblement si une source est absente, périmée ou change d’identité.

Consommateurs : Présentation ETF (quatre fiches), Comparatif ETF (40/60–60/40,
60/40–80/20 et gamme complète), Performance depuis, Et si tu avais investi,
Générateur de portefeuille (sélection manuelle), deux duels et quatre profils DCA.
Les duels comparent les années complètes communes et rétablissent les poids des
portefeuilles de plusieurs lignes chaque année. Le rééquilibrage interne de
LifeStrategy reste celui de Vanguard ; le portefeuille à deux ETF n’est pas une
réplique exacte de LifeStrategy. Les versions distribuantes restent exclues de cet
ajout. « Il y a X ans » est explicitement exclu, sans collecte de cours anniversaire.

Validation : collecte réelle des quatre parts et historiques, tests de rejet des
mauvaises identités/devises, dates périmées, frais divergents, composition tronquée
et encours fonds substitué ; tests des consommateurs, périodes et exclusion anniversaire.
La qualification sur GitHub Actions précède la fusion. Chromium contrôle les fiches
et les exports, dont les quatre nouvelles fiches et les comparatifs LifeStrategy.
