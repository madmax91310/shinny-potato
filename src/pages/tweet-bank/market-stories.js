// Pilotes éditoriaux relus le 23/10/2026. Aucun lien avec un moteur de performances.
// Chaque étape indique les documents qui la prouvent ; les limites restent hors copie.
export const MARKET_STORIES = [
  {
    id: 'market-story:wirecard-2020',
    title: 'Wirecard : les 1,9 milliard introuvables',
    angle: 'Confiance qui s’effondre',
    reviewedAt: '2026-10-23',
    alternativeHook: 'Chez Wirecard, 1,9 milliard d’euros figurent dans les comptes. Le 18 juin 2020, l’auditeur ne parvient pas à en confirmer l’existence.',
    text: `Le 18 juin 2020, Wirecard doit publier ses comptes annuels. À la place, le spécialiste allemand des paiements annonce que son auditeur ne peut pas confirmer l’existence de 1,9 milliard d’euros. 🔎

Cette somme représente environ un quart du total de son bilan. Elle est censée se trouver sur des comptes détenus par des tiers pour le groupe. Ce jour-là, Wirecard évoque des confirmations de soldes potentiellement falsifiées et dit travailler avec l’auditeur pour éclaircir la situation.

À ce stade, le communiqué ne reconnaît pas encore que l’argent n’existe pas. Mais le calendrier laisse peu de marge : sans comptes certifiés au 19 juin, environ 2 milliards d’euros de prêts peuvent être résiliés.

La question comptable devient donc une question de survie financière. Les banques peuvent-elles continuer à prêter sur la foi de comptes dont une somme aussi importante reste invérifiable ?

Quatre jours plus tard, le 22 juin, la position officielle change. La direction estime désormais très probable que les 1,9 milliard d’euros n’existent pas. Elle retire aussi ses prévisions de résultats et les résultats préliminaires de 2019.

Le 25 juin, Wirecard annonce sa décision de demander l’ouverture d’une procédure d’insolvabilité. Dans son explication, le groupe précise que, faute d’accord avec les prêteurs, 800 millions d’euros de crédits risquent d’arriver à terme ou d’être résiliés le 30 juin, puis 500 millions le 1er juillet. 📅

En une semaine, la recherche d’un justificatif bancaire s’est transformée en demande de protection judiciaire. Le chiffre déterminant n’était plus le bénéfice annoncé, mais l’argent dont l’entreprise pouvait réellement prouver l’existence.

Pas un conseil financier.`,
    protagonists: 'Wirecard AG ; Ernst & Young, auditeur ; détenteurs des comptes fiduciaires ; banques prêteuses. Aucune responsabilité pénale individuelle n’est attribuée ici.',
    timeline: [
      { date: '18 juin 2020', fact: 'Audit non conclu : preuves insuffisantes sur 1,9 Md€ (~25 % du bilan), confirmations potentiellement falsifiées ; prêts ~2 Md€ résiliables si comptes certifiés absents au 19 juin.', sources: ['W1'] },
      { date: '22 juin 2020', fact: 'La direction juge très probable l’inexistence des soldes ; retrait des résultats préliminaires 2019 et des prévisions.', sources: ['W2'] },
      { date: '25 juin 2020', fact: 'Décision de demander l’ouverture de l’insolvabilité. Risque sur 800 M€ au 30 juin et 500 M€ au 1er juillet faute d’accord bancaire.', sources: ['W3'] },
    ],
    uncertainties: [
      'Les communiqués établissent ce que Wirecard annonce à chaque date ; ils ne certifient pas la véracité de ses comptes antérieurs.',
      'Le récit s’arrête à la décision de dépôt, pas au jugement d’ouverture. Il ne tranche ni le circuit exact des fonds ni les responsabilités pénales.',
      'Les ~2 Md€ du 18 juin et les échéances de 800 + 500 M€ du 25 juin ont des dates et périmètres distincts : ils ne sont pas additionnés.',
    ],
    sources: [
      { id: 'W1', label: 'Wirecard — communiqué du 18 juin 2020 (archive, rechercher « 18. June 2020 »)', url: 'https://wirecard.com/page/3/?p=company', publishedAt: '2020-06-18', note: 'Source primaire intéressée ; audit, quart du bilan et risque de résiliation.' },
      { id: 'W2', label: 'Wirecard / EQS — déclaration de la direction, 22 juin 2020', url: 'https://www.eqs-news.com/news/ad-hoc/wirecard-ag-stellungnahme-des-vorstands-zur-aktuellen-lage-des-unternehmens/1de1a32e-dd44-4564-99df-48db8851a60b', publishedAt: '2020-06-22', note: 'Source primaire ; premier paragraphe et retrait des résultats.' },
      { id: 'W3', label: 'Wirecard / EQS — décision de dépôt et échéances bancaires, 25 juin 2020', url: 'https://www.eqs-news.com/news/corporate/wirecard-ag-company-statement-regarding-filing-for-insolvency/54bc1989-3089-496a-883c-02db58f7804a', publishedAt: '2020-06-25', note: 'Source primaire ; décision et prêts, distincte du jugement d’ouverture. Confiance élevée.' },
    ],
  },
  {
    id: 'market-story:apple-microsoft-1997',
    title: 'Apple : faire une place à Microsoft',
    angle: 'Décision d’entreprise',
    reviewedAt: '2026-10-23',
    alternativeHook: 'En août 1997, Apple accepte que le navigateur de Microsoft devienne celui proposé par défaut sur ses Mac. En échange, le rival apporte bien plus qu’un chèque.',
    text: `Le 6 août 1997, Steve Jobs et Bill Gates annoncent un accord : Microsoft va investir 150 millions de dollars dans Apple. Mais une autre ligne du contrat touche directement les utilisateurs de Mac. 🍎

Internet Explorer, le navigateur de Microsoft, sera fourni avec le système d’Apple et proposé par défaut.

Pour Apple, le contexte est difficile : l’exercice 1996 s’est soldé par une perte de 816 millions de dollars. Et vendre des ordinateurs suppose de convaincre les clients qu’ils pourront y retrouver les logiciels dont ils ont besoin.

C’est là que l’accord prend tout son sens. Microsoft s’engage à développer de nouvelles versions d’Office pour le Mac. Les deux entreprises prévoient aussi des licences croisées sur leurs brevets et une coopération technique.

Apple obtient donc de l’argent et un engagement sur des applications essentielles à sa plateforme. Microsoft gagne une place privilégiée pour son navigateur dans les machines d’un concurrent. Les 150 millions sont investis en actions sans droit de vote : ce chèque ne donne pas à Microsoft le contrôle d’Apple. 🤝

L’accord laisse pourtant une difficulté entière : les deux entreprises continuent à se concurrencer.

Quelques mois plus tard, dans son rapport annuel, Apple prend soin de prévenir ses investisseurs. La relation avec Microsoft est limitée dans le temps, ne couvre pas de nombreux domaines de concurrence et pourrait nuire aux relations avec d’autres partenaires. L’entreprise ne garantit pas que les avantages l’emporteront sur les inconvénients.

En août 1997, accepter cet accord ne signifie donc pas connaître la suite de l’histoire. Cela signifie donner à un rival une place dans son produit pour obtenir les moyens de rendre ce produit plus viable.

Parfois, une entreprise doit aussi négocier les conditions de sa concurrence.

Pas un conseil financier.`,
    protagonists: 'Apple ; Steve Jobs, alors administrateur et cofondateur ; Microsoft ; Bill Gates, président du conseil et directeur général. Le récit ne prête aucune intention privée aux dirigeants.',
    timeline: [
      { date: 'Exercice 1996', fact: 'Perte nette de 816 M$ ; chiffre historique repris dans les données financières du 10-K 1997.', sources: ['A2'] },
      { date: '6 août 1997', fact: 'Annonce au MacWorld Boston : 150 M$ en actions sans droit de vote, futures versions d’Office, Internet Explorer par défaut et licences croisées de brevets.', sources: ['A1'] },
      { date: '5 décembre 1997', fact: 'Dépôt du 10-K : dépendance aux logiciels tiers, relation limitée avec Microsoft et risques pour les autres partenariats. Ces réserves sont présentées après l’annonce, pas comme connues publiquement en août.', sources: ['A2'] },
    ],
    uncertainties: [
      'Le récit n’affirme pas que les 150 M$ ont, à eux seuls, sauvé Apple ; aucune date hypothétique de faillite n’est retenue.',
      'La dépendance aux applications est documentée dans le 10-K. L’importance commerciale de l’accord est une lecture éditoriale de ses termes, pas un témoignage sur les pensées de Jobs.',
      'Aucun cours de Bourse, gain ultérieur, réaction du public ou dialogue n’est utilisé. Le succès futur d’Apple n’est pas tenu pour acquis.',
    ],
    sources: [
      { id: 'A1', label: 'Microsoft — annonce de l’accord au MacWorld, 6 août 1997', url: 'https://news.microsoft.com/source/1997/08/06/microsoft-and-apple-affirm-commitment-to-build-next-generation-software-for-macintosh/', publishedAt: '1997-08-06', note: 'Communiqué primaire contemporain ; liste des termes et fonctions des dirigeants.' },
      { id: 'A2', label: 'Apple — Form 10-K 1997, déposé le 5 décembre (copie du document primaire)', url: 'https://d18rn0p25nwr6d.cloudfront.net/CIK-0000320193/b0bcedc7-e4d8-4a39-8f03-5b99f88e8f91.html', publishedAt: '1997-12-05', note: 'Item 6, Selected Financial Data ; Item 7, Microsoft Relationship et Support from Third-Party Software Developers ; note Preferred Stock. Confiance élevée. Document postérieur explicitement signalé dans le récit.' },
    ],
  },
  {
    id: 'market-story:wti-mai-2020',
    title: 'WTI : quand sortir du contrat a un prix',
    angle: 'Conséquence inattendue d’une échéance de marché',
    reviewedAt: '2026-10-23',
    alternativeHook: 'Acheter du pétrole à prix négatif paraît être une bonne affaire. Le 20 avril 2020, encore faut-il pouvoir recevoir le brut à Cushing, dans l’Oklahoma.',
    text: `À Cushing, dans l’Oklahoma, le pétrole a besoin d’une place dans un réservoir. Le 20 avril 2020, cette contrainte va compter jusque dans le prix affiché sur les écrans de marché. 🛢️

Le contrat à terme sur le pétrole américain WTI pour livraison en mai expire le lendemain. Ceux qui conservent une position acheteuse à l’échéance doivent pouvoir prendre livraison du brut à Cushing, sauf arrangement préalable.

D’ordinaire, les intervenants qui ne veulent pas de pétrole ferment leur position avant cette date. Ils revendent leur contrat et passent à autre chose.

Mais au printemps 2020, les restrictions de déplacement et le ralentissement économique ont fait chuter la consommation. Le brut s’accumule, les capacités de stockage encore disponibles se raréfient. Revendre suppose de trouver quelqu’un qui accepte de reprendre cette obligation.

Au cours de la séance du 20 avril, le prix du contrat de mai passe sous zéro. Son prix de règlement est fixé à −37,63 dollars par baril.

Des détenteurs acceptent ainsi de payer pour sortir de leur position. Recevoir du pétrole est devenu une contrainte assez coûteuse pour que le droit de s’en dégager ait lui-même un prix.

Pendant ce temps, le contrat WTI pour juin termine à +20,43 dollars. Un mois de différence, le même type de brut, mais pas la même urgence. 📅

Ce jour-là, le panneau « pétrole » ne raconte donc pas toute l’histoire : l’échéance de mai est négative, celle de juin reste positive. Le carburant n’est pas devenu gratuit à la pompe.

Sur un marché à terme, on n’achète pas seulement une matière première. On s’engage aussi sur une date, un lieu et des conditions de livraison. Le 20 avril, ces quelques lignes du contrat ont pesé plus lourd que le baril qu’on imaginait acheter.

Pas un conseil financier.`,
    protagonists: 'Détenteurs du contrat NYMEX WTI mai 2020 ; contreparties capables de recevoir le brut ; stockage à Cushing ; CME/NYMEX, EIA et CFTC pour la documentation.',
    timeline: [
      { date: 'Printemps 2020', fact: 'Demande réduite par le Covid et stockage disponible sous tension. L’EIA décrit la contrainte de livraison à Cushing et la difficulté de fermer certaines positions.', sources: ['P1'] },
      { date: '20 avril 2020', fact: 'WTI mai : règlement −37,63 $/baril. Juin : +20,43 $/baril. Deux contrats distincts, pas deux prix contradictoires du même contrat.', sources: ['P2', 'P3'] },
      { date: '21 avril 2020', fact: 'Expiration du contrat de mai ; le prix négatif cité est celui du règlement de la veille, pas celui à l’expiration.', sources: ['P2'] },
      { date: '23 novembre 2020', fact: 'Rapport intermédiaire de la CFTC : conjonction de fondamentaux et facteurs techniques, sans analyse exhaustive de la cause de chaque mouvement.', sources: ['P2'] },
    ],
    uncertainties: [
      'Le stockage disponible et la liquidité ont contribué à l’épisode ; le récit ne prétend pas établir une cause unique ou identifier un responsable.',
      '« Peu de place disponible » ne signifie pas que tous les réservoirs étaient physiquement pleins. Les capacités déjà réservées comptent aussi.',
      'Le prix concerne le contrat WTI mai, pas tous les pétroles, toutes les échéances ni les prix à la pompe. Le −37,63 $ est un règlement, pas le plus bas intrajournalier.',
    ],
    sources: [
      { id: 'P1', label: 'EIA — livraison, stockage disponible et positions fermées à prix négatif, 27 avril 2020', url: 'https://www.eia.gov/todayinenergy/detail.php?id=43495', publishedAt: '2020-04-27', note: 'Analyse publique de l’agence statistique ; paragraphes 2 à 6. Sans causalité exclusive.' },
      { id: 'P2', label: 'CFTC — synthèse du rapport intermédiaire, 23 novembre 2020', url: 'https://www.cftc.gov/PressRoom/PressReleases/8315-20', publishedAt: '2020-11-23', note: 'Régulateur ; règlement −37,63 $, expiration, facteurs fondamentaux et techniques ; analyse des causes individuelles hors périmètre. Confiance élevée.' },
      { id: 'P3', label: 'S&P Global / Platts — compte rendu du 20 avril 2020, prix de mai et juin', url: 'https://www.spglobal.com/energy/en/news-research/latest-news/crude-oil/042020-oil-futures-nymex-wti-falls-below-5b-to-all-time-record-low', publishedAt: '2020-04-20', note: 'Source de marché contemporaine ; −37,63 $ pour mai et +20,43 $ pour juin. Confiance élevée, mai recoupé avec la CFTC.' },
    ],
  },
].map(story => ({ ...story, month: 'Intemporel', category: 'Histoires de marché', sources: story.sources.map(source => ({ ...source, checkedAt: '2026-10-23' })) }))
