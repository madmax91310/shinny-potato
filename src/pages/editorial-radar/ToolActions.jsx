import {Link} from 'react-router-dom'
import {validatedRadarActions} from '../../lib/radar-tool-contract.js'
export default function ToolActions({event}) {
  return validatedRadarActions(event).map(action=><p className="radar-tool-action" key={action.kind}><Link to={action.to} state={action.state}>{action.label} →</Link><small>{action.note}</small></p>)
}
