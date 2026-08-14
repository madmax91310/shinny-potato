import { useCallback, useState } from 'react'
import { storage } from '../lib/storage'

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function usePositions() {
  const [positions, setPositions] = useState(() => storage.getPositions())

  const persist = useCallback((next) => {
    setPositions(next)
    storage.setPositions(next)
  }, [])

  const addPosition = useCallback(
    (data) => {
      const position = {
        id: makeId(),
        name: data.name.trim(),
        ticker: data.ticker.trim().toUpperCase(),
        type: data.type,
        quantity: Number(data.quantity),
        buyPrice: Number(data.buyPrice),
        buyDate: data.buyDate,
        manualPrice: null,
        manualPriceUpdatedAt: null,
      }
      persist([...positions, position])
    },
    [positions, persist],
  )

  const updatePosition = useCallback(
    (id, data) => {
      persist(
        positions.map((p) =>
          p.id === id
            ? {
                ...p,
                name: data.name.trim(),
                ticker: data.ticker.trim().toUpperCase(),
                type: data.type,
                quantity: Number(data.quantity),
                buyPrice: Number(data.buyPrice),
                buyDate: data.buyDate,
              }
            : p,
        ),
      )
    },
    [positions, persist],
  )

  const deletePosition = useCallback(
    (id) => {
      persist(positions.filter((p) => p.id !== id))
    },
    [positions, persist],
  )

  const setManualPrice = useCallback(
    (id, price) => {
      persist(
        positions.map((p) =>
          p.id === id
            ? { ...p, manualPrice: Number(price), manualPriceUpdatedAt: new Date().toISOString() }
            : p,
        ),
      )
    },
    [positions, persist],
  )

  return { positions, addPosition, updatePosition, deletePosition, setManualPrice }
}
