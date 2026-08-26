// Bibliothèque "Vrai ou Faux" — chaque affirmation est dérivée directement du contenu déjà
// rédigé et vérifié dans le Lexique financier (src/pages/lexique-financier/data.js), jamais
// d'un fait nouveau. sourceTermeId pointe vers le terme d'origine pour traçabilité ; si le
// lexique est corrigé un jour, cherche ce champ pour retrouver les affirmations à revoir.
// Seuls les termes en variante A (enveloppes, produits, mécanismes) sont couverts, comme
// demandé — les indicateurs abstraits de la variante B ne s'y prêtent pas bien en "vrai/faux".

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
    sourceTermeId: "dca",
    categorie: "Mécanismes & stratégies",
    affirmation: "Le DCA (versement programmé) garantit un meilleur rendement qu'un investissement en une fois.",
    reponse: false,
    explication:
      "Le DCA ne garantit pas un meilleur rendement — c'est même l'inverse en moyenne historique. C'est avant tout un outil de discipline et de gestion du risque émotionnel, pas une martingale de performance.",
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
    affirmation: "Le rendement locatif brut tient déjà compte des charges et de la fiscalité.",
    reponse: false,
    explication:
      "Le rendement brut ignore toutes les charges : il sert surtout à comparer rapidement des biens entre eux. Le rendement net, plus réaliste, déduit charges, taxe foncière et vacance locative — souvent 1 à 2 points en dessous.",
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
];
