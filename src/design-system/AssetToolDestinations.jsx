import { Link } from 'react-router-dom'
import { getToolLinks } from '../data/tool-links.js'
export default function AssetToolDestinations({ isin, exclude }) {
  const links = getToolLinks(isin, exclude)
  if (!links.length) return <p>Ce support n’a pas encore d’autre utilisation disponible.</p>
  return <ul>{links.map(link => <li key={link.href}><Link to={link.href}>
    {link.kind === 'comparison' ? 'Comparatif · ' : link.kind === 'duel' ? 'Duel · ' : ''}{link.label}
  </Link></li>)}</ul>
}
