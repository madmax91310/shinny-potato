import { ALLOCATION_CASES } from '../../data/allocation-cases.js'
// Posts éditoriaux relus individuellement. Cette bibliothèque n'invente ni performance ni
// ETF précis : chaque cas illustre une décision, et les liens renvoient aux sources primaires.
const editorialCases = [
  {
    id: 'world-sp500',
    title: 'ETF World + S&P 500',
    category: 'Diversification',
    text: `🌍 Tu as déjà un ETF World. Ajouter un S&P 500, ça diversifie ton portefeuille ?

Pas forcément 👇

Le MSCI World détient déjà de grandes entreprises américaines. En ajoutant un S&P 500, tu rachètes donc une partie des mêmes sociétés.

📌 Ce que tu changes surtout : tu donnes davantage de poids aux États-Unis dans ton portefeuille.

Ça peut être un choix assumé. Mais avant d’ajouter cette ligne, pose-toi la vraie question :

« Est-ce que je veux plus d’actions américaines, ou est-ce que je cherche une diversification que cet ETF ne m’apportera pas ? »

💬 Tu détiens les deux ? C’était pour renforcer les États-Unis ou pour te diversifier ?`,
    sources: [
      { label: 'MSCI World · MSCI', url: 'https://www.msci.com/indexes/index/990100/msci-world-index' },
      { label: 'S&P 500 · S&P Dow Jones Indices', url: 'https://www.spglobal.com/spdji/en/indices/equity/sp-500/' },
    ],
  },
  {
    id: 'dividendes-cto',
    title: 'Dividendes sur CTO',
    category: 'Revenus et performance',
    text: `💰 Deux ETF affichent des dividendes. Tu choisis celui qui verse le plus ?

Attends une seconde 👇

Un dividende arrive sur ton compte, c’est concret. Mais pour savoir ce que ton placement t’a rapporté, il faut aussi regarder l’évolution du prix de tes parts.

Un ETF peut verser beaucoup et perdre de la valeur. Un autre peut verser moins et progresser davantage.

📌 Si tu veux un revenu à dépenser, regarde les distributions. Si tu veux comparer deux investissements, regarde leur performance totale, dividendes compris, sur la même période et dans la même devise.

💬 Tu cherches des revenus à toucher maintenant ou un capital à faire grandir ?`,
    sources: [
      { label: 'Rendement et risque des actions · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/savoir-bien-investir/cadrer-son-projet/rendement-et-risque-des-placements-en-actions-0' },
      { label: 'Compte-titres et fiscalité · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/supports-dinvestissement/compte-titres' },
    ],
  },
  {
    id: 'projet-trois-ans',
    title: 'Un projet dans trois ans',
    category: 'Horizon et risque',
    text: `🏠 Tu comptes utiliser cet argent dans trois ans. Un ETF actions peut-il accueillir toute la somme ?

La question, c’est ce qui se passe si le marché baisse juste avant ton achat 👇

Tu pourrais attendre une remontée. Mais ton projet, lui, ne pourra peut-être pas attendre. Il faudrait alors vendre au mauvais moment ou revoir ton budget.

📌 Avant de choisir un placement, sépare l’argent dont tu auras besoin à une date précise de celui que tu peux laisser investi plus longtemps.

Le montant que tu peux voir baisser n’est pas forcément le montant que tu peux te permettre d’immobiliser.

💬 Pour un projet daté, tu privilégies la disponibilité de l’argent ou son potentiel de rendement ?`,
    sources: [
      { label: 'Définir son horizon de placement · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/savoir-bien-investir/cadrer-son-projet/fixer-son-horizon-de-placement' },
      { label: 'Risque des placements en actions · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/savoir-bien-investir/cadrer-son-projet/rendement-et-risque-des-placements-en-actions-0' },
    ],
  },
  {
    id: 'epargne-precaution',
    title: 'Investir sans réserve',
    category: 'Épargne de précaution',
    text: `🚗 Ta voiture tombe en panne. Tu n’as pas de réserve disponible, mais tu as des ETF.

Tu vends quelques parts pour payer la réparation. Sauf que la Bourse a baissé ce mois-ci 👇

Le souci n’est pas d’avoir investi. C’est d’avoir confié à la Bourse de l’argent qui pouvait te servir à tout moment.

📌 Une épargne de précaution sert à faire face aux imprévus sans devoir vendre tes placements au mauvais moment. Son montant dépend de tes dépenses et de ta situation, pas d’un chiffre magique valable pour tout le monde.

💬 Si une grosse dépense arrivait demain, tu pourrais la payer sans toucher à tes investissements ?`,
    sources: [
      { label: 'Définir son objectif d’épargne · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/savoir-bien-investir/cadrer-son-projet/definir-son-objectif' },
      { label: 'Les règles d’or de l’investisseur · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/savoir-bien-investir/conseils-pratiques/les-regles-dor-de-linvestisseur' },
    ],
  },
  {
    id: 'world-emergents',
    title: 'World + émergents',
    category: 'Diversification géographique',
    text: `🌍 « J’ai un ETF MSCI World, donc j’investis partout dans le monde. »

Pas tout à fait 👇

Cet indice rassemble des actions de pays développés. Les marchés émergents, comme l’Inde ou le Brésil, n’en font pas partie.

📌 Ajouter un ETF émergents peut élargir ton exposition géographique. Mais ça ajoute aussi d’autres risques. La vraie question, c’est la place que tu veux leur donner dans ton portefeuille, pas le nombre de lignes que tu peux accumuler.

💬 Tu savais que « World » ne comprend pas les marchés émergents ?`,
    sources: [
      { label: 'MSCI World Index · MSCI', url: 'https://www.msci.com/indexes/index/990100/msci-world-index' },
      { label: 'MSCI Emerging Markets Index · MSCI', url: 'https://www.msci.com/indexes/index/891800/msci-em-emerging-markets-index-2' },
    ],
  },
  {
    id: 'etf-frais',
    title: 'ETF à petits frais',
    category: 'Coût réel',
    text: `💸 Tu hésites entre deux ETF et tu compares uniquement leurs frais annuels ?

Il manque peut-être une partie de l’addition 👇

Les frais de gestion pèsent chaque année sur la valeur de l’ETF. Mais quand tu achètes ou vends, il peut aussi y avoir des frais de courtage et un écart entre le prix d’achat et le prix de vente.

📌 Avant de choisir, regarde ce que tu détiens vraiment, puis le coût total dans TON cas : montant des ordres, fréquence d’achat, frais du courtier et conditions de négociation.

Un ETF moins cher sur la fiche n’est pas automatiquement le moins coûteux pour toi.

💬 Tu vérifies seulement les frais annuels, ou aussi le prix de tes ordres ?`,
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
    text: `📱 Ton ETF affiche deux prix : achat à 101 €, vente à 99 €. Pourquoi cet écart ?

Imagine que tu achètes 10 parts à 101 € : tu paies 1 010 €. Si tu les revends aussitôt à 99 €, tu récupères 990 €, soit 20 € de moins, même si les prix affichés n'ont pas bougé. Exemple fictif, hors frais de courtage.

Cet écart entre prix d'achat et prix de vente s'appelle la fourchette. Il peut varier selon la liquidité et le moment où tu passes l'ordre.

📌 Un ordre d'achat à cours limité à 100 € fixe ton prix maximal. En contrepartie, il peut rester sans exécution si aucun vendeur n'accepte ce prix.

Avant de valider, regarde les deux prix et le montant total de ton ordre, pas seulement le dernier cours affiché.

💬 Tu vérifies la fourchette avant d'acheter un ETF ?`,
    sources: [
      { label: 'Choisir et passer un ordre de bourse · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/comprendre-les-marches-financiers/les-ordres-de-bourse/choisir-et-passer-un-ordre-de-bourse-ce-quil-faut-savoir' },
      { label: 'Ce qu’il faut savoir sur les ETF · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/placements-collectifs/trackers-etf' },
    ],
  },
  {
    id: 'etf-change-euro',
    title: 'ETF acheté en euros, risque dollar ?',
    category: 'Risque de change',
    text: `🌍 Tu achètes en euros un ETF exposé à des actions américaines. Tu penses être protégé du dollar ?

Regarde cet exemple fictif : 1 000 € investis dans des actifs en dollars. Ils gagnent 10 % en dollars, mais, sur la même période, le dollar perd 10 % de sa valeur face à l'euro.

Le calcul en euros : 1 000 × 1,10 × 0,90 = 990 €. Soit −1 % avant frais, malgré la hausse des actifs en dollars.

📌 Le prix de négociation affiché en euros ne change pas, à lui seul, les devises auxquelles les actifs sont exposés. Pour réduire cet effet, il faut regarder si la part prévoit une couverture de change, qui a aussi ses limites et ses coûts.

💬 Tu regardes la devise des actifs ou seulement celle affichée par ton courtier ?`,
    sources: [
      { label: 'Devise de cotation et actifs détenus · iShares', url: 'https://www.ishares.com/uk/individual/education/getting-started-with-etfs/investor-education/etf-checklist' },
      { label: 'Risques et couverture de change des ETF · iShares', url: 'https://www.ishares.com/uk/individual/en/products/251891/ishares-msci-world-eur-hedged-ucits-etf' },
    ],
  },
  {
    id: 'reequilibrer-portefeuille',
    title: 'Une allocation qui a changé',
    category: 'Répartition du portefeuille',
    text: `⚖️ Ton portefeuille part avec 7 000 € en actions et 3 000 € en obligations : 70 % / 30 %.

Plus tard, imaginons 9 000 € d'actions et toujours 3 000 € d'obligations. Le total vaut 12 000 €, mais la répartition est passée à 75 % / 25 %.

Si ton objectif reste 70 % / 30 %, cela représente désormais 8 400 € d'actions et 3 600 € d'obligations. L'écart est de 600 € pour chaque poche.

📌 Rééquilibrer, c'est ramener les poids vers l'objectif que tu as choisi. Cela peut passer par les nouveaux versements ou par des ventes et achats, avec d'éventuels frais et conséquences fiscales.

Ce n'est pas une promesse de mieux performer : c'est une façon de garder le niveau de risque que tu avais décidé.

💬 Tu regardes encore la répartition réelle de ton portefeuille ?`,
    sources: [
      { label: 'Allocation et rééquilibrage · Investor.gov (SEC)', url: 'https://www.investor.gov/introduction-investing/getting-started/asset-allocation' },
      { label: 'Méthodes et coûts du rééquilibrage · Investor.gov (SEC)', url: 'https://www.investor.gov/additional-resources/general-resources/publications-research/info-sheets/beginners-guide-asset' },
    ],
  },
  {
    id: 'investir-somme-en-plusieurs-fois',
    title: '12 000 € d’un coup ou étalés ?',
    category: 'Rythme d’investissement',
    text: `💶 Tu disposes de 12 000 € pour investir sur le long terme. Tout placer aujourd'hui ou investir 1 000 € par mois pendant un an ?

Avec la première option, les 12 000 € suivent immédiatement les marchés. Avec la seconde, seuls 1 000 € sont investis au départ ; le reste attend les prochains versements.

📌 Étaler les achats peut aider à moins subir une baisse juste après le premier ordre et à investir sans chercher « le bon jour ». Mais si le marché monte pendant cette attente, l'argent non encore investi ne profite pas de cette hausse.

Ce choix dépend aussi des frais de courtage par ordre et de la tranquillité d'esprit que t'apporte un calendrier décidé à l'avance. Aucun des deux rythmes ne garantit un meilleur résultat.

💬 Avec une somme déjà disponible, tu investirais tout de suite ou par étapes ?`,
    sources: [
      { label: 'Mieux s’informer et investissement programmé · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/actualites-mises-en-garde/mieux-sinformer-pour-mieux-investir' },
      { label: 'Investir progressivement dans les fonds · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/placements-collectifs/bien-demarrer-avec-les-fonds-et-sicav' },
    ],
  },
  {
    id: 'etf-obligataire-taux',
    title: 'Un ETF obligataire peut baisser ?',
    category: 'Obligations et taux',
    text: `🏦 Tu mets 10 000 € dans un ETF obligataire. Tu t'attends à ce que sa valeur ne bouge presque pas ?

Exemple fictif : sa part perd 5 % et ta position vaut 9 500 €, hors éventuelles distributions et frais. Ce n'est pas le rendement observé d'un ETF précis.

Pourquoi cela peut arriver ? Quand les taux du marché montent, les obligations à taux fixe déjà détenues deviennent moins attractives. Leur prix peut baisser, et la valeur de l'ETF avec elles.

📌 Un ETF obligataire détient un portefeuille d'obligations qui évolue. Il n'offre pas, à lui seul, une date de remboursement garantie de tes parts à leur prix d'achat. Il faut aussi regarder la durée des obligations, la qualité des émetteurs et la devise.

💬 Tu savais qu'un ETF obligataire pouvait afficher une perte malgré ses obligations ?`,
    sources: [
      { label: 'Pourquoi les obligations baissent quand les taux montent · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/actions-obligations/obligations/pourquoi-le-prix-des-obligations-baisse-lorsque-les-taux-montent' },
      { label: 'Comprendre les obligations et leurs fonds · AMF', url: 'https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/actions-obligations/obligations/comprendre-les-obligations-avant-dinvestir' },
    ],
  },
]

export const CASES = [...editorialCases, ...ALLOCATION_CASES]
