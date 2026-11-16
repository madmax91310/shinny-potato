import { createHash } from 'node:crypto'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { parseSync } from 'vite'
import { withDataMarks } from './data-bytes-plugin.mjs'

// Resolve authored static choices at build time. Only the JSON is data: label
// functions and any future runtime behaviour remain ordinary budgeted code.
export function projectEditorialCalendar({ filename = fileURLToPath(new URL('../src/data/editorial-calendar.js', import.meta.url)) } = {}) {
  const virtual = '\0virtual:editorial-calendar-values.json'
  let values
  const data = withDataMarks({
    name: 'editorial-calendar-values',
    load(id) { if (id === virtual) return `export default ${JSON.stringify(values)};` },
  })
  return {
    name: 'project-editorial-calendar', enforce: 'pre',
    resolveId(id) { if (id === virtual) return virtual },
    load: data.load,
    handleHotUpdate(context) {
      if (context.file !== filename) return
      const module = context.server.moduleGraph.getModuleById(virtual)
      if (module) context.server.moduleGraph.invalidateModule(module)
    },
    async transform(source, id) {
      if (id.split('?')[0] !== filename) return
      const parsed = parseSync(filename, source)
      if (parsed.errors.length) throw Error('Invalid editorial calendar')
      const names = ['MIDDAY_SELECTIONS', 'EDITORIAL_WEEK']
      const initializers = parsed.program.body.flatMap(node => node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'VariableDeclaration'
        ? node.declaration.declarations.filter(decl => names.includes(decl.id?.name)).map(decl => ({ name: decl.id.name, init: decl.init })) : [])
      if (initializers.length !== names.length) throw Error('Missing static editorial calendar exports')
      const canonical = await import(`${pathToFileURL(filename).href}?projection=${createHash('sha256').update(source).digest('hex')}`)
      values = Object.fromEntries(names.map(name => [name, canonical[name]]))
      for (const { name, init } of initializers.sort((a, b) => b.init.start - a.init.start)) {
        source = source.slice(0, init.start) + `__calendarValues.${name}` + source.slice(init.end)
      }
      this.addWatchFile?.(filename)
      return { code: `import __calendarValues from ${JSON.stringify(virtual)};\n${source}`, map: null }
    },
  }
}
