// Posts éditoriaux relus individuellement. Cette bibliothèque n'invente ni performance ni
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
]
