// First meaningful error line of a failed browser check, escaped for a GitHub annotation.
export function firstError(stderr) {
  const lines = stderr.split('\n').map(line => line.trim()).filter(Boolean)
  const line = lines.find(l => /(Error|assert|Assertion|expected|✗|FAIL)/i.test(l) && !/^at\s/.test(l) && !/node:internal|triggerUncaughtException/.test(l)) ?? lines.at(-1) ?? 'Échec sans message'
  return line.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A').slice(0, 300)
}
