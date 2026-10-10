let pending

export function loadPortfolioBackground() {
  if (!pending) pending = new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => {
      pending = undefined
      reject(new Error('Impossible de charger le décor du visuel. Réessaie.'))
    }
    image.src = `${import.meta.env.BASE_URL}asset-art/approved/portfolio-donut-studio.webp`
  })
  return pending
}
