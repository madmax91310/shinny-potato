# Le budget de… : contexte financier et questions, 2 novembre 2026

## État vérifié et périmètre

Master au départ : `0c244dc`, après #1147. Les instructions CLAUDE.md et les règles éditoriales, de données, de visuels et de recette de l’audit du 18 octobre sont relues ; aucun AGENTS.md applicable trouvé. Les PR ouvertes #1150 (historiques/reçus de publication), #1149 (qualification financière), #1061 et #1042 ont été examinées. Elles ne modifient pas les fichiers du budget ; leurs travaux sont préservés.

La route publique `/le-budget-de`, ouverte dans Chromium à 390 px avant modification, propose **70 profils**. Le `build-info.json` servi porte `sha=462de7082861280b1d362d23612dad4beb475ca2`, `builtAt=2026-11-02T11:17:02Z`. Le champ `dataSha` absent vaut ce même SHA dans ce format de publication. La banque de master contient aussi 70 profils. Cette intervention **n’ajoute aucun profil**, ne modifie aucun de leurs champs, montant ou identifiant, et ne publie rien sur X.

## Audit exhaustif et accès aux sources

L’[audit par profil](budget-editorial-context-2026-11-02.csv) contient, pour chacune des 70 fiches : source et période du budget, état d’accès, messages retenus, contexte/projets, interrogation exprimée lorsqu’elle est établie, questions retenues et leur origine, traitement et limites. Aucun profil n’est écarté de la revue parce que sa source contient peu de matière.

- **47 fiches avec source relue** : 28 Finary, 4 Mustachian Post, 9 PDF Budget-conseil Suisse, 4 exemples Plan & Multiply, 1 Indexo, 1 Websourd. Plusieurs profils peuvent partager une page contenant des situations distinctes.
- **23 fiches sans nouvel accès au contenu** : 12 Reddit, 8 ELLE, 3 Aufeminin. JSON Reddit renvoie 403 ; les pages HTML publiques alternatives examinées ne livrent que l’enveloppe « Reddit », sans publication ni commentaires. L’accès old.reddit testé redirige vers la connexion. ELLE renvoie 403 ; Aufeminin est bloqué par le proxy (403). Aucun contournement authentifié ni témoignage attribué à une page non relue. Les informations déjà vérifiées du dépôt restent utilisables et sont identifiées comme telles.

Pour les forums, le message exact de l’URL est identifié, y compris lorsqu’il s’agit d’une réponse et non du premier message. Les réponses du même pseudonyme sont récupérées par le filtre d’auteur de Discourse ; les citations d’autres intervenants sont exclues des empreintes de preuve. L’origine de chaque paragraphe/question garde ses URL, numéros de messages, auteur, date de publication et empreinte du texte. Les documents gardent l’empreinte de la réponse publique. Les éléments conservés sans nouvelle lecture pointent vers les fichiers et le commit du dépôt qui les portaient.

Les dates de revue ne remplacent ni la période du budget ni la date de publication manuellement déclarée par l’utilisateur. Les réponses postérieures utiles sont situées comme telles ; les évolutions qui rendraient les périodes incompatibles restent dans l’audit plutôt que remplacer la photographie d’origine.

## Résultat éditorial

**70 textes enrichis et relus** : 35 récits développés à partir du contexte sourcé, 23 contextes conservés et réorganisés avec des questions éditoriales, 12 discussions de budgets de référence. Une fiche pauvrement documentée garde un récit court. Il n’y a ni histoire imposée, ni capital, métier, projet, placement ou horizon inventé.

**28 profils** comportent au moins une reformulation d’interrogation sourcée ; les **42 autres** ont uniquement des questions éditoriales. Six profils combinent ces deux origines. Au total : **45 questions ciblées sourcées et 59 éditoriales**, puis une question générale sur le budget. Le choix et l’ordre sont stockés explicitement : aucun tirage de questions à l’affichage. Les questions sont regroupées après le récit, jamais dispersées entre les dépenses.

Le budget chiffré reste la première partie. Les paragraphes suivants précisent, selon les sources, la réserve déjà constituée, les enveloppes, l’ancienneté, les projets, les horizons et les décisions envisagées. Les exemples préparés et de référence gardent leur titre d’exemple ; une question proposée aux lecteurs ne devient pas une hésitation de la personne.

### Trois exemples avant/après

| Profil | Avant | Après |
| --- | --- | --- |
| Lucas, alternant | Trajets et retraits sur Livret A ; question sur le versement fixe ou variable. | PEA depuis février 2023, Livret A 7 000 €, PEA 13 000 €, PEE et assurance-vie distingués ; diversification à long terme. « Quel rôle donneriez-vous à l’assurance-vie à côté de son PEA déjà investi en actions mondiales ? » (interrogation sourcée), puis question éditoriale sur le maintien de la réserve. |
| Sébastien, 31 ans | Explication de l’enveloppe de dépenses courantes ; question générale sur l’organisation du budget. | Réserve de 28 300 €, PEA récent, retraite, voyage de 2 000 € et transfert envisagé de 5 000 €. « Pour ces 5 000 €, comment choisiriez-vous entre un versement unique et des achats progressifs ? » (interrogation sourcée), distincte du niveau de réserve à garder. |
| Clémence, exemple de référence | Virement de 250 €, marge de 65 € et échéance du crédit auto, sans montant du livret. | Le modèle précise désormais les 1 200 € déjà sur Livret A. « Quel premier objectif de réserve retiendriez-vous avec les dépenses de ce budget ? » (question éditoriale), puis question sur l’usage de l’allègement réel du crédit. Aucun patrimoine attribué à une personne authentifiée. |

### Limites et décisions de qualification

- Julien (locatif) : placements en partie financés par prêt étudiant décrits comme placements, pas comme réserve nette. Les idées de dissimulation de crédit/loyer ne sont pas sollicitées dans les questions ; aucune hausse de salaire espérée n’est acquise.
- Nicolas et Marion : donation distincte du salaire, projets et enveloppes envisagés en novembre ; les achats de décembre et totaux patrimoniaux incohérents ne deviennent pas des avoirs de novembre.
- Paul : l’état de juin 2025 est conservé. Les arbitrages de juillet sont lus mais ne réécrivent pas rétroactivement ce budget.
- Alexandre : la simplification annoncée dans une réponse du même mois est décrite comme une évolution ultérieure, sans remplacer les versements du scénario.
- Sébastien (31 ans) : pas de reprise des pourcentages d’allocation qui ne concordent pas exactement avec les euros annoncés, ni de taux de livret daté présenté comme actuel.
- Sébastien et Mélanie : 50 000 € attendus en 2027 restent futurs ; les précisions différentes de titres détenus ne permettent pas de reconstituer une nouvelle allocation certaine.
- Émilien : année de rentrée toujours inconnue, 750 € à investir/épargner toujours une option ; ni solde ni virement modifié. L’aide aux parents reste une sortie distincte.
- Adrien et Léa : réponses à la publication du bilan 2025, arrivée d’un bébé attendue en février 2026 ; pas une année de dépenses déjà réalisée avec enfant.
- Samuel : dépenses de vacances distinctes des versements ; la question de février 2026 sur une indemnité d’assurance ne complète pas le bilan 2025.
- Clémence, Hugo et Océane : montants de livret ou cibles identifiés comme appartenant au modèle publié. La promesse d’apport atteint en 24 mois n’est pas reprise : l’encours initial est inconnu. Assurance et crédit auto groupés ne disparaissent pas intégralement à la fin du crédit.
- Sources bloquées : aucun nouveau patrimoine ou avis personnel tiré d’un titre ou d’une réponse inaccessible. Les hypothèses des anciens exemples restent dans leur provenance ; elles ne deviennent pas des déclarations authentiques.

Les règles fiscales, frais, taux et rendements cités par les contributeurs ne sont pas repris comme des caractéristiques actuelles de produits. Une mention de support dans un récit ne modifie pas les registres financiers des autres outils.

## Préservation et recette

La nouvelle couche `publication-context.json` est consommée uniquement pour la fin du texte et pour sa provenance dans le panneau de vérification. Le moteur d’image ne la dessine pas ; modèle 3 et deux modes inchangés. Aucun stockage ou schéma de sauvegarde modifié.

Le test de non-régression compare les **70 profils complets** à l’empreinte de départ, la première partie de chacun des textes à son empreinte avant intervention, et les présentations utilisées par les images à leur empreinte de départ. Il vérifie la couverture de toutes les fiches, la provenance des ajouts, la séparation interrogation/question éditoriale, la reproductibilité, le renouvellement du texte automatique et la conservation d’un texte personnalisé sur chaque profil. Une participation personnelle ne récupère jamais le récit de la banque, même si elle conserve un ancien identifiant.

Les résultats finaux de compilation, de recette navigateur, des contrôles GitHub, de fusion et de publication publique seront consignés dans la PR de livraison. La réussite d’un build local n’est pas présentée comme une publication Pages.
