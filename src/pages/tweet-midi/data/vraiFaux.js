// Bibliothèque "Vrai ou Faux" — chaque affirmation est dérivée directement du contenu déjà
// rédigé et vérifié dans le Lexique financier (src/pages/lexique-financier/data.js), jamais
// d'un fait nouveau. sourceTermeId pointe vers le terme d'origine pour traçabilité ; si le
// lexique est corrigé un jour, cherche ce champ pour retrouver les affirmations à revoir.
// Couvre en priorité les termes en variante A (enveloppes, produits, mécanismes), plus les
// termes de variante B qui sont en réalité des règles concrètes et testables plutôt que des
// notions abstraites : Fiscalité française (taux, seuils, durées de détention — tout sauf
// abstrait), halving (dates et chiffres factuels du protocole Bitcoin), et une sélection
// d'Indicateurs & notions dont le contenu contient une affirmation vérifiable (TER, drawdown,
// volatilité, capitalisation boursière, inflation, taux sans risque).

export const VRAI_FAUX = [
  // ---------- Enveloppes fiscales ----------
  {
    id: "pea-plafond",
    sourceTermeId: "pea",
    categorie: "Enveloppes fiscales",
    affirmation: "Le PEA est plafonné à 150 000€ de versements.",
    reponse: true,
    explication:
      "C'est le plafond du PEA classique. Le PEA-PME étend ce plafond à 225 000€ au total pour les deux enveloppes combinées — mais pas plus de 150 000€ sur le PEA classique lui-même.",
  },
  {
    id: "pea-bloque-5-ans",
    sourceTermeId: "pea",
    categorie: "Enveloppes fiscales",
    affirmation: "L'argent placé sur un PEA est totalement bloqué pendant 5 ans.",
    reponse: false,
    explication:
      "Tu peux retirer ton argent avant 5 ans, mais ça clôture le PEA (sauf exceptions comme la création d'entreprise) et tu perds l'avantage fiscal acquis. Ce n'est pas un blocage, c'est une pénalité si tu sors trop tôt.",
  },
  {
    id: "pea-apres-5-ans",
    sourceTermeId: "pea",
    categorie: "Enveloppes fiscales",
    affirmation: "Après 5 ans, les gains du PEA ne sont plus soumis à aucun impôt ni prélèvement.",
    reponse: false,
    explication:
      "Après 5 ans, tu échappes à l'impôt sur le revenu, mais les prélèvements sociaux (18,6% depuis 2026) s'appliquent toujours. Ce n'est pas une exonération totale, juste une fiscalité très allégée.",
  },
  {
    id: "cto-plafond",
    sourceTermeId: "cto",
    categorie: "Enveloppes fiscales",
    affirmation: "Le CTO a un plafond de versement, comme le PEA.",
    reponse: false,
    explication:
      "Le CTO n'a aucun plafond de montant ni de marché accessible : c'est justement ce qui le distingue du PEA. En contrepartie, la flat tax de 31,4% s'applique dès le premier euro de gain.",
  },
  {
    id: "assurance-vie-csg-2026",
    sourceTermeId: "assurance-vie",
    categorie: "Enveloppes fiscales",
    affirmation: "L'assurance-vie a été épargnée par la hausse de la CSG de 2026.",
    reponse: true,
    explication:
      "Contrairement au CTO, au PEA ou au PER, l'assurance-vie reste à 17,2% de prélèvements sociaux après la réforme de janvier 2026, qui a fait passer les autres enveloppes à 18,6%.",
  },
  {
    id: "assurance-vie-plafond",
    sourceTermeId: "assurance-vie",
    categorie: "Enveloppes fiscales",
    affirmation: "L'assurance-vie a un plafond de versement.",
    reponse: false,
    explication:
      "Il n'y a pas de plafond de versement sur une assurance-vie, contrairement au PEA (150 000€) ou au Livret A (22 950€). Seuls les seuils d'abattement fiscal après 8 ans dépendent du montant versé.",
  },
  {
    id: "per-deblocage",
    sourceTermeId: "per",
    categorie: "Enveloppes fiscales",
    affirmation: "L'argent versé sur un PER est bloqué jusqu'à la retraite, sans aucune exception.",
    reponse: false,
    explication:
      "L'argent est en principe bloqué jusqu'à la retraite, mais il existe des cas de déblocage anticipé prévus par la loi : achat de la résidence principale, ou certains accidents de la vie.",
  },
  {
    id: "per-fiscalite-sortie",
    sourceTermeId: "per",
    categorie: "Enveloppes fiscales",
    affirmation: "L'avantage fiscal du PER à l'entrée est définitivement acquis, sans contrepartie à la sortie.",
    reponse: false,
    explication:
      "L'avantage fiscal à l'entrée se paie à la sortie : les sommes déduites de ton revenu imposable sont réintégrées à l'impôt sur le revenu au moment du retrait. Ce n'est pas un cadeau, c'est un report d'impôt.",
  },
  {
    id: "livret-a-taux",
    sourceTermeId: "livret-a",
    categorie: "Enveloppes fiscales",
    affirmation: "Le taux du Livret A est fixe et ne change jamais.",
    reponse: false,
    explication:
      "Le taux est fixé par l'État et réévalué deux fois par an, au 1er février et au 1er août. Il est passé à 1,70% au 1er août 2026, et ne suit pas toujours l'inflation.",
  },
  {
    id: "livret-a-fiscalite",
    sourceTermeId: "livret-a",
    categorie: "Enveloppes fiscales",
    affirmation: "Les intérêts du Livret A sont totalement exonérés d'impôt et de prélèvements sociaux.",
    reponse: true,
    explication:
      "C'est l'une des rares exceptions : ni impôt sur le revenu, ni prélèvements sociaux sur les intérêts du Livret A, quel que soit le montant. Même l'assurance-vie n'a pas ce niveau d'exonération.",
  },
  {
    id: "ldds-meme-taux",
    sourceTermeId: "ldds",
    categorie: "Enveloppes fiscales",
    affirmation: "Le LDDS a le même taux et la même disponibilité que le Livret A.",
    reponse: true,
    explication:
      "Le LDDS fonctionne comme un second Livret A : même taux, même disponibilité immédiate, mêmes exonérations. Seul son plafond diffère, plus bas à 12 000€ contre 22 950€ pour le Livret A.",
  },
  {
    id: "pee-abondement",
    sourceTermeId: "pee-perco",
    categorie: "Enveloppes fiscales",
    affirmation: "L'abondement de l'employeur sur un PEE peut atteindre jusqu'à 300% du versement du salarié.",
    reponse: true,
    explication:
      "Selon les accords d'entreprise, l'abondement peut effectivement aller jusqu'à 300% du versement, dans la limite de 3 844,80€ par an sur un PEE en 2026. Si ton entreprise le propose, c'est de l'argent gratuit à aller chercher.",
  },
  // ---------- Produits & marchés ----------
  {
    id: "etf-actif",
    sourceTermeId: "etf",
    categorie: "Produits & marchés",
    affirmation: "La plupart des ETF sont gérés activement par un gérant qui essaie de battre le marché.",
    reponse: false,
    explication:
      "Il existe des ETF actifs, mais la grande majorité des ETF sont indiciels et passifs : ils se contentent de suivre un indice, sans qu'un gérant tente de le battre. C'est ce qui explique leurs frais très bas.",
  },
  {
    id: "etf-synthetique-pea",
    sourceTermeId: "etf",
    categorie: "Produits & marchés",
    affirmation: "Un ETF synthétique ne peut pas être éligible au PEA, même s'il suit un indice américain.",
    reponse: false,
    explication:
      "C'est justement le mécanisme inverse : la réplication synthétique (via un swap) permet de loger un ETF S&P 500 dans un PEA normalement réservé aux actions européennes, en détenant des actions européennes en garantie.",
  },
  {
    id: "action-diversifiee",
    sourceTermeId: "action",
    categorie: "Produits & marchés",
    affirmation: "Acheter une seule action individuelle est aussi diversifié qu'un ETF.",
    reponse: false,
    explication:
      "Une action individuelle n'est pas diversifiée : si l'entreprise fait faillite, tu peux perdre la totalité de ta mise. Un ETF, lui, répartit ce risque sur des centaines voire des milliers d'entreprises.",
  },
  {
    id: "obligation-prix-fixe",
    sourceTermeId: "obligation",
    categorie: "Produits & marchés",
    affirmation: "Le prix d'une obligation ne bouge jamais avant son échéance.",
    reponse: false,
    explication:
      "Le prix d'une obligation varie avant l'échéance selon les taux d'intérêt : quand les taux montent, la valeur des obligations existantes baisse. Seul le remboursement à l'échéance est fixé à l'avance.",
  },
  {
    id: "fcp-continu",
    sourceTermeId: "fcp",
    categorie: "Produits & marchés",
    affirmation: "Un fonds commun de placement se négocie en continu, comme un ETF.",
    reponse: false,
    explication:
      "La valeur d'un FCP suit sa valeur liquidative, calculée en général une fois par jour — contrairement à un ETF, qui se négocie en bourse en temps réel tout au long de la séance.",
  },
  {
    id: "fcp-bat-etf",
    sourceTermeId: "fcp",
    categorie: "Produits & marchés",
    affirmation: "La majorité des fonds gérés activement battent les ETF indiciels sur le long terme.",
    reponse: false,
    explication:
      "C'est l'inverse : la grande majorité des fonds gérés activement font moins bien qu'un simple ETF indiciel sur le long terme, une fois les frais de gestion (souvent 1,5% à 2,5%) déduits.",
  },
  {
    id: "scpi-capital-garanti",
    sourceTermeId: "scpi",
    categorie: "Produits & marchés",
    affirmation: "Le capital investi dans une SCPI est garanti.",
    reponse: false,
    explication:
      "Le capital n'est pas garanti : le prix de la part peut baisser, comme cela a été le cas pour de nombreuses SCPI en 2023-2025 dans un contexte de correction du marché immobilier de bureaux.",
  },
  {
    id: "scpi-liquide",
    sourceTermeId: "scpi",
    categorie: "Produits & marchés",
    affirmation: "On peut revendre des parts de SCPI instantanément, comme une action.",
    reponse: false,
    explication:
      "Les parts de SCPI sont peu liquides : compte en général plusieurs semaines à plusieurs mois pour une revente, contrairement à une action ou un ETF qui se négocie en quelques secondes.",
  },
  {
    id: "opci-immobilier-minimum",
    sourceTermeId: "opci",
    categorie: "Produits & marchés",
    affirmation: "Un OPCI doit détenir au moins 60% d'actifs immobiliers.",
    reponse: true,
    explication:
      "C'est la règle : au moins 60% d'immobilier et un minimum de 5% de liquidités, le reste pouvant être investi en actions ou obligations — cette poche non-immobilière le rend plus volatil qu'une SCPI classique.",
  },
  {
    id: "tracker-different-etf",
    sourceTermeId: "trackers",
    categorie: "Produits & marchés",
    affirmation: "Un tracker et un ETF sont deux produits financiers différents.",
    reponse: false,
    explication:
      "Ce sont exactement les mêmes produits : \"tracker\" est le terme historiquement utilisé en France, \"ETF\" (Exchange Traded Fund) est le terme international. Seul le nom change.",
  },
  // ---------- Mécanismes & stratégies ----------
  {
    id: "dca-garantit-rendement",
    sourceTermeId: "dca-vs-lumpsum",
    categorie: "Mécanismes & stratégies",
    affirmation: "Faire du DCA (versement programmé) garantit un meilleur rendement qu'un versement unique (lump sum).",
    reponse: false,
    explication:
      "Historiquement c'est même l'inverse : une étude Vanguard (marchés américain, britannique et australien, 1926-2015) montre que le lump sum bat le DCA dans environ 68% des périodes étudiées. Le vrai intérêt du DCA n'est pas la performance, mais la discipline : il réduit le risque de mal tomber juste avant une grosse baisse, et rend l'investissement plus soutenable psychologiquement.",
  },
  {
    id: "levier-amplifie-perte",
    sourceTermeId: "effet-levier",
    categorie: "Mécanismes & stratégies",
    affirmation: "L'effet de levier amplifie aussi bien les gains que les pertes.",
    reponse: true,
    explication:
      "Avec un levier de 5, une hausse de 2% de l'actif devient environ +10% de gain, mais une baisse de 2% devient environ -10% de perte. Le levier ne choisit pas son camp.",
  },
  {
    id: "diversification-garantit-perf",
    sourceTermeId: "diversification",
    categorie: "Mécanismes & stratégies",
    affirmation: "Diversifier son portefeuille garantit de ne jamais perdre d'argent.",
    reponse: false,
    explication:
      "La diversification réduit fortement le risque de tout perdre à cause d'un seul mauvais choix, mais elle ne garantit pas la performance — et elle peut même diluer le rendement si elle est excessive.",
  },
  {
    id: "reequilibrage-mecanique",
    sourceTermeId: "reequilibrage",
    categorie: "Mécanismes & stratégies",
    affirmation: "Rééquilibrer un portefeuille consiste à racheter ce qui a le plus monté.",
    reponse: false,
    explication:
      "C'est l'inverse : rééquilibrer consiste à vendre une partie de ce qui a le plus monté (devenu surpondéré) pour racheter ce qui est sous-pondéré, afin de revenir à ta répartition cible de départ.",
  },
  {
    id: "lumpsum-bat-dca",
    sourceTermeId: "dca-vs-lumpsum",
    categorie: "Mécanismes & stratégies",
    affirmation: "Investir tout son capital en une fois bat en moyenne le DCA étalé, sur données historiques.",
    reponse: true,
    explication:
      "Une étude Vanguard sur les marchés américain, britannique et australien (1926-2015) montre que le lump sum bat un DCA étalé sur 12 mois dans environ 68% des périodes étudiées, car l'argent est exposé au marché plus tôt.",
  },
  {
    id: "vente-decouvert-perte-limitee",
    sourceTermeId: "vente-a-decouvert",
    categorie: "Mécanismes & stratégies",
    affirmation: "La perte potentielle d'une vente à découvert est plafonnée, comme pour un achat classique.",
    reponse: false,
    explication:
      "C'est l'inverse : dans un achat classique tu perds au maximum ta mise, mais une vente à découvert peut générer une perte théoriquement illimitée si l'actif ne cesse de monter.",
  },
  {
    id: "dividende-baisse-cours",
    sourceTermeId: "dividende",
    categorie: "Mécanismes & stratégies",
    affirmation: "Le cours d'une action baisse mécaniquement le jour du versement du dividende.",
    reponse: true,
    explication:
      "C'est un ajustement mécanique et normal : le jour du versement, le cours de l'action baisse du montant du dividende versé, puisque cet argent sort de l'entreprise pour aller vers les actionnaires.",
  },
  {
    id: "dividende-eleve-bon-signe",
    sourceTermeId: "dividende",
    categorie: "Mécanismes & stratégies",
    affirmation: "Un dividende très élevé est toujours une bonne nouvelle pour un actionnaire.",
    reponse: false,
    explication:
      "Un dividende très élevé peut au contraire être un signal d'alerte : il indique parfois que le marché anticipe une baisse ou une suppression future de ce dividende, pas une entreprise en pleine forme.",
  },
  {
    id: "reinvestissement-poids-perf",
    sourceTermeId: "reinvestissement-dividendes",
    categorie: "Mécanismes & stratégies",
    affirmation: "Les dividendes réinvestis ne représentent qu'une part négligeable de la performance long terme.",
    reponse: false,
    explication:
      "C'est l'inverse : les dividendes représentent historiquement entre 30% et 40% du rendement total à long terme du S&P 500, grâce à l'effet boule de neige des intérêts composés.",
  },
  // ---------- Crypto ----------
  {
    id: "blockchain-confidentielle",
    sourceTermeId: "blockchain",
    categorie: "Crypto",
    affirmation: "Une blockchain publique garantit la confidentialité des transactions.",
    reponse: false,
    explication:
      "C'est l'inverse : une blockchain publique enregistre les transactions de façon permanente et consultable par tous. La confidentialité y est très limitée, pas garantie.",
  },
  {
    id: "stablecoin-sans-risque",
    sourceTermeId: "stablecoin",
    categorie: "Crypto",
    affirmation: "Un stablecoin n'a aucun risque, contrairement aux autres cryptomonnaies.",
    reponse: false,
    explication:
      "Son nom suggère la stabilité, mais un stablecoin n'est pas sans risque : sa parité dépend de la confiance dans l'émetteur et de la réalité de ses réserves. Certains stablecoins algorithmiques se sont même effondrés (ex : TerraUSD en 2022).",
  },
  {
    id: "wallet-plateforme-cles",
    sourceTermeId: "cold-hot-wallet",
    categorie: "Crypto",
    affirmation: "Laisser ses cryptos sur une plateforme d'échange revient à détenir soi-même ses clés privées.",
    reponse: false,
    explication:
      "\"Not your keys, not your coins\" : tant que tes cryptos restent sur une plateforme, c'est elle qui détient les clés privées, pas toi. Tu ne détiens donc pas réellement tes cryptos dans ce cas.",
  },
  // ---------- Immobilier ----------
  {
    id: "rendement-brut-charges",
    sourceTermeId: "rendement-locatif",
    categorie: "Immobilier",
    affirmation: "Le rendement locatif brut tient déjà compte des charges.",
    reponse: false,
    explication:
      "Le rendement brut ignore toutes les charges : il sert surtout à comparer rapidement des biens entre eux. Le rendement net, plus réaliste, déduit charges, taxe foncière et vacance locative — souvent 1 à 2 points en dessous.",
  },
  {
    id: "rendement-net-fiscalite",
    sourceTermeId: "rendement-locatif",
    categorie: "Immobilier",
    affirmation: "Le rendement locatif net tient déjà compte de la fiscalité sur les loyers perçus.",
    reponse: false,
    explication:
      "Le rendement net déduit charges, taxe foncière, frais de gestion et vacance locative — mais pas la fiscalité : les loyers perçus sont imposés à part, au barème de l'impôt sur le revenu (régime micro-foncier ou réel), plus 17,2% de prélèvements sociaux.",
  },
  {
    id: "levier-immo-arret-remboursement",
    sourceTermeId: "effet-levier-immo",
    categorie: "Immobilier",
    affirmation: "Si un bien locatif perd de la valeur, tu peux arrêter de rembourser le crédit qui l'a financé.",
    reponse: false,
    explication:
      "Le levier amplifie aussi les pertes : si le bien perd de la valeur ou reste vacant, tu continues de rembourser le crédit intégralement, indépendamment de la performance réelle du bien.",
  },
  {
    id: "lmnp-amortissement-sans-impact",
    sourceTermeId: "lmnp",
    categorie: "Immobilier",
    affirmation: "Depuis 2025, l'amortissement déduit en LMNP n'a plus aucun impact sur la plus-value à la revente.",
    reponse: false,
    explication:
      "C'est l'inverse depuis la loi de finances 2025 : pour toute vente à partir du 15 février 2025, l'amortissement immobilier déduit doit être réintégré dans le calcul de la plus-value, ce qui réduit l'intérêt du LMNP sur le très long terme.",
  },

  // ---------- Deuxième affirmation par terme (pour respecter le minimum de 2 par terme) ----------
  {
    id: "cto-tout-marche",
    sourceTermeId: "cto",
    categorie: "Enveloppes fiscales",
    affirmation: "Le CTO permet d'investir sur n'importe quel marché mondial, y compris la crypto ou les produits dérivés.",
    reponse: true,
    explication:
      "Le CTO donne accès aux actions US, à l'Asie, au monde entier, mais aussi aux ETF sectoriels, obligations, trackers crypto et produits dérivés — sans aucun plafond de montant.",
  },
  {
    id: "ldds-que-des-especes",
    sourceTermeId: "ldds",
    categorie: "Enveloppes fiscales",
    affirmation: "Le LDDS permet aussi bien des dépôts en euros que des placements en actions.",
    reponse: false,
    explication:
      "Le LDDS ne permet que des dépôts et retraits en euros, exactement comme le Livret A : aucun placement en actions ou en fonds n'y est possible.",
  },
  {
    id: "pee-perco-duree-blocage",
    sourceTermeId: "pee-perco",
    categorie: "Enveloppes fiscales",
    affirmation: "Le PEE et le PERCO bloquent l'argent pour la même durée.",
    reponse: false,
    explication:
      "Le PEE bloque l'argent 5 ans, alors que le PERCO le bloque jusqu'à la retraite (sauf déblocage anticipé dans les deux cas) — ce n'est pas du tout la même durée d'engagement.",
  },
  {
    id: "action-droit-vote",
    sourceTermeId: "action",
    categorie: "Produits & marchés",
    affirmation: "Détenir une action te donne le droit de voter en assemblée générale de l'entreprise.",
    reponse: true,
    explication:
      "En tant qu'actionnaire, tu peux voter en assemblée générale et recevoir une part des bénéfices sous forme de dividendes — c'est ce qui distingue une action d'un simple placement financier passif.",
  },
  {
    id: "obligation-definition",
    sourceTermeId: "obligation",
    categorie: "Produits & marchés",
    affirmation: "Une obligation, c'est un prêt que tu accordes à une entreprise ou à un État.",
    reponse: true,
    explication:
      "C'est exactement ça : en échange de ce prêt, l'émetteur te verse un intérêt régulier (le coupon) et te rembourse la valeur nominale à l'échéance fixée à l'avance.",
  },
  {
    id: "opci-plus-volatil-scpi",
    sourceTermeId: "opci",
    categorie: "Produits & marchés",
    affirmation: "Un OPCI est toujours moins volatil qu'une SCPI classique.",
    reponse: false,
    explication:
      "C'est l'inverse : la poche non-immobilière obligatoire (actions, obligations, liquidités) rend l'OPCI plus exposé aux mouvements des marchés financiers, donc plus volatil qu'une SCPI investie à quasi 100% en immeubles.",
  },
  {
    id: "tracker-abus-langage",
    sourceTermeId: "trackers",
    categorie: "Produits & marchés",
    affirmation: "Le mot \"tracker\" désigne toujours un ETF réglementé, sans exception.",
    reponse: false,
    explication:
      "Le mot \"tracker\" est parfois utilisé abusivement pour désigner d'autres produits dérivés plus risqués — mieux vaut toujours vérifier qu'il s'agit bien d'un ETF réglementé (UCITS en Europe) avant d'investir.",
  },
  {
    id: "dca-definition",
    sourceTermeId: "dca",
    categorie: "Mécanismes & stratégies",
    affirmation: "Le DCA consiste à investir une somme fixe à intervalle régulier plutôt qu'en une seule fois.",
    reponse: true,
    explication:
      "C'est exactement le principe : automatiser un versement fixe, par exemple 200€ chaque mois, pour lisser ton prix d'achat moyen dans le temps sans avoir à deviner le bon moment.",
  },
  {
    id: "dca-frais-courtier",
    sourceTermeId: "dca",
    categorie: "Mécanismes & stratégies",
    affirmation: "Chaque versement programmé (DCA) peut générer des frais de courtage à l'unité, selon le courtier.",
    reponse: true,
    explication:
      "C'est pour ça qu'il vaut mieux privilégier un courtier qui propose le DCA sans frais ou à frais réduits — sinon, les frais répétés à chaque versement peuvent rogner l'intérêt de la méthode.",
  },
  {
    id: "levier-x5-definition",
    sourceTermeId: "effet-levier",
    categorie: "Mécanismes & stratégies",
    affirmation: "Un levier de 5 signifie que tu contrôles une position 5 fois plus grande que ton capital investi.",
    reponse: true,
    explication:
      "C'est la définition même du levier : avec 5 de levier, un capital donné contrôle une position 5 fois plus grande — ce qui amplifie d'autant les gains et les pertes potentielles.",
  },
  {
    id: "diversification-etf-monde-suffit",
    sourceTermeId: "diversification",
    categorie: "Mécanismes & stratégies",
    affirmation: "Un ETF monde suffit déjà à diversifier l'essentiel du risque spécifique à une entreprise.",
    reponse: true,
    explication:
      "Un ETF monde répartit ton capital sur des milliers d'entreprises, secteurs et zones géographiques en un seul produit — trop diversifier au-delà peut même diluer inutilement ta performance.",
  },
  {
    id: "reequilibrage-frais-fiscalite",
    sourceTermeId: "reequilibrage",
    categorie: "Mécanismes & stratégies",
    affirmation: "Rééquilibrer trop souvent un portefeuille peut multiplier les frais et déclencher de la fiscalité.",
    reponse: true,
    explication:
      "Chaque rééquilibrage génère des frais de courtage, et hors enveloppe défiscalisée (PEA, assurance-vie), il peut aussi déclencher de l'impôt sur les plus-values réalisées à chaque arbitrage.",
  },
  {
    id: "dca-lumpsum-compromis",
    sourceTermeId: "dca-vs-lumpsum",
    categorie: "Mécanismes & stratégies",
    affirmation: "Étaler un investissement sur 3 à 12 mois est un compromis courant entre DCA pur et lump sum pur.",
    reponse: true,
    explication:
      "Beaucoup d'investisseurs choisissent cette voie intermédiaire : étaler l'investissement sur 3 à 12 mois pour limiter le risque de timing sans rester trop longtemps hors du marché.",
  },
  {
    id: "vente-decouvert-definition",
    sourceTermeId: "vente-a-decouvert",
    categorie: "Mécanismes & stratégies",
    affirmation: "Vendre à découvert, c'est vendre un actif que tu ne possèdes pas encore, en pariant sur sa baisse.",
    reponse: true,
    explication:
      "Tu empruntes des titres, tu les vends immédiatement, puis tu les rachètes moins cher si le prix baisse comme prévu — la différence empochée est ton profit.",
  },
  {
    id: "blockchain-preuve-travail-energie",
    sourceTermeId: "blockchain",
    categorie: "Crypto",
    affirmation: "La preuve de travail (Bitcoin) consomme plus d'énergie que la preuve d'enjeu (Ethereum depuis 2022).",
    reponse: true,
    explication:
      "La preuve de travail sécurise le réseau via des mineurs qui résolvent des calculs complexes, très énergivore. La preuve d'enjeu immobilise des cryptomonnaies en garantie à la place, un mécanisme bien moins énergivore.",
  },
  {
    id: "stablecoin-toujours-adosse",
    sourceTermeId: "stablecoin",
    categorie: "Crypto",
    affirmation: "Tous les stablecoins sont adossés à des réserves réelles comme des dollars ou des obligations.",
    reponse: false,
    explication:
      "Les stablecoins adossés à des réserves (USDC, USDT) détiennent bien des actifs réels en garantie, mais les stablecoins algorithmiques tentent de maintenir leur parité par du code plutôt que des réserves — un modèle qui s'est déjà effondré (ex : TerraUSD en 2022).",
  },
  {
    id: "cold-wallet-connecte",
    sourceTermeId: "cold-hot-wallet",
    categorie: "Crypto",
    affirmation: "Un cold wallet reste connecté à internet en permanence.",
    reponse: false,
    explication:
      "C'est l'inverse : un cold wallet (clé USB dédiée, papier) stocke tes clés privées hors ligne, inaccessible à distance. C'est le hot wallet qui reste connecté à internet en permanence.",
  },
  {
    id: "rendement-net-inferieur-brut",
    sourceTermeId: "rendement-locatif",
    categorie: "Immobilier",
    affirmation: "Le rendement net d'un bien locatif est généralement inférieur au rendement brut.",
    reponse: true,
    explication:
      "Le rendement net déduit charges, taxe foncière, frais de gestion et vacance locative — il tourne souvent 1 à 2 points en dessous du rendement brut, qui ignore toutes ces charges.",
  },
  {
    id: "levier-immo-demultiplie",
    sourceTermeId: "effet-levier-immo",
    categorie: "Immobilier",
    affirmation: "L'effet de levier immobilier permet d'investir sur un montant bien supérieur à ton apport personnel.",
    reponse: true,
    explication:
      "Avec 20 000€ d'apport, tu peux par exemple emprunter 180 000€ et acheter un bien à 200 000€ : le gain se calcule sur les 200 000€, alors que tu n'en as sorti que 20 000€ de ta poche.",
  },
  {
    id: "lmnp-reduit-impot",
    sourceTermeId: "lmnp",
    categorie: "Immobilier",
    affirmation: "Le LMNP permet de réduire fortement l'impôt sur les loyers perçus grâce à l'amortissement comptable.",
    reponse: true,
    explication:
      "Sous le régime réel, tu peux déduire de tes loyers imposables non seulement tes charges, mais aussi l'amortissement du bien et du mobilier — de quoi ramener l'impôt sur les loyers perçus proche de zéro pendant plusieurs années.",
  },
  {
    id: "etf-capitalisation-reinvestit",
    sourceTermeId: "reinvestissement-dividendes",
    categorie: "Mécanismes & stratégies",
    affirmation: "Un ETF de capitalisation (Acc) réinvestit automatiquement les dividendes reçus, sans frais supplémentaires.",
    reponse: true,
    explication:
      "C'est la différence avec un ETF de distribution (Dist) : l'ETF de capitalisation rachète automatiquement des parts avec les dividendes perçus, en interne, sans frais de courtage ni action de ta part.",
  },

  // ---------- Troisième affirmation pour les termes qui n'en avaient que 2 ----------
  {
    id: "cto-frais-identiques",
    sourceTermeId: "cto",
    categorie: "Enveloppes fiscales",
    affirmation: "Les frais de courtage et de tenue de compte d'un CTO sont identiques chez tous les courtiers.",
    reponse: false,
    explication:
      "Ces frais varient énormément d'un courtier à l'autre — c'est justement l'un des points d'attention à vérifier avant d'ouvrir un CTO, pas un montant standardisé.",
  },
  {
    id: "assurance-vie-fonds-euros-rapporte-moins",
    sourceTermeId: "assurance-vie",
    categorie: "Enveloppes fiscales",
    affirmation: "Le fonds euros d'une assurance-vie garantit le capital mais rapporte généralement moins que les unités de compte.",
    reponse: true,
    explication:
      "Le fonds euros garantit le capital mais rapporte peu (autour de 2 à 3% net ces dernières années), alors que les unités de compte offrent un potentiel de performance plus élevé, au prix d'un risque de perte en capital.",
  },
  {
    id: "per-gestion-libre-defaut",
    sourceTermeId: "per",
    categorie: "Enveloppes fiscales",
    affirmation: "Par défaut, un PER est géré en gestion libre, pas en gestion pilotée.",
    reponse: false,
    explication:
      "C'est l'inverse : par défaut, le PER est en gestion pilotée, les investissements se sécurisant automatiquement à l'approche de la retraite. La gestion libre est une option à activer soi-même.",
  },
  {
    id: "livret-a-actions",
    sourceTermeId: "livret-a",
    categorie: "Enveloppes fiscales",
    affirmation: "On peut loger des ETF ou des actions sur un Livret A.",
    reponse: false,
    explication:
      "Le Livret A n'accepte que des dépôts et retraits en euros — aucun placement en actions, ETF ou fonds n'y est possible, contrairement à une assurance-vie ou un PEA.",
  },
  {
    id: "pee-abondement-plafond-perdu",
    sourceTermeId: "pee-perco",
    categorie: "Enveloppes fiscales",
    affirmation: "Ne pas verser jusqu'au plafond d'abondement de ton entreprise, c'est renoncer à de l'argent gratuit.",
    reponse: true,
    explication:
      "Si ton entreprise propose un abondement, chaque euro versé en dessous du plafond où elle continue d'abonder est de l'argent gratuit laissé sur la table — un rendement immédiat qu'aucun placement classique n'égale.",
  },
  {
    id: "etf-frais-plus-eleves-fonds-actif",
    sourceTermeId: "etf",
    categorie: "Produits & marchés",
    affirmation: "Les frais d'un ETF indiciel sont généralement plus élevés que ceux d'un fonds géré activement.",
    reponse: false,
    explication:
      "C'est l'inverse : un ETF indiciel facture souvent entre 0,05% et 0,40% de frais annuels, contre 1,5% à 2,5% en moyenne pour un fonds géré activement.",
  },
  {
    id: "action-croissance-dividendes",
    sourceTermeId: "action",
    categorie: "Produits & marchés",
    affirmation: "Une action de croissance verse généralement plus de dividendes qu'une action de rendement.",
    reponse: false,
    explication:
      "C'est l'inverse : une action de croissance réinvestit ses bénéfices pour se développer et verse peu ou pas de dividendes, alors qu'une action de rendement en reverse une part importante et régulière.",
  },
  {
    id: "obligation-entreprise-taux-plus-eleve",
    sourceTermeId: "obligation",
    categorie: "Produits & marchés",
    affirmation: "Une obligation d'entreprise offre généralement un taux plus élevé qu'une obligation d'État, en échange d'un risque de défaut plus important.",
    reponse: true,
    explication:
      "Une obligation d'État (comme les OAT françaises) est généralement plus sûre. Une obligation d'entreprise (corporate) rémunère mieux, mais avec un risque de défaut plus important selon la solidité de l'émetteur.",
  },
  {
    id: "scpi-fiscale-revenu-regulier",
    sourceTermeId: "scpi",
    categorie: "Produits & marchés",
    affirmation: "Une SCPI fiscale (type Pinel, Malraux) vise avant tout un revenu locatif régulier, comme une SCPI de rendement.",
    reponse: false,
    explication:
      "Une SCPI de rendement vise le revenu locatif régulier. Une SCPI fiscale vise surtout une réduction d'impôt, avec des contraintes de durée plus fortes — l'objectif principal n'est pas le même.",
  },
  {
    id: "opci-liquidites-minimum",
    sourceTermeId: "opci",
    categorie: "Produits & marchés",
    affirmation: "Un OPCI doit détenir un minimum de liquidités, en plus de son quota immobilier.",
    reponse: true,
    explication:
      "Un OPCI doit détenir au moins 60% d'actifs immobiliers et au minimum 5% de liquidités, le reste pouvant être investi en actions ou obligations — cette poche liquide permet de répondre plus vite aux demandes de retrait.",
  },
  {
    id: "levier-que-produits-derives",
    sourceTermeId: "effet-levier",
    categorie: "Mécanismes & stratégies",
    affirmation: "L'effet de levier ne concerne que les produits dérivés comme les CFD, jamais le crédit immobilier classique.",
    reponse: false,
    explication:
      "Le levier peut venir d'un emprunt (crédit lombard), d'un produit dérivé (CFD, turbo, warrant), mais aussi tout simplement du crédit immobilier — c'est même l'usage le plus répandu du levier chez les particuliers.",
  },
  {
    id: "vente-decouvert-sans-frais",
    sourceTermeId: "vente-a-decouvert",
    categorie: "Mécanismes & stratégies",
    affirmation: "La vente à découvert n'engendre aucun frais spécifique au-delà du courtage classique.",
    reponse: false,
    explication:
      "Emprunter les titres à vendre génère des frais d'emprunt facturés par le courtier, généralement au jour le jour, en plus des frais de courtage classiques.",
  },
  {
    id: "blockchain-gas-fees-fixes",
    sourceTermeId: "blockchain",
    categorie: "Crypto",
    affirmation: "Les frais de transaction blockchain (\"gas fees\") sont fixes et ne dépendent jamais de la congestion du réseau.",
    reponse: false,
    explication:
      "Les gas fees payés aux validateurs (par exemple sur Ethereum) varient au contraire selon la congestion du réseau — plus il y a de transactions en attente, plus les frais montent.",
  },
  {
    id: "stablecoin-valeur-stable-dollar",
    sourceTermeId: "stablecoin",
    categorie: "Crypto",
    affirmation: "Un stablecoin est conçu pour garder une valeur stable, généralement indexée sur le dollar américain.",
    reponse: true,
    explication:
      "C'est sa définition même : profiter des avantages de la crypto (rapidité, disponibilité 24/7) sans en subir la volatilité, en restant arrimé à une valeur stable comme le dollar.",
  },
  {
    id: "cold-wallet-gratuit",
    sourceTermeId: "cold-hot-wallet",
    categorie: "Crypto",
    affirmation: "Un cold wallet matériel est généralement gratuit, contrairement à un hot wallet.",
    reponse: false,
    explication:
      "C'est l'inverse : un cold wallet matériel coûte entre 50€ et 200€ à l'achat, alors qu'un hot wallet logiciel (application, extension navigateur) est généralement gratuit.",
  },
  {
    id: "assurance-emprunteur-obligatoire",
    sourceTermeId: "effet-levier-immo",
    categorie: "Immobilier",
    affirmation: "L'assurance emprunteur est obligatoire pour un crédit immobilier utilisant l'effet de levier.",
    reponse: true,
    explication:
      "Au même titre que les intérêts d'emprunt et les frais de dossier bancaire, l'assurance emprunteur fait partie des coûts obligatoires d'un crédit immobilier, quel que soit le montant du levier utilisé.",
  },
  {
    id: "lmnp-micro-bic-abattement",
    sourceTermeId: "lmnp",
    categorie: "Immobilier",
    affirmation: "Le régime micro-BIC applique un abattement forfaitaire de 50% sur les loyers perçus en LMNP.",
    reponse: true,
    explication:
      "C'est le principe du micro-BIC : un abattement forfaitaire de 50%, simple à appliquer mais souvent moins avantageux que le régime réel, qui permet de déduire l'amortissement du bien.",
  },

  // ---------- Fiscalité française (variante B, contenu concret et testable) ----------
  {
    id: "flat-tax-hausse-2026",
    sourceTermeId: "flat-tax",
    categorie: "Fiscalité française",
    affirmation: "La flat tax standard est passée de 30% à 31,4% au 1er janvier 2026.",
    reponse: true,
    explication:
      "La hausse se décompose en 12,8% d'impôt sur le revenu (inchangé) et 18,6% de prélèvements sociaux (contre 17,2% avant), suite à la hausse de la CSG sur les revenus du capital.",
  },
  {
    id: "flat-tax-meme-taux-partout",
    sourceTermeId: "flat-tax",
    categorie: "Fiscalité française",
    affirmation: "La flat tax s'applique exactement au même taux dans toutes les enveloppes d'investissement.",
    reponse: false,
    explication:
      "Depuis 2026, le taux diffère déjà entre un CTO (31,4%) et une assurance-vie (30%), sans même parler des règles spécifiques du PEA après 5 ans — ce n'est plus un taux unique partout.",
  },
  {
    id: "flat-tax-option-bareme",
    sourceTermeId: "flat-tax",
    categorie: "Fiscalité française",
    affirmation: "Si tu es faiblement imposé, tu peux choisir le barème progressif de l'impôt sur le revenu à la place de la flat tax.",
    reponse: true,
    explication:
      "Si ta tranche marginale d'imposition est inférieure à 12,8%, cette option peut être plus avantageuse — mais elle s'applique alors à tous tes revenus du capital de l'année, pas seulement à certains.",
  },
  {
    id: "pea-exoneration-totale-5ans",
    sourceTermeId: "abattement-pea",
    categorie: "Fiscalité française",
    affirmation: "Après 5 ans, un retrait sur un PEA n'est soumis à aucune taxe, ni impôt ni prélèvements sociaux.",
    reponse: false,
    explication:
      "L'exonération après 5 ans ne concerne que l'impôt sur le revenu. Les prélèvements sociaux (18,6% depuis 2026) restent dus sur les gains, quelle que soit l'ancienneté du PEA.",
  },
  {
    id: "pea-duree-par-versement",
    sourceTermeId: "abattement-pea",
    categorie: "Fiscalité française",
    affirmation: "La durée de 5 ans du PEA se compte depuis chaque versement individuel, pas depuis la date d'ouverture.",
    reponse: false,
    explication:
      "La durée se compte depuis la date d'ouverture du PEA, pas depuis chaque versement — un versement fait à la 4e année profite déjà de l'avantage dès que le PEA lui-même dépasse 5 ans.",
  },
  {
    id: "prelevements-sociaux-taux-unique",
    sourceTermeId: "prelevements-sociaux",
    categorie: "Fiscalité française",
    affirmation: "Les prélèvements sociaux sont de 18,6% sur absolument tous les placements financiers depuis 2026.",
    reponse: false,
    explication:
      "La hausse à 18,6% ne concerne que le CTO, le PEA, le PER et la crypto. L'assurance-vie, les PEL/CEL/PEP et les revenus immobiliers restent à 17,2%, et le Livret A reste à 0%.",
  },
  {
    id: "livret-a-exception-ps",
    sourceTermeId: "prelevements-sociaux",
    categorie: "Fiscalité française",
    affirmation: "Le Livret A est l'une des rares exceptions totalement exonérées de prélèvements sociaux.",
    reponse: true,
    explication:
      "Contrairement à la quasi-totalité des autres placements, où les prélèvements sociaux s'appliquent presque toujours (même sur un PEA après 5 ans), le Livret A y échappe entièrement.",
  },
  {
    id: "plus-value-imposable-totalite",
    sourceTermeId: "plus-value-imposable",
    categorie: "Fiscalité française",
    affirmation: "Quand tu revends un titre avec une plus-value, tu es imposé sur la totalité de la somme retirée, pas seulement sur le gain.",
    reponse: false,
    explication:
      "Seule la plus-value (prix de vente moins prix d'achat) est taxée, jamais le capital initialement investi — beaucoup surestiment l'impôt en pensant qu'il porte sur le montant total de la vente.",
  },
  {
    id: "plus-value-pmp",
    sourceTermeId: "plus-value-imposable",
    categorie: "Fiscalité française",
    affirmation: "En cas de ventes multiples d'un même titre acheté à des prix différents, c'est le prix moyen pondéré d'acquisition qui sert de référence pour calculer la plus-value.",
    reponse: true,
    explication:
      "C'est le prix moyen pondéré d'acquisition (PMP) qui sert de référence, pas le prix du dernier achat — un détail qui change le calcul si tu as renforcé une ligne à plusieurs prix différents.",
  },
  {
    id: "residence-principale-exoneree",
    sourceTermeId: "plus-value-immobiliere",
    categorie: "Fiscalité française",
    affirmation: "La résidence principale est exonérée de plus-value immobilière, quelle que soit la durée de détention.",
    reponse: true,
    explication:
      "C'est l'une des rares exonérations totales et immédiates du système fiscal français, contrairement à un investissement locatif ou une résidence secondaire, qui suivent le régime des abattements progressifs.",
  },
  {
    id: "plus-value-immo-meme-duree-abattement",
    sourceTermeId: "plus-value-immobiliere",
    categorie: "Fiscalité française",
    affirmation: "L'exonération totale d'impôt sur le revenu et celle des prélèvements sociaux sur une plus-value immobilière interviennent à la même durée de détention.",
    reponse: false,
    explication:
      "Les deux abattements ne suivent pas le même rythme : exonération totale d'impôt sur le revenu après 22 ans de détention, mais il faut attendre 30 ans pour l'exonération totale des prélèvements sociaux.",
  },
  {
    id: "plus-value-immo-taux-base",
    sourceTermeId: "plus-value-immobiliere",
    categorie: "Fiscalité française",
    affirmation: "Le taux de base d'une plus-value immobilière est de 36,2% (19% d'impôt sur le revenu + 17,2% de prélèvements sociaux).",
    reponse: true,
    explication:
      "C'est le taux applicable avant tout abattement pour durée de détention — des abattements progressifs viennent ensuite le réduire chaque année au-delà de la 5e année de détention.",
  },

  // ---------- Crypto (variante B) ----------
  {
    id: "halving-frequence",
    sourceTermeId: "halving",
    categorie: "Crypto",
    affirmation: "Le halving du Bitcoin divise par deux la récompense des mineurs environ tous les 4 ans.",
    reponse: true,
    explication:
      "Le halving se déclenche automatiquement tous les 210 000 blocs minés, ce qui correspond à environ 4 ans — un mécanisme fixé dans le code du Bitcoin depuis sa création en 2009, qu'aucune autorité ne peut modifier.",
  },
  {
    id: "halving-signal-achat-garanti",
    sourceTermeId: "halving",
    categorie: "Crypto",
    affirmation: "Un halving garantit historiquement une hausse du prix du Bitcoin qui suit.",
    reponse: false,
    explication:
      "Le halving a précédé des hausses de prix par le passé, mais c'est une corrélation observée historiquement, pas une loi financière garantie — les performances passées ne garantissent en rien une répétition du même schéma.",
  },

  // ---------- Indicateurs & notions (variante B, sélection de contenu concret) ----------
  {
    id: "ter-paye-en-plus",
    sourceTermeId: "ter",
    categorie: "Indicateurs & notions",
    affirmation: "Un ETF avec un TER de 0,20% te facture directement 2€ par an pour 1 000€ investis, que tu dois payer toi-même en plus.",
    reponse: false,
    explication:
      "Le TER est prélevé automatiquement et quotidiennement dans la valeur liquidative du fonds — tu n'as rien à payer toi-même, la performance affichée en tient déjà compte.",
  },
  {
    id: "ter-bas-garantit-bon-produit",
    sourceTermeId: "ter",
    categorie: "Indicateurs & notions",
    affirmation: "Un TER bas garantit à lui seul qu'un ETF est un bon produit.",
    reponse: false,
    explication:
      "Un TER bas ne suffit pas : il faut aussi vérifier que l'indice suivi et la méthode de réplication correspondent bien à ce que tu recherches.",
  },
  {
    id: "drawdown-prix-achat",
    sourceTermeId: "drawdown",
    categorie: "Indicateurs & notions",
    affirmation: "Le drawdown se calcule par rapport à ton prix d'achat initial, pas par rapport au plus haut atteint par l'actif.",
    reponse: false,
    explication:
      "Le drawdown est un calcul de creux par rapport à un sommet précédent, pas par rapport à ton prix d'achat — c'est une notion différente de ta plus ou moins-value personnelle.",
  },
  {
    id: "drawdown-gain-annuel",
    sourceTermeId: "drawdown",
    categorie: "Indicateurs & notions",
    affirmation: "Un portefeuille peut afficher un gain sur l'année tout en ayant subi un drawdown important en cours de route.",
    reponse: true,
    explication:
      "Si ton portefeuille passe de 10 000€ à 7 000€ avant de remonter au-dessus de son point de départ, tu finis l'année en gain — mais tu as bien vécu un drawdown de -30% en chemin.",
  },
  {
    id: "volatilite-mauvaise-nouvelle",
    sourceTermeId: "volatilite",
    categorie: "Indicateurs & notions",
    affirmation: "Une forte volatilité signifie automatiquement qu'un actif est une mauvaise nouvelle pour l'investisseur.",
    reponse: false,
    explication:
      "La volatilité mesure l'ampleur des mouvements de prix, pas leur direction. Un actif très volatile qui monte fortement reste volatile, même s'il enrichit ceux qui le détiennent.",
  },
  {
    id: "volatilite-risque-perte",
    sourceTermeId: "volatilite",
    categorie: "Indicateurs & notions",
    affirmation: "La volatilité et le risque de perte définitive sont exactement la même chose.",
    reponse: false,
    explication:
      "On confond souvent les deux : un ETF monde très diversifié peut être volatile à court terme sans jamais avoir affiché de perte permanente sur le long terme.",
  },
  {
    id: "capi-boursiere-calcul",
    sourceTermeId: "capitalisation-boursiere",
    categorie: "Indicateurs & notions",
    affirmation: "La capitalisation boursière se calcule en multipliant le prix de l'action par le nombre total d'actions en circulation.",
    reponse: true,
    explication:
      "Une entreprise dont l'action vaut 50€ avec 2 milliards d'actions en circulation a une capitalisation de 100 milliards d'euros — c'est le prix qu'il faudrait payer pour racheter 100% de l'entreprise à son cours actuel.",
  },
  {
    id: "capi-boursiere-ca",
    sourceTermeId: "capitalisation-boursiere",
    categorie: "Indicateurs & notions",
    affirmation: "Une capitalisation boursière élevée signifie forcément un chiffre d'affaires élevé.",
    reponse: false,
    explication:
      "On confond parfois les deux : une entreprise peut avoir une capitalisation très élevée avec un chiffre d'affaires modeste, si le marché anticipe une forte croissance future.",
  },
  {
    id: "inflation-rendement-nominal",
    sourceTermeId: "inflation",
    categorie: "Indicateurs & notions",
    affirmation: "Un placement qui rapporte 3% par an t'enrichit toujours de 3% en pouvoir d'achat réel.",
    reponse: false,
    explication:
      "C'est le rendement nominal, avant inflation. Avec une inflation à 2%, un livret à 3% ne t'enrichit réellement que de 1% en pouvoir d'achat — c'est le rendement réel qui compte vraiment.",
  },
  {
    id: "taux-sans-risque-zero-risque",
    sourceTermeId: "taux-sans-risque",
    categorie: "Indicateurs & notions",
    affirmation: "Le taux \"sans risque\" signifie qu'il n'y a absolument aucun risque de perte, dans tous les cas.",
    reponse: false,
    explication:
      "\"Sans risque\" ne veut pas dire \"sans risque du tout\" — même une obligation d'État jugée sans risque peut perdre de la valeur avant échéance si les taux montent, ou faire défaut dans des cas extrêmes.",
  },
  {
    id: "inflation-mesure-ipc",
    sourceTermeId: "inflation",
    categorie: "Indicateurs & notions",
    affirmation: "L'inflation se mesure notamment via l'IPC (indice des prix à la consommation) en France.",
    reponse: true,
    explication:
      "L'inflation se mesure via un indice des prix — l'IPC en France — qui suit l'évolution du prix d'un panier de biens et services représentatif, généralement exprimée en variation annuelle.",
  },
  {
    id: "taux-sans-risque-reference-us",
    sourceTermeId: "taux-sans-risque",
    categorie: "Indicateurs & notions",
    affirmation: "En zone euro, le taux sans risque de référence est le plus souvent celui des obligations d'État américaines.",
    reponse: false,
    explication:
      "En zone euro, la référence est plutôt celle des obligations d'État allemandes (Bund) ou françaises (OAT) à court terme — pas les obligations américaines, qui servent de référence pour le dollar.",
  },
];
