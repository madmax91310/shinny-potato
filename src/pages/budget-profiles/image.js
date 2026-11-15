import { renderSocialBudgetImages, renderBudgetOverview } from './socialImage.js'

export async function renderBudgetImages(profile, mode = 'social') {
  return mode === 'overview' ? [await renderBudgetOverview(profile)] : renderSocialBudgetImages(profile, mode)
}
export async function renderBudgetImage(profile, mode = 'social') {
  const pages = await renderBudgetImages(profile, mode)
  pages[0].budgetPages = pages
  return pages[0]
}
