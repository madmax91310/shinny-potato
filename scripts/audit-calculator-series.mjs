import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
// Immutable captures remain replayable even when providers revise adjusted prices.
const archiveBitcoin=JSON.parse(readFileSync('scripts/source-snapshots/calculator-monthly-2026-10-02.json')).records.bitcoin.points;
const archiveGold=JSON.parse(readFileSync('scripts/source-snapshots/calculator-worldbank-gold-2026-10-03.json')).points;
const result = spawnSync(process.execPath, ['scripts/audit-calculator-series-archive.mjs'], { stdio: 'inherit', env: { ...process.env, MONTHLY_ARCHIVE_AUDIT: '1', MONTHLY_ARCHIVE_SERIES: JSON.stringify({ bitcoin:archiveBitcoin, or:archiveGold }) } });
if (result.status !== 0) process.exit(result.status ?? 1);
await import('./audit-automated-monthly.mjs');

await import('./audit-bitcoin-automated.mjs');
