# Extension de la roadmap — 14 octobre 2026

Périmètre demandé : enrichir les outils existants, conserver les squelettes de publication et les images, hors analyse d’entreprise et brouillons.

## Ajouts livrés

- Six parts ETF qualifiées automatiquement : World couvert EUR (IE00B441G979), obligations d’État euro 5–7 ans (IE00B4WXJG34), immobilier européen hors Royaume-Uni (IE00B0M63284), iBonds euro 2029 capitalisant (IE000SNLFDR7), services publics européens (DE000A0Q4R02), télécommunications européennes (DE000A0H08R2).
- Sources partagées : identité, cotations officielles, frais, encours avec périmètre, années NAV complètes, pays, secteurs et principales positions. Les données du fonds immobilier restent classées Real Estate par l’émetteur ; ses positions sont des actions.
- Dix historiques mensuels : les six ETF, TotalEnergies, Vinci, Sanofi et Booking. Cours ajustés pour les performances ; clôtures brutes distinctes pour les anniversaires. Les trois actions françaises commencent en janvier 2016, car décembre 2015 diverge entre exports quotidien et mensuel. Aucune interpolation de cette période.
- Actualisation automatique par les collecteurs existants. Six ETF dans les fiches et comparatifs ; cinq disposent des six années nécessaires aux allocations manuelles et aux duels. Le fonds 2029 n’est pas artificiellement prolongé avant son lancement.
- Cinq comparatifs : World couvert/non couvert, obligations euro très courtes/intermédiaires, échéances 2028/2029, services publics/télécoms, immobilier européen/mondial. Dans le comparatif World, les rendements conservent leurs devises ; le texte indique pourquoi leur différence n’isole pas l’effet de la couverture. Le duel réalise la conversion commune en EUR avec les séries BCE existantes.
- Quatre duels : couverture World, obligations intermédiaires, secteurs de réseaux, immobilier européen à côté du World.
- Six fiches pratiques : baisse d’un ETF obligataire, duration/maturité, cumul des frais en assurance-vie, encours fonds/part, spread et lecture du 13F. Références AMF, SEC et documents émetteur contrôlés automatiquement.

## Données et structure

Les duration, maturité moyenne, rendement actuariel et rendement distribué sur douze mois disponibles sont collectés dans `fundamentalsAndRisk`. Chaque valeur conserve sa date, sa définition et sa source. Le rendement actuariel est avant frais ; il ne constitue pas un rendement promis. Les mesures sont consultables dans la bibliothèque et suivies par le Radar.

La composition du World couvert est dérivée de toutes les positions publiées, couvertures signées comprises, sans renormalisation. Le tableau d’exposition brut de l’émetteur n’est pas assimilé à une allocation de valeur liquidative.

Le Radar couvre désormais les registres qualified, non-bond et LifeStrategy, en plus du registre historique. Il suit aussi les changements d’indice, de politique de revenus, de réplication et des mesures. Une correction à date identique reste un conflit de source, pas un mouvement de marché. Ses déclencheurs suivent les collecteurs correspondants.

Les registres qualifiés sont projetés au build, sans charger leurs captures brutes et leurs doublons dans le navigateur. Les budgets existants des pages restent respectés. Les validations de déploiement devenues obsolètes sont écartées avant installation ; les tests des PR et le contrôle final avant publication restent obligatoires.

Dilemme est retiré de l’accueil et de la navigation ; les anciens liens directs restent fonctionnels. Les formulations du générateur, des duels, des comparatifs et des présentations ont été retouchées sans changement des rubriques, calculs ou ordres de publication. Les illustrations et moteurs d’image existants sont conservés ; les nouvelles expositions réutilisent leurs scènes.

## Vérification et limite externe

Contrôles des identités, provenance, historiques et consommateurs ; tests de parsing et de dates ; tests des squelettes, du Radar et des budgets de pages ; vérification Chromium des outils, exports et des 53 fiches pratiques.

Les flux Vie publique `actualites-feeds.xml` et `lois-feeds.xml` répondent encore HTTP 503 au contrôle du 14 octobre. Les erreurs restent signalées ; aucune actualité n’est inventée et aucune dernière observation validée n’est supprimée.
