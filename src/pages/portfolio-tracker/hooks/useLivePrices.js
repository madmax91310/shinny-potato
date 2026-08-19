import { useEffect, useRef, useState } from 'react'
import { fetchCryptoPrices } from '../lib/coingecko'
import { fetchStockQuote } from '../lib/twelvedata'
import { tickerToCoingeckoId } from '../lib/coingeckoIds'
import { storage } from '../lib/storage'

const CRYPTO_INTERVAL_MS = 60 * 1000
const STOCK_TICK_MS = 7.5 * 1000 // 8 requêtes/minute max (tier gratuit Twelve Data)
const STOCK_COOLDOWN_MS = 65 * 1000 // pause après un dépassement de quota

// Regroupe le suivi des prix crypto (CoinGecko) et actions/ETF (Twelve Data).
// Retourne une map { [positionId]: { price, source: 'live', updatedAt } } fusionnée
// avec les prix manuels gérés côté positions, plus l'état des erreurs API.
export function useLivePrices(positions, twelveDataApiKey) {
  const cryptoTickersKey = positions.filter((p) => p.type === 'crypto').map((p) => p.ticker).join(',')
  const stockTickersKey = positions
    .filter((p) => p.type === 'stock' || p.type === 'etf')
    .map((p) => p.ticker)
    .join(',')

  const [livePrices, setLivePrices] = useState(() => storage.getLastPrices())
  const [cryptoStatus, setCryptoStatus] = useState({ error: null, loading: false })
  const [stockStatus, setStockStatus] = useState({ error: null, loading: false, quotaExceeded: false })

  const positionsRef = useRef(positions)
  positionsRef.current = positions

  const applyPrice = (positionId, price) => {
    setLivePrices((prev) => {
      const next = { ...prev, [positionId]: { price, source: 'live', updatedAt: new Date().toISOString() } }
      storage.setLastPrices(next)
      return next
    })
  }

  // --- Crypto : un seul appel groupé toutes les 60s ---
  useEffect(() => {
    let cancelled = false

    async function tick() {
      const cryptoPositions = positionsRef.current.filter((p) => p.type === 'crypto')
      if (cryptoPositions.length === 0) return

      const idToPositions = new Map()
      for (const p of cryptoPositions) {
        const id = tickerToCoingeckoId(p.ticker)
        if (!idToPositions.has(id)) idToPositions.set(id, [])
        idToPositions.get(id).push(p.id)
      }

      setCryptoStatus((s) => ({ ...s, loading: true }))
      try {
        const prices = await fetchCryptoPrices([...idToPositions.keys()])
        if (cancelled) return
        for (const [cgId, positionIds] of idToPositions.entries()) {
          if (typeof prices[cgId] !== 'number') continue
          for (const positionId of positionIds) applyPrice(positionId, prices[cgId])
        }
        setCryptoStatus({ error: null, loading: false })
      } catch (err) {
        if (cancelled) return
        setCryptoStatus({ error: err.message, loading: false })
      }
    }

    tick()
    const interval = setInterval(tick, CRYPTO_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [cryptoTickersKey])

  // --- Actions/ETF : file d'attente échelonnée (8 req/min max) ---
  const queueIndexRef = useRef(0)
  const cooldownUntilRef = useRef(0)

  useEffect(() => {
    if (!twelveDataApiKey) {
      setStockStatus({ error: null, loading: false, quotaExceeded: false })
      return
    }

    let cancelled = false

    async function tick() {
      const stockPositions = positionsRef.current.filter((p) => p.type === 'stock' || p.type === 'etf')
      if (stockPositions.length === 0) return

      if (Date.now() < cooldownUntilRef.current) return

      const symbols = [...new Set(stockPositions.map((p) => p.ticker))]
      const index = queueIndexRef.current % symbols.length
      queueIndexRef.current += 1
      const symbol = symbols[index]

      setStockStatus((s) => ({ ...s, loading: true }))
      try {
        const price = await fetchStockQuote(symbol, twelveDataApiKey)
        if (cancelled) return
        for (const p of stockPositions) {
          if (p.ticker === symbol) applyPrice(p.id, price)
        }
        setStockStatus({ error: null, loading: false, quotaExceeded: false })
      } catch (err) {
        if (cancelled) return
        if (err.quotaExceeded) {
          cooldownUntilRef.current = Date.now() + STOCK_COOLDOWN_MS
          setStockStatus({
            error: "Quota Twelve Data dépassé (8 requêtes/min). Dernier prix connu conservé, nouvel essai bientôt.",
            loading: false,
            quotaExceeded: true,
          })
        } else {
          setStockStatus({ error: err.message, loading: false, quotaExceeded: false })
        }
      }
    }

    tick()
    const interval = setInterval(tick, STOCK_TICK_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [twelveDataApiKey, stockTickersKey])

  return { livePrices, cryptoStatus, stockStatus }
}
