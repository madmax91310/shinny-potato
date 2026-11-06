// The explicit public projection belongs to the editorial data, never to the source photograph.
export function createEditorialProfile(profile, review) {
  return { ...profile, ...review.publicProfile,
    editorialCreation: { reviewedAt: review.reviewedAt, baseline: review.baseline, finance: review.finance },
  }
}
export function createEditorialContext(context, review) {
  const index = context.evidence.length
  const entries = (texts, prior, question = false) => texts.map(text => prior.find(p => p.text === text) || {
    text, ...(question && { origin: 'editorial' }), evidence: [index],
    creation: true, adaptedFrom: prior,
  })
  return { ...context, budget: { ...context.budget, ...review.budget },
    paragraphs: entries(review.paragraphs, context.paragraphs),
    questions: entries(review.questions, context.questions, true),
    budgetQuestion: review.budgetQuestion,
    evidence: [...context.evidence, { basis: 'editorial-preparation', author: 'Création éditoriale', reviewedAt: review.reviewedAt,
      note: review.publicationPolicy, created: review.created, sourceConsultationClaim: false }],
    editorialCreation: review,
  }
}
