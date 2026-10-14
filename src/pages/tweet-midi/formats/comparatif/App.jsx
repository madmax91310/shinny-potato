import Workspace from '../../Workspace.jsx'
import engine from '../../engines/comparatif.js'
const runtime = { engine, ui: {} }
export default function App(props) { return <Workspace {...props} initialFormat="comparatif-etf" runtime={runtime} /> }
