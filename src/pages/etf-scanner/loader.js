import { readiness, validateSnapshot } from './lib.js'
export async function loadManifest(base, signal) {
  const response = await fetch(`${base}data/scanner-holdings/manifest.json`, { cache: 'no-store', signal })
  if (!response.ok) throw new Error('Le suivi des compositions est momentanément indisponible.')
  const manifest = await response.json()
  if (manifest.schemaVersion !== 1 || !manifest.instruments || !manifest.policy) throw new Error('Le suivi des compositions est invalide.')
  return manifest
}
export async function loadSnapshot(base, isin, entry, policy, signal) {
  const reason = readiness(entry, policy)
  if (reason) throw new Error(reason)
  if (entry.file !== `${isin}.json` || !/^[a-f0-9]{64}$/.test(entry.fileSha256 ?? '')) throw new Error('Référence de composition invalide.')
  const response = await fetch(`${base}data/scanner-holdings/${entry.file}`, { cache: 'no-store', signal })
  if (!response.ok) throw new Error('Composition indisponible au téléchargement.')
  const bytes = await response.arrayBuffer()
  if (!globalThis.crypto?.subtle) throw new Error('La vérification des compositions nécessite une connexion sécurisée.')
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(v => v.toString(16).padStart(2, '0')).join('')
  if (hash !== entry.fileSha256) throw new Error('La composition a changé pendant sa publication. Actualise les données.')
  return validateSnapshot(JSON.parse(new TextDecoder().decode(bytes)), isin, entry)
}
