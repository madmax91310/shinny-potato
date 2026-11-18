import { renderSocialBudgetImage } from './socialImage.js'

export const renderBudgetImage = renderSocialBudgetImage
export async function renderBudgetImages(profile) {
  return [await renderBudgetImage(profile)]
}
