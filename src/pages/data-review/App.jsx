import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHeader from '../../design-system/PageHeader'
import MaintenanceLinks from '../../design-system/MaintenanceLinks'
import AutomationFailures from './AutomationFailures.jsx'
import { buildReview, parisToday, REVIEW_CADENCES, reviewCalendar, summarizeCadences } from './lib.js'
import { describeEvidenceDate } from '../data-search/lib.js'
import './data-review.css'

const LABELS = { expired: 'Offre expirée', 'future-date': 'Date à examiner', reserve: 'Réserve ouverte', stale: 'À revoir / en retard', current: 'Contrôle à jour', undated: 'Contrôle non daté', ending: 'Échéance proche', soon: 'Revue prochaine', scheduled: 'Échéance à venir' }
const ACTIONABLE = ['expired', 'future-date', 'reserve', 'stale', 'undated']
const VIEWS = { action: 'À traiter', calendar: 'Calendrier des vérifications', soon: 'Dans les 30 prochains jours', deadlines: 'Échéances des offres', reserve: 'Réserves', dates: 'Contrôles des sources', all: 'Tout afficher' }
const dateLabel = value => value ? (/^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').reverse().join('/') : value) : 'Non documenté'
const normalize = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export default function DataReview() {
  const [today, setToday] = useState(parisToday)
  useEffect(() => { const timer = setInterval(() => setToday(parisToday()), 60000); return () => clearInterval(timer) }, [])
  const report = useMemo(() => buildReview(today), [today])
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const view = Object.hasOwn(VIEWS, params.get('view')) ? params.get('view') : 'action'
  function update(key, value) {
    const next = new URLSearchParams(params)
    next.set(key, value)
    // Une réserve n'a pas de cycle de contrôle : ne pas la masquer derrière
    // la temporalité du calendrier précédemment sélectionnée.
    if (key === 'view' && value === 'reserve') next.delete('cadence')
    setParams(next, { replace: true })
  }
  const tool = params.get('tool') ?? ''
  const tools = [...new Set([...report.schedule, ...report.items].flatMap(item => item.tools))].sort((a, b) => a.localeCompare(b, 'fr'))
  const cadence = Object.hasOwn(REVIEW_CADENCES, params.get('cadence')) ? params.get('cadence') : ''
  const matches = item => (!tool || item.tools.includes(tool)) && normalize([item.name, item.field, ...item.tools, ...item.aliases ?? []].join(' ')).includes(normalize(query.trim()))
  const calendar = reviewCalendar(report)
  const summaries = summarizeCadences(calendar.filter(matches), today)
  function selectCadence(value) {
    const next = new URLSearchParams(params)
    next.set('cadence', value)
    next.set('view', 'calendar')
    setParams(next, { replace: true })
  }
  const rows = view === 'calendar' || view === 'soon' ? calendar : report.items
  const items = rows.filter(item => {
    const visible = view === 'calendar' || (view === 'soon' && ['soon', 'ending'].includes(item.category)) || view === 'all' || (view === 'action' && ACTIONABLE.includes(item.category)) || (view === 'deadlines' && item.until) || (view === 'reserve' && item.category === 'reserve') || (view === 'dates' && !item.until && item.category !== 'reserve')
    return visible && (!cadence || item.cadence === cadence) && matches(item)
  })
  const count = categories => report.items.filter(item => categories.includes(item.category)).length
  return <div className="data-review">
    <PageHeader title="Données à revoir" subtitle="Les réserves, échéances et contrôles de sources réunis pour préparer les prochaines mises à jour." />
    <p className="dr-note">État au {dateLabel(today)} · Les échéances sont calculées par type de données. Une vérification de la source commune vaut pour tous les outils concernés.</p>
    <AutomationFailures />
    <div className="dr-counts" aria-label="Résumé des revues">
      <div><strong>{count(['reserve'])}</strong><span>réserves ouvertes</span></div>
      <div><strong>{count(['expired'])}</strong><span>offres expirées</span></div>
      <div><strong>{count(['stale'])}</strong><span>vérifications arrivées à échéance</span></div>
      <div><strong>{count(['undated', 'future-date'])}</strong><span>dates de contrôle à examiner</span></div>
    </div>
    <section className="dr-reminders" aria-labelledby="dr-reminders-title">
      <h2 id="dr-reminders-title">Rappels par temporalité</h2>
      <p className="dr-note">Retrouve les données à vérifier chaque mois, trimestre, semestre ou année. Les dates suivent les contrôles déjà réalisés et les publications attendues.</p>
      <div className="dr-cadences">{summaries.map(group => <button type="button" className="dr-cadence" key={group.id} aria-pressed={cadence === group.id} onClick={() => selectCadence(group.id)}>
        <strong>{group.label}</strong>
        <span className="dr-cadence-types">{group.types.join(' · ') || 'Aucune donnée pour cette sélection'}</span>
        <span>{group.total} contrôle{group.total > 1 ? 's' : ''} suivi{group.total > 1 ? 's' : ''}</span>
        <span className={group.due ? 'dr-cadence-due' : ''}>{group.due ? `${group.due} à revoir · depuis le ${dateLabel(group.oldestDueAt)}` : 'Aucune échéance à revoir aujourd’hui'}</span>
        <span>Prochaine échéance : {group.nextReviewAt ? dateLabel(group.nextReviewAt) : 'Aucune date à venir'}</span>
        {group.unplanned > 0 && <span>{group.unplanned} date{group.unplanned > 1 ? 's' : ''} à examiner</span>}
        <span className="dr-cadence-link">Voir les données →</span>
      </button>)}</div>
    </section>
    <div className="dr-controls">
      <label>Rechercher une donnée ou un outil<input type="search" value={query} onChange={event => update('q', event.target.value)} placeholder="IBKR, encours, Fortuneo…" /></label>
      <label>Afficher<ChoicePicker aria-label="Afficher" value={view} onChange={event => update('view', event.target.value)}>{Object.entries(VIEWS).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</ChoicePicker></label>
      <label>Temporalité<ChoicePicker aria-label="Temporalité" value={cadence} onChange={event => selectCadence(event.target.value)}><option value="">Toutes les temporalités</option>{Object.entries(REVIEW_CADENCES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</ChoicePicker></label>
      <label>Outil<ChoicePicker aria-label="Outil" value={tool} onChange={event => update('tool', event.target.value)}><option value="">Tous les outils</option>{tools.map(name => <option key={name} value={name}>{name}</option>)}</ChoicePicker></label>
    </div>
    <p role="status" className="dr-note">{items.length} élément{items.length > 1 ? 's' : ''} affiché{items.length > 1 ? 's' : ''}</p>
    <div className="dr-list">{items.map(item => <article className="dr-item" key={item.id}>
      <span className={`dr-badge dr-${item.category}`}>{LABELS[item.category]}</span>
      <h2>{item.name} · {item.field}</h2>
      <p>{item.reason}</p>
      <dl>{item.cadence && <><dt>Temporalité</dt><dd>{REVIEW_CADENCES[item.cadence]}</dd></>}{item.dataType && <><dt>Type de données</dt><dd>{item.dataType}</dd></>}<dt>Date de la donnée</dt><dd>{item.metadata ? describeEvidenceDate(item.metadata) : 'Non documentée'}</dd><dt>Dernier contrôle réussi de la source</dt><dd>{dateLabel(item.checkedAt)}</dd><dt>Dernière modification de la donnée</dt><dd>{dateLabel(item.modifiedAt)}</dd>{!item.until && item.category !== 'reserve' && <><dt>Prochaine vérification</dt><dd>{dateLabel(item.nextReviewAt)}</dd></>}{item.until && <><dt>Fin de l’offre</dt><dd>{dateLabel(item.until)}</dd></>}<dt>Outils concernés</dt><dd>{item.tools.join(' · ')}</dd></dl>
      {item.detail && <details><summary>Lire la réserve</summary><p>{item.detail}</p></details>}
      {item.maintenanceRecord && <MaintenanceLinks record={item.maintenanceRecord} field={item.maintenanceField} />}
      <div className="dr-links"><Link to={item.to}>Ouvrir {item.to.startsWith('/bibliotheque') ? 'la fiche de données' : item.to === '/comparatif-courtiers' ? 'le comparatif courtiers' : 'le portefeuille investisseur'}</Link>{item.urls.map((url, index) => <a href={url} key={url} target="_blank" rel="noreferrer">Source{item.urls.length > 1 ? ` ${index + 1}` : ''} ↗</a>)}</div>
    </article>)}</div>
    {!items.length && <p className="dr-empty">Aucun élément pour cette sélection.</p>}
    <p className="dr-note dr-footnote">Une date ancienne appelle une revue, elle ne prouve pas qu’une valeur est fausse. Les dates de photographie et les dates de contrôle restent distinctes. Les {report.archives} archives non recertifiables sont conservées à part et exclues de cette liste. Les échéances affichées sont celles enregistrées ; leur éventuelle prolongation doit être vérifiée auprès de la source.</p>
  </div>
}
