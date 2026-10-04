import { BOND_EXPOSURE_CASES } from '../../data/bond-exposure-cases.js';
import { ALLOCATION_CASES } from '../../data/allocation-cases.js'
// Revue éditoriale du 04/10/2026 : situations racontées et conséquences concrètes.
// Les nouveaux chiffres sont des exemples arithmétiques fictifs, hors taux réglementés.
// Posts éditoriaux relus individuellement. Cette bibliothèque n'invente ni performance ni
// ETF précis : chaque cas illustre une décision, et les liens renvoient aux sources primaires.
const editorialCases = [
  {
    id: 'world-sp500',
    title: 'ETF World + S&P 500',
    category: 'Diversification',
    text: "🌍 Tu as déjà un ETF MSCI World et tu veux ajouter un S&P 500 pour diversifier. Tu vas pourtant retrouver une partie des mêmes entreprises 👇\n\nTon World contient déjà de grandes sociétés américaines. En ajoutant le S&P 500, tu renforces surtout leur place dans ton portefeuille.\n\nSi c’est ce que tu cherches, cette deuxième ligne peut correspondre à ton choix.\n\nMais si tu voulais investir dans d’autres pays, elle ne répond pas à ce besoin : tu mets davantage d’argent sur les États-Unis.\n\n📌 Avant d’ajouter un ETF, regarde ce qu’il apporte à ceux que tu détiens déjà.\n\n💬 Si tu as les deux, c’était pour renforcer les États-Unis ou pour te diversifier ?",
    sources: [
      { label: 'MSCI World · MSCI', url: 'https://www.msci.com/indexes/index/990100/msci-world-index' },
      { label: 'S&P 500 · S&P Dow Jones Indices', url: 'https://www.spglobal.com/spdji/en/indices/equity/sp-500/' },
    ],
  },
  {
    id: 'dividendes-cto',
    title: 'Dividendes sur CTO',
    category: 'Revenus et performance',
    text: "💰 Tu hésites entre deux ETF : l’un verse beaucoup de dividendes, l’autre moins. Tu prends celui qui te rapporte le plus sur ton compte ? 👇\n\nPrenons un exemple fictif, sur la même période et dans la même devise.\n\nTu investis 1 000 € dans chacun, sans réinvestir les distributions.\n\nAvec le premier, tu reçois 60 €, mais tes parts ne valent plus que 920 €. Il te reste 980 € au total.\n\nAvec le second, tu reçois 20 € et tes parts valent 1 030 €. Tu as 1 050 € au total.\n\nLe premier a versé davantage. Le second t’a laissé plus d’argent, avant frais et fiscalité.\n\n📌 Si tu veux dépenser les revenus, les versements comptent. Pour comparer ce que tu as gagné, il faut aussi regarder la valeur des parts.\n\n💬 Tu cherches un revenu à utiliser maintenant ou un capital à faire grandir ?",
    sources: [
      { label: 'Rendement et risque des actions · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/savoir-bien-investir/cadrer-son-projet/rendement-et-risque-des-placements-en-actions-0' },
      { label: 'Compte-titres et fiscalité · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/supports-dinvestissement/compte-titres' },
    ],
  },
  {
    id: 'projet-trois-ans',
    title: 'Un projet dans trois ans',
    category: 'Horizon et risque',
    text: "🏠 Tu as mis 20 000 € de côté pour acheter un logement dans trois ans. Tu hésites à les placer en ETF pour faire grossir ton apport.\n\nMais si la Bourse baisse au moment où tu trouves le bon logement ? 👇\n\nImaginons que tes 20 000 € deviennent 16 000 € après une baisse de 20 %, hors frais.\n\nLe vendeur ne va pas attendre que ton ETF remonte.\n\nIl te manque alors 4 000 €. Il faut les trouver ailleurs, acheter moins cher ou repousser le projet.\n\nGarder ton apport sur un support garanti et disponible peut sembler moins intéressant quand la Bourse monte. Mais le jour où tu dois signer, tu sais sur quelle somme tu peux compter.\n\n📌 Avant d’investir cet argent, demande-toi si tu pourrais vraiment décaler ton achat.\n\n💬 Tu prendrais ce risque avec ton apport ?",
    sources: [
      { label: 'Définir son horizon de placement · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/savoir-bien-investir/cadrer-son-projet/fixer-son-horizon-de-placement' },
      { label: 'Risque des placements en actions · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/savoir-bien-investir/cadrer-son-projet/rendement-et-risque-des-placements-en-actions-0' },
    ],
  },
  {
    id: 'epargne-precaution',
    title: 'Investir sans réserve',
    category: 'Épargne de précaution',
    text: "🚗 Ta voiture tombe en panne : 1 500 € de réparation.\n\nTu as de l’argent, mais tout est investi en actions. Et tes placements viennent de perdre 20 % 👇\n\nPrenons un exemple fictif.\n\nTes 10 000 € investis ne valent plus que 8 000 €. Pour payer le garage, tu dois vendre près de 19 % de ton portefeuille, hors frais et fiscalité.\n\nTu aurais préféré laisser tes placements tranquilles. Mais tu as besoin de ta voiture et la facture doit être réglée.\n\nC’est à ça que sert une réserve disponible : pouvoir payer un imprévu sans que les cours de Bourse décident du moment où tu vends.\n\nPas besoin de chercher un montant valable pour tout le monde. Regarde les dépenses qui pourraient tomber chez toi et ce que tu pourrais absorber avec tes revenus.\n\n💬 Si tu devais sortir 1 500 € demain, tu toucherais à tes investissements ?",
    sources: [
      { label: 'Définir son objectif d’épargne · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/savoir-bien-investir/cadrer-son-projet/definir-son-objectif' },
      { label: 'Les règles d’or de l’investisseur · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/savoir-bien-investir/conseils-pratiques/les-regles-dor-de-linvestisseur' },
    ],
  },
  {
    id: 'world-emergents',
    title: 'World + émergents',
    category: 'Diversification géographique',
    text: "🌍 Tu investis sur un ETF MSCI World et tu veux aussi avoir des entreprises d’Inde et du Brésil. Ton ETF actuel les couvre-t-il ? 👇\n\nLe MSCI World se limite aux pays développés. Ces deux marchés émergents n’en font pas partie.\n\nAjouter un ETF émergents peut élargir les pays présents dans ton portefeuille. Mais il faut encore décider combien tu veux y mettre.\n\nSi cette nouvelle ligne pèse beaucoup, elle peut aussi faire davantage bouger le résultat de ton portefeuille. Elle apporte ses propres risques, notamment politiques et de change.\n\n📌 Choisir une exposition, c’est aussi choisir sa place dans l’ensemble. Une nouvelle ligne n’est pas juste une case à cocher.\n\n💬 Tu as ajouté des émergents à ton World ? Qu’est-ce qui t’a décidé ?",
    sources: [
      { label: 'MSCI World Index · MSCI', url: 'https://www.msci.com/indexes/index/990100/msci-world-index' },
      { label: 'MSCI Emerging Markets Index · MSCI', url: 'https://www.msci.com/indexes/index/891800/msci-em-emerging-markets-index-2' },
    ],
  },
  {
    id: 'etf-frais',
    title: '100 € par mois : combien de courtage ?',
    category: 'Coût réel',
    text: "💸 Tu mets 100 € par mois sur un ETF. Ton courtier prend 2 € à chaque achat.\n\nÇa paraît peu. Mais sur l’année, tu lui laisses 24 € pour investir 1 200 € 👇\n\nAvec ce tarif fictif, tu as deux possibilités :\n\n📅 Acheter chaque mois\n12 achats, donc 24 € de courtage.\n\n📆 Acheter 300 € tous les trois mois\n4 achats, donc 8 € de courtage.\n\nTu économises 16 € en regroupant tes achats.\n\nEn revanche, une partie de ton argent attend plus longtemps avant d’entrer en Bourse. Si les cours montent pendant ce temps, elle ne profite pas de la hausse.\n\nAvant de changer tes habitudes, regarde aussi le tarif des achats programmés chez ton courtier. Ils peuvent coûter moins cher.\n\n💬 Sur tes versements, tu paies combien à chaque achat ?",
    sources: [
      { label: 'Ce qu’il faut savoir sur les ETF · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/placements-collectifs/trackers-etf' },
      { label: 'Comprendre les frais des placements · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/les-frais-des-placements-financiers/comprendre-les-frais-des-placements-financiers' },
    ],
  },
  // Chiffres ci-dessous : exemples arithmétiques fictifs, pas performances
  // constatées ni cours d'ETF. Mécanismes relus sur les sources primaires liées.
  {
    id: 'ordre-limite-etf',
    title: 'Un ETF à 99 € ou 101 € ?',
    category: 'Passer un ordre',
    text: "📱 Tu veux acheter dix parts d’un ETF. Le dernier cours est à 100 €, mais le prix proposé à l’achat est de 101 €. Tu valides quand même ? 👇\n\nDans cet exemple fictif, tu paies 1 010 € pour les dix parts.\n\nLe prix auquel tu pourrais les vendre aussitôt est de 99 € : tu récupérerais 990 €, soit 20 € de moins, même si les prix proposés n’ont pas bougé. Hors frais de courtage.\n\nCet écart s’appelle la fourchette entre achat et vente.\n\nTu peux fixer un prix maximal de 100 € avec un ordre d’achat à cours limité. Mais ton ordre peut rester sans exécution si personne ne vend à ce prix.\n\n📌 Avant de valider, regarde le prix proposé à l’achat et le montant total. Le dernier cours ne garantit pas le prix de ton ordre.\n\n💬 Tu fixes un prix limite ou tu achètes au prix disponible ?",
    sources: [
      { label: 'Choisir et passer un ordre de bourse · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/comprendre-les-marches-financiers/les-ordres-de-bourse/choisir-et-passer-un-ordre-de-bourse-ce-quil-faut-savoir' },
      { label: 'Ce qu’il faut savoir sur les ETF · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/placements-collectifs/trackers-etf' },
    ],
  },
  {
    id: 'etf-change-euro',
    title: 'ETF acheté en euros, risque dollar ?',
    category: 'Risque de change',
    text: "🌍 Tes actions américaines gagnent 10 %, mais ton placement acheté en euros finit en baisse. Comment c’est possible ? 👇\n\nPrenons un exemple fictif avec une exposition non couverte au dollar.\n\nTu investis 1 000 €. Les actifs gagnent 10 % en dollars, mais le dollar perd 10 % de sa valeur face à l’euro sur la même période.\n\nLe calcul donne : 1 000 × 1,10 × 0,90 = 990 €.\n\nTu finis donc avec une baisse de 1 %, avant frais, malgré la hausse des actifs en dollars.\n\nAcheter la part en euros ne supprime pas cet effet. Une part couverte contre le change cherche à le réduire, avec ses propres coûts et limites.\n\n📌 Regarde si la couverture existe vraiment. La devise affichée chez ton courtier ne suffit pas.\n\n💬 Quand tu achètes un ETF, tu vérifies son exposition aux devises ?",
    sources: [
      { label: 'Devise de cotation et actifs détenus · iShares', url: 'https://www.ishares.com/uk/individual/education/getting-started-with-etfs/investor-education/etf-checklist' },
      { label: 'Risques et couverture de change des ETF · iShares', url: 'https://www.ishares.com/uk/individual/en/products/251891/ishares-msci-world-eur-hedged-ucits-etf' },
    ],
  },
  {
    id: 'reequilibrer-portefeuille',
    title: 'Une allocation qui a changé',
    category: 'Répartition du portefeuille',
    text: "⚖️ Tu avais choisi 70 % d’actions et 30 % d’obligations. Les actions montent, et ton portefeuille passe à 75 % / 25 %. Tu laisses faire ou tu reviens à ton choix de départ ? 👇\n\nPrenons un exemple fictif.\n\nTu pars avec 7 000 € d’actions et 3 000 € d’obligations. Plus tard, les actions valent 9 000 € et les obligations toujours 3 000 €.\n\nPour revenir à 70 % / 30 % sur ces 12 000 €, il faudrait 8 400 € d’actions et 3 600 € d’obligations.\n\nTu pourrais déplacer 600 € d’une poche vers l’autre, avec d’éventuels frais et impôts. Tu pourrais aussi orienter tes prochains versements vers les obligations pour te rapprocher de la cible, sans vendre.\n\n📌 Rééquilibrer ne garantit pas de gagner plus. Cela sert à garder la répartition que tu avais choisie.\n\n💬 Tu vérifies encore tes pourcentages ou tu laisses évoluer tes lignes ?",
    sources: [
      { label: 'Allocation et rééquilibrage · Investor.gov (SEC)', url: 'https://www.investor.gov/introduction-investing/getting-started/asset-allocation' },
      { label: 'Méthodes et coûts du rééquilibrage · Investor.gov (SEC)', url: 'https://www.investor.gov/additional-resources/general-resources/publications-research/info-sheets/beginners-guide-asset' },
    ],
  },
  {
    id: 'investir-somme-en-plusieurs-fois',
    title: '12 000 € d’un coup ou étalés ?',
    category: 'Rythme d’investissement',
    text: "💶 Tu as 12 000 € à investir sur le long terme. Tu mets tout aujourd’hui ou 1 000 € par mois pendant un an ? 👇\n\nSi tu places tout, les 12 000 € suivent immédiatement la Bourse. Une baisse juste après ton achat touche toute la somme.\n\nSi tu étales, tu n’investis que 1 000 € au premier achat. Le reste attend les suivants : une baisse au début touche donc une somme plus petite.\n\nMais si les cours montent, l’argent qui attend ne profite pas de cette hausse.\n\nTu peux préférer étaler parce que tu te sens plus à l’aise avec ce rythme. Il faut simplement accepter ce que l’attente peut coûter, et regarder les frais de chaque ordre.\n\n📌 Dans les deux cas, l’argent investi peut baisser. Aucun calendrier ne garantit le meilleur résultat.\n\n💬 Avec 12 000 € déjà disponibles, tu ferais quoi ?",
    sources: [
      { label: 'Mieux s’informer et investissement programmé · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/actualites-mises-en-garde/mieux-sinformer-pour-mieux-investir' },
      { label: 'Investir progressivement dans les fonds · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/placements-collectifs/bien-demarrer-avec-les-fonds-et-sicav' },
    ],
  },
  {
    id: 'etf-obligataire-taux',
    title: 'Un ETF obligataire peut baisser ?',
    category: 'Obligations et taux',
    text: "🏦 Tu places 10 000 € sur un ETF obligataire pour éviter les grosses variations. Quelque temps plus tard, il ne vaut plus que 9 500 €. Tu t’attendais à ça ? 👇\n\nC’est un exemple fictif de baisse de 5 %, hors distributions, frais et fiscalité.\n\nUn ETF obligataire peut baisser quand les taux montent : les anciennes obligations à taux fixe deviennent moins attractives, et leur prix peut reculer.\n\nSi tu avais prévu d’utiliser ces 10 000 € à une date précise, le mot « obligations » ne suffit donc pas à sécuriser ton budget.\n\nAvant d’acheter, regarde notamment la sensibilité du fonds aux taux, les émetteurs et les devises. Un ETF obligataire classique ne promet pas de te rendre tes parts à leur prix d’achat à une date donnée.\n\n💬 Tu avais vérifié ces points avant ton premier achat d’obligations ?",
    sources: [
      { label: 'Pourquoi les obligations baissent quand les taux montent · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/actions-obligations/obligations/pourquoi-le-prix-des-obligations-baisse-lorsque-les-taux-montent' },
      { label: 'Comprendre les obligations et leurs fonds · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/actions-obligations/obligations/comprendre-les-obligations-avant-dinvestir' },
    ],
  },
]

export const CASES = [...editorialCases, ...ALLOCATION_CASES, ...BOND_EXPOSURE_CASES]
