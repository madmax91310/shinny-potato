import Workspace from '../../Workspace.jsx'
import engine from '../../engines/performance.js'
const runtime = { engine, ui: {} }
export default function App(props) { return <Workspace {...props} initialFormat="performance-depuis" runtime={runtime} /> }
