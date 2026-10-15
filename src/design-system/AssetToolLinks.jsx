import { lazy, Suspense, useState } from 'react'
const AssetToolDestinations = lazy(() => import('./AssetToolDestinations.jsx'))

export default function AssetToolLinks({ isin, exclude = '' }) {
  const [open, setOpen] = useState(false)
  return <details className="asset-tool-links" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>Retrouver ce support dans les autres outils</summary>
    {open && <Suspense fallback={<p>Chargement des outils disponibles…</p>}>
      <AssetToolDestinations isin={isin} exclude={exclude} />
    </Suspense>}
  </details>
}
