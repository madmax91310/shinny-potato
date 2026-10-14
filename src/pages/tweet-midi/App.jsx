// Compatibility route: the mixed-format workspace intentionally loads all formats.
import Workspace from './Workspace.jsx'
import engine from './lib.js'
import * as purchasing from '../../data/purchasing-power.js'
import { ANNIVERSAIRE_ELIGIBLE_ASSETS, ANNIVERSAIRE_EXCLUDED_ASSETS } from './data/marketHistory.js'
import { resolveAnniversaryLevel } from '../../data/anniversary-levels.js'
const runtime = { engine, ui: { ...purchasing, ANNIVERSAIRE_ELIGIBLE_ASSETS, ANNIVERSAIRE_EXCLUDED_ASSETS, resolveAnniversaryLevel } }
export default function App(props) { return <Workspace {...props} runtime={runtime} /> }
