import { getRecipes } from './recipes.js'
import SettingsDetails from '../../design-system/SettingsDetails'
import { CONSTRUCTION_LIMITS, constructionMetrics, diversityReport, overlapNotes } from './controls.js'
import { getAsset } from '../../data/portfolio-assets.js'

const LABELS = { equity:'Actions et assimilés cotés', sectors:'Secteurs et thèmes dédiés', crypto:'Crypto et actions blockchain', leverage:'ETF à levier', options:'Stratégies avec options', speculative:'Crypto + levier + options', property:'Immobilier', highYield:'Dette à haut rendement', commodities:'Métaux et matières premières', technology:'Technologie et Nasdaq dédiés' }
const frequency = (counts, count, names = false) => Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([id,n]) => `${names ? getAsset(id).name : id} : ${Math.round(n/count*100)} %`).join(' · ')
export default function GeneratorControls({ portfolio, history, locked, onLock }) {
  const metrics = constructionMetrics(portfolio.selection)
  const notes = overlapNotes(portfolio.selection)
  const reports = diversityReport(history)
  return <>
    <SettingsDetails title="Conserver des lignes au prochain tirage">
      <p>Le support et son poids restent fixes. Le prochain tirage conserve aussi le profil et le niveau de risque actuels. Changer de profil, de risque ou de mode libère les lignes.</p>
      <div className="pg-locks">{portfolio.selection.map(row => <label key={row.id} style={{display:'block',margin:'0.5rem 0'}}>
        <input type="checkbox" checked={locked.some(lock=>lock.id===row.id)} onChange={event => onLock(event.target.checked ? [...locked,{id:row.id,pct:row.pct}] : locked.filter(lock=>lock.id!==row.id))} />{' '}
        Conserver {row.name} · {row.pct} %
      </label>)}</div>
      <p role="status">{locked.length} ligne(s) conservée(s). {locked.length ? 'Les possibilités de renouvellement sont plus limitées.' : ''}</p>
    </SettingsDetails>
    <SettingsDetails title="Concentration et recoupements">
      <p>Ces plafonds de construction s’ajoutent au filtre historique. Ils ne prédisent pas une perte maximale. Les poids mesurent des lignes dédiées, pas les secteurs présents à l’intérieur des indices larges.</p>
      <ul>{Object.entries(metrics).filter(([,value])=>value>0).map(([key,value])=><li key={key}>{LABELS[key]} : {value} % / plafond {CONSTRUCTION_LIMITS[portfolio.riskId][key]} %</li>)}</ul>
      {notes.length ? <ul>{notes.map(note=><li key={note}>{note}</li>)}</ul> : <p>Aucun recoupement particulier signalé par ces règles qualitatives. Cela ne démontre pas l’absence de titres communs.</p>}
    </SettingsDetails>
    <SettingsDetails title="Variété de cette session">
      <p>Fréquence de présence par profil et risque, depuis l’ouverture de la page. Changer uniquement d’émetteur ne crée pas une nouvelle famille d’exposition. Un socle est la plus grande ligne indicielle large, sans obligation qu’elle soit majoritaire.</p>
      {reports.map(report=>{const recipes=getRecipes(report.profileId,report.riskId);
        const eligible=[...new Set(recipes.flatMap(recipe=>recipe.assets.flatMap(slot=>slot.idOptions??[slot.id])))];
        const unused=eligible.filter(id=>!report.assets[id]);
        return <div key={report.key}>
        <strong>{report.key} · {report.count} tirages</strong>
        <p>{report.distinctAssets} supports, {report.distinctFamilies} familles, {report.distinctCores} socles. {report.nearRepeats} composition(s) proche(s) des 20 précédentes : moins de 10 points à déplacer entre familles.</p>
        <p>{Object.keys(report.recipes).length} constructions utilisées sur {recipes.length} ; {eligible.length-unused.length} supports utilisés sur {eligible.length} possibles pour ce profil et ce risque. Les lignes conservées peuvent limiter cette couverture.</p>
        {unused.length>0&&<details><summary>Supports encore absents des tirages ({unused.length})</summary><p>{unused.map(id=>getAsset(id).name).join(' · ')}</p></details>}
        <p>Socles — {frequency(report.cores,report.count)}</p>
        <p>Secteurs et thèmes — {frequency(report.sectorFamilies,report.count)||'Aucune ligne dédiée'}</p>
        <details><summary>Fréquence des supports</summary><p>{frequency(report.assets,report.count,true)}</p></details>
      </div>})}
    </SettingsDetails>
  </>
}
