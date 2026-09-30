import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHeader from '../../design-system/PageHeader'
import { searchData, exportDataRecord } from '../../data/catalog.js'
import { describeDataField, describeEvidenceDate } from './lib.js'
import './data-search.css'

const TYPES = { all: 'Toutes les données', instrument: 'Instruments', index: 'Indices', series: 'Séries historiques', lexicon: 'Lexique' }
const unknown = (value) => value ?? 'Non documenté'

export default function DataSearch() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const type = Object.hasOwn(TYPES, params.get('type')) ? params.get('type') : 'all'
  const results = useMemo(() => searchData(query, type), [query, type])
  const selected = results.find((r) => r.id === params.get('id')) ?? results[0]
  const [message, setMessage] = useState('')
  function update(key, value) {
    const next = new URLSearchParams(params)
    next.set(key, value)
    if (key !== 'id') next.delete('id')
    setParams(next, { replace: true })
    setMessage('')
  }
  function download() {
    const url = URL.createObjectURL(new Blob([exportDataRecord(selected)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url; link.download = `donnees-${selected.id.replaceAll(':', '-')}.json`; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  async function share() {
    try {
      const url = new URL(window.location.href); url.searchParams.set('id', selected.id)
      await navigator.clipboard.writeText(url.href); setMessage('Lien de la fiche copié.')
    } catch { setMessage('Copie indisponible : tu peux partager l’adresse affichée après avoir sélectionné la fiche.') }
  }
  return <div className="data-search">
    <PageHeader title="Bibliothèque de données" subtitle="Retrouve un instrument ou un indice, ses sources, ses historiques et les outils qui l’utilisent." />
    <div className="ds-controls">
      <label>ISIN, ticker, nom ou identifiant<input type="search" value={query} onChange={(e) => update('q', e.target.value)} placeholder="DCAM, MSCI USA, FR001400U5Q4…" /></label>
      <label>Type de donnée<select value={type} onChange={(e) => update('type', e.target.value)}>{Object.entries(TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    </div>
    <p role="status" className="ds-status">{results.length} résultat{results.length > 1 ? 's' : ''}{message ? ` · ${message}` : ''}</p>
    <div className="ds-layout">
      <nav className="ds-results" aria-label="Résultats de recherche">{results.map((record) => <button key={record.id} className={selected?.id === record.id ? 'selected' : ''} aria-pressed={selected?.id === record.id} onClick={() => update('id', record.id)}><strong>{record.name}</strong><span>{record.id} · {TYPES[record.type]}</span></button>)}</nav>
      {selected ? <article className="ds-detail" aria-label="Fiche de données">
        <h2>{selected.name}</h2><p className="ds-id">{selected.id}</p>
        <div className="ds-actions"><button onClick={download}>Exporter la fiche JSON</button><button onClick={share}>Copier le lien de la fiche</button></div>
        <h3>Outils qui utilisent cette donnée</h3>
        {selected.consumers.length ? <ul>{selected.consumers.map((c) => <li key={c.path}><Link to={c.path}>{c.tool}</Link></li>)}</ul> : <p>Référence disponible dans le catalogue, sans usage recensé dans ces outils.</p>}
        <h3>Données et provenance</h3>
        {selected.fields.map((field, i) => <section className="ds-field" key={`${field.label}-${i}`}>
          <h4>{field.label}</h4>{describeDataField(field) && <p className="ds-value">{describeDataField(field)}</p>}<code>{field.registry}</code>
          <dl><dt>Date de référence</dt><dd>{describeEvidenceDate(field.metadata)}</dd>{field.metadata.periodStart && <><dt>Période couverte</dt><dd>{field.metadata.periodStart} à {field.metadata.periodEnd}</dd></>}<dt>Contrôle de la source</dt><dd>{unknown(field.metadata.checkedAt)}</dd><dt>Devise</dt><dd>{unknown(field.metadata.currency)}</dd><dt>Périmètre</dt><dd>{field.metadata.scope}</dd>{field.metadata.method && <><dt>Méthode</dt><dd>{field.metadata.method}</dd></>}</dl>
          {field.metadata.sourceUrls.length ? <ul>{field.metadata.sourceUrls.map((url) => <li key={url}><a href={url} target="_blank" rel="noreferrer">{url}</a></li>)}</ul> : <p className="ds-note">Source individuelle non renseignée dans le registre.</p>}
          {field.metadata.note && <p className="ds-note">{field.metadata.note}</p>}
          <details><summary>Voir les valeurs enregistrées</summary><pre>{JSON.stringify(field.value, null, 2)}</pre></details>
        </section>)}
      </article> : <p className="ds-detail">Aucune donnée ne correspond à cette recherche.</p>}
    </div>
  </div>
}
