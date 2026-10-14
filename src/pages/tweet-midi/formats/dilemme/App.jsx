import Workspace from '../../Workspace.jsx'
import engine from '../../engines/dilemme.js'
const runtime = { engine, ui: {} }
export default function App(props) { return <Workspace {...props} initialFormat="dilemme" runtime={runtime} /> }
