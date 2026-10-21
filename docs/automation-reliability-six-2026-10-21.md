# Automatisation et fiabilité : chantiers 1 à 6

## Contrat de cette livraison

Le travail porte sur les collecteurs, les sources, les données partagées et leur validation. Aucun texte de tweet, moteur de rédaction, composant de présentation ou modèle d’image n’est modifié. Les valeurs renouvelées suivent les raccordements existants. Analyse d’entreprise reste retirée.

## Travaux et preuves

| Chantier | Intervention et contrôle |
|---|---|
| 1. Incidents | Renouvellement réel TWD/EUR et WisdomTree Cloud depuis l’environnement de collecte. Une nouvelle exécution réglementaire GitHub a révélé quatre coupures de connexion DILA : le téléchargement dispose maintenant de trois tentatives bornées, avec quatre requêtes simultanées au maximum. Les échecs continuent à conserver la dernière observation sans rajeunir sa date. |
| 2. Performances | Les historiques ajustés mensuels et cours des séances terminées disposent d’un accès de secours sur l’autre hôte officiel Yahoo. La requête, l’identité, la devise, le fuseau, les contrôles quotidiens/mensuels et les dividendes restent inchangés. L’URL réellement utilisée reste dans les preuves. Un contenu financier incohérent est rejeté. |
| 3. Compositions | Renouvellement réel des 65 lignes WisdomTree Cloud, dont une identité reste inconnue ; aucun ISIN déduit du nom. Vingt nouvelles correspondances SEDOL/ISIN ont été vérifiées par requêtes indépendantes OpenFIGI. Les variantes de libellés servent uniquement à proposer des requêtes, jamais à attribuer une identité. Le cycle quotidien peut traiter douze correspondances avec un espacement de trois secondes entre requêtes, sans dépasser vingt-quatre sur invocation explicite. La découverte des neuf compositions manquantes a été rejouée. L&G réessaie la même page officielle lorsque le portail sert un explorateur générique ; la clause PCF reste bloquante. |
| 4. Raccordements | Recalcul de l’inventaire complet après collecte : 81 raccordements à traiter contre 86 au départ ; aucune disparition par suppression d’actifs ou assouplissement des exigences. Les absences, contradictions, indices économiques et premières années incomplètes restent distingués. |
| 5. Autres données | Nouvel adaptateur de caractéristiques Invesco : ISIN exact, date effective, PEA explicite, couverture de change, domicile, distribution et réplication lorsqu’ils sont publiés. Trois statuts PEA précédemment manquants sont raccordés à l’API officielle ; quatre parts ont été réellement recollectées. Un champ absent ou « N/A » ne devient pas une valeur financière. Les 14 publications réglementaires ont été validées localement. Le cycle GitHub des huit courtiers a réussi ; celui d’intégration des actifs s’est terminé avec succès. |
| 6. Pannes et secours | Accès FRED limité à la fenêtre utile depuis janvier 1999, puis export canonique de secours, avec bornes d’attente et preuves de la route utilisée. Yahoo dispose de deux routes du même fournisseur ; il ne s’agit pas de deux sources indépendantes. Les retraits, erreurs et rejets financiers ne sont jamais transformés en renouvellements réussis. |

## Mesures avant publication

Les 688 historiques mensuels suivis sont actuels. Le contrôle des performances compte 238 calendriers actuels, sept alternatives calculées à partir des historiques et treize premières années en attente. Les ventilations pays et secteurs comptent chacune 229 observations actuelles ; les catégories non applicables ne sont pas des données manquantes. Le suivi des positions intégrales compte 174 observations actuelles.

Ces mesures portent sur leurs périmètres respectifs et ne s’additionnent pas. Un téléchargement réussi localement ne certifie pas son accès depuis GitHub. Le renouvellement futur des collecteurs modifiés doit être observé en production ; les tests et la publication ne suffisent pas à le prouver.

## Limites qui restent ouvertes

Trente raccordements demandent les constituants et les poids de l’indice économique exact. Un fonds physique voisin ou un panier de substitution n’est pas une source équivalente. Les neuf compositions en découverte restent non qualifiées lorsque leurs identités ou leur portée ne sont pas établies. Le statut PEA Avantis encore inconnu et la contradiction iShares Euro Dividend restent ouverts. Certaines conditions d’assurance-vie, de véhicules privés ou de courtiers ne sont pas publiées assez précisément pour une extraction qualifiée.

Les secteurs et pays de la seule poche actions d’un fonds multi-actifs ne deviennent pas sa ventilation totale. Les performances d’une autre part ou une année incomplète ne remplacent pas celles demandées. Les limites restent dans le suivi technique existant, sans nouvelle mention dans les tweets ou les images.

## Validation

Tests du changement d’hôte Yahoo, de la conservation des conventions, du secours FRED, du refus des mauvaises identités et dates Invesco, des coupures DILA, des propositions d’identités et du rejet des paniers L&G. Régressions des collecteurs mensuels, des métadonnées et des automatisations. Compilation avec budgets de routes, audits des sources et recette Chromium des fiches et comparatifs en mobile et bureau.

La fusion et la publication restent soumises au portail complet ; la livraison publique est vérifiée séparément après déploiement.
