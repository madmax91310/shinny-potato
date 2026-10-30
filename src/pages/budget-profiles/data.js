import preparedLotTwo from './prepared-profiles-lot-2-2026-10-30.json' with { type: 'json' }
import preparedProfiles from './prepared-profiles-2026-10-30.json' with { type: 'json' }
import additionalProfiles from './additional-profiles-2026-10-30.json' with { type: 'json' }

// Témoignages publics, contrôlés le 30/10/2026. Les dates décrivent les
// publications, pas une actualisation des budgets des personnes.
// Les blocs historiques conservent les données déclarées. Les imports prepared
// portent les compléments autorisés et leur provenance, séparés des observations.
// Les prénoms fictifs du texte sont déclarés dans BUDGET_EDITORIAL.
export const BUDGET_PROFILES = [
  {
    id: 'reddit-actif-2026-09-27', name: 'Un actif', age: null, job: '', location: '',
    household: 'Situation familiale non précisée', kind: 'declared', approximate: true,
    publishedAt: '2026-09-27', checkedAt: '2026-10-30', period: 'Septembre 2026',
    source: { publisher: 'Reddit · r/VosSous', title: 'Quel est le choix le plus judicieux', url: 'https://www.reddit.com/r/VosSous/comments/1wrad88/quel_est_le_choix_le_plus_judicieux/' },
    incomeBasis: 'Net après impôt', incomeNote: 'Revenu annoncé autour de 1 600 €, variable de ± 200 €.',
    income: [{ label: 'Revenu net après impôt', amount: 1600 }],
    expenses: [
      { label: 'Loyer, charges et courses', amount: 750, category: 'housing' },
      { label: 'Téléphone', amount: 8, category: 'bills' },
      { label: 'Assurance automobile', amount: 35, category: 'transport' },
      { label: 'Carburant', amount: 200, category: 'transport' },
      { label: 'Sorties et loisirs', amount: 300, category: 'leisure' },
    ],
    savings: [], capacity: 300,
    context: 'La personne prépare un changement de travail et se demande si elle doit remplacer sa voiture de 2005. Elle déclare disposer de 5 000 € sur un Livret A.',
    caveat: 'Les dépenses sont celles de son budget déclaré. Le poste logement inclut les courses : il reste groupé. La capacité annoncée est arrondie ; le solde calculé ne prouve pas une épargne réalisée.',
    hook: 'Environ 1 600 € nets, une voiture de 2005 et un changement de travail à préparer. Voici son budget 👇',
    question: 'Tu garderais la voiture tant qu’elle roule ou tu préparerais déjà son remplacement ?',
  },
  {
    id: 'reddit-couple-nord-2026-07-09', name: 'Un couple dans le Nord', age: null, job: '', location: 'Agglomération lilloise',
    household: 'Deux adultes · un enfant pendant les vacances', kind: 'planned', approximate: true,
    publishedAt: '2026-07-09', checkedAt: '2026-10-30', period: 'Juillet 2026',
    source: { publisher: 'Reddit · r/VosSous', title: 'Reprise en main des finances après avoir touché le fond', url: 'https://www.reddit.com/r/VosSous/comments/1urtc6n/reprise_en_main_des_finances_apr%C3%A8s_avoir_touch%C3%A9/' },
    incomeBasis: 'Ressources du foyer', incomeNote: 'Budget proposé par l’autrice dans ses réponses, après une période de découvert.',
    income: [{ label: 'Ressources mensuelles du couple', amount: 2464 }],
    expenses: [
      { label: 'Charges fixes regroupées', amount: 1367, category: 'bills' },
      { label: 'Courses, hygiène et trois chats', amount: 500, category: 'food' },
      { label: 'Provision pour les trajets familiaux', amount: 150, category: 'transport' },
    ],
    savings: [{ label: 'Épargne de sécurité prévue', amount: 100 }], capacity: null,
    context: 'L’autrice propose 100 € d’épargne de sécurité et une réserve de 150 € pour les trajets en train liés aux vacances de son enfant. Après ces enveloppes, elle prévoit une marge de 347 € pour la santé, les loisirs et les autres dépenses.',
    caveat: 'Budget prévisionnel explicitement proposé dans les commentaires de l’autrice. Les charges fixes restent regroupées : leur détail arrondi exclut certains crédits et ne permet pas une ventilation intégrale. Les 150 € sont une provision pour une dépense future, pas une épargne de long terme. Les 347 € sont une marge, pas une dépense attestée.',
    hook: 'Après des mois de découvert, ce couple essaie de repartir avec un budget de 2 464 € par mois 👇',
    question: 'Tu prévois une enveloppe chaque mois pour les dépenses qui ne tombent que quelques fois par an ?',
  },
  {
    id: 'reddit-salarie-26-2026-01-04', name: 'Un salarié de 26 ans', age: 26, job: 'Premier CDI', location: '',
    household: 'Hébergé chez ses parents', kind: 'planned', approximate: true,
    publishedAt: '2026-01-04', checkedAt: '2026-10-30', period: 'Janvier 2026',
    source: { publisher: 'Reddit · r/VosSous', title: 'Plan finance pour mon profil ?', url: 'https://www.reddit.com/r/VosSous/comments/1q3tkwk/plan_finance_pour_mon_profil/' },
    incomeBasis: 'Net déclaré · impôt non précisé', incomeNote: 'Première paie reçue ; les dépenses et la capacité d’épargne constituent un budget prévu.',
    income: [{ label: 'Salaire net déclaré', amount: 1700 }],
    expenses: [
      { label: 'Assurance automobile', amount: 95, category: 'transport' },
      { label: 'Carburant', amount: 130, category: 'transport' },
      { label: 'Salle de sport', amount: 40, category: 'leisure' },
      { label: 'Abonnements', amount: 10, category: 'bills' },
      { label: 'Courses et provisions', amount: 170, category: 'food' },
      { label: 'Loisirs', amount: 50, category: 'leisure' },
    ],
    savings: [], capacity: 1200,
    context: 'La personne vient de recevoir sa première paie et vit encore chez ses parents. Elle déclare 8 000 € sur un Livret A et souhaite atteindre 10 000 € de réserve avant d’investir.',
    caveat: 'Les six lignes totalisent 495 €, arrondis à 500 € par l’auteur. Aucun loyer n’est ajouté. Le solde de 1 205 € est calculé ; les 1 200 € sont une capacité envisagée, pas un versement attesté.',
    hook: '1 700 € nets pour un premier CDI, avec un logement chez ses parents. Voici le budget qu’il prévoit 👇',
    question: 'Tu profiterais de cette période pour constituer une réserve ou préparer un départ de chez tes parents ?',
  },
  // Source primaire datée dans source ; contrôle du 30/10/2026, confiance déclarative.
  {
    "age": 28,
    "job": "Ingénieur aéronautique",
    "location": "",
    "household": "Célibataire · sans enfant · propriétaire",
    "kind": "declared",
    "approximate": true,
    "checkedAt": "2026-10-30",
    "incomeBasis": "Net avant impôt",
    "incomeNote": "L’impôt de 260 € figure dans les dépenses. Voyages, activités, restaurants et cadeaux sont mensualisés.",
    "savings": [
      {
        "label": "Versement PEA au budget",
        "amount": 408,
        "category": "other"
      }
    ],
    "capacity": null,
    "id": "finary-ingenieur-aero-2025-11-30",
    "name": "Un ingénieur aéronautique",
    "publishedAt": "2025-11-30",
    "period": "Novembre 2025",
    "source": {
      "publisher": "Forum Finary",
      "title": "Optimisation des charges fixes (50/30/20)",
      "url": "https://community.finary.com/t/optimisation-des-charges-fixes-50-30-20/32236"
    },
    "income": [
      {
        "label": "Salaire net avant impôt",
        "amount": 3050,
        "category": "other"
      }
    ],
    "expenses": [
      {
        "label": "Crédit immobilier, assurance comprise",
        "amount": 780,
        "category": "housing"
      },
      {
        "label": "Crédit automobile",
        "amount": 150,
        "category": "credit"
      },
      {
        "label": "Assurances habitation et automobile",
        "amount": 120,
        "category": "bills"
      },
      {
        "label": "Charges",
        "amount": 60,
        "category": "housing"
      },
      {
        "label": "Carburant",
        "amount": 100,
        "category": "transport"
      },
      {
        "label": "Courses",
        "amount": 400,
        "category": "food"
      },
      {
        "label": "Internet et téléphone",
        "amount": 67,
        "category": "bills"
      },
      {
        "label": "Impôts",
        "amount": 260,
        "category": "other"
      },
      {
        "label": "Cadeaux mensualisés",
        "amount": 80,
        "category": "other"
      },
      {
        "label": "Santé, coiffeur, cantine et divers",
        "amount": 150,
        "category": "other"
      },
      {
        "label": "Abonnements médias",
        "amount": 35,
        "category": "bills"
      },
      {
        "label": "Salle de sport",
        "amount": 40,
        "category": "leisure"
      },
      {
        "label": "Voyages mensualisés",
        "amount": 100,
        "category": "leisure"
      },
      {
        "label": "Activités mensualisées",
        "amount": 100,
        "category": "leisure"
      },
      {
        "label": "Restaurants mensualisés",
        "amount": 100,
        "category": "food"
      },
      {
        "label": "Shopping",
        "amount": 100,
        "category": "leisure"
      }
    ],
    "context": "Ses dépenses totalisent 2 642 € et son budget prévoit 408 € sur le PEA. Il cherche à comprendre pourquoi il ne parvient pas à appliquer la règle 50/30/20.",
    "caveat": "Budget déclaré, sans contrôle bancaire. Le poste « charges » de 60 € n’est pas détaillé. Les sous-totaux de 2 167 € et 475 € et le versement PEA de 408 € réconcilient exactement le salaire. Les impôts ne sont pas retranchés une deuxième fois.",
    "hook": "3 050 € avant impôt, deux crédits et 408 € sur le PEA chaque mois. Voici le budget de cet ingénieur de 28 ans 👇",
    "question": "Chez toi, quel poste prend le plus de place après le logement ?"
  },
  // Source primaire datée dans source ; contrôle du 30/10/2026, confiance déclarative.
  {
    "age": 22,
    "job": "Alternant en génie civil",
    "location": "",
    "household": "Hébergé chez ses parents",
    "kind": "declared",
    "approximate": true,
    "checkedAt": "2026-10-30",
    "incomeBasis": "Net déclaré · impôt non précisé",
    "incomeNote": "",
    "savings": [
      {
        "label": "Versement mensuel annoncé sur le PEA",
        "amount": 1000,
        "category": "other"
      }
    ],
    "capacity": null,
    "id": "finary-alternant-22-2025-05-15",
    "name": "Un alternant de 22 ans",
    "publishedAt": "2025-05-15",
    "period": "Mai 2025",
    "source": {
      "publisher": "Forum Finary",
      "title": "Conseil / Stratégie patrimoine - Alternant de 22 ans",
      "url": "https://community.finary.com/t/conseil-strategie-patrimoine-alternant-de-22-ans/26062"
    },
    "income": [
      {
        "label": "Salaire déclaré",
        "amount": 1500,
        "category": "other"
      }
    ],
    "expenses": [
      {
        "label": "Participation aux dépenses familiales",
        "amount": 100,
        "category": "housing"
      },
      {
        "label": "Essence, train, assurances et abonnements",
        "amount": 400,
        "category": "transport"
      }
    ],
    "context": "Logé chez ses parents, il parcourt environ 450 km par semaine. Il indique parfois retirer de l’argent de son Livret A pour maintenir les 1 000 € versés sur le PEA : ces versements ne sont donc pas toujours une épargne nouvelle.",
    "caveat": "Les 400 € restent regroupés : essence, train, sport, assurances, musique et autres abonnements ne sont pas ventilés par la source. Le salaire ne précise pas le prélèvement à la source. Un versement financé en partie par un retrait de livret ne constitue pas autant d’épargne nouvelle.",
    "hook": "Il gagne 1 500 € et verse 1 000 € sur son PEA. Mais certains mois, il doit puiser dans son livret pour tenir ce rythme 👇",
    "question": "Tu garderais un versement fixe ou tu l’ajusterais aux dépenses du mois ?"
  },
  // Source primaire datée dans source ; contrôle du 30/10/2026, confiance déclarative.
  {
    "age": 30,
    "job": "Fonctionnaire de l’État · catégorie C",
    "location": "",
    "household": "Propriétaire de son appartement",
    "kind": "declared",
    "approximate": true,
    "checkedAt": "2026-10-30",
    "incomeBasis": "Net moyen 2025 après impôt",
    "incomeNote": "",
    "savings": [],
    "capacity": 622.99,
    "id": "finary-fonctionnaire-30-2025-05-21",
    "name": "Un fonctionnaire de 30 ans",
    "publishedAt": "2025-05-21",
    "period": "Mai 2025",
    "source": {
      "publisher": "Forum Finary",
      "title": "Votre capacité d’épargne · réponse 63",
      "url": "https://community.finary.com/t/votre-capacite-depargne/26044/63"
    },
    "income": [
      {
        "label": "Salaire net moyen après impôt",
        "amount": 2155,
        "category": "other"
      }
    ],
    "expenses": [
      {
        "label": "Remboursement du prêt familial",
        "amount": 650,
        "category": "credit"
      },
      {
        "label": "Courses",
        "amount": 350,
        "category": "food"
      },
      {
        "label": "Énergie",
        "amount": 100.56,
        "category": "housing"
      },
      {
        "label": "Charges de copropriété",
        "amount": 90,
        "category": "housing"
      },
      {
        "label": "Restaurants",
        "amount": 50,
        "category": "food"
      },
      {
        "label": "Dépenses plaisir",
        "amount": 50,
        "category": "leisure"
      },
      {
        "label": "Assurance automobile",
        "amount": 40.44,
        "category": "transport"
      },
      {
        "label": "Carburant",
        "amount": 30,
        "category": "transport"
      },
      {
        "label": "Entretien automobile et contrôle technique",
        "amount": 30,
        "category": "transport"
      },
      {
        "label": "Cadeaux et divers mensualisés",
        "amount": 25,
        "category": "other"
      },
      {
        "label": "Entretien chaudière et climatisation",
        "amount": 25,
        "category": "housing"
      },
      {
        "label": "Assurance habitation",
        "amount": 22.12,
        "category": "housing"
      },
      {
        "label": "Coiffeur",
        "amount": 20,
        "category": "other"
      },
      {
        "label": "Internet fibre",
        "amount": 19.99,
        "category": "bills"
      },
      {
        "label": "Netflix",
        "amount": 13.09,
        "category": "bills"
      },
      {
        "label": "Amazon Prime",
        "amount": 5.83,
        "category": "bills"
      },
      {
        "label": "Téléphone mobile",
        "amount": 4.99,
        "category": "bills"
      },
      {
        "label": "Taxe foncière du parking",
        "amount": 3,
        "category": "housing"
      },
      {
        "label": "Disney+",
        "amount": 1.99,
        "category": "bills"
      }
    ],
    "context": "Il rembourse 650 € par mois à sa famille pour financer son appartement. Son tableau laisse une capacité mensuelle de 622,99 €, avant les vacances, qu’il finance depuis son Livret A. Un versement PEA de 500 € est envisagé, pas présenté comme déjà réalisé.",
    "caveat": "Les 1 532,01 € correspondent au tableau publié. Les vacances ne sont pas mensualisées ; la capacité annuelle ne doit donc pas être présentée comme une épargne nette garantie. La baisse de salaire et l’abonnement sportif évoqués pour plus tard ne sont pas intégrés à cette photographie.",
    "hook": "2 155 € après impôt, un appartement et un prêt familial à rembourser. Voici le budget détaillé de ce fonctionnaire de 30 ans 👇",
    "question": "Tu mensualises aussi les vacances dans ton budget ?"
  },
  // Source primaire datée dans source ; contrôle du 30/10/2026, confiance déclarative.
  {
    "age": 19,
    "job": "Alternant",
    "location": "",
    "household": "Locataire",
    "kind": "declared",
    "approximate": true,
    "checkedAt": "2026-10-30",
    "incomeBasis": "Salaire, APL et bonus déclarés",
    "incomeNote": "Le bonus de 150 € est inclus par l’auteur dans son budget mensuel ; sa régularité n’est pas précisée.",
    "savings": [
      {
        "label": "Versement sur le CTO",
        "amount": 100,
        "category": "other"
      },
      {
        "label": "Versement sur le livret",
        "amount": 50,
        "category": "other"
      }
    ],
    "capacity": null,
    "id": "finary-alternant-19-2025-09-27",
    "name": "Un alternant de 19 ans",
    "publishedAt": "2025-09-27",
    "period": "Septembre 2025",
    "source": {
      "publisher": "Forum Finary",
      "title": "Alternant 19 - Conseil Strat. d’investissement",
      "url": "https://community.finary.com/t/alternant-19-conseil-strat-dinvestissement/30020"
    },
    "income": [
      {
        "label": "Salaire",
        "amount": 770,
        "category": "other"
      },
      {
        "label": "APL",
        "amount": 301,
        "category": "other"
      },
      {
        "label": "Bonus déclaré",
        "amount": 150,
        "category": "other"
      }
    ],
    "expenses": [
      {
        "label": "Loyer",
        "amount": 600,
        "category": "housing"
      },
      {
        "label": "Charges du logement",
        "amount": 45,
        "category": "housing"
      },
      {
        "label": "Courses",
        "amount": 200,
        "category": "food"
      },
      {
        "label": "Loisirs et extras",
        "amount": 160,
        "category": "leisure"
      },
      {
        "label": "Téléphone",
        "amount": 13,
        "category": "bills"
      },
      {
        "label": "iCloud",
        "amount": 2.99,
        "category": "bills"
      }
    ],
    "context": "Son budget prévoit 150 € de placements mensuels, répartis entre 100 € sur CTO et 50 € sur livret. Les 50,01 € restants sont indiqués comme « épargne / reste disponible » par l’auteur ; ils restent ici un solde, sans placement supplémentaire inventé.",
    "caveat": "1 221 € de ressources, 1 020,99 € de dépenses, 150 € de versements et 50,01 € de solde. Le bonus et le traitement fiscal du salaire sont ceux de la déclaration ; aucune régularité supplémentaire n’est déduite. Le solde de 50,01 € n’est pas compté une seconde fois dans les versements.",
    "hook": "À 19 ans, il dispose de 1 221 € avec les aides et prévoit 150 € de placements par mois. Son budget, poste par poste 👇",
    "question": "Avec ce budget, tu répartirais comment les versements entre livret et Bourse ?"
  },
  // Source primaire datée dans source ; contrôle du 30/10/2026, confiance déclarative.
  {
    "age": 35,
    "job": "",
    "location": "",
    "household": "Deux adultes · projet d’enfant",
    "kind": "declared",
    "approximate": true,
    "checkedAt": "2026-10-30",
    "incomeBasis": "Salaires du couple · impôt non précisé",
    "incomeNote": "",
    "savings": [],
    "capacity": null,
    "id": "reddit-couple-35-2025-10-15",
    "name": "Un couple de 35 ans",
    "publishedAt": "2025-10-15",
    "period": "Octobre 2025",
    "source": {
      "publisher": "Reddit · r/VosSous",
      "title": "Besoin de vos avis, conseils ?",
      "url": "https://www.reddit.com/r/VosSous/comments/1o78v4m/"
    },
    "income": [
      {
        "label": "Salaires du couple",
        "amount": 5050,
        "category": "other"
      }
    ],
    "expenses": [
      {
        "label": "Loyer",
        "amount": 1140,
        "category": "housing"
      },
      {
        "label": "Électricité",
        "amount": 57,
        "category": "housing"
      },
      {
        "label": "Transports en commun",
        "amount": 110,
        "category": "transport"
      },
      {
        "label": "Loyers des deux mères à l’étranger",
        "amount": 810,
        "category": "housing"
      },
      {
        "label": "Deux abonnements de sport",
        "amount": 60,
        "category": "leisure"
      },
      {
        "label": "Frais bancaires",
        "amount": 16,
        "category": "bills"
      },
      {
        "label": "Google Drive",
        "amount": 4,
        "category": "bills"
      },
      {
        "label": "Téléphone de l’auteur",
        "amount": 15,
        "category": "bills"
      },
      {
        "label": "Internet",
        "amount": 45,
        "category": "bills"
      },
      {
        "label": "Téléphone de sa femme",
        "amount": 17,
        "category": "bills"
      },
      {
        "label": "Cinéma UGC",
        "amount": 24,
        "category": "leisure"
      },
      {
        "label": "Spotify",
        "amount": 13,
        "category": "bills"
      },
      {
        "label": "Canal+",
        "amount": 38,
        "category": "bills"
      },
      {
        "label": "Leasing automobile",
        "amount": 350,
        "category": "transport"
      },
      {
        "label": "Assurance automobile",
        "amount": 110,
        "category": "transport"
      },
      {
        "label": "Carburant",
        "amount": 200,
        "category": "transport"
      },
      {
        "label": "Courses",
        "amount": 600,
        "category": "food"
      },
      {
        "label": "Achat du téléphone en dix fois",
        "amount": 130,
        "category": "credit"
      },
      {
        "label": "Argent de poche de l’auteur",
        "amount": 200,
        "category": "leisure"
      },
      {
        "label": "Argent de poche de sa femme",
        "amount": 300,
        "category": "leisure"
      },
      {
        "label": "Sorties, restaurants, cafés et musées",
        "amount": 200,
        "category": "leisure"
      }
    ],
    "context": "Le couple souhaite avoir un enfant. Il consacre notamment 810 € par mois au logement de leurs deux mères à l’étranger. Les lignes de leur tableau totalisent 4 439 €, soit un solde de 611 € sur 5 050 € de salaires.",
    "caveat": "Les 611 € sont le reste du tableau, pas une épargne attestée. Les dépenses annuelles et imprévues ne sont pas entièrement détaillées ; aucune réserve fictive n’est ajoutée. L’achat du téléphone de 130 € est temporaire, en dix fois. Les objectifs de baisse des courses évoqués dans les réponses ne remplacent pas les 600 € du tableau initial.",
    "hook": "5 050 € de salaires à deux et 611 € de reste dans leur budget. Ce couple de 35 ans se demande s’il peut accueillir un enfant 👇",
    "question": "Quel poste regarderais-tu en premier pour préparer l’arrivée d’un enfant ?"
  },
  // Source primaire datée dans source ; contrôle du 30/10/2026, confiance déclarative.
  {
    "age": 26,
    "job": "Salarié dans la tech · CDI",
    "location": "",
    "household": "Célibataire · hébergé chez ses parents",
    "kind": "declared",
    "approximate": true,
    "checkedAt": "2026-10-30",
    "incomeBasis": "Net déclaré · impôt non précisé",
    "incomeNote": "",
    "savings": [
      {
        "label": "Versement mensuel sur Livret A",
        "amount": 600,
        "category": "other"
      }
    ],
    "capacity": null,
    "id": "reddit-tech-26-2026-02-06",
    "name": "Un salarié dans la tech",
    "publishedAt": "2026-02-06",
    "period": "Février 2026",
    "source": {
      "publisher": "Reddit · r/VosSous",
      "title": "[26 ans - CDI] Grand ménage dans les banques et correction de mes erreurs",
      "url": "https://www.reddit.com/r/VosSous/comments/1qxm6ev/26_ans_cdi_grand_m%C3%A9nage_dans_les_banques_et/"
    },
    "income": [
      {
        "label": "Salaire net déclaré",
        "amount": 1900,
        "category": "other"
      }
    ],
    "expenses": [
      {
        "label": "Participation aux dépenses des parents",
        "amount": 400,
        "category": "housing"
      },
      {
        "label": "Abonnements regroupés",
        "amount": 70,
        "category": "bills"
      },
      {
        "label": "Enveloppe de dépenses courantes",
        "amount": 600,
        "category": "other"
      }
    ],
    "context": "Il sépare 470 € de dépenses fixes, environ 600 € virés pour les dépenses courantes et 600 € versés sur Livret A. Avec ces montants arrondis, 230 € restent sur le compte courant pour des achats et prélèvements éventuels : ils ne sont pas présentés comme une épargne supplémentaire.",
    "caveat": "Budget déclaré en montants approximatifs. Le détail des 70 € d’abonnements et des 600 € de dépenses courantes n’est pas publié. Le reliquat de 230 € est arithmétique ; des abonnements et achats en ligne peuvent encore y être prélevés. Les 2,20 € de tenue de compte mentionnés ailleurs ne sont pas ajoutés à nouveau sans savoir s’ils sont déjà inclus.",
    "hook": "1 900 € nets, un logement chez ses parents et 600 € sur Livret A chaque mois. Voici comment il organise son budget 👇",
    "question": "Tu préfères une enveloppe globale pour le quotidien ou un montant par catégorie ?"
  },
  // Source primaire datée dans source ; contrôle du 30/10/2026, confiance déclarative.
  {
    "age": 20,
    "job": "Alternant",
    "location": "",
    "household": "Logé et nourri chez ses parents",
    "kind": "planned",
    "approximate": true,
    "checkedAt": "2026-10-30",
    "incomeBasis": "Net déclaré · impôt non précisé",
    "incomeNote": "",
    "savings": [
      {
        "label": "Livret A",
        "amount": 250,
        "category": "other"
      },
      {
        "label": "PEA",
        "amount": 110,
        "category": "other"
      },
      {
        "label": "Bricks",
        "amount": 100,
        "category": "other"
      },
      {
        "label": "Cryptomonnaies",
        "amount": 40,
        "category": "other"
      }
    ],
    "capacity": null,
    "id": "reddit-alternant-20-2025-09-03",
    "name": "Un alternant de 20 ans",
    "publishedAt": "2025-09-03",
    "period": "Septembre 2025",
    "source": {
      "publisher": "Reddit · r/VosSous",
      "title": "Gestion de mon budget",
      "url": "https://www.reddit.com/r/VosSous/comments/1n71114/"
    },
    "income": [
      {
        "label": "Salaire déclaré",
        "amount": 900,
        "category": "other"
      }
    ],
    "expenses": [
      {
        "label": "Assurance automobile, essence et téléphone",
        "amount": 200,
        "category": "transport"
      },
      {
        "label": "Enveloppe sorties et plaisirs",
        "amount": 200,
        "category": "leisure"
      }
    ],
    "context": "Ses parents assurent le logement et la nourriture, comme il le précise dans les commentaires. Il prévoit 400 € de dépenses et répartit 500 € entre épargne et investissements. Le surplus éventuel de l’enveloppe loisirs doit rejoindre son Livret A.",
    "caveat": "Budget prévu, pas relevé de dépenses constatées. Les 200 € de charges fixes restent regroupés. Le soutien parental explique l’absence de loyer et de courses ; il ne s’agit pas d’un budget autonome à 900 €. Les supports détenus sont décrits, sans recommandation.",
    "hook": "Il touche 900 € et répartit 500 € entre épargne et investissements. Le contexte change tout : ses parents le logent et le nourrissent 👇",
    "question": "Tu profiterais de cette période pour préparer un départ ou investir sur le long terme ?"
  },
  ...additionalProfiles,
  ...preparedProfiles,
  ...preparedLotTwo,

]

export const EXPENSE_CATEGORIES = [
  { id: 'housing', label: 'Logement', emoji: '🏠' },
  { id: 'food', label: 'Courses', emoji: '🛒' },
  { id: 'transport', label: 'Transport', emoji: '🚗' },
  { id: 'bills', label: 'Factures et abonnements', emoji: '📱' },
  { id: 'health', label: 'Santé', emoji: '🩺' },
  { id: 'credit', label: 'Crédits', emoji: '💳' },
  { id: 'leisure', label: 'Loisirs', emoji: '🍿' },
  { id: 'other', label: 'Autres dépenses', emoji: '🧾' },
]

// Prénoms fictifs et mise en récit éditoriale des témoignages ci-dessus.
// Les montants et situations restent ceux des sources ; aucune identité réelle
// n'est déduite. Une ventilation incomplète conserve tous les postes groupés.
export const BUDGET_EDITORIAL = {
  'reddit-actif-2026-09-27': {
    alias: 'Camille',
    assets: ['5 000 € sur un Livret A'],
    story: 'Camille prépare un changement de travail et se demande s’il faut remplacer sa voiture de 2005.',
  },
  'reddit-couple-nord-2026-07-09': {
    alias: 'Julie et Alex',
    incomeNote: '',
    goal: 'Reprendre la main sur leur budget après une période de découvert et constituer une réserve de sécurité.',
    note: 'La marge restante doit encore couvrir la santé, les loisirs et les autres dépenses.',
  },
  'reddit-salarie-26-2026-01-04': {
    alias: 'Thomas',
    incomeNote: '',
    assets: ['8 000 € sur un Livret A'],
    story: 'Thomas vient de recevoir sa première paie.',
    goal: 'Atteindre 10 000 € de réserve avant de commencer à investir.',
  },
  'finary-ingenieur-aero-2025-11-30': {
    alias: 'Mathieu',
    goal: 'Comprendre comment rapprocher son budget de la règle 50/30/20.',
  },
  'finary-alternant-22-2025-05-15': {
    alias: 'Lucas',
    story: 'Lucas parcourt environ 450 km par semaine.',
    note: 'Certains mois, une partie du versement sur le PEA vient du Livret A : ces versements ne sont donc pas intégralement une épargne nouvelle.',
  },
  'finary-fonctionnaire-30-2025-05-21': {
    alias: 'Nicolas',
    goal: 'Il envisage de verser 500 € par mois sur son PEA.',
    note: 'Les vacances ne sont pas comprises dans ces dépenses : elles sont financées depuis le Livret A.',
    essential: ['Remboursement du prêt familial', 'Courses', 'Énergie', 'Charges de copropriété', 'Assurance automobile', 'Carburant', 'Entretien automobile et contrôle technique', 'Entretien chaudière et climatisation', 'Assurance habitation', 'Internet fibre', 'Téléphone mobile', 'Taxe foncière du parking'],
    discretionary: ['Restaurants', 'Dépenses plaisir', 'Cadeaux et divers mensualisés', 'Coiffeur', 'Netflix', 'Amazon Prime', 'Disney+'],
  },
  'finary-alternant-19-2025-09-27': {
    alias: 'Hugo',
    essential: ['Loyer', 'Charges du logement', 'Courses', 'Téléphone'],
    discretionary: ['Loisirs et extras', 'iCloud'],
  },
  'reddit-couple-35-2025-10-15': {
    alias: 'Clara et Louis',
    goal: 'Se donner les moyens d’avoir un enfant.',
    note: 'Le reste du tableau doit encore absorber des dépenses annuelles et des imprévus non entièrement détaillés.',
    essential: ['Loyer', 'Électricité', 'Transports en commun', 'Loyers des deux mères à l’étranger', 'Frais bancaires', 'Téléphone de l’auteur', 'Internet', 'Téléphone de sa femme', 'Leasing automobile', 'Assurance automobile', 'Carburant', 'Courses', 'Achat du téléphone en dix fois'],
    discretionary: ['Deux abonnements de sport', 'Google Drive', 'Cinéma UGC', 'Spotify', 'Canal+', 'Argent de poche de l’auteur', 'Argent de poche de sa femme', 'Sorties, restaurants, cafés et musées'],
  },
  'reddit-tech-26-2026-02-06': {
    alias: 'Maxime',
    note: 'Le solde reste sur le compte courant pour d’éventuels achats et prélèvements : ce n’est pas une épargne supplémentaire.',
  },
  'reddit-alternant-20-2025-09-03': {
    alias: 'Léo',
    story: 'Le surplus éventuel de l’enveloppe loisirs doit rejoindre son Livret A.',
    essential: ['Assurance automobile, essence et téléphone'],
    discretionary: ['Enveloppe sorties et plaisirs'],
  },
  "finary-cyber-24-2026-08-27": {"alias":"Adrien","story":"Il débute dans la cybersécurité au Luxembourg. Son prêt étudiant de 15 000 € commencera à être remboursé dans trois ans."},
  "finary-ingenieur-21-2025-03-08": {"alias":"Bastien","story":"Il étudie en alternance et donne des cours particuliers. Son loyer de 252 € est déjà net d’APL ; l’aide de ses parents fait partie de ses ressources."},
  "finary-alternant-21-2025-05-08": {"alias":"Quentin","story":"Hébergé chez ses parents, il répartit 750 € entre son PEA, les cryptomonnaies et son Livret A. Les 130 € restants ne sont pas affectés dans son témoignage."},
  "finary-locataire-25-2025-11-08": {"alias":"Julien","story":"Il prépare un premier investissement immobilier. Son budget personnel tient compte de sa part du logement et des 660 € de remboursement du prêt étudiant."},
  "finary-batiment-21-2025-09-30": {"alias":"Antoine","story":"Son logement est gratuit pendant les deux prochaines années. Les montants proviennent de sa répartition déclarée de tout le salaire ; l’alimentation n’est pas détaillée séparément."},
  "finary-etudiant-20-2025-03-19": {"alias":"Simon","story":"Il prépare son entrée en alternance en septembre 2025. Il prévoit de participer aux dépenses de son père à hauteur de 300 € et de consacrer 100 € aux extras."},
  "finary-celibataire-31-2026-02-03": {"alias":"Sébastien","story":"Il verse 375 € sur son PEA et 250 € sur son Livret A. Il indique consacrer le reste aux dépenses courantes : l’enveloppe de 895 € est calculée, pas mesurée sur ses comptes."},
  "finary-frontalier-37-2025-06-30": {"alias":"Paul","story":"Il travaille au Luxembourg et possède sa résidence principale à Thionville. Il annonce environ 1 800 € restant après ses versements ; le calcul donne 1 808 € avec les montants arrondis publiés."},
  "finary-bois-18-2025-10-16": {"alias":"Enzo","story":"Il prépare son premier appartement. Son budget moyen de 1 373 € est une prévision : selon les fourchettes de loyer et de courses, les dépenses iraient de 1 223 à 1 523 €."},
  "mustachian-ingenieur-28-2025-08-16": {"alias":"Romain","story":"Ses ressources moyennes comprennent aussi des ventes de cartes, des dividendes et un héritage. Il annonce environ 3 750 CHF d’épargne moyenne ; les dépenses arrondies donnent un reste de 3 749 CHF. Cet écart de 1 CHF vient du tableau de moyennes, sans dépense ajoutée pour le masquer."},
}

// Versions préparées : provenance et hypothèses conservées dans le registre.
for (const profile of preparedProfiles) BUDGET_EDITORIAL[profile.id] = { alias: profile.name, story: profile.context }

for (const profile of preparedLotTwo) BUDGET_EDITORIAL[profile.id] = { alias: profile.name, story: profile.context }
