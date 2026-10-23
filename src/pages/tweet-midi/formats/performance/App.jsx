import {Link,useLocation} from 'react-router-dom'
import Workspace from '../../Workspace.jsx'
import engine from '../../engines/performance.js'
import {getPerformanceAssetId} from '../../../../data/performance-links.js'
const runtime = { engine, ui: {} }
export default function App(props) {
 const params=new URLSearchParams(useLocation().search)
 const requested=params.has('isin')?getPerformanceAssetId(params.get('isin')):params.get('asset')
 if((params.has('isin')||params.has('asset'))&&!engine.getSubjectsForFormat('performance-depuis').some(group=>group.items.some(item=>item.id===requested)))
  return <main><h1>Performance depuis</h1><p role="alert">Aucun calendrier annuel qualifié n’est disponible pour ce support. Aucun autre actif n’a été substitué.</p><Link to="/performance-depuis">Choisir un autre support</Link></main>
 return <Workspace {...props} initialFormat="performance-depuis" runtime={runtime} />
}
