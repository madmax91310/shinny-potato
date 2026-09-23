// Trois posts éditoriaux relus individuellement. Cette bibliothèque n'invente ni performance ni
// ETF précis : chaque cas illustre une décision, et les liens renvoient aux sources primaires.
export const CASES = [
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
]
