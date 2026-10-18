// First meaningful error line of a failed browser check, escaped for a GitHub annotation.
export function firstError(stderr, stdout = '') {
  // Tools report their own failures on stdout (« [ÉCHEC] … », « premier contrôle en échec — … »).
  const reported = stdout.split('\n').map(line => line.trim()).filter(line => /\[ÉCHEC\]|premier contrôle en échec/.test(line))
  if (reported.length) return reported.slice(0, 2).join(' · ').replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A').slice(0, 300)
  const lines = stderr.split('\n').map(line => line.trim()).filter(Boolean)
  const line = lines.find(l => /(Error|assert|Assertion|expected|✗|FAIL)/i.test(l) && !/^at\s/.test(l) && !/node:internal|triggerUncaughtException/.test(l)) ?? lines.at(-1) ?? 'Échec sans message'
  return line.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A').slice(0, 300)
}
