// Bibliothèque de termes du lexique financier — reprise telle quelle de la session
// d'origine (fiches pré-rédigées à la main, vérifiées avec sources). Deux variantes :
// A (enveloppe/produit) = Objectif / Pour qui / Mécanisme / Frais-Fiscalité / Avantage
// B (notion/fiscalité) = Définition / Calcul / Pourquoi important / À retenir

export const CATEGORY_ORDER = ["Enveloppes fiscales","Produits & marchés","Mécanismes & stratégies","Crypto","Immobilier","Indicateurs & notions","Fiscalité française"];

export const TERMES = [

/* ============ ENVELOPPES FISCALES (variante A · enveloppe) ============ */

{
  id:"pea", categorie:"Enveloppes fiscales", titre:"le PEA", variante:"A", sousVariante:"enveloppe",
  intro:`Tu peux acheter un ETF mondial dans un PEA et garder un avantage fiscal après cinq ans. Encore faut-il choisir un fonds éligible et comprendre les règles de retrait.`,
  objectif:`Investir en bourse sur des actions européennes tout en profitant d'une fiscalité allégée après 5 ans.`,
  pourQui:`Tu veux investir sur des actions ou ETF européens (ou mondiaux via des ETF synthétiques) sur le long terme, sans avoir besoin de retirer ton argent avant plusieurs années.`,
  mecanismeTitre:`💼 Qu'est-ce qu'on met dedans ?`,
  mecanismeContenu:`✅ Actions de sociétés européennes\n✅ ETF actions européennes, et ETF monde via la réplication synthétique\n❌ Actions américaines ou asiatiques en direct\n❌ Obligations, SCPI, crypto\n✅ Plafond de versement : 150 000€ (PEA classique)`,
  sectionsOptionnelles:[
    {titre:`🔀 PEA classique ou PEA-PME ?`, contenu:`Le PEA-PME est une version dédiée aux petites et moyennes entreprises. Son plafond de 225 000€ est partagé avec le PEA classique : le total des versements cumulés sur les deux ne peut pas dépasser 225 000€, dont 150 000€ maximum sur le PEA classique.`}
  ],
  attention:`Un retrait avant 5 ans clôture en principe le PEA (sauf exceptions, notamment la création ou la reprise d'entreprise) ; les gains retirés sont alors imposés. Après 5 ans, un retrait partiel ne clôture plus le plan.`,
  fraisTitre:`💰 Fiscalité`,
  fraisContenu:`Avant 5 ans, les gains sont taxés à la flat tax de 31,4%. Après 5 ans, ils ne sont plus soumis qu'aux prélèvements sociaux (18,6% depuis la hausse de la CSG au 1er janvier 2026), sans impôt sur le revenu.`,
  avantage:`Le compteur des cinq ans part de l’ouverture du plan. Un petit premier versement peut donc lancer l’ancienneté sans t’obliger à investir tout de suite une grosse somme.`
},

{
  id:"cto", categorie:"Enveloppes fiscales", titre:"le CTO", variante:"A", sousVariante:"enveloppe",
  intro:`Actions américaines, ETF sectoriels, obligations : le CTO te laisse accéder à des placements très variés, avec leur fiscalité propre.`,
  objectif:`Accéder à un large choix de titres selon ton courtier, sans plafond de versement.`,
  pourQui:`Tu veux acheter des actions étrangères en direct, des obligations ou des ETF absents de ton PEA, et tu acceptes la fiscalité du compte-titres.`,
  mecanismeTitre:`💼 Qu'est-ce qu'on met dedans ?`,
  mecanismeContenu:`✅ Actions étrangères, ETF et obligations selon le courtier\n✅ Certains produits cotés liés aux cryptos, sans détenir directement les cryptos\n✅ Aucun plafond de versement`,
  fraisTitre:`💰 Fiscalité`,
  fraisContenu:`En règle générale, le PFU de 31,4% s'applique aux plus-values réalisées lors d'une vente et aux dividendes encaissés (option globale possible pour le barème). Une hausse de cours sans vente ne déclenche pas d'impôt sur la plus-value.`,
  attention:`Attention aux frais de courtage et de tenue de compte, ils varient énormément selon le courtier`,
  avantage:`Tu y accèdes à davantage de marchés. Avant d’acheter un ETF déjà présent dans ton PEA, compare aussi la fiscalité de l’enveloppe.`
},

{
  id:"assurance-vie", categorie:"Enveloppes fiscales", titre:"l'assurance-vie", variante:"A", sousVariante:"enveloppe",
  intro:`Fonds en euros ou unités de compte ? Dans une assurance-vie, ces deux supports ne portent pas les mêmes risques et ne rapportent pas de la même façon.`,
  objectif:`Épargner et investir sur le long terme, en vue de la retraite ou pour transmettre un capital, avec une fiscalité qui s'améliore après 8 ans.`,
  pourQui:`Tu veux répartir une partie de ton épargne entre fonds en euros et unités de compte, ou organiser sa transmission, en comparant d'abord les frais des contrats.`,
  mecanismeTitre:`💼 Qu'est-ce qu'on met dedans ?`,
  mecanismeContenu:`✅ Fonds euros (capital garanti, rendement modéré)\n✅ Unités de compte : ETF, actions, SCPI, fonds diversifiés\n✅ Pas de plafond de versement\n❌ Actions en direct limitées selon les contrats`,
  sectionsOptionnelles:[
    {titre:`🔀 Fonds euros ou unités de compte ?`, contenu:`Le fonds en euros comporte une garantie définie par le contrat, parfois calculée hors frais de gestion. Son taux change d'une année à l'autre. Les unités de compte présentent un risque de perte en capital, en contrepartie d'une espérance de rendement potentiellement plus élevée.`}
  ],
  attention:`Les frais sur versement et de gestion varient énormément d'un contrat à l'autre — un contrat en ligne coûte souvent bien moins cher qu'un contrat bancaire traditionnel.`,
  fraisTitre:`💰 Fiscalité`,
  fraisContenu:`Seule la part de gains comprise dans un rachat est imposable. Pour les primes versées depuis le 27 septembre 2017, le taux forfaitaire d'impôt sur le revenu est de 12,8% avant 8 ans, auquel s'ajoutent en principe 17,2% de prélèvements sociaux. Après 8 ans, un abattement annuel de 4 600€ (9 200€ pour un couple) s'applique aux gains de l'ensemble des contrats ; le taux d'impôt est de 7,5% ou 12,8% selon le montant des primes versées sur l'ensemble des contrats. Les primes plus anciennes suivent d'autres règles.`,
  avantage:`Regarde le contrat, pas seulement le nom de l’enveloppe : choix de supports, frais et conditions de rachat changent beaucoup le résultat.`
},

{
  id:"per", categorie:"Enveloppes fiscales", titre:"le PER", variante:"A", sousVariante:"enveloppe",
  intro:`Verser sur un PER peut réduire ton impôt aujourd’hui. En échange, ton épargne est en principe destinée à rester investie jusqu’à la retraite.`,
  objectif:`Préparer sa retraite en réduisant son revenu imposable pendant la vie active.`,
  pourQui:`Tu peux immobiliser une partie de ton épargne jusqu'à la retraite et comparer l'économie d'impôt à l'entrée à la fiscalité attendue à la sortie.`,
  mecanismeTitre:`💼 Qu'est-ce qu'on met dedans ?`,
  mecanismeContenu:`✅ ETF, actions, fonds euros, SCPI selon le contrat\n✅ Versements déductibles du revenu imposable, dans une limite annuelle (environ 10% des revenus professionnels)\n❌ Argent bloqué jusqu'à la retraite, sauf déblocage anticipé (achat résidence principale, accidents de la vie)`,
  sectionsOptionnelles:[
    {titre:`🔀 Gestion pilotée ou libre ?`, contenu:`Par défaut, le PER est en gestion pilotée : les investissements se sécurisent automatiquement à l'approche de la retraite. Tu peux aussi choisir la gestion libre pour piloter toi-même la répartition.`}
  ],
  attention:`L'avantage fiscal à l'entrée se paie à la sortie : les sommes déduites sont réintégrées à l'impôt sur le revenu au moment du retrait.`,
  fraisTitre:`💰 Fiscalité`,
  fraisContenu:`Les versements volontaires peuvent être déduits du revenu imposable dans la limite du plafond disponible ; tu peux aussi renoncer à cette déduction. En cas de sortie en capital, la part des versements déduits est imposée au barème, sans prélèvements sociaux, et les gains suivent le prélèvement forfaitaire applicable. Les règles diffèrent pour une sortie en rente ou des versements non déduits.`,
  avantage:`La déduction aujourd’hui s’accompagne d’une fiscalité à la sortie. Compare ta situation fiscale à l’entrée et celle que tu anticipes à la retraite.`
},

{
  id:"livret-a", categorie:"Enveloppes fiscales", titre:"le Livret A", variante:"A", sousVariante:"enveloppe",
  intro:`Le Livret A répond à une question simple : où garder l’argent dont tu pourrais avoir besoin rapidement ?`,
  objectif:`Mettre de côté une épargne de sécurité immédiatement disponible, sans aucun risque de perte.`,
  pourQui:`Tu constitues ton épargne de précaution (3 à 6 mois de dépenses) avant de penser à investir.`,
  mecanismeTitre:`💼 Qu'est-ce qu'on met dedans ?`,
  mecanismeContenu:`✅ Uniquement des dépôts et retraits en euros\n✅ Plafond de dépôt : 22 950€\n✅ Disponible à tout moment, sans délai ni pénalité\n❌ Aucun placement en actions, ETF ou fonds`,
  attention:`Le taux (1,70% depuis le 1er août 2026) est fixé par l'État et réévalué deux fois par an, au 1er février et au 1er août — il ne suit pas toujours l'inflation, donc ton épargne peut perdre du pouvoir d'achat certaines années.`,
  fraisTitre:`💰 Fiscalité`,
  fraisContenu:`Les intérêts sont totalement exonérés d'impôt sur le revenu et de prélèvements sociaux.`,
  avantage:`Pour l’argent dont tu peux avoir besoin bientôt, sa disponibilité compte souvent davantage que quelques dixièmes de rendement.`
},

{
  id:"ldds", categorie:"Enveloppes fiscales", titre:"le LDDS", variante:"A", sousVariante:"enveloppe",
  intro:`Ton Livret A est plein ? Le LDDS offre une autre place pour ton épargne disponible, avec son propre plafond.`,
  objectif:`Compléter son épargne de précaution une fois le Livret A rempli, avec les mêmes garanties.`,
  pourQui:`Tu as déjà rempli ton Livret A et tu veux continuer à épargner sans risque, au même taux.`,
  mecanismeTitre:`💼 Qu'est-ce qu'on met dedans ?`,
  mecanismeContenu:`✅ Dépôts et retraits en euros uniquement\n✅ Plafond de dépôt : 12 000€\n✅ Même taux et même disponibilité que le Livret A\n❌ Aucun placement en actions ou fonds`,
  fraisTitre:`💰 Fiscalité`,
  fraisContenu:`Intérêts exonérés d'impôt sur le revenu et de prélèvements sociaux, comme le Livret A.`,
  avantage:`Quand le Livret A atteint son plafond, le LDDS permet de garder une autre somme disponible dans les mêmes conditions de taux.`
},

{
  id:"pee-perco", categorie:"Enveloppes fiscales", titre:"le PEE / PERCO", variante:"A", sousVariante:"enveloppe",
  intro:`Ton employeur ajoute parfois de l’argent à tes versements sur un plan d’épargne salariale. Les règles du plan déterminent ce que tu peux en faire.`,
  objectif:`Épargner via ton entreprise en profitant d'un abondement (de l'argent gratuit versé par l'employeur) et d'une fiscalité avantageuse.`,
  pourQui:`Ton employeur propose un plan d'épargne entreprise, en particulier s'il abonde tes versements.`,
  mecanismeTitre:`💼 Qu'est-ce qu'on met dedans ?`,
  mecanismeContenu:`✅ Fonds communs de placement d'entreprise (FCPE), souvent diversifiés en actions et obligations\n✅ Abondement de l'employeur, jusqu'à 300% de ton versement selon les accords, plafonné à 3 844,80€ par an sur un PEE en 2026\n❌ Argent bloqué 5 ans pour le PEE, jusqu'à la retraite pour le PERCO (sauf déblocage anticipé)`,
  attention:`Avant de chercher à profiter de l'abondement, vérifie ses conditions, les supports proposés, leurs frais et la durée pendant laquelle tu peux te passer de cet argent.`,
  fraisTitre:`💰 Fiscalité`,
  fraisContenu:`Les sommes versées via l'intéressement, la participation et l'abondement sont exonérées d'impôt sur le revenu. Seuls les prélèvements sociaux s'appliquent sur les gains (18,6% depuis la hausse de la CSG au 1er janvier 2026).`,
  avantage:`Commence par lire les règles de ton entreprise : le montant de l’abondement et les conditions de déblocage déterminent l’intérêt du plan.`
},

/* ============ PRODUITS & MARCHÉS (variante A · produit) ============ */

{
  id:"etf", categorie:"Produits & marchés", titre:"les ETF", variante:"A", sousVariante:"produit",
  intro:`Avec un ETF, un seul achat peut te donner accès à de nombreuses entreprises. Reste à regarder l’indice qu’il suit réellement.`,
  objectif:`Investir de façon diversifiée et peu coûteuse, sans avoir à choisir toi-même les actions.`,
  pourQui:`Tu veux investir en bourse sans passer des heures à analyser des entreprises une par une.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Un ETF indiciel cherche à suivre un indice, par exemple le S&P 500 qui rassemble environ 500 grandes entreprises américaines sélectionnées selon ses règles. Il se négocie en bourse comme une action.\n\nIl existe aussi des ETF actifs, dont le gérant prend des décisions d'investissement sans simplement reproduire un indice.`,
  sectionsOptionnelles:[
    {titre:`🔀 Physique ou synthétique ?`, contenu:`Un ETF physique détient réellement les actions qui composent son panier.\n\nUn ETF synthétique, lui, ne les détient pas forcément : il passe un contrat d'échange (un "swap") avec une banque, qui s'engage à lui reverser la performance de l'indice visé.\n\nC'est ce qui permet par exemple de loger un ETF S&P 500 dans un PEA, normalement réservé aux actions européennes : l'ETF détient un panier d'actions européennes en garantie, et récupère la performance américaine via le swap.`}
  ],
  attention:`Ça introduit un risque de contrepartie (que la banque fasse défaut), très encadré par la réglementation (collatéral, plafond de 10% par contrepartie) mais pas totalement nul.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Les ETF indiciels facturent un TER (frais de gestion annuel) souvent entre 0,05% et 0,40%, contre 1,5% à 2,5% en moyenne pour un fonds géré activement.`,
  avantage:`Choisis d’abord l’indice et regarde ce que le fonds détient. Un TER bas ne compense pas une exposition qui ne correspond pas à ton objectif.`
},

{
  id:"action", categorie:"Produits & marchés", titre:"une action", variante:"A", sousVariante:"produit",
  intro:`Acheter une action, c’est détenir une fraction d’une entreprise. Le résultat dépend alors de cette entreprise et du prix auquel tu l’achètes.`,
  objectif:`Investir directement dans une entreprise précise, pour profiter de sa croissance et éventuellement de ses dividendes.`,
  pourQui:`Tu as étudié une entreprise en particulier et tu veux miser sur sa performance individuelle, en acceptant un risque plus concentré qu'un ETF.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Quand tu achètes une action, tu détiens une fraction du capital de l'entreprise. Sa valeur évolue selon l'offre et la demande sur le marché, influencée par ses résultats et ses perspectives.\n\nUne action ordinaire donne généralement un droit de vote. Un dividende peut être versé, mais il n'est jamais garanti.`,
  sectionsOptionnelles:[
    {titre:`🔀 Action de croissance ou de rendement ?`, contenu:`Une action de croissance réinvestit ses bénéfices pour se développer et verse peu ou pas de dividendes (ex : entreprises tech). Une action de rendement reverse une part importante de ses bénéfices en dividendes réguliers (ex : entreprises matures comme les utilities ou l'énergie).`}
  ],
  attention:`Contrairement à un ETF, une action individuelle n'est pas diversifiée : si l'entreprise fait faillite, tu peux perdre la totalité de ta mise.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Frais de courtage à chaque achat/vente (souvent entre 0€ et quelques euros selon le courtier), pas de frais de gestion annuel contrairement à un fonds.`,
  avantage:`Une seule entreprise peut surprendre, à la hausse comme à la baisse. Mesure le poids que tu acceptes de lui donner dans ton portefeuille.`
},

{
  id:"obligation", categorie:"Produits & marchés", titre:"une obligation", variante:"A", sousVariante:"produit",
  intro:`Avec une obligation, tu prêtes de l’argent à un État ou à une entreprise. Le montant promis ne supprime pas le risque de ne pas être remboursé.`,
  objectif:`Prêter de l'argent à un émetteur selon des conditions de rémunération et une échéance définies, en acceptant le risque de défaut.`,
  pourQui:`Tu veux connaître à l'avance les intérêts et l'échéance d'un prêt à un émetteur, tout en acceptant le risque de défaut et les variations de prix avant l'échéance.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Quand tu achètes une obligation, tu prêtes de l'argent à un État ou à une entreprise. Selon le titre, les intérêts sont versés périodiquement ou à l'échéance ; certaines obligations ne versent pas de coupon. Le remboursement prévu à l'échéance dépend de la capacité de l'émetteur à payer. Si tu revends avant, le prix peut être supérieur ou inférieur à celui que tu as payé.`,
  sectionsOptionnelles:[
    {titre:`🔀 Obligation d'État ou d'entreprise ?`, contenu:`Une obligation d'État (comme les OAT françaises) est généralement plus sûre. Une obligation d'entreprise (corporate) offre un taux plus élevé, mais avec un risque de défaut plus important selon la solidité de l'émetteur.`}
  ],
  attention:`Le prix d'une obligation varie avant l'échéance en fonction des taux d'intérêt : quand les taux montent, la valeur des obligations existantes baisse.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Frais de courtage à l'achat, ou frais de gestion si tu passes par un fonds obligataire ou un ETF obligataire.`,
  avantage:`Vérifie l’échéance, la solidité de l’émetteur et le prix payé : un coupon connu ne suffit pas à connaître ton gain final.`
},

{
  id:"fcp", categorie:"Produits & marchés", titre:"un fonds commun de placement", variante:"A", sousVariante:"produit",
  intro:`Dans un fonds commun de placement, tu confies tes choix de titres à une équipe de gestion. Il faut ensuite regarder ce qu’elle achète et combien elle coûte.`,
  objectif:`Déléguer la gestion de ton épargne à un professionnel qui sélectionne les actifs pour toi.`,
  pourQui:`Tu préfères confier tes choix d'investissement à un gérant plutôt que les faire toi-même, et tu es prêt à payer des frais de gestion plus élevés pour ça.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Le gérant du fonds collecte l'argent de tous les investisseurs et l'investit selon une stratégie définie (actions, obligations, secteur précis...). La valeur de ta part suit la valeur liquidative du fonds, calculée en général une fois par jour, contrairement à un ETF qui se négocie en continu.`,
  attention:`Une gestion active ne garantit pas de battre son indice après frais. Pour juger un fonds, compare ses résultats à un indice pertinent, sur une même période et dans la même devise.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Frais de gestion annuels souvent entre 1,5% et 2,5%, parfois des frais d'entrée ou de sortie en plus.`,
  avantage:`Compare la stratégie et les frais avec un ETF exposé au même marché. La gestion déléguée a un coût, à examiner sur la durée.`
},

{
  id:"scpi", categorie:"Produits & marchés", titre:"la SCPI", variante:"A", sousVariante:"produit",
  intro:`Des loyers immobiliers sans gérer toi-même un appartement ? C’est ce que propose une SCPI, moyennant des frais et un risque de perte.`,
  objectif:`Percevoir des revenus locatifs réguliers sans les contraintes de la gestion immobilière directe.`,
  pourQui:`Tu veux de l'immobilier dans ton patrimoine mais tu n'as pas envie de gérer un bien, des locataires ou des travaux.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`La société de gestion achète et gère un parc d'immeubles (bureaux, commerces, logements) avec l'argent des porteurs de parts. Les loyers perçus, moins les frais de gestion, te sont reversés au prorata de tes parts, généralement chaque trimestre. Selon l'ASPIM, le taux de distribution moyen du marché s'est établi à 4,91% en 2025 (contre 4,72% en 2024).`,
  sectionsOptionnelles:[
    {titre:`🔀 SCPI de rendement ou fiscale ?`, contenu:`Une SCPI de rendement vise le revenu locatif régulier. Une SCPI fiscale (Pinel, Malraux...) vise surtout une réduction d'impôt, avec des contraintes de durée plus fortes.`},
    {titre:`🔀 Avec ou sans frais de souscription ?`, contenu:`Certaines SCPI prélèvent des frais de souscription, d'autres non. Compare aussi les frais de gestion, les éventuels frais de sortie et le prix de revente des parts : une seule ligne de frais ne suffit pas à connaître le coût total.`}
  ],
  attention:`La vente de parts de SCPI peut prendre plusieurs mois, voire davantage si les demandes de retrait s'accumulent. Le capital n'est pas garanti et le prix de la part peut baisser.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Les frais de souscription, de gestion et parfois de cession varient selon la SCPI. Lis sa documentation et compare le prix de souscription à la valeur de retrait, ainsi que les prélèvements sur les loyers.`,
  avantage:`Tu délègues la gestion, mais la revente des parts peut prendre du temps. Vérifie les frais et la liquidité avant d’y consacrer une épargne dont tu pourrais avoir besoin.`
},

{
  id:"opci", categorie:"Produits & marchés", titre:"l'OPCI", variante:"A", sousVariante:"produit",
  intro:`Un OPCI associe de l’immobilier à des actifs financiers et des liquidités. Sa composition peut donc être très différente de celle d’une SCPI.`,
  objectif:`Investir dans un fonds immobilier qui détient aussi des actifs financiers et une poche de liquidités.`,
  pourQui:`Tu veux de l'exposition immobilière, notamment dans une assurance-vie, avec la possibilité de revendre plus facilement qu'une SCPI.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Un OPCI doit détenir au moins 60% d'actifs immobiliers et au minimum 5% de liquidités, le reste pouvant être investi en actions ou obligations. Cette poche liquide permet de répondre plus rapidement aux demandes de retrait, contrairement à une SCPI investie à quasi 100% en immeubles.`,
  attention:`La poche d'actifs financiers peut accentuer les variations de la valeur de l'OPCI. Sa liquidité reste soumise aux conditions de rachat du fonds ; ni le capital ni un délai de sortie immédiat ne sont garantis.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Frais de gestion, de souscription ou de rachat éventuels : vérifie les montants dans le document d'informations du fonds et, si tu investis via une assurance-vie, les frais du contrat.`,
  avantage:`La part d’actifs financiers peut rendre sa valeur plus mobile que celle d’une SCPI. Lis sa composition avant de le choisir pour sa seule étiquette immobilière.`
},

{
  id:"trackers", categorie:"Produits & marchés", titre:"les trackers", variante:"A", sousVariante:"produit",
  intro:`« Tracker » revient souvent dans les discussions sur les ETF. Derrière ce mot, on parle généralement d’un fonds coté qui suit un indice.`,
  objectif:`Suivre la performance d'un marché ou d'un secteur en un seul produit, sans sélectionner toi-même les titres.`,
  pourQui:`Tu veux investir simplement sur un indice (CAC 40, S&P 500, secteur tech...) sans multiplier les lignes dans ton portefeuille.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`"Tracker" est le terme historiquement utilisé en France, "ETF" (Exchange Traded Fund) est le terme international — ce sont les mêmes produits. Un tracker réplique un indice soit physiquement (en détenant les titres), soit synthétiquement (via un contrat d'échange avec une contrepartie), et se négocie en bourse en temps réel comme une action.`,
  attention:`Le mot "tracker" est parfois utilisé abusivement pour désigner d'autres produits dérivés plus risqués — vérifie toujours qu'il s'agit bien d'un ETF réglementé (UCITS en Europe).`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Comme pour un ETF, un TER (frais de gestion annuel) généralement entre 0,05% et 0,40%.`,
  avantage:`Tracker et ETF désignent généralement le même type de fonds. Ce qui mérite ton attention, c’est l’indice suivi, les frais et l’enveloppe où tu l’achètes.`
},

/* ============ MÉCANISMES & STRATÉGIES (variante A · produit) ============ */

{
  id:"dca", categorie:"Mécanismes & stratégies", titre:"le DCA (versement programmé)", variante:"A", sousVariante:"produit",
  intro:`Investir chaque mois la même somme évite de choisir une date parfaite à chaque achat. Cette habitude porte un nom : le DCA.`,
  objectif:`Lisser ton prix d'achat moyen dans le temps et limiter l'impact du timing de marché.`,
  pourQui:`Tu reçois un revenu régulier (salaire) et tu veux investir sans avoir à te demander en permanence si "c'est le bon moment".`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Tu automatises un versement fixe, par exemple 200€ chaque mois, sur un ETF ou un panier d'actifs. Quand les prix sont hauts, tu achètes moins de parts ; quand ils sont bas, tu en achètes plus. Sur la durée, ton prix d'achat moyen se lisse, sans que tu aies besoin de deviner le meilleur moment pour investir.`,
  attention:`Le DCA ne garantit pas un meilleur rendement qu'un investissement en une fois — c'est avant tout un outil de discipline et de gestion du risque émotionnel, pas une martingale.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Selon le courtier, chaque versement programmé peut générer des frais de courtage à l'unité — privilégie un courtier qui propose le DCA sans frais ou à frais réduits.`,
  avantage:`Un virement programmé rend l’investissement plus facile à tenir. Il ne garantit pas un meilleur prix d’achat ni une meilleure performance.`
},

{
  id:"effet-levier", categorie:"Mécanismes & stratégies", titre:"l'effet de levier", variante:"A", sousVariante:"produit",
  intro:`Tu investis plus que ta mise de départ grâce à un emprunt ou un produit financier. Les gains possibles grandissent, les pertes aussi.`,
  objectif:`Augmenter la taille de ta position au-delà de ton capital réellement disponible.`,
  pourQui:`Tu es un investisseur expérimenté qui comprend et accepte un risque de perte amplifié, souvent sur des horizons courts.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Avec un levier de 5, par exemple, tu contrôles une position 5 fois plus grande que ton capital investi. Si l'actif monte de 2%, ton gain est amplifié à environ 10% ; s'il baisse de 2%, ta perte l'est tout autant. Le levier peut venir d'un emprunt (crédit lombard), d'un produit dérivé (CFD, turbo, warrant) ou du crédit immobilier.`,
  attention:`Un levier élevé peut entraîner une perte totale, voire supérieure à ta mise initiale selon le produit — ce n'est pas réservé aux débutants, c'est déconseillé aux débutants.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Intérêts sur le montant emprunté (souvent facturés au jour le jour sur les CFD), qui rognent la performance si la position est gardée longtemps.`,
  avantage:`Commence par calculer ce que tu perds si le marché baisse fortement : avec du levier, une variation modeste de l’actif peut peser lourd sur ta mise.`
},

{
  id:"diversification", categorie:"Mécanismes & stratégies", titre:"la diversification", variante:"A", sousVariante:"produit",
  intro:`Détenir dix lignes ne suffit pas si elles possèdent toutes les mêmes entreprises. La diversification se juge sur ce que tu détiens vraiment.`,
  objectif:`Réduire l'impact qu'un seul actif défaillant peut avoir sur l'ensemble de ton portefeuille.`,
  pourQui:`Tout investisseur, quel que soit son niveau — c'est l'un des seuls principes qui fait à peu près consensus en finance.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Plutôt que d'investir 100% dans une seule action, tu répartis ton capital entre plusieurs actifs qui ne réagissent pas tous de la même façon aux mêmes événements : différentes entreprises, secteurs, zones géographiques, voire classes d'actifs (actions, obligations, immobilier). Un ETF monde peut donner accès à plus d'un millier d'entreprises en un seul produit, selon l'indice suivi.`,
  attention:`Trop diversifier peut aussi diluer ta performance et complexifier inutilement ton suivi — un ETF monde suffit déjà à diversifier l'essentiel du risque spécifique à une entreprise.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Pas de frais propres à la diversification en elle-même, si ce n'est les frais cumulés des produits utilisés pour l'obtenir (ETF, fonds...).`,
  avantage:`Compte les entreprises, mais regarde aussi leur poids : plusieurs ETF peuvent détenir les mêmes grandes valeurs et laisser ton portefeuille concentré.`
},

{
  id:"reequilibrage", categorie:"Mécanismes & stratégies", titre:"le rééquilibrage de portefeuille", variante:"A", sousVariante:"produit",
  intro:`Ton portefeuille était à 80 % en actions, puis les marchés ont bougé. Rééquilibrer, c’est décider s’il faut revenir à ta répartition de départ.`,
  objectif:`Maintenir le niveau de risque que tu avais choisi au départ, malgré les mouvements de marché qui déforment tes proportions.`,
  pourQui:`Tu as défini une répartition cible (par exemple 80% actions / 20% obligations) et tu veux t'y tenir dans la durée.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Si les actions montent fortement, leur poids dans ton portefeuille augmente au-delà de ta cible initiale, ce qui augmente ton risque sans que tu l'aies décidé. Rééquilibrer consiste à vendre une partie de ce qui a le plus monté pour racheter ce qui est sous-pondéré, afin de revenir à ta répartition cible — par exemple une fois par an.`,
  attention:`Rééquilibrer trop souvent multiplie les frais et, hors enveloppe défiscalisée, peut déclencher de la fiscalité à chaque arbitrage.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Frais de courtage à chaque arbitrage, et fiscalité potentielle sur les plus-values réalisées si tu es hors PEA ou assurance-vie.`,
  avantage:`Fixe une règle simple avant que les marchés bougent : date ou seuil d’écart. Tu sauras alors quand revenir à ta répartition cible.`
},

{
  id:"dca-vs-lumpsum", categorie:"Mécanismes & stratégies", titre:"DCA vs lump sum", variante:"A", sousVariante:"produit",
  intro:`Tu reçois une somme importante : tout investir maintenant ou l’étaler sur plusieurs mois ? C’est la question derrière DCA et lump sum.`,
  objectif:`Choisir la méthode d'entrée sur le marché la plus adaptée à ta situation et à ta tolérance au risque immédiat.`,
  pourQui:`Tu disposes d'un capital important d'un coup (héritage, prime, vente d'un bien) et tu hésites entre l'investir en une fois ou petit à petit.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Une étude Vanguard portant sur les marchés américain, britannique et australien entre 1926 et 2015 a montré que le lump sum (tout investir en une fois) bat en moyenne un DCA étalé sur 12 mois dans environ 68% des périodes étudiées, car l'argent est exposé au marché plus tôt sur des marchés actions historiquement haussiers. Le DCA, lui, réduit le risque de "mal tomber" juste avant une grosse baisse, au prix d'un temps où une partie de ton capital reste non investie.`,
  sectionsOptionnelles:[
    {titre:`🔀 Un compromis possible`, contenu:`Beaucoup d'investisseurs choisissent une voie intermédiaire : étaler l'investissement sur 3 à 12 mois, pour limiter le risque de timing sans rester trop longtemps hors marché.`}
  ],
  fraisTitre:`💰 Frais`,
  fraisContenu:`Le lump sum limite les frais de courtage à une seule opération, quand un DCA étalé sur plusieurs mois en cumule davantage selon le courtier.`,
  avantage:`Si tu as déjà la somme, étaler les achats change surtout ton exposition au marché pendant l’attente. Choisis un rythme que tu pourras tenir même après une baisse.`
},

{
  id:"vente-a-decouvert", categorie:"Mécanismes & stratégies", titre:"la vente à découvert", variante:"A", sousVariante:"produit",
  intro:`Parier sur une baisse en vendant d’abord, puis en rachetant plus tard : c’est le principe de la vente à découvert.`,
  objectif:`Générer un profit quand un actif baisse, à l'inverse d'un investissement classique.`,
  pourQui:`Tu es un investisseur expérimenté qui anticipe la baisse d'un actif précis et acceptes un risque de perte potentiellement illimité.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Tu empruntes des titres à un intermédiaire et tu les vends immédiatement sur le marché. Si le prix baisse comme prévu, tu les rachètes moins cher pour les rendre, et tu empoches la différence. Si le prix monte au contraire, tu dois quand même les racheter pour les rendre, à un prix plus élevé que celui auquel tu les as vendus.`,
  attention:`Contrairement à un achat classique où tu perds au maximum ta mise, une vente à découvert peut théoriquement générer une perte illimitée si l'actif ne cesse de monter.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Frais d'emprunt des titres facturés par le courtier, généralement au jour le jour, en plus des frais de courtage classiques.`,
  avantage:`Contrairement à un achat classique, la perte potentielle n’a pas de plafond théorique. Vérifie le coût de l’emprunt et la façon dont la position peut être clôturée.`
},

{
  id:"dividende", categorie:"Mécanismes & stratégies", titre:"le dividende", variante:"A", sousVariante:"produit",
  intro:`Une entreprise peut verser une partie de son argent à ses actionnaires. Ce dividende arrive sur ton compte, mais il ne crée pas un gain à lui seul.`,
  objectif:`Recevoir un revenu régulier en plus de la performance du cours de l'action.`,
  pourQui:`Tu cherches un revenu complémentaire régulier ou tu construis un portefeuille orienté "rendement" plutôt que pure croissance du cours.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Si l'entreprise décide de distribuer un dividende, son montant dépend du nombre d'actions détenues. Par exemple, 3€ de dividende pour une action à 100€ correspondent à un rendement affiché de 3%. À la date du détachement, le cours est ajusté du montant du dividende, avant les autres variations du marché.`,
  attention:`Un dividende très élevé peut être un signal d'alerte plutôt qu'une bonne nouvelle — il indique parfois que le marché anticipe une baisse ou une suppression future du dividende.`,
  fraisTitre:`💰 Fiscalité`,
  fraisContenu:`Sur un CTO, les dividendes perçus relèvent en principe du PFU de 31,4% en 2026, sauf option globale pour le barème. Dans un PEA, les dividendes éligibles restent dans le plan et ne sont pas taxés à chaque versement ; les règles fiscales s'appliquent aux retraits. Dans une assurance-vie, ce sont les gains inclus dans un rachat qui sont imposables.`,
  avantage:`Le versement d’un dividende fait sortir de l’argent de l’entreprise : regarde le rendement total, cours compris, avant de juger ton gain.`
},

{
  id:"reinvestissement-dividendes", categorie:"Mécanismes & stratégies", titre:"le réinvestissement des dividendes", variante:"A", sousVariante:"produit",
  intro:`Que faire des dividendes reçus ? Les replacer peut accroître le nombre de parts détenues, si tu n’as pas besoin de ce revenu maintenant.`,
  objectif:`Laisser les revenus investis pour qu'ils participent à la performance future du portefeuille.`,
  pourQui:`Tu n'as pas besoin des dividendes comme revenu immédiat et tu veux maximiser la croissance de ton capital sur le long terme.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Quand tu reçois des dividendes en espèces, tu peux acheter de nouvelles parts avec cette somme. Ces parts peuvent à leur tour produire des revenus. Sur un ETF capitalisant, les dividendes perçus par le fonds restent dans ses actifs : ta valeur de part reflète alors aussi ces revenus.`,
  sectionsOptionnelles:[
    {titre:`🔀 ETF de capitalisation ou de distribution ?`, contenu:`Un ETF "de capitalisation" (Acc) réinvestit automatiquement les dividendes en interne, sans que tu aies rien à faire. Un ETF "de distribution" (Dist) te verse les dividendes, à toi de les réinvestir manuellement si tu le souhaites.`}
  ],
  fraisTitre:`💰 Frais`,
  fraisContenu:`Un ETF capitalisant ne nécessite pas d'ordre de réinvestissement de ta part. Si tu rachètes manuellement des parts après une distribution, des frais de courtage peuvent s'appliquer selon le courtier ; les frais habituels de l'ETF restent dus.`,
  avantage:`Sur un ETF capitalisant, les revenus restent investis dans le fonds. Sur une part distribuante, tu décides quand les replacer et supportes la fiscalité applicable.`
},

/* ============ CRYPTO (variante A · produit) ============ */

{
  id:"blockchain", categorie:"Crypto", titre:"la blockchain", variante:"A", sousVariante:"produit",
  intro:`Une blockchain garde une trace partagée de certaines opérations. Cela ne dit encore rien de la valeur des cryptomonnaies qui l’utilisent.`,
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
  avantage:`La transparence d’un registre ne garantit ni la valeur d’un token ni la fiabilité d’un projet. Sépare toujours la technologie de l’investissement proposé.`
},

{
  id:"stablecoin", categorie:"Crypto", titre:"le stablecoin", variante:"A", sousVariante:"produit",
  intro:`Un stablecoin vise souvent à suivre le dollar. « Stable » décrit son objectif, pas une garantie contre toute perte.`,
  objectif:`Détenir un jeton qui cherche à suivre une monnaie de référence, pour des transferts ou des opérations au sein de l'écosystème crypto.`,
  pourQui:`Tu veux transférer de la valeur rapidement ou rester en dehors du marché crypto temporairement, sans repasser par une monnaie traditionnelle.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Un stablecoin adossé au dollar cherche à maintenir une valeur proche de 1 dollar grâce aux réserves et aux possibilités de rachat prévues par son émetteur. La parité peut toutefois se rompre, et sa valeur en euros varie avec le taux de change euro-dollar. Vérifie les droits de rachat propres au jeton et à la plateforme utilisée.`,
  sectionsOptionnelles:[
    {titre:`🔀 Adossé à des réserves ou algorithmique ?`, contenu:`Les stablecoins adossés à des réserves (USDC, USDT) détiennent des actifs réels en garantie. Les stablecoins algorithmiques tentent de maintenir leur parité par du code plutôt que des réserves — un modèle qui s'est déjà effondré plusieurs fois (ex : TerraUSD en 2022).`}
  ],
  attention:`La stabilité dépend entièrement de la confiance dans l'émetteur et de la réalité de ses réserves — un stablecoin n'est pas sans risque, contrairement à ce que son nom suggère.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Frais de transaction blockchain (gas fees) à chaque transfert, plus d'éventuels frais de conversion selon la plateforme utilisée.`,
  avantage:`Une parité annoncée n’est pas une garantie bancaire. Vérifie les réserves, les possibilités de rachat et les risques de la plateforme qui le conserve.`
},

{
  id:"cold-hot-wallet", categorie:"Crypto", titre:"le cold wallet / hot wallet", variante:"A", sousVariante:"produit",
  intro:`Un wallet ne contient pas tes cryptos comme un porte-monnaie contient des pièces : il te donne accès aux clés qui permettent de les utiliser.`,
  objectif:`Sécuriser (cold) ou faciliter l'accès rapide (hot) à tes cryptomonnaies selon ton usage.`,
  pourQui:`Tu détiens des cryptomonnaies et tu dois choisir entre praticité au quotidien et sécurité maximale sur le long terme.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Un hot wallet (application mobile, extension navigateur) reste connecté à internet, ce qui le rend pratique pour des transactions fréquentes mais plus exposé au piratage. Un cold wallet (clé USB dédiée, papier) stocke tes clés privées hors ligne, inaccessible à distance, ce qui le rend beaucoup plus sûr pour un stockage long terme mais moins pratique pour des opérations rapides.`,
  attention:`"Not your keys, not your coins" : tant que tes cryptos restent sur une plateforme d'échange, tu ne détiens pas réellement tes clés privées, et donc pas réellement tes cryptos.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Un cold wallet matériel coûte entre 50€ et 200€ à l'achat ; un hot wallet logiciel est généralement gratuit.`,
  avantage:`Si tu perds tes clés de récupération, tu peux perdre l’accès à tes actifs. La sécurité dépend aussi de la manière dont tu conserves cette phrase, hors de portée d’autrui.`
},

/* ============ IMMOBILIER (variante A · produit) ============ */

{
  id:"rendement-locatif", categorie:"Immobilier", titre:"le rendement locatif", variante:"A", sousVariante:"produit",
  intro:`Un appartement encaisse des loyers, mais combien reste-t-il après toutes les dépenses ? Le rendement locatif commence par rapporter les loyers au prix du bien.`,
  objectif:`Évaluer si un investissement immobilier locatif est intéressant financièrement avant de l'acheter.`,
  pourQui:`Tu envisages d'acheter un bien pour le mettre en location et tu veux comparer sa rentabilité à d'autres placements.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Le rendement brut se calcule ainsi : (loyers annuels ÷ coût d'acquisition retenu) × 100. Par exemple, hors frais d'acquisition, un bien acheté 200 000€ qui génère 10 000€ de loyers par an affiche 5% brut. Le rendement net tient aussi compte des charges, de la taxe foncière, des frais de gestion et de la vacance locative.`,
  sectionsOptionnelles:[
    {titre:`🔀 Rendement brut ou net ?`, contenu:`Le rendement brut ignore toutes les charges, il sert surtout à comparer rapidement des biens entre eux. Le rendement net (voire net-net après impôt) reflète ce qu'il te reste réellement en poche.`}
  ],
  attention:`Un rendement affiché élevé cache parfois un bien dans une zone à faible demande locative ou à fort risque de vacance — le rendement ne dit rien du risque associé.`,
  fraisTitre:`💰 Fiscalité`,
  fraisContenu:`La fiscalité dépend du type de location et de ton régime : les revenus d'une location nue relèvent en principe des revenus fonciers, ceux d'une location meublée des BIC. Le rendement net avant impôt ne reflète donc pas toujours ce qui te reste après fiscalité.`,
  avantage:`Fais ensuite le calcul avec charges, travaux, vacance et impôts. Le rendement brut sert à trier les biens, pas à estimer ce qui restera sur ton compte.`
},

{
  id:"effet-levier-immo", categorie:"Immobilier", titre:"l'effet de levier immobilier", variante:"A", sousVariante:"produit",
  intro:`Le crédit te permet d’acheter un bien sans en avancer tout le prix. Il ajoute aussi des mensualités à payer, même si les loyers manquent.`,
  objectif:`Démultiplier ta capacité d'investissement en utilisant l'argent de la banque plutôt que uniquement le tien.`,
  pourQui:`Tu veux investir dans l'immobilier locatif sans mobiliser l'intégralité du prix d'achat en fonds propres.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Tu empruntes une partie ou la totalité du prix d'achat, et ce sont les loyers perçus qui remboursent tout ou partie du crédit. Par exemple, avec 20 000€ d'apport, tu peux emprunter 180 000€ et acheter un bien à 200 000€ : ton effet de levier est de 10. Si le bien prend de la valeur ou génère un rendement, le gain se calcule sur les 200 000€, alors que tu n'en as sorti que 20 000€ de ta poche.`,
  attention:`Le levier amplifie aussi les pertes : si le bien perd de la valeur ou reste vacant, tu continues de rembourser le crédit intégralement, indépendamment de la performance réelle du bien.`,
  fraisTitre:`💰 Frais`,
  fraisContenu:`Intérêts d'emprunt et éventuels frais de dossier ou de garantie. L'assurance emprunteur n'est pas imposée par la loi, mais la banque peut l'exiger pour accorder le crédit.`,
  avantage:`Le crédit peut amplifier le résultat, dans les deux sens. Prévois aussi les mensualités si le logement reste vide ou demande des travaux.`
},

{
  id:"lmnp", categorie:"Immobilier", titre:"le LMNP", variante:"A", sousVariante:"produit",
  intro:`Louer un logement meublé peut relever du statut LMNP. Pour comprendre son intérêt, il faut regarder comment les loyers sont imposés.`,
  objectif:`Optimiser la fiscalité d'un investissement locatif meublé grâce à l'amortissement comptable du bien.`,
  pourQui:`Tu loues un logement meublé sans remplir les conditions du statut de loueur professionnel. Le choix entre micro-BIC et régime réel dépend notamment des recettes et du type de location ; les meublés de tourisme non classés ont des règles distinctes.`,
  mecanismeTitre:`⚙️ Comment ça marche ?`,
  mecanismeContenu:`Sous le régime réel du LMNP, tu peux déduire de tes loyers imposables non seulement tes charges, mais aussi l'amortissement du bien et du mobilier — une dépréciation comptable qui ne correspond à aucune sortie d'argent réelle. Concrètement, cela permet souvent de ramener l'impôt sur les loyers perçus proche de zéro pendant de nombreuses années.`,
  sectionsOptionnelles:[
    {titre:`🔀 Régime micro-BIC ou réel ?`, contenu:`Pour une location meublée classique, le micro-BIC applique en principe un abattement forfaitaire de 50% ; le régime réel permet de déduire les charges et certains amortissements, sous conditions. Les meublés de tourisme non classés suivent un autre seuil et un autre taux d'abattement.`}
  ],
  attention:`Depuis la loi de finances 2025, pour toute vente à partir du 15 février 2025, l'amortissement immobilier déduit doit être réintégré dans le calcul de la plus-value (y compris les amortissements pratiqués avant 2025), ce qui réduit l'intérêt du LMNP sur le très long terme. L'amortissement du mobilier n'est pas concerné, et les résidences services (étudiantes, seniors, EHPAD) restent exonérées.`,
  fraisTitre:`💰 Fiscalité`,
  fraisContenu:`Loyers imposés dans la catégorie des BIC (bénéfices industriels et commerciaux), avec la possibilité de neutraliser l'impôt grâce à l'amortissement en régime réel.`,
  avantage:`Le choix entre micro-BIC et régime réel dépend des charges et de ta situation. Fais le calcul complet, y compris à la revente, avant de choisir.`
},

/* ============ INDICATEURS & NOTIONS (variante B) ============ */

{
  id:"drawdown", categorie:"Indicateurs & notions", titre:"le Drawdown", variante:"B",
  intro:`Ton placement monte puis perd une partie de sa valeur : jusqu’où est-il descendu avant de retrouver son sommet ? C’est ce que mesure le drawdown.`,
  definitionContenu:`Si ton portefeuille passe de 10 000€ à 7 000€ avant de remonter, ton drawdown a été de -30%, même si tu as fini l'année en gain.`,
  calculTitre:`🧮 Comment ça se calcule ?`,
  calculContenu:`(Valeur la plus basse − Valeur la plus haute précédente) ÷ Valeur la plus haute précédente. C'est un calcul de creux par rapport à un sommet, pas par rapport à ton prix d'achat.`,
  pourquoiImportant:`Un rendement moyen élevé ne dit rien sur ce que tu aurais vécu émotionnellement en cours de route. Le drawdown, lui, te dit si tu aurais tenu psychologiquement.`,
  erreurFrequente:`Beaucoup regardent la performance annualisée et ignorent le drawdown — c'est pourtant lui qui pousse les gens à vendre au pire moment.`,
  aRetenir:`Compare cette baisse à l’argent dont tu pourrais avoir besoin avant la reprise. La capacité à attendre compte autant que le rendement espéré.`
},

{
  id:"volatilite", categorie:"Indicateurs & notions", titre:"la Volatilité", variante:"B",
  intro:`Une action qui monte de 5 % puis baisse de 6 % bouge beaucoup. La volatilité mesure l’ampleur de ces variations, dans les deux sens.`,
  definitionContenu:`Une action dont le cours varie de +/-1% par jour en moyenne est peu volatile. Une cryptomonnaie qui varie de +/-5% par jour est très volatile — même si les deux peuvent avoir la même performance sur un an.`,
  calculTitre:`🧮 Comment ça se calcule ?`,
  calculContenu:`La volatilité se mesure statistiquement par l'écart-type des rendements sur une période donnée, souvent annualisé. Concrètement, une volatilité annualisée de 15% signifie que, dans des conditions "normales", le rendement annuel de l'actif s'écarte en moyenne de 15 points autour de sa moyenne, dans un sens ou dans l'autre.`,
  nuance:{titre:`🔀 Volatilité et risque, pas synonymes`, contenu:`Une forte volatilité n'est pas automatiquement une mauvaise nouvelle : elle mesure l'ampleur des mouvements, pas leur direction. Un actif très volatile qui monte fortement reste volatile, même s'il enrichit ceux qui le détiennent.`},
  pourquoiImportant:`La volatilité t'aide à calibrer la taille d'une position par rapport à ta tolérance au risque, et à anticiper l'ampleur des variations que tu devras encaisser psychologiquement.`,
  erreurFrequente:`On confond souvent volatilité et risque de perte définitive. Même un ETF monde diversifié peut subir une forte baisse, et aucune durée de détention ne garantit de récupérer sa mise.`,
  aRetenir:`Une mesure fondée sur les mouvements passés ne dit pas jusqu’où un prix peut chuter demain. Utilise-la pour situer les variations, pas comme une limite de perte.`
},

{
  id:"ratio-sharpe", categorie:"Indicateurs & notions", titre:"le Ratio de Sharpe", variante:"B",
  intro:`Deux placements gagnent autant, mais l’un connaît des variations bien plus fortes. Le ratio de Sharpe aide à lire cette différence.`,
  definitionContenu:`Deux placements peuvent afficher le même rendement de 8% par an, mais l'un avec deux fois moins de volatilité que l'autre. Le ratio de Sharpe permet de dire lequel a été "mieux géré" une fois le risque pris en compte.`,
  calculTitre:`🧮 Comment ça se calcule ?`,
  calculContenu:`Ratio de Sharpe = (Rendement de l'actif − Taux sans risque) ÷ Volatilité de l'actif. Par exemple, un portefeuille qui rapporte 8% par an, avec un taux sans risque à 3% et une volatilité de 10%, a un ratio de Sharpe de (8−3)/10 = 0,5. Plus le ratio est élevé, meilleur est le couple rendement/risque.`,
  pourquoiImportant:`Il évite de se laisser impressionner par un rendement brut élevé sans se demander quel niveau de risque a été pris pour l'obtenir — deux stratégies au même rendement ne se valent pas si l'une est deux fois plus risquée.`,
  erreurFrequente:`Un ratio de Sharpe se compare sur la même période et la même classe d'actifs — comparer le Sharpe d'un fonds obligataire à celui d'un ETF actions n'a pas vraiment de sens.`,
  aRetenir:`Il aide à comparer des stratégies sur une même période et avec une méthode cohérente. Un ratio passé ne promet pas la même efficacité demain.`
},

{
  id:"ter", categorie:"Indicateurs & notions", titre:"le TER (frais de gestion)", variante:"B",
  intro:`Sur un ETF, les frais annuels sont déjà intégrés dans la valeur de la part. Le TER indique leur niveau affiché.`,
  definitionContenu:`Un ETF avec un TER de 0,20% prélève 2€ par an pour 1 000€ investis, directement sur la valeur du fonds, sans que tu aies à payer quoi que ce soit toi-même.`,
  calculTitre:`🧮 Comment ça se calcule ?`,
  calculContenu:`Le TER est prélevé quotidiennement, au prorata, directement dans la valeur liquidative du fonds — c'est pour cela qu'il est invisible sur ton relevé de compte, mais il pèse chaque jour sur ta performance. Sur 20 ans, la différence entre un TER de 0,20% et un TER de 2% peut représenter plusieurs dizaines de milliers d'euros sur un capital conséquent, à cause des intérêts composés.`,
  pourquoiImportant:`Sur le long terme, les frais sont souvent le facteur le plus prévisible et le plus contrôlable de ta performance — contrairement au marché, tu choisis exactement combien de frais tu payes.`,
  erreurFrequente:`Un TER bas ne garantit pas à lui seul un bon produit — il faut aussi vérifier que l'indice suivi et la méthode de réplication correspondent à ce que tu recherches.`,
  aRetenir:`Deux ETF sur le même indice peuvent afficher des TER différents. Compare aussi leur écart de suivi et leurs autres coûts avant de départager quelques centièmes.`
},

{
  id:"capitalisation-boursiere", categorie:"Indicateurs & notions", titre:"la Capitalisation boursière", variante:"B",
  intro:`Comment mesurer la valeur d’une entreprise en Bourse ? Multiplie le prix d’une action par le nombre d’actions : tu obtiens sa capitalisation.`,
  definitionContenu:`Une entreprise dont l'action vaut 50€ avec 2 milliards d'actions en circulation a une capitalisation boursière de 100 milliards d'euros. Ce calcul donne une valeur au cours affiché, pas le prix certain d'un rachat de toute l'entreprise.`,
  calculTitre:`🧮 Comment ça se calcule ?`,
  calculContenu:`Capitalisation boursière = Prix de l'action × Nombre total d'actions en circulation. Elle évolue en temps réel, à chaque variation du cours de l'action.`,
  nuance:{titre:`🔀 Small, mid et large cap`, contenu:`Les entreprises sont classées par taille : small cap (petites capitalisations, souvent plus volatiles et moins liquides), mid cap (moyennes), et large cap (grandes, plus stables et plus suivies par les analystes).`},
  pourquoiImportant:`Elle te permet de situer la taille et la maturité d'une entreprise, et d'anticiper son profil de risque : les grandes capitalisations sont en général moins volatiles que les petites.`,
  erreurFrequente:`On confond parfois capitalisation boursière et taille réelle de l'entreprise (chiffre d'affaires, effectifs) — une entreprise peut avoir une capitalisation très élevée avec un chiffre d'affaires modeste, si le marché anticipe une forte croissance future.`,
  aRetenir:`Une grosse capitalisation ne signifie pas forcément qu’une entreprise est peu chère : sa valorisation dépend aussi du prix payé par rapport à ses bénéfices.`
},

{
  id:"indice-boursier", categorie:"Indicateurs & notions", titre:"un indice boursier", variante:"B",
  intro:`Le CAC 40 ou le S&P 500 affichent un chiffre, mais tu n’achètes pas directement ce chiffre. Un indice sert à suivre un ensemble de titres.`,
  definitionContenu:`Le CAC 40 regroupe les 40 plus grandes entreprises cotées à Paris ; le S&P 500 regroupe environ 500 grandes entreprises américaines. Quand on dit "la bourse a monté de 1%", on parle en réalité de la variation d'un de ces indices.`,
  calculTitre:`🧮 Comment ça se calcule ?`,
  calculContenu:`Beaucoup de grands indices pondèrent leurs titres selon leur capitalisation boursière ajustée du flottant : plus une entreprise pèse dans l'indice, plus la variation de son cours agit sur celui-ci. D'autres indices utilisent des pondérations différentes.`,
  pourquoiImportant:`Un indice te sert de référence pour juger si ta propre performance est bonne ou non — battre "le marché" signifie concrètement faire mieux que l'indice sur la même période.`,
  erreurFrequente:`On croit parfois qu'un indice est composé à parts égales de toutes ses entreprises — en réalité, dans un indice pondéré par capitalisation, quelques géants peuvent représenter une part disproportionnée de la performance totale.`,
  aRetenir:`Vérifie s’il inclut les dividendes et dans quelle devise il est calculé. Sans cela, la comparaison avec ton portefeuille peut être faussée.`
},

{
  id:"rendement-vs-performance", categorie:"Indicateurs & notions", titre:"Rendement vs performance", variante:"B",
  intro:`Un placement te verse 5 % de revenu mais son cours baisse de 10 %. Le rendement affiché ne raconte qu’une partie du résultat.`,
  definitionContenu:`Une action à 100€ qui verse 3€ de dividende a un rendement de 3%. Si en plus son cours passe à 108€ dans l'année, sa performance totale est de 3% (dividende) + 8% (plus-value) = 11%.`,
  calculTitre:`🧮 Comment ça se calcule ?`,
  calculContenu:`Rendement = Revenu généré (dividende, loyer, coupon) ÷ Prix de l'actif. Performance totale = (Valeur finale − Valeur initiale + Revenus perçus) ÷ Valeur initiale. La performance inclut donc toujours le rendement, mais l'inverse n'est pas vrai.`,
  pourquoiImportant:`Comparer deux placements uniquement sur leur rendement peut être trompeur si l'un a une plus-value en capital importante et l'autre non — c'est la performance totale qui reflète le gain réel.`,
  erreurFrequente:`Beaucoup jugent un placement uniquement sur son rendement affiché (ex : "cette SCPI rapporte 5%") sans tenir compte de l'évolution de la valeur du capital, qui peut monter ou baisser en parallèle.`,
  aRetenir:`Un dividende élevé peut accompagner une baisse du cours. Additionne revenus et évolution de la valeur pour comparer deux placements.`
},

{
  id:"inflation", categorie:"Indicateurs & notions", titre:"l'Inflation", variante:"B",
  intro:`Tes 100 € sont toujours sur ton compte, mais ils achètent moins qu’avant : c’est l’effet de l’inflation.`,
  definitionContenu:`Avec une inflation de 2% par an, un panier de courses à 100€ aujourd'hui coûtera environ 102€ dans un an, pour le même contenu.`,
  calculTitre:`🧮 Comment ça se calcule ?`,
  calculContenu:`L'inflation se mesure via un indice des prix (comme l'IPC en France), qui suit l'évolution du prix d'un panier de biens et services représentatif sur une période donnée, généralement exprimée en variation annuelle en pourcentage.`,
  nuance:{titre:`🔀 Rendement nominal ou réel ?`, contenu:`Le rendement nominal est celui exprimé en euros courants. Avec un rendement de 3% et une inflation de 2%, le gain réel est proche de 1% ; le calcul exact est (1,03 ÷ 1,02) − 1, soit environ 0,98%, avant éventuels impôts et frais.`},
  pourquoiImportant:`Laisser ton argent dormir sans qu'il rapporte au moins autant que l'inflation revient à perdre du pouvoir d'achat chaque année, même si le montant sur ton compte ne baisse pas.`,
  aRetenir:`Regarde ce que ton épargne peut encore acheter après la hausse des prix. Un solde bancaire qui augmente peut tout de même perdre du pouvoir d’achat.`
},

{
  id:"taux-interet", categorie:"Indicateurs & notions", titre:"le Taux d'intérêt", variante:"B",
  intro:`Quand les taux changent, emprunter coûte plus ou moins cher et les placements existants peuvent changer de prix.`,
  definitionContenu:`À 4% par an, 10 000€ empruntés représentent 400€ d'intérêts sur une année si la somme reste entièrement due pendant douze mois. Sur un crédit amortissable, les intérêts diminuent à mesure que le capital est remboursé.`,
  calculTitre:`🧮 Comment ça se détermine ?`,
  calculContenu:`Les taux directeurs sont fixés par les banques centrales (BCE en zone euro, Fed aux États-Unis) et influencent en cascade tous les autres taux : crédits immobiliers, rendement des obligations, taux des livrets réglementés.`,
  nuance:{titre:`🔀 Taux fixe ou variable ?`, contenu:`Un taux fixe reste identique sur toute la durée du prêt ou du placement. Un taux variable évolue en fonction des taux de marché, ce qui peut jouer en ta faveur ou en ta défaveur selon l'évolution future.`},
  pourquoiImportant:`Les variations de taux d'intérêt influencent directement la valorisation des actions et des obligations : quand les taux montent, les valorisations boursières et le prix des obligations existantes ont tendance à baisser.`,
  aRetenir:`Pour un emprunteur comme pour un détenteur d’obligations, une variation de taux peut changer le calcul. Regarde ton horizon avant d’en tirer une conclusion générale.`
},

{
  id:"taux-sans-risque", categorie:"Indicateurs & notions", titre:"le Taux sans risque", variante:"B",
  intro:`Avant de prendre un risque, quel rendement pourrais-tu viser avec une référence considérée comme très sûre ? C’est le rôle du taux sans risque.`,
  definitionContenu:`En zone euro, le taux sans risque de référence est souvent celui des obligations d'État allemandes (Bund) ou françaises (OAT) à court terme.`,
  calculTitre:`🧮 Comment ça se détermine ?`,
  calculContenu:`Ce n'est pas un calcul mais une référence de marché : le taux offert par un emprunteur considéré comme quasiment incapable de faire défaut, sur une durée donnée. Il sert de base de comparaison à tous les autres placements.`,
  pourquoiImportant:`Tout investissement plus risqué (actions, immobilier, obligations d'entreprise) doit en théorie offrir un rendement supérieur au taux sans risque, sinon le risque supplémentaire pris n'est pas rémunéré.`,
  erreurFrequente:`On oublie parfois que "sans risque" ne veut pas dire "sans risque du tout" — même une obligation d'État peut perdre de la valeur avant échéance si les taux montent, ou faire défaut dans des cas extrêmes.`,
  aRetenir:`C’est un repère théorique lié à une devise et à une durée. Compare des horizons et des monnaies comparables avant de juger la rémunération d’un risque.`
},

/* ============ FISCALITÉ FRANÇAISE (variante B) ============ */

{
  id:"flat-tax", categorie:"Fiscalité française", titre:"la Flat tax", variante:"B",
  intro:`Quand tu touches des revenus du capital, le PFU est souvent le mode d’imposition appliqué par défaut. Le barème reste une option à examiner.`,
  definitionContenu:`Une plus-value de 1 000€ réalisée sur un CTO est taxée à 31,4%, soit 314€ d'impôt, quel que soit ton niveau de revenu par ailleurs.`,
  calculTitre:`🧮 Comment ça s'applique ?`,
  calculContenu:`Depuis le 1er janvier 2026, la flat tax standard est passée de 30% à 31,4% : elle se décompose en 12,8% d'impôt sur le revenu (inchangé) et 18,6% de prélèvements sociaux, contre 17,2% auparavant, suite à la hausse de la CSG sur les revenus du capital.`,
  nuance:{titre:`🔀 Toutes les enveloppes ne sont pas concernées`, contenu:`Le PFU de 31,4% concerne notamment les dividendes et plus-values sur CTO. Les produits de l'assurance-vie soumis au taux de prélèvements sociaux de 17,2% suivent des règles spécifiques selon l'ancienneté du contrat et les primes versées. Les revenus immobiliers ne relèvent pas du PFU : ne leur applique pas un taux forfaitaire de 30%.`},
  pourquoiImportant:`Elle simplifie la fiscalité par rapport à l'ancien système, mais elle s'applique par défaut : si tu es faiblement imposé, il peut être plus avantageux d'opter pour le barème progressif de l'impôt sur le revenu à la place (si ta tranche marginale est inférieure à 12,8%, cette option s'applique alors à tous tes revenus du capital de l'année).`,
  erreurFrequente:`On pense parfois que la flat tax s'applique automatiquement au même taux dans toutes les enveloppes — en réalité, depuis 2026, le taux diffère déjà entre un CTO (31,4%) et une assurance-vie (30%), sans même parler des règles spécifiques du PEA après 5 ans.`,
  aRetenir:`Compare le PFU et l’option pour le barème sur l’ensemble des revenus concernés. L’option ne se décide pas placement par placement.`
},

{
  id:"abattement-pea", categorie:"Fiscalité française", titre:"l'Abattement PEA après 5 ans", variante:"B",
  intro:`Après cinq ans de PEA, les gains peuvent être exonérés d’impôt sur le revenu. Les prélèvements sociaux, eux, restent à prendre en compte.`,
  definitionContenu:`Après 5 ans, les gains retirés d'un PEA sont exonérés d'impôt sur le revenu, mais restent soumis aux prélèvements sociaux. Pour un gain de 10 000€ entièrement soumis au taux de 18,6%, ceux-ci représenteraient 1 860€ ; le taux effectif peut dépendre de la date à laquelle les gains ont été acquis.`,
  calculTitre:`🧮 Comment ça se calcule ?`,
  calculContenu:`La durée de 5 ans se compte à partir de la date d'ouverture du PEA, pas à partir de chaque versement individuel — un versement fait à la 4e année profite déjà de l'avantage dès que le PEA lui-même dépasse 5 ans.`,
  pourquoiImportant:`Cet avantage rend le PEA particulièrement puissant pour un horizon d'investissement long : plus tu le gardes ouvert après 5 ans, plus chaque euro de gain supplémentaire profite de cette fiscalité allégée.`,
  erreurFrequente:`Beaucoup pensent qu'un retrait avant 5 ans fait perdre tous les avantages du PEA de façon définitive — en réalité, cela clôture simplement le PEA (avec quelques exceptions), ce qui n'empêche pas d'en ouvrir un autre plus tard, mais sans conserver l'ancienneté acquise.`,
  aRetenir:`Après cinq ans, l’exonération d’impôt sur le revenu ne supprime pas les prélèvements sociaux sur les gains. Garde les deux notions distinctes.`
},

{
  id:"prelevements-sociaux", categorie:"Fiscalité française", titre:"les Prélèvements sociaux", variante:"B",
  intro:`Un placement peut échapper à l’impôt sur le revenu tout en restant soumis aux prélèvements sociaux. Les deux calculs sont distincts.`,
  definitionContenu:`Un gain de 5 000€ sur un CTO ou un PEA de moins de 5 ans est taxé à 18,6% de prélèvements sociaux, soit 930€ — contre 17,2% (860€) si ce même gain provient d'une assurance-vie, qui a gardé l'ancien taux.`,
  calculTitre:`🧮 Comment ça s'applique ?`,
  calculContenu:`Les prélèvements sociaux regroupent notamment la CSG, la CRDS et le prélèvement de solidarité. Leur mode de perception dépend du revenu et de l'enveloppe : certains sont prélevés par l'établissement financier, d'autres calculés lors de la déclaration.`,
  nuance:{titre:`🔀 18,6% ou 17,2% selon l'enveloppe`, contenu:`Depuis la hausse de la CSG au 1er janvier 2026, le taux général est passé de 17,2% à 18,6% pour la plupart des revenus financiers (CTO, PEA, PER, crypto). L'assurance-vie, les PEL/CEL/PEP et les revenus immobiliers (loyers, plus-values immobilières) ont été explicitement exclus de cette hausse et restent à 17,2%.`},
  pourquoiImportant:`Contrairement à l'impôt sur le revenu, les prélèvements sociaux s'appliquent presque toujours, même dans les enveloppes les plus avantageuses fiscalement comme le PEA après 5 ans — c'est rarement ce taux qu'on peut réduire.`,
  erreurFrequente:`On présente parfois une enveloppe comme "totalement exonérée d'impôt" en oubliant les prélèvements sociaux, qui restent dus dans la quasi-totalité des cas — le Livret A fait figure d'exception.`,
  aRetenir:`Avant de calculer ton gain net, identifie l’enveloppe et la date concernées : le taux applicable peut différer selon le placement.`
},

{
  id:"plus-value-imposable", categorie:"Fiscalité française", titre:"la Plus-value imposable", variante:"B",
  intro:`Tu vends un titre 120 € après l’avoir acheté 100 € : la somme imposable part du gain de 20 €, pas des 120 € reçus.`,
  definitionContenu:`Si tu as acheté une action 1 000€ et que tu la revends 1 300€, ta plus-value imposable est de 300€ — c'est uniquement ce gain qui est taxé, pas le montant total de la vente.`,
  calculTitre:`🧮 Comment ça se calcule ?`,
  calculContenu:`Plus-value imposable = Prix de vente − Prix d'achat (frais d'acquisition inclus). En cas de ventes multiples d'un même titre acheté à des prix différents, c'est le prix moyen pondéré d'acquisition (PMP) qui sert de référence, pas le prix du dernier achat.`,
  pourquoiImportant:`Comprendre ce qui est réellement imposé évite de mal anticiper le montant net que tu récupères après une vente — beaucoup surestiment l'impôt en pensant qu'il porte sur le capital total retiré.`,
  erreurFrequente:`Beaucoup pensent être imposés sur la totalité de la somme retirée lors d'une vente, alors que seule la part correspondant au gain (la plus-value) est taxée, le capital initialement investi ne l'étant jamais une seconde fois.`,
  aRetenir:`Si tu revends plusieurs titres achetés à des prix différents, vérifie le prix de revient retenu. L’impôt ne se calcule pas sur tout le montant récupéré.`
},

{
  id:"plus-value-immobiliere", categorie:"Fiscalité française", titre:"la Plus-value immobilière", variante:"B",
  intro:`À la vente d’un bien immobilier, le gain éventuel suit des règles fiscales différentes selon le bien et sa durée de détention.`,
  definitionContenu:`Un bien acheté 200 000€ et revendu 280 000€ dix ans plus tard dégage une plus-value brute de 80 000€, avant application des abattements liés à la durée de détention.`,
  calculTitre:`🧮 Comment ça se calcule ?`,
  calculContenu:`Hors exonération, le taux de base est de 19% d'impôt sur le revenu et 17,2% de prélèvements sociaux. Des abattements distincts s'appliquent à la plus-value imposable selon la durée de détention : exonération d'impôt sur le revenu après 22 ans et de prélèvements sociaux après 30 ans. Une surtaxe peut aussi concerner certaines plus-values élevées.`,
  nuance:{titre:`🔀 Résidence principale`, contenu:`La résidence principale bénéficie d'une exonération totale de plus-value immobilière, quelle que soit la durée de détention, contrairement à un investissement locatif ou une résidence secondaire.`},
  pourquoiImportant:`La durée de détention change radicalement la fiscalité d'une revente immobilière — revendre un an trop tôt ou trop tard peut représenter plusieurs milliers d'euros de différence.`,
  erreurFrequente:`On oublie souvent que les abattements pour durée de détention ne suivent pas le même rythme pour l'impôt sur le revenu (exonéré après 22 ans) que pour les prélèvements sociaux (exonérés après 30 ans) — les deux se calculent séparément.`,
  aRetenir:`Commence par vérifier si la vente bénéficie d’une exonération, notamment pour la résidence principale, avant de calculer les abattements de durée.`
},

{
  id:"halving", categorie:"Crypto", titre:"le Halving", variante:"B",
  intro:`Environ tous les quatre ans, la récompense de création des nouveaux bitcoins est divisée par deux. Ce mécanisme s’appelle le halving.`,
  definitionContenu:`En 2020, la récompense par bloc miné est passée de 12,5 à 6,25 bitcoins ; en 2024, elle est passée à 3,125 bitcoins. Le prochain halving est attendu vers 2028, avec une récompense de 1,5625 bitcoin.`,
  calculTitre:`🧮 Comment ça se déclenche ?`,
  calculContenu:`Le halving se déclenche tous les 210 000 blocs, soit environ tous les quatre ans au rythme moyen prévu par le protocole Bitcoin. Changer cette règle nécessiterait qu'une part suffisante du réseau adopte une autre version du logiciel.`,
  nuance:{titre:`🔀 Pourquoi ce mécanisme existe`, contenu:`Le halving réduit progressivement la création de nouveaux bitcoins. Selon les règles actuelles du protocole, l'offre totale tend vers 21 millions d'unités ; cela ne garantit aucune hausse de leur prix.`},
  pourquoiImportant:`En réduisant le rythme de création de nouveaux bitcoins, le halving diminue la pression vendeuse mécanique des mineurs sur le marché — un facteur souvent cité pour expliquer les cycles de prix historiques du Bitcoin, sans que la causalité soit prouvée avec certitude.`,
  erreurFrequente:`Beaucoup traitent le halving comme un signal d'achat garanti parce qu'il a précédé des hausses de prix par le passé — les performances passées après un halving ne garantissent en rien une répétition du même schéma.`,
  aRetenir:`La quantité de bitcoins nouvellement créés change selon une règle connue à l’avance. La réaction de leur prix, elle, reste imprévisible.`
}

];
