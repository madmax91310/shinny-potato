import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import ToolWorkspace from '../../design-system/ToolWorkspace'
import Button from '../../design-system/Button'
import AssetPicker from '../../design-system/AssetPicker'
import { copyPublicationText, notifyPublication, startPublicationDownload } from '../../design-system/publicationActions.js'
import { downloadImage } from '../../design-system/downloadImage.js'
import { getInstrumentName, getInstrumentPeaStatus } from '../../data/instruments.js'
import { analyze, buildTweet, compare, percent, readiness, validateAllocation } from './lib.js'
import { loadManifest, loadSnapshot } from './loader.js'
import { EXAMPLES, newPlan, displayLabel } from './data.js'
import { renderScannerImage } from './image.js'
import './style.css'
const STORAGE = 'epargnant-libre-scanner-v1'
const label = isin => { try { return getInstrumentName(isin) } catch { return isin } }
function Bars({ title, rows }) {
  return <section className="scanner-panel"><h3>{title}</h3>{rows.slice(0, 8).map(row => <div className="scanner-bar-row" key={row.name}><span>{displayLabel(row.name)}</span><strong>{percent(row.weight)}</strong><div className="scanner-bar"><span style={{ width: `${Math.min(100, row.weight)}%` }} /></div></div>)}</section>
}
function Result({ result }) {
  return <>
    {!result.complete && <p className="scanner-warning" role="status">Analyse partielle : {percent(result.analyzedWeight)} du portefeuille couvert. Les ETF sans composition exploitable restent hors calcul ; leurs poids ne sont pas redistribués.</p>}
    <div className="scanner-metrics"><div><small>Titres actions identifiés</small><strong>{result.positions.length.toLocaleString('fr-FR')}</strong></div><div><small>10 premières lignes</small><strong>{percent(result.top10)}</strong></div><div><small>Présents dans plusieurs ETF</small><strong>{percent(result.sharedWeight)}</strong></div></div>
    <p>{result.sharedCount.toLocaleString('fr-FR')} titres sont détenus via plusieurs ETF. Leur poids cumulé décrit une exposition commune ; ce n’est pas un pourcentage d’argent « inutile ».</p>
    <section className="scanner-panel"><h3>Ce que tu détiens le plus</h3><div className="scanner-table-wrap"><table><thead><tr><th>Titre / ISIN</th><th>Poids du portefeuille</th><th>Présent dans</th></tr></thead><tbody>{result.positions.slice(0, 15).map(r => <tr key={r.isin}><td><strong>{r.name}</strong><small>{r.isin}</small></td><td>{percent(r.weight)}</td><td>{r.contributions.length} ETF<details><summary>Voir les contributions</summary>{r.contributions.map(c => <p key={c.isin}>{label(c.isin)} : {percent(c.weight)} du portefeuille</p>)}</details></td></tr>)}</tbody></table></div></section>
    <div className="scanner-breakdowns"><Bars title="Pays des actions" rows={result.countries}/><Bars title="Secteurs des actions" rows={result.sectors}/></div>
    <section className="scanner-panel"><h3>Chevauchement entre deux ETF</h3><p>Somme du plus petit poids de chaque titre commun, dans les compositions des deux fonds. Les poids ci-dessous concernent les ETF, pas leur allocation dans ton portefeuille.</p>
      {!result.pairs.length && <p>Ajoute un second ETF pour comparer leurs positions.</p>}
      {result.pairs.map(p => <details className="scanner-pair" key={`${p.a}-${p.b}`}><summary><span>{label(p.a)} ↔ {label(p.b)}</span><strong>{percent(p.weight)} · {p.count} titres</strong></summary><p>Chevauchement des actions identifiées uniquement. Les titres sans ISIN, liquidités et dérivés ne sont pas rapprochés.</p><div className="scanner-table-wrap"><table><thead><tr><th>Titre commun</th><th>ETF 1</th><th>ETF 2</th></tr></thead><tbody>{p.rows.slice(0, 10).map(r => <tr key={r.isin}><td>{r.name}<small>{r.isin}</small></td><td>{percent(r.a)}</td><td>{percent(r.b)}</td></tr>)}</tbody></table></div></details>)}
    </section>
    <details className="scanner-panel"><summary>Couverture, dates et méthode</summary><p>Actions identifiées : {percent(result.identifiedWeight)} du portefeuille. Actions sans ISIN : {percent(result.unidentifiedWeight)}. Liquidités et autres positions publiées, en poids net : {percent(result.nonEquityWeight)}. Ces dernières ne mesurent pas l’exposition économique des dérivés.</p><p>Les poids utilisent la valeur liquidative des fonds. Pays et secteurs concernent les actions publiées. Deux classes d’actions d’une même entreprise restent deux titres distincts. Les instantanés peuvent avoir des dates différentes.</p>
      {result.sources.map(s => <p key={s.isin}><a href={s.sourceUrl} target="_blank" rel="noreferrer">{label(s.isin)}</a> — composition du {s.asOf}, contrôle réussi le {s.checkedAt}.</p>)}
      {result.excluded.map(s => <p key={s.isin}>{label(s.isin)} · {percent(s.weight)} : {s.reason}.</p>)}
    </details>
  </>
}
export default function App() {
  const [plan, setPlan] = useState(newPlan), [active, setActive] = useState('a'), [manifest, setManifest] = useState(null)
  const [snapshots, setSnapshots] = useState({}), [loading, setLoading] = useState(true), [error, setError] = useState(''), [loadErrors, setLoadErrors] = useState({})
  const [reload, setReload] = useState(0), [clock, setClock] = useState(new Date()), [draft, setDraft] = useState(null), [chosen, setChosen] = useState('IE00B4L5Y983'), [tab, setTab] = useState('analysis')
  useEffect(() => { const id = setInterval(() => setClock(new Date()), 60000); return () => clearInterval(id) }, [])
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError(''); setManifest(null); setSnapshots({}); setLoadErrors({})
    loadManifest(import.meta.env.BASE_URL, controller.signal).then(setManifest).catch(e => { if (!controller.signal.aborted) { setError(e.message); setLoading(false) } })
    return () => controller.abort()
  }, [reload])
  const selected = useMemo(() => [...new Set([...plan.a, ...(plan.comparison ? plan.b : [])].map(l => l.isin))], [plan])
  const selectionKey = selected.slice().sort().join(',')
  useEffect(() => {
    if (!manifest) return
    const controller = new AbortController(); setLoading(true)
    const entries = selectionKey.split(',').filter(isin => !readiness(manifest.instruments[isin], manifest.policy, clock))
    Promise.all(entries.map(async isin => {
      try { const data = await loadSnapshot(import.meta.env.BASE_URL, isin, manifest.instruments[isin], manifest.policy, controller.signal); return { isin, data } }
      catch (e) { return { isin, error: e.message } }
    })).then(rows => {
      if (controller.signal.aborted) return
      setSnapshots(Object.fromEntries(rows.filter(r => r.data).map(r => [r.isin, r.data])))
      setLoadErrors(Object.fromEntries(rows.filter(r => r.error).map(r => [r.isin, r.error])))
      setLoading(false)
    })
    return () => controller.abort()
  }, [manifest, selectionKey])
  const results = useMemo(() => {
    if (!manifest || loading) return null
    try { return { a: analyze(plan.a, snapshots, manifest, clock), b: plan.comparison ? analyze(plan.b, snapshots, manifest, clock) : null } }
    catch (e) { return { error: e.message } }
  }, [plan, snapshots, manifest, loading, clock])
  const result = results && !results.error ? results[plan.comparison ? active : 'a'] : null
  const generated = result ? buildTweet(results.a, results.b, plan.a, plan.b, label) : ''
  const text = draft ?? generated
  function change(fn) { setPlan(p => { const next = structuredClone(p); fn(next); return next }); setDraft(null) }
  function saveFile(content, name, type) { const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement('a'); link.href = url; link.download = name; startPublicationDownload(link); setTimeout(() => URL.revokeObjectURL(url), 1000) }
  const renderImage = () => renderScannerImage(results.a, results.b, plan.comparison ? plan.b : plan.a, label)
  function restore() { try { const saved = JSON.parse(localStorage.getItem(STORAGE)); if (saved?.version !== 1 || typeof saved.comparison !== 'boolean') throw new Error(); validateAllocation(saved.a); validateAllocation(saved.b); setPlan(saved); setActive('a'); setDraft(null); notifyPublication('Répartition chargée.') } catch { notifyPublication('Aucune sauvegarde valide sur cet appareil.', 'error') } }
  const items = manifest ? [...Object.entries(manifest.instruments), ...Object.entries(manifest.peaCoverage ?? {})].map(([isin, e]) => {
    const reason = readiness(e, manifest.policy, clock)
    let pea = false; try { pea = getInstrumentPeaStatus(isin) === true } catch { /* Registry remains authoritative. */ }
    return { id: isin, isin, label: label(isin), search: e.index ?? '', group: pea ? 'PEA' : 'Compositions de fonds', badges: [...(pea ? ['PEA'] : []), reason ? 'Indisponible' : 'Complète'], detail: reason ?? `Composition du ${e.asOf} · ${e.positionCount} positions publiées` }
  }) : []
  const current = plan[plan.comparison ? active : 'a']
  const delta = results?.b && compare(results.a, results.b)
  return <div className="scanner-app"><PageHeader title="Scanner ETF" subtitle="Regarde les positions communes, les concentrations et l’effet d’un changement d’allocation, à partir des compositions complètes publiées par les fonds."/>
    <div className="scanner-toolbar"><Button variant="secondary" onClick={() => { setReload(x => x + 1); setDraft(null) }}>Actualiser les données</Button><Button variant="secondary" onClick={() => { try { localStorage.setItem(STORAGE, JSON.stringify(plan)); notifyPublication('Répartition sauvegardée sur cet appareil.') } catch { notifyPublication('Sauvegarde indisponible.', 'error') } }}>Sauvegarder ma répartition</Button><Button variant="secondary" onClick={restore}>Charger ma sauvegarde</Button></div>
    <p className="scanner-note">Les allocations restent dans ton navigateur. Les compositions sont contrôlées quotidiennement ; les données trop anciennes sont exclues automatiquement.</p>
    {error && <p role="alert">{error}</p>}
    <ToolWorkspace renderImage={result ? renderImage : undefined} imageAlt="Positions et concentrations du portefeuille ETF" imageDisabled={!result} actions={<>
      <Button disabled={!result} onClick={async () => { try { await copyPublicationText(text) } catch { /* Shared feedback reports the failure. */ } }}>Copier le texte</Button>
      <Button disabled={!result} onClick={() => { try { downloadImage(renderImage(), 'scanner-etf.png') } catch { notifyPublication('Impossible de préparer l’image.', 'error') } }}>Télécharger l’image</Button>
      <Button disabled={!result} variant="secondary" onClick={() => saveFile(JSON.stringify({ version: 1, plan, results, text }, null, 2), 'scanner-etf.json', 'application/json')}>Exporter JSON</Button>
      <Button disabled={!result} variant="secondary" onClick={() => {
        const quote = value => `"${String(value).replaceAll('"', '""')}"`
        const rows = ['portefeuille;isin;titre;poids_pct;composition_couverte_pct;dates_compositions', ...['a', ...(plan.comparison ? ['b'] : [])].flatMap(k => results[k].positions.map(r => [k, r.isin, r.name, r.weight.toFixed(6).replace('.', ','), results[k].analyzedWeight, results[k].sources.map(s => s.asOf).join(' / ')].map(quote).join(';')))]
        saveFile('\ufeff' + rows.join('\n'), 'scanner-etf.csv', 'text/csv;charset=utf-8')
      }}>Exporter CSV</Button>
    </>}>
      <section className="tool-settings scanner-settings"><section className="scanner-panel"><h2>Ma répartition</h2><div className="scanner-tabs"><button aria-pressed={!plan.comparison} onClick={() => { change(p => { p.comparison = false }); setActive('a') }}>Analyser</button><button aria-pressed={plan.comparison} onClick={() => change(p => { p.comparison = true })}>Comparer avant / après</button></div>
        {plan.comparison && <div className="scanner-tabs" role="group" aria-label="Répartition à modifier">{[['a', 'Avant'], ['b', 'Après']].map(([id, name]) => <button key={id} aria-pressed={active === id} onClick={() => setActive(id)}>{name}</button>)}<button onClick={() => change(p => { p.b = structuredClone(p.a) })}>Copier avant vers après</button></div>}
        <div className="scanner-examples">{EXAMPLES.map(e => <button key={e.label} onClick={() => change(p => { p[active] = structuredClone(e.lines) })}>{e.label}</button>)}</div>
        {current.map((line, index) => <article key={line.isin} className="scanner-line"><strong>{label(line.isin)}</strong><small>{line.isin}</small><div><label>Poids (%)<input aria-label={`Poids ETF ${index + 1}`} type="number" min="0" max="100" step="0.1" value={line.weight} onChange={e => change(p => { p[active][index].weight = e.target.value === '' ? 0 : Number(e.target.value) })}/></label><button aria-label={`Retirer ${label(line.isin)}`} onClick={() => change(p => { p[active].splice(index, 1) })}>Retirer</button></div>{manifest && readiness(manifest.instruments[line.isin], manifest.policy, clock) && <p className="scanner-warning">Composition complète indisponible ou trop ancienne. Cette ligne sera hors calcul.</p>}</article>)}
        <p className="scanner-total">Total : {percent(current.reduce((s, l) => s + l.weight, 0))}</p>
        {manifest && <details><summary>Ajouter un ETF</summary><AssetPicker label="ETF à ajouter" items={items} value={chosen} onChange={setChosen}/><Button variant="secondary" disabled={current.some(l => l.isin === chosen) || current.length >= 12} onClick={() => change(p => { p[active].push({ isin: chosen, weight: Math.max(0, 100 - current.reduce((s, l) => s + l.weight, 0)) }) })}>Ajouter à la répartition</Button></details>}
      </section>
      {manifest && <details className="scanner-panel"><summary>Couverture des ETF PEA</summary><p>Les produits ci-dessous restent suivis chaque jour. Les dix principales lignes ou un panier de substitution ne suffisent pas pour calculer leurs doublons.</p>{Object.entries(manifest.peaCoverage ?? {}).map(([isin, e]) => <p key={isin}><strong>{label(isin)}</strong><small>{isin} · Composition complète non qualifiée · dernier contrôle {e.checkedAt ?? 'inconnu'}</small></p>)}</details>}
      </section>
      <section className="tool-preview scanner-preview">{loading ? <p role="status">Chargement et vérification des compositions…</p> : results?.error ? <p role="alert">{results.error}</p> : result && <>
        <div className="scanner-tabs" role="group" aria-label="Résultats du scanner"><button aria-pressed={tab === 'analysis'} onClick={() => setTab('analysis')}>Analyse</button><button aria-pressed={tab === 'post'} onClick={() => setTab('post')}>Publication X</button></div>
        {tab === 'post' ? <label className="scanner-draft">Texte prêt à publier<textarea aria-label="Brouillon de publication" value={text} onChange={e => setDraft(e.target.value)} rows={20}/><button onClick={() => setDraft(null)}>Rétablir le texte généré</button></label> : <>
          {plan.comparison && <section className="scanner-panel"><h2>Avant → après</h2>{delta ? <><p>Poids des 10 premières lignes : <strong>{percent(results.a.top10)} → {percent(results.b.top10)}</strong></p><p>Titres actions identifiés : {results.a.positions.length} → {results.b.positions.length}</p><p>Poids des titres présents dans plusieurs ETF : {percent(results.a.sharedWeight)} → {percent(results.b.sharedWeight)}</p><p>Cette comparaison applique les deux allocations aux compositions actuelles. Elle ne simule pas une performance future.</p><div className="scanner-breakdowns"><div><h3>Pays</h3>{[...new Set([...results.a.countries.slice(0, 5), ...results.b.countries.slice(0, 5)].map(r => r.name))].map(name => <p key={name}>{displayLabel(name)} : {percent(results.a.countries.find(r => r.name === name)?.weight ?? 0)} → {percent(results.b.countries.find(r => r.name === name)?.weight ?? 0)}</p>)}</div><div><h3>Secteurs</h3>{[...new Set([...results.a.sectors.slice(0, 5), ...results.b.sectors.slice(0, 5)].map(r => r.name))].map(name => <p key={name}>{displayLabel(name)} : {percent(results.a.sectors.find(r => r.name === name)?.weight ?? 0)} → {percent(results.b.sectors.find(r => r.name === name)?.weight ?? 0)}</p>)}</div></div></> : <p>Comparaison chiffrée désactivée : une des répartitions n’est pas entièrement couverte.</p>}<p>Analyse détaillée affichée : {active === 'a' ? 'avant' : 'après'}. Le texte et l’image de comparaison présentent la répartition après.</p></section>}
          <Result result={result}/>
        </>}
      </>}{Object.entries(loadErrors).map(([isin, message]) => <p className="scanner-warning" key={isin}>{label(isin)} : {message}</p>)}</section>
    </ToolWorkspace>
  </div>
}
