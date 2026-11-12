import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import twitter from 'twitter-text'
import PageHeader from '../../design-system/PageHeader.jsx'
import Card from '../../design-system/Card.jsx'
import Button from '../../design-system/Button.jsx'
import ToolWorkspace from '../../design-system/ToolWorkspace.jsx'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import { copyPublicationText } from '../../design-system/publicationActions.js'
import { FLOW_DATA, FLOW_POLICY } from './data.js'
import { GROUPS, observationKey, addObservation, publicationGate, periodLabel, signedFlow, selection, buildFlowTweet, checkFlowText, blankObservation, latestObservation } from './lib.js'
import { loadFlows, saveFlows } from './storage.js'
import './App.css'

export default function App() {
  const [initial] = useState(loadFlows), [local, setLocal] = useState(initial.value.observations)
  const raw = useRef(initial.raw)
  const observations = useMemo(() => [...FLOW_DATA.observations, ...local.filter(item => !FLOW_DATA.observations.some(shared => shared.id === item.id || observationKey(shared) === observationKey(item)))].sort((a,b) => b.end.localeCompare(a.end)), [local])
  const [id, setId] = useState(() => latestObservation(observations)?.id ?? '')
  const o = observations.find(item => item.id === id)
  const [ids, setIds] = useState(() => o?.rows.slice(0,1).map(r => r.id) ?? [])
  const [archive, setArchive] = useState(false), [edited, setEdited] = useState(null)
  const [longText, setLongText] = useState(false), [approved, setApproved] = useState(false)
  const [input, setInput] = useState(() => JSON.stringify(blankObservation(), null, 2))
  const [message, setMessage] = useState(initial.error), [view, setView] = useState('settings')
  const [clock, setClock] = useState(() => new Date())
  useEffect(() => { const t = setInterval(() => setClock(new Date()), 30000); return () => clearInterval(t) }, [])
  const rows = useMemo(() => selection(o, ids), [o, ids])
  const text = o ? edited ?? buildFlowTweet(o, rows, {archive}) : ''
  const issues = publicationGate(o, {now: clock, archive, maxAgeDays: FLOW_POLICY.dataDays})
  const textIssues = o && rows.length ? checkFlowText(text, o, rows, archive) : []
  const weighted = twitter.parseTweet(text).weightedLength
  const canImage = !issues.length && rows.length > 0 && rows.length <= 10
  const canCopy = canImage && !textIssues.length && approved && (longText || weighted <= 280)
  const renderImage = useCallback(async () => {
    // Re-evaluate against the wall clock at export time, even if the tab slept.
    const current = publicationGate(o, {archive, maxAgeDays: FLOW_POLICY.dataDays})
    if (current.length) throw Error(current.join(' '))
    const { renderFlowImage } = await import('./image.js')
    return renderFlowImage(o, rows, archive)
  }, [o, rows, archive])
  function reset() { setEdited(null); setApproved(false); setMessage('') }
  function choose(next) { setId(next); setIds(observations.find(item => item.id === next)?.rows.slice(0,1).map(r => r.id) ?? []); setArchive(false); reset() }
  function toggle(next) { setIds(next); reset() }
  function importRecord() {
    try {
      const record = JSON.parse(input)
      const all = addObservation(observations, record)
      const nextLocal = all.filter(item => !FLOW_DATA.observations.some(p => p.id === item.id))
      const saved = saveFlows(nextLocal, raw.current)
      if (!saved.error) raw.current = saved.raw
      setLocal(nextLocal); setId(record.id); setIds(record.rows.slice(0,1).map(r => r.id)); setArchive(false); setEdited(null); setApproved(false)
      setMessage(saved.error || 'Observation validée et enregistrée sur cet appareil. Elle n’est pas partagée avec le dépôt.')
    } catch (error) { setMessage(error.message) }
  }
  async function copy() {
    const blocked = publicationGate(o, {archive, maxAgeDays: FLOW_POLICY.dataDays})
    if (!canCopy || blocked.length) { setMessage(blocked.join(' ') || 'Vérifie les contrôles de publication.'); return }
    try { await copyPublicationText(text); setMessage('Tweet copié. Aucune publication sur X effectuée.') } catch (error) { setMessage(error.message) }
  }
  return <div className="etf-flows">
    <PageHeader title="Où va l’argent des ETF ?" subtitle="Les collectes nettes, avec leurs dates et leur périmètre. Les catégories sont des sélections et ne sont jamais additionnées." />
    <Card className="flows-notice"><strong>Collecte automatique bloquée</strong><p>{FLOW_DATA.collection.reason}</p><p>Automatisation des chiffres bloquée. Contrôle de configuration hebdomadaire et lancement manuel disponibles dans GitHub Actions. Aucune observation validée n’est créée par ce contrôle. <a href="https://github.com/madmax91310/shinny-potato/actions/workflows/update-etf-flows.yml" target="_blank" rel="noreferrer">Ouvrir le contrôle manuel</a></p><p>Examen des sources : {FLOW_DATA.collection.checkedAt.slice(0,10)}. Dernier article repéré : {FLOW_DATA.collection.latestCandidate.start} au {FLOW_DATA.collection.latestCandidate.end}, non qualifié.</p></Card>
    <ToolWorkspace view={view} onViewChange={setView} renderImage={renderImage} imageDisabled={!canImage} imageAlt="Sélection de flux nets des ETF, période et périmètre indiqués" imageFilename={`flux-etf-${o?.end ?? 'indisponible'}${archive ? '-archives' : ''}.png`} actions={<Button disabled={!canCopy} onClick={copy}>Copier le tweet</Button>}>
      <div className="tool-settings">
        <Card><h2>Choisir une période</h2><label>Semaine enregistrée<ChoicePicker aria-label="Semaine enregistrée" value={id} onChange={e => choose(e.target.value)}><option value="">Choisir une semaine</option>{observations.map(item => <option key={item.id} value={item.id}>{periodLabel(item)} · {item.currency} · {item.universe.label}</option>)}</ChoicePicker></label>
          {!observations.length && <p>Aucune semaine validée. Ajoute une observation issue d’une source réutilisable ci-dessous.</p>}
          {o && <><p><strong>{periodLabel(o)}</strong> · {o.periodKind === 'rolling-1w' ? 'Période glissante 1W, bornes sourcées' : 'Période explicitement donnée par la source'}</p><p>{o.universe.label} · {o.universe.productTypes.join(' / ')} · {o.currency}</p><p>Publiée le {o.publishedAt} · récupérée le {o.retrievedAt} · validée le {o.validatedAt}</p><label className="flows-check"><input type="checkbox" checked={archive} onChange={e => {setArchive(e.target.checked); reset()}} />Préparer une archive explicitement datée</label></>}
          {o && issues.map(issue => <p role="alert" key={issue}>{issue}</p>)}
        </Card>
        {o && <Card><h2>Rubriques et lignes</h2><p>Sélection de 1 à 10 lignes pour le visuel. Les catégories peuvent se chevaucher.</p>{Object.entries(GROUPS).map(([group, title]) => {
          const list = o.rows.filter(r => r.group === group)
          return list.length ? <fieldset key={group}><legend>{title}</legend><label className="flows-check"><input type="checkbox" checked={list.every(r => ids.includes(r.id))} onChange={e => toggle(e.target.checked ? [...new Set([...ids,...list.map(r => r.id)])] : ids.filter(id => !list.some(r => r.id === id)))} />Toute cette rubrique</label>{list.map(r => <label className="flows-check" key={r.id}><input type="checkbox" checked={ids.includes(r.id)} onChange={e => toggle(e.target.checked ? [...ids,r.id] : ids.filter(id => id !== r.id))} /><span>{r.label} <strong>{signedFlow(r.amount,o.currency)}</strong></span></label>)}</fieldset> : null
        })}{rows.length > 10 && <p role="alert">Réduis la sélection à 10 lignes maximum.</p>}</Card>}
        <Card><h2>Ajouter une observation sourcée</h2><p>Le JSON conserve les preuves pour chaque ligne. Utilise une source autorisant la réutilisation et documente le domicile ou la cotation en Europe. « Europe » comme exposition ne suffit pas.</p><details><summary>Guide des champs</summary><p>Dates : YYYY-MM-DD ; horodatages UTC : YYYY-MM-DDTHH:mm:ssZ. metric : net-flows ; unit : currency. basis : europe-domiciled ou europe-listed. rightsStatus : licensed ou open, avec preuve. group : asset, geography, sector ou fund. raw : montant explicitement signé, par exemple −81,9 MEUR ; amount : valeur signée en euros ou dollars, jamais un encours. Le libellé original et l’extrait justificatif restent dans originalLabel et evidence. Une 1W exige ses bornes exactes. Les classements sont toujours présentés comme des sélections.</p></details><label>Observation JSON<textarea aria-label="Observation JSON" className="flows-json" value={input} onChange={e => setInput(e.target.value)} spellCheck={false} /></label><Button onClick={importRecord}>Vérifier et enregistrer</Button><p>Stockage local à cet appareil. Pour partager une semaine avec l’application, utilise le script d’import du dépôt puis une PR. Garde une copie de ton JSON.</p></Card>
        <Card><h2>Sources et vérifications</h2><p><a href={FLOW_DATA.collection.latestCandidate.url} target="_blank" rel="noreferrer">Dernier récap ETF Express repéré</a> · <a href={FLOW_DATA.collection.reviewUrl} target="_blank" rel="noreferrer">Conditions de réutilisation</a> · <a href="https://www.trackinsight.com/services/data-services" target="_blank" rel="noreferrer">Services de données Trackinsight</a></p><p>ETF Express restitue Trackinsight : ce ne sont pas deux confirmations indépendantes. Les produits matières premières et crypto de ces récapitulatifs ne sont pas assimilés à des ETF.</p>{o && <><a href={o.source.url} target="_blank" rel="noreferrer">{o.source.publisher} · {o.source.provider}</a><p>{o.source.locator}</p><p>Périmètre : {o.universe.evidence}</p><p>Période : {o.periodEvidence}</p><p>Droits : {o.source.rightsEvidence}</p>{rows.map(r => <details key={r.id}><summary>{r.originalLabel}</summary><p>{r.raw} · {r.evidence}</p></details>)}</>}</Card>
      </div>
      <Card className="tool-preview"><h2>Texte à publier</h2><label>Tweet<textarea aria-label="Tweet" value={text} onChange={e => {setEdited(e.target.value); setApproved(false)}} disabled={!o} /></label><p>{weighted} / 280 caractères pondérés</p><label className="flows-check"><input type="checkbox" checked={longText} onChange={e => {setLongText(e.target.checked); setApproved(false)}} />Autoriser un texte long (compte X compatible requis)</label><Button variant="secondary" disabled={!o} onClick={reset}>Rétablir le texte généré</Button>{textIssues.map(issue => <p role="alert" key={issue}>{issue}</p>)}<label className="flows-check"><input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)} disabled={!canImage || !!textIssues.length} />J’ai relu le texte, les flux et le périmètre.</label><p>Les lignes chiffrées restent exactes. La rédaction autour de ces lignes est modifiable.</p></Card>
    </ToolWorkspace>
    {message && <p className="flows-feedback" role="status" aria-live="polite">{message}</p>}
  </div>
}
