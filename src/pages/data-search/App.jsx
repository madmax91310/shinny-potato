import { downloadPublicationBlob } from '../../design-system/downloadBlob.js'
import { copyPublicationText } from '../../design-system/publicationActions.js'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHeader from '../../design-system/PageHeader'
import MaintenanceLinks from '../../design-system/MaintenanceLinks'
import { CATALOG_INDEX, RECORD_URLS } from '../../data/catalog-browser.js'
import { searchCatalog, exportDataRecord } from '../../data/catalog-search.js'
import { describeDataField, describeEvidenceDate } from './lib.js'
import './data-search.css'

const EtfDevelopment = lazy(() => import('./EtfDevelopment'))

const TYPES = { reference: 'Documents officiels', actor: 'Acteurs et offres', insurance: 'Assurance-vie', scpi: 'SCPI', broker: 'Courtiers', company: 'Entreprises', all: 'Toutes les données', instrument: 'Instruments', index: 'Indices', series: 'Séries historiques', lexicon: 'Lexique', household: 'Ménages / patrimoine' }
const unknown = (value) => value ?? 'Non documenté'

export default function DataSearch() {
  const [params, setParams] = useSearchParams()
  const [etfOpen, setEtfOpen] = useState(false)
  const query = params.get('q') ?? ''
  const type = Object.hasOwn(TYPES, params.get('type')) ? params.get('type') : 'all'
  const results = useMemo(() => searchCatalog(CATALOG_INDEX, query, type), [query, type])
  const target = results.find((r) => r.id === params.get('id')) ?? results[0]
  const targetId = target?.id
  const [record, setRecord] = useState(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const selected = record?.id === target?.id ? record : null
  useEffect(() => {
    const controller = new AbortController()
    setError(false)
    if (!targetId) return () => controller.abort()
    fetch(RECORD_URLS[targetId], { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Fiche indisponible')
      return response.json()
    }).then(value => {
      if (value.id !== targetId || !Array.isArray(value.fields)) throw new Error('Fiche invalide')
      if (!controller.signal.aborted) setRecord(value)
    }).catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [targetId, attempt])
  const [message, setMessage] = useState('')
  function update(key, value) {
    // Navigation updates the URL before React finishes rendering the new filters.
    // Preserve that latest choice when the user immediately types a search.
    const next = new URLSearchParams(window.location.search)
    next.set(key, value)
    if (key !== 'id') next.delete('id')
    setParams(next, { replace: true })
    setMessage('')
  }
  function download() {
    downloadPublicationBlob(new Blob([exportDataRecord(selected)], { type: 'application/json' }), `donnees-${selected.id.replaceAll(':', '-')}.json`)
  }
  async function share() {
    try {
      const url = new URL(window.location.href); url.searchParams.set('id', selected.id)
      await copyPublicationText(url.href); setMessage('Lien de la fiche copié.')
    } catch { setMessage('Copie indisponible : tu peux partager l’adresse affichée après avoir sélectionné la fiche.') }
  }
  return <div className="data-search">
    <PageHeader title="Bibliothèque de données" subtitle="Retrouve un instrument ou un indice, ses sources, ses historiques et les outils qui l’utilisent." />
    <details className="ds-etf-development" onToggle={event => setEtfOpen(event.currentTarget.open)}>
      <summary>Ajout d’ETF · suivi des quatre lots</summary>
      {etfOpen && <Suspense fallback={<p>Chargement du suivi ETF…</p>}><EtfDevelopment /></Suspense>}
    </details>
    <div className="ds-controls">
      <label>ISIN, ticker, nom ou identifiant<input type="search" value={query} onChange={(e) => update('q', e.target.value)} placeholder="DCAM, MSCI USA, FR001400U5Q4…" /></label>
      <label>Type de donnée<ChoicePicker value={type} onChange={(e) => update('type', e.target.value)}>{Object.entries(TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</ChoicePicker></label>
    </div>
    <p role="status" className="ds-status">{results.length} résultat{results.length > 1 ? 's' : ''}{message ? ` · ${message}` : ''}</p>
    <div className="ds-layout">
      <nav className="ds-results" aria-label="Résultats de recherche">{results.map((record) => <button key={record.id} className={target?.id === record.id ? 'selected' : ''} aria-pressed={target?.id === record.id} onClick={() => update('id', record.id)}><strong>{record.name}</strong><span>{record.id} · {TYPES[record.type]}</span></button>)}</nav>
      {target && !selected && <p role="status">{error ? <>Impossible de charger cette fiche. <button onClick={() => setAttempt(n => n + 1)}>Réessayer</button></> : 'Chargement de la fiche…'}</p>}
      {selected ? <article className="ds-detail" aria-label="Fiche de données">
        <h2>{selected.name}</h2><p className="ds-id">{selected.id}</p>
        <div className="ds-actions"><button onClick={download}>Exporter la fiche JSON</button><button onClick={share}>Copier le lien de la fiche</button></div>
        <h3>Outils qui utilisent cette donnée</h3>
        {selected.consumers.length ? <ul>{selected.consumers.map((c) => <li key={c.path}><Link to={c.path}>{c.tool}</Link></li>)}</ul> : <p>Référence disponible dans le catalogue, sans usage recensé dans ces outils.</p>}
        <h3>Données et provenance</h3><p className="ds-note">La date de la donnée décrit la photographie publiée par la source. Le contrôle et la modification sont suivis séparément ; une date absente reste non documentée. La publication dans l’application se vérifie dans <Link to="/donnees-a-revoir">le bilan des collectes</Link>.</p>
        {selected.fields.map((field, i) => <section className="ds-field" key={`${field.label}-${i}`}>
          <h4>{field.label}</h4>{describeDataField(field) && <p className="ds-value">{describeDataField(field)}</p>}<code>{field.registry}</code>
          <dl><dt>Date de la donnée</dt><dd>{describeEvidenceDate(field.metadata)}</dd>{field.metadata.periodStart && <><dt>Période couverte</dt><dd>{field.metadata.periodStart} à {field.metadata.periodEnd}</dd></>}<dt>Dernier contrôle réussi de la source</dt><dd>{field.metadata.sourceStatus === 'archive-unverifiable' ? 'Aucune publication historique recertifiée' : unknown(field.metadata.checkedAt)}</dd><dt>Dernière modification de la donnée</dt><dd>{unknown(field.metadata.modifiedAt)}</dd>{field.metadata.reviewedAt && <><dt>Revue de provenance</dt><dd>{field.metadata.reviewedAt}</dd></>}<dt>Devise</dt><dd>{unknown(field.metadata.currency)}</dd><dt>Périmètre</dt><dd>{field.metadata.scope}</dd>{field.metadata.method && <><dt>Méthode</dt><dd>{field.metadata.method}</dd></>}</dl>
          <MaintenanceLinks record={selected} field={field} />
          {field.metadata.sourceUrls.length ? <ul>{field.metadata.sourceUrls.map((url) => <li key={url}><a href={url} target="_blank" rel="noreferrer">{url}</a></li>)}</ul> : <p className="ds-note">{field.metadata.sourceStatus === 'archive-unverifiable' ? 'Archive non vérifiable' : 'Source individuelle non renseignée dans le registre.'}</p>}
          {field.metadata.sourceReason && <p className="ds-note">{field.metadata.sourceReason}</p>}
          {field.metadata.note && <p className="ds-note">{field.metadata.note}</p>}
          <details><summary>Voir les valeurs enregistrées</summary><pre>{JSON.stringify(field.value, null, 2)}</pre></details>
        </section>)}
      </article> : !target && <p className="ds-detail">Aucune donnée ne correspond à cette recherche.</p>}
    </div>
  </div>
}
