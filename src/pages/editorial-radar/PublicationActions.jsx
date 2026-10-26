import DraftEditor from './DraftEditor.jsx'
import ToolActions from './ToolActions.jsx'
export default function PublicationActions({event,material,facts}) {
  return <><ToolActions event={event}/><DraftEditor event={{...event,draftMaterial:material,draftFacts:facts}}/></>
}
