import Workspace from '../../Workspace.jsx'
import engine from '../../engines/lexique.js'
const runtime = { engine, ui: {} }
export default function App(props) { return <Workspace {...props} initialFormat="fiche-lexique" runtime={runtime} /> }
