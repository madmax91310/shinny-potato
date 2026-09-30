import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHeader from '../../design-system/PageHeader'
import { buildReview, parisToday } from './lib.js'
import './data-review.css'

const LABELS = { expired: 'Offre expirée', 'future-date': 'Date à examiner', reserve: 'Réserve ouverte', stale: 'Contrôle ancien', undated: 'Contrôle non daté', ending: 'Échéance proche', soon: 'Revue prochaine', scheduled: 'Échéance à venir' }
const ACTIONABLE = ['expired', 'future-date', 'reserve', 'stale', 'undated']
const VIEWS = { action: 'À traiter', deadlines: 'Échéances des offres', reserve: 'Réserves', dates: 'Contrôles des sources', all: 'Tout afficher' }
const dateLabel = value => value ? (/^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').reverse().join('/') : value) : 'Non documenté'
const normalize = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export default function DataReview() {
  const [today, setToday] = useState(parisToday)
  useEffect(() => { const timer = setInterval(() => setToday(parisToday()), 60000); return () => clearInterval(timer) }, [])
  const report = useMemo(() => buildReview(today), [today])
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const view = Object.hasOwn(VIEWS, params.get('view')) ? params.get('view') : 'action'
  function update(key, value) { const next = new URLSearchParams(params); next.set(key, value); setParams(next, { replace: true }) }
  const items = report.items.filter(item => {
    const visible = view === 'all' || (view === 'action' && ACTIONABLE.includes(item.category)) || (view === 'deadlines' && item.until) || (view === 'reserve' && item.category === 'reserve') || (view === 'dates' && !item.until && item.category !== 'reserve')
    return visible && normalize([item.name, item.field, ...item.tools, ...item.aliases ?? []].join(' ')).includes(normalize(query.trim()))
  })
  const count = categories => report.items.filter(item => categories.includes(item.category)).length
  return <div className="data-review">
    <PageHeader title="Données à revoir" subtitle="Les réserves, échéances et contrôles de sources réunis pour préparer les prochaines mises à jour." />
    <p className="dr-note">État au {dateLabel(today)} · Les alertes de cet espace restent dans l’interface. Elles ne sont pas ajoutées aux tweets ni aux images.</p>
    <div className="dr-counts" aria-label="Résumé des revues">
      <div><strong>{count(['reserve'])}</strong><span>réserves ouvertes</span></div>
      <div><strong>{count(['expired'])}</strong><span>offres expirées</span></div>
      <div><strong>{count(['stale'])}</strong><span>contrôles de 180 jours ou plus</span></div>
      <div><strong>{count(['undated', 'future-date'])}</strong><span>dates de contrôle à examiner</span></div>
    </div>
    <div className="dr-controls">
      <label>Rechercher une donnée ou un outil<input type="search" value={query} onChange={event => update('q', event.target.value)} placeholder="IBKR, encours, Fortuneo…" /></label>
      <label>Afficher<select aria-label="Afficher" value={view} onChange={event => update('view', event.target.value)}>{Object.entries(VIEWS).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
    </div>
    <p role="status" className="dr-note">{items.length} élément{items.length > 1 ? 's' : ''} affiché{items.length > 1 ? 's' : ''}</p>
    <div className="dr-list">{items.map(item => <article className="dr-item" key={item.id}>
      <span className={`dr-badge dr-${item.category}`}>{LABELS[item.category]}</span>
      <h2>{item.name} · {item.field}</h2>
      <p>{item.reason}</p>
      <dl><dt>Dernier contrôle</dt><dd>{dateLabel(item.checkedAt)}</dd>{item.until && <><dt>Fin de l’offre</dt><dd>{dateLabel(item.until)}</dd></>}<dt>Outils concernés</dt><dd>{item.tools.join(' · ')}</dd></dl>
      {item.detail && <details><summary>Lire la réserve</summary><p>{item.detail}</p></details>}
      <div className="dr-links"><Link to={item.to}>Ouvrir {item.to.startsWith('/bibliotheque') ? 'la fiche de données' : 'le comparatif courtiers'}</Link>{item.urls.map((url, index) => <a href={url} key={url} target="_blank" rel="noreferrer">Source{item.urls.length > 1 ? ` ${index + 1}` : ''} ↗</a>)}</div>
    </article>)}</div>
    {!items.length && <p className="dr-empty">Aucun élément pour cette sélection.</p>}
    <p className="dr-note dr-footnote">Une date ancienne appelle une revue, elle ne prouve pas qu’une valeur est fausse. Les dates de photographie et les dates de contrôle restent distinctes. Les {report.archives} archives non recertifiables sont conservées à part et exclues de cette liste. Les échéances affichées sont celles enregistrées ; leur éventuelle prolongation doit être vérifiée auprès de la source.</p>
  </div>
}
