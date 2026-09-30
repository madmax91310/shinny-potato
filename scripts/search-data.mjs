import { searchData, exportDataRecord } from '../src/data/catalog.js';
const args = process.argv.slice(2);
const type = args.find((x) => x.startsWith('--type='))?.slice(7) ?? 'all';
const records = searchData(args.filter((x) => !x.startsWith('--')).join(' '), type);
if (args.includes('--json')) console.log(`[${records.map(exportDataRecord).join(',')}]`);
else for (const record of records) {
  console.log(`${record.type} · ${record.id} · ${record.name}`);
  console.log(`  Outils : ${record.consumers.map((c) => c.tool).join(', ') || 'aucun recensé'}`);
  for (const f of record.fields) console.log(`  ${f.label} · ${f.registry} · photographie ${f.metadata.asOf ?? 'inconnue'} · contrôle ${f.metadata.checkedAt ?? 'inconnu'} · ${f.metadata.currency ?? 'devise non documentée'} · ${f.metadata.sourceUrls.join(', ') || (f.metadata.sourceStatus === 'archive-unverifiable' ? 'archive non recertifiable, exclue des consommateurs' : 'manque actif de source')}`);
}
