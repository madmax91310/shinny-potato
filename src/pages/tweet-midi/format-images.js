// Renderers load only when the selected format requests a preview or download.
const loaders = {
  'comparatif-etf': async () => {
    const [images, data] = await Promise.all([import('./comparatifEtfImage.js'), import('./data/comparatifEtf.js')])
    return { render: item => images.renderComparatifEtfImage(data.getComparatifEtfTheme(item.themeId)), download: item => images.downloadComparatifEtfImage(data.getComparatifEtfTheme(item.themeId)) }
  },
  'performance-depuis': async () => { const m = await import('./performanceImage.js'); return { render: m.renderPerformanceImage, download: m.downloadPerformanceImage } },
  anniversaire: async () => { const m = await import('./anniversaryImage.js'); return { render: m.renderAnniversaryImage, download: m.downloadAnniversaryImage } },
  'pouvoir-achat': async () => { const m = await import('./purchasingPowerImage.js'); return { render: m.renderPurchasingPowerImage, download: m.downloadPurchasingPowerImage } },
  'fiche-lexique': async () => { const m = await import('./ficheLexiqueImage.js'); return { render: m.renderFicheLexiqueImage, download: m.downloadFicheLexiqueImage } },
}
export async function renderFormatImage(item, ...args) { return (await loaders[item.format]()).render(item, ...args) }
export async function downloadFormatImage(item, ...args) { return (await loaders[item.format]()).download(item, ...args) }
