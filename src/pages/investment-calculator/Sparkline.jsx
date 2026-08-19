// Mini graphique SVG : valeur de l'actif vs capital investi.
// Même géométrie que la version d'origine (courbe + zone de dégradé + point final lumineux).
export default function Sparkline({ series, invested }) {
  const w = 600
  const h = 190
  const pad = 8
  const all = series.concat(invested)
  let min = Math.min(...all)
  let max = Math.max(...all)
  if (min > 0) min = 0
  let range = max - min || 1
  max += range * 0.08
  range = max - min || 1

  const pointsFor = (arr) => {
    const n = arr.length
    const xStep = n > 1 ? (w - 2 * pad) / (n - 1) : 0
    return arr.map((v, i) => {
      const x = pad + i * xStep
      const y = pad + (1 - (v - min) / range) * (h - 2 * pad)
      return [x, y]
    })
  }
  const pathFrom = (pts) => pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(2) + ',' + p[1].toFixed(2)).join(' ')

  const assetPts = pointsFor(series)
  const investedPts = pointsFor(invested)
  const linePath = pathFrom(assetPts)
  const last = assetPts[assetPts.length - 1]
  const areaPath = `${linePath} L ${last[0].toFixed(2)},${h - pad} L ${assetPts[0][0].toFixed(2)},${h - pad} Z`
  const investedPath = pathFrom(investedPts)
  const gridLines = [0.25, 0.5, 0.75].map((f) => pad + f * (h - 2 * pad))

  return (
    <svg className="ic-chart-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label="Évolution de la valeur du placement">
      <defs>
        <linearGradient id="ic-area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
        </linearGradient>
        <filter id="ic-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {gridLines.map((y) => (
        <line key={y} x1={pad} x2={w - pad} y1={y} y2={y} stroke="var(--ic-border)" strokeWidth="1" strokeDasharray="3,4" />
      ))}
      <path d={areaPath} fill="url(#ic-area-fill)" stroke="none" />
      <path d={investedPath} fill="none" stroke="#5b6688" strokeWidth="1.5" strokeDasharray="4,4" />
      <path d={linePath} fill="none" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="9" fill="#2dd4bf" opacity="0.25" filter="url(#ic-glow)" />
      <circle cx={last[0]} cy={last[1]} r="4" fill="#5eead4" stroke="#0a1122" strokeWidth="1.5" />
    </svg>
  )
}
