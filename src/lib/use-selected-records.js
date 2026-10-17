import { useEffect, useState } from 'react'
// Keep controls and the last selection mounted while selected records load.
export function useSelectedRecords(ids, records) {
 const key = JSON.stringify([...new Set(ids.filter(Boolean))].sort())
 const [result, setResult] = useState(null), [attempt, retry] = useState(0)
 const ready = !records || JSON.parse(key).every(id => records.isReady(id))
 useEffect(() => {
  if (!records || ready) return
  let active = true
  setResult(null)
  Promise.all(JSON.parse(key).map(id => records.load(id))).then(
   () => { if (active) setResult({key}) },
   () => { if (active) setResult({key, error:true}) },
  )
  return () => { active = false }
 }, [key, records, ready, attempt])
 return {ready, error:result?.key === key && result.error, retry:() => retry(n => n + 1)}
}
