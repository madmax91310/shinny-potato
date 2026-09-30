import { getDataProvenanceReport, formatDataProvenanceReport } from './data-provenance-report.mjs';
const report = getDataProvenanceReport();
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
else {
  console.log(formatDataProvenanceReport(report));
  for (const [label, entries] of Object.entries(report)) for (const entry of entries) {
    console.log(`  ${label} · ${entry.id} · ${entry.key ?? entry.field.label}`);
  }
}
