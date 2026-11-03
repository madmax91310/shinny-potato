// Pure projections: the imported source photographs are never mutated.
export function prepareBudgetProfile(profile, review) {
  if (!review.financialChange) return profile
  const replacement = review.profileOverrides || {}
  const expenses = (replacement.expenses || profile.expenses).map(row => {
    const correction = review.expenseCorrections?.find(item => item.label === row.label)
    return correction ? { ...row, amount: correction.amount } : row
  })
  return { ...profile, ...replacement, kind: 'prepared', approximate: true, capacity: null,
    caveat: `Version préparée : ${review.conclusion}`,
    incomeNote: review.public?.budget?.incomeNote ?? profile.incomeNote,
    context: review.public?.paragraphs?.join('\n\n') ?? profile.context,
    expenses: [...expenses, ...review.additions.map(({ label, amount, category, periodicity }) => ({ label, amount, category, periodicity }))],
    savings: review.savingsPlan ?? profile.savings,
    completion: { reviewedAt: review.reviewedAt, sourceKind: profile.kind, forecast: !!review.forecast, sourceRevision: '91b0c4d2e' } }
}

export function prepareBudgetContext(context, review) {
  const patch = review.public
  if (!patch) return context
  const index = context.evidence.length
  const adaptation = (texts, originals, question = false) => texts?.map(text => originals.find(item => item.text === text) || {
    text, ...(question && { origin: 'editorial' }),
    evidence: [...new Set([...originals.flatMap(item => item.evidence), index])],
    adaptedFrom: originals.map(item => ({ text: item.text, evidence: item.evidence, ...(item.origin && { origin: item.origin }) })),
  }) ?? originals
  return { ...context, budget: { ...context.budget, ...patch.budget },
    paragraphs: adaptation(patch.paragraphs, context.paragraphs), questions: adaptation(patch.questions, context.questions, true),
    evidence: [...context.evidence, { basis: 'editorial-preparation', author: 'Préparation éditoriale', reviewedAt: review.reviewedAt,
      note: 'Adaptation éditoriale à partir de la photographie conservée et des hypothèses autorisées. Aucun complément attribué comme une déclaration de la personne ; aucune nouvelle consultation de source revendiquée.' }] }
}

export const budgetFinancialReference = profile => JSON.stringify([profile.currency || 'EUR',
  ...['income', 'expenses', 'savings'].map(key => profile[key].map(row => [row.label, row.amount === null ? null : Math.round(row.amount * 100)])), profile.capacity])
export const staleBudgetText = record => record.edited && record.textFinance !== budgetFinancialReference(record.profile)
