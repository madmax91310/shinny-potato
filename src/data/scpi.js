import observations from './automated-scpi.json' with { type: 'json' }

// Shared observations: the publication tool and data library read the same records.
export const SCPI = observations.records
