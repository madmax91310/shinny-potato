// Pure projections: the imported source photographs are never mutated.
export function prepareBudgetProfile(profile, review) {
  if (!review.financialChange) return profile
  const replacement = review.profileOverrides || {}
  const expenses = (replacement.expenses || profile.expenses).flatMap(row => {
    const split = review.expenseReplacements?.find(item => item.label === row.label)
    if (split) return split.rows.map(({ label, amount, category, periodicity }) => ({ label, amount, category, ...(periodicity && { periodicity }) }))
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
    adaptedFrom: originals.map(item => review.reliability ? structuredClone(item) : ({ text: item.text, evidence: item.evidence, ...(item.origin && { origin: item.origin }) })),
  }) ?? originals
  return { ...context, budget: { ...context.budget, ...patch.budget },
    budgetQuestion: patch.budgetQuestion ?? context.budgetQuestion,
    ...(patch.budgetQuestion && patch.budgetQuestion !== context.budgetQuestion && { budgetQuestionHistory: [...(context.budgetQuestionHistory || []), { before: context.budgetQuestion, after: patch.budgetQuestion, origin: 'editorial', reviewedAt: review.reviewedAt, evidence: [index] }] }),
    paragraphs: adaptation(patch.paragraphs, context.paragraphs), questions: adaptation(patch.questions, context.questions, true),
    evidence: [...context.evidence, { basis: 'editorial-preparation', author: 'Préparation éditoriale', reviewedAt: review.reviewedAt,
      note: review.reliability ? 'Réexamen du périmètre et adaptation aux lecteurs. Les vérifications de sources, inconnues et hypothèses restent distinctes dans la revue ; aucun complément n’est attribué comme déclaration authentique.' : 'Adaptation éditoriale à partir de la photographie conservée et des hypothèses autorisées. Aucun complément attribué comme une déclaration de la personne ; aucune nouvelle consultation de source revendiquée.',
      ...(review.reliability && { sourceChecks: review.reliability.sourceChecks }) }] }
}

// Layer the new review over the delivered preparation, without rewriting either photograph.
export function reviseCompletionReview(previous, revision) {
  if (!revision) return previous
  const { additions = [], removeAdditions = [], updateAdditions = {}, public: publication, ...rest } = revision
  const mergedPublic = { ...previous.public, ...publication,
    budget: { ...previous.public?.budget, ...publication?.budget },
    display: { ...previous.public?.display, ...publication?.display } }
  return { ...previous, ...rest, additions: [...previous.additions.filter(row => !removeAdditions.includes(row.label)).map(row => ({ ...row, ...updateAdditions[row.label] })), ...additions],
    profileOverrides: { ...previous.profileOverrides, ...revision.profileOverrides },
    public: mergedPublic, reliability: { ...revision, baseline: '1d41c6f12d4d30a6b2ba828ffaaf4f8153da1048' } }
}

export const budgetFinancialReference = profile => JSON.stringify([profile.currency || 'EUR',
  ...['income', 'expenses', 'savings'].map(key => profile[key].map(row => [row.label, row.amount === null ? null : Math.round(row.amount * 100)])), profile.capacity, ...(profile.editorialCreation?.finance?.length ? [profile.editorialCreation.finance] : [])])
export const staleBudgetText = record => record.edited && record.textFinance !== budgetFinancialReference(record.profile)
