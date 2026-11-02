# Comparatif ETF : pondérations nettes — 2 novembre 2026

Suite de #1157 (fusion dca0158b). Les observations Treasury104,56 % et liquidités/dérivés−4,56 %, au30octobre, sont déjà validées par rapprochement des47positions et enregistrées sur master. Le sélecteur des principaux secteurs écartait toutefois toutes les valeurs négatives : le ComparatifETF aurait montré104,56 % sans son solde compensateur.

La sélection de lignes conserve désormais le solde signé **uniquement** pour une observation qualifiée `signed-net-assets-reconciled-holdings`. Les trois lignes maximales et le squelette graphique sont préservés. Le texte et l’image affichent les mêmes lignes, avec leur date et la mention « % de l’actif net ». Le texte explique le total des positions positives et son solde négatif. Aucun chiffre n’est recopié dans les textes ; les formatages existants sont conservés (deux décimales au plus dans le texte, une décimale dans l’image). Les champs de performances et les protections des comparaisons/donuts ne changent pas.

Deux sélections sont concernées : « Obligations euro : très courtes ou intermédiaires » et « Monétaire ou obligations courtes ». La régression partagée vérifie les compensations et l’identité des données du texte et de la carte. La recette `scripts/playwright-source-incidents.mjs` couvre ces deux sélections sur1440/390, avec génération et exports PNG réellement téléchargés identiques aux aperçus, en plus des fiches Treasury et S&P déjà couvertes.

Les fichiers des PR#1158 (ABTC), #1159 (preuves financières/NAV) et #1160 (budget) ne sont pas modifiés. Le blocage d’accès S&P depuis GitHub reste documenté dans `docs/source-incidents-2026-11-02.md` et n’est pas masqué par cette correction éditoriale.
