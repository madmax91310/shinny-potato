import { Link, useLocation } from 'react-router-dom'
import { TOOLS, TOOL_GROUPS } from '../tools'
import ToolIcon from './ToolIcon'

export default function PageHeader({ title, subtitle }) {
  const { pathname } = useLocation()
  const tool = TOOLS.find(item => item.to === pathname)
  const group = TOOL_GROUPS.find(item => item.paths.includes(pathname))
  return <header className="workspace-page-header">
    <div className="workspace-breadcrumb"><Link to="/">← Retour aux outils</Link>{group && <span>{group.title}</span>}</div>
    <div className="workspace-page-title">{tool && <span className="workspace-page-icon" aria-hidden="true"><ToolIcon to={tool.to} /></span>}<h1>{title}</h1></div>
    {subtitle && <p>{subtitle}</p>}
  </header>
}
