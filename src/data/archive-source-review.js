// Revue du reliquat de la PR #148. Une tentative de recherche ne constitue pas une source.
// Les dates héritées sont conservées, mais ne sont pas recertifiées par reviewedAt.
export const ARCHIVE_SOURCE_REVIEW = [
  {
    "id": "msci-usa",
    "key": "legacy-undated",
    "sourceStatus": "archive-unverifiable",
    "sourceReason": "527 titres figurent dans la publication MSCI au 31/08/2026, déjà conservée séparément. La date de la valeur héritée est absente : une égalité de comptage ne permet pas de dater cette archive.",
    "reviewedAt": "2026-09-30"
  },
  {
    "id": "msci-em-asia-screened",
    "key": "legacy-undated",
    "sourceStatus": "archive-unverifiable",
    "sourceReason": "La fiche MSCI actuelle confirme le périmètre de huit pays. L’ancienne entrée ne conserve ni comptage ni photographie datée ; le périmètre méthodologique ne reconstitue pas sa source historique.",
    "reviewedAt": "2026-09-30"
  },
  {
    "id": "msci-em-latin-america",
    "key": "legacy-undated",
    "sourceStatus": "archive-unverifiable",
    "sourceReason": "L’ancienne description attribue à PALAT le MSCI Latin America standard. La fiche Amundi rattache PALAT à la variante Selection 20/35 % Capped, conservée séparément. Cette ancienne attribution ne peut pas être recertifiée.",
    "reviewedAt": "2026-09-30"
  },
  {
    "id": "msci-india",
    "key": "legacy-undated",
    "sourceStatus": "archive-unverifiable",
    "sourceReason": "L’ancienne entrée décrit uniquement un pays et le fonds PINR, sans comptage ni date. La définition actuelle du MSCI India ne permet pas de reconstruire une photographie historique.",
    "reviewedAt": "2026-09-30"
  },
  {
    "id": "msci-em-emea-esg",
    "key": "legacy-undated",
    "sourceStatus": "archive-unverifiable",
    "sourceReason": "L’ancienne dénomination ESG Transition est celle du fonds. MSCI rattache actuellement PLEM au EM EMEA ex Egypt ESG Broad CTB Select ; aucune publication de l’ancien périmètre à sa date inconnue n’a été récupérée.",
    "reviewedAt": "2026-09-30"
  },
  {
    "id": "msci-em-imi",
    "key": "legacy-undated",
    "sourceStatus": "archive-unverifiable",
    "sourceReason": "Le comptage hérité de 3 017 titres est attribué à une recherche MSCI dans Git, sans URL ni date individuelle. Aucun document récupéré ne rattache exactement ce chiffre à la photographie d’origine.",
    "reviewedAt": "2026-09-30"
  },
  {
    "id": "ftse-em",
    "key": "legacy-undated",
    "sourceStatus": "archive-unverifiable",
    "sourceReason": "Les résultats de recherche Vanguard mentionnent 2 290 titres du benchmark en juillet, mais la page ouverte ne conserve pas ce tableau. La date de l’entrée héritée est inconnue ; le résultat de recherche seul ne recertifie pas l’archive.",
    "reviewedAt": "2026-09-30"
  },
  {
    "id": "msci-em-ex-china",
    "key": "legacy-undated",
    "sourceStatus": "archive-unverifiable",
    "sourceReason": "La fiche MSCI ouverte donne 602 titres au 31/08/2026. Des résultats anciens mentionnent 625 sans capture datée conservée ; ils ne prouvent pas la date ni la source de l’entrée héritée.",
    "reviewedAt": "2026-09-30"
  },
  {
    "id": "msci-world-enhanced-value",
    "key": "2026-07-31",
    "sourceStatus": "archive-unverifiable",
    "sourceReason": "Les notes Git mentionnent 401 sans date et 400 en juillet. La publication MSCI consultable donne 400 au 31/08/2026 ; elle ne prouve ni l’archive de juillet ni la photographie de 401 titres.",
    "reviewedAt": "2026-09-30"
  },
  {
    "id": "msci-world-enhanced-value",
    "key": "legacy-undated",
    "sourceStatus": "archive-unverifiable",
    "sourceReason": "Les notes Git mentionnent 401 sans date et 400 en juillet. La publication MSCI consultable donne 400 au 31/08/2026 ; elle ne prouve ni l’archive de juillet ni la photographie de 401 titres.",
    "reviewedAt": "2026-09-30"
  },
  {
    "id": "msci-world-sector-neutral-quality",
    "key": "2026-06-30",
    "sourceStatus": "archive-unverifiable",
    "sourceReason": "Git attribue 301 titres au 30/06/2026 sans URL. La publication MSCI consultable porte le 31/08/2026 ; aucun document de juin ni capture d’archive exploitable n’a été récupéré.",
    "reviewedAt": "2026-09-30"
  },
  {
    "id": "msci-world-growth",
    "key": "legacy-undated",
    "sourceStatus": "archive-unverifiable",
    "sourceReason": "L’ancienne entrée est une description qualitative sans comptage ni date. La méthodologie MSCI actuelle confirme le style croissance, mais ne reconstitue aucune photographie ni source historique.",
    "reviewedAt": "2026-09-30"
  },
  {
    "id": "ftse-all-world-high-dividend-yield",
    "key": "2026-02-27",
    "sourceStatus": "documented",
    "sourceReason": "justETF Research publie explicitement 2 397 constituants au 27/02/2026. Source secondaire ; le PDF FTSE accessible via son lien est daté du 31/12/2025 et ne sert pas de preuve pour février.",
    "reviewedAt": "2026-09-30",
    "url": "https://www.justetf.com/en-be/how-to/dividend-etfs-world.html",
    "checkedAt": "2026-09-30"
  },
  {
    "id": "msci-world-high-dividend-yield-advanced-select",
    "key": "legacy-undated",
    "sourceStatus": "archive-unverifiable",
    "sourceReason": "La fourchette 194–211 mélange un nombre de positions du fonds au 24/08 cité dans Git et un comptage d’indice. justETF indique 211 au 27/02/2026 et MSCI 194 au 31/08/2026 ; ces observations distinctes ne certifient pas une fourchette historique ni sa date.",
    "reviewedAt": "2026-09-30"
  },
  {
    "id": "msci-china-a",
    "key": "2026-07-31",
    "sourceStatus": "archive-unverifiable",
    "sourceReason": "Git attribue 410 titres au 31/07/2026 sans URL. MSCI donne aussi 410 au 31/08/2026 ; le profil BNP trouvé donne des positions du fonds en juillet, pas une preuve du comptage de l’indice.",
    "reviewedAt": "2026-09-30"
  },
  {
    "id": "msci-japan-imi",
    "key": "2026-05-31",
    "sourceStatus": "archive-unverifiable",
    "sourceReason": "Git conserve 957 sans date et cite 960 en mai. Les résultats BlackRock à 960 concernent les positions du fonds. La fiche MSCI actuellement ouverte donne 956 au 31/08/2026 ; le résultat indexé ancien à 960 ne fournit pas une capture de mai exploitable.",
    "reviewedAt": "2026-09-30"
  },
  {
    "id": "msci-japan-imi",
    "key": "legacy-undated",
    "sourceStatus": "archive-unverifiable",
    "sourceReason": "Git conserve 957 sans date et cite 960 en mai. Les résultats BlackRock à 960 concernent les positions du fonds. La fiche MSCI actuellement ouverte donne 956 au 31/08/2026 ; le résultat indexé ancien à 960 ne fournit pas une capture de mai exploitable.",
    "reviewedAt": "2026-09-30"
  },
  {
    "id": "history:ethereum",
    "key": null,
    "sourceStatus": "archive-unverifiable",
    "sourceReason": "Git (307ec46) nomme Fortune pour 2 453,23 USD en août 2026 mais ne conserve pas l’article ni sa convention horaire. L’URL candidate est inaccessible et la recherche du montant exact n’a pas retrouvé l’article. Les autres clôtures annuelles ont plusieurs attributions sans preuve point par point.",
    "reviewedAt": "2026-09-30"
  },
  {
    "id": "history:soxx",
    "key": null,
    "sourceStatus": "archive-unverifiable",
    "sourceReason": "Git (8abc34f) indique une transcription de captures utilisateur, absentes du dépôt, sans fournisseur identifié. Deux points étaient partiellement masqués (2016-12 et 2021-06). Des résultats tiers concordent sur ces deux montants mais ne certifient ni les 128 points ni la convention d’ajustement des splits/dividendes.",
    "reviewedAt": "2026-09-30"
  }
];
