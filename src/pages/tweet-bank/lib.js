// Logique pure de la Banque de tweets — filtre/tri/cooldown, testable sans React. La persistance
// (localStorage) vit dans App.jsx, pas ici : lire/écrire le navigateur n'est pas une fonction pure.
import { COOLDOWN_DAYS } from "./data"

export function daysSince(dateStr) {
  const then = new Date(dateStr + "T00:00:00")
  const now = new Date()
  const ms = now.setHours(0, 0, 0, 0) - then.setHours(0, 0, 0, 0)
  return Math.round(ms / 86400000)
}

export function todayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function isInCooldown(lastPublished) {
  return !!lastPublished && daysSince(lastPublished) < COOLDOWN_DAYS
}

// Retourne null si jamais publié (pas de badge à afficher), sinon le statut + le texte du badge —
// même seuil que isInCooldown, jamais recalculé séparément.
export function publicationBadge(lastPublished) {
  if (!lastPublished) return null
  const days = daysSince(lastPublished)
  if (days < COOLDOWN_DAYS) {
    return { status: "cooldown", label: `Publié il y a ${days} j · encore ${COOLDOWN_DAYS - days} j de repos` }
  }
  return { status: "available", label: `Publié il y a ${days} j · disponible` }
}

// filters: { month, category, format, search, hideCooldown, sortByAge }, tous optionnels ("Tous"/
// "Toutes"/"" = pas de filtre actif). lastPub: { [id]: "AAAA-MM-JJ" }.
export function filterAndSortTweets(tweets, lastPub, filters) {
  let list = tweets.filter((t) => {
    if (filters.month && filters.month !== "Tous" && t.month !== filters.month) return false
    if (filters.category && filters.category !== "Toutes" && t.category !== filters.category) return false
    if (filters.format && filters.format !== "Tous" && !(t.formats || []).includes(filters.format)) return false
    if (filters.hideCooldown && isInCooldown(lastPub[t.id])) return false
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase()
      if (!t.text.toLowerCase().includes(q)) return false
    }
    return true
  })
  if (filters.sortByAge) {
    // Jamais publiés d'abord (pour épuiser le stock avant de répéter), puis les plus anciennement
    // publiés en premier — jamais un ordre aléatoire, pour rester reproductible d'un rendu à l'autre.
    list = list.slice().sort((a, b) => {
      const pa = lastPub[a.id]
      const pb = lastPub[b.id]
      if (!pa && !pb) return a.id - b.id
      if (!pa) return -1
      if (!pb) return 1
      return new Date(pa) - new Date(pb)
    })
  }
  return list
}

export function countAvailable(tweets, lastPub) {
  return tweets.filter((t) => !isInCooldown(lastPub[t.id])).length
}
