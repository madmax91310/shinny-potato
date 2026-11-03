// The artifact contains the complete native feed and individual result contract.
// Compact only its JSON encoding; keep the monitor envelope and every field.
export const radarReportContent = feed => `${JSON.stringify(feed)}\n`
