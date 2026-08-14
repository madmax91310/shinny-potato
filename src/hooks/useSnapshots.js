import { useCallback, useEffect, useState } from 'react'
import { storage } from '../lib/storage'

const MIN_INTERVAL_MS = 30 * 60 * 1000 // n'enregistre pas plus d'un snapshot toutes les 30 min

export function useSnapshots(totalValue, ready) {
  const [snapshots, setSnapshots] = useState(() => storage.getSnapshots())

  const recordSnapshot = useCallback((value) => {
    setSnapshots((prev) => {
      const last = prev[prev.length - 1]
      const now = Date.now()
      if (last && now - new Date(last.date).getTime() < MIN_INTERVAL_MS) {
        return prev
      }
      const next = [...prev, { date: new Date(now).toISOString(), value }]
      storage.setSnapshots(next)
      return next
    })
  }, [])

  // Enregistre un snapshot au chargement (une fois que le portefeuille a une valeur exploitable)
  // puis toutes les 30 minutes tant que l'app reste ouverte.
  useEffect(() => {
    if (!ready) return
    recordSnapshot(totalValue)
    const interval = setInterval(() => recordSnapshot(totalValue), MIN_INTERVAL_MS)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return { snapshots, recordSnapshot }
}
