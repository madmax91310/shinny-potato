import { currentSavingsObservation } from '../../../data/economic-data.js'
const livretRate = currentSavingsObservation().rate
const rateLabel = value => value.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})
import { REGULATORY as R, regulatoryNumber as n, regulatoryMoney as money } from '../../../data/regulatory-data.js'
// Revue éditoriale du 11/10/2026 : définition, fonctionnement, exemple bref et vigilance.
// Aucun vécu personnel inventé ; règles et chiffres issus du registre commun.
// Les règles et calculs détaillés sont repris de financial-lexicon.js par le rendu.
// Les exemples ci-dessous sont des situations pédagogiques, hors frais et fiscalité
// sauf indication contraire. Taux fiscaux vérifiés le 05/10/2026 sur impots.gouv.fr.
// https://www.impots.gouv.fr/particulier/questions/jai-un-plan-depargne-en-actions-pea-les-retraits-sont-ils-imposables
// https://www.impots.gouv.fr/particulier/lassurance-vie-et-le-pea-0
// https://www.service-public.gouv.fr/particuliers/vosdroits/F2365
// https://bofip.impots.gouv.fr/bofip/3610-PGP.html
export const FICHE_LEXIQUE_EDITORIAL = {
  pea: {
    sections: [
      {
        "titre": "🔎 La définition",
        "contenu": "Le Plan d’Épargne en Actions est une enveloppe pour acheter des actions européennes et des ETF éligibles, y compris certains ETF mondiaux par réplication synthétique. Tu verses de l’argent, puis tu choisis tes investissements. Leur valeur peut monter ou baisser : le capital n’est pas garanti."
      },
      {
        "titre": "💰 Le plafond",
        "contenu": `Tu peux verser jusqu’à ${n('peaCeiling')} € sur un PEA classique. Ce plafond concerne les versements : avec les gains, ton portefeuille peut dépasser ce montant.`
      },
      {
        "titre": "⏳ Pourquoi les cinq ans comptent",
        "contenu": `Le délai commence au premier versement.\n\nAvant cinq ans, un retrait clôture généralement le PEA, sauf exceptions. Les gains sont taxés par défaut à ${n('peaTotal')} % au taux général actuellement publié : ${n('peaIncome')} % d’impôt sur le revenu et ${n('peaSocial')} % de prélèvements sociaux. Une option globale pour le barème est possible.\n\nAprès cinq ans, les gains retirés sont exonérés d’impôt sur le revenu. Les prélèvements sociaux restent dus, au taux actuel de ${n('peaSocial')} %. Un retrait partiel ne ferme plus le plan : tu peux continuer à investir et à verser dans la limite du plafond. Un retrait total le clôture.`
      },
      {
        "titre": "🔁 Et si tu vends sans retirer ?",
        "contenu": "Vendre un ETF et garder l’argent dans le PEA ne constitue pas un retrait. Tu peux réinvestir cet argent sans déclencher la fiscalité de sortie."
      },
      {
        "titre": "🧮 Un exemple concret",
        "contenu": `Tu as versé 10 000 € et ton PEA vaut 15 000 € après cinq ans. Tu retires tout : le gain est de 5 000 €. S'il est entièrement soumis au taux actuel de ${n('peaSocial')} %, tu paies 5 000 € × ${n('peaSocial')} % = ${money(5000 * R.peaSocial / 100)} € de prélèvements sociaux. Tu récupères ${money(15000 - 5000 * R.peaSocial / 100)} € nets. Tes 10 000 € versés ne sont pas taxés.`
      }
    ],
    ouverture: "Le PEA, c’est quoi ?\n\nJe t’explique tout ce que tu dois savoir 👇",
    exemple: `Tu as versé 10 000 € et ton PEA vaut 15 000 € après cinq ans. Tu retires tout : le gain est de 5 000 €. S'il est entièrement soumis au taux actuel de ${n('peaSocial')} %, tu paies 5 000 € × ${n('peaSocial')} % = ${money(5000 * R.peaSocial / 100)} € de prélèvements sociaux. Tu récupères ${money(15000 - 5000 * R.peaSocial / 100)} € nets. Tes 10 000 € versés ne sont pas taxés.`,
    definition: "Le PEA est une enveloppe pour investir en actions et en ETF éligibles, avec une fiscalité liée à son ancienneté.",
    limite: "Un retrait trop tôt clôture en principe le PEA, sauf exceptions. L'avantage fiscal ne protège pas des baisses de marché.",
    question: "Pour investir, tu privilégies le PEA ou une autre enveloppe ?",
  },
  cto: {
    ouverture: "Le CTO, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: `Tu achètes pour 1 000 € de titres et les revends 1 300 €, sans autres plus-values ni moins-values à compenser. Le gain est de 300 €. Au PFU de ${n('ctoTotal')} % actuellement publié, l'impôt et les prélèvements sociaux représentent ${money(300 * R.ctoTotal / 100)} €. Tu récupères ${money(1300 - 300 * R.ctoTotal / 100)} € nets, hors frais. Tant que tu n'as pas vendu, la hausse du cours ne déclenche pas cet impôt.`,
    definition: "Le compte-titres ordinaire permet de détenir des actions, ETF et obligations, selon les marchés proposés par ton courtier.",
    limite: "Cette liberté vient avec une fiscalité sur les revenus et les gains réalisés. Les frais dépendent aussi du courtier.",
  },
  "assurance-vie": {
    ouverture: "L'assurance-vie, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: `Tu as versé 10 000 € et le contrat vaut ${n('lddsCeiling')} €. Un rachat de 3 000 € contient 3 000 € × (2 000 € ÷ ${n('lddsCeiling')} €) = 500 € de gains et 2 500 € de capital. Après huit ans, si ton abattement annuel est encore disponible, ces 500 € échappent à l'impôt sur le revenu. Les prélèvements sociaux restent dus selon les supports et ceux déjà prélevés.`,
    definition: "L'assurance-vie est un contrat d'épargne qui peut proposer un fonds en euros et des unités de compte.",
    limite: "Les unités de compte peuvent baisser. La garantie du fonds en euros dépend du contrat, parfois hors frais de gestion.",
    question: "Tu as déjà regardé les supports et les frais de ton contrat ?",
  },
  per: {
    ouverture: "Le PER, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Tu déduis un versement de 1 000 € de ton revenu imposable. Si toute cette somme aurait été taxée dans une tranche à 30 %, l'économie d'impôt est de 300 €. Dans une tranche à 11 %, elle serait de 110 €. Ce n'est pas un rendement du placement : les versements déduits seront imposés au barème lors d'une sortie en capital à la retraite.",
    definition: "Le PER sert à préparer la retraite. Les versements volontaires peuvent être déduits du revenu imposable, dans la limite du plafond disponible.",
    limite: "L'argent est en principe immobilisé jusqu'à la retraite, sauf cas de déblocage anticipé. Les supports peuvent aussi perdre de la valeur.",
  },
  "livret-a": {
    ouverture: "Le Livret A, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: `Au taux de ${rateLabel(livretRate)} % de la dernière publication validée, 10 000 € rémunérés pendant une année entière produiraient ${money(10000 * livretRate / 100)} € d'intérêts nets, si le taux restait constant. En pratique, les intérêts sont calculés par quinzaines : les dates de dépôt et de retrait comptent. Les intérêts peuvent porter le solde au-delà du plafond de ${n('livretCeiling')} €.`,
    definition: "Le Livret A permet de garder une épargne disponible, avec un capital garanti et des intérêts exonérés d'impôt et de prélèvements sociaux.",
    limite: "Son taux peut être inférieur à l'inflation : le capital reste là, mais son pouvoir d'achat peut reculer.",
  },
  ldds: {
    ouverture: "Le LDDS, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: `Tu as ${n('livretCeiling')} € sur ton Livret A et verses ${n('lddsCeiling')} € sur ton LDDS : ${(R.livretCeiling + R.lddsCeiling).toLocaleString('fr-FR')} € d'épargne disponible, hors intérêts. Au taux de ${rateLabel(R.lddsRate)} % de la dernière publication validée, ${n('lddsCeiling')} € rémunérés pendant une année entière produiraient ${money(R.lddsCeiling * R.lddsRate / 100)} € nets si le taux restait constant. Il n'est pas nécessaire de remplir le Livret A pour ouvrir un LDDS. Les intérêts peuvent porter son solde au-delà du plafond.`,
    definition: "Le LDDS est un livret réglementé, disponible et sans risque de perte en capital, avec son propre plafond.",
    limite: "Il peut compléter ton épargne disponible, mais il n'assure pas de suivre l'inflation.",
  },
  "pee-perco": {
    attention: "Un nouveau PERCO ne peut plus être créé depuis octobre 2020 ; les plans existants peuvent continuer à fonctionner. L'abondement ne garantit pas le capital : les fonds proposés peuvent baisser. Vérifie le barème de ton entreprise et les conditions de déblocage.",
    ouverture: "Le PEE / PERCO, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Ton entreprise prévoit un abondement de 100 % jusqu'à 500 €. Tu verses 500 € : elle ajoute 500 € bruts, avant CSG et CRDS. Ton effort d'épargne bénéficie donc d'un complément, mais cet argent reste soumis aux règles de blocage et aux variations des fonds. Ce barème d'abondement est fictif : chaque entreprise fixe le sien.",
    definition: "Le PEE et les anciens PERCO sont des plans d'épargne salariale. L'entreprise peut compléter tes versements par un abondement.",
    limite: "L'épargne est en principe bloquée pour une durée définie ou jusqu'à la retraite selon le plan, sauf cas de déblocage. Les supports peuvent baisser.",
  },
  etf: {
    attention: "Un ETF actions peut subir une forte baisse. La diversification ne garantit pas le capital. Une réplication synthétique ajoute un risque de contrepartie lié au swap.",
    ouverture: "Les ETF, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Tu investis 1 000 € dans un ETF indiciel. Une entreprise qui pèse 5 % dans l'indice représente environ 50 € de ton exposition : les sociétés ne pèsent pas forcément toutes autant. Un TER fictif de 0,20 % correspond à environ 2 € par an pour un encours constant de 1 000 €, déjà intégrés à la valeur du fonds.",
    definition: "Un ETF est un fonds coté en Bourse. Un ETF indiciel cherche à suivre un indice ; il existe aussi des ETF actifs.",
    limite: "Un ETF actions peut subir une forte baisse. La diversification ne garantit pas ton capital.",
    question: "Tu sais quelles entreprises pèsent le plus dans ton ETF ?",
  },
  action: {
    attention: "Le dividende n'est pas garanti. Si l'entreprise fait faillite, tu peux perdre toute ta mise.",
    ouverture: "Une action, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Tu achètes dix actions à 100 €, soit 1 000 €. Leur cours passe à 110 € et chacune te verse 2 € de dividende. Tu détiens 1 100 € d'actions et as reçu 20 € : la performance totale est de (1 100 € + 20 € − 1 000 €) ÷ 1 000 € = 12 %, avant frais et impôts. Le dividende n'est pas garanti.",
    definition: "Une action représente une fraction du capital d'une entreprise. Son cours dépend notamment de ses résultats et des attentes du marché.",
    limite: "Le dividende n'est pas garanti. Si l'entreprise fait faillite, tu peux perdre toute ta mise.",
  },
  obligation: {
    attention: "L'émetteur peut ne pas rembourser. Avant l'échéance, une obligation à taux fixe peut baisser notamment lorsque les taux montent.",
    ouverture: "Une obligation, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Une obligation fictive de 1 000 € de valeur nominale verse un coupon annuel de 4 %, soit 40 €. Si tu la paies 950 €, le revenu annuel rapporté au prix payé est de 40 € ÷ 950 € = 4,21 %. Ce n'est pas son rendement à l'échéance : il faut aussi tenir compte du remboursement final, de la durée, des frais et d'un éventuel défaut.",
    definition: "Avec une obligation, tu prêtes de l'argent à un État ou à une entreprise, selon une rémunération et une échéance définies.",
    limite: "L'émetteur peut ne pas rembourser. Avant l'échéance, le prix peut baisser, notamment quand les taux montent.",
  },
  fcp: {
    ouverture: "Un fonds commun de placement, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Tu souscris dix parts à une valeur liquidative de 100 €, soit 1 000 €. Si la valeur de part monte à 108 €, tes parts valent 1 080 €, hors distributions. Les frais courants du fonds sont déjà intégrés à cette valeur ; d'éventuels frais de souscription ou de rachat réduisent ton résultat personnel.",
    definition: "Un fonds commun de placement rassemble l'argent des investisseurs pour le placer selon une stratégie définie, active ou indicielle.",
    limite: "Déléguer la gestion ne garantit pas de battre le marché après frais, ni d'éviter les pertes.",
  },
  scpi: {
    attention: "Les revenus et le capital ne sont pas garantis. La revente de parts peut prendre plusieurs mois, voire davantage si les demandes de retrait s'accumulent, et le prix de la part peut baisser.",
    ouverture: "La SCPI, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Tu investis 10 000 € dans une SCPI fictive qui distribue 500 € sur un an. Le revenu représente 5 % de ta mise. Mais si la valeur de tes parts descend à 9 000 €, ton résultat total est de 9 000 € + 500 € − 10 000 € = −500 €, soit −5 %, avant fiscalité et frais éventuels de sortie. Le revenu ne résume pas la performance.",
    definition: "Une SCPI détient un patrimoine immobilier. En achetant des parts, tu délègues sa gestion et peux recevoir des revenus locatifs.",
    limite: "Les revenus et le capital ne sont pas garantis. Revendre tes parts peut prendre du temps.",
  },
  opci: {
    ouverture: "L'OPCI, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Dans un OPCI fictif composé de 60 % d'immobilier, 35 % d'actifs financiers et 5 % de liquidités, une baisse de 10 % de la poche financière ferait reculer l'ensemble d'environ 3,5 % si les autres poches restaient stables, avant frais. Les mouvements boursiers peuvent donc peser sur un placement présenté comme immobilier.",
    definition: "Un OPCI associe de l'immobilier, des actifs financiers et des liquidités dans un même fonds.",
    limite: "Le capital n'est pas garanti et la sortie dépend des conditions de rachat du fonds.",
  },
  trackers: {
    ouverture: "Les trackers, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Tu lis « tracker MSCI World » dans un article et « ETF MSCI World » chez ton courtier. Vérifie l'ISIN : il peut s'agir exactement du même fonds.",
    definition: "Le mot tracker désigne généralement un ETF indiciel, un fonds coté qui cherche à suivre un indice.",
    limite: "Le mot est parfois employé pour d'autres produits. Vérifie ce que tu achètes : l'étiquette ne suffit pas.",
  },
  dca: {
    sections: [
      {
        "titre": "🔎 La définition",
        "contenu": "Le DCA consiste à investir une somme fixe à intervalles réguliers, par exemple 100 € chaque mois, sans chercher à deviner le meilleur moment pour acheter."
      },
      {
        "titre": "⚙️ Le fonctionnement",
        "contenu": "Tu gardes le même montant et le même rythme d’investissement.\n\nQuand le prix baisse, tu achètes davantage de parts. Quand il monte, tu en achètes moins. Tes achats sont ainsi répartis dans le temps."
      },
      {
        "titre": "🧮 Un exemple",
        "contenu": "Avec 100 €, tu achètes 10 parts à 10 €, puis 20 parts à 5 € le mois suivant.\n\nTu as investi 200 € pour 30 parts : ton prix d’achat moyen est de 6,67 €, hors frais."
      },
      {
        "titre": "⚠️ À retenir",
        "contenu": "Le DCA aide à installer une régularité et évite de faire dépendre tout ton investissement d’une seule date d’achat.\n\nIl ne protège pas des pertes et ne garantit pas un meilleur rendement qu’un investissement en une fois."
      }
    ],
    ouverture: "Le DCA, c’est quoi ?\n\nOn en parle souvent quand on commence à investir. Je t’explique comment ça fonctionne 👇",
    exemple: "Tu investis 200 € par mois. À 100 € la part, tu en achètes deux ; à 50 €, tu en achètes quatre. Tu gardes le même budget, même quand le prix change, hors frais.",
    definition: "Le DCA consiste à investir une somme régulièrement, plutôt que de chercher un point d'entrée à chaque achat.",
    limite: "Cette discipline ne garantit ni un meilleur rendement ni l'absence de pertes.",
  },
  "effet-levier": {
    ouverture: "L'effet de levier, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Avec une exposition cinq fois supérieure à ta mise, une baisse de 2 % de l'actif représente environ 10 % de perte sur cette mise, avant frais et selon le produit.",
    definition: "Le levier permet de prendre une exposition supérieure à ta mise, grâce à un emprunt ou à un produit financier.",
    limite: "Selon le produit, la perte peut atteindre toute ta mise, voire la dépasser.",
  },
  diversification: {
    sections: [
      {
        "titre": "🔎 La définition",
        "contenu": "Diversifier consiste à répartir ses investissements entre plusieurs entreprises, secteurs, pays ou classes d’actifs.\n\nL’objectif est de limiter les conséquences d’une difficulté touchant un seul placement sur l’ensemble du portefeuille."
      },
      {
        "titre": "⚙️ Le fonctionnement",
        "contenu": "La diversification peut se faire à plusieurs niveaux : détenir différentes entreprises, investir dans plusieurs régions ou associer des actions et des obligations.\n\nLeur comportement peut différer, mais certains placements restent très liés entre eux."
      },
      {
        "titre": "🧮 Un exemple",
        "contenu": "Un ETF World, un S&P 500 et un Nasdaq-100 peuvent détenir plusieurs des mêmes grandes entreprises américaines.\n\nLes cumuler peut donc renforcer ton exposition à ces entreprises, même si tu possèdes trois ETF différents."
      },
      {
        "titre": "⚠️ À retenir",
        "contenu": "Pour évaluer la diversification, je regarde ce que les placements contiennent, pas seulement leur nombre.\n\nElle réduit certains risques, mais plusieurs placements peuvent baisser en même temps."
      }
    ],
    ouverture: "La diversification, c’est quoi ?\n\n« Ne pas mettre tous ses œufs dans le même panier » : en Bourse, ça veut dire quoi ? Je t’explique 👇",
    exemple: "Dans un portefeuille fictif de 10 000 €, une ligne de 1 000 € représente 10 %. Si cette ligne perd 50 % et que tout le reste ne bouge pas, la perte globale est de 500 €, soit 5 %. Avec tout le portefeuille sur cette ligne, elle aurait été de 50 %. Plusieurs ETF peuvent toutefois détenir les mêmes entreprises.",
    definition: "Diversifier, c'est répartir ses investissements entre différentes expositions : entreprises, secteurs, pays ou classes d'actifs.",
    emojiDefinition: "🌍",
    limite: "Même diversifié, un portefeuille peut baisser : plusieurs placements peuvent reculer en même temps.",
  },
  reequilibrage: {
    ouverture: "Le rééquilibrage de portefeuille, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Tu vises 60 % d'actions et 40 % d'obligations. Sur 10 000 €, tu détiens désormais 7 000 € d'actions et 3 000 € d'obligations. Sans nouveau versement, vendre 1 000 € d'actions pour acheter des obligations rétablit 6 000 € / 4 000 €, avant frais et fiscalité. Tes prochains versements peuvent aussi réduire l'écart sans vente.",
    definition: "Rééquilibrer consiste à revenir vers les proportions que tu avais fixées entre tes placements.",
    limite: "Des arbitrages trop fréquents peuvent multiplier les frais et, selon l'enveloppe, déclencher de l'impôt.",
  },
  "dca-vs-lumpsum": {
    ouverture: "DCA ou investissement en une fois : quelle différence ?\n\nJe t’explique ces deux façons d’investir 👇",
    exemple: "Tu as déjà 6 000 €. Si tu investis tout maintenant et que le marché gagne immédiatement 10 %, tu détiens 6 600 €. Si tu n'as investi que la première tranche de 1 000 €, elle vaut 1 100 € et les 5 000 € restants sont encore en espèces : 6 100 € au total. En cas de baisse immédiate de 10 %, ce serait respectivement 5 400 € et 5 900 €. Scénario fictif, sans rémunération des espèces.",
    definition: "Le lump sum consiste à investir d'un coup. Le DCA répartit les achats dans le temps.",
    limite: "Étaler peut atténuer l'effet d'une baisse juste après le premier achat, mais faire manquer une partie d'une hausse. Les deux approches restent exposées aux pertes.",
  },
  "vente-a-decouvert": {
    ouverture: "La vente à découvert, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Tu empruntes une action et la vends 100 €. Tu la rachètes 80 € pour la rendre : l'écart est de 20 € avant frais. Si tu dois la racheter 130 €, l'écart devient une perte de 30 €.",
    definition: "Vendre à découvert consiste à vendre des titres empruntés, puis à les racheter pour les restituer, en espérant un prix plus bas.",
    limite: "Si le cours monte, la perte potentielle n'a pas de plafond théorique.",
  },
  dividende: {
    ouverture: "Le dividende, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Une action à 100 € détache un dividende de 3 €. Son cours est ajusté de ces 3 € au détachement, avant les autres mouvements du marché : tu ne passes pas automatiquement de 100 € à 103 € de patrimoine.",
    definition: "Le dividende est une somme qu'une entreprise peut verser à ses actionnaires.",
    limite: "Le versement peut être réduit ou supprimé. Un rendement élevé peut aussi accompagner une forte baisse de l'action.",
  },
  "reinvestissement-dividendes": {
    attention: "Les revenus réinvestis restent exposés aux pertes. Un rendement constant dans un exemple n'est pas une prévision.",
    ouverture: "Le réinvestissement des dividendes, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Avec un rendement fictif constant de 5 % par an, 1 000 € deviennent 1 050 €, puis 1 102,50 € si les gains restent investis. La deuxième année, les 50 € gagnés produisent eux aussi des gains. Après vingt ans : environ 2 653 €, hors frais et fiscalité.",
    definition: "Réinvestir les dividendes consiste à replacer ces revenus pour qu'ils participent aux résultats futurs du portefeuille.",
    limite: "Les sommes réinvesties restent exposées aux pertes. Avec une distribution, la fiscalité applicable et les frais d'achat comptent aussi.",
  },
  blockchain: {
    ouverture: "La blockchain, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Tu consultes un transfert sur une blockchain publique. Le registre permet de retrouver l'opération, mais il ne te dit pas si le projet qui émet le jeton est un bon investissement.",
    definition: "Une blockchain est un registre partagé qui garde une trace d'opérations selon les règles de son réseau.",
    limite: "Un registre transparent ne garantit ni la fiabilité du projet ni la valeur de sa cryptomonnaie. Sur une blockchain publique, les transactions sont consultables.",
  },
  stablecoin: {
    ouverture: "Le stablecoin, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Tu possèdes 1 000 jetons visant chacun 1 dollar. Si leur prix tombe à 0,90 dollar, tu n'as plus que 900 dollars, soit une perte de 10 %. Même si la parité de 1 dollar tient, leur valeur en euros change avec le taux euro-dollar. Un revenu proposé sur ces jetons ajoute les risques du service utilisé.",
    definition: "Un stablecoin est un jeton qui cherche à maintenir une valeur liée à une référence, souvent une monnaie.",
    limite: "La parité peut se rompre. Ce n'est pas une garantie bancaire, et la plateforme de conservation ajoute ses propres risques.",
  },
  "cold-hot-wallet": {
    attention: "Un portefeuille matériel réduit certains risques à distance, mais ne supprime pas les erreurs de signature ni le vol de la phrase de récupération. Perdre les clés et leur sauvegarde peut rendre l'accès aux actifs impossible.",
    ouverture: "Le cold wallet / hot wallet, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Tu utilises une application connectée pour tes opérations courantes et un portefeuille matériel pour conserver des clés hors ligne. Dans les deux cas, protéger la récupération de l'accès reste essentiel.",
    definition: "Un wallet donne accès aux clés qui permettent d'utiliser tes cryptos. Un hot wallet est connecté à Internet ; un cold wallet conserve les clés hors ligne.",
    limite: "Si tu gères toi-même tes clés, perdre la phrase de récupération peut te faire perdre l'accès. Sa conservation fait partie de la sécurité.",
  },
  "rendement-locatif": {
    ouverture: "Le rendement locatif, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Un bien coûte 200 000 € et produit 10 000 € de loyers annuels : 10 000 € ÷ 200 000 € = 5 % brut, hors frais d'acquisition. Avec 3 000 € de charges non récupérables, taxe foncière, entretien et vacance, il reste 7 000 €, soit 3,5 % avant impôt et financement. Le remboursement du crédit modifie ensuite ta trésorerie.",
    definition: "Le rendement locatif rapporte les loyers au prix du bien. Le rendement brut ne déduit pas les charges.",
    limite: "Un rendement élevé ne dit rien, à lui seul, de la demande locative ni du risque de ne pas trouver de locataire.",
  },
  "effet-levier-immo": {
    ouverture: "L'effet de levier immobilier, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Avec 20 000 € d'apport et 180 000 € empruntés, tu achètes un bien à 200 000 €. Une variation de 10 000 € de sa valeur représente la moitié de ton apport initial, avant frais et remboursement du crédit.",
    definition: "Le levier immobilier consiste à financer une partie de l'achat par un emprunt, au-delà de ton seul apport.",
    limite: "Le remboursement continue même si le logement reste vide, demande des travaux ou perd de la valeur.",
  },
  lmnp: {
    attention: "Pour les ventes depuis le 15 février 2025, les amortissements immobiliers fiscalement déduits diminuent en principe le prix d'acquisition retenu pour la plus-value, sauf exceptions pour certaines résidences de services. Une économie d'impôt sur les loyers peut donc augmenter la plus-value taxable à la revente.",
    ouverture: "Le LMNP, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Pour une location meublée classique éligible au micro-BIC, 10 000 € de recettes et un abattement de 50 % donnent 5 000 € de base imposable. Au réel, avec 3 000 € de charges déductibles et 4 000 € d'amortissements fiscalement admis, cette base serait de 3 000 €. L'amortissement ne peut pas créer de déficit : son excédent est reporté selon les règles applicables. Il faut aussi comparer les frais comptables et la fiscalité de revente.",
    definition: "Le LMNP est le statut de loueur en meublé non professionnel. L'imposition dépend notamment du choix entre micro-BIC et régime réel.",
    limite: "Les amortissements déduits peuvent modifier le calcul de la plus-value à la revente. Les règles et exceptions dépendent du bien et de la date de vente.",
  },
  drawdown: {
    sections: [
      {
        "titre": "🔎 La définition",
        "contenu": "Le drawdown mesure la baisse depuis un sommet jusqu’au creux qui suit. Le drawdown maximal retient la plus forte baisse sur la période étudiée."
      },
      {
        "titre": "🧮 Le calcul",
        "contenu": "Drawdown = (valeur au sommet − valeur au creux) ÷ valeur au sommet × 100.\n\nIl permet de mesurer l’ampleur d’une baisse sur une période donnée. Il faut comparer des périodes et des méthodes identiques."
      },
      {
        "titre": "🧮 Un exemple",
        "contenu": "Un placement passe d’un sommet de 1 000 € à un creux de 500 € : son drawdown est de 50 %.\n\nUne hausse de 50 % depuis ce creux ajoute 250 € et ramène sa valeur à 750 €. Pour retrouver 1 000 €, il faut une hausse de 100 % depuis les 500 €."
      },
      {
        "titre": "⚠️ À retenir",
        "contenu": "Une baisse passée ne fixe pas la limite de la prochaine et rien ne garantit le retour à l’ancien sommet."
      }
    ],
    ouverture: "Le Drawdown, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Ton portefeuille atteint 10 000 €, puis descend à 7 000 €. Son drawdown est de 30 %. Pour retrouver 10 000 €, il doit ensuite gagner environ 43 %.",
    definition: "Le drawdown mesure la baisse depuis un sommet jusqu'au creux qui suit. Le drawdown maximal retient la plus forte baisse sur la période étudiée.",
    limite: "Un drawdown passé n'est pas un plafond pour la prochaine baisse, ni une promesse de récupération.",
  },
  volatilite: {
    ouverture: "La Volatilité, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Deux placements passent de 100 € à 110 € sur un an. L'un a peu varié, l'autre a connu de fortes hausses et baisses : le résultat final est identique, le parcours ne l'est pas.",
    definition: "La volatilité mesure la dispersion des variations d'un prix. Elle concerne les mouvements à la hausse comme à la baisse.",
    limite: "La volatilité passée ne fixe pas ta perte maximale. Elle ne décrit pas non plus tous les risques du placement.",
  },
  "ratio-sharpe": {
    ouverture: "Le Ratio de Sharpe, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Un portefeuille affiche un rendement de 8 %, un taux sans risque de 3 % et une volatilité de 10 % : (8 − 3) ÷ 10 = 0,5. Avec le même rendement et une volatilité de 20 %, le ratio serait de 0,25. Les périodes, devises et méthodes doivent être identiques pour comparer ces résultats.",
    definition: "Le ratio de Sharpe rapporte le rendement au-delà d'un taux sans risque à la volatilité, sur une période donnée.",
    limite: "Ce ratio passé ne promet rien pour demain. Il ne résume pas les pertes extrêmes ni le risque de liquidité.",
  },
  ter: {
    ouverture: "Le TER (frais de gestion), c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Pour un encours constant de 1 000 €, un TER de 0,20 % représente environ 2 € sur un an. Ces frais sont intégrés à la valeur du fonds ; son TER ne couvre pas tous tes coûts, comme le courtage.",
    definition: "Le TER indique le niveau des frais annuels du fonds. Ils sont intégrés dans la valeur de la part.",
    limite: "Le TER ne résume pas tous les coûts : courtage, écart entre achat et vente et qualité du suivi comptent aussi.",
    question: "Tu compares autre chose que le TER entre deux ETF ?",
  },
  "capitalisation-boursiere": {
    ouverture: "La Capitalisation boursière, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Une entreprise a un million d'actions à 50 € : sa capitalisation est de 50 millions d'euros. Une autre a dix millions d'actions à 10 € : elle vaut 100 millions en Bourse malgré le prix plus bas de chaque action.",
    definition: "La capitalisation boursière correspond au prix d'une action multiplié par le nombre d'actions en circulation.",
    limite: "La capitalisation ne mesure ni le chiffre d'affaires ni le prix certain d'un rachat de toute l'entreprise.",
  },
  "indice-boursier": {
    ouverture: "Un indice boursier, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Dans un indice fictif, une entreprise pèse 10 %. Si son cours gagne 5 % et que toutes les autres valeurs restent stables, elle contribue à environ +0,5 % pour l'indice. Une entreprise pesant 1 % aurait apporté environ +0,05 %. Un indice de cent entreprises n'a donc pas nécessairement cent poids égaux.",
    definition: "Un indice suit un ensemble de titres sélectionnés et pondérés selon des règles définies.",
    limite: "Pour le comparer à ton portefeuille, vérifie la période, la devise et si les dividendes sont inclus.",
  },
  "rendement-vs-performance": {
    ouverture: "Rendement et performance : quelle différence ?\n\nJe t’explique ce que mesure chacun 👇",
    exemple: "Tu achètes une action 100 €, reçois 3 € de dividende et termines la période avec une action à 90 €. Ton revenu représente 3 %, mais ta performance totale est de moins 7 %, avant frais et fiscalité.",
    definition: "Le rendement mesure le revenu rapporté au prix. La performance totale intègre aussi l'évolution de la valeur du placement.",
    limite: "Un revenu élevé peut être effacé par une baisse du capital. Les frais et impôts réduisent encore le résultat net.",
  },
  inflation: {
    ouverture: "L'Inflation, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Un panier à 100 € passe à 102 €. Si ton épargne de 100 € n'a gagné qu'un euro, elle atteint 101 € : elle ne suffit plus à acheter le même panier.",
    definition: "L'inflation correspond à une hausse générale des prix. Une même somme permet alors d'acheter moins.",
    limite: "L'indice général des prix représente un panier moyen : tes dépenses peuvent évoluer autrement.",
    question: "Tu regardes le rendement de ton épargne après inflation ?",
  },
  "taux-interet": {
    ouverture: "Le Taux d'intérêt, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "À 4 % par an, 10 000 € restant entièrement dus pendant douze mois produisent 400 € d'intérêts. Sur un crédit amortissable, la base diminue au fil des remboursements.",
    definition: "Le taux d'intérêt exprime la rémunération d'un prêt ou d'un placement, rapportée au capital sur une durée donnée.",
    limite: "Un taux variable peut évoluer. Une hausse des taux peut aussi faire baisser le prix des obligations existantes.",
  },
  "taux-sans-risque": {
    application: "En euros à très court terme, l’€STR est une référence couramment utilisée comme approximation. Pour une durée plus longue, il faut un repère de maturité comparable : un taux de court terme ne suffit pas pour juger un placement sur dix ans.",
    ouverture: "Le Taux sans risque, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Sur une même durée et dans une même devise, une référence fictive offre 3 % et un placement risqué rapporte 7 %. Son rendement excédentaire est de 7 % − 3 % = 4 points. C'est une différence de rendement, pas une garantie que le risque pris sera rémunéré à l'avenir.",
    definition: "Le taux sans risque est une référence théorique de rémunération pour une devise et une durée données.",
    limite: "Une obligation d'État peut perdre de la valeur avant l'échéance. Le mot « sans risque » ne rend pas tous les placements utilisés comme repères sans danger.",
  },
  "flat-tax": {
    ouverture: "La Flat tax, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: `Sur un gain imposable de 1 000 € soumis au PFU général actuellement publié : 1 000 € × ${n('ctoIncome')} % = ${money(1000 * R.ctoIncome / 100)} € d'impôt sur le revenu, et 1 000 € × ${n('ctoSocial')} % = ${money(1000 * R.ctoSocial / 100)} € de prélèvements sociaux. Total : ${money(1000 * R.ctoTotal / 100)} €. Il reste ${money(1000 - 1000 * R.ctoTotal / 100)} € de gain net. L'option pour le barème porte sur l'ensemble des revenus et plus-values concernés de l'année.`,
    definition: "Le prélèvement forfaitaire unique associe impôt sur le revenu et prélèvements sociaux pour certains revenus du capital.",
    limite: "Les règles diffèrent selon l'enveloppe et le type de revenu. Un même taux ne s'applique pas à toute ton épargne.",
  },
  "abattement-pea": {
    attention: "Il s'agit d'une exonération d'impôt sur le revenu, pas d'un abattement. Les prélèvements sociaux restent dus, avec des taux historiques possibles pour certains gains anciens.",
    titre: "l'exonération du PEA après cinq ans",
    ouverture: "L'exonération du PEA après 5 ans, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: `Ton PEA, ouvert par un premier versement il y a plus de cinq ans, contient 10 000 € de versements et 5 000 € de gains. Lors d'un retrait total, si tous les gains relèvent du taux actuel de ${n('peaSocial')} %, les prélèvements sociaux sont de ${money(5000 * R.peaSocial / 100)} €, l'impôt sur le revenu de 0 € et le montant net récupéré de ${money(15000 - 5000 * R.peaSocial / 100)} €. Un nouveau versement ne relance pas le délai de cinq ans.`,
    definition: "Après cinq ans, les gains retirés du PEA sont exonérés d'impôt sur le revenu. Il s'agit d'une exonération, pas d'un abattement sur une partie du gain.",
    limite: "Les prélèvements sociaux restent dus sur les gains, avec un taux qui peut dépendre de leur date d'acquisition.",
  },
  "prelevements-sociaux": {
    ouverture: "Les Prélèvements sociaux, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: `Sur un gain de 5 000 € soumis au taux général de ${n('ctoSocial')} %, les prélèvements sociaux représentent ${money(5000 * R.ctoSocial / 100)} €. Au taux de ${n('avSocial')} % applicable aux contrats d'assurance-vie ordinaires, ils représentent ${money(5000 * R.avSocial / 100)} €. Ce calcul porte uniquement sur les prélèvements sociaux : un impôt sur le revenu peut s'ajouter selon l'enveloppe et les conditions du retrait.`,
    definition: "Les prélèvements sociaux regroupent notamment la CSG, la CRDS et le prélèvement de solidarité. Ils sont distincts de l'impôt sur le revenu.",
    limite: "Le taux et le mode de perception dépendent du revenu, de l'enveloppe et parfois de la date des gains.",
  },
  "plus-value-imposable": {
    ouverture: "La Plus-value imposable, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Tu achètes dix titres à 100 €, puis dix à 120 €. Le prix moyen d'acquisition est (1 000 € + 1 200 €) ÷ 20 = 110 €. Si tu revends cinq titres à 130 €, tu reçois 650 € et réalises (130 € − 110 €) × 5 = 100 € de plus-value, hors frais admissibles. Le gain ne se calcule pas uniquement à partir du dernier achat.",
    definition: "La plus-value correspond au gain entre le prix de vente et le prix d'acquisition, en tenant compte des frais admissibles.",
    limite: "Le gain imposable ne se confond pas avec le montant de la vente. Son traitement fiscal dépend aussi de l'enveloppe.",
  },
  "plus-value-immobiliere": {
    ouverture: "La Plus-value immobilière, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "Une vente locative dégage une plus-value taxable de 20 000 €, après les ajustements du prix d'acquisition, sans exonération ni abattement de durée. L'impôt de 19 % représente 3 800 € et les prélèvements sociaux de 17,2 % représentent 3 440 €, soit 7 240 € au total. La résidence principale bénéficie en principe d'une exonération, sous conditions.",
    definition: "La plus-value immobilière est le gain réalisé à la vente, dont le calcul fiscal tient compte des règles applicables au bien.",
    limite: "Les abattements d'impôt sur le revenu et de prélèvements sociaux ne suivent pas le même calendrier.",
  },
  halving: {
    ouverture: "Le Halving, c’est quoi ?\n\nJe t’explique comment ça fonctionne 👇",
    exemple: "La récompense en nouveaux bitcoins par bloc est passée de 6,25 à 3,125 bitcoins lors du halving de 2024. Le rythme d'émission a diminué ; la demande n'a pas été fixée par cette règle.",
    definition: "Le halving divise par deux la récompense en nouveaux bitcoins attribuée pour chaque bloc, selon les règles du protocole.",
    limite: "Une baisse de la nouvelle émission ne garantit pas une hausse du prix. Les hausses passées ne promettent pas le même scénario.",
  },
};


// Rubriques adaptées aux enveloppes : les règles précèdent l’exemple,
// sans répéter la fiscalité dans une conclusion générique.
// Sources officielles PEA, assurance-vie, PER et LDDS revérifiées le 11/10/2026.
const rubrique = (titre, contenu) => ({ titre, contenu });
const adapterEnveloppe = (id, rubriques, question) => {
  const fiche = FICHE_LEXIQUE_EDITORIAL[id];
  fiche.sections = [
    rubrique('🔎 La définition', fiche.definition),
    ...rubriques,
    rubrique('🧮 Un exemple concret', fiche.exemple),
  ];
  fiche.question = question;
};

adapterEnveloppe('cto', [
  rubrique('💼 Les placements et le plafond', "Tu peux acheter des actions françaises ou étrangères, des ETF et des obligations, selon l’offre de ton courtier. Il n’y a pas de plafond de versement. Le capital n’est pas garanti : la valeur des placements peut monter ou baisser."),
  rubrique('💰 Quand les gains sont imposés', `Une vente peut déclencher l’impôt sur la plus-value, même si tu gardes l’argent dans le CTO. Les dividendes sont imposés lorsqu’ils sont encaissés. Une hausse de cours sans vente ne déclenche pas d’impôt sur la plus-value.\n\nAu taux général actuellement publié, les plus-values réalisées relèvent du PFU de ${n('ctoTotal')} % : ${n('ctoIncome')} % d’impôt sur le revenu et ${n('ctoSocial')} % de prélèvements sociaux. Les dividendes relèvent du taux général de ${n('dividendTotal')} %. Une option globale pour le barème est possible. Les moins-values peuvent réduire les plus-values imposables selon les règles de compensation.`),
  rubrique('🔁 Et si tu retires de l’argent ?', "Le retrait d’espèces du CTO ne déclenche pas à lui seul un nouvel impôt. C’est la vente avec une plus-value ou l’encaissement d’un revenu qui compte. Les frais de courtage et de tenue de compte dépendent du courtier."),
], "Pour les placements absents du PEA, tu utilises un CTO ?");

adapterEnveloppe('assurance-vie', [
  rubrique('💼 Les supports et le plafond', "Tu verses de l’argent, puis tu choisis parmi les supports proposés par le contrat : fonds en euros, ETF, fonds ou SCPI. Il n’y a pas de plafond de versement. La garantie du fonds en euros dépend du contrat, parfois hors frais de gestion. Les unités de compte peuvent perdre de la valeur."),
  rubrique('⏳ Pourquoi les huit ans comptent', `Les huit ans se comptent depuis l’ouverture du contrat. Ton argent n’est pas bloqué jusque-là : tu peux demander un retrait, appelé rachat.\n\nAprès huit ans, un abattement annuel de ${n('avSingleAllowance')} € pour une personne seule ou ${n('avCoupleAllowance')} € pour un couple marié ou pacsé imposé en commun s’applique aux gains retirés, pour l’ensemble de tes contrats. Il réduit l’impôt sur le revenu, mais pas les prélèvements sociaux.`),
  rubrique('💰 Ce qui est taxé lors d’un retrait', `Un rachat contient une part de tes versements et une part de gains. Seuls les gains sont concernés par la fiscalité de sortie.\n\nPour les versements effectués depuis le 27 septembre 2017, le taux forfaitaire d’impôt sur le revenu est de ${n('avBeforeEightIncome')} % avant huit ans. Après huit ans et après abattement, il est de ${n('avLowerIncome')} % pour la part des gains liée aux primes n’excédant pas ${n('avPremiumThreshold')} €, ou de ${n('avHigherIncome')} % au-delà, en tenant compte de l’ensemble des contrats. Une option globale pour le barème est possible ; les versements plus anciens suivent d’autres règles. Les prélèvements sociaux des contrats ordinaires restent en principe de ${n('avSocial')} %, selon les supports et les montants déjà prélevés.`),
  rubrique('🔁 Changer de support ou retirer ?', "Vendre un support pour en acheter un autre dans le contrat est un arbitrage, pas un rachat. Cela ne déclenche pas l’impôt sur le revenu lié à la sortie. Vérifie les frais de versement, de gestion et d’arbitrage du contrat."),
], "Dans ton assurance-vie, tu privilégies le fonds en euros ou les unités de compte ?");

adapterEnveloppe('per', [
  rubrique('💼 Les placements', "Selon le contrat, tu peux investir dans des fonds, des ETF, un fonds en euros ou des SCPI. La gestion pilotée adapte la répartition à l’approche de la retraite ; tu peux aussi choisir la gestion libre. Les supports peuvent perdre de la valeur."),
  rubrique('💰 Le plafond de déduction', `Tu peux déduire tes versements volontaires de ton revenu imposable dans la limite de ton plafond disponible. Tu peux aussi renoncer à cette déduction.\n\nPour un salarié, le plafond ${R.perDeductionYear} repose sur ${n('perDeductionRate')} % des revenus professionnels ${R.perRevenueYear}, avec un minimum de ${n('perMinimum')} € et un maximum de ${n('perMaximum')} € avant ajustements individuels. Ton avis d’impôt précise ton plafond personnel. Il s’agit d’un plafond de déduction fiscale, pas d’un plafond de versement.`),
  rubrique('⏳ Quand récupérer l’argent ?', "L’épargne est en principe bloquée jusqu’à la retraite. Des déblocages anticipés existent, notamment pour l’achat de la résidence principale ou certains accidents de la vie. Les conditions dépendent de l’origine des sommes."),
  rubrique('🔁 La fiscalité à la sortie', `Pour une sortie en capital de versements volontaires déduits, tes versements sont imposés au barème de l’impôt sur le revenu, sans prélèvements sociaux. Les gains relèvent du PFU de ${n('perTotal')} % pour les intérêts perçus à partir de ${R.perTaxYear}, avec une option globale possible pour le barème.\n\nSi tu n’as pas déduit les versements, leur remboursement n’est pas soumis à l’impôt sur le revenu ; les gains restent imposables. Une sortie en rente suit d’autres règles. L’économie d’impôt à l’entrée doit donc être comparée à la fiscalité à la sortie.`),
], "Tu utilises le PER pour préparer ta retraite ?");

adapterEnveloppe('livret-a', [
  rubrique('💰 Le plafond', `Tu peux déposer jusqu’à ${n('livretCeiling')} € sur ton Livret A. Les intérêts peuvent porter le solde au-delà de ce plafond. Ce n’est pas un compte pour acheter des actions ou des ETF.`),
  rubrique('🔁 Les dépôts et les retraits', "Tu peux déposer et retirer de l’argent selon tes besoins, sans pénalité de retrait. Il n’y a pas de durée minimale de détention."),
  rubrique('📈 Les intérêts et la fiscalité', `Le taux de la dernière publication validée est de ${rateLabel(livretRate)} %. Il peut changer : ce n’est pas un rendement fixé pour toutes les années à venir. Les intérêts sont calculés par quinzaines et sont exonérés d’impôt sur le revenu et de prélèvements sociaux.\n\nLe capital est garanti, mais le taux peut être inférieur à l’inflation : ton épargne peut perdre du pouvoir d’achat.`),
], "Tu gardes ton épargne de précaution sur un Livret A ?");

adapterEnveloppe('ldds', [
  rubrique('💰 Le plafond', `Tu peux déposer jusqu’à ${n('lddsCeiling')} € sur un LDDS. Les intérêts peuvent porter le solde au-delà de ce plafond. Tu peux détenir un LDDS et un Livret A : il n’est pas nécessaire de remplir le Livret A pour ouvrir le LDDS.`),
  rubrique('🔁 Les dépôts et les retraits', "L’argent reste disponible, sans durée minimale de détention ni pénalité de retrait. Le LDDS reçoit des dépôts en euros, pas des actions ou des ETF."),
  rubrique('📈 Les intérêts et la fiscalité', `Le taux de la dernière publication validée est de ${rateLabel(R.lddsRate)} %. Il suit celui du Livret A et peut changer. Les intérêts sont calculés par quinzaines et sont exonérés d’impôt sur le revenu et de prélèvements sociaux.\n\nLe capital est garanti, mais le rendement ne garantit pas de suivre l’inflation.`),
], "Tu utilises aussi le LDDS pour ton épargne disponible ?");

adapterEnveloppe('abattement-pea', [
  rubrique('⏳ Le point de départ des cinq ans', "Le délai commence au premier versement sur le PEA. Il ne repart pas de zéro à chaque achat ou nouveau versement : un versement à la quatrième année bénéficie de l’ancienneté du plan."),
  rubrique('💰 Ce qui reste à payer', `Après cinq ans, les gains retirés sont exonérés d’impôt sur le revenu, mais restent soumis aux prélèvements sociaux au taux actuel de ${n('peaSocial')} %. Certains gains anciens peuvent relever de taux historiques. Tes versements ne sont pas taxés. L’avantage fiscal ne garantit pas le capital.`),
  rubrique('🔁 Retrait partiel ou total ?', "Un retrait partiel après cinq ans ne ferme pas le PEA. Tu peux continuer à investir et à verser dans la limite du plafond de versement. Un retrait total clôture le plan. Vendre un titre et garder l’argent dans le PEA ne constitue pas un retrait."),
], "Tu savais qu’un retrait partiel après cinq ans permet de garder ton PEA ouvert ?");
