// Restauration des liens directs GitHub Pages ; aucune redirection vers un domaine externe.
export function getRestoredRoute(href, baseUrl) {
  const current = new URL(href);
  const route = current.searchParams.get('__route');
  if (!route) return null;
  const target = new URL(route, current.origin);
  if (target.origin !== current.origin || !target.pathname.startsWith(baseUrl) || target.pathname === baseUrl) return null;
  return target.pathname + target.search + target.hash;
}
