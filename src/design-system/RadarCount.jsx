import {processedIds} from '../lib/radar-workflow-state.js'
import { readIds } from '../lib/radar-read-state.js'
import { overviewUnread } from '../lib/radar-overview.js'
import useRadarOverview from '../lib/use-radar-overview.js'
export default function RadarCount() {
  const {status,data}=useRadarOverview()
  const count=status==='ready'?overviewUnread(data,readIds(),processedIds()):null
  const label=status==='loading'?'Radar : chargement des sujets non lus':status==='error'?'Radar indisponible : nombre de sujets non lus inconnu':`${count} sujets exploitables non lus`
  return <span className={`radar-nav-count radar-nav-count--${status}`} title={label} aria-label={label}>{status==='loading'?'…':status==='error'?'?':count}</span>
}
