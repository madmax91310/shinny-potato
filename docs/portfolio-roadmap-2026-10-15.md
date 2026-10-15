# Suite de la roadmap globale — 15 octobre 2026

Périmètre : hors analyse entreprise, sans modification des visuels ni des squelettes des publications. Noms des produits préservés. Sauvegarde/synchronisation exclue.

## Travaux

1. Documents courtiers : collecte relancée, sept courtiers revalidés. Le barème officiel Bourse Direct applicable au 6 janvier 2026 a été relu via son document public : courtage, change, garde et transfert concordent avec les valeurs conservées. Le téléchargement automatisé renvoie encore HTTP 502 sur les domaines .fr et .com. La relecture ne remplace pas une collecte réussie ; aucune réserve contractuelle étrangère à ce document n’est levée.
2. Duels : 36 allocations préparées de deux ou trois lignes, validation commune au mode manuel et aléatoire. Socles World, ACWI, ACWI IMI, All-World, S&P 500 et équipondéré. Les comparaisons mono-ligne ont été retirées ou remplacées par de véritables allocations. Les anciennes préférences mono-ligne sont réinitialisées.
3. Générateur : huit parts déjà automatisées ajoutées au mode manuel : émergents hors Chine, semi-conducteurs mondiaux, financières mondiales, blockchain, STOXX Europe 600, cuivre à terme, platine et palladium. Total : 152 supports. Les recettes automatiques et poids des profils sont préservés. Statuts PEA issus du registre, jamais déduits de l’exposition.
4. Lecture : explications propres aux huit supports, correction de la lecture ACWI IMI et de ses chevauchements avec les petites capitalisations. Comparaison des principaux écarts pays/secteurs uniquement sur des photographies de même date, périmètre et classification couvrant chaque portefeuille à 100 %. Aucun poids manquant remplacé par zéro, aucune explication causale des performances historiques par les compositions actuelles.
5. Réutilisation historique : liens depuis chaque ligne du générateur vers la performance de la part exacte et le simulateur mensuel, uniquement si les historiques sont qualifiés. Les historiques mensuels existants servent déjà les formats historiques et anniversaire ; aucune série annuelle transformée en série mensuelle. Aucune nouvelle série externe inventée pour les supports sans historique mensuel qualifié.
6. Contrôles : 622 rendements communs comparés entre générateur et duels, rendements pondérés des allocations préparées, périodes courtes, change, données manquantes et noms contrôlés. Nouveau contrôle ajouté à la CI.
7. Surveillance : priorité aux publications échouées et contradictions, puis à l’étendue des outils affectés ; dédoublonnage des champs regroupés. Les retours à la normale restent alimentés par le moniteur existant ; pas de notification manuelle ni de remise à zéro des accusés de réception.

## Limites restantes

- Les clauses de transfert Trade Republic et Crédit Agricole Île-de-France non qualifiées demeurent signalées ; une possibilité de transfert ne prouve pas son tarif.
- Bourse Direct : collecte automatique à rétablir lorsque les documents sont accessibles. Source du barème : https://www.boursedirect.fr/pdf/tarifs_bd.pdf ; catalogue : https://www.boursedirect.fr/fr/formulaires-en-ligne.
- Les huit ajouts sont utilisables manuellement ; les profils automatiques n’ont pas été étendus arbitrairement à ces expositions.
- Comparer des expositions exige des photographies compatibles ; à défaut, les détails de chaque portefeuille restent accessibles séparément.

## Validation

Contrôles de provenance, catalogue, 500 générations de duels, éditorial de tous les supports, changement d’année et audit global exécutés localement. Build et vérifications navigateur de la CI exigés avant fusion. Le téléchargement local Chromium a échoué (archive vide), sans suppression du contrôle navigateur.
