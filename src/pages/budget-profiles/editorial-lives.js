// The explicit public projection belongs to the editorial data, never to the source photograph.
export function createEditorialProfile(profile, review) {
  return { ...profile, ...review.publicProfile,
    editorialCreation: { reviewedAt: review.reviewedAt, baseline: review.baseline, finance: review.finance },
  }
}
export function createEditorialContext(context, review) {
  const { paragraphs, questions, evidenceAddition } = review.contextEntries
  return { ...context, budget: { ...context.budget, ...review.budget },
    paragraphs, questions, budgetQuestion: review.budgetQuestion,
    evidence: [...context.evidence, evidenceAddition], editorialCreation: review,
  }
}
