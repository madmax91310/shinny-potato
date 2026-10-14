import Workspace from '../../Workspace.jsx'
import engine from '../../engines/pouvoir.js'
import * as ui from '../../../../data/purchasing-power.js'
const runtime = { engine, ui: ui }
export default function App(props) { return <Workspace {...props} initialFormat="pouvoir-achat" runtime={runtime} /> }
