# Automatisation des données restantes — 20 octobre 2026

## Périmètre produit confirmé

Bricks, Enerfip, Hectarea et Matis sont des fiches générales de plateformes. Aucun projet ni aucune œuvre n’est sélectionné. La collecte quotidienne conserve les conditions publiques, les sources, les exceptions tarifaires et les divergences publiées. Les documents, taux, échéances et coûts propres à une opération sont affichés comme conditions variables selon le projet. Ils ne constituent plus des champs manquants de la fiche générale.

Cette clarification ne résout pas les informations générales non publiées : le montant des frais de petits retraits Hectarea reste à compléter. Les durées divergentes des pages Matis restent signalées. Le fonctionnement éditorial de chaque acteur garde sa date de revue distincte de la collecte des conditions publiques.

## Raccordements qualifiés

- IDEX : ISIN US45167R1041, ticker IEX, USD, New York Stock Exchange Inc., nom IDEX, pays United States, secteur Industrials. Le portefeuille complet officiel BlackRock MSCI World au 19 octobre 2026 confirme ces identifiants. La cotation secondaire Borsa Italiana 1IEX en EUR est distincte. L’identité rejoint le collecteur existant des classifications des actions ; aucun historique de cours manquant n’est inventé. Preuve : `scripts/source-snapshots/dca-equity-identity-review-2026-10-20.json`.
- Iroko Zen : bulletin trimestriel officiel stable, empreinte SHA-256 conservée. Répartition au 30 juin 2026, en valeur d’expertise hors droits ; la période de validité du bulletin ne date pas le patrimoine. Huit pays et six catégories sectorielles, dont la catégorie combinée « Santé, hôtellerie, autre », conservée telle que publiée. Le chargeur public a changé de guillemets dans ses constantes : découverte des paramètres corrigée, sans exécution de JavaScript et avec contrôle du domaine API. Extraction déterministe des coordonnées du PDF et contrôle des totaux, des lignes et de la date. Un échec ou une régression du bulletin conserve la répartition avec sa propre date de vérification et produit un incident distinct ; les autres observations datées peuvent continuer à évoluer.

## Sources examinées qui ne permettent pas encore une automatisation complète

- TOPIX : le CSV officiel JPX japonais publie 1 636 lignes au 31 août 2026, total 99,9985 % avant tout arrondi supplémentaire. Un rapprochement exact code Tokyo/JPY avec les identités officielles iShares Japan laisse 787 codes sans identité, soit 2,6981 % des poids. Aucune identité n’est déduite du nom japonais et aucun poids du fonds n’est utilisé comme poids de l’indice. Cette source est une piste qualifiée pour un raccordement partiel, pas une composition totalement identifiée.
- WisdomTree : accès aux pages actuelles refusé dans la collecte réelle. Une fiche plus ancienne n’est pas redatée pour effacer un retard.
- Global X : les périodes discrètes disponibles ne sont pas des années civiles ; les performances d’une autre classe de part et les paniers de substitution ne comblent pas les données de la part suivie. Les divergences QYLD restent visibles.
- L&G : l’API publique expose les identités des fonds et leurs documents ; aucune composition complète actuelle qualifiée n’a été obtenue pendant cette revue.
- STOXX : les aperçus de dix constituants ne constituent pas une composition complète. Les erreurs TLS des anciens liens ne sont pas contournées en désactivant la vérification des certificats.

## Suite des travaux

L’inventaire généré au build reste la liste de référence des actions restantes. Les compositions physiques manquantes, les indices de référence des ETF synthétiques, les champs non publiés et les corroborations manuelles conservent des statuts distincts. Les contrôles HTTP d’accessibilité ne renouvellent jamais une date financière ni une qualification. Un raccordement n’est terminé qu’après collecte réelle, contrôles de périmètre et publication vérifiée.

## Bulletins Corum de septembre et livraison des données

Les bulletins Origin, XL et Eurion publiés le 19 octobre 2026 décrivent le patrimoine au 30 septembre. Leur format fournit maintenant des libellés PDF extractibles : pays, secteurs et indicateurs sont associés par leurs coordonnées, avec libellés reconnus, totaux et période imprimée concordant avec le lien officiel. La méthode visuelle antérieure reste réservée aux documents sans tableau textuel. Le SHA-256 du bulletin est conservé ; les fixtures historiques de juin ne sont pas redatées.

Les publications validées des acteurs et des SCPI peuvent actualiser le code déjà public sans attendre la validation d’un nouveau calendrier éditorial. Le collecteur conserve ses contrôles obligatoires avant enregistrement. Le publieur exige des consommateurs financiers inchangés, compose uniquement les chemins de données automatisées connus, et exige le fichier exact validé du producteur après tous les générateurs. Compilation, catalogue et test navigateur des routes précèdent la publication ; le verrou commun couvre toute la composition et la publication. Le contrôle d’ordre protège les données et le code déjà publics. Le manifeste final, les empreintes HTTP publiques et les identités distinctes code/données sont vérifiés. Les trois fichiers du calendrier, de l’accueil et du catalogue d’outils sont indépendants des consommateurs financiers pour cette vérification. Toute autre modification de code dans src attend sa publication normale.
