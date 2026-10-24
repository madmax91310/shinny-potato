# Histoires de marché — trois pilotes pour revue

Travail du 23 octobre 2026, base master cc1db76d. PR de revue uniquement : aucune fusion ni publication.

## Périmètre

Consignes lues : CLAUDE.md et docs/claude/audit-application-2026-10-18.md ; outil market-facts, sélection mensuelle, revue du 10 octobre, banque (données, validité, brouillons, recherche, copie et suivi), tests concernés. L’état courant compte **62 anciens récits**, dont **42 angles gabarits**, et **90 textes dans la banque avant ces trois ajouts** : les décomptes de l’audit du 18 octobre ne sont pas supposés toujours actuels.

Les PR #898 (données), #900 (GDX), #901 (portefeuilles IA), #902 (Radar) ont été examinées : descriptions et listes de fichiers complètes, recoupement des chemins. Le relevé des têtes est dans concurrent-prs.json. Les moteurs, séries, registres et producteurs partagés sont préservés. Aucune projection régénérée par le build n’est incluse dans la PR.

## Intégration

Dans /banque-tweets, sélectionner **Histoires de marché**. Trois textes enregistrés dans src/pages/tweet-bank/market-stories.js ; aucune génération depuis les rendements. Les fonctions de recherche, copie, brouillon et publication de la banque sont réutilisées. Une modification du texte retire sa validation de copie jusqu’à relecture, comme pour les autres contenus.

Les sources, chronologies avec renvois documentaires, limites et accroches alternatives sont dans des panneaux distincts. La copie principale contient seulement le récit. La date de relecture historique n’est pas présentée comme une donnée de marché du jour ; le ton reste à valider par l’auteur. Le suivi de publication et les brouillons restent locaux au navigateur. Copier ne marque pas publié.

Chaque récit est une publication longue unique ; l’interface signale qu’un compte X autorisant plus de 280 caractères est requis. Aucun découpage automatique en thread. Les caractères affichés sont un comptage Unicode de lecture, pas un calcul pondéré de quota X.

Aperçus : [banque ordinateur](banque-1440.png), [banque mobile](banque-390.png), puis captures de chaque récit avec preuves à 1440, 390 et 360 pixels.

## Validation

- npm run build : réussi, budgets existants inchangés, couverture publiée contrôlée. Voir build.log.
- node scripts/test-market-story-pilots.mjs : copie fidèle, exclusion des sources, revue explicite, catégorie et invalidation des textes modifiés.
- node scripts/test-tweet-bank-validity.mjs : réussi ; validité des guides existants préservée.
- node scripts/playwright-market-story-pilots.mjs : Chromium réel à 1440, 390 et 360 px, trois récits complets sans débordement, presse-papiers réel, accroches alternatives, sources, recherche, suivi/rechargement, correction/effacement de date, repos, brouillon et invalidation, copie de secours execCommand puis manuelle, changement de largeur. Voir browser.log. Les petits écrans sont simulés dans Chromium ; pas de test sur iPhone physique/Safari ni de publication X réelle.
- node scripts/playwright-tools.mjs --tweet-bank : réussi ; bilan personnel, brouillon, 20 textes pédagogiques et copie/sources/mobile.
- node scripts/playwright-tools.mjs --market-facts : réussi ; 62 récits, sélection, anti-répétition, copie et précisions.
- Comparaison en mémoire avec la base : les 90 textes antérieurs de la banque sont strictement identiques (identifiants, textes, métadonnées). Aucun changement de market-facts ni de son moteur.
- **Échec préexistant distinct** : node scripts/test-market-story-selection.mjs échoue dès l’assertion d’identité stricte FACTS[1] === NEWTON_STORY. Reproduit dans un worktree propre sur cc1db76d ; le contenu reçoit déjà une enveloppe dataContract qui crée un autre objet. Cette suite ne termine donc pas. Journal de base : test-ancien-echec-base.log. Pas de correction du moteur partagé ni d’assouplissement de test dans cette étape éditoriale.

## Recommandation sur les anciens contenus

Conserver tout pendant la validation des pilotes. Pour le remplacement ultérieur :

- **Garder comme sujets à documenter** Newton/1720, lundi noir/1987 et Nasdaq/2000 : événements et mécanismes distincts. Reprendre les sources primaires accessibles et retirer les jugements ou raccourcis non démontrés avant toute entrée dans la nouvelle catégorie. Aucune migration de leurs textes ici.
- **Réserver aux outils quantitatifs** les baisses et récupérations calculées, DCA et durées sous sommet. Elles restent utiles au calculateur et à la pédagogie, sans constituer à elles seules des histoires. Les six angles mensuels manuels demandent eux aussi de vrais événements documentés avant adaptation.
- **Abandonner pour la future rubrique narrative** les 42 angles gabarits et les répétitions « supporter la baisse / attendre la remontée », les listes de records et séries d’années sans protagonistes ni événement. Abandonner le format narratif ne signifie pas supprimer leurs séries ou calculs partagés.
- **Conserver séparément les archives de l’auteur** dans la banque : elles ne deviennent pas des histoires historiques, et aucun vécu personnel d’Épargnant Libre n’est ajouté.

## Documents consultés

Les huit documents ont été ouverts et leurs passages utiles contrôlés. sources/manifest.json indique URL, date du document, contrôle, emplacement et SHA-256 du corps reçu. Les captures HTML compressées conservent le contexte de consultation ; les liens de l’interface restent ceux des éditeurs. Pour Wirecard, les annonces prouvent la chronologie publique, pas les anciennes assertions comptables. Le 10-K Apple est une copie accessible du dépôt primaire, datée après l’accord. Platts complète les documents publics EIA/CFTC avec le cours de juin observé le jour même.

## Textes et dossiers de revue

### Wirecard : les 1,9 milliard introuvables

Le 18 juin 2020, Wirecard doit publier ses comptes annuels. À la place, le spécialiste allemand des paiements annonce que son auditeur ne peut pas confirmer l’existence de 1,9 milliard d’euros. 🔎

Cette somme représente environ un quart du total de son bilan. Elle est censée se trouver sur des comptes détenus par des tiers pour le groupe. Ce jour-là, Wirecard évoque des confirmations de soldes potentiellement falsifiées et dit travailler avec l’auditeur pour éclaircir la situation.

À ce stade, le communiqué ne reconnaît pas encore que l’argent n’existe pas. Mais le calendrier laisse peu de marge : sans comptes certifiés au 19 juin, environ 2 milliards d’euros de prêts peuvent être résiliés.

La question comptable devient donc une question de survie financière. Les banques peuvent-elles continuer à prêter sur la foi de comptes dont une somme aussi importante reste invérifiable ?

Quatre jours plus tard, le 22 juin, la position officielle change. La direction estime désormais très probable que les 1,9 milliard d’euros n’existent pas. Elle retire aussi ses prévisions de résultats et les résultats préliminaires de 2019.

Le 25 juin, Wirecard annonce sa décision de demander l’ouverture d’une procédure d’insolvabilité. Dans son explication, le groupe précise que, faute d’accord avec les prêteurs, 800 millions d’euros de crédits risquent d’arriver à terme ou d’être résiliés le 30 juin, puis 500 millions le 1er juillet. 📅

En une semaine, la recherche d’un justificatif bancaire s’est transformée en demande de protection judiciaire. Le chiffre déterminant n’était plus le bénéfice annoncé, mais l’argent dont l’entreprise pouvait réellement prouver l’existence.

Pas un conseil financier.

**Accroche alternative**

Chez Wirecard, 1,9 milliard d’euros figurent dans les comptes. Le 18 juin 2020, l’auditeur ne parvient pas à en confirmer l’existence.

**Dossier de preuves**

Protagonistes : Wirecard AG ; Ernst & Young, auditeur ; détenteurs des comptes fiduciaires ; banques prêteuses. Aucune responsabilité pénale individuelle n’est attribuée ici.

- **18 juin 2020** — Audit non conclu : preuves insuffisantes sur 1,9 Md€ (~25 % du bilan), confirmations potentiellement falsifiées ; prêts ~2 Md€ résiliables si comptes certifiés absents au 19 juin. (W1)
- **22 juin 2020** — La direction juge très probable l’inexistence des soldes ; retrait des résultats préliminaires 2019 et des prévisions. (W2)
- **25 juin 2020** — Décision de demander l’ouverture de l’insolvabilité. Risque sur 800 M€ au 30 juin et 500 M€ au 1er juillet faute d’accord bancaire. (W3)

**Sources**

- **W1** [Wirecard — communiqué du 18 juin 2020 (archive, rechercher « 18. June 2020 »)](https://wirecard.com/page/3/?p=company). Source primaire intéressée ; audit, quart du bilan et risque de résiliation. Document : 2020-06-18, consulté le 2026-10-23.
- **W2** [Wirecard / EQS — déclaration de la direction, 22 juin 2020](https://www.eqs-news.com/news/ad-hoc/wirecard-ag-stellungnahme-des-vorstands-zur-aktuellen-lage-des-unternehmens/1de1a32e-dd44-4564-99df-48db8851a60b). Source primaire ; premier paragraphe et retrait des résultats. Document : 2020-06-22, consulté le 2026-10-23.
- **W3** [Wirecard / EQS — décision de dépôt et échéances bancaires, 25 juin 2020](https://www.eqs-news.com/news/corporate/wirecard-ag-company-statement-regarding-filing-for-insolvency/54bc1989-3089-496a-883c-02db58f7804a). Source primaire ; décision et prêts, distincte du jugement d’ouverture. Confiance élevée. Document : 2020-06-25, consulté le 2026-10-23.

**Points non établis / limites**

- Les communiqués établissent ce que Wirecard annonce à chaque date ; ils ne certifient pas la véracité de ses comptes antérieurs.
- Le récit s’arrête à la décision de dépôt, pas au jugement d’ouverture. Il ne tranche ni le circuit exact des fonds ni les responsabilités pénales.
- Les ~2 Md€ du 18 juin et les échéances de 800 + 500 M€ du 25 juin ont des dates et périmètres distincts : ils ne sont pas additionnés.

### Apple : faire une place à Microsoft

Le 6 août 1997, Steve Jobs et Bill Gates annoncent un accord : Microsoft va investir 150 millions de dollars dans Apple. Mais une autre ligne du contrat touche directement les utilisateurs de Mac. 🍎

Internet Explorer, le navigateur de Microsoft, sera fourni avec le système d’Apple et proposé par défaut.

Pour Apple, le contexte est difficile : l’exercice 1996 s’est soldé par une perte de 816 millions de dollars. Et vendre des ordinateurs suppose de convaincre les clients qu’ils pourront y retrouver les logiciels dont ils ont besoin.

C’est là que l’accord prend tout son sens. Microsoft s’engage à développer de nouvelles versions d’Office pour le Mac. Les deux entreprises prévoient aussi des licences croisées sur leurs brevets et une coopération technique.

Apple obtient donc de l’argent et un engagement sur des applications essentielles à sa plateforme. Microsoft gagne une place privilégiée pour son navigateur dans les machines d’un concurrent. Les 150 millions sont investis en actions sans droit de vote : ce chèque ne donne pas à Microsoft le contrôle d’Apple. 🤝

L’accord laisse pourtant une difficulté entière : les deux entreprises continuent à se concurrencer.

Quelques mois plus tard, dans son rapport annuel, Apple prend soin de prévenir ses investisseurs. La relation avec Microsoft est limitée dans le temps, ne couvre pas de nombreux domaines de concurrence et pourrait nuire aux relations avec d’autres partenaires. L’entreprise ne garantit pas que les avantages l’emporteront sur les inconvénients.

En août 1997, accepter cet accord ne signifie donc pas connaître la suite de l’histoire. Cela signifie donner à un rival une place dans son produit pour obtenir les moyens de rendre ce produit plus viable.

Parfois, une entreprise doit aussi négocier les conditions de sa concurrence.

Pas un conseil financier.

**Accroche alternative**

En août 1997, Apple accepte que le navigateur de Microsoft devienne celui proposé par défaut sur ses Mac. En échange, le rival apporte bien plus qu’un chèque.

**Dossier de preuves**

Protagonistes : Apple ; Steve Jobs, alors administrateur et cofondateur ; Microsoft ; Bill Gates, président du conseil et directeur général. Le récit ne prête aucune intention privée aux dirigeants.

- **Exercice 1996** — Perte nette de 816 M$ ; chiffre historique repris dans les données financières du 10-K 1997. (A2)
- **6 août 1997** — Annonce au MacWorld Boston : 150 M$ en actions sans droit de vote, futures versions d’Office, Internet Explorer par défaut et licences croisées de brevets. (A1)
- **5 décembre 1997** — Dépôt du 10-K : dépendance aux logiciels tiers, relation limitée avec Microsoft et risques pour les autres partenariats. Ces réserves sont présentées après l’annonce, pas comme connues publiquement en août. (A2)

**Sources**

- **A1** [Microsoft — annonce de l’accord au MacWorld, 6 août 1997](https://news.microsoft.com/source/1997/08/06/microsoft-and-apple-affirm-commitment-to-build-next-generation-software-for-macintosh/). Communiqué primaire contemporain ; liste des termes et fonctions des dirigeants. Document : 1997-08-06, consulté le 2026-10-23.
- **A2** [Apple — Form 10-K 1997, déposé le 5 décembre (copie du document primaire)](https://d18rn0p25nwr6d.cloudfront.net/CIK-0000320193/b0bcedc7-e4d8-4a39-8f03-5b99f88e8f91.html). Item 6, Selected Financial Data ; Item 7, Microsoft Relationship et Support from Third-Party Software Developers ; note Preferred Stock. Confiance élevée. Document postérieur explicitement signalé dans le récit. Document : 1997-12-05, consulté le 2026-10-23.

**Points non établis / limites**

- Le récit n’affirme pas que les 150 M$ ont, à eux seuls, sauvé Apple ; aucune date hypothétique de faillite n’est retenue.
- La dépendance aux applications est documentée dans le 10-K. L’importance commerciale de l’accord est une lecture éditoriale de ses termes, pas un témoignage sur les pensées de Jobs.
- Aucun cours de Bourse, gain ultérieur, réaction du public ou dialogue n’est utilisé. Le succès futur d’Apple n’est pas tenu pour acquis.

### WTI : quand sortir du contrat a un prix

À Cushing, dans l’Oklahoma, le pétrole a besoin d’une place dans un réservoir. Le 20 avril 2020, cette contrainte va compter jusque dans le prix affiché sur les écrans de marché. 🛢️

Le contrat à terme sur le pétrole américain WTI pour livraison en mai expire le lendemain. Ceux qui conservent une position acheteuse à l’échéance doivent pouvoir prendre livraison du brut à Cushing, sauf arrangement préalable.

D’ordinaire, les intervenants qui ne veulent pas de pétrole ferment leur position avant cette date. Ils revendent leur contrat et passent à autre chose.

Mais au printemps 2020, les restrictions de déplacement et le ralentissement économique ont fait chuter la consommation. Le brut s’accumule, les capacités de stockage encore disponibles se raréfient. Revendre suppose de trouver quelqu’un qui accepte de reprendre cette obligation.

Au cours de la séance du 20 avril, le prix du contrat de mai passe sous zéro. Son prix de règlement est fixé à −37,63 dollars par baril.

Des détenteurs acceptent ainsi de payer pour sortir de leur position. Recevoir du pétrole est devenu une contrainte assez coûteuse pour que le droit de s’en dégager ait lui-même un prix.

Pendant ce temps, le contrat WTI pour juin termine à +20,43 dollars. Un mois de différence, le même type de brut, mais pas la même urgence. 📅

Ce jour-là, le panneau « pétrole » ne raconte donc pas toute l’histoire : l’échéance de mai est négative, celle de juin reste positive. Le carburant n’est pas devenu gratuit à la pompe.

Sur un marché à terme, on n’achète pas seulement une matière première. On s’engage aussi sur une date, un lieu et des conditions de livraison. Le 20 avril, ces quelques lignes du contrat ont pesé plus lourd que le baril qu’on imaginait acheter.

Pas un conseil financier.

**Accroche alternative**

Acheter du pétrole à prix négatif paraît être une bonne affaire. Le 20 avril 2020, encore faut-il pouvoir recevoir le brut à Cushing, dans l’Oklahoma.

**Dossier de preuves**

Protagonistes : Détenteurs du contrat NYMEX WTI mai 2020 ; contreparties capables de recevoir le brut ; stockage à Cushing ; CME/NYMEX, EIA et CFTC pour la documentation.

- **Printemps 2020** — Demande réduite par le Covid et stockage disponible sous tension. L’EIA décrit la contrainte de livraison à Cushing et la difficulté de fermer certaines positions. (P1)
- **20 avril 2020** — WTI mai : règlement −37,63 $/baril. Juin : +20,43 $/baril. Deux contrats distincts, pas deux prix contradictoires du même contrat. (P2, P3)
- **21 avril 2020** — Expiration du contrat de mai ; le prix négatif cité est celui du règlement de la veille, pas celui à l’expiration. (P2)
- **23 novembre 2020** — Rapport intermédiaire de la CFTC : conjonction de fondamentaux et facteurs techniques, sans analyse exhaustive de la cause de chaque mouvement. (P2)

**Sources**

- **P1** [EIA — livraison, stockage disponible et positions fermées à prix négatif, 27 avril 2020](https://www.eia.gov/todayinenergy/detail.php?id=43495). Analyse publique de l’agence statistique ; paragraphes 2 à 6. Sans causalité exclusive. Document : 2020-04-27, consulté le 2026-10-23.
- **P2** [CFTC — synthèse du rapport intermédiaire, 23 novembre 2020](https://www.cftc.gov/PressRoom/PressReleases/8315-20). Régulateur ; règlement −37,63 $, expiration, facteurs fondamentaux et techniques ; analyse des causes individuelles hors périmètre. Confiance élevée. Document : 2020-11-23, consulté le 2026-10-23.
- **P3** [S&P Global / Platts — compte rendu du 20 avril 2020, prix de mai et juin](https://www.spglobal.com/energy/en/news-research/latest-news/crude-oil/042020-oil-futures-nymex-wti-falls-below-5b-to-all-time-record-low). Source de marché contemporaine ; −37,63 $ pour mai et +20,43 $ pour juin. Confiance élevée, mai recoupé avec la CFTC. Document : 2020-04-20, consulté le 2026-10-23.

**Points non établis / limites**

- Le stockage disponible et la liquidité ont contribué à l’épisode ; le récit ne prétend pas établir une cause unique ou identifier un responsable.
- « Peu de place disponible » ne signifie pas que tous les réservoirs étaient physiquement pleins. Les capacités déjà réservées comptent aussi.
- Le prix concerne le contrat WTI mai, pas tous les pétroles, toutes les échéances ni les prix à la pompe. Le −37,63 $ est un règlement, pas le plus bas intrajournalier.
