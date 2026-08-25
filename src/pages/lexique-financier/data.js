// Bibliothèque de termes du lexique financier — reprise telle quelle de la session
// d'origine (fiches pré-rédigées à la main, vérifiées avec sources). Deux variantes :
// A (enveloppe/produit) = Objectif / Pour qui / Mécanisme / Frais-Fiscalité / Avantage
// B (notion/fiscalité) = Définition / Calcul / Pourquoi important / À retenir

export const CATEGORY_ORDER = ["Enveloppes fiscales","Produits & marchés","Mécanismes & stratégies","Crypto","Immobilier","Indicateurs & notions","Fiscalité française"];

export const TERMES = [

/* ============ ENVELOPPES FISCALES (variante A · enveloppe) ============ */

{
  id:"pea", categorie:"Enveloppes fiscales", titre:"le PEA", variante:"A", sousVariante:"enveloppe",
  intro:`Le PEA est l'enveloppe qui permet d'investir en actions européennes en payant beaucoup moins d'impôts sur tes gains, à condition de le garder assez longtemps.`,
  objectif:`Investir en bourse sur des actions européennes tout en profitant d'une fiscalité allégée après 5 ans.`,
  pourQui:`Tu veux investir sur des actions ou ETF européens (ou mondiaux via des ETF synthétiques) sur le long terme, sans avoir besoin de retirer ton argent avant plusieurs années.`,
  mecanismeTitre:`💼 Qu'est-ce qu'on met dedans ?`,
  mecanismeContenu:`✅ Actions de sociétés européennes\n✅ ETF actions européennes, et ETF monde via la réplication synthétique\n❌ Actions américaines ou asiatiques en direct\n❌ Obligations, SCPI, crypto\n✅ Plafond de versement : 150 000€ (PEA classique)`,
  sectionsOptionnelles:[
    {titre:`🔀 PEA classique ou PEA-PME ?`, contenu:`Le PEA-PME est une version dédiée aux petites et moyennes entreprises. Son plafond de 225 000€ est partagé avec le PEA classique : le total des versements cumulés sur les deux ne peut pas dépasser 225 000€, dont 150 000€ maximum sur le PEA classique.`}
  ],
  attention:`Un retrait avant 5 ans clôture le PEA (sauf exceptions comme la création d'entreprise) et fait perdre l'avantage fiscal acquis.`,
  fraisTitre:`💰 Fiscalité`,
  fraisContenu:`Avant 5 ans, les gains sont taxés à la flat tax de 31,4%. Après 5 ans, ils ne sont plus soumis qu'aux prélèvements sociaux (18,6% depuis la hausse de la CSG au 1er janvier 2026), sans impôt sur le revenu.`,
  avantage:`Après 5 ans, tu peux retirer et continuer à investir dans un cadre quasi exonéré d'impôt sur le revenu — l'enveloppe la plus avantageuse pour investir en actions sur le long terme.`
},

{
  id:"cto", categorie:"Enveloppes fiscales", titre:"le CTO", variante:"A", sousVariante:"enveloppe",
  intro:`Le CTO est l'enveloppe sans limite, ni de montant ni de marché, pour investir librement.`,
  objectif:`Investir sur n'importe quel marché mondial, sans plafond.`,
  pourQui:`Tu as déjà rempli ton PEA, ou tu veux investir hors Europe (actions US, Asie, crypto).`,
  mecanismeTitre:`💼 Qu'est-ce qu'on met dedans ?`,
  mecanismeContenu:`✅ Actions US, Asie, monde entier\n✅ ETF sectoriels, obligations, trackers crypto, produits dérivés\n✅ Aucun plafond`,
  fraisTitre:`💰 Fiscalité`,
  fraisContenu:`Flat tax 31,4% dès le premier euro de gain, à chaque vente`,
  attention:`Attention aux frais de courtage et de tenue de compte, ils varient énormément selon le courtier`,
  avantage:`La liberté totale d'investir sur ce que tu veux, sans limite de montant.`
},

{
  id:"assurance-vie", categorie:"Enveloppes fiscales", titre:"l'assurance-vie", variante:"A", sousVariante:"enveloppe",
  intro:`L'assurance-vie est une enveloppe polyvalente qui mélange épargne sécurisée et investissement, avec un avantage fiscal qui grandit avec le temps.`,
  objectif:`Épargner et investir sur le long terme, en vue de la retraite ou pour transmettre un capital, avec une fiscalité qui s'améliore après 8 ans.`,
  pourQui:`Tu veux un support flexible qui mélange sécurité (fonds euros) et performance (unités de compte), avec des avantages en cas de succession.`,
  mecanismeTitre:`💼 Qu'est-ce qu'on met dedans ?`,
  mecanismeContenu:`✅ Fonds euros (capital garanti, rendement modéré)\n✅ Unités de compte : ETF, actions, SCPI, fonds diversifiés\n✅ Pas de plafond de versement\n❌ Actions en direct limitées selon les contrats`,
  sectionsOptionnelles:[
    {titre:`🔀 Fonds euros ou unités de compte ?`, contenu:`Le fonds euros garantit ton capital mais rapporte peu (autour de 2 à 3% net ces dernières années). Les unités de compte ne garantissent rien mais offrent un potentiel de performance plus élevé, au prix d'un risque de perte en capital.`}
  ],
  attention:`Les frais sur versement et de gestion varient énormément d'un contrat à l'autre — un contrat en ligne coûte souvent bien moins cher qu'un contrat bancaire traditionnel.`,
  fraisTitre:`💰 Fiscalité`,
  fraisContenu:`Avant 8 ans, flat tax de 30% sur les gains retirés. Après 8 ans, abattement annuel de 4 600€ (9 200€ pour un couple) sur les gains, puis taxation à 7,5% (+17,2% de prélèvements sociaux, soit 24,7%) sur les 150 000€ de versements les plus anciens ; au-delà de ce seuil, le taux remonte à 12,8% (soit 30% au total). L'assurance-vie a été explicitement épargnée par la hausse de la CSG de 2026, contrairement au CTO, au PEA ou au PER — elle reste à 17,2% de prélèvements sociaux.`,
  avantage:`Une fiscalité qui s'améliore avec le temps et un cadre très favorable pour transmettre un capital à tes proches hors succession classique — et depuis 2026, l'enveloppe la mieux préservée fiscalement face aux autres.`
},

{
  id:"per", categorie:"Enveloppes fiscales", titre:"le PER", variante:"A", sousVariante:"enveloppe",
  intro:`Le PER est l'enveloppe dédiée à la retraite : tu bloques ton argent jusque-là, mais tu réduis tes impôts chaque année où tu verses.`,
  objectif:`Préparer sa retraite en réduisant son revenu imposable pendant la vie active.`,
  pourQui:`Tu es fortement imposé (tranche à 30% ou plus) et tu peux te permettre de bloquer une partie de ton épargne jusqu'à la retraite.`,
  mecanismeTitre:`💼 Qu'est-ce qu'on met dedans ?`,
  mecanismeContenu:`✅ ETF, actions, fonds euros, SCPI selon le contrat\n✅ Versements déductibles du revenu imposable, dans une limite annuelle (environ 10% des revenus professionnels)\n❌ Argent bloqué jusqu'à la retraite, sauf déblocage anticipé (achat résidence principale, accidents de la vie)`,
  sectionsOptionnelles:[
    {titre:`🔀 Gestion pilotée ou libre ?`, contenu:`Par défaut, le PER est en gestion pilotée : les investissements se sécurisent automatiquement à l'approche de la retraite. Tu peux aussi choisir la gestion libre pour piloter toi-même la répartition.`}
  ],
  attention:`L'avantage fiscal à l'entrée se paie à la sortie : les sommes déduites sont réintégrées à l'impôt sur le revenu au moment du retrait.`,
  fraisTitre:`💰 Fiscalité`,
  fraisContenu:`Versements déductibles du revenu imposable pendant la phase d'épargne. À la sortie, la part correspondant aux versements déduits est imposée au barème, les plus-values à la flat tax de 31,4%.`,
  avantage:`Une économie d'impôt immédiate chaque année, particulièrement puissante si tu es dans une tranche marginale élevée.`
},

{
  id:"livret-a", categorie:"Enveloppes fiscales", titre:"le Livret A", variante:"A", sousVariante:"enveloppe",
  intro:`Le Livret A est l'épargne de précaution par excellence : sans risque, disponible à tout moment, mais avec un rendement limité.`,
  objectif:`Mettre de côté une épargne de sécurité immédiatement disponible, sans aucun risque de perte.`,
  pourQui:`Tu constitues ton épargne de précaution (3 à 6 mois de dépenses) avant de penser à investir.`,
  mecanismeTitre:`💼 Qu'est-ce qu'on met dedans ?`,
  mecanismeContenu:`✅ Uniquement des dépôts et retraits en euros\n✅ Plafond de dépôt : 22 950€\n✅ Disponible à tout moment, sans délai ni pénalité\n❌ Aucun placement en actions, ETF ou fonds`,
  attention:`Le taux (1,70% depuis le 1er août 2026) est fixé par l'État et réévalué deux fois par an, au 1er février et au 1er août — il ne suit pas toujours l'inflation, donc ton épargne peut perdre du pouvoir d'achat certaines années.`,
  fraisTitre:`💰 Fiscalité`,
  fraisContenu:`Les intérêts sont totalement exonérés d'impôt sur le revenu et de prélèvements sociaux.`,
  avantage:`Une disponibilité immédiate et une garantie totale du capital, idéal comme matelas de sécurité avant d'investir ailleurs.`
},

{
  id:"ldds", categorie:"Enveloppes fiscales", titre:"le LDDS", variante:"A", sousVariante:"enveloppe",
  intro:`Le LDDS fonctionne comme le Livret A, en complément, avec une orientation vers le financement de projets écologiques et solidaires.`,
  objectif:`Compléter son épargne de précaution une fois le Livret A rempli, avec les mêmes garanties.`,
  pourQui:`Tu as déjà rempli ton Livret A et tu veux continuer à épargner sans risque, au même taux.`,
  mecanismeTitre:`💼 Qu'est-ce qu'on met dedans ?`,
  mecanismeContenu:`✅ Dépôts et retraits en euros uniquement\n✅ Plafond de dépôt : 12 000€\n✅ Même taux et même disponibilité que le Livret A\n❌ Aucun placement en actions ou fonds`,
  fraisTitre:`💰 Fiscalité`,
  fraisContenu:`Intérêts exonérés d'impôt sur le revenu et de prélèvements sociaux, comme le Livret A.`,
  avantage:`Un deuxième matelas de sécurité sans risque, à activer une fois le Livret A au plafond.`
},

{
  id:"pee-perco", categorie:"Enveloppes fiscales", titre:"le PEE / PERCO", variante:"A", sousVariante:"enveloppe",
  intro:`Le PEE et le PERCO sont des enveloppes d'épargne proposées par ton employeur, souvent boostées par un abondement gratuit de l'entreprise.`,
  objectif:`Épargner via ton entreprise en profitant d'un abondement (de l'argent gratuit versé par l'employeur) et d'une fiscalité avantageuse.`,
  pourQui:`Ton employeur propose un plan d'épargne entreprise, en particulier s'il abonde tes versements.`,
  mecanismeTitre:`💼 Qu'est-ce qu'on met dedans ?`,
  mecanismeContenu:`✅ Fonds communs de placement d'entreprise (FCPE), souvent diversifiés en actions et obligations\n✅ Abondement de l'employeur, jusqu'à 300% de ton versement selon les accords, plafonné à 3 844,80€ par an sur un PEE en 2026\n❌ Argent bloqué 5 ans pour le PEE, jusqu'à la retraite pour le PERCO (sauf déblocage anticipé)`,
  attention:`Si ton entreprise propose un abondement, ne pas verser au moins jusqu'à son plafond, c'est laisser de l'argent gratuit sur la table.`,
  fraisTitre:`💰 Fiscalité`,
  fraisContenu:`Les sommes versées via l'intéressement, la participation et l'abondement sont exonérées d'impôt sur le revenu. Seuls les prélèvements sociaux s'appliquent sur les gains (18,6% depuis la hausse de la CSG au 1er janvier 2026).`,
  avantage:`L'abondement employeur, qui peut représenter un rendement immédiat et garanti bien supérieur à n'importe quel placement.`
},

/* ============ PRODUITS & MARCHÉS (variante A · produit) ============ */

{
  id:"etf", categorie:"Produits & marchés", titre:"les ETF", variante:"A", sousVariante:"produit",
  intro:`Un ETF est un panier d'entreprises que tu achètes en un seul produit coté en bourse, et dont la performance suit celle d'un indice.`,
  objectif:`Investir de façon diversifiée et peu coûteuse, sans avoir à choisir toi-même les actions.`,
  pourQui:`Tu veux investir en bourse sans passer des heures à analyser des entreprises une par une.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Un ETF suit la performance d'un indice, par exemple les 500 plus grandes entreprises américaines pour le S&P 500. Il se négocie en bourse comme une action classique, en temps réel.\n\nIl existe aussi des ETF actifs (gérés pour tenter de battre un indice), mais la grande majorité des ETF sont indiciels et passifs.`,
  sectionsOptionnelles:[
    {titre:`🔀 Physique ou synthétique ?`, contenu:`Un ETF physique détient réellement les actions qui composent son panier.\n\nUn ETF synthétique, lui, ne les détient pas forcément : il passe un contrat d'échange (un "swap") avec une banque, qui s'engage à lui reverser la performance de l'indice visé.\n\nC'est ce qui permet par exemple de loger un ETF S&P 500 dans un PEA, normalement réservé aux actions européennes : l'ETF détient un panier d'actions européennes en garantie, et récupère la performance américaine via le swap.`}
  ],
  attention:`Ça introduit un risque de contrepartie (que la banque fasse défaut), très encadré par la réglementation (collatéral, plafond de 10% par contrepartie) mais pas totalement nul.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Les ETF indiciels facturent un TER (frais de gestion annuel) souvent entre 0,05% et 0,40%, contre 1,5% à 2,5% en moyenne pour un fonds géré activement.`,
  avantage:`La diversification instantanée, des frais très faibles, et une performance qui suit le marché sans dépendre du talent d'un gérant.`
},

{
  id:"action", categorie:"Produits & marchés", titre:"une action", variante:"A", sousVariante:"produit",
  intro:`Une action est une part de propriété d'une entreprise cotée en bourse : en achetant une action, tu deviens actionnaire.`,
  objectif:`Investir directement dans une entreprise précise, pour profiter de sa croissance et éventuellement de ses dividendes.`,
  pourQui:`Tu as étudié une entreprise en particulier et tu veux miser sur sa performance individuelle, en acceptant un risque plus concentré qu'un ETF.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Quand tu achètes une action, tu deviens propriétaire d'une fraction du capital de l'entreprise. Sa valeur évolue selon l'offre et la demande sur le marché, influencée par les résultats de l'entreprise, ses perspectives et le contexte économique.\n\nEn tant qu'actionnaire, tu peux aussi voter en assemblée générale et recevoir une part des bénéfices sous forme de dividendes.`,
  sectionsOptionnelles:[
    {titre:`🔀 Action de croissance ou de rendement ?`, contenu:`Une action de croissance réinvestit ses bénéfices pour se développer et verse peu ou pas de dividendes (ex : entreprises tech). Une action de rendement reverse une part importante de ses bénéfices en dividendes réguliers (ex : entreprises matures comme les utilities ou l'énergie).`}
  ],
  attention:`Contrairement à un ETF, une action individuelle n'est pas diversifiée : si l'entreprise fait faillite, tu peux perdre la totalité de ta mise.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Frais de courtage à chaque achat/vente (souvent entre 0€ et quelques euros selon le courtier), pas de frais de gestion annuel contrairement à un fonds.`,
  avantage:`Un potentiel de performance individuelle plus élevé qu'un indice, si tu choisis la bonne entreprise — au prix d'un risque bien plus concentré.`
},

{
  id:"obligation", categorie:"Produits & marchés", titre:"une obligation", variante:"A", sousVariante:"produit",
  intro:`Une obligation, c'est un prêt que tu accordes à une entreprise ou un État, qui s'engage à te rembourser avec des intérêts.`,
  objectif:`Générer un revenu régulier et prévisible tout en prenant moins de risque qu'en actions.`,
  pourQui:`Tu cherches à stabiliser ton portefeuille ou tu approches d'un objectif financier pour lequel tu veux moins de volatilité.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Quand tu achètes une obligation, tu prêtes de l'argent à l'émetteur (État ou entreprise) pour une durée fixée à l'avance. En échange, il te verse un intérêt régulier (le coupon) et te rembourse la valeur nominale à l'échéance. Par exemple, une obligation d'État française (OAT) à 10 ans autour de 4% — son niveau début août 2026 — te verse environ 40€ par an pour 1 000€ investis.`,
  sectionsOptionnelles:[
    {titre:`🔀 Obligation d'État ou d'entreprise ?`, contenu:`Une obligation d'État (comme les OAT françaises) est généralement plus sûre. Une obligation d'entreprise (corporate) offre un taux plus élevé, mais avec un risque de défaut plus important selon la solidité de l'émetteur.`}
  ],
  attention:`Le prix d'une obligation varie avant l'échéance en fonction des taux d'intérêt : quand les taux montent, la valeur des obligations existantes baisse.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Frais de courtage à l'achat, ou frais de gestion si tu passes par un fonds obligataire ou un ETF obligataire.`,
  avantage:`Un revenu plus prévisible que les actions, avec un risque généralement plus faible, utile pour équilibrer un portefeuille.`
},

{
  id:"fcp", categorie:"Produits & marchés", titre:"un fonds commun de placement", variante:"A", sousVariante:"produit",
  intro:`Un fonds commun de placement regroupe l'argent de nombreux investisseurs, géré par un professionnel qui choisit les investissements à leur place.`,
  objectif:`Déléguer la gestion de ton épargne à un professionnel qui sélectionne les actifs pour toi.`,
  pourQui:`Tu préfères confier tes choix d'investissement à un gérant plutôt que les faire toi-même, et tu es prêt à payer des frais de gestion plus élevés pour ça.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Le gérant du fonds collecte l'argent de tous les investisseurs et l'investit selon une stratégie définie (actions, obligations, secteur précis...). La valeur de ta part suit la valeur liquidative du fonds, calculée en général une fois par jour, contrairement à un ETF qui se négocie en continu.`,
  attention:`La grande majorité des fonds gérés activement font moins bien qu'un simple ETF indiciel sur le long terme, une fois les frais déduits.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Frais de gestion annuels souvent entre 1,5% et 2,5%, parfois des frais d'entrée ou de sortie en plus.`,
  avantage:`Utile si tu veux une gestion déléguée sur une stratégie précise que tu ne peux pas répliquer facilement toi-même.`
},

{
  id:"scpi", categorie:"Produits & marchés", titre:"la SCPI", variante:"A", sousVariante:"produit",
  intro:`La SCPI te permet d'investir dans l'immobilier locatif sans acheter de bien toi-même, via des parts gérées par une société de gestion.`,
  objectif:`Percevoir des revenus locatifs réguliers sans les contraintes de la gestion immobilière directe.`,
  pourQui:`Tu veux de l'immobilier dans ton patrimoine mais tu n'as pas envie de gérer un bien, des locataires ou des travaux.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`La société de gestion achète et gère un parc d'immeubles (bureaux, commerces, logements) avec l'argent des porteurs de parts. Les loyers perçus, moins les frais de gestion, te sont reversés au prorata de tes parts, généralement chaque trimestre. Selon l'ASPIM, le taux de distribution moyen du marché s'est établi à 4,91% en 2025 (contre 4,72% en 2024).`,
  sectionsOptionnelles:[
    {titre:`🔀 SCPI de rendement ou fiscale ?`, contenu:`Une SCPI de rendement vise le revenu locatif régulier. Une SCPI fiscale (Pinel, Malraux...) vise surtout une réduction d'impôt, avec des contraintes de durée plus fortes.`},
    {titre:`🔀 Avec ou sans frais d'entrée ?`, contenu:`Les SCPI traditionnelles facturent des frais de souscription (8 à 12% en moyenne, parfois plus). Une nouvelle génération de SCPI supprime ces frais d'entrée, mais compense avec des frais de gestion annuels plus élevés et des frais de sortie en cas de revente rapide — le coût total sur la durée n'est pas forcément plus faible, il faut comparer sur ton horizon de détention réel.`}
  ],
  attention:`Les parts de SCPI sont peu liquides (revente en plusieurs semaines à plusieurs mois) et le capital n'est pas garanti : le prix de la part peut baisser, comme cela a été le cas pour de nombreuses SCPI en 2023-2025 dans un contexte de correction du marché immobilier de bureaux.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Les frais varient fortement selon le modèle de la SCPI : souscription entre 8% et 12% pour les SCPI classiques, ou pas de frais d'entrée mais une gestion plus chère pour les SCPI récentes — dans tous les cas, ils sont déjà intégrés au prix de la part.`,
  avantage:`Un accès à l'immobilier locatif dès quelques centaines d'euros, sans gestion locative à assurer toi-même.`
},

{
  id:"opci", categorie:"Produits & marchés", titre:"l'OPCI", variante:"A", sousVariante:"produit",
  intro:`L'OPCI est un cousin de la SCPI, qui mélange immobilier et actifs financiers plus liquides comme des actions ou des liquidités.`,
  objectif:`Investir dans l'immobilier tout en gardant une meilleure liquidité qu'une SCPI classique.`,
  pourQui:`Tu veux de l'exposition immobilière, notamment dans une assurance-vie, avec la possibilité de revendre plus facilement qu'une SCPI.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Un OPCI doit détenir au moins 60% d'actifs immobiliers et au minimum 5% de liquidités, le reste pouvant être investi en actions ou obligations. Cette poche liquide permet de répondre plus rapidement aux demandes de retrait, contrairement à une SCPI investie à quasi 100% en immeubles.`,
  attention:`La poche non-immobilière rend l'OPCI plus volatil qu'une SCPI, car il est exposé aux mouvements des marchés financiers.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Frais de gestion annuels comparables à une SCPI, mais souvent sans les frais de souscription aussi élevés.`,
  avantage:`Une meilleure liquidité que la SCPI, avec un accès facilité via les unités de compte de l'assurance-vie.`
},

{
  id:"trackers", categorie:"Produits & marchés", titre:"les trackers", variante:"A", sousVariante:"produit",
  intro:`Un tracker désigne le même produit qu'un ETF : un fonds coté en bourse qui réplique la performance d'un indice.`,
  objectif:`Suivre la performance d'un marché ou d'un secteur en un seul produit, sans sélectionner toi-même les titres.`,
  pourQui:`Tu veux investir simplement sur un indice (CAC 40, S&P 500, secteur tech...) sans multiplier les lignes dans ton portefeuille.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`"Tracker" est le terme historiquement utilisé en France, "ETF" (Exchange Traded Fund) est le terme international — ce sont les mêmes produits. Un tracker réplique un indice soit physiquement (en détenant les titres), soit synthétiquement (via un contrat d'échange avec une contrepartie), et se négocie en bourse en temps réel comme une action.`,
  attention:`Le mot "tracker" est parfois utilisé abusivement pour désigner d'autres produits dérivés plus risqués — vérifie toujours qu'il s'agit bien d'un ETF réglementé (UCITS en Europe).`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Comme pour un ETF, un TER (frais de gestion annuel) généralement entre 0,05% et 0,40%.`,
  avantage:`Le même avantage qu'un ETF : diversification instantanée et frais très faibles, sous un nom plus courant en France.`
},

/* ============ MÉCANISMES & STRATÉGIES (variante A · produit) ============ */

{
  id:"dca", categorie:"Mécanismes & stratégies", titre:"le DCA (versement programmé)", variante:"A", sousVariante:"produit",
  intro:`Le DCA consiste à investir une somme fixe à intervalle régulier, plutôt que d'investir tout ton capital d'un coup.`,
  objectif:`Lisser ton prix d'achat moyen dans le temps et limiter l'impact du timing de marché.`,
  pourQui:`Tu reçois un revenu régulier (salaire) et tu veux investir sans avoir à te demander en permanence si "c'est le bon moment".`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Tu automatises un versement fixe, par exemple 200€ chaque mois, sur un ETF ou un panier d'actifs. Quand les prix sont hauts, tu achètes moins de parts ; quand ils sont bas, tu en achètes plus. Sur la durée, ton prix d'achat moyen se lisse, sans que tu aies besoin de deviner le meilleur moment pour investir.`,
  attention:`Le DCA ne garantit pas un meilleur rendement qu'un investissement en une fois — c'est avant tout un outil de discipline et de gestion du risque émotionnel, pas une martingale.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Selon le courtier, chaque versement programmé peut générer des frais de courtage à l'unité — privilégie un courtier qui propose le DCA sans frais ou à frais réduits.`,
  avantage:`Une méthode simple et automatisable qui retire l'émotion de la décision d'investir, et t'évite d'investir toute ta capacité au pire moment possible.`
},

{
  id:"effet-levier", categorie:"Mécanismes & stratégies", titre:"l'effet de levier", variante:"A", sousVariante:"produit",
  intro:`L'effet de levier consiste à investir avec de l'argent emprunté pour démultiplier tes gains potentiels — et tes pertes potentielles.`,
  objectif:`Augmenter la taille de ta position au-delà de ton capital réellement disponible.`,
  pourQui:`Tu es un investisseur expérimenté qui comprend et accepte un risque de perte amplifié, souvent sur des horizons courts.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Avec un levier de 5, par exemple, tu contrôles une position 5 fois plus grande que ton capital investi. Si l'actif monte de 2%, ton gain est amplifié à environ 10% ; s'il baisse de 2%, ta perte l'est tout autant. Le levier peut venir d'un emprunt (crédit lombard), d'un produit dérivé (CFD, turbo, warrant) ou du crédit immobilier.`,
  attention:`Un levier élevé peut entraîner une perte totale, voire supérieure à ta mise initiale selon le produit — ce n'est pas réservé aux débutants, c'est déconseillé aux débutants.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Intérêts sur le montant emprunté (souvent facturés au jour le jour sur les CFD), qui rognent la performance si la position est gardée longtemps.`,
  avantage:`Un potentiel de gain démultiplié à capital de départ égal — mais uniquement justifié si tu maîtrises précisément le risque de perte associé.`
},

{
  id:"diversification", categorie:"Mécanismes & stratégies", titre:"la diversification", variante:"A", sousVariante:"produit",
  intro:`Diversifier, c'est répartir ton argent entre plusieurs actifs différents plutôt que de tout miser sur un seul, pour réduire le risque global.`,
  objectif:`Réduire l'impact qu'un seul actif défaillant peut avoir sur l'ensemble de ton portefeuille.`,
  pourQui:`Tout investisseur, quel que soit son niveau — c'est l'un des seuls principes qui fait à peu près consensus en finance.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Plutôt que d'investir 100% dans une seule action, tu répartis ton capital entre plusieurs actifs qui ne réagissent pas tous de la même façon aux mêmes événements : différentes entreprises, secteurs, zones géographiques, voire classes d'actifs (actions, obligations, immobilier). Un ETF monde, par exemple, diversifie automatiquement sur des milliers d'entreprises en un seul produit.`,
  attention:`Trop diversifier peut aussi diluer ta performance et complexifier inutilement ton suivi — un ETF monde suffit déjà à diversifier l'essentiel du risque spécifique à une entreprise.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Pas de frais propres à la diversification en elle-même, si ce n'est les frais cumulés des produits utilisés pour l'obtenir (ETF, fonds...).`,
  avantage:`Elle ne garantit pas la performance, mais elle réduit fortement le risque de tout perdre à cause d'un seul mauvais choix.`
},

{
  id:"reequilibrage", categorie:"Mécanismes & stratégies", titre:"le rééquilibrage de portefeuille", variante:"A", sousVariante:"produit",
  intro:`Rééquilibrer, c'est remettre périodiquement ton portefeuille aux proportions que tu avais fixées au départ entre tes différentes classes d'actifs.`,
  objectif:`Maintenir le niveau de risque que tu avais choisi au départ, malgré les mouvements de marché qui déforment tes proportions.`,
  pourQui:`Tu as défini une répartition cible (par exemple 80% actions / 20% obligations) et tu veux t'y tenir dans la durée.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Si les actions montent fortement, leur poids dans ton portefeuille augmente au-delà de ta cible initiale, ce qui augmente ton risque sans que tu l'aies décidé. Rééquilibrer consiste à vendre une partie de ce qui a le plus monté pour racheter ce qui est sous-pondéré, afin de revenir à ta répartition cible — par exemple une fois par an.`,
  attention:`Rééquilibrer trop souvent multiplie les frais et, hors enveloppe défiscalisée, peut déclencher de la fiscalité à chaque arbitrage.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Frais de courtage à chaque arbitrage, et fiscalité potentielle sur les plus-values réalisées si tu es hors PEA ou assurance-vie.`,
  avantage:`Il t'oblige à vendre ce qui a le plus monté et acheter ce qui a le moins monté — une discipline qui va à l'encontre de tes émotions, dans le bon sens.`
},

{
  id:"dca-vs-lumpsum", categorie:"Mécanismes & stratégies", titre:"DCA vs lump sum", variante:"A", sousVariante:"produit",
  intro:`C'est le débat entre investir progressivement dans le temps (DCA) ou investir tout son capital disponible en une seule fois (lump sum).`,
  objectif:`Choisir la méthode d'entrée sur le marché la plus adaptée à ta situation et à ta tolérance au risque immédiat.`,
  pourQui:`Tu disposes d'un capital important d'un coup (héritage, prime, vente d'un bien) et tu hésites entre l'investir en une fois ou petit à petit.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Une étude Vanguard portant sur les marchés américain, britannique et australien entre 1926 et 2015 a montré que le lump sum (tout investir en une fois) bat en moyenne un DCA étalé sur 12 mois dans environ 68% des périodes étudiées, car l'argent est exposé au marché plus tôt sur des marchés actions historiquement haussiers. Le DCA, lui, réduit le risque de "mal tomber" juste avant une grosse baisse, au prix d'un temps où une partie de ton capital reste non investie.`,
  sectionsOptionnelles:[
    {titre:`🔀 Un compromis possible`, contenu:`Beaucoup d'investisseurs choisissent une voie intermédiaire : étaler l'investissement sur 3 à 12 mois, pour limiter le risque de timing sans rester trop longtemps hors marché.`}
  ],
  fraisTitre:`💰 Frais`,
  fraisContenu:`Le lump sum limite les frais de courtage à une seule opération, quand un DCA étalé sur plusieurs mois en cumule davantage selon le courtier.`,
  avantage:`Mathématiquement, le lump sum est en moyenne plus performant ; psychologiquement, le DCA est souvent plus soutenable — le bon choix dépend de ta capacité à ne pas paniquer.`
},

{
  id:"vente-a-decouvert", categorie:"Mécanismes & stratégies", titre:"la vente à découvert", variante:"A", sousVariante:"produit",
  intro:`La vente à découvert consiste à vendre un actif que tu ne possèdes pas encore, en pariant sur sa baisse pour le racheter moins cher plus tard.`,
  objectif:`Générer un profit quand un actif baisse, à l'inverse d'un investissement classique.`,
  pourQui:`Tu es un investisseur expérimenté qui anticipe la baisse d'un actif précis et acceptes un risque de perte potentiellement illimité.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Tu empruntes des titres à un intermédiaire et tu les vends immédiatement sur le marché. Si le prix baisse comme prévu, tu les rachètes moins cher pour les rendre, et tu empoches la différence. Si le prix monte au contraire, tu dois quand même les racheter pour les rendre, à un prix plus élevé que celui auquel tu les as vendus.`,
  attention:`Contrairement à un achat classique où tu perds au maximum ta mise, une vente à découvert peut théoriquement générer une perte illimitée si l'actif ne cesse de monter.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Frais d'emprunt des titres facturés par le courtier, généralement au jour le jour, en plus des frais de courtage classiques.`,
  avantage:`La possibilité de profiter d'une baisse de marché — mais un mécanisme réservé aux investisseurs avertis, avec un risque très différent d'un achat classique.`
},

{
  id:"dividende", categorie:"Mécanismes & stratégies", titre:"le dividende", variante:"A", sousVariante:"produit",
  intro:`Un dividende est une part des bénéfices qu'une entreprise reverse directement à ses actionnaires.`,
  objectif:`Recevoir un revenu régulier en plus de la performance du cours de l'action.`,
  pourQui:`Tu cherches un revenu complémentaire régulier ou tu construis un portefeuille orienté "rendement" plutôt que pure croissance du cours.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Chaque année (ou trimestre pour certaines entreprises américaines), l'entreprise décide de reverser une partie de ses bénéfices aux actionnaires, au prorata du nombre d'actions détenues. Par exemple, une action à 100€ qui verse un dividende de 3€ offre un rendement de 3%. Le jour du versement, le cours de l'action baisse mécaniquement du montant du dividende versé.`,
  attention:`Un dividende très élevé peut être un signal d'alerte plutôt qu'une bonne nouvelle — il indique parfois que le marché anticipe une baisse ou une suppression future du dividende.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Le dividende est soumis à la flat tax : 31,4% sur un CTO ou un PEA avant 5 ans, mais seulement 30% dans une assurance-vie, qui reste épargnée par la hausse de la CSG de 2026.`,
  avantage:`Un revenu régulier généré par tes investissements, sans avoir à vendre tes titres.`
},

{
  id:"reinvestissement-dividendes", categorie:"Mécanismes & stratégies", titre:"le réinvestissement des dividendes", variante:"A", sousVariante:"produit",
  intro:`Réinvestir ses dividendes, c'est utiliser l'argent reçu pour racheter automatiquement des parts supplémentaires, plutôt que de le dépenser.`,
  objectif:`Accélérer la croissance de ton portefeuille grâce aux intérêts composés.`,
  pourQui:`Tu n'as pas besoin des dividendes comme revenu immédiat et tu veux maximiser la croissance de ton capital sur le long terme.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Chaque dividende reçu sert à racheter de nouvelles parts de l'actif, qui généreront elles-mêmes des dividendes futurs. Sur longue période, cet effet boule de neige (intérêts composés) peut représenter une part très importante de la performance totale — les dividendes représentent historiquement entre 30% et 40% du rendement total à long terme du S&P 500.`,
  sectionsOptionnelles:[
    {titre:`🔀 ETF de capitalisation ou de distribution ?`, contenu:`Un ETF "de capitalisation" (Acc) réinvestit automatiquement les dividendes en interne, sans que tu aies rien à faire. Un ETF "de distribution" (Dist) te verse les dividendes, à toi de les réinvestir manuellement si tu le souhaites.`}
  ],
  fraisTitre:`💰 Frais`,
  fraisContenu:`Un ETF de capitalisation réinvestit sans frais de courtage supplémentaires ; un réinvestissement manuel de dividendes distribués génère des frais à chaque achat.`,
  avantage:`Un ETF de capitalisation automatise cet effet boule de neige sans que tu aies à y penser ni à payer de frais supplémentaires.`
},

/* ============ CRYPTO (variante A · produit) ============ */

{
  id:"blockchain", categorie:"Crypto", titre:"la blockchain", variante:"A", sousVariante:"produit",
  intro:`Une blockchain est un registre numérique partagé, qui enregistre des transactions de façon transparente et quasiment impossible à falsifier.`,
  objectif:`Permettre des échanges de valeur sans passer par un intermédiaire central comme une banque.`,
  pourQui:`Tu veux comprendre la technologie derrière les cryptomonnaies avant d'y investir, ou l'utiliser pour des transactions décentralisées.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Les transactions sont regroupées en "blocs", validés par un réseau d'ordinateurs (les mineurs ou les validateurs) selon des règles précises, puis ajoutés à la chaîne de blocs précédents. Chaque bloc contient une empreinte du précédent, ce qui rend l'historique très difficile à modifier rétroactivement. Le registre est copié sur des milliers d'ordinateurs dans le monde, sans autorité centrale unique.`,
  sectionsOptionnelles:[
    {titre:`🔀 Preuve de travail ou preuve d'enjeu ?`, contenu:`La preuve de travail (Bitcoin) sécurise le réseau via des mineurs qui résolvent des calculs complexes, très énergivore. La preuve d'enjeu (Ethereum depuis 2022) sécurise le réseau via des validateurs qui immobilisent des cryptomonnaies en garantie, bien moins énergivore.`}
  ],
  attention:`Une blockchain publique enregistre les transactions de façon permanente et consultable par tous — la confidentialité y est très limitée.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Des frais de transaction ("gas fees" sur Ethereum) sont payés aux validateurs à chaque opération, variables selon la congestion du réseau.`,
  avantage:`Un système transparent et décentralisé, qui ne dépend d'aucune institution unique pour fonctionner.`
},

{
  id:"stablecoin", categorie:"Crypto", titre:"le stablecoin", variante:"A", sousVariante:"produit",
  intro:`Un stablecoin est une cryptomonnaie conçue pour garder une valeur stable, généralement indexée sur le dollar américain.`,
  objectif:`Profiter des avantages de la crypto (rapidité, disponibilité 24/7) sans subir sa volatilité.`,
  pourQui:`Tu veux transférer de la valeur rapidement ou rester en dehors du marché crypto temporairement, sans repasser par une monnaie traditionnelle.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Un stablecoin comme l'USDC ou l'USDT est censé être adossé à des réserves équivalentes (dollars, obligations d'État court terme) détenues par l'émetteur, qui garantit pouvoir échanger 1 stablecoin contre 1 dollar. Il se transfère comme n'importe quelle cryptomonnaie, sur une blockchain, mais sans en subir les variations de prix.`,
  sectionsOptionnelles:[
    {titre:`🔀 Adossé à des réserves ou algorithmique ?`, contenu:`Les stablecoins adossés à des réserves (USDC, USDT) détiennent des actifs réels en garantie. Les stablecoins algorithmiques tentent de maintenir leur parité par du code plutôt que des réserves — un modèle qui s'est déjà effondré plusieurs fois (ex : TerraUSD en 2022).`}
  ],
  attention:`La stabilité dépend entièrement de la confiance dans l'émetteur et de la réalité de ses réserves — un stablecoin n'est pas sans risque, contrairement à ce que son nom suggère.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Frais de transaction blockchain (gas fees) à chaque transfert, plus d'éventuels frais de conversion selon la plateforme utilisée.`,
  avantage:`Un moyen de rester "liquide" dans l'écosystème crypto sans être exposé à sa volatilité, utile pour trader ou transférer rapidement.`
},

{
  id:"cold-hot-wallet", categorie:"Crypto", titre:"le cold wallet / hot wallet", variante:"A", sousVariante:"produit",
  intro:`Un wallet crypto est l'outil qui stocke les clés permettant d'accéder à tes cryptomonnaies — "cold" quand il est hors ligne, "hot" quand il est connecté à internet.`,
  objectif:`Sécuriser (cold) ou faciliter l'accès rapide (hot) à tes cryptomonnaies selon ton usage.`,
  pourQui:`Tu détiens des cryptomonnaies et tu dois choisir entre praticité au quotidien et sécurité maximale sur le long terme.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Un hot wallet (application mobile, extension navigateur) reste connecté à internet, ce qui le rend pratique pour des transactions fréquentes mais plus exposé au piratage. Un cold wallet (clé USB dédiée, papier) stocke tes clés privées hors ligne, inaccessible à distance, ce qui le rend beaucoup plus sûr pour un stockage long terme mais moins pratique pour des opérations rapides.`,
  attention:`"Not your keys, not your coins" : tant que tes cryptos restent sur une plateforme d'échange, tu ne détiens pas réellement tes clés privées, et donc pas réellement tes cryptos.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Un cold wallet matériel coûte entre 50€ et 200€ à l'achat ; un hot wallet logiciel est généralement gratuit.`,
  avantage:`Le cold wallet t'offre une sécurité proche du "coffre-fort" pour un stockage long terme ; le hot wallet t'offre la flexibilité pour un usage actif.`
},

/* ============ IMMOBILIER (variante A · produit) ============ */

{
  id:"rendement-locatif", categorie:"Immobilier", titre:"le rendement locatif", variante:"A", sousVariante:"produit",
  intro:`Le rendement locatif mesure ce que rapporte un bien immobilier chaque année en loyers, par rapport à son prix d'achat.`,
  objectif:`Évaluer si un investissement immobilier locatif est intéressant financièrement avant de l'acheter.`,
  pourQui:`Tu envisages d'acheter un bien pour le mettre en location et tu veux comparer sa rentabilité à d'autres placements.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Le rendement brut se calcule ainsi : (loyers annuels ÷ prix d'achat) × 100. Par exemple, un bien acheté 200 000€ qui génère 10 000€ de loyers par an affiche un rendement brut de 5%. Le rendement net, plus réaliste, déduit charges, taxe foncière, frais de gestion et vacance locative — il tourne souvent 1 à 2 points en dessous du rendement brut.`,
  sectionsOptionnelles:[
    {titre:`🔀 Rendement brut ou net ?`, contenu:`Le rendement brut ignore toutes les charges, il sert surtout à comparer rapidement des biens entre eux. Le rendement net (voire net-net après impôt) reflète ce qu'il te reste réellement en poche.`}
  ],
  attention:`Un rendement affiché élevé cache parfois un bien dans une zone à faible demande locative ou à fort risque de vacance — le rendement ne dit rien du risque associé.`,
  fraisTitre:`💰 Fiscalité`,
  fraisContenu:`Les loyers perçus sont imposés au barème de l'impôt sur le revenu (régime micro-foncier ou réel), plus les prélèvements sociaux de 17,2%.`,
  avantage:`Un indicateur simple pour comparer rapidement plusieurs biens ou plusieurs classes d'actifs entre eux.`
},

{
  id:"effet-levier-immo", categorie:"Immobilier", titre:"l'effet de levier immobilier", variante:"A", sousVariante:"produit",
  intro:`L'effet de levier immobilier consiste à utiliser le crédit bancaire pour acheter un bien plus grand que ce que ton épargne seule permettrait.`,
  objectif:`Démultiplier ta capacité d'investissement en utilisant l'argent de la banque plutôt que uniquement le tien.`,
  pourQui:`Tu veux investir dans l'immobilier locatif sans mobiliser l'intégralité du prix d'achat en fonds propres.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Tu empruntes une partie ou la totalité du prix d'achat, et ce sont les loyers perçus qui remboursent tout ou partie du crédit. Par exemple, avec 20 000€ d'apport, tu peux emprunter 180 000€ et acheter un bien à 200 000€ : ton effet de levier est de 10. Si le bien prend de la valeur ou génère un rendement, le gain se calcule sur les 200 000€, alors que tu n'en as sorti que 20 000€ de ta poche.`,
  attention:`Le levier amplifie aussi les pertes : si le bien perd de la valeur ou reste vacant, tu continues de rembourser le crédit intégralement, indépendamment de la performance réelle du bien.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Intérêts d'emprunt (variables selon les taux du marché), frais de dossier bancaire, et assurance emprunteur obligatoire.`,
  avantage:`C'est le seul placement grand public où une banque accepte de te prêter l'essentiel du capital pour investir — un effet de levier rarement accessible ailleurs à ces conditions.`
},

{
  id:"lmnp", categorie:"Immobilier", titre:"le LMNP", variante:"A", sousVariante:"produit",
  intro:`Le LMNP est un statut fiscal qui permet de louer un bien meublé tout en réduisant fortement l'impôt sur les loyers perçus.`,
  objectif:`Optimiser la fiscalité d'un investissement locatif meublé grâce à l'amortissement comptable du bien.`,
  pourQui:`Tu loues (ou envisages de louer) un bien meublé classique et tu restes sous le seuil du régime micro-BIC (83 600€ de loyers par an pour 2026, seuil réactualisé périodiquement — attention, il est bien plus bas, 15 000€, pour les meublés de tourisme non classés type Airbnb).`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Sous le régime réel du LMNP, tu peux déduire de tes loyers imposables non seulement tes charges, mais aussi l'amortissement du bien et du mobilier — une dépréciation comptable qui ne correspond à aucune sortie d'argent réelle. Concrètement, cela permet souvent de ramener l'impôt sur les loyers perçus proche de zéro pendant de nombreuses années.`,
  sectionsOptionnelles:[
    {titre:`🔀 Régime micro-BIC ou réel ?`, contenu:`Le micro-BIC applique un abattement forfaitaire de 50% sur les loyers, simple mais souvent moins avantageux. Le régime réel, plus complexe (comptabilité obligatoire), permet de déduire l'amortissement et va généralement plus loin fiscalement.`}
  ],
  attention:`Depuis la loi de finances 2025, pour toute vente à partir du 15 février 2025, l'amortissement immobilier déduit doit être réintégré dans le calcul de la plus-value (y compris les amortissements pratiqués avant 2025), ce qui réduit l'intérêt du LMNP sur le très long terme. L'amortissement du mobilier n'est pas concerné, et les résidences services (étudiantes, seniors, EHPAD) restent exonérées.`,
  fraisTitre:`💰 Fiscalité`,
  fraisContenu:`Loyers imposés dans la catégorie des BIC (bénéfices industriels et commerciaux), avec la possibilité de neutraliser l'impôt grâce à l'amortissement en régime réel.`,
  avantage:`Un des rares moyens légaux de percevoir des loyers quasiment sans impôt pendant plusieurs années, grâce à l'amortissement.`
},

/* ============ INDICATEURS & NOTIONS (variante B) ============ */

{
  id:"drawdown", categorie:"Indicateurs & notions", titre:"le Drawdown", variante:"B",
  intro:`Le drawdown, c'est la baisse maximale subie par un investissement depuis son plus haut, avant de retrouver ce niveau.`,
  definitionContenu:`Si ton portefeuille passe de 10 000€ à 7 000€ avant de remonter, ton drawdown a été de -30%, même si tu as fini l'année en gain.`,
  calculTitre:`🧮 Comment ça se calcule ?`,
  calculContenu:`(Valeur la plus basse − Valeur la plus haute précédente) ÷ Valeur la plus haute précédente. C'est un calcul de creux par rapport à un sommet, pas par rapport à ton prix d'achat.`,
  pourquoiImportant:`Un rendement moyen élevé ne dit rien sur ce que tu aurais vécu émotionnellement en cours de route. Le drawdown, lui, te dit si tu aurais tenu psychologiquement.`,
  erreurFrequente:`Beaucoup regardent la performance annualisée et ignorent le drawdown — c'est pourtant lui qui pousse les gens à vendre au pire moment.`,
  aRetenir:`Avant d'investir dans un actif, regarde son pire drawdown historique. Si l'idée de le vivre te terrifie, réduis la taille de la position.`
},

{
  id:"volatilite", categorie:"Indicateurs & notions", titre:"la Volatilité", variante:"B",
  intro:`La volatilité mesure l'intensité des variations de prix d'un actif, à la hausse comme à la baisse.`,
  definitionContenu:`Une action dont le cours varie de +/-1% par jour en moyenne est peu volatile. Une cryptomonnaie qui varie de +/-5% par jour est très volatile — même si les deux peuvent avoir la même performance sur un an.`,
  calculTitre:`🧮 Comment ça se calcule ?`,
  calculContenu:`La volatilité se mesure statistiquement par l'écart-type des rendements sur une période donnée, souvent annualisé. Concrètement, une volatilité annualisée de 15% signifie que, dans des conditions "normales", le rendement annuel de l'actif s'écarte en moyenne de 15 points autour de sa moyenne, dans un sens ou dans l'autre.`,
  nuance:{titre:`🔀 Volatilité et risque, pas synonymes`, contenu:`Une forte volatilité n'est pas automatiquement une mauvaise nouvelle : elle mesure l'ampleur des mouvements, pas leur direction. Un actif très volatile qui monte fortement reste volatile, même s'il enrichit ceux qui le détiennent.`},
  pourquoiImportant:`La volatilité t'aide à calibrer la taille d'une position par rapport à ta tolérance au risque, et à anticiper l'ampleur des variations que tu devras encaisser psychologiquement.`,
  erreurFrequente:`On confond souvent volatilité et risque de perte définitive — un ETF monde très diversifié peut être volatile à court terme sans jamais avoir affiché de perte permanente sur le long terme.`,
  aRetenir:`Plus un actif est volatile, plus il faut réduire la taille de ta position ou allonger ton horizon d'investissement pour absorber ses fluctuations.`
},

{
  id:"ratio-sharpe", categorie:"Indicateurs & notions", titre:"le Ratio de Sharpe", variante:"B",
  intro:`Le ratio de Sharpe mesure la performance d'un placement en tenant compte du risque pris pour l'obtenir.`,
  definitionContenu:`Deux placements peuvent afficher le même rendement de 8% par an, mais l'un avec deux fois moins de volatilité que l'autre. Le ratio de Sharpe permet de dire lequel a été "mieux géré" une fois le risque pris en compte.`,
  calculTitre:`🧮 Comment ça se calcule ?`,
  calculContenu:`Ratio de Sharpe = (Rendement de l'actif − Taux sans risque) ÷ Volatilité de l'actif. Par exemple, un portefeuille qui rapporte 8% par an, avec un taux sans risque à 3% et une volatilité de 10%, a un ratio de Sharpe de (8−3)/10 = 0,5. Plus le ratio est élevé, meilleur est le couple rendement/risque.`,
  pourquoiImportant:`Il évite de se laisser impressionner par un rendement brut élevé sans se demander quel niveau de risque a été pris pour l'obtenir — deux stratégies au même rendement ne se valent pas si l'une est deux fois plus risquée.`,
  erreurFrequente:`Un ratio de Sharpe se compare sur la même période et la même classe d'actifs — comparer le Sharpe d'un fonds obligataire à celui d'un ETF actions n'a pas vraiment de sens.`,
  aRetenir:`Avant de comparer deux performances, demande-toi toujours quel risque a été pris pour les atteindre — c'est exactement ce que fait le ratio de Sharpe.`
},

{
  id:"ter", categorie:"Indicateurs & notions", titre:"le TER (frais de gestion)", variante:"B",
  intro:`Le TER (Total Expense Ratio) est le pourcentage annuel prélevé automatiquement sur un fonds ou un ETF pour couvrir ses frais de gestion.`,
  definitionContenu:`Un ETF avec un TER de 0,20% prélève 2€ par an pour 1 000€ investis, directement sur la valeur du fonds, sans que tu aies à payer quoi que ce soit toi-même.`,
  calculTitre:`🧮 Comment ça se calcule ?`,
  calculContenu:`Le TER est prélevé quotidiennement, au prorata, directement dans la valeur liquidative du fonds — c'est pour cela qu'il est invisible sur ton relevé de compte, mais il pèse chaque jour sur ta performance. Sur 20 ans, la différence entre un TER de 0,20% et un TER de 2% peut représenter plusieurs dizaines de milliers d'euros sur un capital conséquent, à cause des intérêts composés.`,
  pourquoiImportant:`Sur le long terme, les frais sont souvent le facteur le plus prévisible et le plus contrôlable de ta performance — contrairement au marché, tu choisis exactement combien de frais tu payes.`,
  erreurFrequente:`Un TER bas ne garantit pas à lui seul un bon produit — il faut aussi vérifier que l'indice suivi et la méthode de réplication correspondent à ce que tu recherches.`,
  aRetenir:`À stratégie équivalente, privilégie toujours le produit au TER le plus faible : c'est l'un des rares leviers de performance que tu maîtrises entièrement.`
},

{
  id:"capitalisation-boursiere", categorie:"Indicateurs & notions", titre:"la Capitalisation boursière", variante:"B",
  intro:`La capitalisation boursière représente la valeur totale d'une entreprise cotée en bourse, telle que le marché l'évalue à un instant donné.`,
  definitionContenu:`Une entreprise dont l'action vaut 50€ et qui a émis 2 milliards d'actions a une capitalisation boursière de 100 milliards d'euros — c'est le prix qu'il faudrait payer pour racheter 100% de l'entreprise à son cours actuel.`,
  calculTitre:`🧮 Comment ça se calcule ?`,
  calculContenu:`Capitalisation boursière = Prix de l'action × Nombre total d'actions en circulation. Elle évolue en temps réel, à chaque variation du cours de l'action.`,
  nuance:{titre:`🔀 Small, mid et large cap`, contenu:`Les entreprises sont classées par taille : small cap (petites capitalisations, souvent plus volatiles et moins liquides), mid cap (moyennes), et large cap (grandes, plus stables et plus suivies par les analystes).`},
  pourquoiImportant:`Elle te permet de situer la taille et la maturité d'une entreprise, et d'anticiper son profil de risque : les grandes capitalisations sont en général moins volatiles que les petites.`,
  erreurFrequente:`On confond parfois capitalisation boursière et taille réelle de l'entreprise (chiffre d'affaires, effectifs) — une entreprise peut avoir une capitalisation très élevée avec un chiffre d'affaires modeste, si le marché anticipe une forte croissance future.`,
  aRetenir:`La capitalisation boursière, c'est le prix que le marché est prêt à payer aujourd'hui pour l'entreprise entière — pas une mesure directe de sa taille opérationnelle.`
},

{
  id:"indice-boursier", categorie:"Indicateurs & notions", titre:"un indice boursier", variante:"B",
  intro:`Un indice boursier mesure la performance moyenne d'un panier d'entreprises représentatif d'un marché ou d'un secteur.`,
  definitionContenu:`Le CAC 40 regroupe les 40 plus grandes entreprises cotées à Paris ; le S&P 500 regroupe environ 500 grandes entreprises américaines. Quand on dit "la bourse a monté de 1%", on parle en réalité de la variation d'un de ces indices.`,
  calculTitre:`🧮 Comment ça se calcule ?`,
  calculContenu:`La plupart des grands indices sont pondérés par capitalisation boursière : plus une entreprise est grande, plus elle pèse dans l'indice. Une variation de 5% chez la plus grosse entreprise de l'indice aura donc bien plus d'impact sur sa valeur qu'une variation de 5% chez la plus petite.`,
  pourquoiImportant:`Un indice te sert de référence pour juger si ta propre performance est bonne ou non — battre "le marché" signifie concrètement faire mieux que l'indice sur la même période.`,
  erreurFrequente:`On croit parfois qu'un indice est composé à parts égales de toutes ses entreprises — en réalité, dans un indice pondéré par capitalisation, quelques géants peuvent représenter une part disproportionnée de la performance totale.`,
  aRetenir:`Avant de juger ta performance, compare-la toujours à un indice pertinent pour ta stratégie — sans référence, un rendement de 8% ne veut rien dire en soi.`
},

{
  id:"rendement-vs-performance", categorie:"Indicateurs & notions", titre:"Rendement vs performance", variante:"B",
  intro:`Le rendement et la performance sont souvent confondus, mais ils ne mesurent pas la même chose : l'un capture un revenu régulier, l'autre l'évolution totale de la valeur.`,
  definitionContenu:`Une action à 100€ qui verse 3€ de dividende a un rendement de 3%. Si en plus son cours passe à 108€ dans l'année, sa performance totale est de 3% (dividende) + 8% (plus-value) = 11%.`,
  calculTitre:`🧮 Comment ça se calcule ?`,
  calculContenu:`Rendement = Revenu généré (dividende, loyer, coupon) ÷ Prix de l'actif. Performance totale = (Valeur finale − Valeur initiale + Revenus perçus) ÷ Valeur initiale. La performance inclut donc toujours le rendement, mais l'inverse n'est pas vrai.`,
  pourquoiImportant:`Comparer deux placements uniquement sur leur rendement peut être trompeur si l'un a une plus-value en capital importante et l'autre non — c'est la performance totale qui reflète le gain réel.`,
  erreurFrequente:`Beaucoup jugent un placement uniquement sur son rendement affiché (ex : "cette SCPI rapporte 5%") sans tenir compte de l'évolution de la valeur du capital, qui peut monter ou baisser en parallèle.`,
  aRetenir:`Pour comparer deux placements équitablement, regarde toujours la performance totale, pas seulement le rendement affiché.`
},

{
  id:"inflation", categorie:"Indicateurs & notions", titre:"l'Inflation", variante:"B",
  intro:`L'inflation, c'est la hausse générale des prix dans le temps, qui réduit le pouvoir d'achat de ton argent.`,
  definitionContenu:`Avec une inflation de 2% par an, un panier de courses à 100€ aujourd'hui coûtera environ 102€ dans un an, pour le même contenu.`,
  calculTitre:`🧮 Comment ça se calcule ?`,
  calculContenu:`L'inflation se mesure via un indice des prix (comme l'IPC en France), qui suit l'évolution du prix d'un panier de biens et services représentatif sur une période donnée, généralement exprimée en variation annuelle en pourcentage.`,
  nuance:{titre:`🔀 Rendement nominal ou réel ?`, contenu:`Le rendement nominal est celui affiché brut par ton placement. Le rendement réel, lui, retire l'inflation : un livret qui rapporte 3% avec une inflation à 2% ne t'enrichit réellement que de 1% en pouvoir d'achat.`},
  pourquoiImportant:`Laisser ton argent dormir sans qu'il rapporte au moins autant que l'inflation revient à perdre du pouvoir d'achat chaque année, même si le montant sur ton compte ne baisse pas.`,
  aRetenir:`Ce n'est pas le rendement affiché qui compte, mais le rendement une fois l'inflation déduite — c'est lui qui détermine si tu t'enrichis vraiment ou non.`
},

{
  id:"taux-interet", categorie:"Indicateurs & notions", titre:"le Taux d'intérêt", variante:"B",
  intro:`Le taux d'intérêt est le prix de l'argent : ce que coûte un emprunt, ou ce que rapporte un placement sans risque.`,
  definitionContenu:`Un taux d'intérêt de 4% sur un prêt de 10 000€ signifie que tu rembourseras 400€ d'intérêts sur une année, en plus du capital emprunté.`,
  calculTitre:`🧮 Comment ça se détermine ?`,
  calculContenu:`Les taux directeurs sont fixés par les banques centrales (BCE en zone euro, Fed aux États-Unis) et influencent en cascade tous les autres taux : crédits immobiliers, rendement des obligations, taux des livrets réglementés.`,
  nuance:{titre:`🔀 Taux fixe ou variable ?`, contenu:`Un taux fixe reste identique sur toute la durée du prêt ou du placement. Un taux variable évolue en fonction des taux de marché, ce qui peut jouer en ta faveur ou en ta défaveur selon l'évolution future.`},
  pourquoiImportant:`Les variations de taux d'intérêt influencent directement la valorisation des actions et des obligations : quand les taux montent, les valorisations boursières et le prix des obligations existantes ont tendance à baisser.`,
  aRetenir:`Suis l'évolution des taux directeurs, même sans investir en obligations : ils influencent indirectement presque toutes les autres classes d'actifs.`
},

{
  id:"taux-sans-risque", categorie:"Indicateurs & notions", titre:"le Taux sans risque", variante:"B",
  intro:`Le taux sans risque est le rendement qu'on peut obtenir sans (quasiment) aucun risque de perte, généralement via une obligation d'État solide.`,
  definitionContenu:`En zone euro, le taux sans risque de référence est souvent celui des obligations d'État allemandes (Bund) ou françaises (OAT) à court terme.`,
  calculTitre:`🧮 Comment ça se détermine ?`,
  calculContenu:`Ce n'est pas un calcul mais une référence de marché : le taux offert par un emprunteur considéré comme quasiment incapable de faire défaut, sur une durée donnée. Il sert de base de comparaison à tous les autres placements.`,
  pourquoiImportant:`Tout investissement plus risqué (actions, immobilier, obligations d'entreprise) doit en théorie offrir un rendement supérieur au taux sans risque, sinon le risque supplémentaire pris n'est pas rémunéré.`,
  erreurFrequente:`On oublie parfois que "sans risque" ne veut pas dire "sans risque du tout" — même une obligation d'État peut perdre de la valeur avant échéance si les taux montent, ou faire défaut dans des cas extrêmes.`,
  aRetenir:`Avant d'accepter un risque supplémentaire sur un placement, vérifie qu'il t'offre bien un rendement significativement supérieur au taux sans risque du moment.`
},

/* ============ FISCALITÉ FRANÇAISE (variante B) ============ */

{
  id:"flat-tax", categorie:"Fiscalité française", titre:"la Flat tax", variante:"B",
  intro:`La flat tax, ou prélèvement forfaitaire unique (PFU), est le taux d'imposition unique appliqué par défaut sur la plupart des revenus du capital en France.`,
  definitionContenu:`Une plus-value de 1 000€ réalisée sur un CTO est taxée à 31,4%, soit 314€ d'impôt, quel que soit ton niveau de revenu par ailleurs.`,
  calculTitre:`🧮 Comment ça s'applique ?`,
  calculContenu:`Depuis le 1er janvier 2026, la flat tax standard est passée de 30% à 31,4% : elle se décompose en 12,8% d'impôt sur le revenu (inchangé) et 18,6% de prélèvements sociaux, contre 17,2% auparavant, suite à la hausse de la CSG sur les revenus du capital.`,
  nuance:{titre:`🔀 Toutes les enveloppes ne sont pas concernées`, contenu:`La hausse à 31,4% touche le CTO, les dividendes, les plus-values mobilières, la crypto, le PEA (avant 5 ans) et le PER. L'assurance-vie, les PEL/CEL/PEP et les revenus immobiliers ont été explicitement épargnés par la hausse de la CSG et restent à 30% (17,2% de prélèvements sociaux).`},
  pourquoiImportant:`Elle simplifie la fiscalité par rapport à l'ancien système, mais elle s'applique par défaut : si tu es faiblement imposé, il peut être plus avantageux d'opter pour le barème progressif de l'impôt sur le revenu à la place (si ta tranche marginale est inférieure à 12,8%, cette option s'applique alors à tous tes revenus du capital de l'année).`,
  erreurFrequente:`On pense parfois que la flat tax s'applique automatiquement au même taux dans toutes les enveloppes — en réalité, depuis 2026, le taux diffère déjà entre un CTO (31,4%) et une assurance-vie (30%), sans même parler des règles spécifiques du PEA après 5 ans.`,
  aRetenir:`Vérifie chaque année si le barème progressif ne serait pas plus avantageux que la flat tax selon ton niveau de revenu, et n'oublie pas que le taux exact dépend désormais aussi de l'enveloppe utilisée depuis la réforme de 2026.`
},

{
  id:"abattement-pea", categorie:"Fiscalité française", titre:"l'Abattement PEA après 5 ans", variante:"B",
  intro:`L'abattement du PEA n'est pas un pourcentage réduit sur l'impôt, mais une exonération totale d'impôt sur le revenu sur les gains, dès lors que le PEA a plus de 5 ans.`,
  definitionContenu:`Sur un PEA ouvert depuis plus de 5 ans, un gain de 10 000€ n'est taxé qu'à 18,6% de prélèvements sociaux (1 860€), contre 31,4% de flat tax (3 140€) s'il avait moins de 5 ans — une économie de 1 280€ sur cet exemple.`,
  calculTitre:`🧮 Comment ça se calcule ?`,
  calculContenu:`La durée de 5 ans se compte à partir de la date d'ouverture du PEA, pas à partir de chaque versement individuel — un versement fait à la 4e année profite déjà de l'avantage dès que le PEA lui-même dépasse 5 ans.`,
  pourquoiImportant:`Cet avantage rend le PEA particulièrement puissant pour un horizon d'investissement long : plus tu le gardes ouvert après 5 ans, plus chaque euro de gain supplémentaire profite de cette fiscalité allégée.`,
  erreurFrequente:`Beaucoup pensent qu'un retrait avant 5 ans fait perdre tous les avantages du PEA de façon définitive — en réalité, cela clôture simplement le PEA (avec quelques exceptions), ce qui n'empêche pas d'en ouvrir un autre plus tard, mais sans conserver l'ancienneté acquise.`,
  aRetenir:`Ouvre un PEA le plus tôt possible, même avec un petit montant, pour faire courir le compteur des 5 ans au plus vite.`
},

{
  id:"prelevements-sociaux", categorie:"Fiscalité française", titre:"les Prélèvements sociaux", variante:"B",
  intro:`Les prélèvements sociaux s'appliquent presque systématiquement sur les revenus du capital en France, en plus de l'impôt sur le revenu éventuel — leur taux est de 18,6% depuis 2026 pour la plupart des placements financiers.`,
  definitionContenu:`Un gain de 5 000€ sur un CTO ou un PEA de moins de 5 ans est taxé à 18,6% de prélèvements sociaux, soit 930€ — contre 17,2% (860€) si ce même gain provient d'une assurance-vie, qui a gardé l'ancien taux.`,
  calculTitre:`🧮 Comment ça s'applique ?`,
  calculContenu:`Les prélèvements sociaux se décomposent en plusieurs contributions (CSG, CRDS, prélèvement de solidarité), prélevées automatiquement à la source par l'établissement financier au moment du versement des gains.`,
  nuance:{titre:`🔀 18,6% ou 17,2% selon l'enveloppe`, contenu:`Depuis la hausse de la CSG au 1er janvier 2026, le taux général est passé de 17,2% à 18,6% pour la plupart des revenus financiers (CTO, PEA, PER, crypto). L'assurance-vie, les PEL/CEL/PEP et les revenus immobiliers (loyers, plus-values immobilières) ont été explicitement exclus de cette hausse et restent à 17,2%.`},
  pourquoiImportant:`Contrairement à l'impôt sur le revenu, les prélèvements sociaux s'appliquent presque toujours, même dans les enveloppes les plus avantageuses fiscalement comme le PEA après 5 ans — c'est rarement ce taux qu'on peut réduire.`,
  erreurFrequente:`On présente parfois une enveloppe comme "totalement exonérée d'impôt" en oubliant les prélèvements sociaux, qui restent dus dans la quasi-totalité des cas — le Livret A fait figure d'exception.`,
  aRetenir:`Quand tu calcules ton gain net réel, n'oublie jamais les prélèvements sociaux — et vérifie bien lequel des deux taux s'applique à ton enveloppe depuis la réforme de 2026.`
},

{
  id:"plus-value-imposable", categorie:"Fiscalité française", titre:"la Plus-value imposable", variante:"B",
  intro:`La plus-value imposable est le gain réellement soumis à l'impôt lorsque tu revends un actif plus cher que tu ne l'as acheté.`,
  definitionContenu:`Si tu as acheté une action 1 000€ et que tu la revends 1 300€, ta plus-value imposable est de 300€ — c'est uniquement ce gain qui est taxé, pas le montant total de la vente.`,
  calculTitre:`🧮 Comment ça se calcule ?`,
  calculContenu:`Plus-value imposable = Prix de vente − Prix d'achat (frais d'acquisition inclus). En cas de ventes multiples d'un même titre acheté à des prix différents, c'est le prix moyen pondéré d'acquisition (PMP) qui sert de référence, pas le prix du dernier achat.`,
  pourquoiImportant:`Comprendre ce qui est réellement imposé évite de mal anticiper le montant net que tu récupères après une vente — beaucoup surestiment l'impôt en pensant qu'il porte sur le capital total retiré.`,
  erreurFrequente:`Beaucoup pensent être imposés sur la totalité de la somme retirée lors d'une vente, alors que seule la part correspondant au gain (la plus-value) est taxée, le capital initialement investi ne l'étant jamais une seconde fois.`,
  aRetenir:`Avant de t'inquiéter du montant d'impôt à payer sur une vente, calcule ta plus-value réelle (vente − achat) : c'est elle, et seulement elle, qui sera taxée.`
},

{
  id:"plus-value-immobiliere", categorie:"Fiscalité française", titre:"la Plus-value immobilière", variante:"B",
  intro:`La plus-value immobilière est le gain réalisé lors de la revente d'un bien immobilier, qui bénéficie d'un régime fiscal spécifique basé sur la durée de détention.`,
  definitionContenu:`Un bien acheté 200 000€ et revendu 280 000€ dix ans plus tard dégage une plus-value brute de 80 000€, avant application des abattements liés à la durée de détention.`,
  calculTitre:`🧮 Comment ça se calcule ?`,
  calculContenu:`Le taux de base est de 19% d'impôt sur le revenu + 17,2% de prélèvements sociaux, soit 36,2% sur la plus-value brute. Mais des abattements progressifs s'appliquent chaque année de détention au-delà de la 5e année : exonération totale d'impôt sur le revenu après 22 ans, et des prélèvements sociaux après 30 ans.`,
  nuance:{titre:`🔀 Résidence principale`, contenu:`La résidence principale bénéficie d'une exonération totale de plus-value immobilière, quelle que soit la durée de détention, contrairement à un investissement locatif ou une résidence secondaire.`},
  pourquoiImportant:`La durée de détention change radicalement la fiscalité d'une revente immobilière — revendre un an trop tôt ou trop tard peut représenter plusieurs milliers d'euros de différence.`,
  erreurFrequente:`On oublie souvent que les abattements pour durée de détention ne suivent pas le même rythme pour l'impôt sur le revenu (exonéré après 22 ans) que pour les prélèvements sociaux (exonérés après 30 ans) — les deux se calculent séparément.`,
  aRetenir:`Avant de revendre un bien qui n'est pas ta résidence principale, vérifie où tu te situes dans le calendrier des abattements : quelques mois d'écart peuvent significativement changer la fiscalité.`
},

{
  id:"halving", categorie:"Crypto", titre:"le Halving", variante:"B",
  intro:`Le halving est un événement programmé du Bitcoin qui divise par deux la récompense versée aux mineurs, environ tous les 4 ans.`,
  definitionContenu:`En 2020, la récompense par bloc miné est passée de 12,5 à 6,25 bitcoins ; en 2024, elle est passée à 3,125 bitcoins. Le prochain halving est attendu vers 2028, avec une récompense de 1,5625 bitcoin.`,
  calculTitre:`🧮 Comment ça se déclenche ?`,
  calculContenu:`Le halving se déclenche automatiquement tous les 210 000 blocs minés, ce qui correspond à environ 4 ans, selon un protocole fixé dès la création du Bitcoin en 2009 et inscrit dans son code — aucune autorité ne peut le modifier ou le retarder.`,
  nuance:{titre:`🔀 Pourquoi ce mécanisme existe`, contenu:`Le halving garantit que le nombre total de bitcoins créés reste plafonné à 21 millions, ce qui rend le Bitcoin structurellement désinflationniste par construction, contrairement à une monnaie classique.`},
  pourquoiImportant:`En réduisant le rythme de création de nouveaux bitcoins, le halving diminue la pression vendeuse mécanique des mineurs sur le marché — un facteur souvent cité pour expliquer les cycles de prix historiques du Bitcoin, sans que la causalité soit prouvée avec certitude.`,
  erreurFrequente:`Beaucoup traitent le halving comme un signal d'achat garanti parce qu'il a précédé des hausses de prix par le passé — les performances passées après un halving ne garantissent en rien une répétition du même schéma.`,
  aRetenir:`Le halving est un événement mécanique et prévisible du protocole Bitcoin, mais son impact sur le prix reste une corrélation observée historiquement, pas une loi financière garantie.`
}

];
