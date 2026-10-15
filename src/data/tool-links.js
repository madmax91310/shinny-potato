import links from './tool-links.json' with {type:'json'}
export function getToolLinks(isin, exclude = '') {
  return (links[isin] ?? []).filter(link => link.kind !== exclude)
}
