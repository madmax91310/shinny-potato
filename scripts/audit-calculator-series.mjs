import { spawnSync } from 'node:child_process';
// Immutable captures remain replayable even when providers revise adjusted prices.
const result = spawnSync(process.execPath, ['scripts/audit-calculator-series-archive.mjs'], { stdio: 'inherit', env: { ...process.env, MONTHLY_ARCHIVE_AUDIT: '1' } });
if (result.status !== 0) process.exit(result.status ?? 1);
await import('./audit-automated-monthly.mjs');
