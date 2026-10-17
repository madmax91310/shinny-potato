// Records, for every emitted chunk, the rendered (pre-minification) bytes of its code
// modules and of its data modules. audit-route-bundles.mjs applies its regression budgets
// to code only: collectors legitimately add data every month, which must never fail the
// build of unchanged code. Both figures share the pre-minification unit; they are not file
// sizes. Data modules are JSON imports plus every module generated or rewritten by a data
// projection plugin wrapped with withDataMarks().
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { automationPaths, classify } from './classify-deploy-scope.mjs'

export const DATA_BYTES_FILE = '.vite/data-bytes.json'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const AUTOMATION_PATHS = automationPaths()
const projected = new Set()
const normalise = id => String(id).replace(/^\0/, '').split('?')[0]

export function isDataModule(id) {
  const file = normalise(id)
  // Files written by collectors (such as inflation-monthly.js) are data whatever their extension.
  return file.endsWith('.json') || projected.has(file) || classify([path.relative(ROOT, file).replaceAll('\\', '/')], AUTOMATION_PATHS).dataOnly
}

// Marks the modules a projection plugin loads or rewrites, without changing its output.
export function withDataMarks(plugin) {
  for (const name of ['load', 'transform']) {
    const hook = plugin[name]
    if (!hook) continue
    const handler = typeof hook === 'function' ? hook : hook.handler
    const marked = async function (...args) {
      const result = await handler.apply(this, args)
      const code = typeof result === 'string' ? result : result?.code
      const id = name === 'load' ? args[0] : args[1]
      if (code != null) projected.add(normalise(typeof id === 'string' ? id : id?.id))
      return result
    }
    plugin[name] = typeof hook === 'function' ? marked : { ...hook, handler: marked }
  }
  return plugin
}

export function dataBytesReport() {
  return {
    name: 'data-bytes-report',
    apply: 'build',
    generateBundle(_options, bundle) {
      const report = {}
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') continue
        const sizes = { code: 0, data: 0 }
        for (const [id, module] of Object.entries(output.modules ?? {})) sizes[isDataModule(id) ? 'data' : 'code'] += module.renderedLength ?? 0
        report[output.fileName] = sizes
      }
      this.emitFile({ type: 'asset', fileName: DATA_BYTES_FILE, source: JSON.stringify(report, null, 2) + '\n' })
    },
  }
}
