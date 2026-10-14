import Workspace from '../../Workspace.jsx'
import engine from '../../engines/anniversaire.js'
import { ANNIVERSAIRE_ELIGIBLE_ASSETS, ANNIVERSAIRE_EXCLUDED_ASSETS } from '../../data/marketHistory.js'
import { resolveAnniversaryLevel } from '../../../../data/anniversary-levels.js'
const runtime = { engine, ui: { ANNIVERSAIRE_ELIGIBLE_ASSETS, ANNIVERSAIRE_EXCLUDED_ASSETS, resolveAnniversaryLevel } }
export default function App(props) { return <Workspace {...props} initialFormat="anniversaire" runtime={runtime} /> }
